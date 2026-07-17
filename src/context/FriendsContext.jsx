import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "../services/firebase.js";
import { useAuth } from "./AuthContext.jsx";

const FriendsContext = createContext(null);

/**
 * Real friend system backed by Firestore:
 *  - users/{uid}                       profile doc (so people can be found by email)
 *  - users/{uid}/friends/{friendUid}   accepted friends (written on both sides)
 *  - users/{uid}/friendRequests/{fromUid}  incoming requests
 *  - users/{uid}/sentRequests/{toUid}      outgoing requests (mirror, for UI state)
 *
 * Any signed-in account can look another up by email, send a request, and
 * once accepted both accounts see each other under "friends".
 */
export function FriendsProvider({ children }) {
  const { user, isSignedIn } = useAuth();
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friendSessions, setFriendSessions] = useState({});
  const [error, setError] = useState(null);

  // Keep this account's profile doc current so other accounts can find it by email.
  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user) return;
    const ref = doc(db, "users", user.uid);
    setDoc(
      ref,
      {
        uid: user.uid,
        displayName: user.displayName || user.email || "MusicLocke user",
        email: user.email || null,
        emailLower: (user.email || "").toLowerCase(),
        photoURL: user.photoURL || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, [isSignedIn, user]);

  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user) {
      setFriends([]);
      return undefined;
    }
    const ref = collection(db, "users", user.uid, "friends");
    return onSnapshot(ref, (snap) => setFriends(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isSignedIn, user]);

  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user) {
      setIncomingRequests([]);
      return undefined;
    }
    const ref = collection(db, "users", user.uid, "friendRequests");
    return onSnapshot(ref, (snap) => setIncomingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isSignedIn, user]);

  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user) {
      setOutgoingRequests([]);
      return undefined;
    }
    const ref = collection(db, "users", user.uid, "sentRequests");
    return onSnapshot(ref, (snap) => setOutgoingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isSignedIn, user]);

  // Watch every friend's live session doc so the UI can show what they're
  // playing right now and offer a real "Listen Along".
  useEffect(() => {
    if (!hasFirebaseConfig() || !isSignedIn || !user || friends.length === 0) {
      setFriendSessions({});
      return undefined;
    }
    const unsubscribers = friends.map((f) =>
      onSnapshot(doc(db, "users", f.id, "session", "live"), (snap) => {
        setFriendSessions((prev) => ({ ...prev, [f.id]: snap.exists() ? snap.data() : null }));
      })
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [isSignedIn, user, friends]);

  const clearError = useCallback(() => setError(null), []);

  const findUserByEmail = useCallback(async (email) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !hasFirebaseConfig()) return null;
    const q = query(collection(db, "users"), where("emailLower", "==", trimmed));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const found = snap.docs[0];
    return { id: found.id, ...found.data() };
  }, []);

  const sendFriendRequest = useCallback(
    async (email) => {
      setError(null);
      if (!user) return;
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return;
      if (trimmed === (user.email || "").toLowerCase()) {
        setError("That's your own account.");
        return;
      }
      const target = await findUserByEmail(trimmed);
      if (!target) {
        setError("No MusicLocke account found with that email.");
        return;
      }
      if (friends.some((f) => f.id === target.id)) {
        setError("You're already friends.");
        return;
      }
      if (outgoingRequests.some((r) => r.id === target.id)) {
        setError("Request already sent.");
        return;
      }
      const me = {
        uid: user.uid,
        displayName: user.displayName || user.email,
        email: user.email,
        photoURL: user.photoURL || null,
      };
      await setDoc(doc(db, "users", target.id, "friendRequests", user.uid), {
        ...me,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "users", user.uid, "sentRequests", target.id), {
        uid: target.id,
        displayName: target.displayName,
        email: target.email,
        photoURL: target.photoURL || null,
        createdAt: serverTimestamp(),
      });
    },
    [user, friends, outgoingRequests, findUserByEmail]
  );

  const cancelRequest = useCallback(
    async (targetUid) => {
      if (!user) return;
      await deleteDoc(doc(db, "users", targetUid, "friendRequests", user.uid));
      await deleteDoc(doc(db, "users", user.uid, "sentRequests", targetUid));
    },
    [user]
  );

  const acceptRequest = useCallback(
    async (fromUid) => {
      if (!user) return;
      const reqSnap = await getDoc(doc(db, "users", user.uid, "friendRequests", fromUid));
      if (!reqSnap.exists()) return;
      const requester = reqSnap.data();
      const me = {
        uid: user.uid,
        displayName: user.displayName || user.email,
        email: user.email,
        photoURL: user.photoURL || null,
      };
      await setDoc(doc(db, "users", user.uid, "friends", fromUid), { ...requester, since: serverTimestamp() });
      await setDoc(doc(db, "users", fromUid, "friends", user.uid), { ...me, since: serverTimestamp() });
      await deleteDoc(doc(db, "users", user.uid, "friendRequests", fromUid));
      await deleteDoc(doc(db, "users", fromUid, "sentRequests", user.uid));
    },
    [user]
  );

  const declineRequest = useCallback(
    async (fromUid) => {
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid, "friendRequests", fromUid));
      await deleteDoc(doc(db, "users", fromUid, "sentRequests", user.uid));
    },
    [user]
  );

  const removeFriend = useCallback(
    async (friendUid) => {
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid, "friends", friendUid));
      await deleteDoc(doc(db, "users", friendUid, "friends", user.uid));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      friends,
      incomingRequests,
      outgoingRequests,
      friendSessions,
      error,
      clearError,
      sendFriendRequest,
      cancelRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
    }),
    [
      friends,
      incomingRequests,
      outgoingRequests,
      friendSessions,
      error,
      clearError,
      sendFriendRequest,
      cancelRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
    ]
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends must be used within a FriendsProvider");
  return ctx;
}
