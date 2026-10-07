'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Compass, BookOpen, Music, ArrowRight, RotateCcw } from 'lucide-react';
import { SIGNS } from '../../lib/zodiacData';
import { ARCHETYPES } from '../../lib/archetypesData';

export default function BookZodiacHub() {
  const [selectedCodexSign, setSelectedCodexSign] = useState(null);
  const [savedResult, setSavedResult] = useState(null);
  const [savedProgressStep, setSavedProgressStep] = useState(null);
  const [mounted, setMounted] = useState(false);

  const signsList = Object.values(SIGNS);

  useEffect(() => {
    setMounted(true);
    if (!selectedCodexSign && signsList.length > 0) {
      setSelectedCodexSign(signsList[0]);
    }

    if (typeof window !== 'undefined') {
      try {
        const storedRes = localStorage.getItem('pt_zodiac_result');
        if (storedRes) {
          setSavedResult(JSON.parse(storedRes));
        }

        const storedProg = localStorage.getItem('pt_zodiac_progress');
        if (storedProg) {
          const parsed = JSON.parse(storedProg);
          if (parsed && typeof parsed.currentStep === 'number') {
            setSavedProgressStep(parsed.currentStep + 1);
          }
        }
      } catch (err) {
        console.warn('Failed to parse zodiac saved states', err);
      }
    }
  }, []);

  const handleClearSavedResult = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pt_zodiac_result');
      localStorage.removeItem('pt_zodiac_progress');
      setSavedResult(null);
      setSavedProgressStep(null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0d0205] text-cream flex items-center justify-center">
        <div className="text-[#F2A98A] animate-pulse text-lg font-mono">Opening Celestial Gateway...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-cream py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent/40"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
    >
      {/* Ambient Celestial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-35 overflow-hidden">
        <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-[#F2A98A] rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-[#C96A42] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-10">

        {/* ── 0. SAVED NATAL CHART STATUS BANNER ── */}
        {savedResult && (
          <div className="bg-gradient-to-r from-[#5c1a2e]/60 via-[#20070e]/80 to-[#c96a42]/30 border-2 border-[#F2A98A]/40 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl sm:text-3xl">{savedResult.sunSign?.emoji || '✨'}</span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F2A98A] block">
                  ✦ Unlocked Literary Natal Chart
                </span>
                <p className="font-serif font-bold text-base sm:text-lg text-cream">
                  You are <span className="text-[#F2A98A] font-extrabold">The {savedResult.sunSign?.name}</span>
                  {savedResult.moonSign && (
                    <span className="text-xs font-normal text-cream/70 sm:inline block"> (Moon: {savedResult.moonSign.name} • Rising: {savedResult.risingSign.name})</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/zodiac/test"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
              >
                <span>View Full Chart</span>
                <ArrowRight size={13} />
              </Link>
              <button
                onClick={handleClearSavedResult}
                className="p-2 rounded-xl bg-black/40 hover:bg-black/70 text-cream/60 hover:text-cream text-xs border border-white/10 transition-colors"
                title="Retake Quiz & Clear Chart"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── 1. HUB HERO HEADER ── */}
        <div className="text-center py-10 px-6 bg-gradient-to-b from-[#5c1a2e]/30 via-[#20070e]/50 to-[#050002]/95 backdrop-blur-md rounded-3xl border border-[#F2A98A]/25 shadow-2xl space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold tracking-wider uppercase">
            <Sparkles size={13} />
            <span>A Paper Thoughts Original System</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-cream via-[#F2A98A] to-[#C96A42] tracking-tight leading-tight">
            The Book Zodiac
          </h1>
          
          <p className="text-base sm:text-xl font-serif italic text-cream/90 max-w-2xl mx-auto">
            Who are you in the literary universe? Discover your celestial reading sign &amp; bookish soul.
          </p>
        </div>

        {/* ── 2. ABOVE-THE-FOLD SPLIT-HERO TWIN GATEWAY ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* GATEWAY CARD A: THE 21 READER ARCHETYPES */}
          <div className="bg-gradient-to-b from-[#1c060e] via-[#120308] to-[#080103] rounded-3xl p-6 sm:p-8 border-2 border-[#C5A059]/40 hover:border-[#F2A98A]/60 shadow-2xl flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/15 border border-[#C5A059]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span>🎭</span>
                  <span>Identity Codex</span>
                </span>
                <span className="text-xs font-mono text-cream/40">21 Archetypes</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                  The 21 Reader Archetypes
                </h2>
                <p className="text-xs sm:text-sm text-cream/80 font-serif leading-relaxed">
                  From the <em>Fiction Insomniac</em> to the <em>TBR Optimist</em>, <em>Book Dragon</em>, and <em>Quote Collector</em>—explore the 21 reading personas that define the Paper Thoughts community.
                </p>
              </div>

              {/* Emoji Badge Preview Strip */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xl sm:text-2xl">
                <span>⚡</span>
                <span>🐉</span>
                <span>📚</span>
                <span>🌙</span>
                <span>📖</span>
                <span>☕</span>
                <span>✨</span>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <Link
                href="/archetype"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#20070e] to-[#3a0c1a] hover:from-[#5c1a2e] hover:to-[#7a2040] text-cream border border-[#C5A059]/40 hover:border-[#F2A98A]/60 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Explore 21 Archetypes Codex</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* GATEWAY CARD B: THE CELESTIAL ZODIAC TEST */}
          <div className="bg-gradient-to-b from-[#1c060e] via-[#120308] to-[#080103] rounded-3xl p-6 sm:p-8 border-2 border-[#F2A98A]/40 hover:border-[#F2A98A]/70 shadow-2xl flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#c96a42]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F2A98A] bg-[#5c1a2e]/40 border border-[#F2A98A]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Celestial Grimoire</span>
                </span>
                <span className="text-xs font-mono text-[#F2A98A]">12 Questions</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                  Take the Celestial Test
                </h2>
                <p className="text-xs sm:text-sm text-cream/80 font-serif leading-relaxed">
                  Discover your <strong>Book Sun</strong> (Core Identity), <strong>Book Moon</strong> (Inner Emotional Driver), and <strong>Book Rising</strong> (Outward Reading Persona) across 4 celestial pillars.
                </p>
              </div>

              {/* Pillars Pill Bar */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl grid grid-cols-4 gap-1 text-center text-[10px] font-mono text-[#F2A98A]/90">
                <div className="p-1 rounded bg-black/40">💧 Element</div>
                <div className="p-1 rounded bg-black/40">🌌 Realm</div>
                <div className="p-1 rounded bg-black/40">🏛️ House</div>
                <div className="p-1 rounded bg-black/40">📜 Medium</div>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <Link
                href="/zodiac/test"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>
                  {savedProgressStep ? `Resume Test (Question ${savedProgressStep}) ⚡` : 'Enter Celestial Test Portal ✨'}
                </span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>

        {/* ── 3. THE 7 CELESTIAL SIGNS CODEX ── */}
        <div className="space-y-6 pt-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-cream">
                The 7 Celestial Signs Codex
              </h2>
              <p className="text-xs text-cream/60 font-serif italic mt-0.5">
                Explore the lore, superpowers, and resonant archetypes of each sign.
              </p>
            </div>
          </div>

          {/* 7 Sign Pills Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {signsList.map((sign) => {
              const isSelected = selectedCodexSign?.id === sign.id;
              return (
                <button
                  key={sign.id}
                  onClick={() => setSelectedCodexSign(sign)}
                  className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#5c1a2e] to-[#20070e] border-[#F2A98A] scale-105 shadow-xl ring-2 ring-[#F2A98A]/30'
                      : 'bg-black/40 border-white/10 hover:border-[#F2A98A]/30 text-cream/70 hover:text-cream'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10">
                    <img src={sign.image} alt={sign.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-serif font-bold block text-cream">
                      {sign.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#F2A98A]">
                      {sign.emoji}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Sign Detailed Lore Card */}
          {selectedCodexSign && (
            <div className="bg-gradient-to-b from-[#18050c] to-[#080103] border-2 border-[#F2A98A]/35 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Sign Art Card */}
                <div className="md:col-span-5 flex justify-center">
                  <div className="w-full max-w-[300px] aspect-[4/5] rounded-2xl overflow-hidden border-2 border-[#F2A98A]/40 shadow-2xl bg-black relative group">
                    <img
                      src={selectedCodexSign.image}
                      alt={selectedCodexSign.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-xs font-mono text-[#F2A98A] border border-white/15">
                      {selectedCodexSign.emoji}
                    </div>
                  </div>
                </div>

                {/* Lore & Powers */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-mono uppercase">
                      <span>{selectedCodexSign.emoji}</span>
                      <span>{selectedCodexSign.title}</span>
                    </div>

                    <h3 className="text-3xl font-serif font-bold text-cream">
                      The {selectedCodexSign.name}
                    </h3>

                    <p className="text-base italic text-[#F2A98A] font-serif">
                      &ldquo;{selectedCodexSign.tagline}&rdquo;
                    </p>
                  </div>

                  <p className="text-sm text-cream/85 leading-relaxed font-serif">
                    {selectedCodexSign.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3.5 rounded-xl bg-[#FFF5EC] text-[#2C1A0E] shadow-sm space-y-1">
                      <span className="font-bold text-[#5C1A2E] text-xs block font-mono uppercase">
                        ⚡ Superpower
                      </span>
                      <p className="font-serif text-xs italic">
                        &ldquo;{selectedCodexSign.superpower}&rdquo;
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FFF5EC] text-[#2C1A0E] shadow-sm space-y-1">
                      <span className="font-bold text-rose-700 text-xs block font-mono uppercase">
                        🥀 Kryptonite
                      </span>
                      <p className="font-serif text-xs italic">
                        &ldquo;{selectedCodexSign.kryptonite}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Resonant Archetypes */}
                  {selectedCodexSign.archetypeMatches && (
                    <div className="pt-2">
                      <span className="text-xs font-mono text-cream/60 font-bold uppercase block mb-1.5">
                        🎭 Resonant Reader Archetypes:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedCodexSign.archetypeMatches.map((archKey) => {
                          const arch = ARCHETYPES[archKey];
                          if (!arch) return null;
                          return (
                            <Link
                              key={arch.id}
                              href={`/archetype#${arch.id}`}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-cream text-xs font-serif flex items-center gap-1.5 transition-all group"
                            >
                              <span>{arch.emoji}</span>
                              <span className="group-hover:text-[#F2A98A]">{arch.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}
        </div>

        {/* ── 4. CLUBHOUSE BRIDGES FOOTER ── */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap justify-center gap-6 text-xs font-mono text-cream/60">
          <Link href="/archetype" className="hover:text-[#F2A98A] underline">
            Browse 21 Reader Archetypes
          </Link>
          <span>•</span>
          <Link href="/soundscapes" className="hover:text-[#F2A98A] underline">
            Reading Soundscapes
          </Link>
          <span>•</span>
          <Link href="/village/gallery" className="hover:text-[#F2A98A] underline">
            The Living Salon Gallery
          </Link>
        </div>

      </div>
    </div>
  );
}
