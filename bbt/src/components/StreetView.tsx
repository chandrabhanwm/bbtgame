import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles } from 'lucide-react';
import { Business } from '../types';
import { playCoin, playClick } from '../utils/audio';

interface StreetViewProps {
  businesses: Business[];
  cash: number;
  districtLabel: string;
  onSelectShop: (id: string) => void;
  onReward: (amount: number) => void;
  /** Locked-district preview mode: every shop renders as not-yet-owned
   *  (buy price shown, not level), coin bubbles never spawn, and taps still
   *  open the shop's detail sheet but with all actions disabled there.
   *  Purely a rendering lens over the same `businesses` array — nothing is
   *  mutated or persisted differently. */
  readOnly?: boolean;
}

interface CoinBubble {
  id: string;
  businessId: string;
  amount: number;
}

interface TextFloat {
  id: string;
  text: string;
  bizId: string;
  color: string;
}

export const StreetView: React.FC<StreetViewProps> = ({
  businesses,
  cash,
  districtLabel,
  onSelectShop,
  onReward,
  readOnly = false
}) => {
  // Read-only preview lens: same businesses, same ids, same buy prices —
  // only the level/status shown is forced to "not yet owned" so a district's
  // pre-seeded starter shop (level 1 by default, ready for real play once
  // unlocked) doesn't appear buyable/ownable while merely being previewed.
  // This is a render-time view, not a new data object or a mutation of the
  // real array — `businesses` itself is untouched.
  const displayBusinesses = readOnly
    ? businesses.map((b) => ({ ...b, level: 0, status: 'locked' as const }))
    : businesses;

  const [activeBubbles, setActiveBubbles] = useState<Record<string, CoinBubble>>({});
  const [textFloats, setTextFloats] = useState<TextFloat[]>([]);
  const [bouncingShopId, setBouncingShopId] = useState<string | null>(null);

  const prevLevelsRef = useRef<Record<string, number>>({});
  
  // Set constant theme style to day
  const timeOfDay = 'day';

  // Monitor upgrades to trigger bouncing effects & flying badges
  useEffect(() => {
    if (readOnly) return; // preview mode: nothing is ever bought/upgraded here
    businesses.forEach((biz) => {
      const prevLevel = prevLevelsRef.current[biz.id];
      if (prevLevel !== undefined && biz.level > prevLevel) {
        const isUnlock = prevLevel === 0;
        setBouncingShopId(biz.id);
        setTimeout(() => setBouncingShopId(null), 800);

        // Add float text
        const textId = Math.random().toString();
        const newFloat: TextFloat = {
          id: textId,
          bizId: biz.id,
          text: isUnlock ? '🎉 OPEN!' : `⚡️ LVL ${biz.level}!`,
          color: isUnlock ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'
        };
        setTextFloats((prev) => [...prev, newFloat]);
        setTimeout(() => {
          setTextFloats((prev) => prev.filter((t) => t.id !== textId));
        }, 1500);
      }
      prevLevelsRef.current[biz.id] = biz.level;
    });
  }, [businesses, readOnly]);

  // Generate coin bubbles over unlocked shops passively
  useEffect(() => {
    if (readOnly) return; // preview mode: nothing is ever collectible here
    const interval = setInterval(() => {
      // Find unlocked shops that do not currently have a bubble active
      const eligible = businesses.filter(b => b.level > 0 && !activeBubbles[b.id]);
      if (eligible.length === 0) return;

      // Select random eligible business and spawn a bubble (40% probability)
      if (Math.random() < 0.5) {
        const selected = eligible[Math.floor(Math.random() * eligible.length)];
        const rewardAmt = Math.max(120, Math.round(selected.profitPerMin / 2));
        
        setActiveBubbles(prev => ({
          ...prev,
          [selected.id]: {
            id: Math.random().toString(),
            businessId: selected.id,
            amount: rewardAmt
          }
        }));
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [businesses, activeBubbles, readOnly]);

  const handleCollectBubble = (bizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return; // preview mode: nothing is collectible here

    // Check-and-remove happen in the same functional update, so a second
    // tap arriving before React re-renders (the bubble hasn't visually
    // disappeared yet) still sees an already-emptied slot for this bizId
    // and is correctly ignored, instead of collecting the same bubble twice.
    let collectedAmount: number | null = null;
    setActiveBubbles(prev => {
      const bubble = prev[bizId];
      if (!bubble) return prev; // nothing here — duplicate/late tap, ignore
      collectedAmount = bubble.amount;
      const copy = { ...prev };
      delete copy[bizId];
      return copy;
    });

    if (collectedAmount === null) return; // ignore repeated taps

    playCoin();
    onReward(collectedAmount);

    // Add immediate "+₹X" floating text above the clicked shop
    const textId = Math.random().toString();
    const newFloat: TextFloat = {
      id: textId,
      bizId,
      text: `+₹${collectedAmount.toLocaleString('en-IN')}`,
      color: 'text-yellow-400 font-extrabold'
    };
    setTextFloats((prev) => [...prev, newFloat]);
    setTimeout(() => {
      setTextFloats((prev) => prev.filter((t) => t.id !== textId));
    }, 1500);
  };

  const skyBackground = 'from-sky-300 via-sky-100 to-amber-50';
  const ambientLight = 'brightness-100 contrast-100';

  // Helper to map 8 businesses into 4 columns
  const columns = [
    { topIdx: 0, bottomIdx: 1 },
    { topIdx: 2, bottomIdx: 3 },
    { topIdx: 4, bottomIdx: 5 },
    { topIdx: 6, bottomIdx: 7 }
  ];

  return (
    <div id="street-view-container" className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border-[2.5px] border-[var(--color-ink-900)] shadow-[0_5px_0_var(--color-ink-900)] select-none">

      <div className="absolute top-3 left-3 z-30 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 border-2 border-[var(--color-ink-900)] text-[9px] font-extrabold text-[var(--color-ink-900)]">
        <Sparkles size={10} className="animate-pulse text-[var(--color-marigold-500)]" />
        <span>{districtLabel.toUpperCase()}</span>
      </div>

      {/* Main Map Box Container — fills whatever height the parent gives it, since this is now the hero of the home screen, not a fixed-height card */}
      <div className={`relative w-full flex-1 min-h-0 bg-gradient-to-b ${skyBackground} transition-all duration-1000 flex flex-col justify-between p-3 pt-10`}>
        
        {/* Festive Hanging Triangular Flags Bunting */}
        <div className="absolute inset-x-0 top-0 h-6 pointer-events-none z-20 overflow-hidden opacity-80">
          <svg className="w-full h-full" viewBox="0 0 400 24" preserveAspectRatio="none">
            <path d="M 0,2 Q 50,8 100,2 Q 150,8 200,2 Q 250,8 300,2 Q 350,8 400,2" fill="none" stroke="#e2e8f0" strokeWidth="0.75" />
            {[...Array(12)].map((_, i) => {
              const x = i * 33 + 12;
              const colors = ['#f43f5e', '#fbbf24', '#38bdf8', '#34d399', '#fb7185', '#fb923c'];
              const color = colors[i % colors.length];
              return (
                <polygon key={i} points={`${x},4 ${x + 10},4 ${x + 5},14`} fill={color} />
              );
            })}
          </svg>
        </div>

        {/* Elegant village landscape horizon backdrop (Subtle sand hills, tiny huts, and banyan trees) */}
        <div className="absolute inset-x-0 bottom-24 h-28 pointer-events-none z-0 opacity-45">
          <svg viewBox="0 0 400 120" className="w-full h-full" fill="none" preserveAspectRatio="none">
            {/* Distant hills */}
            <path d="M-20,100 Q60,70 140,90 Q220,110 320,80 Q380,65 420,85 L420,120 L-20,120 Z" fill="#edd6b1" />
            <path d="M-20,110 Q110,85 220,105 Q310,95 420,105 L420,120 L-20,120 Z" fill="#dfc39a" />
            
            {/* Tiny stylized palm trees and huts silhouettes */}
            <g transform="translate(110, 80) scale(0.6)" fill="#cba97c">
              {/* Hut */}
              <polygon points="10,15 25,5 40,15" />
              <rect x="13" y="15" width="24" height="15" />
              {/* Palm tree */}
              <path d="M55,30 Q53,15 50,0" stroke="#cba97c" strokeWidth="2" />
              <path d="M50,0 Q40,-5 35,5 Q45,-2 50,0" />
              <path d="M50,0 Q50,-10 52,-10 Q51,-3 50,0" />
              <path d="M50,0 Q60,-5 65,5 Q55,-2 50,0" />
            </g>
            
            <g transform="translate(280, 70) scale(0.5)" fill="#cba97c">
              {/* Palm tree */}
              <path d="M55,30 Q53,15 50,0" stroke="#cba97c" strokeWidth="2" />
              <path d="M50,0 Q40,-5 35,5 Q45,-2 50,0" />
              <path d="M50,0 Q60,-5 65,5 Q55,-2 50,0" />
            </g>
          </svg>
        </div>

        {/* 2-SIDED STREET LAYOUT GRID (4 Columns) */}
        <div className={`grid grid-cols-4 gap-2 h-full w-full items-stretch relative z-10 ${ambientLight} transition-all duration-1000`}>
          
          {columns.map((col, colIdx) => {
            const topBiz = displayBusinesses[col.topIdx];
            const bottomBiz = displayBusinesses[col.bottomIdx];

            const isComplex = col.bottomIdx === 7;
            const isBottomLocked = bottomBiz.level === 0;

            return (
              <div key={colIdx} className="flex flex-col justify-between items-center h-full relative">
                
                {/* 1. TOP SIDE BUSINESS (Far Side of Street) */}
                <div 
                  className="w-full flex flex-col items-center justify-end relative h-[140px] cursor-pointer"
                  onClick={() => {
                    playClick();
                    onSelectShop(topBiz.id);
                  }}
                >
                  {/* Floating active coin bubble */}
                  {activeBubbles[topBiz.id] && (
                    <motion.button
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 z-30 flex flex-col items-center justify-center cursor-pointer"
                      onClick={(e) => handleCollectBubble(topBiz.id, e)}
                    >
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-[1.5px] border-white shadow-[0_3px_8px_rgba(234,179,8,0.5)]">
                        <span className="font-display font-extrabold text-white text-xs leading-none">₹</span>
                        <div className="absolute -inset-[2px] border border-dashed border-amber-300/40 rounded-full animate-spin"></div>
                      </div>
                    </motion.button>
                  )}

                  {/* Level up / Unlock labels */}
                  <AnimatePresence>
                    {textFloats.filter(t => t.bizId === topBiz.id).map(tf => (
                      <motion.div
                        key={tf.id}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -30, scale: [0.8, 1.15, 1.15, 0.9] }}
                        transition={{ duration: 1.4 }}
                        className={`absolute z-30 pointer-events-none text-[8px] font-extrabold uppercase tracking-wider text-center bg-slate-900/90 border border-slate-700/50 px-1.5 py-0.5 rounded shadow ${tf.color}`}
                      >
                        {tf.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Top Signboard (Bilingual) */}
                  <div className="w-full flex flex-col items-center select-none pointer-events-none mb-1.5">
                    <div className={`w-full max-w-[76px] px-1 py-0.5 rounded-[3px] border shadow-xs flex flex-col items-center justify-center text-center transition-all duration-300 ${
                      topBiz.level === 0 ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-slate-950 text-white'
                    }`}
                    style={{
                      borderColor: topBiz.level === 0 ? '#475569' : topBiz.themeColor,
                      boxShadow: topBiz.level === 0 ? 'none' : `0 2px 4px rgba(0,0,0,0.35), 0 0 5px ${topBiz.themeColor}30`
                    }}>
                      {topBiz.name.includes(' • ') ? (
                        <span className={`block font-sans text-[6.5px] font-extrabold leading-none ${
                          topBiz.level === 0 ? 'text-amber-500/80' : 'text-amber-300'
                        }`}>
                          {topBiz.name.split(' • ')[1]}
                        </span>
                      ) : null}
                      <span className={`block font-display text-[6.5px] font-extrabold uppercase tracking-wider truncate max-w-full leading-none mt-0.5 ${
                        topBiz.level === 0 ? 'text-slate-300' : 'text-white'
                      }`}>
                        {topBiz.name.includes(' • ') ? topBiz.name.split(' • ')[0] : topBiz.name}
                      </span>
                    </div>
                  </div>

                  {/* Level Badges */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-20 bottom-0.5 px-1 rounded bg-[#0b1b36]/90 border border-[#1b345e] text-[6.5px] font-bold text-slate-300 uppercase tracking-wider">
                    {topBiz.level === 0 ? `₹${topBiz.cost >= 1000 ? `${(topBiz.cost/1000).toFixed(0)}K` : topBiz.cost}` : `Lvl ${topBiz.level}`}
                  </div>

                  {/* Shop Graphic vector representation - ALWAYS visible isometric shop for top row */}
                  <div className={`w-full max-w-[70px] aspect-square transition-all duration-300 ${
                    bouncingShopId === topBiz.id ? 'scale-110 duration-100' : 'hover:scale-105'
                  }`}>
                    <IsometricShopSVG biz={topBiz} isLocked={false} timeOfDay={timeOfDay} index={col.topIdx} />
                  </div>
                </div>

                {/* 2. THE CENTRAL MAIN STREET ROAD STRIP (Connects horizontally) */}
                <div className="w-full h-8 bg-slate-800 relative border-y border-slate-700/60 flex items-center justify-center my-1">
                  
                  {/* Central dashes divider lane line */}
                  <div className="absolute inset-x-0 h-0.5 border-t border-dashed border-yellow-500/60 top-1/2 -translate-y-1/2"></div>
                  
                  {/* Static native bazaar vehicle placement (decorations) */}
                  {colIdx === 0 && (
                    <div className="absolute left-2 scale-75 opacity-90 z-20 pointer-events-none">
                      <VehicleSprite type="rickshaw" timeOfDay={timeOfDay} />
                    </div>
                  )}

                  {colIdx === 1 && (
                    <div className="absolute right-3 scale-60 opacity-80 z-20 pointer-events-none">
                      <StreetLight timeOfDay={timeOfDay} />
                    </div>
                  )}

                  {colIdx === 2 && (
                    <div className="absolute left-4 scale-75 opacity-90 z-20 pointer-events-none">
                      <VehicleSprite type="auto" timeOfDay={timeOfDay} />
                    </div>
                  )}

                  {colIdx === 3 && (
                    <div className="absolute right-2 scale-60 opacity-80 z-20 pointer-events-none">
                      <StreetTree />
                    </div>
                  )}
                </div>

                {/* 3. BOTTOM SIDE BUSINESS (Near Side of Street) */}
                <div 
                  className="w-full flex flex-col items-center justify-start relative h-[140px] cursor-pointer"
                  onClick={() => {
                    playClick();
                    onSelectShop(bottomBiz.id);
                  }}
                >
                  {/* Shop Graphic vector representation - COMPLEX remains empty plot when locked, others are always visible */}
                  <div className={`w-full max-w-[70px] aspect-square mb-1.5 transition-all duration-300 ${
                    bouncingShopId === bottomBiz.id ? 'scale-110 duration-100' : 'hover:scale-105'
                  } ${(isComplex && isBottomLocked) ? 'opacity-40 grayscale' : ''}`}>
                    {(isComplex && isBottomLocked) ? (
                      <EmptyPlotSVG name={bottomBiz.name} cost={bottomBiz.cost} index={col.bottomIdx} timeOfDay={timeOfDay} />
                    ) : (
                      <IsometricShopSVG biz={bottomBiz} isLocked={false} timeOfDay={timeOfDay} index={col.bottomIdx} />
                    )}
                  </div>

                  {/* Level Badges */}
                  <div className={`absolute left-1/2 -translate-x-1/2 z-20 ${(isComplex && isBottomLocked) ? 'top-8' : 'top-[68px]'} px-1 rounded bg-[#0b1b36]/90 border border-[#1b345e] text-[6.5px] font-bold text-slate-300 uppercase tracking-wider`}>
                    {bottomBiz.level === 0 ? `₹${bottomBiz.cost >= 1000 ? `${(bottomBiz.cost/1000).toFixed(0)}K` : bottomBiz.cost}` : `Lvl ${bottomBiz.level}`}
                  </div>

                  {/* Bottom Signboard (Bilingual) */}
                  <div className="w-full flex flex-col items-center select-none pointer-events-none mt-1.5">
                    <div className={`w-full max-w-[76px] px-1 py-0.5 rounded-[3px] border shadow-xs flex flex-col items-center justify-center text-center transition-all duration-300 ${
                      (isComplex && isBottomLocked) ? 'bg-slate-900/65 border-slate-700 text-slate-500' : bottomBiz.level === 0 ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-slate-950 text-white'
                    }`}
                    style={{
                      borderColor: (isComplex && isBottomLocked) ? '#475569' : bottomBiz.level === 0 ? '#475569' : bottomBiz.themeColor,
                      boxShadow: (isComplex && isBottomLocked) ? 'none' : bottomBiz.level === 0 ? 'none' : `0 2px 4px rgba(0,0,0,0.35), 0 0 5px ${bottomBiz.themeColor}30`
                    }}>
                      {bottomBiz.name.includes(' • ') ? (
                        <span className={`block font-sans text-[6.5px] font-extrabold leading-none ${
                          (isComplex && isBottomLocked) ? 'text-slate-600' : bottomBiz.level === 0 ? 'text-amber-500/80' : 'text-amber-300'
                        }`}>
                          {bottomBiz.name.split(' • ')[1]}
                        </span>
                      ) : null}
                      <span className={`block font-display text-[6.5px] font-extrabold uppercase tracking-wider truncate max-w-full leading-none mt-0.5 ${
                        (isComplex && isBottomLocked) ? 'text-slate-500' : 'text-white'
                      }`}>
                        {bottomBiz.name.includes(' • ') ? bottomBiz.name.split(' • ')[0] : bottomBiz.name}
                      </span>
                    </div>
                  </div>

                  {/* Floating active coin bubble */}
                  {activeBubbles[bottomBiz.id] && (
                    <motion.button
                      initial={{ scale: 0, y: -10 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-0 z-30 flex flex-col items-center justify-center cursor-pointer"
                      onClick={(e) => handleCollectBubble(bottomBiz.id, e)}
                    >
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-[1.5px] border-white shadow-[0_3px_8px_rgba(234,179,8,0.5)]">
                        <span className="font-display font-extrabold text-white text-xs leading-none">₹</span>
                        <div className="absolute -inset-[2px] border border-dashed border-amber-300/40 rounded-full animate-spin"></div>
                      </div>
                    </motion.button>
                  )}

                  {/* Level up / Unlock labels */}
                  <AnimatePresence>
                    {textFloats.filter(t => t.bizId === bottomBiz.id).map(tf => (
                      <motion.div
                        key={tf.id}
                        initial={{ opacity: 0, y: -10, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -45, scale: [0.8, 1.15, 1.15, 0.9] }}
                        transition={{ duration: 1.4 }}
                        className={`absolute z-30 pointer-events-none text-[8px] font-extrabold uppercase tracking-wider text-center bg-slate-900/90 border border-slate-700/50 px-1.5 py-0.5 rounded shadow ${tf.color}`}
                      >
                        {tf.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                </div>

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------------------------
// COMPONENT: EmptyPlotSVG
// Draws a beautiful dirt foundation plot with safety fences and a wood "FOR SALE" sign
// --------------------------------------------------------------------------------------------------
const EmptyPlotSVG: React.FC<{ name: string; cost: number; index: number; timeOfDay: 'day' | 'sunset' | 'night' }> = ({ name, cost, index, timeOfDay }) => {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-auto drop-shadow-sm select-none">
      {/* Dirt Mound */}
      <polygon 
        points="10,100 60,75 110,100 60,125" 
        fill={timeOfDay === 'night' ? '#221f1a' : timeOfDay === 'sunset' ? '#3d3428' : '#544634'} 
        stroke={timeOfDay === 'night' ? '#181613' : '#453a2b'}
        strokeWidth="1"
      />
      <polygon points="10,100 60,125 60,131 10,106" fill="#352c20" />
      <polygon points="60,125 110,100 110,106 60,131" fill="#292218" />

      {/* Little green grass weeds */}
      <polygon points="20,93 28,89 32,93 24,97" fill="#166534" opacity="0.6" />
      <polygon points="78,93 84,89 88,93 82,97" fill="#15803d" opacity="0.5" />

      {/* Security Fence Left */}
      <line x1="14" y1="98" x2="52" y2="117" stroke="#92400e" strokeWidth="1.5" />
      <line x1="14" y1="93" x2="52" y2="112" stroke="#92400e" strokeWidth="1.5" />
      <line x1="20" y1="95" x2="20" y2="103" stroke="#92400e" strokeWidth="1.5" />
      <line x1="40" y1="105" x2="40" y2="113" stroke="#92400e" strokeWidth="1.5" />

      {/* Security Fence Right */}
      <line x1="68" y1="117" x2="106" y2="98" stroke="#92400e" strokeWidth="1.5" />
      <line x1="68" y1="112" x2="106" y2="93" stroke="#92400e" strokeWidth="1.5" />
      <line x1="82" y1="110" x2="82" y2="118" stroke="#92400e" strokeWidth="1.5" />
      <line x1="100" y1="101" x2="100" y2="109" stroke="#92400e" strokeWidth="1.5" />

      {/* Sale Board Sign */}
      <g transform="translate(60, 82)">
        <rect x="-1.5" y="0" width="3" height="20" fill="#78350f" />
        <rect x="-22" y="-14" width="44" height="15" fill="#fef3c7" stroke="#d97706" strokeWidth="1" rx="1.5" />
        <text x="0" y="-8" fill="#78350f" fontSize="4.5" fontWeight="900" textAnchor="middle">
          FOR SALE
        </text>
        <text x="0" y="-2" fill="#b45309" fontSize="3.5" fontWeight="bold" textAnchor="middle">
          ₹{cost >= 1000000 ? `${(cost/1000000).toFixed(1)}M` : cost >= 1000 ? `${(cost/1000).toFixed(0)}K` : cost}
        </text>
      </g>
    </svg>
  );
};

// --------------------------------------------------------------------------------------------------
// COMPONENT: IsometricShopSVG
// Draws visual upgrades (Lvl 1-4 tiny, Lvl 5-9 medium, Lvl 10+ premium) for each business type
// --------------------------------------------------------------------------------------------------
interface IsometricShopSVGProps {
  biz: Business;
  isLocked: boolean;
  timeOfDay: 'day' | 'sunset' | 'night';
  index: number;
}

const IsometricShopSVG: React.FC<IsometricShopSVGProps> = ({ biz, isLocked, timeOfDay, index }) => {
  const accent = biz.themeColor;
  const darkAccent = adjustHexColor(accent, -25);
  const shadowAccent = adjustHexColor(accent, -45);
  const isNight = timeOfDay === 'night';

  const levelToUse = biz.level === 0 ? 1 : biz.level;
  const isLvl1_4 = levelToUse >= 1 && levelToUse < 5;
  const isLvl5_9 = levelToUse >= 5 && levelToUse < 10;
  const isLvl10 = levelToUse >= 10;

  return (
    <svg 
      viewBox="0 0 120 140" 
      className="w-full h-auto drop-shadow-lg select-none"
    >
      {/* GROUND LAWN EMBARKMENT */}
      <polygon 
        points="10,100 60,75 110,100 60,125" 
        fill={timeOfDay === 'night' ? '#113c23' : timeOfDay === 'sunset' ? '#14502d' : '#1c7841'} 
        stroke={timeOfDay === 'night' ? '#0a2114' : '#145c31'}
        strokeWidth="1.5"
      />
      <polygon points="10,100 60,125 60,132 10,107" fill="#13472a" />
      <polygon points="60,125 110,100 110,107 60,132" fill="#0d351e" />

      {/* Pathway to door */}
      <polygon points="45,106 60,98 75,106 60,114" fill="#475569" opacity="0.7" />

      {/* Traditional Marigold Flower Garland (गेंदा फूल माला) decoration draped on the active shop front */}
      {!isLocked && (
        <g className="pointer-events-none opacity-90 select-none">
          {[...Array(9)].map((_, i) => {
            const ratio = i / 8;
            const x = 20 + ratio * 40;
            const y = 53 - ratio * 20 + Math.sin(ratio * Math.PI) * 4;
            const color = i % 2 === 0 ? '#f97316' : '#eab308';
            return <circle key={`ml-${i}`} cx={x} cy={y} r="2.2" fill={color} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />;
          })}
          {[...Array(9)].map((_, i) => {
            const ratio = i / 8;
            const x = 60 + ratio * 40;
            const y = 33 + ratio * 20 + Math.sin(ratio * Math.PI) * 4;
            const color = i % 2 === 0 ? '#f97316' : '#eab308';
            return <circle key={`mr-${i}`} cx={x} cy={y} r="2.2" fill={color} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />;
          })}
        </g>
      )}

      {/* CHIMNEY SMOKE (Active for Tea Stall [0], Bakery [1], Restaurant [4] if built) */}
      {!isLocked && (index === 0 || index === 1 || index === 4) && (
        <g>
          <circle cx="34" cy="22" r="1.5" fill="#ffffff" opacity="0.6">
            <animate attributeName="cy" values="22;5" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.5;4.5" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="34" cy="22" r="1.5" fill="#ffffff" opacity="0.4">
            <animate attributeName="cy" values="22;8" dur="1.5s" begin="0.7s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.5;3.5" dur="1.5s" begin="0.7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0" dur="1.5s" begin="0.7s" repeatCount="indefinite" />
          </circle>
          <rect x="31.5" y="24" width="5" height="14" fill="#475569" />
          <polygon points="29.5,24 38.5,24 40,21 28,21" fill="#1e293b" />
        </g>
      )}

      {/* Blinking glowing green cross for Medical Store [3] */}
      {!isLocked && index === 3 && (
        <g className="animate-pulse">
          <circle cx="60" cy="15" r="7.5" fill="#10b981" opacity="0.3" />
          <rect x="58.5" y="11" width="3" height="8" fill="#10b981" />
          <rect x="56" y="13.5" width="8" height="3" fill="#10b981" />
        </g>
      )}

      {/* Jewelry sparkle glint particles for Jewelry Store [6] */}
      {!isLocked && index === 6 && (
        <g>
          <path d="M40,22 L42,26 L46,27 L42,28 L40,32 L38,28 L34,27 L38,26 Z" fill="#fef08a">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" />
          </path>
          <path d="M82,14 L83.5,18 L87.5,19 L83.5,20 L82,24 L80.5,20 L76.5,19 L80.5,18 Z" fill="#ffffff">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* Hologram for Mobile Shop [5] */}
      {!isLocked && index === 5 && (
        <g>
          <ellipse cx="60" cy="18" rx="8" ry="4" fill="#6366f1" opacity="0.25" className="animate-pulse" />
          <polygon points="57,11 63,11 65,22 55,22" fill="#818cf8" opacity="0.5" className="animate-bounce" style={{ animationDuration: '2.5s' }} />
        </g>
      )}

      {/* DYNAMIC HIERARCHICAL BUILDING BLOCKS BASED ON LEVEL TIER */}
      {isLvl1_4 && (
        <g>
          <polygon points="25,95 60,112 60,70 25,53" fill={`url(#wall-left-${biz.id})`} />
          <polygon points="60,112 95,95 95,53 60,70" fill={`url(#wall-right-${biz.id})`} />
          
          <polygon points="20,53 60,25 60,33 20,61" fill={accent} />
          <polygon points="60,25 100,53 100,61 60,33" fill={darkAccent} />
          <polygon points="20,53 60,25 100,53 60,33" fill={`url(#roof-${biz.id})`} />

          <polygon points="36,91 50,98 50,80 36,73" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <polygon points="40,84 47,87 47,80 40,77" fill={isNight ? '#fcd34d' : '#334155'} />

          <polygon points="68,79 88,69 88,88 68,98" fill={isNight ? '#fef08a' : '#0f172a'} stroke={accent} strokeWidth="1" />
          {isNight && <polygon points="68,79 88,69 88,88 68,98" fill="#fef08a" opacity="0.3" className="animate-pulse" />}

          {index === 0 && (
            <g>
              <ellipse cx="26" cy="110" rx="3.5" ry="1.5" fill="#ef4444" />
              <line x1="26" y1="110" x2="26" y2="117" stroke="#334155" strokeWidth="1" />
            </g>
          )}
        </g>
      )}

      {isLvl5_9 && (
        <g>
          <polygon points="25,95 60,112 60,47 25,30" fill={`url(#wall-left-${biz.id})`} />
          <polygon points="60,112 95,95 95,30 60,47" fill={`url(#wall-right-${biz.id})`} />

          <polygon points="25,65 60,82 95,65 60,48" fill="#1e293b" opacity="0.15" />
          <line x1="25" y1="65" x2="60" y2="82" stroke="#475569" strokeWidth="1" opacity="0.4" />
          <line x1="60" y1="82" x2="95" y2="65" stroke="#475569" strokeWidth="1" opacity="0.4" />

          <polygon points="20,30 60,2 60,10 20,38" fill={accent} />
          <polygon points="60,2 100,30 100,38 60,10" fill={darkAccent} />
          <polygon points="20,30 60,2 100,30 60,10" fill={`url(#roof-${biz.id})`} />

          <polygon points="35,92 48,98 48,78 35,72" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <polygon points="38,84 45,87 45,79 38,76" fill={isNight ? '#38bdf8' : '#475569'} />

          <polygon points="65,81 88,70 88,91 65,102" fill={isNight ? '#fef08a' : '#1e293b'} stroke={accent} strokeWidth="1" />
          {isNight && <polygon points="65,81 88,70 88,91 65,102" fill="#fef08a" opacity="0.3" className="animate-pulse" />}

          <polygon points="32,54 48,62 48,46 32,38" fill={isNight ? '#fef08a' : '#1e293b'} stroke="#cbd5e1" strokeWidth="1" />
          <polygon points="70,54 86,46 86,30 70,38" fill={isNight ? '#fef08a' : '#1e293b'} stroke="#cbd5e1" strokeWidth="1" />

          <polygon points="28,58 52,69 52,61 28,50" fill="none" stroke="#78350f" strokeWidth="1.5" />
          <line x1="34" y1="61" x2="34" y2="54" stroke="#78350f" strokeWidth="1" />
          <line x1="40" y1="64" x2="40" y2="57" stroke="#78350f" strokeWidth="1" />
          <line x1="46" y1="67" x2="46" y2="60" stroke="#78350f" strokeWidth="1" />

          {index === 4 && (
            <g>
              <ellipse cx="98" cy="112" rx="6" ry="3" fill="#64748b" />
              <line x1="98" y1="112" x2="98" y2="120" stroke="#475569" strokeWidth="1" />
              <text x="92" y="109" fontSize="6">🧔</text>
              <text x="101" y="110" fontSize="6">👩</text>
            </g>
          )}
        </g>
      )}

      {isLvl10 && (
        <g>
          <polygon points="25,95 60,112 60,25 25,8" fill={`url(#wall-left-${biz.id})`} />
          <polygon points="60,112 95,95 95,8 60,25" fill={`url(#wall-right-${biz.id})`} />

          <polygon points="54,109 66,109 66,22 54,22" fill="#38bdf8" opacity="0.3" />
          <polygon points="57,109 63,109 63,22 57,22" fill="#e0f2fe" opacity="0.5" />

          <line x1="25" y1="65" x2="60" y2="82" stroke="#a7f3d0" strokeWidth="1.5" className="animate-pulse" />
          <line x1="60" y1="82" x2="95" y2="65" stroke="#a7f3d0" strokeWidth="1.5" className="animate-pulse" />
          
          <line x1="25" y1="38" x2="60" y2="55" stroke="#a7f3d0" strokeWidth="1.5" className="animate-pulse" />
          <line x1="60" y1="55" x2="95" y2="38" stroke="#a7f3d0" strokeWidth="1.5" className="animate-pulse" />

          <ellipse cx="60" cy="16" rx="20" ry="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          <ellipse cx="60" cy="15" rx="16" ry="6.5" fill={accent} />
          <line x1="60" y1="12" x2="60" y2="2" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="60" cy="2" r="1.5" fill="#ef4444" className="animate-ping" />

          <polygon points="36,92 50,98 50,72 36,66" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
          <polygon points="70,98 84,92 84,66 70,72" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
          
          {isNight && (
            <g>
              <polygon points="36,92 50,98 50,72 36,66" fill="#fef08a" opacity="0.2" />
              <polygon points="70,98 84,92 84,66 70,72" fill="#fef08a" opacity="0.2" />
            </g>
          )}

          <polygon points="32,48 48,55 48,30 32,22" fill="#38bdf8" opacity="0.6" stroke="#ffffff" strokeWidth="0.5" />
          <polygon points="72,55 88,48 88,22 72,30" fill="#38bdf8" opacity="0.6" stroke="#ffffff" strokeWidth="0.5" />

          <g transform="translate(60, 16)">
            <circle cx="0" cy="-22" r="9" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="0" y="-19.5" fill="#fbbf24" fontSize="8" fontWeight="black" textAnchor="middle">
              {biz.emoji}
            </text>
          </g>
        </g>
      )}

      {/* STRIPED COLORFUL STORE AWNING (Always present on active shops, sizing adjusts) */}
      <g>
        <polygon points="23,59 58,76 62,71 27,54" fill={isLocked ? '#64748b' : '#ef4444'} />
        <polygon points="27,54 62,71 66,66 31,49" fill={isLocked ? '#475569' : '#ffffff'} />
        <polygon points="31,49 66,66 70,61 35,44" fill={isLocked ? '#64748b' : '#ef4444'} />
        <polygon points="35,44 70,61 74,56 39,39" fill={isLocked ? '#475569' : '#ffffff'} />
        <polygon points="39,39 74,56 78,51 43,34" fill={isLocked ? '#64748b' : '#ef4444'} />
        <polygon points="23,59 58,76 58,78 23,61" fill="#1e293b" opacity="0.4" />
      </g>

      {/* Decorative center logo sign writing */}
      <g>
        <polygon points="40,51 80,31 80,41 40,61" fill="#0f172a" stroke={isLocked ? '#475569' : '#fbbf24'} strokeWidth="1" />
        <text 
          x="60" 
          y="49.5" 
          fill={isLocked ? '#475569' : '#fbbf24'} 
          fontSize="5" 
          fontWeight="bold" 
          fontFamily="monospace"
          textAnchor="middle" 
          transform="rotate(-13 60 50)"
        >
          {biz.emoji} {index + 1}
        </text>
      </g>

      {/* GRADIENTS DEFINITIONS FOR THIS SHOP */}
      <defs>
        <linearGradient id={`wall-left-${biz.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={darkAccent} />
        </linearGradient>
        <linearGradient id={`wall-right-${biz.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darkAccent} />
          <stop offset="100%" stopColor={shadowAccent} />
        </linearGradient>
        <linearGradient id={`roof-${biz.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="100%" stopColor={darkAccent} stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Helper function to darken/lighten colors programmatically
function adjustHexColor(hex: string, percent: number): string {
  if (!hex || hex.length < 7) return '#1e293b';
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(((R * (100 + percent)) / 100).toString());
  G = parseInt(((G * (100 + percent)) / 100).toString());
  B = parseInt(((B * (100 + percent)) / 100).toString());

  R = Math.max(0, Math.min(255, R));
  G = Math.max(0, Math.min(255, G));
  B = Math.max(0, Math.min(255, B));

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// --------------------------------------------------------------------------------------------------
// VEHICLE SPRITES
// Draws auto-rickshaws, cycle-rickshaws, bikes, cars, and yellow transit buses in vector SVG
// --------------------------------------------------------------------------------------------------
const VehicleSprite: React.FC<{ type: 'auto' | 'car' | 'scooter' | 'bus' | 'rickshaw'; timeOfDay: 'day' | 'sunset' | 'night' }> = ({ type, timeOfDay }) => {
  const isNight = timeOfDay === 'night';
  
  if (type === 'rickshaw') {
    return (
      <svg viewBox="0 0 45 28" className="w-[32px] h-[20px] drop-shadow-md overflow-visible">
        <circle cx="12" cy="20" r="5" fill="none" stroke="#64748b" strokeWidth="1" />
        <circle cx="12" cy="20" r="1.5" fill="#1e293b" />
        <line x1="12" y1="15" x2="12" y2="25" stroke="#64748b" strokeWidth="0.5" />
        <line x1="7" y1="20" x2="17" y2="20" stroke="#64748b" strokeWidth="0.5" />

        <circle cx="32" cy="20" r="5" fill="none" stroke="#64748b" strokeWidth="1" />
        <circle cx="32" cy="20" r="1.5" fill="#1e293b" />
        <line x1="32" y1="15" x2="32" y2="25" stroke="#64748b" strokeWidth="0.5" />
        <line x1="27" y1="20" x2="37" y2="20" stroke="#64748b" strokeWidth="0.5" />
        
        <path d="M 12 20 L 22 20 L 25 12 L 14 12 Z" fill="#b45309" />
        <path d="M 10 12 L 8 4 Q 18 2 28 4 L 25 12 Z" fill="#ef4444" />
        
        <line x1="22" y1="20" x2="32" y2="20" stroke="#1e293b" strokeWidth="2" />
        <line x1="32" y1="20" x2="35" y2="10" stroke="#1e293b" strokeWidth="2" />
        <line x1="35" y1="10" x2="31" y2="10" stroke="#1e293b" strokeWidth="2" />
        
        <circle cx="24" cy="20" r="2.2" fill="none" stroke="#1e293b" strokeWidth="1" />
        
        <circle cx="9" cy="6" r="1" fill="#fbbf24" />
        <circle cx="14" cy="5" r="1" fill="#f43f5e" />
        <circle cx="19" cy="5" r="1" fill="#10b981" />
        
        <circle cx="17" cy="9" r="2.5" fill="#f43f5e" opacity="0.8" />
        
        <circle cx="29" cy="11" r="2.5" fill="#e2e8f0" />
        <line x1="29" y1="13.5" x2="26" y2="19" stroke="#1e293b" strokeWidth="2" />
      </svg>
    );
  }

  if (type === 'auto') {
    return (
      <svg viewBox="0 0 45 28" className="w-[32px] h-[20px] drop-shadow-md overflow-visible">
        <ellipse cx="14" cy="22" rx="4.5" ry="2" fill="#000" />
        <ellipse cx="32" cy="22" rx="4.5" ry="2" fill="#000" />
        <path d="M12,14 Q22,8 32,10 L33,14 L10,14 Z" fill="#eab308" />
        <rect x="9" y="14" width="25" height="7" rx="2" fill="#15803d" />
        <polygon points="32,10 37,17 33,17 29,11" fill="#93c5fd" opacity="0.8" />
        {isNight && (
          <polygon points="36,19 55,14 55,24 36,21" fill="#fef08a" opacity="0.3" />
        )}
      </svg>
    );
  }

  return null;
};

// --------------------------------------------------------------------------------------------------
// STREET LIGHT
// --------------------------------------------------------------------------------------------------
const StreetLight: React.FC<{ timeOfDay: 'day' | 'sunset' | 'night' }> = ({ timeOfDay }) => {
  const isNight = timeOfDay === 'night' || timeOfDay === 'sunset';
  return (
    <svg viewBox="0 0 20 60" className="w-[10px] h-[36px] overflow-visible">
      <line x1="10" y1="60" x2="10" y2="10" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="10" cy="59" rx="4" ry="1.5" fill="#334155" />
      <path d="M10,10 Q10,2 16,3" fill="none" stroke="#475569" strokeWidth="2.5" />
      <path d="M14,3 L19,5 L17,8 L12,6 Z" fill="#1e293b" />
      <circle cx="16" cy="7" r="2.5" fill={isNight ? '#fbbf24' : '#e2e8f0'} />
      {isNight && (
        <g>
          <polygon points="16,8 5,45 27,45" fill="#fef08a" opacity="0.15" />
          <circle cx="16" cy="45" r="10" fill="#fef08a" opacity="0.05" filter="blur(1px)" />
        </g>
      )}
    </svg>
  );
};

// --------------------------------------------------------------------------------------------------
// STREET TREE
// --------------------------------------------------------------------------------------------------
const StreetTree: React.FC = () => {
  return (
    <svg viewBox="0 0 30 50" className="w-[14px] h-[28px] overflow-visible">
      <rect x="13.5" y="32" width="3" height="18" fill="#78350f" rx="1" />
      <ellipse cx="15" cy="24" rx="11" ry="11" fill="#15803d" />
      <ellipse cx="11" cy="18" rx="8" ry="8" fill="#166534" />
      <ellipse cx="19" cy="20" rx="7" ry="7" fill="#22c55e" opacity="0.8" />
    </svg>
  );
};
