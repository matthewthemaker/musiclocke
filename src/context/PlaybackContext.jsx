import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { MOCK_TRACKS, MOCK_REACTIONS, FRIEND_ROOMS } from "../data/mockTracks.js";
import { db, hasFirebaseConfig } from "../services/firebase.js";
import { loadYouTubeIframeApi } from "../services/youtubePlayer.js";
import { useAuth } from "./AuthContext.jsx";

const PlaybackContext = createContext(null);

const DEFAULT_ZONES = [
  { id: "bedroom", label: "Bedroom", volume: 62, muted: false, x: 18, y: 22 },
  { id: "living-room", label: "Living Room", volume: 80, muted: false, x: 58, y: 18 },
  { id: "kitchen", label: "Kitchen", volume: 45, muted: false, x: 30, y: 62 },
  { id: "patio", label: "Patio", volume: 70, muted: false, x: 72, y: 66 },
];

export function PlaybackProvider({ children }) {
  const { user, isSignedIn } = useAuth();

  const [track, setTrack] = useState(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // seconds
  const [masterVolume, setMasterVolume] = useState(75);
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [devicesSynced, setDevicesSynced] = useState(false);
  const [multiListenActive, setMultiListenActive] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [reactions, setReactions] = useState(MOCK_REACTIONS);
  const [rooms] = useState(FRIEND_ROOMS);
  const [linerNotesOpen, setLinerNotesOpen] = useState(false);
  const tickRef = useRef(null);

  // ---- YouTube IFrame player (real playback for youtube-sourced tracks) ----
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const ytPollRef = useRef(null);

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

  // Load whatever track is selected into the hidden YouTube player.
  useEffect(() => {
    if (!playerReadyRef.current || !playerRef.current) return;
    if (isYouTubeTrack(track)) {
      playerRef.current.loadVideoById(track.videoId);
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

  const playTrack = useCallback((nextTrack) => {
    setTrack(nextTrack);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (isYouTubeTrack(track) && playerReadyRef.current && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      return;
    }
    setIsPlaying((p) => !p);
  }, [track, isPlaying, isYouTubeTrack]);

  const seekTo = useCallback(
    (seconds) => {
      const clamped = Math.max(0, Math.min(seconds, track?.duration ?? seconds));
      if (isYouTubeTrack(track) && playerReadyRef.current && playerRef.current) {
        playerRef.current.seekTo(clamped, true);
      }
      setProgress(clamped);
    },
    [track, isYouTubeTrack]
  );

  // ---- Devices / SoundMap zones ----
  // When signed in with Firebase configured, devices live in Firestore under
  // users/{uid}/devices and sync in real time to every session signed into
  // the same account. Otherwise, devices are local-only for this session.
  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user) {
      setZones(DEFAULT_ZONES);
      setDevicesSynced(false);
      return undefined;
    }
    const devicesRef = collection(db, "users", user.uid, "devices");
    const unsubscribe = onSnapshot(devicesRef, (snapshot) => {
      if (snapshot.empty) {
        // Seed the account with the default zones on first sign-in.
        DEFAULT_ZONES.forEach((z) => {
          addDoc(devicesRef, { ...z, kind: "default", createdAt: serverTimestamp() });
        });
        return;
      }
      const nextZones = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setZones(nextZones);
      setDevicesSynced(true);
    });
    return unsubscribe;
  }, [isSignedIn, user]);

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

  const addReaction = useCallback((reaction) => {
    setReactions((prev) => [...prev, { id: `r-${Date.now()}`, ...reaction }]);
  }, []);

  const joinRoom = useCallback(
    (roomId) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      setActiveRoomId(roomId);
      setMultiListenActive(true);
      const roomTrack = MOCK_TRACKS.find((t) => t.id === room.trackId);
      if (roomTrack) playTrack(roomTrack);
    },
    [rooms, playTrack]
  );

  const leaveRoom = useCallback(() => {
    setActiveRoomId(null);
    setMultiListenActive(false);
  }, []);

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
      multiListenActive,
      activeRoomId,
      reactions,
      rooms,
      linerNotesOpen,
      playTrack,
      togglePlay,
      seekTo,
      setZoneVolume,
      toggleZoneMute,
      moveZone,
      addDevice,
      removeDevice,
      updateMasterVolume,
      effectiveZoneVolume,
      addReaction,
      joinRoom,
      leaveRoom,
      setLinerNotesOpen,
      setMultiListenActive,
    }),
    [
      track,
      isPlaying,
      progress,
      masterVolume,
      zones,
      devicesSynced,
      multiListenActive,
      activeRoomId,
      reactions,
      rooms,
      linerNotesOpen,
      playTrack,
      togglePlay,
      seekTo,
      setZoneVolume,
      toggleZoneMute,
      moveZone,
      addDevice,
      removeDevice,
      updateMasterVolume,
      effectiveZoneVolume,
      addReaction,
      joinRoom,
      leaveRoom,
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
