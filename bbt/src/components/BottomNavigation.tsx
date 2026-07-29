import React from 'react';
import { motion } from 'motion/react';
import { Home, Map, Trophy, User } from 'lucide-react';
import { playClick } from '../utils/audio';

interface BottomNavigationProps {
  activeTab: 'home' | 'city' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'home' | 'city' | 'leaderboard' | 'profile') => void;
}

/**
 * A floating pill tab bar. Instead of a rectangular "active" fill
 * stretching across icon+label (the generic app-shell pattern), the
 * active tab gets a small round coral "stamp" behind just its icon —
 * closer to a postmark stamped onto a boarding pass than a filled nav
 * segment.
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'city', label: 'City', icon: Map },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'profile', label: 'Trip', icon: User },
  ] as const;

  const handleTabClick = (tabId: 'home' | 'city' | 'leaderboard' | 'profile') => {
    playClick();
    setActiveTab(tabId);
  };

  return (
    <div
      className="absolute inset-x-3 z-40 select-none"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="glossy-3d rounded-[24px] py-2 px-2.5 flex flex-nowrap items-center gap-1">

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl cursor-pointer focus:outline-none min-h-[50px]"
            >
              <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                {isActive && (
                  <motion.div
                    layoutId="activeTabStamp"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: 'var(--color-postcard-coral)', border: '2px solid var(--color-postcard-ink)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <div className="relative z-10" style={{ color: isActive ? '#FFFFFF' : 'var(--color-premium-text-secondary)' }}>
                  <Icon size={16} strokeWidth={2.5} />
                </div>
              </div>

              <span
                className="text-premium-label relative z-10"
                style={{ color: isActive ? 'var(--color-postcard-coral)' : 'var(--color-premium-text-secondary)' }}
              >
                {tab.label}
              </span>

              {tab.id === 'leaderboard' && !isActive && (
                <span className="absolute top-1 right-6 w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--color-postcard-coral)' }}></span>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
};
