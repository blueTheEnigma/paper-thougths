"use client";

import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export default function InstallAppButton({ 
  variant = "pill", // "pill" | "nav" | "compact" | "card"
  className = "" 
}) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cardDismissed, setCardDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkStandalone = () => {
      const ua = (typeof window !== 'undefined' ? window.navigator.userAgent : '') || '';
      const isStandaloneMode = 
        ua.includes('PaperThoughtsNative') ||
        (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) || 
        (typeof window !== 'undefined' && window.navigator.standalone === true) || 
        (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    try {
      if (typeof window !== 'undefined' && localStorage.getItem('pt_card_install_dismissed') === 'true') {
        setCardDismissed(true);
      }
    } catch (e) {}
  }, []);

  if (!mounted || isStandalone) {
    return null; // Don't show if already in standalone app or during SSR
  }

  if (variant === "card" && cardDismissed) {
    return null; // User dismissed dashboard card
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      if (typeof window.openPTInstallModal === 'function') {
        window.openPTInstallModal();
      } else {
        window.dispatchEvent(new CustomEvent('open-pt-install-modal'));
      }
    }
  };

  const handleDismissCard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCardDismissed(true);
    try {
      localStorage.setItem('pt_card_install_dismissed', 'true');
    } catch (e) {}
  };

  if (variant === "nav") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#20070E] to-[#5C1A2E] text-[#FAF7F0] border border-[#F2A98A]/30 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer ${className}`}
        title="Install Paper Thoughts or Download APK"
      >
        <Download size={13} className="text-[#c96a42] animate-pulse" />
        <span className="hidden xl:inline">Install App</span>
        <span className="xl:hidden">App</span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1 text-[11px] font-bold text-[#c96a42] hover:text-[#5C1A2E] bg-[#c96a42]/10 hover:bg-[#c96a42]/20 px-2 py-1 rounded-lg transition-colors cursor-pointer ${className}`}
        title="Get Paper Thoughts App"
      >
        <Smartphone size={12} />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#20070E] via-[#140409] to-[#2c0b15] border border-[#F2A98A]/30 text-[#FAF7F0] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative ${className}`}>
        {/* Dismiss Button */}
        <button
          onClick={handleDismissCard}
          className="absolute top-3 right-3 text-[#FAF7F0]/40 hover:text-[#FAF7F0] p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 pr-6 sm:pr-0">
          <div className="w-10 h-10 rounded-xl bg-[#c96a42]/20 border border-[#c96a42]/40 flex items-center justify-center text-[#F2A98A] flex-shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-sm text-[#FAF7F0]">Get Paper Thoughts On Your Phone</h4>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#c96a42]/20 text-[#c96a42] font-bold">APK & PWA</span>
            </div>
            <p className="text-xs text-[#FAF7F0]/70 mt-0.5">
              Choose between downloading the direct Android APK or saving straight to your home screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <a
            href="/paper-thoughts.apk"
            download="PaperThoughts.apk"
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c96a42] to-[#5C1A2E] hover:brightness-110 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <Download size={13} />
            <span>Download APK</span>
          </a>
          <button
            onClick={handleClick}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-[#FAF7F0] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="View all install options"
          >
            <span>Options</span>
          </button>
        </div>
      </div>
    );
  }

  // Default "pill"
  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-full bg-[#20070e] text-[#FAF7F0] border border-[#F2A98A]/40 text-xs font-bold hover:bg-[#5C1A2E] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${className}`}
    >
      <Download size={13} className="text-[#c96a42]" />
      <span>Install App</span>
    </button>
  );
}
