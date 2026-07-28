import { useEffect, useRef, useState } from 'react';
import { SaveService } from '../services/SaveService';

/**
 * Enforces "one active device at a time" per account — extracted as its
 * own hook since it's a genuinely separate concern from saving game
 * data. Firebase Auth itself has no built-in way to invalidate a
 * session on another device, so this is built directly on Firestore:
 * whichever device most recently claimed the session "wins" the slot,
 * and every other device signed into the same account will notice on
 * its next check and report a conflict, rather than silently keep
 * diverging in the background.
 *
 * Deliberately does NOT sign anyone out itself — it only reports
 * `wasKickedOut: true` once a conflict is detected, so the caller
 * (App.tsx) can show a clear, explanatory message before actually
 * calling signOutUser(). An involuntary sign-out with no explanation
 * reads as a bug; a message like "opened on another device" doesn't.
 */
export function useSessionEnforcement(uid: string | null) {
  const [wasKickedOut, setWasKickedOut] = useState(false);
  const mySessionIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    // Claim this device as the active session immediately on mount —
    // unconditional, since the newest device to open the app always
    // wins the slot. Any other device already open on this account
    // will notice on its own next periodic check, below.
    SaveService.claimSession(uid, mySessionIdRef.current);

    const interval = setInterval(async () => {
      const currentClaimed = await SaveService.checkSession(uid);
      if (cancelled) return;
      // null means "couldn't confirm" (no doc yet, or a network hiccup)
      // — never treat that as a conflict, only an explicit mismatch
      // against a real, present value counts.
      if (currentClaimed !== null && currentClaimed !== mySessionIdRef.current) {
        setWasKickedOut(true);
      }
    }, 30000); // same cadence as the save interval — this is a single, cheap document read

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [uid]);

  return { wasKickedOut };
}
