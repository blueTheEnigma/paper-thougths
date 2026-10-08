"use client";

import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

export default function InstallAppButton({ 
  variant = "pill", // "pill" | "nav" | "compact" | "card"
  className = "" 
}) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkStandalone = () => {
      const isStandaloneMode = 
        (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) || 
        (typeof window !== 'undefined' && window.navigator.standalone === true) || 
        (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
  }, []);

  if (!mounted || isStandalone) {
    return null; // Don't show if already in standalone app
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      if (typeof window.triggerPTInstall === 'function') {
        window.triggerPTInstall();
      } else if (typeof window.openPTInstallModal === 'function') {
        window.openPTInstallModal();
      } else {
        window.dispatchEvent(new CustomEvent('open-pt-install-modal'));
      }
    }
  };

  if (variant === "nav") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#20070E] to-[#5C1A2E] text-[#FAF7F0] border border-[#F2A98A]/30 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer ${className}`}
        title="Install Paper Thoughts to your home screen"
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
        title="Install Paper Thoughts"
      >
        <Smartphone size={12} />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#20070E] via-[#140409] to-[#2c0b15] border border-[#F2A98A]/30 text-[#FAF7F0] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c96a42]/20 border border-[#c96a42]/40 flex items-center justify-center text-[#F2A98A] flex-shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-sm text-[#FAF7F0]">Get Paper Thoughts On Your Phone</h4>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#c96a42]/20 text-[#c96a42] font-bold">Fast PWA</span>
            </div>
            <p className="text-xs text-[#FAF7F0]/70 mt-0.5">
              Read drops offline, receive lock-screen critique alerts, and launch with zero browser address bars.
            </p>
          </div>
        </div>

        <button
          onClick={handleClick}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#c96a42] to-[#5C1A2E] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Download size={14} />
          <span>Install to Device</span>
        </button>
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
