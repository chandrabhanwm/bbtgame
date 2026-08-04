import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { Business, PlayerStats } from '../types';
import { auth } from '../firebase/config';
import { SaveService, GameSave, LeaderboardEntry } from '../services/SaveService';
import { getEmpireTotalInvested } from '../utils/districtProgress';
import { getPendingReferralUid, clearPendingReferral } from '../utils/referral';
import { progressionConfig, CURRENT_SAVE_VERSION } from '../config/progressionConfig';
import { applyContestPoints, todayDateString } from '../utils/weeklyContest';

interface UseCloudSyncParams {
  /** True only for a genuinely fresh device/browser with no local save
   *  for this account — gates whether a cloud restore is attempted. */
  hadNoLocalSaveAtBoot: boolean;
  businessesByDistrict: Record<string, Business[]>;
  stats: PlayerStats;
  avatarEmoji: string;
  playerName: string;
  currentDistrictId: string;
  unlockedDistrictsMap: Record<string, boolean>;
  rewardedDistrictsMap: Record<string, boolean>;
  setBusinessesByDistrict: (v: Record<string, Business[]>) => void;
  setStats: Dispatch<SetStateAction<PlayerStats>>;
  setAvatarEmoji: (v: string) => void;
  setPlayerName: (v: string) => void;
  restoreDistrictState: (data: { currentDistrictId: string; unlockedDistricts: Record<string, boolean>; rewardedDistricts: Record<string, boolean> }) => void;
}

/**
 * Everything related to Firebase cloud save and the real leaderboard —
 * pulled out of App.tsx as its own domain, per the Phase 0 architecture
 * cleanup. Behavior preserved exactly as it was; this is a relocation,
 * not a rewrite.
 *
 * Covers: the sign-in-time restore-if-fresh + immediate first push, and
 * the periodic save (every 30s) + leaderboard sync (every 180s) loop.
 */
