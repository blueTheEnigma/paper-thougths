"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Compass, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';

export default function SmartInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null); // 'ios', 'android', 'in-app', 'standalone', or null
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in session
    const isDismissed = sessionStorage.getItem('pt_install_prompt_dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // 1. Detect if running as standalone PWA already
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone || 
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setPlatform('standalone');
      return;
    }

    // 2. Detect In-App Browsers (Instagram, WhatsApp, TikTok, FB)
    const ua = window.navigator.userAgent || window.navigator.vendor || window.opera;
    const isInApp = /Instagram|FBAN|FBAV|WhatsApp|TikTok|Snapchat/i.test(ua);

    if (isInApp) {
      setPlatform('in-app');
      return;
    }

    // 3. Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua);

    if (isIOS) {
      setPlatform('ios');
      return;
    }

    // 4. Android / Desktop Chrome via beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Default mobile fallback
    if (/Android/i.test(ua)) {
      setPlatform('android');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pt_install_prompt_dismissed', 'true');
  };

  // Do not show if standalone or dismissed or not on mobile
  if (dismissed || platform === 'standalone' || !platform) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Notification Pill */}
      <AnimatePresence>
        {!showInstructions && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-20 lg:bottom-6 left-4 right-4 max-w-md mx-auto z-40"
          >
            <div className="bg-gradient-to-r from-[#20070e] via-[#120308] to-[#2c0b15] border border-[#F2A98A]/35 text-cream rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3.5">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c96a42] to-[#5c1a2e] flex items-center justify-center text-cream shadow-md flex-shrink-0">
                  <Download size={18} className="animate-bounce" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-xs text-cream tracking-tight">Install Paper Thoughts</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#F2A98A]/20 text-[#F2A98A] font-mono rounded font-bold uppercase">App</span>
                  </div>
                  <p className="text-[11px] text-cream/70 leading-tight">
                    {platform === 'in-app' 
                      ? 'Open in browser to install natively.' 
                      : platform === 'ios'
                      ? 'Add to home screen for full app experience.'
                      : 'Install for 1-tap offline reading.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInstructions(true)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream font-sans font-bold text-[11px] uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  {platform === 'android' && deferredPrompt ? 'Install' : 'How to'}
                </button>

                <button
                  onClick={handleDismiss}
                  className="text-cream/40 hover:text-cream p-1 rounded-full hover:bg-white/5 transition-colors"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Step-by-Step Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#140409] border border-[#F2A98A]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-cream space-y-6"
            >
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-5 right-5 text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2A98A] font-bold">
                  Standalone PWA Setup
                </span>
                <h3 className="text-2xl font-serif font-bold text-cream">
                  Install Paper Thoughts
                </h3>
                <p className="text-xs text-cream/60">
                  Experience fast navigation, zero browser bars, and instant access from your home screen.
                </p>
              </div>

              {/* In-App Browser Warning */}
              {platform === 'in-app' ? (
                <div className="space-y-4 bg-[#080104] p-4 rounded-2xl border border-[#F2A98A]/20">
                  <div className="flex items-center gap-2 text-[#F2A98A] font-mono text-xs font-bold">
                    <ExternalLink size={14} />
                    <span>In-App Browser Detected</span>
                  </div>
                  <p className="text-xs text-cream/80 leading-relaxed font-sans">
                    You're viewing this link inside Instagram, WhatsApp, or TikTok. To install:
                  </p>
                  <ol className="text-xs text-cream/70 space-y-2 list-decimal list-inside font-sans">
                    <li>Tap the <strong>three dots (⋯)</strong> or <strong>Share icon</strong> in the top or bottom corner.</li>
                    <li>Select <strong>"Open in Safari"</strong> (iOS) or <strong>"Open in Chrome"</strong> (Android).</li>
                    <li>Follow the prompt to add to your Home Screen!</li>
                  </ol>
                </div>
              ) : platform === 'ios' ? (
                /* iOS Safari Steps */
                <div className="space-y-4 bg-[#080104] p-4 rounded-2xl border border-[#F2A98A]/20">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs">
                        <p className="text-cream font-bold">Tap the Share icon</p>
                        <p className="text-cream/60">Located at the bottom of your Safari screen (box with an arrow pointing up <Share size={12} className="inline mx-1" />).</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs">
                        <p className="text-cream font-bold">Scroll down and tap "Add to Home Screen"</p>
                        <p className="text-cream/60">Look for the square icon with a plus sign (<PlusSquare size={12} className="inline mx-1" />).</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs">
                        <p className="text-cream font-bold">Tap "Add" in the top-right</p>
                        <p className="text-cream/60">Paper Thoughts will appear on your phone alongside your native apps!</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android Chrome Steps */
                <div className="space-y-4 bg-[#080104] p-4 rounded-2xl border border-[#F2A98A]/20">
                  {deferredPrompt ? (
                    <div className="text-center py-2 space-y-3">
                      <p className="text-xs text-cream/80">Your browser is ready to install Paper Thoughts directly with 1 tap.</p>
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Install Paper Thoughts Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="text-xs">
                          <p className="text-cream font-bold">Tap the Three Dots Menu (⋮)</p>
                          <p className="text-cream/60">Located in the top-right corner of Chrome.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="text-xs">
                          <p className="text-cream font-bold">Select "Install App" or "Add to Home screen"</p>
                          <p className="text-cream/60">Confirm the prompt to install.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-cream font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Got It, Thanks!
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
