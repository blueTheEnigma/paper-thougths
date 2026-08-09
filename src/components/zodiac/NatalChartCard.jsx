'use client';

import { useState } from 'react';
import Link from 'next/link';
import ZodiacShareModal from './ZodiacShareModal';
import { SOUNDSCAPES } from '../../lib/soundscapesData';
import { ARCHETYPES } from '../../lib/archetypesData';

export default function NatalChartCard({ chartResult, onRetake }) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { sunSign, moonSign, risingSign, isCusp, cuspSignName, chosenElement, chosenRealm, chosenHouse, chosenMedium } = chartResult;

  // Find matching soundscape
  const matchingSoundscape = SOUNDSCAPES.find(s => sunSign.soundscapes.includes(s.id)) || SOUNDSCAPES[0];

  // Find matching archetypes
  const matchingArchetypeKeys = sunSign.archetypeMatches || ['marathon', 'mood'];
  const matchedArchetypes = matchingArchetypeKeys.map(k => ARCHETYPES[k]).filter(Boolean);

  return (
    <div className="space-y-10 animate-fade-in pb-16">

      {/* Share Modal */}
      {isShareModalOpen && (
        <ZodiacShareModal chartResult={chartResult} onClose={() => setIsShareModalOpen(false)} />
      )}

      {/* MAIN NATAL CHART CARD */}
      <div 
        className="bg-gradient-to-b from-[#120308] via-[#0d0205]/95 to-black/95 rounded-3xl p-6 sm:p-10 border border-[#F2A98A]/35 shadow-2xl space-y-10 relative overflow-hidden"
      >
        
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c96a42]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            ✨ Official Literary Natal Chart
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-cream tracking-tight leading-tight">
            {isCusp ? cuspSignName : `The ${sunSign.name}`}
          </h2>

          <p className="text-lg italic text-cream/80 max-w-xl mx-auto font-serif">
            "{sunSign.tagline}"
          </p>
        </div>

        {/* ASTROLOGICAL TRIAD (Sun, Moon, Rising) - Styled as Pinned parchment cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* SUN SIGN */}
          <div className="bg-[#FFF5EC] p-6 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-3 relative shadow-md">
            {/* Taped overlay ornament */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#C5A059]/20 transform rotate-1 border-l border-r border-[#C5A059]/30" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-[#5C1A2E] uppercase tracking-wider">
                ☀️ Book Sun
              </span>
              <span className="text-3xl">{sunSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#5C1A2E]">
              The {sunSign.name}
            </h3>
            <p className="text-[10px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
              Primary Essence • Score Peak
            </p>
            <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
              {sunSign.description}
            </p>
          </div>

          {/* MOON SIGN */}
          <div className="bg-[#FFF5EC] p-6 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-3 relative shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#C5A059]/20 transform -rotate-1 border-l border-r border-[#C5A059]/30" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-[#5C1A2E] uppercase tracking-wider">
                🌙 Book Moon
              </span>
              <span className="text-3xl">{moonSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#5C1A2E]">
              The {moonSign.name}
            </h3>
            <p className="text-[10px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
              Inner Reader • {chosenElement} Driven
            </p>
            <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
              {moonSign.description}
            </p>
          </div>

          {/* RISING SIGN */}
          <div className="bg-[#FFF5EC] p-6 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-3 relative shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#C5A059]/20 transform rotate-2 border-l border-r border-[#C5A059]/30" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-[#5C1A2E] uppercase tracking-wider">
                ⬆️ Book Rising
              </span>
              <span className="text-3xl">{risingSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#5C1A2E]">
              The {risingSign.name}
            </h3>
            <p className="text-[10px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
              Reading Persona • Inhabits {chosenRealm}
            </p>
            <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
              {risingSign.description}
            </p>
          </div>

        </div>

        {/* CHART DETAILS BREAKDOWN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-[#FFF5EC]/10 rounded-2xl border border-[#F2A98A]/15 text-center text-xs font-mono">
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Book Element</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenElement}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Book Realm</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenRealm}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Story House</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenHouse}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Story Medium</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenMedium}</p>
          </div>
        </div>

        {/* SUPERPOWER & KRYPTONITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-2 shadow-md">
            <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
              ⚡ Literary Superpower
            </span>
            <p className="text-sm leading-relaxed font-serif italic font-medium">
              "{sunSign.superpower}"
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-2 shadow-md">
            <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
              🥀 Literary Kryptonite
            </span>
            <p className="text-sm leading-relaxed font-serif italic font-medium">
              "{sunSign.kryptonite}"
            </p>
          </div>
        </div>

        {/* MATCHING SOUNDSCAPE BRIDGE */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#5c1a2e]/30 via-[#c96a42]/10 to-[#120308] border border-[#F2A98A]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-mono font-bold text-[#F2A98A] uppercase tracking-wider">
              🎧 Curated Reading Soundscape Match
            </div>
            <h4 className="text-xl font-serif font-bold text-cream flex items-center justify-center sm:justify-start gap-2">
              <span>{matchingSoundscape.emoji}</span>
              <span>{matchingSoundscape.title}</span>
            </h4>
            <p className="text-xs text-cream/70 font-serif italic">{matchingSoundscape.vibe}</p>
          </div>

          <Link
            href={`/soundscapes#${matchingSoundscape.id}`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Press Play on Spotify 🎵
          </Link>
        </div>

        {/* MATCHING ARCHETYPES */}
        {matchedArchetypes.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#F2A98A]/80 uppercase tracking-wider">
              🎭 Your Matching Reader Archetypes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedArchetypes.slice(0, 2).map((arch) => (
                <Link
                  key={arch.id}
                  href={`/archetype#${arch.id}`}
                  className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-[#F2A98A]/40 transition-all flex items-center gap-4 group"
                >
                  <span className="text-3xl">{arch.emoji}</span>
                  <div>
                    <h5 className="text-base font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                      {arch.name}
                    </h5>
                    <p className="text-xs text-cream/60 italic font-serif mt-0.5">"{arch.tagline}"</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/10">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-base shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Share Your Natal Chart 📲
          </button>

          <button
            onClick={onRetake}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-cream/80 hover:text-cream text-sm font-semibold transition-all cursor-pointer"
          >
            Retake Zodiac Quiz 🔄
          </button>
        </div>

      </div>
    </div>
  );
}
