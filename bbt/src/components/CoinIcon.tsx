import React from 'react';

/**
 * The one coin icon used everywhere cash appears — header, cards, bubbles,
 * buttons. Every top idle/tycoon game (Idle Miner Tycoon, AdVenture
 * Capitalist, Coin Master) repeats a single currency glyph rather than
 * mixing icon styles per screen; this is that glyph for Basti.
 *
 * `premium`: opt-in variant consuming the premium design system's gold
 * tokens, used only by the new Home Screen components. Default rendering
 * (no prop passed) is completely unchanged for every other existing
 * consumer (StreetView, Profile, Leaderboard, etc.) — this file does not
 * redesign the original icon, it adds an alternate one alongside it.
 */
export const CoinIcon: React.FC<{ className?: string; muted?: boolean; premium?: boolean }> = ({ className = "w-4 h-4", muted = false, premium = false }) => {
  if (premium) {
    return (
      <svg viewBox="0 0 24 24" className={`${className} inline-block`} fill="none">
        <circle cx="12" cy="12" r="10" fill="var(--color-premium-gold-400)" stroke="var(--color-premium-gold-600)" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7" fill="none" stroke="var(--color-premium-gold-100)" strokeWidth="1.2" strokeDasharray="2.5,2.5" />
        <text x="12" y="16.5" fontSize="11" fontWeight="900" textAnchor="middle" fill="var(--color-premium-text-inverse)">₹</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={`${className} inline-block`} fill="none">
      <circle cx="12" cy="12" r="10" fill={muted ? "#B4AFA5" : "#F5891E"} stroke={muted ? "#8a8478" : "#DD6B0C"} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" fill="none" stroke={muted ? "#8a8478" : "#FFC968"} strokeWidth="1.2" strokeDasharray="2.5,2.5" />
      <text x="12" y="16.5" fontSize="11" fontWeight="900" textAnchor="middle" fill={muted ? "#8a8478" : "#7A3B04"}>₹</text>
    </svg>
  );
};
