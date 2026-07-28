import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Volume2, Music, Vibrate, Palette, Sparkles,
  Monitor, User, Fingerprint, Info, Shield, FileText, Users,
} from 'lucide-react';
import { toggleMute, getMutedState, playClick } from '../utils/audio';
import { derivePlayerId } from '../utils/playerIdentity';

interface SettingsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
}

/**
 * Full-screen Settings overlay, in the style of iOS Settings / a private
 * banking app's account screen. Presentation only:
 *  - "Sound" is wired to the real, existing mute system (toggleMute/
 *    getMutedState) — the same functions the Header's speaker icon uses.
 *  - "Music" and "Vibration" have no underlying system in this project at
 *    all (there's only one unified sound toggle) — they're shown as real,
 *    interactive UI toggles with local component state, but intentionally
 *    do not persist or affect anything, since building that system is out
 *    of scope for a presentation-only pass. Flagged here, not hidden.
 *  - "Theme / Graphics Quality / Animations" are static display rows per
 *    spec ("Presentation only. No new functionality").
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ isOpen, onClose, playerName }) => {
  const [soundOn, setSoundOn] = useState(!getMutedState());
  const [musicOn, setMusicOn] = useState(true); // display-only, no real music system exists
  const [vibrationOn, setVibrationOn] = useState(true); // display-only, no real haptics system exists

  const handleToggleSound = () => {
    const muted = toggleMute();
    setSoundOn(!muted);
    playClick();
  };

  const playerId = derivePlayerId(playerName);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-[60] overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--color-premium-bg)' }}
        >
          {/* Title bar — same premium pill language as Header/City Map/Rankings,
              with a back control since this is a full-screen takeover */}
          <div
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: 'var(--color-premium-bg)', borderBottom: '1px solid var(--color-premium-border)' }}
          >
            <button
              onClick={() => { playClick(); onClose(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
              aria-label="Back"
            >
              <ChevronLeft size={16} color="var(--color-premium-text-secondary)" />
            </button>
            <span className="font-bold text-[15px]" style={{ color: 'var(--color-premium-text)' }}>
              Settings
            </span>
          </div>

          <div className="p-4 space-y-4 pb-10">
            <SectionLabel>Account</SectionLabel>
            <Card>
              <div className="px-3.5 py-3">
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-premium-text-secondary)' }}>
                  ✓ Signed in — your progress is saved to your account and follows you to any device.
                </p>
              </div>
            </Card>

            <SectionLabel>Game</SectionLabel>
            <Card>
              <ToggleRow icon={Volume2} label="Sound" checked={soundOn} onChange={handleToggleSound} />
              <Divider />
              <ToggleRow icon={Music} label="Music" checked={musicOn} onChange={() => { setMusicOn((v) => !v); playClick(); }} />
              <Divider />
              <ToggleRow icon={Vibrate} label="Vibration" checked={vibrationOn} onChange={() => { setVibrationOn((v) => !v); playClick(); }} />
            </Card>

            <SectionLabel>Display</SectionLabel>
            <Card>
              <NavRow icon={Palette} label="Theme" value="Default" />
              <Divider />
              <NavRow icon={Monitor} label="Graphics Quality" value="High" />
              <Divider />
              <NavRow icon={Sparkles} label="Animations" value="On" />
            </Card>

            <SectionLabel>Account</SectionLabel>
            <Card>
              <ReadOnlyRow icon={User} label="Player Name" value={playerName} />
              <Divider />
              <ReadOnlyRow icon={Fingerprint} label="Player ID" value={playerId} />
            </Card>

            <SectionLabel>About</SectionLabel>
            <Card>
              <ReadOnlyRow icon={Info} label="Version" value="1.0.0" />
              <Divider />
              <NavRow icon={Shield} label="Privacy Policy" />
              <Divider />
              <NavRow icon={FileText} label="Terms of Service" />
              <Divider />
              <NavRow icon={Users} label="Credits" />
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode; muted?: boolean }> = ({ children, muted }) => (
  <h3
    className="text-[10.5px] font-bold uppercase tracking-widest px-1 pt-1"
    style={{ color: muted ? 'var(--color-premium-red-400)' : 'var(--color-premium-text-secondary)' }}
  >
    {children}
  </h3>
);

const Card: React.FC<{ children: React.ReactNode; muted?: boolean }> = ({ children, muted }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{
      backgroundColor: 'var(--color-premium-surface)',
      border: `1.5px solid ${muted ? 'var(--color-premium-red-400)' : 'var(--color-premium-border)'}`,
    }}
  >
    {children}
  </div>
);

const Divider: React.FC = () => (
  <div style={{ height: 1, backgroundColor: 'var(--color-premium-border)' }} />
);

const RowIcon: React.FC<{ icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }> = ({ icon: Icon }) => (
  <div
    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
    style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
  >
    <Icon size={14} color="var(--color-premium-text-secondary)" strokeWidth={1.75} />
  </div>
);

const ToggleRow: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  checked: boolean;
  onChange: () => void;
}> = ({ icon, label, checked, onChange }) => (
  <div className="flex items-center gap-3 px-3.5 py-3">
    <RowIcon icon={icon} />
    <span className="flex-1 text-left font-medium text-[12px]" style={{ color: 'var(--color-premium-text)' }}>
      {label}
    </span>
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="relative w-9 h-5 rounded-full cursor-pointer transition-colors"
      style={{ backgroundColor: checked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-track)' }}
    >
      <motion.span
        className="absolute top-[2px] w-4 h-4 rounded-full"
        style={{ backgroundColor: 'var(--color-premium-text)' }}
        animate={{ left: checked ? 18 : 2 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />
    </button>
  </div>
);

const NavRow: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
}> = ({ icon, label, value }) => (
  <button onClick={() => playClick()} className="w-full flex items-center gap-3 px-3.5 py-3 cursor-pointer">
    <RowIcon icon={icon} />
    <span className="flex-1 text-left font-medium text-[12px]" style={{ color: 'var(--color-premium-text)' }}>
      {label}
    </span>
    {value && (
      <span className="text-[11px] font-medium" style={{ color: 'var(--color-premium-text-secondary)' }}>
        {value}
      </span>
    )}
    <ChevronRight size={14} color="var(--color-premium-text-secondary)" />
  </button>
);

const ReadOnlyRow: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 px-3.5 py-3">
    <RowIcon icon={icon} />
    <span className="flex-1 text-left font-medium text-[12px]" style={{ color: 'var(--color-premium-text)' }}>
      {label}
    </span>
    <span className="text-[11px] font-bold" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {value}
    </span>
  </div>
);
