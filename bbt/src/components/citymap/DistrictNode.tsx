import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Train, Factory, Building2, Hospital, Bus, Store, Trees, Landmark,
  ShoppingBag, Flag, Lock, Check, LucideIcon
} from 'lucide-react';
import { District, DistrictIconName } from '../../data/cityMapData';
import { DistrictProgressSummary } from '../../utils/districtProgress';

export const DISTRICT_ICONS: Record<DistrictIconName, LucideIcon> = {
  train: Train,
  factory: Factory,
  building: Building2,
  hospital: Hospital,
  bus: Bus,
  store: Store,
  trees: Trees,
  landmark: Landmark,
  'shopping-bag': ShoppingBag,
  flag: Flag,
};

interface DistrictNodeProps {
  district: District;
  onSelect: (district: District) => void;
  /** Live unlock status. Falls back to district.unlocked (static) if omitted. */
  unlocked?: boolean;
  /** Live completion/stars. Falls back to district.completed (static) if omitted. */
  progress?: DistrictProgressSummary;
  /** True for the one district the player is actually playing in right
   *  now — gets its own distinct "You are here" badge, separate from
   *  the unlocked/completed glow states. */
  isCurrent?: boolean;
}

/**
 * A single premium information node on the city map — a real illustrated
 * 3D icon (Microsoft's open-source Fluent Emoji set, chosen per district's
 * actual theme — a train for Railway Station, a factory for Plastic
 * Complex, and so on — not a generic storefront reused everywhere), name,
 * income, completion %, and unlock status. Falls back to the original
 * small line-icon if a given district's image ever fails to load, so nothing
 * breaks if a future district is added without art yet.
 */
