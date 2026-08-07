import React from 'react';
import { motion } from 'motion/react';

/**
 * Rotating radial light rays behind a big celebration panel — the
 * Monopoly-GO style "screen takeover" backdrop. Pure CSS conic-gradient,
 * slowly spinning, sized bigger than its container so it bleeds off the
 * edges rather than showing a hard circular boundary.
 */
export const Sunburst: React.FC<{ color?: string }> = ({ color = 'rgba(212,167,44,0.35)' }) => {
  return (
    <div
      className="absolute pointer-events-none animate-sunburst"
      style={{
        top: '50%',
        left: '50%',
        width: '220%',
        height: '220%',
        marginLeft: '-110%',
        marginTop: '-110%',
        background: `conic-gradient(from 0deg, ${color} 0deg, transparent 18deg, transparent 36deg, ${color} 42deg, transparent 60deg, transparent 78deg, ${color} 84deg, transparent 102deg, transparent 120deg, ${color} 126deg, transparent 144deg, transparent 162deg, ${color} 168deg, transparent 186deg, transparent 204deg, ${color} 210deg, transparent 228deg, transparent 246deg, ${color} 252deg, transparent 270deg, transparent 288deg, ${color} 294deg, transparent 312deg, transparent 330deg, ${color} 336deg, transparent 354deg, transparent 360deg)`,
        zIndex: 0,
      }}
    />
  );
};

/**
 * A little cluster of coins that pop out and float up, then vanish.
 * Drop this at the spot the player just earned or spent money —
 * the tap point, a shop, a collected bubble — for the game's signature
 * "cha-ching" feedback moment. Purely decorative / pointer-events none.
 */
