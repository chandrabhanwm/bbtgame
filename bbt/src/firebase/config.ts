import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, type User,
  GoogleAuthProvider, signInWithPopup, signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your real project config, from the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyB8c9xxp0LFxLLCi4tj7LQIq-enryFhzqA",
  authDomain: "bbtgame.firebaseapp.com",
  projectId: "bbtgame",
  storageBucket: "bbtgame.firebasestorage.app",
  messagingSenderId: "297331653172",
  appId: "1:297331653172:web:95b3a85d74323c1deda861"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/**
 * Required-login model — a deliberate product decision, not the original
 * silent-anonymous-start design. Every player must sign in with a real
 * Google account before playing at all. Anonymous Auth has been removed
 * from the Firebase console entirely, so there's no anonymous fallback
 * to fall back to — this is now a genuine gate, not an optional upgrade.
 */

/** Subscribes to real-time auth state — the top-level login gate uses
 *  this to know whether to show the login screen, a loading state, or
 *  the actual game. Returns an unsubscribe function. */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Opens the real Google sign-in popup. Returns the signed-in user's UID
 *  on success, or an error message on failure (popup blocked/closed, no
 *  network, etc.) — the login screen surfaces this directly, since
 *  there's no silent fallback to quietly continue on. */
export async function signInWithGoogle(): Promise<{ uid: string | null; error: string | null }> {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    return { uid: cred.user.uid, error: null };
  } catch (err: any) {
    return { uid: null, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
  }
}

/** Signs the current player out — for a future "switch account" or
 *  "log out" option in Settings. Not wired into any UI yet, but the
 *  natural counterpart to a required-login model. */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
