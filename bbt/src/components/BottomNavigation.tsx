import React from 'react';
import { motion } from 'motion/react';
import { Home, Map, Trophy, User } from 'lucide-react';
import { playClick } from '../utils/audio';

interface BottomNavigationProps {
  activeTab: 'home' | 'city' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'home' | 'city' | 'leaderboard' | 'profile') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'city', label: 'City', icon: Map },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'profile', label: 'Portfolio', icon: User },
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
      <div className="glossy-3d rounded-2xl py-2 px-2 flex flex-nowrap items-center gap-1">

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer focus:outline-none min-h-[48px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: 'var(--color-premium-gold-400)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}

              <div className="relative z-10" style={{ color: isActive ? 'var(--color-premium-text-inverse)' : 'var(--color-premium-text-secondary)' }}>
                <Icon size={16} strokeWidth={2.5} />
              </div>

              <span
                className="text-[8.5px] font-bold tracking-widest uppercase mt-1 relative z-10"
                style={{ color: isActive ? 'var(--color-premium-text-inverse)' : 'var(--color-premium-text-secondary)' }}
              >
                {tab.label}
              </span>

              {tab.id === 'leaderboard' && !isActive && (
                <span className="absolute top-1.5 right-6 w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--color-premium-red-400)' }}></span>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
};
