import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { MOCK_TRACKS, MOCK_REACTIONS } from "../data/mockTracks.js";
import { db, hasFirebaseConfig } from "../services/firebase.js";
import { loadYouTubeIframeApi } from "../services/youtubePlayer.js";
import { getThisDeviceId, guessDeviceLabel } from "../services/deviceId.js";
import { useAuth } from "./AuthContext.jsx";

const PlaybackContext = createContext(null);

// No account (or Firebase not configured) means there's nothing to sync
// against, so the SoundMap just represents this one real browser/device —
// no placeholder rooms. Signed-in accounts start with zero devices and get
// prompted to add each real device as they sign in on it.
function localOnlyZone(deviceId) {
  return [
    {
      id: "local-this-device",
      label: guessDeviceLabel(),
      kind: "this-device",
      deviceId,
      volume: 75,
      muted: false,
      x: 50,
      y: 50,
    },
  ];
}

function trackPayload(t) {
  if (!t) return null;
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    thumbnail: t.thumbnail,
    videoId: t.videoId ?? null,
    source: t.source ?? null,
    duration: t.duration ?? null,
  };
}

export function PlaybackProvider({ children }) {
  const { user, isSignedIn } = useAuth();
  const thisDeviceId = useMemo(() => getThisDeviceId(), []);

  const [track, setTrack] = useState(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // seconds
  const [masterVolume, setMasterVolume] = useState(75);
  const [zones, setZones] = useState(() => localOnlyZone(getThisDeviceId()));
  const [devicesSynced, setDevicesSynced] = useState(false);
  const [needsDeviceName, setNeedsDeviceName] = useState(false);
  const [reactions, setReactions] = useState(MOCK_REACTIONS);
  const [linerNotesOpen, setLinerNotesOpen] = useState(false);
  // Listen Along: mirrors a friend's real live session (read-only) instead
  // of joining a fake mock "room".
  const [listenAlongFriendId, setListenAlongFriendId] = useState(null);
  const [listenAlongFriendName, setListenAlongFriendName] = useState(null);
  const tickRef = useRef(null);

  // ---- YouTube IFrame player (real playback for youtube-sourced tracks) ----
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const ytPollRef = useRef(null);

  // Guards so playback synced in from *other* devices doesn't get echoed
  // straight back to Firestore as if this device originated it, and so a
  // remote track change can carry its start position into the loader effect.
  const applyingRemoteRef = useRef(false);
  const pendingSeekRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !mountRef.current || playerRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        height: "0",
        width: "0",
        playerVars: { playsinline: 1, controls: 0 },
        events: {
          onReady: () => {
            playerReadyRef.current = true;
            playerRef.current.setVolume(masterVolume);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) setIsPlaying(false);
            if (event.data === YT.PlayerState.PLAYING) setIsPlaying(true);
            if (event.data === YT.PlayerState.PAUSED) setIsPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isYouTubeTrack = useCallback((t) => Boolean(t && t.source === "youtube" && t.videoId), []);

  // Load whatever track is selected into the hidden YouTube player. When the
  // track changed because another device pushed it to us, pendingSeekRef
  // carries the position we should jump to instead of starting from 0.
  useEffect(() => {
    if (!playerReadyRef.current || !playerRef.current) return;
    if (isYouTubeTrack(track)) {
      const startSeconds = pendingSeekRef.current ?? 0;
      pendingSeekRef.current = null;
      playerRef.current.loadVideoById({ videoId: track.videoId, startSeconds });
      if (applyingRemoteRef.current && !isPlaying) {
        // loadVideoById always starts playing — pause right back if the
        // device that drove this change was paused.
        setTimeout(() => playerRef.current?.pauseVideo?.(), 300);
      }
    } else {
      playerRef.current.stopVideo?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // Poll real playback time from the YouTube player so the seek bar reflects
  // actual audio position, and backfill duration once the player knows it
  // (the YouTube search API doesn't return duration up front).
  useEffect(() => {
    if (!isYouTubeTrack(track) || !isPlaying) return undefined;
    ytPollRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || !playerReadyRef.current) return;
      const current = player.getCurrentTime?.() ?? 0;
      setProgress(current);
      const dur = player.getDuration?.() ?? 0;
      if (dur > 0) {
        setTrack((prev) => (prev && prev.duration !== dur ? { ...prev, duration: dur } : prev));
      }
    }, 500);
    return () => clearInterval(ytPollRef.current);
  }, [isPlaying, track?.id, isYouTubeTrack]);

  // Keep the hidden player's volume matched to the master volume slider.
  useEffect(() => {
    if (playerReadyRef.current && playerRef.current?.setVolume) {
      playerRef.current.setVolume(masterVolume);
    }
  }, [masterVolume]);

  // ---- Devices / SoundMap zones ----
  // When signed in with Firebase configured, devices live in Firestore under
  // users/{uid}/devices and sync in real time to every session signed into
  // the same account. Otherwise, devices are local-only for this session.
  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user) {
      setZones(localOnlyZone(thisDeviceId));
      setDevicesSynced(false);
      setNeedsDeviceName(false);
      return undefined;
    }
    const devicesRef = collection(db, "users", user.uid, "devices");
    const unsubscribe = onSnapshot(devicesRef, (snapshot) => {
      if (snapshot.empty) {
        // No fake placeholder devices — a brand-new account starts with an
        // empty SoundMap and gets prompted to add the real device it's on.
        setZones([]);
        setDevicesSynced(true);
        setNeedsDeviceName(true);
        return;
      }
      const nextZones = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setZones(nextZones);
      setDevicesSynced(true);
      // Prompt to name-and-add THIS browser/device to the SoundMap the first
      // time we see it signed in without a matching device entry yet.
      const alreadyRegistered = nextZones.some((z) => z.deviceId === thisDeviceId);
      setNeedsDeviceName(!alreadyRegistered);
    });
    return unsubscribe;
  }, [isSignedIn, user, thisDeviceId]);

  const registerThisDevice = useCallback(
    async (label) => {
      const trimmed = (label || "").trim();
      if (!trimmed || !user) return;
      const devicesRef = collection(db, "users", user.uid, "devices");
      await addDoc(devicesRef, {
        label: trimmed,
        kind: "this-device",
        deviceId: thisDeviceId,
        volume: 70,
        muted: false,
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70,
        createdAt: serverTimestamp(),
      });
      setNeedsDeviceName(false);
    },
    [user, thisDeviceId]
  );

  const dismissDeviceNamePrompt = useCallback(() => setNeedsDeviceName(false), []);

  const setZoneVolume = useCallback(
    (zoneId, volume) => {
      const muted = volume === 0;
      if (devicesSynced && user) {
        updateDoc(doc(db, "users", user.uid, "devices", zoneId), { volume, muted });
        return;
      }
      setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, volume, muted } : z)));
    },
    [devicesSynced, user]
  );

  const toggleZoneMute = useCallback(
    (zoneId) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;
      if (devicesSynced && user) {
        updateDoc(doc(db, "users", user.uid, "devices", zoneId), { muted: !zone.muted });
        return;
      }
      setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, muted: !z.muted } : z)));
    },
    [zones, devicesSynced, user]
  );

  const renameZone = useCallback(
    (zoneId, label) => {
      const trimmed = (label || "").trim();
      if (!trimmed) return;
      if (devicesSynced && user) {
        updateDoc(doc(db, "users", user.uid, "devices", zoneId), { label: trimmed });
        return;
      }
      setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, label: trimmed } : z)));
    },
    [devicesSynced, user]
  );

  const moveZone = useCallback(
    (zoneId, x, y) => {
      if (devicesSynced && user) {
        updateDoc(doc(db, "users", user.uid, "devices", zoneId), { x, y });
        return;
      }
      setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, x, y } : z)));
    },
    [devicesSynced, user]
  );

  const addDevice = useCallback(
    async ({ label, kind }) => {
      const newZone = {
        label,
        kind,
        volume: 70,
        muted: false,
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70,
      };
      if (devicesSynced && user) {
        const devicesRef = collection(db, "users", user.uid, "devices");
        await addDoc(devicesRef, { ...newZone, createdAt: serverTimestamp() });
        return;
      }
      setZones((prev) => [...prev, { id: `local-${Date.now()}`, ...newZone }]);
    },
    [devicesSynced, user]
  );

  const removeDevice = useCallback(
    (zoneId) => {
      if (devicesSynced && user) {
        deleteDoc(doc(db, "users", user.uid, "devices", zoneId));
        return;
      }
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    },
    [devicesSynced, user]
  );

  // Master volume scales every zone proportionally relative to a 100-point scale.
  const updateMasterVolume = useCallback((value) => {
    setMasterVolume(value);
  }, []);

  const effectiveZoneVolume = useCallback(
    (zone) => {
      if (zone.muted) return 0;
      return Math.round((zone.volume * masterVolume) / 100);
    },
    [masterVolume]
  );

  // ---- Cross-device playback session (same account, same music, same time) ----
  // Every signed-in session with Firebase configured writes what it's doing
  // to users/{uid}/session/live, tagged with which device wrote it. Every
  // other signed-in session listens and mirrors track/play-state/position,
  // estimating drift from updatedAtMs so a device that joins mid-song lands
  // roughly in the right spot instead of restarting it.
  const pushSession = useCallback(
    (overrides = {}) => {
      if (!devicesSynced || !user || listenAlongFriendId) return;
      const sessionRef = doc(db, "users", user.uid, "session", "live");
      setDoc(
        sessionRef,
        {
          track: trackPayload(track),
          isPlaying,
          progress,
          updatedAtMs: Date.now(),
          originDeviceId: thisDeviceId,
          ...overrides,
        },
        { merge: true }
      );
    },
    [devicesSynced, user, track, isPlaying, progress, thisDeviceId, listenAlongFriendId]
  );

  useEffect(() => {
    // Pause mirroring our own account's session while passively listening
    // along to a friend, so the two don't fight over the hidden player.
    if (!devicesSynced || !user || listenAlongFriendId) return undefined;
    const sessionRef = doc(db, "users", user.uid, "session", "live");
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      // Ignore echoes of writes this same device just made.
      if (!data || data.originDeviceId === thisDeviceId) return;

      applyingRemoteRef.current = true;
      const remoteTrack = data.track ?? null;
      const trackChanged = (remoteTrack?.id ?? null) !== (track?.id ?? null);
      const elapsed = data.isPlaying ? Math.max(0, (Date.now() - (data.updatedAtMs ?? Date.now())) / 1000) : 0;
      const estimated = Math.max(0, (data.progress ?? 0) + elapsed);

      if (trackChanged) {
        pendingSeekRef.current = estimated;
        setTrack(remoteTrack);
      } else if (playerReadyRef.current && playerRef.current && isYouTubeTrack(remoteTrack)) {
        playerRef.current.seekTo(estimated, true);
        if (data.isPlaying) playerRef.current.playVideo?.();
        else playerRef.current.pauseVideo?.();
      }
      setProgress(estimated);
      setIsPlaying(Boolean(data.isPlaying));

      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 500);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devicesSynced, user, thisDeviceId, isYouTubeTrack, listenAlongFriendId]);

  const playTrack = useCallback(
    (nextTrack) => {
      setTrack(nextTrack);
      setProgress(0);
      setIsPlaying(true);
      if (!applyingRemoteRef.current) {
        pushSession({ track: trackPayload(nextTrack), isPlaying: true, progress: 0 });
      }
    },
    [pushSession]
  );

  const togglePlay = useCallback(() => {
    const nextPlaying = !isPlaying;
    if (isYouTubeTrack(track) && playerReadyRef.current && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } else {
      setIsPlaying(nextPlaying);
    }
    if (!applyingRemoteRef.current) {
      pushSession({ isPlaying: nextPlaying, progress });
    }
  }, [track, isPlaying, isYouTubeTrack, pushSession, progress]);

  const seekTo = useCallback(
    (seconds) => {
      const clamped = Math.max(0, Math.min(seconds, track?.duration ?? seconds));
      if (isYouTubeTrack(track) && playerReadyRef.current && playerRef.current) {
        playerRef.current.seekTo(clamped, true);
      }
      setProgress(clamped);
      if (!applyingRemoteRef.current) {
        pushSession({ progress: clamped });
      }
    },
    [track, isYouTubeTrack, pushSession]
  );

  // Periodic drift-correction heartbeat while playing, so a device that
  // joins the group mid-track (rather than at the moment play/pause/seek
  // fired) still gets a reasonably fresh position.
  useEffect(() => {
    if (!devicesSynced || !user || !isPlaying || applyingRemoteRef.current) return undefined;
    const interval = setInterval(() => pushSession(), 5000);
    return () => clearInterval(interval);
  }, [devicesSynced, user, isPlaying, pushSession]);

  const addReaction = useCallback((reaction) => {
    setReactions((prev) => [...prev, { id: `r-${Date.now()}`, ...reaction }]);
  }, []);

  const listenAlong = useCallback((friendUid, friendName) => {
    if (!friendUid) return;
    setListenAlongFriendId(friendUid);
    setListenAlongFriendName(friendName ?? null);
  }, []);

  const stopListenAlong = useCallback(() => {
    setListenAlongFriendId(null);
    setListenAlongFriendName(null);
  }, []);

  // While listening along, mirror the friend's real users/{uid}/session/live
  // doc — read-only, nothing is written back to it or to our own session.
  useEffect(() => {
    if (!hasFirebaseConfig() || !listenAlongFriendId) return undefined;
    const sessionRef = doc(db, "users", listenAlongFriendId, "session", "live");
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      applyingRemoteRef.current = true;
      const remoteTrack = data.track ?? null;
      const trackChanged = (remoteTrack?.id ?? null) !== (track?.id ?? null);
      const elapsed = data.isPlaying ? Math.max(0, (Date.now() - (data.updatedAtMs ?? Date.now())) / 1000) : 0;
      const estimated = Math.max(0, (data.progress ?? 0) + elapsed);

      if (trackChanged) {
        pendingSeekRef.current = estimated;
        setTrack(remoteTrack);
      } else if (playerReadyRef.current && playerRef.current && isYouTubeTrack(remoteTrack)) {
        playerRef.current.seekTo(estimated, true);
        if (data.isPlaying) playerRef.current.playVideo?.();
        else playerRef.current.pauseVideo?.();
      }
      setProgress(estimated);
      setIsPlaying(Boolean(data.isPlaying));

      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 500);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenAlongFriendId, isYouTubeTrack]);

  // Simulated progress ticker — only used for local mock tracks; YouTube
  // tracks get their real position polled from the hidden player above.
  useEffect(() => {
    if (isYouTubeTrack(track)) return undefined;
    if (!isPlaying || !track?.duration) return undefined;
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= track.duration) {
          setIsPlaying(false);
          return track.duration;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [isPlaying, track, isYouTubeTrack]);

  const value = useMemo(
    () => ({
      track,
      isPlaying,
      progress,
      masterVolume,
      zones,
      devicesSynced,
      thisDeviceId,
      needsDeviceName,
      listenAlongFriendId,
      listenAlongFriendName,
      reactions,
      linerNotesOpen,
      playTrack,
      togglePlay,
      seekTo,
      setZoneVolume,
      toggleZoneMute,
      renameZone,
      moveZone,
      addDevice,
      removeDevice,
      registerThisDevice,
      dismissDeviceNamePrompt,
      updateMasterVolume,
      effectiveZoneVolume,
      addReaction,
      listenAlong,
      stopListenAlong,
      setLinerNotesOpen,
    }),
    [
      track,
      isPlaying,
      progress,
      masterVolume,
      zones,
      devicesSynced,
      thisDeviceId,
      needsDeviceName,
      listenAlongFriendId,
      listenAlongFriendName,
      reactions,
      linerNotesOpen,
      playTrack,
      togglePlay,
      seekTo,
      setZoneVolume,
      toggleZoneMute,
      renameZone,
      moveZone,
      addDevice,
      removeDevice,
      registerThisDevice,
      dismissDeviceNamePrompt,
      updateMasterVolume,
      effectiveZoneVolume,
      addReaction,
      listenAlong,
      stopListenAlong,
    ]
  );

  return (
    <PlaybackContext.Provider value={value}>
      {/* Hidden mount point for the real YouTube audio player */}
      <div ref={mountRef} style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} />
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within a PlaybackProvider");
  return ctx;
}
