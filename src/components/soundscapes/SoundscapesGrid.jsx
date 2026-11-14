'use client';

import { SOUNDSCAPES } from '../../lib/soundscapesData';

export default function SoundscapesGrid() {
  return (
    <div className="space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
          🎵 Paper Thoughts Literary Soundscapes
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-bold text-cream tracking-tight">
          Soundtracks for Your Reading Life
        </h1>

        <p className="text-base sm:text-lg font-serif italic text-cream/80">
          "Every mood. Every story. Every page."
        </p>
      </div>

      {/* 3x3 ATMOSPHERIC GRID / HORIZONTAL SNAP ON MOBILE */}
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-4 pt-1 -mx-4 px-4 md:mx-0 md:px-0">
        {SOUNDSCAPES.map((soundscape) => {
          return (
            <div
              key={soundscape.id}
              id={soundscape.id}
              className="w-[85vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink bg-[#120308]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-[#F2A98A]/20 hover:border-[#F2A98A]/50 shadow-2xl space-y-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
            >
              {/* Subtle card glow on hover */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#c96a42]/10 rounded-full blur-2xl group-hover:bg-[#c96a42]/20 transition-all pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{soundscape.emoji}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A]">
                    {soundscape.vibe}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                  {soundscape.title}
                </h3>

                <p className="text-sm text-cream/75 leading-relaxed font-serif">
                  {soundscape.description}
                </p>
              </div>

              {/* DIRECT SPOTIFY LINK BUTTON */}
              <div className="pt-4 relative z-10">
                <a
                  href={soundscape.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-95 group-hover:shadow-[#c96a42]/25"
                >
                  <span>Listen on Spotify</span>
                  <span className="text-base">🎵</span>
                </a>
              </div>

            </div>
          );
        })}
      </div>

      {/* Mobile Swipe Hint */}
      <div className="md:hidden flex items-center justify-center gap-1.5 text-xs text-[#F2A98A]/70 font-mono tracking-wider -mt-6">
        <span>← Swipe soundscapes →</span>
      </div>

    </div>
  );
}
