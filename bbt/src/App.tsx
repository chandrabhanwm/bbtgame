/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Lock } from 'lucide-react';
import { Business, PlayerStats, RewardCard } from './types';
import { Header } from './components/Header';
import { DailyRewardCards } from './components/DailyRewardCards';
import { ShareEarnCard } from './components/ShareEarnCard';
import { BusinessGridView } from './components/BusinessGridView';
import { FooterTipBar } from './components/FooterTipBar';
import { ShopDetailSheet } from './components/ShopDetailSheet';
import { BottomNavigation } from './components/BottomNavigation';
import { LeaderboardTab } from './components/LeaderboardTab';
import { CityMapScreen } from './components/citymap/CityMapScreen';
import { PortfolioScreen } from './components/PortfolioScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Confetti, CoinBurst, CoinFlight } from './components/FX';
import { DistrictSummaryCard } from './components/DistrictSummaryCard';
import { buildBusinessesForDistrict, districtEconomies, getDistrictTotalCost } from './data/districtBusinesses';
import { bastiCity, getDistrict } from './data/cityMapData';
import { DistrictProvider, useDistrict } from './context/DistrictContext';
import { getDistrictProgress, isDistrictCompleted, getDistrictCompletionReward, getEmpireTotalInvested } from './utils/districtProgress';
import { generateDailyGoal } from './utils/dailyGoal';
import { getLegacyIncomeMultiplier } from './utils/legacy';
import { subscribeToAuthChanges, auth, signOutUser, checkRedirectResult, logAnalyticsEvent } from './firebase/config';
import type { User } from 'firebase/auth';
import { LoginScreen } from './components/LoginScreen';
import { SimulatedAdModal } from './components/SimulatedAdModal';
import { SaveService } from './services/SaveService';
import { useCloudSync } from './hooks/useCloudSync';
import { useAchievementDetection } from './hooks/useAchievementDetection';
import { useClaimHandlers } from './hooks/useClaimHandlers';
import { useBusinessActions } from './hooks/useBusinessActions';
import { useNewsTicker } from './hooks/useNewsTicker';
import { useDistrictPreview } from './hooks/useDistrictPreview';
import { useAccountActions } from './hooks/useAccountActions';
import { useSessionEnforcement } from './hooks/useSessionEnforcement';
import { getCooldownRemainingSeconds, CLAIM_COOLDOWN_MS, formatCooldownClock } from './utils/cooldown';
import { applyContestPoints, todayDateString, localDateStringOf } from './utils/weeklyContest';
import { CountdownClock } from './components/CountdownClock';
import { progressionConfig, CURRENT_SAVE_VERSION } from './config/progressionConfig';
import { playClick, playLevelUp, playUnlock } from './utils/audio';
import { formatCash } from './utils/formatCash';

// Claim pool: caps at 4 hours' worth of income, whether the app was
// closed or just left idle without claiming.
// Previously the pool was capped at "profit × 4 hours" with no upper bound
// at all — verified via simulation to be a real, mathematically unbounded
// runaway risk once profit grows large enough (a single claim could hand
// over an arbitrarily huge sum). This fixed ceiling replaces that formula
// as the actual cap, applied consistently both to the live per-second
// tick and to the offline-elapsed-time recompute on load.
// Daily Income Boost: flat reward, gated to once per 24 hours.
// Daily Reward Cards: one reward tier per card, with ranges that never
// overlap — small < medium < rare's own floor < rare's jackpot — so a
// scratch always shows a real, visible progression, not three similar-
// looking numbers. Rare's non-jackpot floor sits clearly above medium's
// ceiling specifically so it still feels distinct even without hitting
// the jackpot. Which position gets which tier is reshuffled every reset,
// so the "exciting" card isn't always sitting in the same slot.

function generateRewardCard(tier: 'small' | 'medium' | 'rare'): RewardCard {
  let value: number;
  if (tier === 'small') {
    value = 200 + Math.floor(Math.random() * 201); // ₹200–₹400
  } else if (tier === 'medium') {
    value = 700 + Math.floor(Math.random() * 401); // ₹700–₹1,100
  } else {
    const isJackpot = Math.random() < 0.12; // 12% chance
    value = isJackpot
      ? 3500 + Math.floor(Math.random() * 2501) // ₹3,500–₹6,000
      : 1400 + Math.floor(Math.random() * 501);   // ₹1,400–₹1,900 — clearly above medium's ₹700–1,100 even without the jackpot
  }
  return { scratched: false, value, claimed: false, tier };
}

