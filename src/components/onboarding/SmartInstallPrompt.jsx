"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, X, Share, PlusSquare, Smartphone, Monitor, 
  CheckCircle2, Sparkles, ExternalLink, Copy, Check, ChevronRight, HelpCircle
} from 'lucide-react';

export default function SmartInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null); // 'ios', 'android', 'desktop', 'in-app', 'standalone'
  const [isStandalone, setIsStandalone] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeTab, setActiveTab] = useState('android');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const standaloneMode = 
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) || 
      (typeof window !== 'undefined' && window.navigator.standalone === true) || 
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));

    if (standaloneMode) {
      setIsStandalone(true);
      setPlatform('standalone');
      return;
    }

    // Check banner dismissed in session
    const isDismissed = sessionStorage.getItem('pt_install_prompt_dismissed') === 'true';
    if (isDismissed) {
      setBannerDismissed(true);
    }

    // Detect browser & device
    const ua = window.navigator.userAgent || window.navigator.vendor || window.opera || '';
    const isInApp = /Instagram|FBAN|FBAV|WhatsApp|TikTok|Snapchat/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);

    if (isInApp) {
      setPlatform('in-app');
      setActiveTab(isIOS ? 'ios' : 'android');
    } else if (isIOS) {
      setPlatform('ios');
      setActiveTab('ios');
    } else if (isAndroid) {
      setPlatform('android');
      setActiveTab('android');
    } else {
      setPlatform('desktop');
      setActiveTab('android'); // Default to mobile instructions if on desktop viewing mobile
    }

    // Capture beforeinstallprompt (Android / Desktop Chrome / Edge)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__pt_deferred_prompt = e;
      if (!isIOS && !isInApp) {
        setPlatform('android');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Global event listeners to open modal from ANY button on the site
    const handleOpenModal = (e) => {
      setShowInstructions(true);
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    const handlePromptInstall = async () => {
      const promptToUse = deferredPrompt || window.__pt_deferred_prompt;
      if (promptToUse) {
        promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        if (outcome === 'accepted') {
          setBannerDismissed(true);
        }
        setDeferredPrompt(null);
        window.__pt_deferred_prompt = null;
      } else {
        setShowInstructions(true);
      }
    };

    window.addEventListener('open-pt-install-modal', handleOpenModal);
    window.addEventListener('trigger-pt-install', handlePromptInstall);

    // Expose helpers globally
    window.openPTInstallModal = (tab) => {
      window.dispatchEvent(new CustomEvent('open-pt-install-modal', { detail: { tab } }));
    };
    window.triggerPTInstall = handlePromptInstall;

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('open-pt-install-modal', handleOpenModal);
      window.removeEventListener('trigger-pt-install', handlePromptInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__pt_deferred_prompt : null);
    if (promptToUse) {
      promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setBannerDismissed(true);
        sessionStorage.setItem('pt_install_prompt_dismissed', 'true');
      }
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') window.__pt_deferred_prompt = null;
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('pt_install_prompt_dismissed', 'true');
  };

  const copyAppUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('https://paperthoughts.org/dashboard');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // If already running standalone, do not show install UI
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 1. Floating Bottom Notification Banner (Visible on mobile/desktop until dismissed) */}
      <AnimatePresence>
        {!bannerDismissed && !showInstructions && platform && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-20 lg:bottom-6 left-3 right-3 max-w-md mx-auto z-40"
          >
            <div className="bg-gradient-to-r from-[#20070e] via-[#140409] to-[#2c0b15] border border-[#F2A98A]/35 text-cream rounded-2xl p-3.5 sm:p-4 shadow-[0_15px_35px_rgba(0,0,0,0.65)] backdrop-blur-xl flex items-center justify-between gap-3">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c96a42] to-[#5c1a2e] flex items-center justify-center text-cream shadow-md flex-shrink-0">
                  <Download size={18} className="animate-bounce text-[#FAF7F0]" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-xs text-cream tracking-tight">Paper Thoughts Native App</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#F2A98A]/20 text-[#F2A98A] font-mono rounded font-bold uppercase">PWA</span>
                  </div>
                  <p className="text-[11px] text-cream/70 leading-tight">
                    {platform === 'in-app' 
                      ? 'Open in Chrome/Safari to install natively.' 
                      : platform === 'ios'
                      ? 'Add to Home Screen for lock-screen alerts.'
                      : 'Install to device for 1-tap reading & alerts.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream font-sans font-bold text-[11px] uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  {deferredPrompt ? 'Install Now' : 'How to Install'}
                </button>

                <button
                  onClick={handleDismissBanner}
                  className="text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  title="Dismiss banner"
                >
                  <X size={15} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Persistent Unobtrusive Quick-Install Pill (Appears if banner was dismissed) */}
      <AnimatePresence>
        {bannerDismissed && !showInstructions && platform && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-20 lg:bottom-6 right-3 z-30"
          >
            <button
              onClick={() => setShowInstructions(true)}
              className="bg-[#20070e]/90 hover:bg-[#20070e] border border-[#F2A98A]/40 text-[#FAF7F0] px-3 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Install Paper Thoughts to your home screen"
            >
              <Download size={14} className="text-[#c96a42]" />
              <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">Install App</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Reforged Interactive Step-by-Step Installation Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#140409] border border-[#F2A98A]/35 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative text-cream space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-4 right-4 text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="space-y-1 text-center sm:text-left pr-8">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2A98A] font-bold">
                    Native Device Setup
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#c96a42]/20 text-[#c96a42] font-bold">
                    Zero App Store Friction
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-cream">
                  Install Paper Thoughts
                </h3>
                <p className="text-xs text-cream/70 leading-relaxed">
                  Fast navigation, offline drafts, lockscreen critique alerts, and zero browser bars.
                </p>
              </div>

              {/* Device Selector Tabs */}
              <div className="flex rounded-xl bg-[#080104] p-1 border border-[#F2A98A]/20">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'android'
                      ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-white shadow-sm'
                      : 'text-cream/60 hover:text-cream'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Android (Chrome)</span>
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'ios'
                      ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-white shadow-sm'
                      : 'text-cream/60 hover:text-cream'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>iPhone (Safari)</span>
                </button>
                <button
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'desktop'
                      ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-white shadow-sm'
                      : 'text-cream/60 hover:text-cream'
                  }`}
                >
                  <Monitor size={14} />
                  <span>PC / Mac</span>
                </button>
              </div>

              {/* In-App Browser Notice (If opened inside WhatsApp / Instagram) */}
              {platform === 'in-app' && (
                <div className="p-3.5 rounded-2xl bg-[#5c1a2e]/30 border border-[#c96a42]/40 text-xs text-cream/90 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#F2A98A]">
                    <ExternalLink size={14} />
                    <span>In-App Browser Detected</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-cream/80">
                    Instagram and WhatsApp block native app installs. Tap the menu (⋯) in your corner and select <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong>.
                  </p>
                  <button
                    onClick={copyAppUrl}
                    className="w-full py-2 px-3 rounded-lg bg-[#080104] hover:bg-black/60 border border-[#F2A98A]/30 text-cream text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedLink ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Sanctuary Link Copied!' : 'Copy Link to Paste in Chrome/Safari'}</span>
                  </button>
                </div>
              )}

              {/* TAB 1: ANDROID (CHROME / BRAVE / SAMSUNG) */}
              {activeTab === 'android' && (
                <div className="space-y-4 bg-[#080104] p-4.5 rounded-2xl border border-[#F2A98A]/20">
                  {deferredPrompt ? (
                    <div className="text-center py-2 space-y-3">
                      <div className="p-3 bg-[#5c1a2e]/20 rounded-xl border border-[#c96a42]/30">
                        <Sparkles size={20} className="mx-auto text-[#c96a42] mb-1" />
                        <p className="text-xs font-bold text-cream">Your browser is primed and ready!</p>
                        <p className="text-[11px] text-cream/70">Tap below to install directly to your device launcher.</p>
                      </div>
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c96a42] to-[#5c1a2e] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download size={16} />
                        <span>Install Paper Thoughts (1-Tap)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="text-cream font-bold">Tap the Three Dots Menu (⋮)</p>
                          <p className="text-cream/70">Located in the top-right corner of Google Chrome or Brave.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="text-cream font-bold">Look for "Install App" or "Add to Home screen"</p>
                          <p className="text-cream/70">
                            Chrome will display a phone icon with <strong>"Install app"</strong>. Tap it.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="text-cream font-bold">Tap "Install" on the confirmation prompt</p>
                          <p className="text-cream/70">
                            The official Paper Thoughts icon will be placed directly in your app drawer!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: IPHONE (SAFARI) */}
              {activeTab === 'ios' && (
                <div className="space-y-3.5 bg-[#080104] p-4.5 rounded-2xl border border-[#F2A98A]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-cream font-bold flex items-center gap-1.5">
                        <span>Tap the Share Button</span>
                        <Share size={13} className="text-[#F2A98A]" />
                      </p>
                      <p className="text-cream/70">
                        At the bottom bar of Safari (the square icon with the arrow pointing up).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-cream font-bold flex items-center gap-1.5">
                        <span>Scroll down & tap "Add to Home Screen"</span>
                        <PlusSquare size={13} className="text-[#F2A98A]" />
                      </p>
                      <p className="text-cream/70">
                        Look for the square icon with a plus sign in the share sheet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-cream font-bold">Tap "Add" in the top-right corner</p>
                      <p className="text-cream/70">
                        Paper Thoughts will install instantly to your home screen with no URL bars!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DESKTOP (PC / MAC / CHROME / EDGE) */}
              {activeTab === 'desktop' && (
                <div className="space-y-3.5 bg-[#080104] p-4.5 rounded-2xl border border-[#F2A98A]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-cream font-bold">Look at your Browser Address Bar</p>
                      <p className="text-cream/70">
                        In Google Chrome or Microsoft Edge, look at the right side of the URL bar (near the bookmark star).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-cream font-bold">Click the "Install Paper Thoughts" icon</p>
                      <p className="text-cream/70">
                        It looks like a computer screen with an arrow or a small monitor icon.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-cream font-bold">Launch as a standalone desktop window</p>
                      <p className="text-cream/70">
                        Enjoy lightning-fast writing without opening browser tabs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Done / Dismiss Button */}
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-cream font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Guide
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
