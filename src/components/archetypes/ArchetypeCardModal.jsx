'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';

export default function ArchetypeCardModal({ archetype, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock Body Scroll when open
  useEffect(() => {
    if (archetype) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [archetype]);

  if (!mounted || !archetype) return null;

  const shareText = `I am "${archetype.name}" (${archetype.emoji}) on Paper Thoughts! "${archetype.tagline}" Discover your Reader Archetype:`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/archetype#${archetype.id}` : 'https://paperthoughts.org/archetype';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = archetype.image;
    link.download = `paper_thoughts_${archetype.id}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        
        {/* Ambient Dark Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-[#080103]/85 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />

        {/* Modal Card / Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-[#18050c] via-[#100206] to-[#080103] border-t sm:border border-[#F2A98A]/35 rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[86vh] text-cream z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Grab Handle */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

          {/* Sticky Header with Close Button */}
          <div className="px-5 sm:px-7 py-3 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
              <span>{archetype.emoji}</span>
              <span>{archetype.name}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-cream/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Modal Body */}
          <div className="p-5 sm:p-7 md:p-8 overflow-y-auto paper-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              
              {/* LEFT: 2:3 High-Res Poster Image */}
              <div className="lg:col-span-5 flex flex-col items-center space-y-4">
                <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-[#F2A98A]/30 shadow-2xl bg-black relative group">
                  <img
                    src={archetype.image}
                    alt={archetype.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-mono text-[#F2A98A] border border-white/15">
                    {archetype.emoji}
                  </div>
                </div>

                <button
                  onClick={handleDownloadImage}
                  className="w-full max-w-[280px] sm:max-w-[320px] py-2.5 px-4 rounded-xl bg-[#5C1A2E]/50 hover:bg-[#5C1A2E] border border-[#F2A98A]/30 text-cream font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-md"
                >
                  <Download size={14} />
                  <span>Download Art Poster</span>
                </button>
              </div>

              {/* RIGHT: Detailed Lore & Breakdown */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                
                {/* Title & Tagline */}
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
                    {archetype.name}
                  </h2>
                  <p className="text-sm sm:text-base italic text-[#F2A98A]/90 font-serif">
                    &ldquo;{archetype.tagline}&rdquo;
                  </p>
                </div>

                {/* Core Traits */}
                {archetype.traits && (
                  <div className="space-y-2 bg-black/40 p-3.5 sm:p-4 rounded-2xl border border-white/5">
                    <span className="text-[11px] font-mono font-bold text-[#F2A98A] uppercase tracking-wider block">
                      ✦ Defining Traits
                    </span>
                    <ul className="space-y-1 text-xs sm:text-sm text-cream/85 font-serif">
                      {archetype.traits.map((trait, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#F2A98A] mt-0.5">•</span>
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Superpower & Kryptonite */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] shadow-md space-y-1">
                    <span className="font-bold text-[#5C1A2E] text-xs flex items-center gap-1 font-mono uppercase">
                      ⚡ Superpower
                    </span>
                    <p className="text-[#2C1A0E]/85 font-serif leading-relaxed italic">
                      &ldquo;{archetype.superpower}&rdquo;
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] shadow-md space-y-1">
                    <span className="font-bold text-rose-700 text-xs flex items-center gap-1 font-mono uppercase">
                      🥀 Kryptonite
                    </span>
                    <p className="text-[#2C1A0E]/85 font-serif leading-relaxed italic">
                      &ldquo;{archetype.kryptonite}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Literary Soulmates & Authors */}
                <div className="space-y-3 text-xs">
                  {archetype.literarySoulmates && (
                    <div>
                      <span className="font-mono text-cream/60 font-bold uppercase text-[10px] sm:text-[11px] block mb-1">
                        📖 Literary Soulmates:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {archetype.literarySoulmates.map((sm, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-cream/90 text-xs font-serif">
                            {sm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {archetype.authors && (
                    <div>
                      <span className="font-mono text-cream/60 font-bold uppercase text-[10px] sm:text-[11px] block mb-1">
                        🖋️ Resonant Authors:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {archetype.authors.map((auth, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded-lg bg-[#F2A98A]/10 border border-[#F2A98A]/20 text-[#F2A98A] text-xs font-serif">
                            {auth}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Catchphrase */}
                {archetype.catchphrase && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-[#5c1a2e]/30 to-transparent border-l-4 border-[#F2A98A] text-xs font-serif italic text-cream/80">
                    &ldquo;{archetype.catchphrase}&rdquo;
                  </div>
                )}

                {/* Share Strip */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-cream/50 mr-1">Share:</span>
                  
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700/30 hover:bg-emerald-700/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>WhatsApp</span>
                    <span>💬</span>
                  </button>

                  <button
                    onClick={handleShareTwitter}
                    className="px-3 py-1.5 rounded-xl bg-sky-900/30 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>X</span>
                    <span>🐦</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cream text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
