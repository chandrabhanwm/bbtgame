import { Business, PlayerStats, RewardCard } from '../types';
import { signOutUser } from '../firebase/config';
import { getLegacyStatus } from '../utils/legacy';
import { generateDailyGoal } from '../utils/dailyGoal';
import { getEmpireTotalInvested } from '../utils/districtProgress';

interface MilestoneState {
  icon: string;
  title: string;
  message: string;
  bonusText: string;
  color: 'gold' | 'green';
}

interface UseAccountActionsParams {
  stats: PlayerStats;
  businessesByDistrict: Record<string, Business[]>;
  cashRef: React.MutableRefObject<number>;
  setBusinessesByDistrict: (v: Record<string, Business[]>) => void;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  setMilestone: (m: MilestoneState | null) => void;
  setPreviewDistrictId: (v: string | null) => void;
  setActiveTab: (tab: 'home' | 'city' | 'leaderboard' | 'profile') => void;
  resetDistricts: () => void;
  seedAllDistricts: () => Record<string, Business[]>;
  generateFreshRewardCards: () => RewardCard[];
  playLevelUp: () => void;
  playClick: () => void;
}

/**
 * Every drastic, whole-account action — sign out, the manual "rebuild
 * from scratch" reset, and Legacy (the voluntary reset that keeps your
 * achievements and Legacy Points). Extracted out of App.tsx as its own
 * domain per the Phase 0 architecture cleanup. Behavior preserved
 * exactly; this is a relocation, not a rewrite.
 */
export function useAccountActions({
  stats, businessesByDistrict, cashRef, setBusinessesByDistrict, setStats, setMilestone,
  setPreviewDistrictId, setActiveTab, resetDistricts, seedAllDistricts, generateFreshRewardCards, playLevelUp, playClick,
}: UseAccountActionsParams) {
  /** Signs the player out entirely — returns them to the required login
   *  screen. Their progress is already safely in the cloud under their
   *  account, so signing back in with the same Google account brings
   *  it right back. */
  const handleSignOut = () => {
    if (confirm('Sign out? You can sign back in with the same Google account to get your progress back.')) {
      signOutUser();
    }
  };

  // Reset progress option
  const handleResetProgress = () => {
    playClick();
    if (confirm("Are you sure you want to rebuild your empire from scratch? This resets your cash to ₹50,000.")) {
      setBusinessesByDistrict(seedAllDistricts());
      cashRef.current = 50000;
      setStats({
        cash: 50000,
        profitPerMin: 0,
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
        dailyGoal: generateDailyGoal('badeban', seedAllDistricts()),
        unlockedAchievementIds: [],
        legacyCount: 0,
        legacyPoints: 0,
        profitTapHintShownCount: 0,
        lastProfitDoubleClaimAt: 0,
        lastCardClaimAt: 0,
      });
      resetDistricts();
      setPreviewDistrictId(null);
      setActiveTab('home');
    }
  };

  /** Legacy — the voluntary reset. Only actually resets if eligible;
   *  callers (the UI) should already be gating the button on this, but
   *  the check lives here too so it can never be bypassed. Cash,
   *  businesses, district unlock progress, and current daily systems all
   *  reset. Legacy Points, achievements, and lifetime profile stats do
   *  not — that's the entire point of Legacy over the panic-button reset
   *  above. */
  const handleEstablishLegacy = () => {
    const netWorth = stats.cash + getEmpireTotalInvested(businessesByDistrict);
    const status = getLegacyStatus(netWorth, stats.legacyCount);
    if (!status.eligible) return;

    if (!confirm(`Establish your Legacy?\n\nYou'll restart from the beginning with +${status.previewPoints} Legacy Points (permanent +${status.previewPoints}% income, forever). This resets your cash, businesses, and districts — but keeps your achievements and Legacy Points.`)) {
      return;
    }

    playLevelUp();
    setBusinessesByDistrict(seedAllDistricts());
    cashRef.current = 50000;
    setStats((prev) => ({
      ...prev,
      cash: 50000,
      profitPerMin: 0,
      poolCash: 0,
      lastPoolClaimAt: Date.now(),
      hasMadeFirstPurchase: false,
      hasMadeFirstUpgrade: false,
      legacyCount: prev.legacyCount + 1,
      legacyPoints: prev.legacyPoints + status.previewPoints,
      // Deliberately NOT reset: unlockedAchievementIds, dailyGoal,
      // rewardCards, lastCardsResetAt, level, xp, rank — Legacy resets
      // your empire, not your daily systems or your recognition.
    }));
    resetDistricts();
    setPreviewDistrictId(null);
    setActiveTab('home');
    setMilestone({
      icon: '🌟',
      title: 'Legacy Established!',
      message: 'You restart your empire, wiser than before.',
      bonusText: `+${status.previewPoints} Legacy Points — permanent +${status.previewPoints}% income`,
      color: 'gold',
    });
  };

  return { handleSignOut, handleResetProgress, handleEstablishLegacy };
}
