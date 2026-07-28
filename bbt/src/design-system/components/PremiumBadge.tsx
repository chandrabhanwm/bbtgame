import React from 'react';

/**
 * PremiumBadge — reference implementation of the Badge System (§9).
 * Not wired into any live screen. Income badges are always green text,
 * per design rule: money is always green, never gold.
 */

export type PremiumBadgeVariant = 'level' | 'price' | 'income' | 'category' | 'locked' | 'comingSoon';

interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: PremiumBadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<PremiumBadgeVariant, string> = {
  level: 'bg-[var(--color-premium-elevated)] text-[var(--color-premium-gold-400)] border border-[var(--color-premium-gold-600)]',
  price: 'bg-[var(--color-premium-elevated)] text-[var(--color-premium-text)] border border-[var(--color-premium-border)]',
  income: 'bg-[var(--color-premium-elevated)] text-[var(--color-premium-green-500)] border border-[var(--color-premium-green-700)]',
  category: 'bg-transparent text-[var(--color-premium-text-secondary)] border border-[var(--color-premium-border-subtle)]',
  locked: 'bg-[var(--color-premium-bg)] text-[var(--color-premium-text-disabled)] border border-[var(--color-premium-border-subtle)]',
  comingSoon: 'bg-[var(--color-premium-bg)] text-[var(--color-premium-gold-100)] border border-[var(--color-premium-gold-600)]',
};

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ children, variant = 'category', className = '' }) => {
  return (
    <span
      className={`
        text-premium-label inline-flex items-center rounded-[var(--radius-premium-pill)]
        px-[var(--spacing-premium-sm)] py-[var(--spacing-premium-xs)]
        ${VARIANT_CLASSES[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
};
