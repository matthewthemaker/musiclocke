import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True once all required Firebase env vars are present. */
export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
  );
}

let app = null;
let authInstance = null;
let dbInstance = null;
let googleProviderInstance = null;

if (hasFirebaseConfig()) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  googleProviderInstance = new GoogleAuthProvider();
}

// These are null when Firebase isn't configured — callers must check
// hasFirebaseConfig() first (AuthContext does this for the whole app).
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = googleProviderInstance;
