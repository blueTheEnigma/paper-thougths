'use client';

import { useState } from 'react';
import { SOUNDSCAPES } from '../../lib/soundscapesData';

export default function SoundscapesGrid() {
  const [activeEmbedId, setActiveEmbedId] = useState(null);

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

      {/* 3x3 ATMOSPHERIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SOUNDSCAPES.map((soundscape) => {
          const isPlaying = activeEmbedId === soundscape.id;

          return (
            <div
              key={soundscape.id}
              id={soundscape.id}
              className="bg-[#120308]/90 backdrop-blur-xl rounded-3xl p-6 border border-[#F2A98A]/20 hover:border-[#F2A98A]/50 shadow-2xl space-y-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{soundscape.emoji}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#5c1a2e]/35 border border-[#F2A98A]/20 text-[#F2A98A]">
                    {soundscape.vibe}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                  {soundscape.title}
                </h3>

                <p className="text-sm text-cream/70 leading-relaxed font-serif">
                  {soundscape.description}
                </p>
              </div>

              {/* EMBED PLAYER OR PLAY TRIGGER */}
              <div className="pt-4 space-y-3">
                {isPlaying ? (
                  <div className="rounded-2xl overflow-hidden border border-[#5c1a2e]/40">
                    <iframe
                      src={soundscape.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveEmbedId(soundscape.id)}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#5c1a2e]/20 to-[#c96a42]/20 hover:from-[#5c1a2e] hover:to-[#c96a42] text-cream hover:text-white border border-[#F2A98A]/20 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                  >
                    <span>▶</span> Listen Inline
                  </button>
                )}

                <a
                  href={soundscape.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-[#F2A98A] hover:text-cream underline font-mono font-bold"
                >
                  Open in Spotify App ↗
                </a>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
