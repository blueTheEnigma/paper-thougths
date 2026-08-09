'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ARCHETYPES } from '../../lib/archetypesData';
import ArchetypeCardModal from '../../components/archetypes/ArchetypeCardModal';

export default function ArchetypesPage() {
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const archetypesList = Object.values(ARCHETYPES);

  const filteredArchetypes = archetypesList.filter((arch) =>
    arch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arch.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arch.traits.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div 
      className="min-h-screen text-cream py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent/40"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
    >
      
      {/* Lightbox Modal */}
      {selectedArchetype && (
        <ArchetypeCardModal
          archetype={selectedArchetype}
          onClose={() => setSelectedArchetype(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            ✨ Paper Thoughts Original
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-cream tracking-tight">
            Reader Archetypes
          </h1>

          <p className="text-base sm:text-lg font-serif italic text-cream/80">
            Which one are you? Explore the 21 celebrated identities of the reading universe.
          </p>

          {/* SEARCH */}
          <div className="pt-2">
            <input
              type="text"
              placeholder="Search by name, habit, or trait..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-5 py-3 rounded-full bg-slate-900 border border-[#F2A98A]/35 text-cream placeholder-slate-500 text-sm focus:outline-none focus:border-[#F2A98A]/60 shadow-inner"
            />
          </div>
        </div>

        {/* GRID OF 21 ARCHETYPES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArchetypes.map((archetype) => (
            <div
              key={archetype.id}
              id={archetype.id}
              onClick={() => setSelectedArchetype(archetype)}
              className="bg-[#120308]/90 backdrop-blur-xl rounded-3xl p-6 border border-[#F2A98A]/20 hover:border-[#F2A98A]/50 shadow-xl space-y-4 cursor-pointer group transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Visual Thumbnail */}
                <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden bg-black border border-white/5 shadow-md relative group-hover:shadow-[#F2A98A]/10">
                  <img
                    src={archetype.image}
                    alt={archetype.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-mono text-[#F2A98A] border border-white/10">
                    {archetype.emoji}
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                  {archetype.name}
                </h3>

                <p className="text-xs italic text-cream/70 font-serif">
                  "{archetype.tagline}"
                </p>

                <div className="space-y-1 text-xs pt-1">
                  <span className="font-bold text-[#F2A98A] font-mono">Superpower:</span>
                  <p className="line-clamp-2 italic font-serif text-cream/80 mt-0.5">"{archetype.superpower}"</p>
                </div>
              </div>

              <div className="pt-2">
                <span className="w-full py-2.5 rounded-xl bg-slate-900 group-hover:bg-[#5C1A2E] group-hover:text-cream text-[#F2A98A] border border-[#F2A98A]/10 font-bold text-xs transition-all flex items-center justify-center gap-1">
                  View Full Poster Card 🔍
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div className="text-center py-12 px-6 bg-gradient-to-r from-[#5c1a2e]/30 via-[#0d0205] to-[#c96a42]/10 rounded-3xl border border-[#F2A98A]/20 space-y-4">
          <h3 className="text-2xl font-serif font-bold text-cream">
            Want to find your exact match?
          </h3>
          <p className="text-sm text-cream/80 max-w-md mx-auto font-serif">
            Take The Book Zodiac quiz to generate your complete Literary Natal Chart and discover your top archetype matches!
          </p>
          <Link
            href="/zodiac"
            className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            Take The Book Zodiac Quiz ✨
          </Link>
        </div>

      </div>
    </div>
  );
}