function generateFreshRewardCards(): RewardCard[] {
  const cards = [generateRewardCard('small'), generateRewardCard('medium'), generateRewardCard('rare')];
  // Fisher-Yates shuffle — which position holds which tier changes every reset.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Seeds a fresh businesses-by-district map from scratch — every district
 *  with economy data gets its own independent Business[] the moment the
 *  app first loads, so switching to any of them (once unlocked) just works
 *  with no special-casing. */
function seedAllDistricts(): Record<string, Business[]> {
  const seeded: Record<string, Business[]> = {};
  districtEconomies.forEach((econ) => {
    seeded[econ.districtId] = buildBusinessesForDistrict(econ.districtId);
  });
  return seeded;
}

function AppInner({ currentUid }: { currentUid: string }) {
  const { currentDistrictId, setCurrentDistrict, isDistrictUnlocked, unlockDistrict, isDistrictRewarded, markDistrictRewarded, resetDistricts, restoreDistrictState, unlockedDistrictsMap, rewardedDistrictsMap } = useDistrict();
  const currentDistrictMeta = getDistrict(bastiCity, currentDistrictId);
  // The pool tick's own useEffect only runs once (empty deps), so it needs
  // a ref rather than reading currentDistrictId directly, or it would
  // permanently use whichever district was current when the app first
  // mounted, not wherever the player has since navigated to.
  const currentDistrictIdRef = useRef(currentDistrictId);
  useEffect(() => { currentDistrictIdRef.current = currentDistrictId; }, [currentDistrictId]);

  // THE ACTUAL FIX for cross-account data leakage: local save data is
  // only ever trusted if it was recorded as belonging to THIS signed-in
  // account. Without this, signing out and a different Google account
  // signing in on the same device would silently find the previous
  // account's leftover local data and treat it as valid — showing the
  // wrong name, wrong cash, wrong everything, and never even checking
  // whether a cloud save exists for the new account. A mismatch (or no
  // owner recorded at all, from saves made before this fix existed) is
  // treated exactly like "no local save," triggering the same safe
  // fresh-player-or-cloud-restore path used for a genuinely new device.
  const localSaveBelongsToThisUser = localStorage.getItem('basti_owner_uid') === currentUid;

  // A deliberate, one-time economy reset — every business's costs and
  // income were fundamentally re-architected (fixed 6-level tables with
  // cross-business synergies, replacing the old uncapped, continuous
  // growth formula) and rescaled by 1.9x. A save from before this
  // version bump has levels and prices that don't correspond to
  // anything in the new system at all, so it's treated exactly like "no
  // local save exists" — the same safe fresh-start path already used
  // for a genuinely new device. Bumping CURRENT_SAVE_VERSION forces a
  // full reset for every existing local save automatically, without
  // needing to reach every individual device by hand — the version
  // simply won't match, so old data is ignored rather than restored.
  const localSaveVersionCurrent = localStorage.getItem('basti_save_version') === String(CURRENT_SAVE_VERSION);
  const shouldTrustLocalSave = localSaveBelongsToThisUser && localSaveVersionCurrent;

  // STATE DEFINITIONS
  const [businessesByDistrict, setBusinessesByDistrict] = useState<Record<string, Business[]>>(() => {
    const seeded = seedAllDistricts();

    // Cosmetic fields (name, emoji, description, etc.) are the game's
    // own definition of a business, not something a player's actions
    // produce — they should always reflect the latest data, the same
    // way a district's own name always does. Without this, a rebrand
    // (like Basti → CoralBay) would permanently freeze an existing
    // save's business names at whatever they were the moment that
    // player first saved, since the raw object-spread merge below
    // otherwise lets old saved data silently override new definitions
    // forever. Real progress (level, cost, status) still comes from
    // the save, exactly as before — only the definition fields refresh.
    const refreshCosmeticFields = (savedBusinesses: Business[], seededBusinesses: Business[]): Business[] =>
      savedBusinesses.map((saved) => {
        const fresh = seededBusinesses.find((b) => b.id === saved.id);
        if (!fresh) return saved; // no matching definition — keep as-is rather than drop it
        return { ...saved, name: fresh.name, emoji: fresh.emoji, gradient: fresh.gradient, description: fresh.description, themeColor: fresh.themeColor };
      });

    const saved = shouldTrustLocalSave ? localStorage.getItem('basti_businesses_by_district') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...seeded, ...parsed };
        for (const districtId of Object.keys(parsed)) {
          if (seeded[districtId]) {
            merged[districtId] = refreshCosmeticFields(parsed[districtId], seeded[districtId]);
          }
        }
        return merged;
      } catch {
        return seeded;
      }
    }
    // Migrate a pre-District-Engine save (single Badeban array) if present
    // — only for this same account, same reasoning as above.
    const legacy = shouldTrustLocalSave ? localStorage.getItem('basti_businesses') : null;
    if (legacy) {
      try {
        const parsedLegacy = JSON.parse(legacy);
        return { ...seeded, badeban: refreshCosmeticFields(parsedLegacy, seeded['badeban'] ?? []) };
      } catch {
        return seeded;
      }
    }
    return seeded;
  });

  // The rest of the app only ever reads/writes "businesses" for whichever
  // district is currently loaded — same names, same call signatures as
  // before, so handleUpgrade below doesn't need to change at all. Only
  // what these two names point to has changed.
  const businesses = businessesByDistrict[currentDistrictId] ?? [];
  const setBusinesses = (updater: Business[] | ((prev: Business[]) => Business[])) => {
    setBusinessesByDistrict((prevMap) => {
      const prevForDistrict = prevMap[currentDistrictId] ?? [];
      const next = typeof updater === 'function' ? (updater as (p: Business[]) => Business[])(prevForDistrict) : updater;
      return { ...prevMap, [currentDistrictId]: next };
    });
  };

  // Captured once, at the very first mount — true only for a genuinely
  // fresh device/browser with no local save at all. This is what gates
  // cloud restore below: if this is false, restore never runs, so
  // there's zero risk of a cloud save overwriting real local progress.
  const hadNoLocalSaveAtBootRef = useRef(!shouldTrustLocalSave);

  const [stats, setStats] = useState<PlayerStats>(() => {
    const freshDefaults: PlayerStats = {
      cash: 25000, // "Moment Zero" — enough for a couple of small early purchases, not a pre-filled empire. Scaled down alongside the rest of the economy's 1.9x reduction — ₹50,000 against the new, cheaper costs was quietly buying 3 businesses immediately instead of the originally-intended "about one."
      profitPerMin: 0, // Nothing owned yet — Tea Stall is no longer pre-owned, per Moment Zero
      // rank removed — replaced by a real, separately-fetched leaderboard rank
      level: 1,
      xp: 0,
      nextLevelXp: 120,
      poolCash: 0,
      lastPoolClaimAt: Date.now(),
      rewardCards: generateFreshRewardCards(),
      lastCardsResetAt: Date.now(),
      hasMadeFirstPurchase: false,
      hasMadeFirstUpgrade: false,
      dailyGoal: generateDailyGoal(currentDistrictId, businessesByDistrict),
      unlockedAchievementIds: [],
      legacyCount: 0,
      legacyPoints: 0,
      profitTapHintShownCount: 0,
      lastProfitDoubleClaimAt: 0,
      lastCardClaimAt: 0,
      weeklyPoints: 0,
      weeklyPointsWeekStart: 0,
      dailyUpgradePointsCount: 0,
      dailyUpgradePointsDate: '',
      dailyDoubleClaimCount: 0,
      dailyDoubleClaimDate: '',
      totalPlayTimeSeconds: 0,
      adsWatchedCount: 0,
      businessesBoughtCount: 0,
      poolClaimsCount: 0,
      hasClaimedSincePoolCooldown: false,
      pointsSeasonId: progressionConfig.pointsSeasonId,
      dailyReferralClaimsCount: 0,
      dailyReferralClaimsDate: '',
    };

    const saved = shouldTrustLocalSave ? localStorage.getItem('basti_stats') : null;
    if (saved) {
      // Wrapped in try/catch, matching the same safe-fallback pattern
      // already used for the other three localStorage reads (unlocked
      // map, rewarded map, businesses) — previously this one specific
      // parse had no protection, so a corrupted value here (a partial
      // write during a crash, a full storage quota, manual tampering)
      // would throw during the very first render and — with no error
      // boundary in place — take the whole app down to a blank screen,
      // every time it reopened, with no way to recover.
      try {
        const parsed: PlayerStats = JSON.parse(saved);
        // Recompute poolCash fresh from real elapsed time since last claim,
        // rather than trusting whatever was last saved — this is what makes
        // offline accrual work (the pool keeps growing while the app is
        // closed) and avoids any drift between the stored number and what
        // elapsed time actually justifies. Capped at 4 hours' worth.
        const lastClaimAt = parsed.lastPoolClaimAt ?? Date.now();
        const elapsedMinutes = Math.max(0, (Date.now() - lastClaimAt) / 60000);
        const cappedMinutes = Math.min(elapsedMinutes, progressionConfig.poolCapMinutes);

        // Reward cards: reset once the LOCAL calendar day has changed
        // since the last reset — not a rolling 24-hour window from
        // whenever the player happened to last open the app, which
        // drifted further from real midnight every time they were a
        // few hours late one day. Any scratched-but-unclaimed value
        // from the old set simply expires, same one-rule-everywhere
        // principle as the pool cap above.
        const lastCardsReset = parsed.lastCardsResetAt ?? Date.now();
        const cardsExpired = localDateStringOf(lastCardsReset) !== todayDateString();
        const rewardCards = cardsExpired || !parsed.rewardCards
          ? generateFreshRewardCards()
          : parsed.rewardCards;

        // Daily goal shares the exact same reset moment as the reward cards
        // above — deliberately not a second timer, per the plan.
        const dailyGoal = cardsExpired || !parsed.dailyGoal
          ? generateDailyGoal(currentDistrictId, businessesByDistrict)
          : parsed.dailyGoal;

        return {
          ...parsed,
          poolCash: Math.min(getDistrictTotalCost(currentDistrictId) * progressionConfig.poolCeilingRatio, Math.round((parsed.profitPerMin ?? 0) * cappedMinutes)),
          lastPoolClaimAt: lastClaimAt,
          rewardCards,
          lastCardsResetAt: cardsExpired || !parsed.rewardCards ? Date.now() : lastCardsReset,
          dailyGoal,
          // Existing saves predate Moment Zero and, by definition, already
          // have real progress — default both to true so a returning
          // player never sees the first-purchase/first-upgrade celebration
          // fire retroactively. Only a genuinely fresh player (the object
          // below) starts with these false.
          hasMadeFirstPurchase: parsed.hasMadeFirstPurchase ?? true,
          hasMadeFirstUpgrade: parsed.hasMadeFirstUpgrade ?? true,
          unlockedAchievementIds: parsed.unlockedAchievementIds ?? [],
          legacyCount: parsed.legacyCount ?? 0,
          legacyPoints: parsed.legacyPoints ?? 0,
          profitTapHintShownCount: parsed.profitTapHintShownCount ?? 0,
          lastProfitDoubleClaimAt: parsed.lastProfitDoubleClaimAt ?? 0,
          lastCardClaimAt: parsed.lastCardClaimAt ?? 0,
          weeklyPoints: parsed.weeklyPoints ?? 0,
          weeklyPointsWeekStart: parsed.weeklyPointsWeekStart ?? 0,
          dailyUpgradePointsCount: parsed.dailyUpgradePointsCount ?? 0,
          dailyUpgradePointsDate: parsed.dailyUpgradePointsDate ?? '',
          dailyDoubleClaimCount: parsed.dailyDoubleClaimCount ?? 0,
          dailyDoubleClaimDate: parsed.dailyDoubleClaimDate ?? '',
          totalPlayTimeSeconds: parsed.totalPlayTimeSeconds ?? 0,
          adsWatchedCount: parsed.adsWatchedCount ?? 0,
          businessesBoughtCount: parsed.businessesBoughtCount ?? 0,
          poolClaimsCount: parsed.poolClaimsCount ?? 0,
          hasClaimedSincePoolCooldown: parsed.hasClaimedSincePoolCooldown ?? false,
          pointsSeasonId: parsed.pointsSeasonId ?? (progressionConfig.pointsSeasonId - 1),
          dailyReferralClaimsCount: parsed.dailyReferralClaimsCount ?? 0,
          dailyReferralClaimsDate: parsed.dailyReferralClaimsDate ?? '',
        };
      } catch {
        return freshDefaults;
      }
    }
    return freshDefaults;
  });

  // Finger-tap hint on the Profit box — shows for the first 3 app
  // sessions only, ever, then stops for good. Captured once at mount
  // (via a ref, not state) so this session's decision doesn't shift
  // mid-session if the counter changes underneath it — a player who
  // opened the app with the hint due to show should keep seeing it for
  // this whole session, not have it vanish the instant the increment
  // below fires.
  const showProfitTapHintRef = useRef(stats.profitTapHintShownCount < 3);
  useEffect(() => {
    if (stats.profitTapHintShownCount < 3) {
      setStats((prev) => ({ ...prev, profitTapHintShownCount: prev.profitTapHintShownCount + 1 }));
    }
  }, []);

  // Mirrors stats.cash for handleUpgrade's own atomic affordability checks
  // below. Re-synced from committed state on every render via the effect
  // beneath it (covers passive income, rewards, resets, etc.), but
  // handleUpgrade also writes to it directly and synchronously the instant
  // it spends money — so a second rapid tap, arriving before React has
  // re-rendered, still sees the true up-to-the-moment balance rather than
  // a stale render-time value. This is what makes the upgrade check atomic
  // without merging businessesByDistrict and stats into one state object.
  const cashRef = useRef(stats.cash);
  useEffect(() => {
    cashRef.current = stats.cash;
  }, [stats.cash]);

  const [avatarEmoji, setAvatarEmoji] = useState(() => {
    return (shouldTrustLocalSave && localStorage.getItem('basti_avatar')) || '😎';
  });

  const [playerName, setPlayerName] = useState(() => {
    return (shouldTrustLocalSave && localStorage.getItem('basti_player_name')) || 'SmartTycoon';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'city' | 'leaderboard' | 'profile'>('home');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // LOCKED DISTRICT PREVIEW MODE: separate from currentDistrictId entirely —
  // browsing a locked district never touches which district is actually
  // "current" for real play. Only set when previewing; App.tsx auto-clears
  // it (and promotes to real play) the moment the district unlocks.
  const { previewDistrictId, setPreviewDistrictId, isPreviewMode } = useDistrictPreview({
    activeTab, isDistrictUnlocked, setCurrentDistrict,
  });
  // Settings screen visibility. Wired from Profile's settings row. Header
  // currently has no settings icon (dropped when it was rebuilt to match
  // the pixel reference, which only showed a speaker icon) — nothing to
  // wire there without adding a new visual element.
  const [showSettings, setShowSettings] = useState(false);
  // Unified Milestone celebration — level-up, district-completion, and
  // achievement-unlock all drive this ONE state now, instead of three
  // separate near-duplicate modals. Confirmed via direct code inspection
  // that level-up and district-completion were previously two separate,
  // nearly identical implementations differing only in icon/color/text —
  // this consolidates them into one real shared component.
  const [milestone, setMilestone] = useState<{
    icon: string; title: string; message: string; bonusText: string; color: 'gold' | 'green';
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Micro Feedback pass: which business just got bought/upgraded, so its
  // grid card can play a one-shot celebrate animation. Cleared shortly
  // after so it never re-triggers on a later re-render.
  const [justUpdatedBusinessId, setJustUpdatedBusinessId] = useState<string | null>(null);

  // Cash Pill pulse — a counter bumped only by discrete actions (a
  // purchase, a claim, a reward), never by the continuous per-second
  // passive tick. Pulsing on every tick would mean pulsing constantly,
  // forever — the opposite of "subtle."
  const [cashPulseKey, setCashPulseKey] = useState(0);
  const triggerCashPulse = () => setCashPulseKey((k) => k + 1);

  // Business News ticker — last 5 events, in-memory only (not persisted,
  // not an achievement log, gone on app close by design). Newest first.
  const { newsEvents, pushNewsEvent } = useNewsTicker();

  // Micro Feedback: brief unlock toast — auto-dismisses within the spec's
  // 1–2s window, never longer. Doesn't replace or resemble a new screen,
  // just a small transient banner.
  const [unlockToast, setUnlockToast] = useState<{ name: string; emoji: string } | null>(null);

  // Header pool claim — floating overlay so it works identically on any
  // tab, since the Header (and its Pool pill) is persistent everywhere.
  const [poolClaimUI, setPoolClaimUI] = useState<{ amount: number; state: 'collected' | 'doubled' | 'empty' | 'cooldown' | 'doubleCapped'; secondsRemaining?: number; totalSeconds?: number } | null>(null);

  // Global "money gained" flourish — fires the coin-flight effect from
  // anywhere a handler gains the player real cash, not just the pool
  // claim overlay. A simple counter, bumped on every trigger; each bump
  // mounts a fresh, uniquely-keyed CoinFlight that plays once and
  // unmounts itself, so rapid consecutive triggers (e.g. claiming two
  // reward cards quickly) each get their own clean flight rather than
  // fighting over one shared instance.
  const [moneyFlightKey, setMoneyFlightKey] = useState(0);
  const triggerMoneyFlight = () => setMoneyFlightKey((k) => k + 1);
  const [poolClaimAdOpen, setPoolClaimAdOpen] = useState(false);
  const [poolClaimAdCountdown, setPoolClaimAdCountdown] = useState(6);

  // Centralized Milestone dismiss-timer — replaces the 6 separate
  // setTimeout calls that used to live at each trigger site. Pool claim
  // always takes visual priority: the Milestone modal doesn't render
  // while poolClaimUI is showing, and critically, its dismiss countdown
  // doesn't run either — it only starts once the pool card is actually
  // closed, so a milestone triggered mid-claim gets its full celebration
  // time instead of silently expiring while hidden behind the pool card.
  useEffect(() => {
    if (!milestone || poolClaimUI) return;
    const timer = setTimeout(() => setMilestone(null), progressionConfig.celebrationDurationMs);
    return () => clearTimeout(timer);
  }, [milestone, poolClaimUI]);

  const handleHeaderClaimPool = () => {
    const doubleCooldownSeconds = getCooldownRemainingSeconds(stats.lastProfitDoubleClaimAt);
    if (doubleCooldownSeconds > 0) {
      playClick();
      setPoolClaimUI({ amount: 0, state: 'cooldown', secondsRemaining: doubleCooldownSeconds, totalSeconds: CLAIM_COOLDOWN_MS / 1000 });
      setTimeout(() => setPoolClaimUI((cur) => (cur?.state === 'cooldown' ? null : cur)), 1800);
      return;
    }
    // The genuine 2-hour cooldown between any two pool claims — checked
    // here explicitly (not just inside handleClaimPool) so the UI can
    // show the actual real countdown, rather than the generic "empty"
    // message that would otherwise look identical to genuinely having
    // nothing to claim yet. Skipped entirely for the very first claim
    // since this cooldown was introduced (see hasClaimedSincePoolCooldown).
    const poolCooldownSeconds = stats.hasClaimedSincePoolCooldown
      ? getCooldownRemainingSeconds(stats.lastPoolClaimAt, progressionConfig.poolClaimCooldownMinutes * 60000)
      : 0;
    if (poolCooldownSeconds > 0 && stats.poolCash > 0) {
      playClick();
      setPoolClaimUI({ amount: 0, state: 'cooldown', secondsRemaining: poolCooldownSeconds, totalSeconds: progressionConfig.poolClaimCooldownMinutes * 60 });
      setTimeout(() => setPoolClaimUI((cur) => (cur?.state === 'cooldown' ? null : cur)), 1800);
      return;
    }
    const claimed = handleClaimPool();
    if (claimed <= 0) {
      // Nothing to collect yet — still show SOMETHING, so tapping the
      // pill is never silent. Silent-nothing is indistinguishable from
      // a bug, even when the code is technically doing exactly what it
      // should (there's genuinely nothing to claim right now).
      playClick();
      setPoolClaimUI({ amount: 0, state: 'empty' });
      setTimeout(() => setPoolClaimUI((cur) => (cur?.state === 'empty' ? null : cur)), 1800);
      return;
    }
    setPoolClaimUI({ amount: claimed, state: 'collected' });
  };

  const handleHeaderDoubleClaim = () => {
    playClick();
    setPoolClaimAdCountdown(6);
    setPoolClaimAdOpen(true);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (poolClaimAdOpen) {
      interval = setInterval(() => {
        setPoolClaimAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPoolClaimAdOpen(false);
            setPoolClaimUI((cur) => {
              if (!cur) return null;
              const wasDoubled = handleDoubleClaim(cur.amount);
              if (wasDoubled) logAnalyticsEvent('ad_watched', { source: 'header_double_claim' });
              playUnlock();
              return { amount: cur.amount, state: wasDoubled ? 'doubled' : 'doubleCapped' };
            });
            setTimeout(() => setPoolClaimUI(null), 2200);
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [poolClaimAdOpen]);

  const [celebratingDistrictId, setCelebratingDistrictId] = useState<string | null>(null);

  // Real, accurate "when was this device's data last genuinely
  // modified" timestamp — deliberately separate from the individual
  // localStorage writes below, which just persist whatever the current
  // values are. This is what makes it possible to safely compare local
  // freshness against the cloud's own savedAt on sign-in (see
  // useCloudSync) — without it, there was no way to tell a device with
  // real, recent progress apart from one that's been stale for weeks,
  // since both would silently skip the cloud-restore check.
  //
  // Skips the very first render on purpose: loading existing saved data
  // when the app opens isn't a genuine new change, and stamping it as
  // "just now" would make every device's local save always look
  // artificially fresh, defeating the whole comparison.
  const isFirstFreshnessRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstFreshnessRenderRef.current) {
      isFirstFreshnessRenderRef.current = false;
      return;
    }
    localStorage.setItem('basti_local_saved_at', String(Date.now()));
  }, [stats, businessesByDistrict, avatarEmoji, playerName]);

  // Auto-save local storage when state changes
  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem('basti_save_version', String(CURRENT_SAVE_VERSION));
    localStorage.setItem('basti_businesses_by_district', JSON.stringify(businessesByDistrict));
  }, [businessesByDistrict, currentUid]);

  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem('basti_save_version', String(CURRENT_SAVE_VERSION));
    localStorage.setItem('basti_stats', JSON.stringify(stats));
  }, [stats, currentUid]);

  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem('basti_save_version', String(CURRENT_SAVE_VERSION));
    localStorage.setItem('basti_avatar', avatarEmoji);
  }, [avatarEmoji, currentUid]);

  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem('basti_save_version', String(CURRENT_SAVE_VERSION));
    localStorage.setItem('basti_player_name', playerName);
  }, [playerName, currentUid]);

  // BACKGROUND CLOUD SYNC — real Firestore now that a real Firebase
  // project exists, but deliberately never something the app's own
  // instant local boot depends on. Signs in anonymously once, then
  // pushes the current save to the cloud whenever it changes, throttled
  // to a few seconds so rapid local updates (the pool ticking, etc.)
  // don't hammer the network with a write on every single change.
  //
  // Deliberately ONE-WAY (push only) for this first pass — this does not
  // pull from the cloud and overwrite local state. Restoring a save
  // from the cloud (e.g. on a new device) is a genuinely separate,
  // higher-stakes feature — it needs a real answer to "which save wins
  // if local and cloud differ," which deserves its own careful, tested
  // pass rather than being bundled in here as an afterthought.
  // Cloud save + real leaderboard — extracted into its own hook per the
  // Phase 0 architecture cleanup (src/hooks/useCloudSync.ts). Behavior
  // preserved exactly; this is a relocation, not a rewrite. Deliberately
  // ONE-WAY (push only) beyond the fresh-device restore case above —
  // this does not pull from the cloud and overwrite local state once a
  // local save already exists. Restoring a save across devices when
  // both already have progress is a genuinely separate, higher-stakes
  // feature needing a real answer to "which save wins," which deserves
  // its own careful, tested pass rather than being bundled in here.
  const { cloudUidRef, realLeaderboard, myRealRank, isBrandNewPlayer, weeklyContestBoard, myWeeklyRank, lastLeaderboardFetchAt, referralCreditsJustEarned, clearReferralCreditsJustEarned, signupReferralBonusEarned, clearSignupReferralBonusEarned } = useCloudSync({
    hadNoLocalSaveAtBoot: hadNoLocalSaveAtBootRef.current,
    businessesByDistrict, stats, avatarEmoji, playerName, currentDistrictId,
    unlockedDistrictsMap, rewardedDistrictsMap,
    setBusinessesByDistrict, setStats, setAvatarEmoji, setPlayerName, restoreDistrictState,
  });

  // Single-active-session enforcement — if this account was opened on
  // another device, this device notices on its next periodic check and
  // signs itself out with a clear explanation, rather than silently
  // keep playing a diverged copy of the save forever.
  const { wasKickedOut } = useSessionEnforcement(currentUid);
  useEffect(() => {
    if (!wasKickedOut) return;
    alert('This account was opened on another device, so you\'ve been signed out here. Sign back in any time to keep playing on this device instead.');
    signOutUser();
  }, [wasKickedOut]);

  // Real signup-bonus celebration — fires exactly once, ever, per
  // account, the moment a genuinely brand-new player is confirmed
  // (no local save, no cloud save either). Reuses the same Milestone
  // modal every other celebration in the app uses, plus confetti and
  // the money-flight coins, for a real "stars and coins" welcome
  // moment rather than a plain notice.
  useEffect(() => {
    if (!isBrandNewPlayer) return;
    playLevelUp();
    triggerMoneyFlight();
    setMilestone({
      icon: '🎉',
      title: 'Welcome to CoralBay!',
      message: 'Your business empire starts now.',
      bonusText: '+₹25,000 signup bonus',
      color: 'gold',
    });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), progressionConfig.celebrationDurationMs);
  }, [isBrandNewPlayer]);

  // GAME LOOP (Pool ticks every 1 second; cash is frozen until claimed)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setStats((prev) => {
        const profitPerSec = prev.profitPerMin / 60;

        // Pool is now the ONLY thing ticking — cash itself is frozen
        // until the player taps Claim (Header pill or Portfolio). Capped
        // at a percentage of the CURRENT district's total cost
        // (progressionConfig.poolCeilingRatio) rather than one flat
        // rupee amount for the whole game — verified via simulation
        // that a flat ceiling became trivially easy to hit within
        // minutes once profitPerMin compounded in later districts,
        // while a district-scaled ceiling stays meaningful at every
        // stage. Also still capped by poolCapMinutes (a genuine time
        // window) as a second, independent safeguard — miss a claim
        // for a while and the excess beyond both caps is lost, by
        // design, encouraging a real but forgiving check-in rhythm.
        const districtCeiling = getDistrictTotalCost(currentDistrictIdRef.current) * progressionConfig.poolCeilingRatio;
        const poolCap = Math.min(districtCeiling, prev.profitPerMin * progressionConfig.poolCapMinutes);
        const nextPool = Math.min(poolCap, prev.poolCash + profitPerSec);

        return {
          ...prev,
          poolCash: nextPool,
          totalPlayTimeSeconds: prev.totalPlayTimeSeconds + 1,
        };
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // Recalculate profit stream when ANY district's business levels change —
  // owning shops in Katra should still earn while you're looking at Badeban.
  //
  // Sums each business's own `profitPerMin` directly — that field is
  // already correctly maintained by handleUpgrade for every district,
  // whether it's the legacy calculateTieredProfit formula or, for the 10
  // strategy-layer districts, the synergy-adjusted value recomputed by
  // recomputeDistrictProfits after every purchase. Previously this
  // recalculated everything from baseProfitPerMin/level using the legacy
  // formula directly — a real bug that silently ignored every synergy
  // bonus entirely, since a business's true income and its
  // baseProfitPerMin×level figure diverge the moment any synergy is
  // active. Caught and fixed before this ever reached a real player.
  useEffect(() => {
    const allDistrictLists: Business[][] = Object.values(businessesByDistrict);
    const totalProfit = allDistrictLists.reduce((grandTotal: number, districtBusinesses: Business[]) => {
      const districtTotal = districtBusinesses.reduce((sum: number, b: Business) => {
        if (b.level === 0) return sum;
        return sum + b.profitPerMin;
      }, 0);
      return grandTotal + districtTotal;
    }, 0);

    setStats((prev) => ({
      ...prev,
      profitPerMin: Math.round(totalProfit * getLegacyIncomeMultiplier(prev.legacyPoints))
    }));
  }, [businessesByDistrict]);

  // PROGRESSION ENGINE: auto-evaluate every locked district's
  // unlockRequirement whenever the player's progress changes (cash, level,
  // or another district's completion status). This runs instead of any
  // manual unlock action — once a requirement is met, unlockDistrict()
  // flips it on and it's persisted immediately.
  useEffect(() => {
    bastiCity.districts.forEach((district) => {
      if (isDistrictUnlocked(district.id)) return; // already unlocked, nothing to evaluate

      const req = district.unlockRequirement;
      if (!req || req.type === 'always') return;

      let requirementMet = false;
      if (req.type === 'district_completed' && req.districtId) {
        requirementMet = isDistrictCompleted(businessesByDistrict[req.districtId] ?? []);
      }

      if (requirementMet) {
        unlockDistrict(district.id);
        pushNewsEvent(`🗺️ ${district.name} unlocked`);
        setUnlockToast({ name: district.name, emoji: district.emoji });
        setTimeout(() => setUnlockToast((cur) => (cur?.name === district.name ? null : cur)), 1800);
      }
    });
  }, [businessesByDistrict, isDistrictUnlocked, unlockDistrict]);

  // COMPLETION ENGINE: whenever any district's businesses change, check if
  // it just crossed into "completed" (per progressionConfig.completionRule)
  // and hasn't been rewarded yet. isDistrictRewarded()/markDistrictRewarded()
  // is the guard that makes the bonus grant exactly once, ever, per district
  // — persisted immediately, so it survives a refresh mid-celebration too.
  useEffect(() => {
    bastiCity.districts.forEach((district) => {
      if (isDistrictRewarded(district.id)) return; // already paid out, nothing to do

      const districtBusinesses = businessesByDistrict[district.id] ?? [];
      if (!isDistrictCompleted(districtBusinesses)) return;

      // Mark first (idempotent + synchronous with this check) so a fast
      // double-fire of this effect can never pay the bonus twice.
      markDistrictRewarded(district.id);

      const scaledReward = getDistrictCompletionReward(districtBusinesses, district.id);
      setStats((prev) => ({ ...prev, cash: prev.cash + scaledReward }));
      playLevelUp();
      triggerMoneyFlight();
      pushNewsEvent(`🎊 ${district.name} completed`);
      setMilestone({
        icon: '🏆',
        title: 'District Completed!',
        message: `${district.emoji} ${district.name} — District Completed!`,
        bonusText: `Earned +₹${scaledReward.toLocaleString('en-IN')} completion bonus`,
        color: 'green',
      });
      setShowConfetti(true);
      setCelebratingDistrictId(district.id);
      setTimeout(() => setShowConfetti(false), Math.min(1300, progressionConfig.celebrationDurationMs));
      setTimeout(() => setCelebratingDistrictId(null), progressionConfig.completionRoadPulseDurationMs);
    });
  }, [businessesByDistrict, isDistrictRewarded, markDistrictRewarded]);

  // NEWS TICKER — completion % and district level milestones. Uses a ref
  // (not state) to remember the last-seen value per district purely so
  // each threshold only ever announces once, the moment it's actually
  // crossed — not a new mechanic, just bookkeeping for the news feed.
  // The very first check for a given district in a session only records
  // a baseline and announces nothing — otherwise a returning player who
  // already has real progress would see old milestones "re-fire" the
  // instant the app opens fresh, since this ref (correctly) isn't
  // persisted across sessions.
  const lastAnnouncedRef = useRef<Record<string, { completion: number; level: number }>>({});
  useEffect(() => {
    bastiCity.districts.forEach((district) => {
      const list = businessesByDistrict[district.id] ?? [];
      if (list.length === 0) return;
      const progress = getDistrictProgress(list);
      const prevSeen = lastAnnouncedRef.current[district.id];

      if (prevSeen) {
        [25, 50, 75, 100].forEach((threshold) => {
          if (prevSeen.completion < threshold && progress.completionPercent >= threshold) {
            pushNewsEvent(`🌟 ${district.name} reached ${threshold}% completion`);
          }
        });
        if (progress.districtLevel > prevSeen.level) {
          pushNewsEvent(`🏆 ${district.name} reached District Level ${progress.districtLevel}`);
        }
      }

      lastAnnouncedRef.current[district.id] = { completion: progress.completionPercent, level: progress.districtLevel };
    });
  }, [businessesByDistrict]);

  // MILESTONE: achievement unlock — global detection, not scoped to
  // whichever screen happens to be open. Previously, achievements were
  // only ever computed inside PortfolioScreen, meaning an unlock that
  // happened while the player was on Home would go completely unnoticed
  // until they next opened Portfolio. This runs continuously instead,
  // same "first check just records a baseline" pattern as the district
  // thresholds above — so a returning player with already-unlocked
  // achievements doesn't get a false celebration the instant the app
  // opens fresh (this ref, like the others, is intentionally not
  // persisted across sessions).
  // Achievement detection + permanent persistence — extracted into its
  // own hook per the Phase 0 architecture cleanup
  // (src/hooks/useAchievementDetection.ts). Behavior preserved exactly.
  useAchievementDetection({
    stats, businessesByDistrict, setStats,
    onUnlock: (newlyUnlocked) => {
      playLevelUp();
      pushNewsEvent(`🏅 ${newlyUnlocked.title} unlocked!`);
      setMilestone({
        icon: '🏅',
        title: 'Achievement Unlocked!',
        message: newlyUnlocked.title,
        bonusText: newlyUnlocked.desc,
        color: 'gold',
      });
    },
  });


  // LOCKED DISTRICT PREVIEW MODE: if the district being previewed becomes
  // unlocked while the player is browsing it (e.g. passive income crosses
  // the net-worth threshold mid-preview), seamlessly promote it to the
  // real currentDistrictId and drop out of preview — same screen, same
  // components, it just stops being read-only. setCurrentDistrict() is the
  // same guarded setter as always; this never bypasses the unlock check.
  // AD SPONSOR DOUBLE PROFIT
  /** Claims the current pool into cash, resets the pool, and returns the
   *  claimed amount so the caller can show "+₹X Collected!" and offer to
   *  double that specific amount. Pure cash mutation lives here, in the
   *  same place as every other stat change; which step of the claim flow
   *  (confirmation, double-offer) is showing is the Portfolio screen's
   *  own local UI state, not something App.tsx needs to track. */
  // Every way a player receives cash outside a business purchase/upgrade
  // — extracted into its own hook per the Phase 0 architecture cleanup
  // (src/hooks/useClaimHandlers.ts). Behavior preserved exactly.
  const { handleClaimPool, handleDoubleClaim, handleScratchCard, handleClaimCard } = useClaimHandlers({
    stats, businessesByDistrict, setStats, triggerCashPulse, triggerMoneyFlight,
  });

  // DYNAMIC LEVEL UP SYSTEM
  // Contest-points celebration — a specific business card briefly shows
  // a "+10 contest points" beat, timed to play after the existing
  // purchase/upgrade celebration, not blended into it.
  const [contestPointsCelebrationId, setContestPointsCelebrationId] = useState<string | null>(null);
  const triggerContestPointsCelebration = (businessId: string) => {
    setContestPointsCelebrationId(businessId);
    setTimeout(() => setContestPointsCelebrationId((cur) => (cur === businessId ? null : cur)), 1200);
  };

  // The core economy handler — buying/upgrading a business, and the
  // XP/level-up system it feeds — extracted into its own hook per the
  // Phase 0 architecture cleanup (src/hooks/useBusinessActions.ts).
  // Behavior preserved exactly, including the documented stale-closure
  // fix from before.
  const { handleUpgrade } = useBusinessActions({
    stats, cashRef,
    currentDistrictName: currentDistrictMeta?.name ?? 'Badeban',
    currentDistrictId,
    setBusinesses, setStats, setMilestone, setShowConfetti,
    setJustUpdatedBusinessId, triggerCashPulse, pushNewsEvent, playLevelUp,
    triggerContestPointsCelebration,
  });


  /** Signs the player out entirely — returns them to the required login
   *  screen. Their progress is already safely in the cloud under their
   *  account, so signing back in with the same Google account brings
   *  it right back. */
  // Every drastic, whole-account action — sign out, manual reset, and
  // Legacy — extracted into its own hook per the Phase 0 architecture
  // cleanup (src/hooks/useAccountActions.ts). Behavior preserved exactly.
  const { handleSignOut, handleEstablishLegacy } = useAccountActions({
    stats, businessesByDistrict, cashRef, setBusinessesByDistrict, setStats, setMilestone,
    setPreviewDistrictId, setActiveTab, resetDistricts, seedAllDistricts, generateFreshRewardCards, playLevelUp, playClick,
  });

  // LOCKED DISTRICT PREVIEW MODE: what the Home screen actually *displays*
  // can differ from currentDistrictId (the real, playable district) when
  // previewing a locked one. handleUpgrade/setBusinesses above are
  // untouched and still only ever act on currentDistrictId — preview
  // rendering is entirely separate and read-only.
  const displayedDistrictId = previewDistrictId ?? currentDistrictId;
  const displayedDistrictMeta = getDistrict(bastiCity, displayedDistrictId);
  const displayedBusinesses = businessesByDistrict[displayedDistrictId] ?? [];

  // District progress (income, stars, completion, district level) for the
  // district currently loaded on the Home screen.
  // NOTE: intentionally reads displayedBusinesses (not `businesses`) so this
  // reflects whatever district is actually shown on screen — the real
  // current district during normal play, or the previewed one when a
  // locked district is being browsed. Name kept as-is to avoid touching
  // every call site; only the source data changed.
  const currentDistrictProgress = useMemo(() => getDistrictProgress(displayedBusinesses), [displayedBusinesses]);

  // Same, but for every district at once — this is what feeds the City
  // Map's per-node stats and completed/unlocked visual states.
  const districtProgressMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getDistrictProgress>> = {};
    bastiCity.districts.forEach((d) => {
      map[d.id] = getDistrictProgress(businessesByDistrict[d.id] ?? []);
    });
    return map;
  }, [businessesByDistrict]);

  return (
    <div className="app-shell-height md:min-h-screen w-full bg-gradient-to-br from-[#faf6f0] via-[#f4e7d3] to-[#e6d3b4] text-slate-800 flex flex-col items-center justify-start md:justify-center p-0 md:p-6 select-none overflow-hidden relative font-sans">
      
      {/* Traditional Indian Festive Marigold Garlands draped along the top of screen */}
      <div className="absolute top-0 inset-x-0 h-10 pointer-events-none z-30 hidden md:block overflow-hidden">
        <svg viewBox="0 0 1200 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
          {/* Garland Strings */}
          <path d="M-10,4 Q50,22 110,4 Q170,22 230,4 Q290,22 350,4 Q410,22 470,4 Q530,22 590,4 Q650,22 710,4 Q770,22 830,4 Q890,22 950,4 Q1010,22 1070,4 Q1130,22 1190,4" stroke="#d97706" strokeWidth="1" />
          <path d="M-10,6 Q50,24 110,6 Q170,24 230,6 Q290,24 350,6 Q410,24 470,6 Q530,24 590,6 Q650,24 710,6 Q770,24 830,6 Q890,24 950,6 Q1010,24 1070,6 Q1130,24 1190,6" stroke="#ea580c" strokeWidth="1" />
          
          {/* Individual flowers and mango leaves at wave peaks and troughs */}
          {Array.from({ length: 21 }).map((_, i) => {
            const x = i * 60 - 10;
            const y = i % 2 === 0 ? 5 : 23;
            return (
              <g key={i}>
                {/* Mango Leaf */}
                <path d={`M${x},${y} Q${x-6},${y+15} ${x},${y+22} Q${x+6},${y+15} ${x},${y}`} fill="#166534" />
                {/* Orange/Yellow Marigold fuzzies */}
                <circle cx={x} cy={y} r="8" fill="#f59e0b" className="animate-pulse" style={{ animationDelay: `${i*100}ms` }} />
                <circle cx={x} cy={y} r="6.5" fill="#ea580c" />
                <circle cx={x} cy={y} r="4" fill="#fbbf24" />
                <circle cx={x-3} cy={y-2} r="2.5" fill="#f59e0b" />
                <circle cx={x+3} cy={y+2} r="2.5" fill="#f59e0b" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Elegant Left Wall Traditional Mandana / Lippan folk art */}
      <div className="absolute left-4 bottom-12 w-80 h-[550px] pointer-events-none hidden xl:flex flex-col justify-end items-start opacity-25">
        <svg viewBox="0 0 300 500" className="w-full h-full text-[#8c3917]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {/* Stylized Village tree branch extending */}
          <path d="M0,450 C80,430 180,360 220,240 C230,210 210,180 180,180" strokeWidth="4" />
          <path d="M120,385 C160,350 200,340 230,300" strokeWidth="2.5" strokeDasharray="2,2" />
          <path d="M70,410 C100,360 130,310 110,250" strokeWidth="2" />
          
          {/* Leaves */}
          <path d="M220,240 Q250,220 240,200 Q220,210 220,240" fill="currentColor" />
          <path d="M180,180 Q190,140 170,130 Q160,150 180,180" fill="currentColor" />
          <path d="M230,300 Q260,290 250,270 Q230,280 230,300" fill="currentColor" />
          <path d="M110,250 Q130,220 120,200 Q100,210 110,250" fill="currentColor" />
          
          {/* Hanging Traditional brass lantern */}
          <g transform="translate(180, 180)">
            <line x1="0" y1="0" x2="0" y2="40" strokeWidth="2" />
            {/* Lantern crown */}
            <path d="M-15,40 L15,40 L10,32 L-10,32 Z" fill="currentColor" />
            {/* Glass core */}
            <rect x="-8" y="40" width="16" height="24" rx="4" strokeWidth="2" fill="#fef08a" opacity="0.6" className="animate-pulse" />
            <circle cx="0" cy="52" r="3" fill="#f59e0b" />
            {/* Guard bars */}
            <path d="M-10,40 L-10,64 M10,40 L10,64" strokeWidth="1.5" />
            {/* Base */}
            <rect x="-12" y="64" width="24" height="6" rx="1" fill="currentColor" />
            {/* Hanging tassels */}
            <line x1="-8" y1="70" x2="-8" y2="82" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="0" y1="70" x2="0" y2="86" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="8" y1="70" x2="8" y2="82" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="-8" cy="84" r="1.5" fill="currentColor" />
            <circle cx="0" cy="88" r="1.5" fill="currentColor" />
            <circle cx="8" cy="84" r="1.5" fill="currentColor" />
          </g>

          {/* Traditional Geometric Mandana concentric circles on the wall */}
          <g transform="translate(80, 200)" className="animate-spin" style={{ animationDuration: '60s' }}>
            <circle cx="0" cy="0" r="50" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx="0" cy="0" r="40" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="28" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="15" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Elegant Right Wall Traditional Mandana / Lippan folk art */}
      <div className="absolute right-4 bottom-12 w-80 h-[550px] pointer-events-none hidden xl:flex flex-col justify-end items-end opacity-25">
        <svg viewBox="0 0 300 500" className="w-full h-full text-[#8c3917]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {/* Right side hanging Marigold strings */}
          <path d="M180,-10 L180,260" strokeWidth="1.5" strokeDasharray="1,2" />
          <path d="M220,-10 L220,180" strokeWidth="1.5" strokeDasharray="1,2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="180" cy={30 + i * 28} r="6" fill="#f59e0b" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx="220" cy={30 + i * 28} r="6" fill="#ea580c" />
          ))}

          {/* Majestic Peacock silhouette sitting on a mud planter */}
          <g transform="translate(100, 320)">
            {/* Planter */}
            <path d="M0,120 L80,120 L70,80 L10,80 Z" fill="none" strokeWidth="2" />
            <path d="M10,80 Q40,65 70,80" strokeWidth="1.5" />
            {/* Plant stems */}
            <path d="M40,80 Q20,30 35,5" strokeWidth="1.5" />
            <path d="M40,80 Q60,40 50,15" strokeWidth="1.5" />
            
            {/* Peacock Body */}
            <path d="M20,60 C0,50 -5,20 15,10 C25,5 35,15 32,30 C30,40 10,42 20,60 Z" fill="currentColor" stroke="none" />
            {/* Crest feathers */}
            <path d="M15,10 Q10,-5 8,-8 M15,10 Q15,-6 15,-10 M15,10 Q20,-5 22,-8" />
            {/* Beak */}
            <path d="M8,12 L0,15" />
            {/* Long flowing tail feathers */}
            <path d="M30,35 C45,55 50,90 40,115 C35,120 25,90 28,60" fill="currentColor" opacity="0.8" />
            <path d="M25,45 C55,65 65,95 55,118" fill="currentColor" opacity="0.6" />
          </g>

          {/* Large gorgeous Concentric Mandana Mandala center */}
          <g transform="translate(150, 150)">
            <circle cx="0" cy="0" r="60" strokeWidth="2" />
            <circle cx="0" cy="0" r="50" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="0" cy="0" r="35" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="10" fill="currentColor" />
          </g>
        </svg>
      </div>

      {/* Desktop side panel text banner */}
      <div className="absolute top-12 left-12 w-72 pointer-events-none hidden xl:block space-y-4 font-sans">
        <div className="flex items-center gap-2 text-cyan-700">
          <Landmark className="animate-spin" style={{ animationDuration: '10s' }} />
          <h1 className="font-display font-extrabold text-xl text-cyan-100 tracking-tight uppercase">
            CoralBay Business
          </h1>
        </div>
        <p className="text-xs text-cyan-200 leading-relaxed font-semibold">
          Welcome to the ultimate mobile idle business tycoon. Buy street corners, establish high-yield franchises, double your ad revenues, and outpace regional business moguls live.
        </p>
      </div>

      {/* HIGH-FIDELITY MOBILE DEVICE MOCKUP FRAME CONTAINER (WARM TEAKWOOD FRAME) */}
      <div className="app-shell-height relative w-full md:h-[880px] md:max-w-[420px] bg-[var(--color-ink-900)] md:rounded-[42px] md:border-[10px] md:border-[#0a2e4a] md:shadow-[0_24px_64px_rgba(10,46,74,0.45)] flex flex-col overflow-hidden">
        
        {/* Mobile Camera notch and status strip (Visible on desktop mockup shell only) */}
        <div className="hidden md:flex w-full h-8 bg-[#040d16] justify-between items-center px-6 text-cyan-400/80 text-[10px] font-mono font-bold select-none relative border-b border-[var(--color-ink-700)]">
          {/* Simulated Time */}
          <span>9:41 AM</span>
          
          {/* Central Notch speaker capsule */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#0a1f30] rounded-full flex items-center justify-center border border-[#0a2e4a]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950 ml-auto mr-3 border border-indigo-500/10"></div>
          </div>

          {/* Network and Battery Status indicators */}
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>📶</span>
            <span className="text-emerald-500">100% 🔋</span>
          </div>
        </div>

        {/* 1. STICKY DASHBOARD HEADER */}
        <Header 
          stats={stats} 
          avatarEmoji={avatarEmoji} 
          setAvatarEmoji={setAvatarEmoji} 
          playerName={playerName}
          setPlayerName={setPlayerName}
          cashPulseKey={cashPulseKey}
          onClaimPool={handleHeaderClaimPool}
          showProfitTapHint={showProfitTapHintRef.current}
          realRank={myRealRank}
        />

        {/* 2. DYNAMIC MAIN TAB SCREEN COMPOSITIONS (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative pb-40" style={{ backgroundColor: 'var(--color-premium-bg)' }}>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="min-h-full"
            >
              {activeTab === 'home' && (
                <div className="min-h-full flex flex-col gap-1.5 px-3 pt-1 pb-2">
                  {isPreviewMode ? (
                    /* Preview mode: no ad-boost control (nothing claimable while
                       merely browsing a locked district) — just a clear indicator
                       and the unlock requirement. */
                    <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5" style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)' }}>
                      <Lock size={16} className="flex-shrink-0" color="var(--color-premium-text-secondary)" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-white">
                          🔒 Preview Mode — Browsing Only
                        </span>
                        {displayedDistrictMeta?.unlockRequirement && (
                          <span className="block text-[9px] mt-0.5" style={{ color: 'var(--color-premium-text-secondary)' }}>
                            Unlock requirement: <span className="font-bold" style={{ color: 'var(--color-premium-gold-400)' }}>{displayedDistrictMeta.unlockRequirement.label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <DailyRewardCards
                        cards={stats.rewardCards}
                        onScratch={handleScratchCard}
                        onClaim={handleClaimCard}
                        lastCardClaimAt={stats.lastCardClaimAt}
                      />
                      <ShareEarnCard
                        referrerUid={currentUid}
                        bonusCoins={progressionConfig.referralBonusCoins}
                      />
                    </>
                  )}

                  {/* District Summary Card — name, stars, income, businesses, completion, level.
                      Reused as-is for both real play and preview; it's already just a
                      read display of getDistrictProgress(), which is safe either way. */}
                  <DistrictSummaryCard
                    districtEmoji={displayedDistrictMeta?.emoji ?? ''}
                    districtName={displayedDistrictMeta?.name ?? 'Unknown District'}
                    income={currentDistrictProgress.income}
                    businessesOwned={currentDistrictProgress.businessesOwned}
                    businessesTotal={currentDistrictProgress.businessesTotal}
                    completionPercent={currentDistrictProgress.completionPercent}
                    districtLevel={currentDistrictProgress.districtLevel}
                    stars={currentDistrictProgress.stars}
                    celebrating={celebratingDistrictId === currentDistrictId}
                  />

                  {/* Section header — plain sibling now, no bounding card
                      or nested scroll region around it or the grid below.
                      The whole page scrolls as one continuous flow via the
                      outer wrapper's existing overflow-y-auto — the same
                      pattern every reference app in this whole project
                      (Township, Coin Master, real shopping apps) actually
                      uses, rather than nesting a mini-scroll-region inside
                      a bounded card just for the product grid. */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, var(--color-premium-gold-400), transparent)' }} />
                    <span className="text-[14px] font-bold text-white whitespace-nowrap">
                      Businesses in {displayedDistrictMeta?.name ?? 'Unknown District'}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-premium-gold-400), transparent)' }} />
                  </div>

                  <BusinessGridView
                    businesses={displayedBusinesses}
                    onSelectShop={setSelectedShopId}
                    readOnly={isPreviewMode}
                    justUpdatedBusinessId={justUpdatedBusinessId}
                    cash={stats.cash}
                    contestPointsCelebrationId={contestPointsCelebrationId}
                  />

                  <FooterTipBar newsEvents={newsEvents} />
                </div>
              )}

              {activeTab === 'city' && (
                <div className="absolute inset-x-0 top-0" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
                  <CityMapScreen
                    districtProgress={districtProgressMap}
                    isDistrictUnlocked={isDistrictUnlocked}
                    businessesByDistrict={businessesByDistrict}
                    celebratingDistrictId={celebratingDistrictId}
                    currentDistrictId={currentDistrictId}
                    onPreviewDistrict={(district) => {
                      setPreviewDistrictId(district.id);
                      setActiveTab('home');
                    }}
                    onOpenDistrict={(district) => {
                      setCurrentDistrict(district.id);
                      setActiveTab('home');
                    }}
                  />
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <LeaderboardTab
                  leaderboard={realLeaderboard}
                  myUid={cloudUidRef.current}
                  myRank={myRealRank}
                  playerName={playerName}
                  playerAvatar={avatarEmoji}
                  playerNetWorth={stats.cash + getEmpireTotalInvested(businessesByDistrict)}
                  playerProfitPerMin={stats.profitPerMin}
                  playerBusinessesBoughtCount={stats.businessesBoughtCount}
                  playerLevel={stats.level}
                  weeklyContestBoard={weeklyContestBoard}
                  myWeeklyRank={myWeeklyRank}
                  myWeeklyPoints={stats.weeklyPoints}
                  lastLeaderboardFetchAt={lastLeaderboardFetchAt}
                />
              )}

              {activeTab === 'profile' && (
                <PortfolioScreen
                  stats={stats}
                  businessesByDistrict={businessesByDistrict}
                  avatarEmoji={avatarEmoji}
                  playerName={playerName}
                  playerEmail={auth.currentUser?.email}
                  onSignOut={handleSignOut}
                  onOpenSettings={() => setShowSettings(true)}
                  onClaimPool={handleClaimPool}
                  onDoubleClaim={handleDoubleClaim}
                  onManageDistrict={(districtId) => { setCurrentDistrict(districtId); setActiveTab('home'); }}
                  onEstablishLegacy={handleEstablishLegacy}
                />
              )}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* 3. STICKY FLOATING BOTTOM SELECTION TABS BAR */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Settings screen — fully built, currently untriggered (see note
            on showSettings above) */}
        <SettingsScreen
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          playerName={playerName}
        />

        {/* 3b. SHOP DETAIL BOTTOM SHEET — tap a shop in the street to open this */}
        <ShopDetailSheet
          business={displayedBusinesses.find(b => b.id === selectedShopId) ?? null}
          index={displayedBusinesses.findIndex(b => b.id === selectedShopId)}
          cash={stats.cash}
          onUpgrade={isPreviewMode ? () => {} : handleUpgrade}
          onClose={() => setSelectedShopId(null)}
          readOnly={isPreviewMode}
          districtId={currentDistrictId}
          districtBusinesses={displayedBusinesses}
        />

        {/* District unlock toast — brief, top-of-screen, auto-dismissing.
            Deliberately not a modal/lightbox like the level-up and
            completion celebrations below — this is meant to be a quick
            "by the way" notice, not a moment that pauses play. */}
        <AnimatePresence>
          {unlockToast && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute top-3 inset-x-4 z-40 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 glossy-3d"
            >
              <span className="text-xl leading-none">{unlockToast.emoji}</span>
              <div>
                <div className="text-[12px] font-bold" style={{ color: 'var(--color-premium-gold-400)' }}>
                  New District Unlocked!
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--color-premium-text)' }}>
                  {unlockToast.name} is now open for business
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header pool claim overlay — genuinely centered via flexbox on
            the wrapper, not the Milestone modal's top-1/3 approximation.
            Includes a dimming backdrop, since this is meant to genuinely
            stop the player and demand a tap, not sit quietly at the edge
            of the screen. */}
        <AnimatePresence>
          {poolClaimUI && (
            <motion.div
              key="pool-claim-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-8"
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                onClick={() => (poolClaimUI.state === 'collected' || poolClaimUI.state === 'empty' || poolClaimUI.state === 'cooldown') && setPoolClaimUI(null)}
              />
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative z-50 w-full max-w-[340px] p-6 rounded-3xl text-center flex flex-col items-center overflow-visible glossy-3d"
              >
                {/* Explicit close button — top right. No auto-dismiss timer
                    anymore; this card stays until the player actually
                    closes it, one way or another. */}
                <button
                  onClick={() => setPoolClaimUI(null)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', color: 'var(--color-premium-text-secondary)' }}
                  aria-label="Close"
                >
                  ✕
                </button>

                {poolClaimUI.state === 'collected' && <CoinBurst count={10} emoji="⭐" />}

                {poolClaimUI.state === 'collected' ? (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-green-500)' }}
                    >
                      💰
                    </div>
                    <div className="text-[14px] font-bold flex items-center justify-center gap-1.5 flex-wrap" style={{ color: 'var(--color-premium-green-500)' }}>
                      + {formatCash(poolClaimUI.amount)} ✓
                    </div>
                    <div className="font-bold text-[19px] mt-0.5" style={{ color: 'var(--color-premium-green-500)' }}>Collected!</div>
                    {(stats.dailyDoubleClaimDate === todayDateString() ? stats.dailyDoubleClaimCount : 0) >= progressionConfig.doubleClaimCapPerDay ? (
                      <div className="text-[10.5px] font-semibold mt-4" style={{ color: 'var(--color-premium-text-secondary)' }}>
                        Max {progressionConfig.doubleClaimCapPerDay} daily doubles already used — resets tomorrow.
                      </div>
                    ) : (
                      <button
                        onClick={handleHeaderDoubleClaim}
                        className="w-full mt-4 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer"
                        style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
                      >
                        🚀 Boost Profit +50%
                      </button>
                    )}
                    <button
                      onClick={() => setPoolClaimUI(null)}
                      className="text-[10px] font-semibold mt-2 cursor-pointer"
                      style={{ color: 'var(--color-premium-text-secondary)' }}
                    >
                      No thanks
                    </button>
                  </>
                ) : poolClaimUI.state === 'empty' ? (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-border-strong)' }}
                    >
                      ⏳
                    </div>
                    <div className="font-bold text-[15px]" style={{ color: 'var(--color-premium-text)' }}>
                      Nothing to collect yet
                    </div>
                    <div className="text-[10.5px] mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                      Your businesses are still earning — check back soon.
                    </div>
                  </>
                ) : poolClaimUI.state === 'cooldown' ? (
                  <>
                    <CountdownClock
                      secondsRemaining={poolClaimUI.secondsRemaining ?? 0}
                      totalSeconds={poolClaimUI.totalSeconds ?? (CLAIM_COOLDOWN_MS / 1000)}
                      size={72}
                    />
                    <div className="font-bold text-[15px] mt-3" style={{ color: 'var(--color-premium-text)' }}>
                      Please wait
                    </div>
                    <div className="text-[10.5px] mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                      {(poolClaimUI.totalSeconds ?? 0) > 60
                        ? `The pool refills on its own timer — ${formatCooldownClock(poolClaimUI.secondsRemaining ?? 0)} remaining.`
                        : 'A short cooldown after doubling your last claim.'}
                    </div>
                  </>
                ) : poolClaimUI.state === 'doubleCapped' ? (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-border-strong)' }}
                    >
                      🌙
                    </div>
                    <div className="font-bold text-[15px]" style={{ color: 'var(--color-premium-text)' }}>
                      Today's Double bonus is used up
                    </div>
                    <div className="text-[10.5px] mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                      You've claimed {formatCash(poolClaimUI.amount)} — Double resets tomorrow.
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-gold-400)' }}
                    >
                      ⚡
                    </div>
                    <div className="font-bold text-[17px]" style={{ color: 'var(--color-premium-green-500)' }}>
                      Boosted! +{formatCash(Math.round(poolClaimUI.amount * progressionConfig.doubleClaimBonusPercent))}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global money-flight overlay — any handler that gains the
            player real cash calls triggerMoneyFlight(), regardless of
            which screen or component it happened in. Keyed by
            moneyFlightKey so rapid consecutive triggers each get their
            own clean flight instead of fighting over one instance. */}
        <AnimatePresence>
          {moneyFlightKey > 0 && <CoinFlight key={moneyFlightKey} count={10} />}
        </AnimatePresence>

        {/* Simulated ad for the Header claim's double-up — same reused
            mechanic as every other ad-gated moment in the app. */}
        <SimulatedAdModal isOpen={poolClaimAdOpen} countdown={poolClaimAdCountdown} />

        {/* Referral celebration — shown the moment the app confirms one
            or more people signed up using this player's own link since
            they last played. Deliberately NOT instant for the referrer
            (Firestore rules mean only their own device can credit their
            own account, so this fires on THEIR next app open, not the
            instant their friend signs up). */}
        <AnimatePresence>
          {referralCreditsJustEarned > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative w-full max-w-[340px] p-6 rounded-3xl text-center flex flex-col items-center glossy-3d"
              >
                <CoinBurst count={12} emoji="🎉" />
                <div className="text-5xl mb-2">🎉</div>
                <div className="font-bold text-[17px]" style={{ color: 'var(--color-premium-text)' }}>
                  {referralCreditsJustEarned === 1 ? 'Your friend joined!' : `${referralCreditsJustEarned} friends joined!`}
                </div>
                <div className="font-bold text-[22px] mt-1" style={{ color: 'var(--color-premium-green-500)' }}>
                  +{formatCash(referralCreditsJustEarned * progressionConfig.referralBonusCoins)}
                </div>
                <button
                  onClick={clearReferralCreditsJustEarned}
                  className="w-full mt-4 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer"
                  style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
                >
                  Nice!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {signupReferralBonusEarned && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative w-full max-w-[340px] p-6 rounded-3xl text-center flex flex-col items-center glossy-3d"
              >
                <CoinBurst count={12} emoji="🎁" />
                <div className="text-5xl mb-2">🎁</div>
                <div className="font-bold text-[17px]" style={{ color: 'var(--color-premium-text)' }}>
                  Welcome bonus!
                </div>
                <div className="font-bold text-[22px] mt-1" style={{ color: 'var(--color-premium-green-500)' }}>
                  +{formatCash(progressionConfig.referralBonusCoins)}
                </div>
                <button
                  onClick={clearSignupReferralBonusEarned}
                  className="w-full mt-4 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer"
                  style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
                >
                  Let's go!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>



        {/* 4. UNIFIED MILESTONE CELEBRATION — level-up, district-completion,
            and achievement-unlock all render through this one component now.
            Previously two separate, nearly-identical modals differing only
            in icon/color/text; consolidated so any future Milestone-tier
            trigger reuses this directly instead of copy-pasting a third. */}
        <AnimatePresence>
          {milestone && !poolClaimUI && (
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-x-8 top-1/3 z-50 p-5 rounded-3xl text-center flex flex-col items-center overflow-visible"
              style={{
                backgroundColor: 'var(--color-premium-surface)',
                border: `2px solid var(--color-premium-${milestone.color === 'gold' ? 'gold-400' : 'green-500'})`,
              }}
            >
              {showConfetti && <Confetti />}

              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-3"
                style={{
                  backgroundColor: 'var(--color-premium-elevated)',
                  border: `2px solid var(--color-premium-${milestone.color === 'gold' ? 'gold-400' : 'green-500'})`,
                }}
              >
                {milestone.icon}
              </div>
              <h2
                className="font-bold text-base uppercase tracking-widest"
                style={{ color: `var(--color-premium-${milestone.color === 'gold' ? 'gold-400' : 'green-500'})` }}
              >
                {milestone.title}
              </h2>
              <p className="text-[11px] font-medium leading-relaxed mt-2" style={{ color: 'var(--color-premium-text)' }}>
                {milestone.message}
              </p>
              <div className="mt-3.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-premium-green-500)' }}>
                {milestone.bonusText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null | 'checking'>('checking');
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => setAuthUser(user));
    // Completes a redirect-based sign-in (the standalone-PWA / popup-
    // blocked fallback) if one just happened — the auth state listener
    // above already picks up a *successful* one on its own, this is
    // specifically what surfaces a failure instead of a silent dead end.
    checkRedirectResult().then(({ error }) => {
      if (error) setRedirectError(error);
    });
    return unsubscribe;
  }, []);

  if (authUser === 'checking') {
    return (
      <div className="app-shell-height md:min-h-screen w-full bg-gradient-to-br from-[#faf6f0] via-[#f4e7d3] to-[#e6d3b4] flex flex-col items-center justify-center p-0 md:p-6">
        <div className="app-shell-height relative w-full md:h-[880px] md:max-w-[420px] bg-[var(--color-ink-900)] md:rounded-[42px] md:border-[10px] md:border-[#0a2e4a] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-premium-gold-400)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="app-shell-height md:min-h-screen w-full bg-gradient-to-br from-[#faf6f0] via-[#f4e7d3] to-[#e6d3b4] flex flex-col items-center justify-center p-0 md:p-6">
        <div className="app-shell-height relative w-full md:h-[880px] md:max-w-[420px] bg-[var(--color-ink-900)] md:rounded-[42px] md:border-[10px] md:border-[#0a2e4a] overflow-hidden">
          <LoginScreen onSignedIn={() => {}} initialError={redirectError} />
        </div>
      </div>
    );
  }

  return (
    <DistrictProvider key={authUser.uid} currentUid={authUser.uid}>
      <AppInner key={authUser.uid} currentUid={authUser.uid} />
    </DistrictProvider>
  );
}
