import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, hasFirebaseConfig } from "../services/firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasFirebaseConfig());
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setAuthLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setAuthError("Firebase isn't configured yet — add your project keys to .env to enable sign-in.");
      return;
    }
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(error.message ?? "Sign-in failed.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!hasFirebaseConfig()) return;
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: Boolean(user),
        authLoading,
        authError,
        firebaseConfigured: hasFirebaseConfig(),
        signIn,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
