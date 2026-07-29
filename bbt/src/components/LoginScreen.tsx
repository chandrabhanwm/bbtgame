import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../firebase/config';

interface LoginScreenProps {
  onSignedIn: () => void;
}

/**
 * The required sign-in gate. Nothing about the actual game renders
 * until this succeeds — a deliberate product decision (real accounts
 * from the start, not silent anonymous sessions most players would
 * never bother linking).
 *
 * Visual treatment: a postcard sitting on a table. Dashed border like
 * the edge of a mailed card, a rotated postage-stamp frame around the
 * app icon, an airmail stripe along the top — the same signature motif
 * used on the district hero and business cards, introduced here first
 * since this is the very first thing anyone sees.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignedIn }) => {
  const [status, setStatus] = useState<'idle' | 'working' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setStatus('working');
    setError(null);
    const result = await signInWithGoogle();
    if (result.uid) {
      onSignedIn();
    } else {
      setStatus('failed');
      setError(result.error);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: 'var(--color-premium-bg)' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glossy-3d w-full max-w-[320px] rounded-[28px] px-7 pt-8 pb-7 flex flex-col items-center relative overflow-hidden"
      >
        {/* Airmail stripe — classic diagonal coral/ocean/sun border strip
            along the top edge, the one deliberately "loud" flourish on
            an otherwise quiet card. */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: 'repeating-linear-gradient(-45deg, var(--color-postcard-coral) 0 10px, var(--color-premium-surface) 10px 16px, var(--color-postcard-ocean) 16px 26px, var(--color-premium-surface) 26px 32px)',
          }}
        />

        <div className="postmark-stamp p-2.5 mb-5 mt-2">
          <img src="/icon-512.png" alt="Coral Bay Resort Tycoon" className="w-16 h-16 rounded-[4px]" />
        </div>

        <h1 className="text-premium-heading mb-2" style={{ color: 'var(--color-premium-text)' }}>
          Coral Bay Resort Tycoon
        </h1>
        <p className="text-premium-body leading-relaxed mb-7 max-w-[260px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
          Sign in to build your empire — your progress is saved to your account and follows you to any device.
        </p>

        {error && (
          <div className="text-premium-caption mb-3 max-w-[260px] normal-case tracking-normal font-semibold" style={{ color: 'var(--color-postcard-coral)' }}>
            Couldn't sign in: {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={status === 'working'}
          className="w-full px-6 py-3.5 rounded-[16px] text-premium-button flex items-center justify-center gap-2.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-postcard-sun)',
            color: 'var(--color-postcard-ink)',
            border: '2px solid var(--color-postcard-ink)',
            boxShadow: '3px 3px 0 rgba(22, 48, 46, 0.9)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          {status === 'working' ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </motion.div>

      <p className="text-premium-label mt-6" style={{ color: 'var(--color-premium-text-disabled)' }}>
        ⚓ Wish you were here
      </p>
    </div>
  );
};
