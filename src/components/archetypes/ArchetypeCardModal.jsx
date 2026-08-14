'use client';

import { useState } from 'react';

export default function ArchetypeCardModal({ archetype, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!archetype) return null;

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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-[#18050c] via-[#100206] to-[#080103] border border-[#F2A98A]/35 rounded-3xl p-6 sm:p-8 max-w-4xl w-full my-8 space-y-6 shadow-2xl relative animate-scale-up text-cream"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cream/60 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-all z-20 cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: 2:3 High-Res Poster Image */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            <div className="w-full max-w-[320px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-[#F2A98A]/30 shadow-2xl bg-black relative group">
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
              className="w-full max-w-[320px] py-2.5 px-4 rounded-xl bg-[#5C1A2E]/50 hover:bg-[#5C1A2E] border border-[#F2A98A]/30 text-cream font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-md"
            >
              <span>Download Art Poster</span>
              <span>📥</span>
            </button>
          </div>

          {/* RIGHT: Detailed Lore & Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header / Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
                <span>{archetype.emoji}</span>
                <span>{archetype.name}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
                {archetype.name}
              </h2>

              <p className="text-base italic text-[#F2A98A]/90 font-serif">
                "{archetype.tagline}"
              </p>
            </div>

            {/* Core Traits */}
            {archetype.traits && (
              <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-mono font-bold text-[#F2A98A] uppercase tracking-wider">
                  ✦ Defining Traits
                </span>
                <ul className="space-y-1.5 text-xs sm:text-sm text-cream/85 font-serif">
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
              <div className="p-4 rounded-xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] shadow-md space-y-1">
                <span className="font-bold text-[#5C1A2E] text-xs flex items-center gap-1 font-mono uppercase">
                  ⚡ Superpower
                </span>
                <p className="text-[#2C1A0E]/85 font-serif leading-relaxed italic">
                  "{archetype.superpower}"
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] shadow-md space-y-1">
                <span className="font-bold text-rose-700 text-xs flex items-center gap-1 font-mono uppercase">
                  🥀 Kryptonite
                </span>
                <p className="text-[#2C1A0E]/85 font-serif leading-relaxed italic">
                  "{archetype.kryptonite}"
                </p>
              </div>
            </div>

            {/* Literary Soulmates & Authors */}
            <div className="space-y-3 text-xs">
              {archetype.literarySoulmates && (
                <div>
                  <span className="font-mono text-cream/60 font-bold uppercase text-[11px] block mb-1.5">
                    📖 Literary Soulmates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {archetype.literarySoulmates.map((sm, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cream/90 text-xs font-serif">
                        {sm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {archetype.authors && (
                <div>
                  <span className="font-mono text-cream/60 font-bold uppercase text-[11px] block mb-1.5">
                    🖋️ Resonant Authors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {archetype.authors.map((auth, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-[#F2A98A]/10 border border-[#F2A98A]/20 text-[#F2A98A] text-xs font-serif">
                        {auth}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Catchphrase / Fun fact */}
            {archetype.catchphrase && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e]/30 to-transparent border-l-4 border-[#F2A98A] text-xs font-serif italic text-cream/80">
                "{archetype.catchphrase}"
              </div>
            )}

            {/* Share / Social Buttons */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono text-cream/50 mr-1">Share:</span>
              
              <button
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-700/30 hover:bg-emerald-700/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>WhatsApp</span>
                <span>💬</span>
              </button>

              <button
                onClick={handleShareTwitter}
                className="px-3.5 py-2 rounded-xl bg-sky-900/30 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>X / Twitter</span>
                <span>🐦</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cream text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{copied ? 'Link Copied! ✓' : 'Copy Link 🔗'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
