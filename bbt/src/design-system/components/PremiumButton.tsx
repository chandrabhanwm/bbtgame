import React from 'react';
import { motion } from 'motion/react';

/**
 * PremiumButton — reference implementation of the Button System (§6).
 * Not wired into any live screen. This is the pattern future components
 * should follow: variants map directly to buttonTheme in theme.ts.
 */

export type PremiumButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon' | 'floating';

interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: PremiumButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<PremiumButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-[var(--color-premium-gold-100)] to-[var(--color-premium-gold-400)] text-[var(--color-premium-text-inverse)] border border-[var(--color-premium-gold-600)] shadow-premium-button',
  secondary:
    'bg-[var(--color-premium-elevated)] text-[var(--color-premium-text)] border border-[var(--color-premium-border)] shadow-premium-button',
  danger:
    'bg-[var(--color-premium-red-600)] text-[var(--color-premium-text)] border border-[var(--color-premium-red-400)] shadow-premium-button',
  icon:
    'bg-[var(--color-premium-elevated)] text-[var(--color-premium-text-secondary)] border border-[var(--color-premium-border)] rounded-full w-10 h-10 flex items-center justify-center',
  floating:
    'bg-gradient-to-b from-[var(--color-premium-gold-100)] to-[var(--color-premium-gold-400)] text-[var(--color-premium-text-inverse)] border border-[var(--color-premium-gold-600)] shadow-premium-floating',
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  onClick,
  className = '',
}) => {
  const isDisabled = disabled || loading;

  const disabledClasses =
    'bg-[var(--color-premium-surface)] text-[var(--color-premium-text-disabled)] border border-[var(--color-premium-border-subtle)] shadow-none cursor-not-allowed';

  return (
    <motion.button
      whileTap={!isDisabled ? { scale: 0.96 } : {}}
      whileHover={!isDisabled ? { boxShadow: '0 4px 14px rgba(0,0,0,0.4)' } : {}}
      transition={{ duration: 0.1, ease: [0.4, 0, 1, 1] }}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        text-premium-button rounded-[var(--radius-premium-button)] px-[var(--spacing-premium-lg)] py-[var(--spacing-premium-sm)]
        transition-premium-fast
        ${isDisabled ? disabledClasses : VARIANT_CLASSES[variant]}
        ${loading ? 'opacity-60 cursor-wait' : ''}
        ${className}
      `}
    >
      {loading ? '···' : children}
    </motion.button>
  );
};
