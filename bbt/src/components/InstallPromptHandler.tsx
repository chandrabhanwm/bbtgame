import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/** True for iOS Safari specifically — the one major platform with
 *  genuinely no install API at all. Detected via user agent, since
 *  there's no feature to detect here (the absence of a feature). */
function isIOSSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

function isAlreadyInstalled(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

export const InstallPromptHandler: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled()) return;

    if (isIOSSafari()) {
      // No beforeinstallprompt equivalent exists on iOS Safari at all —
      // this banner is the only possible path.
      setShowIOSBanner(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      // Captured, but deliberately NOT auto-triggered. Chrome has a
      // documented issue where an auto-called, then-dismissed prompt
      // causes beforeinstallprompt to keep re-firing every few seconds
      // — each re-fire calling prompt() again — which reads exactly
      // like a continuous refresh/interruption loop. Waiting for a
      // real user tap avoids this entirely, since the browser only
      // re-fires after an *automatically* triggered dismissal, not a
      // deliberate one.
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallTap = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  if (showIOSBanner || (deferredPrompt && !dismissed)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
          <div
            className="rounded-2xl p-3.5 flex items-center gap-3 max-w-sm mx-auto"
            style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border-strong)' }}
          >
            <span className="text-2xl flex-shrink-0">📲</span>
            <div className="flex-1">
              <div className="font-bold text-[12px]" style={{ color: 'var(--color-premium-text)' }}>
                Install this app
              </div>
              {showIOSBanner ? (
                <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--color-premium-text-secondary)' }}>
                  Tap <span className="font-bold">Share</span> below, then <span className="font-bold">Add to Home Screen</span>.
                </div>
              ) : (
                <button
                  onClick={handleInstallTap}
                  className="text-[10.5px] font-bold mt-0.5 cursor-pointer"
                  style={{ color: 'var(--color-premium-gold-400)' }}
                >
                  Tap to install →
                </button>
              )}
            </div>
            <button
              onClick={() => { setShowIOSBanner(false); setDismissed(true); }}
              className="text-[11px] font-bold px-2 cursor-pointer flex-shrink-0"
              style={{ color: 'var(--color-premium-text-secondary)' }}
            >
              ✕
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};
