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
    <div className="space-y-8 animate-fade-in pb-16">

      {/* Share Modal */}
      {isShareModalOpen && (
        <ZodiacShareModal chartResult={chartResult} onClose={() => setIsShareModalOpen(false)} />
      )}

      {/* MAIN NATAL CHART CARD */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-black/95 rounded-3xl p-6 sm:p-10 border border-amber-500/30 shadow-2xl space-y-10 relative overflow-hidden">
        
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-widest">
            ✨ Official Literary Natal Chart
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-amber-100">
            {isCusp ? cuspSignName : `The ${sunSign.name}`}
          </h2>

          <p className="text-lg italic text-amber-200/80 max-w-xl mx-auto font-serif">
            "{sunSign.tagline}"
          </p>
        </div>

        {/* ASTROLOGICAL TRIAD (Sun, Moon, Rising) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* SUN SIGN */}
          <div className="bg-gradient-to-b from-amber-950/40 to-slate-950/80 p-6 rounded-2xl border border-amber-500/40 space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                ☀️ Book Sun
              </span>
              <span className="text-3xl">{sunSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-amber-100">
              The {sunSign.name}
            </h3>
            <p className="text-xs text-amber-300/80 font-mono">
              Primary Essence • Highest Total Score
            </p>
            <p className="text-sm text-amber-100/70 leading-relaxed pt-1">
              {sunSign.description}
            </p>
          </div>

          {/* MOON SIGN */}
          <div className="bg-gradient-to-b from-purple-950/40 to-slate-950/80 p-6 rounded-2xl border border-purple-500/30 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                🌙 Book Moon
              </span>
              <span className="text-3xl">{moonSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-purple-100">
              The {moonSign.name}
            </h3>
            <p className="text-xs text-purple-300/80 font-mono">
              Inner Reader • {chosenElement} Driven
            </p>
            <p className="text-sm text-purple-100/70 leading-relaxed pt-1">
              {moonSign.description}
            </p>
          </div>

          {/* RISING SIGN */}
          <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950/80 p-6 rounded-2xl border border-indigo-500/30 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                ⬆️ Book Rising
              </span>
              <span className="text-3xl">{risingSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-indigo-100">
              The {risingSign.name}
            </h3>
            <p className="text-xs text-indigo-300/80 font-mono">
              Reading Persona • Inhabits {chosenRealm}
            </p>
            <p className="text-sm text-indigo-100/70 leading-relaxed pt-1">
              {risingSign.description}
            </p>
          </div>

        </div>

        {/* CHART DETAILS BREAKDOWN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-950/60 rounded-2xl border border-white/5 text-center text-xs font-mono">
          <div className="space-y-1">
            <span className="text-amber-400/70 uppercase">Book Element</span>
            <p className="text-sm font-semibold text-amber-200">{chosenElement}</p>
          </div>
          <div className="space-y-1">
            <span className="text-amber-400/70 uppercase">Book Realm</span>
            <p className="text-sm font-semibold text-amber-200">{chosenRealm}</p>
          </div>
          <div className="space-y-1">
            <span className="text-amber-400/70 uppercase">Story House</span>
            <p className="text-sm font-semibold text-amber-200">{chosenHouse}</p>
          </div>
          <div className="space-y-1">
            <span className="text-amber-400/70 uppercase">Story Medium</span>
            <p className="text-sm font-semibold text-amber-200">{chosenMedium}</p>
          </div>
        </div>

        {/* SUPERPOWER & KRYPTONITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              ⚡ Literary Superpower
            </span>
            <p className="text-sm text-emerald-100/90 font-serif italic">
              "{sunSign.superpower}"
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-2">
            <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
              🥀 Literary Kryptonite
            </span>
            <p className="text-sm text-rose-100/90 font-serif italic">
              "{sunSign.kryptonite}"
            </p>
          </div>
        </div>

        {/* MATCHING SOUNDSCAPE BRIDGE */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950/60 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-mono text-purple-300 uppercase tracking-widest">
              🎧 Curated Reading Soundscape Match
            </div>
            <h4 className="text-xl font-serif font-bold text-amber-100 flex items-center justify-center sm:justify-start gap-2">
              <span>{matchingSoundscape.emoji}</span>
              <span>{matchingSoundscape.title}</span>
            </h4>
            <p className="text-xs text-amber-200/70">{matchingSoundscape.vibe}</p>
          </div>

          <Link
            href={`/soundscapes#${matchingSoundscape.id}`}
            className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Press Play on Spotify 🎵
          </Link>
        </div>

        {/* MATCHING ARCHETYPES */}
        {matchedArchetypes.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-mono text-amber-300/80 uppercase tracking-wider">
              🎭 Your Matching Reader Archetypes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedArchetypes.slice(0, 2).map((arch) => (
                <Link
                  key={arch.id}
                  href={`/archetype#${arch.id}`}
                  className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-amber-500/40 transition-all flex items-center gap-4 group"
                >
                  <span className="text-3xl">{arch.emoji}</span>
                  <div>
                    <h5 className="text-base font-serif font-bold text-amber-100 group-hover:text-amber-300">
                      {arch.name}
                    </h5>
                    <p className="text-xs text-amber-200/70 italic">"{arch.tagline}"</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Share Your Natal Chart 📲
          </button>

          <button
            onClick={onRetake}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-200 font-medium text-sm transition-all cursor-pointer"
          >
            Retake Zodiac Quiz 🔄
          </button>
        </div>

      </div>
    </div>
  );
}
