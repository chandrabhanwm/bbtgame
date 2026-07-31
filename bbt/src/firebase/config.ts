import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, type User,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';

// Your real project config, from the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyChqR52s3koYvEAiSvyMv3iWSNTrvRanks",
  authDomain: "test-88602.firebaseapp.com",
  projectId: "test-88602",
  storageBucket: "test-88602.firebasestorage.app",
  messagingSenderId: "322606756304",
  appId: "1:322606756304:web:f8e564aecfd8289d6209d5"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// Google Analytics for Firebase — free, built-in tracking for users,
// visits, and retention, viewed directly in the Firebase console
// (Analytics tab), no custom dashboard needed. Requires the "Link" step
// under Project Settings → Integrations → Google Analytics in the
// Firebase console — analytics silently does nothing until that's done,
// rather than erroring, so this fails safe either way.
//
// analyticsReady is the actual initialization promise, awaited by every
// call to logAnalyticsEvent below — not just fired once and forgotten.
// Without awaiting it, any event logged before isSupported() resolves
// (which can genuinely happen for the very first action right after
// page load) would be silently dropped, since the instance wouldn't
// exist yet at that exact moment.
const analyticsReady: Promise<Analytics | null> = isSupported().then((supported) =>
  supported ? getAnalytics(firebaseApp) : null
);

/** Logs a custom event to Firebase Analytics — currently used for
 *  ad-watch tracking, the one metric Analytics doesn't capture
 *  automatically. Awaits the real initialization promise every time,
 *  so it never silently misses an event due to init timing — only
 *  genuinely skips logging if Analytics isn't supported at all in this
 *  environment. */
export async function logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
  const analytics = await analyticsReady;
  if (analytics) logEvent(analytics, eventName, params);
}

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
 *  there's no silent fallback to quietly continue on.
 *
 *  Uses signInWithPopup as the default path everywhere, including
 *  inside an installed standalone PWA. An earlier version of this
 *  function proactively used signInWithRedirect specifically for
 *  standalone PWAs, based on the general, well-documented concern that
 *  popups are unreliable in that context — but real-device testing
 *  showed the opposite here: the redirect path itself was silently
 *  failing (redirecting to Google and back with no error, no signed-in
 *  state) on both iOS and Android once installed as a PWA. This matches
 *  a separately documented Firebase issue affecting recent Safari/Chrome
 *  versions, where the reported working workaround is popup, not
 *  redirect. Falls back to redirect only if popup itself explicitly
 *  fails with a catchable "blocked" error — a real, different failure
 *  mode from the silent one above, and still worth covering. */
export async function signInWithGoogle(): Promise<{ uid: string | null; error: string | null }> {
  const provider = new GoogleAuthProvider();

  try {
    const cred = await signInWithPopup(auth, provider);
    return { uid: cred.user.uid, error: null };
  } catch (err: any) {
    // Popup blocked, closed, or otherwise failed to complete — fall
    // back to redirect rather than surface a dead-end error.
    const popupFailureCodes = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
    if (popupFailureCodes.includes(err.code)) {
      try {
        await signInWithRedirect(auth, provider);
        return { uid: null, error: null };
      } catch (redirectErr: any) {
        return { uid: null, error: `${redirectErr.code || 'unknown'}: ${redirectErr.message || String(redirectErr)}` };
      }
    }
    return { uid: null, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
  }
}

/** Checked once at app startup, alongside subscribeToAuthChanges —
 *  completes the sign-in flow after a redirect-based sign-in brings the
 *  player back to the app, and surfaces any error that happened during
 *  that redirect (the auth state listener alone would pick up a
 *  *successful* redirect sign-in either way, but this is what actually
 *  reports a failure back, and is Firebase's own recommended pattern
 *  for redirect-based auth). */
export async function checkRedirectResult(): Promise<{ error: string | null }> {
  try {
    await getRedirectResult(auth);
    return { error: null };
  } catch (err: any) {
    return { error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
  }
}

/** Signs the current player out — for a future "switch account" or
 *  "log out" option in Settings. Not wired into any UI yet, but the
 *  natural counterpart to a required-login model. */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
