const REFERRAL_STORAGE_KEY = 'basti_pending_referral_uid';

/** Reads a ?ref=UID query param from the current URL, if present, and
 *  stores it in localStorage — called once, as early as possible in
 *  the app's lifecycle, since the player might not be signed in yet
 *  when they first open a referral link. Safe to call on every load;
 *  it simply does nothing if there's no ?ref= param this time. */
export function capturePendingReferral(): void {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
  }
}

/** Returns the stored referral code (the referrer's uid), if any. */
export function getPendingReferralUid(): string | null {
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/** Clears the stored referral code — called once it's been used (a
 *  referral record was successfully created), so it isn't mistakenly
 *  reused on a future sign-in with a different account on the same
 *  device/browser. */
export function clearPendingReferral(): void {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
