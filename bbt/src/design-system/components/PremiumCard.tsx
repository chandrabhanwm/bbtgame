import React from 'react';

/**
 * PremiumCard — reference implementation of the Card System (§7).
 * Not wired into any live screen. Each variant maps directly to
 * cardTheme in theme.ts — background, border, padding, radius, shadow.
 */

export type PremiumCardVariant = 'information' | 'business' | 'district' | 'reward' | 'popup';

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: PremiumCardVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<PremiumCardVariant, string> = {
  information:
    'bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] rounded-[var(--radius-premium-card)] p-[var(--spacing-premium-lg)] shadow-premium-card',
  business:
    'bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] rounded-[var(--radius-premium-card)] p-[var(--spacing-premium-md)] shadow-premium-card',
  district:
    'bg-[var(--color-premium-elevated)] border border-[var(--color-premium-gold-600)] rounded-[var(--radius-premium-card)] p-[var(--spacing-premium-lg)] shadow-premium-floating',
  reward:
    'bg-[var(--color-premium-elevated)] border border-[var(--color-premium-gold-400)] rounded-[var(--radius-premium-card)] p-[var(--spacing-premium-xl)] shadow-premium-glow-gold',
  popup:
    'bg-[var(--color-premium-overlay)] border border-[var(--color-premium-border-strong)] rounded-[var(--radius-premium-dialog)] p-[var(--spacing-premium-2xl)] shadow-premium-dialog',
};

export const PremiumCard: React.FC<PremiumCardProps> = ({ children, variant = 'information', className = '' }) => {
  return (
    <div className={`${VARIANT_CLASSES[variant]} text-[var(--color-premium-text)] ${className}`}>
      {children}
    </div>
  );
};
