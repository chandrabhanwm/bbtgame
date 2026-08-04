import { Business, PlayerStats } from '../types';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, getCountFromServer, where } from 'firebase/firestore';

/**
 * The complete shape of a player's save data — every piece of state that
 * currently lives scattered across 7 separate localStorage keys in two
 * different files (App.tsx and DistrictContext.tsx), unified into one
 * coherent object.
 *
 * This is Phase 2's actual foundation: a single SaveService interface
 * that today reads/writes localStorage, and later — once a real Firebase
 * project exists — reads/writes Firestore instead, keyed by the
 * authenticated player's UID. Every component that needs to load or save
 * game state goes through this service, not localStorage directly, so
 * that swap touches one file when it happens, not a rewrite across the
 * whole app.
 */
export interface GameSave {
  businessesByDistrict: Record<string, Business[]>;
  stats: PlayerStats;
  avatarEmoji: string;
  playerName: string;
  currentDistrictId: string;
  unlockedDistricts: Record<string, boolean>;
  rewardedDistricts: Record<string, boolean>;
  /** When this save was actually written — real wall-clock time on the
   *  device that saved it. Not currently used for conflict resolution
   *  (this pass deliberately only restores when there's no local save
   *  at all, avoiding that question entirely), but it's the foundation
   *  for a future two-way sync that needs to compare "which save is
   *  newer." */
  savedAt: number;
  /** Which economy/schema version this save was written under. A save
   *  from before a version bump (or missing this field entirely, since
   *  it didn't exist before this was added) is treated as fundamentally
   *  incompatible rather than partially restored — see
   *  CURRENT_SAVE_VERSION in App.tsx for the full reasoning. */
  saveVersion?: number;
}

const STORAGE_KEY = 'basti_game_save_v1';

/**
 * A real leaderboard entry — deliberately minimal. This lives in its own
 * Firestore collection (`leaderboard/{uid}`), separate from the full
 * GameSave, specifically because the leaderboard needs to be readable
 * by every signed-in player to work at all, while the full save (which
 * includes exact business counts, levels, etc.) has no reason to be
 * publicly exposed. Only what's needed to actually show and rank a
 * player lives here.
 */
export interface LeaderboardEntry {
  playerName: string;
  avatarEmoji: string;
  netWorth: number;
  /** The new primary ranking metric for the "Overall" tab — how
   *  efficiently a player is actually playing, not just how much they've
   *  spent or how long they've played. Replaces netWorth as the sort key
   *  specifically because net worth doesn't distinguish a player who's
   *  mastered synergies from one who's rushed through spending the same
   *  money badly; income/min does. netWorth itself is kept here
   *  unchanged, still synced, just no longer the leaderboard's sort key —
   *  Portfolio's own net worth display is entirely separate from this
   *  collection and is untouched by this change. */
  profitPerMin: number;
  level: number;
  updatedAt: number;
  /** This week's contest points — action-based, resets to 0 client-side
   *  the first time a player opens the app in a new week. See
   *  useWeeklyContest for the actual scoring logic. */
  weeklyPoints: number;
  /** The remaining fields below are the per-player analytics set
   *  requested directly — viewable as a clean table in the Firestore
   *  console (or the Cloud Console's table view), rather than relying
   *  on Firebase Analytics, which is built for aggregate trends across
   *  all players, not a per-player breakdown. `updatedAt` above already
   *  serves as "Last Seen", since it's rewritten every sync cycle. */
  currentDistrictId: string;
  totalPlayTimeSeconds: number;
  adsWatchedCount: number;
  businessesBoughtCount: number;
  poolClaimsCount: number;
}

/**
 * SaveService — the one place game state actually gets persisted.
 *
 * TODAY: backed by a single localStorage key (all 7 pieces of save data
 * combined into one JSON blob, rather than 7 separate keys — simpler to
 * reason about, and a more natural shape for what Firestore will
 * eventually store as one document per player anyway).
 *
 * LATER, once real Firebase credentials exist: this same interface
 * (load/save/subscribe) gets a second implementation backed by
 * Firestore — reading/writing a document at `users/{uid}/save`, using
 * the UID from Firebase Anonymous Auth. Every caller in the app stays
 * exactly the same; only the inside of these three functions changes.
 */
