import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { playClick } from '../utils/audio';

interface PrivacyPolicyScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOLD = 'var(--color-premium-gold-400)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <h2 className="font-bold text-[13px] mb-1.5" style={{ color: GOLD }}>{title}</h2>
    <p className="text-[12px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{children}</p>
  </div>
);

/**
 * A real, honest privacy policy — this app had none before; the
 * "Privacy Policy" row in Settings previously did nothing at all when
 * tapped. Written in plain language describing exactly what this app
 * actually does with data, not a formal legal document reviewed by
 * counsel — appropriate for this game's current testing phase, but
 * worth real legal review before any wider, public launch.
 */
export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex flex-col"
          style={{ backgroundColor: 'var(--color-premium-bg)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-premium-border)' }}>
            <button onClick={() => { playClick(); onClose(); }} className="p-1 -ml-1 cursor-pointer">
              <ChevronLeft size={20} color="var(--color-premium-text)" />
            </button>
            <h1 className="font-bold text-[15px]" style={{ color: 'var(--color-premium-text)' }}>Privacy Policy</h1>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div
              className="rounded-2xl p-3.5 mb-5"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-gold-400)' }}
            >
              <div className="font-bold text-[12.5px] mb-1" style={{ color: GOLD }}>
                This is a test build
              </div>
              <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-premium-text)' }}>
                CoralBay Business Tycoon is currently in active testing, not a finished public release. Features,
                balance, and data structures may change without notice, and account data may be reset or removed
                at any point during this phase. Please don't use an account you'd rather keep separate from testing.
              </p>
            </div>

            <Section title="What we collect">
              When you sign in with Google, we receive your name, email address, and profile picture from your
              Google account. We also store your in-game progress — cash, businesses owned, achievements, and
              similar gameplay data — tied to that account.
            </Section>

            <Section title="What's visible to other players">
              Your display name, avatar, net worth, and level appear on the in-game leaderboard and weekly
              contest board, visible to other signed-in players. Your email address is never shown to other
              players.
            </Section>

            <Section title="Why we collect it">
              This data exists to save your progress, let it follow you across devices, and power the
              leaderboard and weekly contest. We don't use it for advertising, and we don't sell it to anyone.
            </Section>

            <Section title="Where it's stored">
              Game data is stored using Google Firebase, a cloud service operated by Google. Sign-in itself is
              handled entirely by Google's own authentication system — we never see or store your password.
            </Section>

            <Section title="One active device at a time">
              To keep your progress from diverging across devices, signing in on a new device signs you out of
              any other device already using that account.
            </Section>

            <Section title="Your choices">
              You can sign out at any time from Settings. Since this is a testing phase, if you'd like your
              account data removed entirely, please reach out directly rather than assuming it happens
              automatically.
            </Section>

            <p className="text-[10.5px] mt-2 pb-6" style={{ color: TEXT_SECONDARY }}>
              This is a plain-language description of what this app actually does, written for a testing
              phase — not a formal legal document. It will be revisited before any wider, public release.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
