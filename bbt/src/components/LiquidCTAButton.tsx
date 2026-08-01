import React from 'react';
import { motion } from 'motion/react';
import { LiquidMetal } from './ui/liquid-metal';

interface LiquidCTAButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  /** Base color of the shader (defaults to the app's premium gold) */
  colorBack?: string;
  /** Highlight/shimmer color */
  colorTint?: string;
  /** Rounding — pass whatever the surrounding UI uses (rounded-xl, rounded-2xl, rounded-lg...) */
  roundedClassName?: string;
  /** Padding, width, text size etc — merged onto the button itself */
  className?: string;
}

/**
 * A drop-in replacement for the app's solid-gold CTA buttons that
 * renders an animated liquid-metal shader behind the label instead of
 * a flat fill. Deliberately built as a wrapper around the base
 * `LiquidMetal` shader (not `LiquidMetalButton`, which is pill-shaped)
 * so it can match this app's existing rounded-rectangle button
 * language rather than introducing a new pill shape.
 *
 * Falls back to a flat disabled look (no shader) when `disabled` is
 * true, both to save a live WebGL render on a button that can't be
 * tapped and to keep the existing "grayed out" affordance intact.
 */
export const LiquidCTAButton: React.FC<LiquidCTAButtonProps> = ({
  onClick,
  disabled = false,
  children,
  colorBack = '#c99a2e',
  colorTint = '#ffe9a8',
  roundedClassName = 'rounded-2xl',
  className = '',
}) => {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden font-bold flex items-center justify-center gap-2 ${roundedClassName} ${className}`}
      style={{ border: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {disabled ? (
        <div
          className={`absolute inset-0 ${roundedClassName}`}
          style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
        />
      ) : (
        <LiquidMetal
          colorBack={colorBack}
          colorTint={colorTint}
          speed={0.4}
          repetition={4}
          distortion={0.15}
          className={roundedClassName}
        />
      )}
      <span
        className="relative z-10 flex items-center gap-2"
        style={{ color: disabled ? 'var(--color-premium-text-secondary)' : 'var(--color-premium-text-inverse)' }}
      >
        {children}
      </span>
    </motion.button>
  );
};
