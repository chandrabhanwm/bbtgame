import React, { useMemo } from 'react';
import { District } from '../../data/cityMapData';

interface RoadPathProps {
  id: string;
  from: District;
  to: District;
  active: boolean;
  /** True when both districts this road connects are fully completed —
   *  the player has genuinely walked this whole stretch already. Gets
   *  its own distinct white glow, separate from "just reachable" (gold)
   *  and "locked" (muted gray), so progress already made reads at a
   *  glance against what's still ahead. */
  traveled?: boolean;
  /** True briefly after a district it touches just completed — a single
   *  soft opacity pulse, not a repeated flashy color cycle. */
  celebrating?: boolean;
}

interface Point {
  x: number;
  y: number;
}

/** Cubic bezier control points computed purely from the two endpoints —
 *  no per-road authoring. Pulls the curve along whichever axis dominates
 *  so vertical trunk roads get a gentle S-curve and same-row roads come
 *  out straight, without any special-casing. */
function getControlPoints(p0: Point, p3: Point) {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  if (Math.abs(dy) >= Math.abs(dx)) {
    const midY = (p0.y + p3.y) / 2;
    return { p1: { x: p0.x, y: midY }, p2: { x: p3.x, y: midY } };
  }
  const midX = (p0.x + p3.x) / 2;
  return { p1: { x: midX, y: p0.y }, p2: { x: midX, y: p3.y } };
}

/**
 * A highway-style connector between two districts. The road bed itself —
 * a thick band — is always fully visible everywhere, so the city always
 * reads as one connected network rather than fragments; whether a route
 * is actually reachable shows up in the dashed center line instead (gold
 * dashes = reachable, muted gray dashes = locked), the way a real road
 * doesn't stop existing just because you haven't driven it yet. Active
 * roads also carry a car continuously driving the route (native SVG
 * animateMotion, no extra JS animation loop).
 */
export const RoadPath: React.FC<RoadPathProps> = ({ id, from, to, active, traveled = false, celebrating = false }) => {
  const p0: Point = { x: from.x, y: from.y };
  const p3: Point = { x: to.x, y: to.y };

  const { p1, p2 } = useMemo(() => getControlPoints(p0, p3), [p0.x, p0.y, p3.x, p3.y]);
  const d = `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

  const centerLineColor = traveled ? '#ffffff' : active ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text-secondary)';

  // Vary each road's traffic speed and start offset a little, by hashing
  // its id — otherwise every car on every road would move in perfect
  // lockstep, which reads as mechanical rather than alive.
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const duration = 5.5 + (hash % 5); // 5.5s–10.5s
  const beginOffset = -(hash % 100) / 10; // negative begin = starts partway through its loop

  return (
    <g>
      {/* Flat top-down park-map path — a single dashed line with a solid
          offset "sticker" shadow underneath (shifted down-right, no blur),
          replacing the earlier thick glowing highway-style road bed. This
          is the same flat-illustration language the district nodes below
          now use too, rather than a glossy 3D road. */}
      <path d={d} stroke="rgba(0,0,0,0.35)" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="9 8" transform="translate(2.5, 3)" />

      <path
        d={d}
        stroke={centerLineColor}
        strokeWidth={5}
        strokeDasharray="9 8"
        fill="none"
        strokeLinecap="round"
        opacity={traveled ? 1 : active ? 0.95 : 0.55}
        style={{ transition: 'stroke 0.7s ease, opacity 0.7s ease' }}
      />

      {/* Brief single fade — a district touching this road just completed.
          Opacity only, per the "fade/opacity, no flashy" motion rule. */}
      {celebrating && (
        <path d={d} stroke="var(--color-premium-green-500)" strokeWidth={12} fill="none" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="1.4s" repeatCount="1" fill="freeze" />
        </path>
      )}

      {/* Car, continuously driving the route — active roads only. */}
      {active && (
        <image
          href="/assets/district-icons/vehicle_car.png"
          x="-11" y="-11" width="22" height="22"
          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
        >
          <animateMotion
            path={d}
            dur={`${duration}s`}
            begin={`${beginOffset}s`}
            repeatCount="indefinite"
            rotate="auto"
          />
        </image>
      )}
    </g>
  );
};
