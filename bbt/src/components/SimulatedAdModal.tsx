import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SimulatedAdModalProps {
  isOpen: boolean;
  countdown: number;
}

/**
 * The simulated third-party ad shown before any "double it?" or
 * scratch-card ad-gated reward. Deliberately styled to look like a
 * generic ad, not part of the app's own branding — this is why it
 * still uses amber/gold tones even after the app's own theme moved to
 * ocean blue.
 */
export const SimulatedAdModal: React.FC<SimulatedAdModalProps> = ({ isOpen, countdown }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between"
        >
          <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center relative z-10">
            <div className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-bold tracking-wide uppercase">
              Sponsored
            </div>
            <div className="px-2.5 py-1 rounded-full bg-black/60 border border-slate-800 text-[10px] font-mono font-bold text-amber-400">
              Reward in {countdown}s
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-2xl mb-6"
            >
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚡️</span>
              </div>
            </motion.div>
            <h2 className="font-bold text-lg text-white uppercase tracking-wide">Become the CoralBay Kingpin!</h2>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Thank you for supporting CoralBay Business Tycoon!</span>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