export const SaveService = {
  /** Loads the current save, or null if none exists yet (a genuinely
   *  new player). Synchronous today (localStorage); will become async
   *  once backed by a real network call to Firestore — callers should
   *  already treat this as if it might be async, to avoid a second
   *  refactor later. */
  async load(): Promise<GameSave | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GameSave;
    } catch {
      return null;
    }
  },

  /** Persists the full save. Today, one synchronous localStorage write;
   *  later, a Firestore document write scoped to the authenticated
   *  player's UID. Kept as one call rather than 7 separate ones so a
   *  future network-backed implementation can batch this into a single
   *  request instead of 7 round-trips. */
  async save(data: GameSave): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — silently no-op for now, matching
      // how localStorage failures have always been handled elsewhere in
      // this app. Worth real error surfacing once this is network-backed
      // and a failed save actually means lost progress, not just a
      // same-device write that'll likely succeed next tick anyway.
    }
  },

  /** One-time migration from the old scattered-key format (7 separate
   *  localStorage entries) into the new unified shape. Called once on
   *  load if the new unified key doesn't exist yet but old keys do —
   *  this is what lets every existing player's progress survive this
   *  refactor instead of silently resetting them to a fresh save. */
  migrateFromLegacyKeys(): GameSave | null {
    const businessesRaw = localStorage.getItem('basti_businesses_by_district');
    const statsRaw = localStorage.getItem('basti_stats');
    if (!businessesRaw || !statsRaw) return null; // nothing meaningful to migrate

    try {
      return {
        businessesByDistrict: JSON.parse(businessesRaw),
        stats: JSON.parse(statsRaw),
        avatarEmoji: localStorage.getItem('basti_avatar') || '😎',
        playerName: localStorage.getItem('basti_player_name') || 'SmartTycoon',
        currentDistrictId: localStorage.getItem('basti_current_district') || 'badeban',
        unlockedDistricts: JSON.parse(localStorage.getItem('basti_unlocked_districts') || '{}'),
        rewardedDistricts: JSON.parse(localStorage.getItem('basti_rewarded_districts') || '{}'),
        savedAt: Date.now(),
      };
    } catch {
      return null;
    }
  },

  /** Real Firestore-backed cloud save, scoped to the player's anonymous
   *  UID — one document per player at `saves/{uid}`. This is genuinely
   *  new, live infrastructure (a real Firebase project now exists), but
   *  it's called opportunistically, in the background, from App.tsx —
   *  never something the app's own instant local boot waits on. If this
   *  fails for any reason (Anonymous Auth or Firestore not yet enabled
   *  in the console, no network, a security-rules issue), the game
   *  keeps working from local storage exactly as it always has; this
   *  method's caller is expected to swallow errors, not surface them as
   *  if local play were broken. */
  async cloudSave(uid: string, data: GameSave): Promise<{ ok: boolean; error: string | null }> {
    try {
      await setDoc(doc(db, 'saves', uid), data);
      return { ok: true, error: null };
    } catch (err: any) {
      return { ok: false, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
    }
  },

  /** Real Firestore read for the same document. Returns null on any
   *  failure (including "no save exists yet for this UID," which is the
   *  normal case for a genuinely new player) — same "never breaks local
   *  play" contract as cloudSave above. */
  async cloudLoad(uid: string): Promise<GameSave | null> {
    try {
      const snap = await getDoc(doc(db, 'saves', uid));
      if (!snap.exists()) return null;
      return snap.data() as GameSave;
    } catch {
      return null;
    }
  },

  /** Writes the player's own leaderboard entry — only ever their own
   *  document (enforced both here and, critically, by Firestore security
   *  rules, since a client-side check alone can't stop a modified
   *  client from writing anyone's entry). Called periodically, same
   *  pattern as cloudSave. */
  async updateLeaderboardEntry(uid: string, entry: LeaderboardEntry): Promise<{ ok: boolean; error: string | null }> {
    try {
      await setDoc(doc(db, 'leaderboard', uid), entry);
      return { ok: true, error: null };
    } catch (err: any) {
      return { ok: false, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
    }
  },

  /** Claims this device as the account's one active session — called
   *  once when a device signs in (or reopens an existing session). Each
   *  call overwrites whatever session ID was there before, since
   *  claiming is unconditional: the newest device to open the app
   *  always wins the slot, and every other device signed into the same
   *  account will notice via checkSession and sign itself out. */
  async claimSession(uid: string, sessionId: string): Promise<{ ok: boolean; error: string | null }> {
    try {
      await setDoc(doc(db, 'sessions', uid), { sessionId, claimedAt: Date.now() });
      return { ok: true, error: null };
    } catch (err: any) {
      return { ok: false, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
    }
  },

  /** Returns the account's currently-claimed session ID, or null if
   *  none exists yet or the read fails — callers should treat a failed
   *  read as "can't confirm a conflict," not as grounds to sign anyone
   *  out, since a real network hiccup shouldn't kick a legitimate,
   *  single-device player off their own game. */
  async checkSession(uid: string): Promise<string | null> {
    try {
      const snap = await getDoc(doc(db, 'sessions', uid));
      if (!snap.exists()) return null;
      return (snap.data().sessionId as string) ?? null;
    } catch {
      return null;
    }
  },

  /** Fetches the real top N players, ordered by income/min — a genuine
   *  measure of how well someone is actually playing, replacing the
   *  earlier net-worth-based ranking. */
  async fetchTopLeaderboard(limitCount: number = 50): Promise<Array<LeaderboardEntry & { uid: string }>> {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('profitPerMin', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as LeaderboardEntry) }));
    } catch {
      return [];
    }
  },

  /** A player's real rank — computed as "how many players have strictly
   *  higher income/min than me, plus one." Uses Firestore's count
   *  aggregation rather than downloading every single player's document
   *  just to count them, which wouldn't scale past a small number of
   *  players. Returns null if the count can't be determined (e.g. the
   *  security rules aren't set up to allow it yet) — callers should
   *  treat that as "rank unknown," not crash or show a wrong number. */
  async fetchMyRank(myProfitPerMin: number): Promise<number | null> {
    try {
      const q = query(collection(db, 'leaderboard'), where('profitPerMin', '>', myProfitPerMin));
      const snap = await getCountFromServer(q);
      return snap.data().count + 1;
    } catch {
      return null;
    }
  },

  /** Same pattern as fetchTopLeaderboard, ordered by this week's contest
   *  points instead of net worth. */
  async fetchTopWeeklyContest(limitCount: number = 20): Promise<Array<LeaderboardEntry & { uid: string }>> {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('weeklyPoints', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as LeaderboardEntry) }));
    } catch {
      return [];
    }
  },

  /** Same pattern as fetchMyRank, for weekly contest points. */
  async fetchMyWeeklyRank(myWeeklyPoints: number): Promise<number | null> {
    try {
      const q = query(collection(db, 'leaderboard'), where('weeklyPoints', '>', myWeeklyPoints));
      const snap = await getCountFromServer(q);
      return snap.data().count + 1;
    } catch {
      return null;
    }
  },

  /** Creates the referral record the moment a genuinely new account
   *  signs up via someone's referral link — keyed by the NEW user's own
   *  uid (both to naturally prevent one person being "referred" twice,
   *  and because Firestore's own rule requires request.auth.uid to
   *  match the document being created). The referrer isn't credited
   *  yet at this point — that happens separately, the next time THEY
   *  open the app (see fetchUnclaimedReferrals below), since the new
   *  signup's own device has no permission to write directly into the
   *  referrer's account. */
  async createReferralRecord(newUserUid: string, referrerUid: string): Promise<{ ok: boolean; error: string | null }> {
    try {
      await setDoc(doc(db, 'referrals', newUserUid), { referrerUid, newUserUid, claimed: false, createdAt: Date.now() });
      return { ok: true, error: null };
    } catch (err: any) {
      return { ok: false, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
    }
  },

  /** Fetches this player's own unclaimed incoming referrals — people
   *  who signed up using their link, not yet credited. Called once per
   *  app open; the caller credits each one (up to the daily cap) and
   *  then calls markReferralClaimed for each. */
  async fetchUnclaimedReferrals(referrerUid: string): Promise<Array<{ id: string; referrerUid: string; newUserUid: string; claimed: boolean; createdAt: number }>> {
    try {
      const q = query(collection(db, 'referrals'), where('referrerUid', '==', referrerUid), where('claimed', '==', false));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch {
      return [];
    }
  },

  /** Marks a specific referral as claimed, once the referrer has been
   *  credited for it — prevents it from being credited again on a
   *  future app open. */
  async markReferralClaimed(referralId: string): Promise<{ ok: boolean; error: string | null }> {
    try {
      await updateDoc(doc(db, 'referrals', referralId), { claimed: true });
      return { ok: true, error: null };
    } catch (err: any) {
      return { ok: false, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
    }
  },
};