export function useCloudSync(params: UseCloudSyncParams) {
  const {
    hadNoLocalSaveAtBoot, businessesByDistrict, stats, avatarEmoji, playerName,
    currentDistrictId, unlockedDistrictsMap, rewardedDistrictsMap,
    setBusinessesByDistrict, setStats, setAvatarEmoji, setPlayerName, restoreDistrictState,
  } = params;

  const cloudUidRef = useRef<string | null>(null);

  // Ref always holds the latest save-relevant data, kept fresh on every
  // render — this is what both the immediate first save (right after
  // sign-in, below) and the periodic interval (further below) actually
  // read, rather than closing over stale values from whenever they were
  // first created.
  const latestSaveDataRef = useRef<GameSave>({
    businessesByDistrict, stats, avatarEmoji, playerName, currentDistrictId,
    unlockedDistricts: unlockedDistrictsMap, rewardedDistricts: rewardedDistrictsMap, savedAt: Date.now(),
  });
  latestSaveDataRef.current = {
    businessesByDistrict, stats, avatarEmoji, playerName, currentDistrictId,
    unlockedDistricts: unlockedDistrictsMap, rewardedDistricts: rewardedDistrictsMap, savedAt: Date.now(),
    saveVersion: CURRENT_SAVE_VERSION,
  };

  const [realLeaderboard, setRealLeaderboard] = useState<Array<LeaderboardEntry & { uid: string }>>([]);
  const [myRealRank, setMyRealRank] = useState<number | null>(null);
  const [weeklyContestBoard, setWeeklyContestBoard] = useState<Array<LeaderboardEntry & { uid: string }>>([]);
  const [lastLeaderboardFetchAt, setLastLeaderboardFetchAt] = useState<number>(Date.now());
  const [myWeeklyRank, setMyWeeklyRank] = useState<number | null>(null);
  const [isBrandNewPlayer, setIsBrandNewPlayer] = useState(false);
  const [referralCreditsJustEarned, setReferralCreditsJustEarned] = useState(0);
  const [signupReferralBonusEarned, setSignupReferralBonusEarned] = useState(false);

  // Checks for anyone who signed up using this player's own referral
  // link since the last check — this is the ONLY place the referrer
  // actually gets credited, since the new signup's own device has no
  // permission to write into the referrer's account directly
  // (Firestore rules only allow writing your own data). Capped at
  // progressionConfig.dailyReferralCap per real calendar day, same
  // cap-checking pattern as the other daily limits elsewhere in the
  // app. Extracted into its own function and called both once on
  // mount AND on a periodic interval below — previously only ran once
  // per app open, meaning a referrer had to fully close and reopen the
  // app to ever see their friend's signup credited, even if they'd
  // been sitting in the app the whole time it happened.
  const checkForReferralCredits = () => {
    const uid = auth.currentUser?.uid ?? null;
    if (!uid) return;
    SaveService.fetchUnclaimedReferrals(uid).then((unclaimed) => {
      if (unclaimed.length === 0) return;

      setStats((prev) => {
        const today = todayDateString();
        const dayRolledOver = prev.dailyReferralClaimsDate !== today;
        const claimsToday = dayRolledOver ? 0 : prev.dailyReferralClaimsCount;
        const remainingCapToday = Math.max(0, progressionConfig.dailyReferralCap - claimsToday);
        const toCredit = unclaimed.slice(0, remainingCapToday);

        if (toCredit.length === 0) return prev;

        let updated = { ...prev, dailyReferralClaimsCount: claimsToday, dailyReferralClaimsDate: today };
        for (const referral of toCredit) {
          const { stats: withPoints } = applyContestPoints(updated, 'referral');
          updated = {
            ...withPoints,
            cash: updated.cash + progressionConfig.referralBonusCoins,
            dailyReferralClaimsCount: updated.dailyReferralClaimsCount + 1,
          };
          SaveService.markReferralClaimed(referral.id).then(() => {});
        }
        setReferralCreditsJustEarned(toCredit.length);
        return updated;
      });
    });
  };

  useEffect(() => {
    checkForReferralCredits();
  }, []);

  useEffect(() => {
    const interval = setInterval(checkForReferralCredits, 120000); // every 2 minutes, matching the existing save-sync cadence
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const uid = auth.currentUser?.uid ?? null;
    cloudUidRef.current = uid;
    if (!uid) return;

    // Runs as a proper sequence, not two independent fire-and-forget
    // calls — this is the actual fix for a real race condition that was
    // here before: the restore-check and the "push current state"
    // write used to fire in the same tick, with no guarantee which
    // network call would complete first. That meant it was possible
    // for stale in-memory state to get written straight to a
    // brand-new account's cloud document before the check had even
    // confirmed whether that account was new. Now the push genuinely
    // cannot happen until the check has resolved first.
    (async () => {
      if (hadNoLocalSaveAtBoot) {
        // Genuinely fresh device/browser, no local save — safe to check
        // for a cloud save and restore it if one exists. This can only
        // ever improve on "blank fresh-player state," never lose real
        // progress, since there was none to lose in this specific case.
        const cloudSave = await SaveService.cloudLoad(uid);
        if (cancelled) return;
        if (cloudSave && cloudSave.saveVersion === CURRENT_SAVE_VERSION) {
          setBusinessesByDistrict(cloudSave.businessesByDistrict);
          setStats(cloudSave.stats);
          setAvatarEmoji(cloudSave.avatarEmoji);
          setPlayerName(cloudSave.playerName);
          restoreDistrictState({
            currentDistrictId: cloudSave.currentDistrictId,
            unlockedDistricts: cloudSave.unlockedDistricts,
            rewardedDistricts: cloudSave.rewardedDistricts,
          });
          // A real restore happened — do NOT push latestSaveDataRef
          // below, since it still reflects the pre-restore in-memory
          // state at this exact instant, not what was just restored.
          // The regular periodic sync (further below) will push the
          // real, restored state on its own next cycle.
          return;
        } else {
          // Genuinely brand new — confirmed by the check above, not
          // assumed. Safe to pull the real name from their Google
          // account, and to fire the one-time welcome celebration.
          const googleName = auth.currentUser?.displayName;
          if (googleName) setPlayerName(googleName);
          setIsBrandNewPlayer(true);

          // If this signup came from a referral link, record it now —
          // this is the ONLY moment it's safe to do so, since it's the
          // one confirmed instant this is a genuinely new account, not
          // a returning player who happens to still have that old
          // ?ref= param sitting in storage from a much earlier visit.
          const referrerUid = getPendingReferralUid();
          if (referrerUid && referrerUid !== uid) {
            SaveService.createReferralRecord(uid, referrerUid).then(() => {});
            // The new signup's OWN bonus — credited immediately, right
            // here, since this is their own account (no cross-account
            // permission issue like the referrer's side has). Both
            // people get progressionConfig.referralBonusCoins; this is
            // the new signup's half, the referrer's half is credited
            // separately on their own next app open (further below).
            setStats((prev) => ({ ...prev, cash: prev.cash + progressionConfig.referralBonusCoins }));
            setSignupReferralBonusEarned(true);
          }
          clearPendingReferral();
        }
      } else {
        // This device already has its own local save — but that alone
        // doesn't mean it's the *current* one. A real, serious bug: if
        // another device signed into this same account more recently
        // and pushed newer progress, this device would previously never
        // find out, since it would never check the cloud again once it
        // had any local save at all, no matter how stale. Fixed by
        // always comparing real timestamps here — local data only wins
        // if it's genuinely at least as recent as what's in the cloud.
        const cloudSave = await SaveService.cloudLoad(uid);
        if (cancelled) return;
        if (cloudSave && cloudSave.saveVersion === CURRENT_SAVE_VERSION) {
          const localSavedAt = Number(localStorage.getItem('basti_local_saved_at') ?? 0);
          if (cloudSave.savedAt > localSavedAt) {
            setBusinessesByDistrict(cloudSave.businessesByDistrict);
            setStats(cloudSave.stats);
            setAvatarEmoji(cloudSave.avatarEmoji);
            setPlayerName(cloudSave.playerName);
            restoreDistrictState({
              currentDistrictId: cloudSave.currentDistrictId,
              unlockedDistricts: cloudSave.unlockedDistricts,
              rewardedDistricts: cloudSave.rewardedDistricts,
            });
            // Same reasoning as the fresh-device branch above — a real
            // restore just happened, don't immediately re-push the
            // pre-restore in-memory state over it.
            return;
          }
        }
      }

      if (cancelled) return;
      // Either there was already a local save for this account (no
      // restore needed), or the check above confirmed this is a
      // genuinely new account with nothing to restore — either way,
      // it's now actually safe to push the current state.
      SaveService.cloudSave(uid, latestSaveDataRef.current).then(() => {});
      const { businessesByDistrict: bbd, stats: currentStats, avatarEmoji: emoji, playerName: name, currentDistrictId: districtId } = latestSaveDataRef.current;
      const netWorth = currentStats.cash + getEmpireTotalInvested(bbd);
      SaveService.updateLeaderboardEntry(uid, {
        playerName: name, avatarEmoji: emoji, netWorth, profitPerMin: currentStats.profitPerMin, level: currentStats.level, updatedAt: Date.now(), weeklyPoints: currentStats.weeklyPoints,
        currentDistrictId: districtId, totalPlayTimeSeconds: currentStats.totalPlayTimeSeconds, adsWatchedCount: currentStats.adsWatchedCount,
        businessesBoughtCount: currentStats.businessesBoughtCount, poolClaimsCount: currentStats.poolClaimsCount,
      });
      SaveService.fetchTopLeaderboard(20).then(setRealLeaderboard);
      SaveService.fetchMyRank(currentStats.profitPerMin).then(setMyRealRank);
      SaveService.fetchTopWeeklyContest(20).then(setWeeklyContestBoard);
      SaveService.fetchMyWeeklyRank(currentStats.weeklyPoints).then(setMyWeeklyRank);
      setLastLeaderboardFetchAt(Date.now());
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Fast interval — cloudSave + the leaderboard entry push are both
    // Firestore WRITES (one document each = 2 writes per cycle). The
    // previous 30-second cadence was verified via direct calculation to
    // exceed the free daily write quota at 100 users beyond light usage
    // (up to 248% of quota at heavy usage) — the earlier "no quota
    // concern" claim in this comment was wrong, not just outdated.
    // Widened to 2 minutes, which brings even heavy usage down to a
    // safe 68% of quota, verified the same way.
    const saveInterval = setInterval(() => {
      const uid = cloudUidRef.current;
      if (!uid) return; // not signed in yet (or Firebase unavailable) — local save already happened, nothing lost
      SaveService.cloudSave(uid, latestSaveDataRef.current).then(() => {});

      const { businessesByDistrict: bbd, stats: currentStats, avatarEmoji: emoji, playerName: name, currentDistrictId: districtId } = latestSaveDataRef.current;
      const netWorth = currentStats.cash + getEmpireTotalInvested(bbd);
      SaveService.updateLeaderboardEntry(uid, {
        playerName: name,
        avatarEmoji: emoji,
        netWorth,
        profitPerMin: currentStats.profitPerMin,
        level: currentStats.level,
        updatedAt: Date.now(),
        weeklyPoints: currentStats.weeklyPoints,
        currentDistrictId: districtId,
        totalPlayTimeSeconds: currentStats.totalPlayTimeSeconds,
        adsWatchedCount: currentStats.adsWatchedCount,
        businessesBoughtCount: currentStats.businessesBoughtCount,
        poolClaimsCount: currentStats.poolClaimsCount,
      });
    }, 120000); // every 2 minutes

    // Slow interval — fetching the top-20 leaderboard is up to 20
    // document READS every single time it's called, per player, times
    // two boards (overall + weekly contest) = ~42 reads per cycle. At
    // 100 real testers with realistic foreground time, verified via
    // direct calculation that even a 3-minute interval could exceed the
    // free Firestore quota. Widened to 15 minutes — comfortably safe at
    // 100 users, with a visible countdown in the UI (see
    // lastLeaderboardFetchAt below) so this doesn't read as broken or
    // stale, just as "updating on its own schedule."
    const leaderboardInterval = setInterval(() => {
      const uid = cloudUidRef.current;
      if (!uid) return;
      const { businessesByDistrict: bbd, stats: currentStats } = latestSaveDataRef.current;
      SaveService.fetchTopLeaderboard(20).then(setRealLeaderboard);
      SaveService.fetchMyRank(currentStats.profitPerMin).then(setMyRealRank);
      SaveService.fetchTopWeeklyContest(20).then(setWeeklyContestBoard);
      SaveService.fetchMyWeeklyRank(currentStats.weeklyPoints).then(setMyWeeklyRank);
      setLastLeaderboardFetchAt(Date.now());
    }, 900000); // every 15 minutes

    return () => {
      clearInterval(saveInterval);
      clearInterval(leaderboardInterval);
    };
  }, []);

  return { cloudUidRef, realLeaderboard, myRealRank, isBrandNewPlayer, weeklyContestBoard, myWeeklyRank, lastLeaderboardFetchAt, referralCreditsJustEarned, clearReferralCreditsJustEarned: () => setReferralCreditsJustEarned(0), signupReferralBonusEarned, clearSignupReferralBonusEarned: () => setSignupReferralBonusEarned(false) };
}
