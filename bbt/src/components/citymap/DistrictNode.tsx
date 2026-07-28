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

  const iconColor = status === 'locked' ? 'var(--color-premium-text-secondary)' : 'var(--color-premium-text)';

  return (
    <g
      transform={`translate(${district.x}, ${district.y})`}
      onClick={() => onSelect(district)}
      className="cursor-pointer"
      role="button"
      aria-label={`${district.name} — ${status}`}
    >
      {/* "You are here" — the one district the player is actually
          playing in right now. Sits above the node, distinct from the
          completion glow and lock icon, so it reads at a glance as
          "this is where you are," not "this is done" or "this is
          locked." */}
      {isCurrent && (
        <g transform="translate(0, -50)">
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

      {/* Neutral elevation shadow — kept for locked districts only, where
          there's no progress yet to glow about. */}
      {status === 'locked' && (
        <ellipse cx="0" cy="4" rx="30" ry="7" fill="var(--color-premium-shadow-neutral)" opacity="0.24" />
      )}

      {/* Completion-based colored glow — the actual new piece here. Was
          previously always a neutral shadow regardless of progress;
          now an unlocked district's glow genuinely reflects how close
          it is to completion (dim early, warm and bright as it nears
          100%), and a completed district gets a steady full green glow
          matching its status color. */}
      {status !== 'locked' && (
        <circle
          r={38 + (status === 'completed' ? 6 : Math.round((completionPercent / 100) * 6))}
          fill={status === 'completed' ? 'var(--color-premium-green-500)' : 'var(--color-premium-gold-400)'}
          opacity={status === 'completed' ? 0.28 : 0.08 + (completionPercent / 100) * 0.22}
          style={{ transition: 'r 0.7s ease, opacity 0.7s ease' }}
        />
      )}

      {/* Main node disc — enlarged to give the illustrated icon real room.
          Border transitions smoothly (not a snap) when status changes —
          same "road lights up" principle as RoadPath. */}
      <circle
        r="32"
        fill="var(--color-premium-surface)"
        stroke={borderColor}
        strokeWidth={status === 'locked' ? 1.5 : 2}
        style={{ transition: 'stroke 0.7s ease, stroke-width 0.7s ease' }}
      />

      {/* Illustrated 3D district icon, or the original line-icon as a
          fallback if this district's art fails to load */}
      <foreignObject x="-11" y="-11" width="22" height="22" style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full flex items-center justify-center">
          {iconFailed ? (
            <FallbackIcon size={14} strokeWidth={1.75} color={iconColor} />
          ) : (
            <img
              src={`/assets/district-icons/${district.id}.png`}
              alt=""
              className="w-full h-full object-contain"
              style={{ opacity: status === 'locked' ? 0.82 : 1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
              onError={() => setIconFailed(true)}
            />
          )}
        </div>
      </foreignObject>

      {/* Lock indicator for locked districts */}
      {status === 'locked' && (
        <g transform="translate(21, -21)">
          <circle r="8" fill="var(--color-premium-bg)" stroke="var(--color-premium-border)" strokeWidth="1" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Lock size={7} color="var(--color-premium-text-secondary)" strokeWidth={2.5} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Elegant checkmark for completed districts */}
      {status === 'completed' && (
        <g transform="translate(21, -21)">
          <circle r="8" fill="var(--color-premium-green-500)" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Check size={7} color="var(--color-premium-text-inverse)" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Name label */}
      <g transform="translate(0, 51)">
        <rect
          x={-(district.name.length * 5.7 + 12)}
          y="-15.5"
          width={district.name.length * 11.4 + 24}
          height="31"
          rx="15"
          fill="var(--color-premium-surface)"
          stroke="var(--color-premium-border)"
          strokeWidth="1"
        />
        <text
          textAnchor="middle"
          y="6"
          fontSize="17"
          fontWeight="700"
          fill={status === 'locked' ? 'var(--color-premium-text-secondary)' : '#ffffff'}
          fontFamily="Inter, sans-serif"
        >
          {district.name}
        </text>
      </g>

      {/* Compact income / completion readout — only shown once a district
          is reachable enough to have real numbers worth displaying */}
      {status !== 'locked' && (
        <g transform="translate(0, 66)">
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