export const CoinBurst: React.FC<{ count?: number; emoji?: string }> = ({ count = 5, emoji = '🪙' }) => {
  const coins = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const dist = 18 + Math.random() * 14;
    const dx = Math.cos(angle) * dist;
    const delay = Math.random() * 0.12;
    return { id: i, dx, delay };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-40" aria-hidden="true">
      {coins.map((c) => (
        <span
          key={c.id}
          className="absolute left-1/2 top-1/2 text-sm animate-coin-float"
          style={{
            transform: `translate(-50%, -50%) translateX(${c.dx}px)`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

/**
 * Coins that fly from their spawn point toward the Header's cash area
 * and fade out there — distinct from CoinBurst above, which bursts
 * outward and fades in place. This is the "coin flight" effect
 * explicitly deferred earlier in the project for a dedicated pass —
 * used specifically for the pool-claim moment, reinforcing "this money
 * is now yours, and it's going up there" rather than just celebrating
 * in place.
 *
 * The target offset is a judicious, hardcoded approximation of "toward
 * the Header's cash pill" rather than a measured DOM position — this
 * app's phone-frame layout is a known, fixed mobile width (not an
 * arbitrary responsive layout), so a fixed offset reads correctly
 * without needing a ref-based measurement for what's a purely
 * decorative flourish.
 */
/**
 * Cash flying from the point of collection up toward the Header's cash
 * area, fading there — distinct from CoinBurst above, which bursts
 * outward and fades in place. This is the "coin flight" effect
 * explicitly deferred earlier in the project for a dedicated pass.
 *
 * Built as real styled elements (a small gradient note shape with a ₹
 * mark and a genuine glow), not a bare emoji — a small emoji at speed
 * loses its color character and reads as an indistinct dark blob,
 * which is exactly the "black bubbles" problem this replaces.
 *
 * Scoped to the phone-frame (absolute, not fixed) so it doesn't spill
 * across the whole browser viewport on wider/desktop layouts where the
 * phone mockup is centered with space around it.
 */
export const CoinFlight: React.FC<{ count?: number }> = ({ count = 10 }) => {
  const coins = Array.from({ length: count }).map((_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * 70,
    startRotate: (Math.random() - 0.5) * 40,
    delay: i * 0.055 + Math.random() * 0.06,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-[60]" aria-hidden="true">
      {coins.map((c) => (
        <motion.div
          key={c.id}
          className="absolute flex items-center justify-center rounded-full font-bold text-[11px]"
          style={{
            left: '50%',
            top: '38%',
            width: 22,
            height: 22,
            background: 'radial-gradient(circle at 35% 30%, #fff6d8, #f7c948 45%, #d99a1f 100%)',
            boxShadow: '0 0 10px rgba(247,201,72,0.9), 0 0 3px rgba(255,255,255,0.8)',
            color: '#7a4a06',
          }}
          initial={{ x: c.startX, y: 0, opacity: 0, scale: 0.3, rotate: c.startRotate }}
          animate={{
            x: [c.startX, c.startX * 0.5, -160],
            y: [0, -70, -300],
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1.15, 0.9, 0.5],
            rotate: [c.startRotate, c.startRotate * 2, c.startRotate * 3],
          }}
          transition={{ duration: 0.85, delay: c.delay, ease: 'easeIn', times: [0, 0.28, 0.75, 1] }}
        >
          ₹
        </motion.div>
      ))}
    </div>
  );
};


/**
 * An elegant alternative to Confetti above — soft twinkling sparkle
 * particles and a gentle radial glow, for celebratory moments that
 * should feel refined rather than a loud confetti-cannon burst (district
 * completion, a milestone modal). Particles are 4-pointed diamond/star
 * shapes that fade and scale in place (see the sparkleTwinkle keyframe),
 * not falling flecks — nothing here moves very far, which is what reads
 * as "elegant" rather than "scattered."
 */
export const Sparkle: React.FC<{ count?: number; coinCount?: number }> = ({ count = 20, coinCount = 14 }) => {
  const colors = [
    'var(--color-premium-gold-400)',
    'var(--color-premium-gold-100)',
    '#ffffff',
  ];
  const sparkles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: 4 + Math.random() * 92,
    top: 4 + Math.random() * 92,
    delay: Math.random() * 1.4,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 9,
  }));

  // Falling coin shower — bigger, denser, and actually falls (unlike
  // the in-place twinkles above), which is what gives this the "raining
  // rewards" feel big mobile-game celebrations lean on.
  const coins = Array.from({ length: coinCount }).map((_, i) => ({
    id: i,
    left: 2 + Math.random() * 96,
    delay: Math.random() * 0.9,
    duration: 1.4 + Math.random() * 0.8,
    size: 16 + Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-40" aria-hidden="true">
      {/* Soft glow breathing behind the sparkles — this, more than the
          particles themselves, is what sells "elegant" over "busy." */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: 'radial-gradient(60% 60% at 50% 45%, rgba(212,167,44,0.28) 0%, transparent 70%)',
        }}
      />
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute animate-sparkle-twinkle block"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
            animationDelay: `${s.delay}s`,
            filter: `drop-shadow(0 0 3px ${s.color})`,
          }}
        />
      ))}
      {coins.map((c) => (
        <span
          key={`coin-${c.id}`}
          className="absolute block"
          style={{
            left: `${c.left}%`,
            top: '-8%',
            fontSize: c.size,
            animation: `coinShowerFall ${c.duration}s cubic-bezier(0.4, 0.1, 0.6, 1) ${c.delay}s forwards`,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
};
export const Confetti: React.FC<{ count?: number }> = ({ count = 18 }) => {
  const colors = [
    'var(--color-premium-gold-400)',
    'var(--color-premium-gold-100)',
    'var(--color-premium-green-500)',
    'var(--color-premium-green-300)',
    'var(--color-premium-text-secondary)',
  ];
  const flecks = Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    delay: Math.random() * 0.5,
    color: colors[i % colors.length],
    rotate: Math.random() * 360,
    size: 5 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-x-0 top-0 h-0 pointer-events-none overflow-visible z-40" aria-hidden="true">
      {flecks.map((f) => (
        <span
          key={f.id}
          className="absolute animate-confetti block rounded-sm"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size * 1.6,
            background: f.color,
            animationDelay: `${f.delay}s`,
            transform: `rotate(${f.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
};
