import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../firebase/config';

interface LoginScreenProps {
  onSignedIn: () => void;
}

const GOLD = 'var(--color-premium-gold-400)';

/**
 * The required sign-in gate. Nothing about the actual game renders
 * until this succeeds — a deliberate product decision (real accounts
 * from the start, not silent anonymous sessions most players would
 * never bother linking).
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
      className="w-full h-full flex flex-col items-center justify-center px-8 text-center"
      style={{ backgroundColor: 'var(--color-premium-bg)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <img src="/icon-512.png" alt="BBT Games" className="w-20 h-20 mb-4 rounded-2xl" />
        <h1 className="font-bold text-[22px] mb-1.5" style={{ color: 'var(--color-premium-text)' }}>
          Basti Business Tycoon
        </h1>
        <p className="text-[12px] leading-relaxed mb-8 max-w-[280px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
          Sign in to build your empire — your progress is saved to your account and follows you to any device.
        </p>

        {error && (
          <div className="text-[11px] font-semibold mb-3 max-w-[280px]" style={{ color: 'var(--color-premium-red-400)' }}>
            Couldn't sign in: {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={status === 'working'}
          className="glossy-3d px-6 py-3.5 rounded-2xl font-bold text-[14px] flex items-center gap-2.5 cursor-pointer"
          style={{ color: GOLD }}
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
    </div>
  );
};
