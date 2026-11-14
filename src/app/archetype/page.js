'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ARCHETYPES, ARCHETYPE_CATEGORIES } from '../../lib/archetypesData';
import ArchetypeCardModal from '../../components/archetypes/ArchetypeCardModal';

export default function ArchetypesPage() {
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [flippedCards, setFlippedCards] = useState({});

  const archetypesList = Object.values(ARCHETYPES);

  // Check URL hash on initial load to open specific archetype if linked
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      if (ARCHETYPES[hashId]) {
        setSelectedArchetype(ARCHETYPES[hashId]);
      }
    }
  }, []);

  const toggleFlip = (id, e) => {
    if (e) e.stopPropagation();
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFlipAll = () => {
    const allFlipped = Object.keys(flippedCards).length === archetypesList.length && 
      Object.values(flippedCards).every(Boolean);
    
    if (allFlipped) {
      setFlippedCards({});
    } else {
      const newFlipped = {};
      archetypesList.forEach(a => { newFlipped[a.id] = true; });
      setFlippedCards(newFlipped);
    }
  };

  const filteredArchetypes = archetypesList.filter((arch) => {
    const matchesCategory = selectedCategory === 'all' || arch.category === selectedCategory;
    const matchesSearch = 
      arch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arch.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (arch.superpower && arch.superpower.toLowerCase().includes(searchTerm.toLowerCase())) ||
      arch.traits.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (arch.authors && arch.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div 
      className="min-h-screen text-cream py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent/40"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
    >
      
      {/* Lightbox / Full Inspection Modal */}
      {selectedArchetype && (
        <ArchetypeCardModal
          archetype={selectedArchetype}
          onClose={() => setSelectedArchetype(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            ✨ Paper Thoughts Original Collection
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-cream tracking-tight">
            Reader Archetypes
          </h1>

          <p className="text-base sm:text-xl font-serif italic text-cream/80 leading-relaxed">
            Which one are you? Explore the 21 celebrated identities of the reading universe. Tap any card to flip and discover its lore.
          </p>

          {/* SEARCH & CONTROLS */}
          <div className="pt-3 max-w-md mx-auto relative flex items-center">
            <input
              type="text"
              placeholder="Search archetype by name, trait, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3 rounded-full bg-slate-900/90 border border-[#F2A98A]/35 text-cream placeholder-slate-400 text-sm focus:outline-none focus:border-[#F2A98A]/80 shadow-inner pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 text-cream/50 hover:text-cream text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {ARCHETYPE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream shadow-lg border border-[#F2A98A]/40 scale-105'
                    : 'bg-black/40 text-cream/70 hover:text-cream border border-white/10 hover:border-[#F2A98A]/20'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* GALLERY STATS & FLIP ALL ACTION */}
        <div className="flex items-center justify-between text-xs font-mono text-cream/60 max-w-7xl mx-auto px-2">
          <span>
            Showing <strong className="text-[#F2A98A]">{filteredArchetypes.length}</strong> of 21 Archetypes
          </span>
          <button
            onClick={handleFlipAll}
            className="hover:text-[#F2A98A] flex items-center gap-1 cursor-pointer transition-colors bg-white/5 px-3 py-1 rounded-lg border border-white/10"
          >
            <span>🔄</span>
            <span>Flip All Cards</span>
          </button>
        </div>

        {/* GRID OF 21 ARCHETYPES (3D Tarot Flip Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArchetypes.map((archetype) => {
            const isFlipped = !!flippedCards[archetype.id];

            return (
              <div
                key={archetype.id}
                id={archetype.id}
                className="group w-full h-[580px]"
                style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
              >
                {/* 3D FLIP CONTAINER */}
                <div
                  className="relative w-full h-full transition-transform duration-700 cursor-pointer rounded-3xl"
                  style={{
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                  onClick={() => toggleFlip(archetype.id)}
                >

                  {/* FRONT FACE OF CARD */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl bg-[#120308]/95 border-2 border-[#F2A98A]/25 hover:border-[#F2A98A]/60 shadow-2xl p-5 flex flex-col justify-between overflow-hidden transition-all group-hover:shadow-[0_0_30px_rgba(242,169,138,0.15)]"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    {/* Top Art Poster Area */}
                    <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg relative shrink-0">
                      <img
                        src={archetype.image}
                        alt={archetype.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-xs font-mono text-[#F2A98A] border border-white/15 shadow-md">
                        {archetype.emoji}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 pt-2 flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors leading-tight">
                          {archetype.name}
                        </h3>
                      </div>

                      <p className="text-xs italic text-[#F2A98A]/80 font-serif line-clamp-1">
                        "{archetype.tagline}"
                      </p>

                      <p className="text-xs text-cream/70 font-serif line-clamp-2 italic">
                        ⚡ {archetype.superpower}
                      </p>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-white/10 flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFlip(archetype.id, e)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-[#5C1A2E] text-[#F2A98A] hover:text-cream text-xs font-bold border border-[#F2A98A]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Flip Lore</span>
                        <span>🔄</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArchetype(archetype);
                        }}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-cream text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="View high-res poster"
                      >
                        <span>Poster</span>
                        <span>🔍</span>
                      </button>
                    </div>

                  </div>

                  {/* BACK FACE OF CARD (LORE & TRAITS) */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-b from-[#1c060e] via-[#120308] to-[#080103] border-2 border-[#F2A98A]/40 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="space-y-3">
                      
                      {/* Back Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{archetype.emoji}</span>
                          <div>
                            <h4 className="text-base font-serif font-bold text-cream">
                              {archetype.name}
                            </h4>
                            <span className="text-[10px] font-mono text-[#F2A98A] uppercase tracking-wider">
                              Category: {archetype.category?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleFlip(archetype.id, e)}
                          className="text-xs text-cream/50 hover:text-cream font-mono"
                        >
                          Front ↺
                        </button>
                      </div>

                      {/* Traits */}
                      <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-mono font-bold text-[#F2A98A] uppercase tracking-wider block">
                          ✦ Core Traits
                        </span>
                        <ul className="space-y-1 text-xs text-cream/80 font-serif">
                          {archetype.traits.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#F2A98A]">•</span>
                              <span className="leading-snug">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Superpower & Kryptonite */}
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#FFF5EC] text-[#2C1A0E] shadow-sm">
                          <span className="font-bold text-[#5C1A2E] text-[11px] block font-mono uppercase">
                            ⚡ Superpower
                          </span>
                          <p className="font-serif text-[11px] leading-snug italic text-[#2C1A0E]/90 mt-0.5">
                            "{archetype.superpower}"
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FFF5EC] text-[#2C1A0E] shadow-sm">
                          <span className="font-bold text-rose-700 text-[11px] block font-mono uppercase">
                            🥀 Kryptonite
                          </span>
                          <p className="font-serif text-[11px] leading-snug italic text-[#2C1A0E]/90 mt-0.5">
                            "{archetype.kryptonite}"
                          </p>
                        </div>
                      </div>

                      {/* Soulmates & Authors teaser */}
                      {archetype.literarySoulmates && (
                        <div className="text-[11px] text-cream/70 font-serif">
                          <span className="font-mono text-[#F2A98A] font-bold text-[10px] uppercase block">
                            Soulmates:
                          </span>
                          <p className="line-clamp-1">{archetype.literarySoulmates.join(', ')}</p>
                        </div>
                      )}

                    </div>

                    {/* Back Bottom Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArchetype(archetype);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream text-xs font-bold shadow-md transition-all hover:scale-102 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Full Poster & Share</span>
                        <span>✨</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleFlip(archetype.id, e)}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-cream text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                      >
                        ↺
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA: Take the Book Zodiac */}
        <div className="text-center py-14 px-6 bg-gradient-to-r from-[#5c1a2e]/30 via-[#0d0205] to-[#c96a42]/20 rounded-3xl border border-[#F2A98A]/30 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A98A]/10 text-[#F2A98A] text-xs font-mono font-bold uppercase">
            ✦ Find Your Celestial Identity
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
            Ready to discover your exact Literary Natal Chart?
          </h3>
          <p className="text-sm sm:text-base text-cream/80 max-w-xl mx-auto font-serif leading-relaxed">
            Take the 12-question Book Zodiac assessment to unlock your Sun, Moon, and Rising signs, along with your top matching Reader Archetypes.
          </p>
          <div className="pt-2">
            <Link
              href="/zodiac"
              className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Take The Book Zodiac Quiz ✨
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