export const DistrictNode: React.FC<DistrictNodeProps> = ({ district, onSelect, unlocked, progress, isCurrent = false }) => {
  const [iconFailed, setIconFailed] = useState(false);
  const FallbackIcon = DISTRICT_ICONS[district.icon];
  const isUnlocked = unlocked ?? district.unlocked;
  const isCompleted = progress?.completed ?? district.completed;
  const income = progress?.income ?? 0;
  const completionPercent = progress?.completionPercent ?? 0;
  const status = isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked';

  const borderColor =
    status === 'completed' ? 'var(--color-premium-green-500)' :
    status === 'unlocked' ? 'var(--color-premium-gold-400)' :
    'var(--color-premium-border-strong)';

  const boxFill =
    status === 'completed' ? 'var(--color-premium-green-500)' :
    status === 'unlocked' ? 'var(--color-premium-gold-400)' :
    'var(--color-premium-elevated)';

  const iconColor = status === 'locked' ? 'var(--color-premium-text-secondary)' : 'var(--color-premium-text-inverse)';

  return (
    <g
      transform={`translate(${district.x}, ${district.y})`}
      onClick={() => onSelect(district)}
      className="cursor-pointer"
      role="button"
      aria-label={`${district.name} — ${status}`}
    >
      {/* "You are here" — the one district the player is actually
          playing in right now. */}
      {isCurrent && (
        <g transform="translate(0, -58)">
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="-32" y="-10" width="64" height="18" rx="9" fill="var(--color-premium-gold-400)" />
            <text textAnchor="middle" y="3" fontSize="9" fontWeight="700" fill="var(--color-premium-text-inverse)" fontFamily="Inter, sans-serif">
              YOU ARE HERE
            </text>
            <polygon points="-4,8 4,8 0,15" fill="var(--color-premium-gold-400)" />
          </motion.g>
        </g>
      )}

      {/* Zone patch — a soft flat territory blob under the node, the
          top-down park-map equivalent of the earlier glow ring. No blur,
          no glossy gradient; just a flat tinted ellipse, matching the
          reference's colored zone shapes. */}
      <ellipse
        rx={status === 'locked' ? 44 : 50}
        ry={status === 'locked' ? 32 : 36}
        fill={status === 'completed' ? 'var(--color-premium-green-500)' : status === 'unlocked' ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border)'}
        opacity={status === 'locked' ? 0.08 : 0.14}
        style={{ transition: 'opacity 0.7s ease' }}
      />

      {/* Main node — a rounded SQUARE icon box now, not a circle, with a
          flat solid offset shadow (no blur) underneath for the same
          "game sticker" depth the reference uses, instead of a glossy
          radial gradient disc. */}
      <rect x="-28" y="-28" width="56" height="56" rx="16" fill="rgba(0,0,0,0.35)" transform="translate(3, 4)" />
      <rect
        x="-28" y="-28" width="56" height="56" rx="16"
        fill="var(--color-premium-surface)"
        stroke={borderColor}
        strokeWidth={status === 'locked' ? 2 : 3}
        style={{ transition: 'stroke 0.7s ease' }}
      />
      {/* Inner color fill for unlocked/completed status, flat not glossy */}
      {status !== 'locked' && (
        <rect x="-24" y="-24" width="48" height="48" rx="12" fill={boxFill} opacity="0.16" />
      )}

      {/* Illustrated 3D district icon, or the original line-icon as a
          fallback if this district's art fails to load */}
      <foreignObject x="-14" y="-14" width="28" height="28" style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full flex items-center justify-center">
          {iconFailed ? (
            <FallbackIcon size={17} strokeWidth={2} color={status === 'locked' ? 'var(--color-premium-text-secondary)' : 'var(--color-premium-text)'} />
          ) : (
            <img
              src={`/assets/district-icons/${district.id}.png`}
              alt=""
              className="w-full h-full object-contain"
              style={{ opacity: status === 'locked' ? 0.75 : 1 }}
              onError={() => setIconFailed(true)}
            />
          )}
        </div>
      </foreignObject>

      {/* Lock indicator for locked districts */}
      {status === 'locked' && (
        <g transform="translate(23, -23)">
          <rect x="-7.5" y="-7.5" width="15" height="15" rx="5" fill="var(--color-premium-bg)" stroke="var(--color-premium-border)" strokeWidth="1" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Lock size={7} color="var(--color-premium-text-secondary)" strokeWidth={2.5} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Elegant checkmark for completed districts */}
      {status === 'completed' && (
        <g transform="translate(23, -23)">
          <rect x="-7.5" y="-7.5" width="15" height="15" rx="5" fill="var(--color-premium-green-500)" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Check size={7} color="var(--color-premium-text-inverse)" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Name label — flat sticker-style pill, offset shadow to match
          the node box above rather than a plain bordered rect. */}
      <g transform="translate(0, 55)">
        <rect
          x={-(district.name.length * 5.7 + 12)}
          y="-14.5"
          width={district.name.length * 11.4 + 24}
          height="29"
          rx="14"
          fill="rgba(0,0,0,0.3)"
          transform="translate(1.5, 2)"
        />
        <rect
          x={-(district.name.length * 5.7 + 12)}
          y="-14.5"
          width={district.name.length * 11.4 + 24}
          height="29"
          rx="14"
          fill="var(--color-premium-surface)"
          stroke={borderColor}
          strokeWidth="1.5"
        />
        <text
          textAnchor="middle"
          y="6"
          fontSize="16"
          fontWeight="700"
          fill={status === 'locked' ? 'var(--color-premium-text-secondary)' : '#ffffff'}
          fontFamily="Inter, sans-serif"
        >
          {district.name}
        </text>
      </g>

      {/* Compact income / completion readout */}
      {status !== 'locked' && (
        <g transform="translate(0, 76)">
          <text textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-premium-green-500)" fontFamily="Inter, sans-serif">
            ₹{Math.round(income).toLocaleString('en-IN')}/min
          </text>
          <text textAnchor="middle" y="10" fontSize="7" fontWeight="500" fill="var(--color-premium-text-secondary)" fontFamily="Inter, sans-serif">
            {completionPercent}% complete
          </text>
        </g>
      )}
    </g>
  );
};
