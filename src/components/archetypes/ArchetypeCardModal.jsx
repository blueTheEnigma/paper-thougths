'use client';

export default function ArchetypeCardModal({ archetype, onClose }) {
  if (!archetype) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#120308] border border-[#F2A98A]/30 rounded-3xl p-6 max-w-2xl w-full my-8 space-y-6 shadow-2xl relative animate-scale-up">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 z-10"
        >
          ✕
        </button>

        {/* 2:3 Vertical Infographic Poster Card Image */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black max-w-md mx-auto aspect-[2/3]">
          <img
            src={archetype.image}
            alt={archetype.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS BREAKDOWN */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            <span>{archetype.emoji}</span>
            <span>{archetype.name}</span>
          </div>

          <p className="text-base font-serif italic text-cream/90">
            "{archetype.tagline}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs bg-[#FFF5EC] p-5 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] shadow-inner">
            <div>
              <span className="font-bold text-[#5C1A2E] text-xs block mb-1">⚡ Superpower</span>
              <p className="text-[#2C1A0E]/85 font-serif leading-relaxed">{archetype.superpower}</p>
            </div>
            <div>
              <span className="font-bold text-rose-700 text-xs block mb-1">🥀 Kryptonite</span>
              <p className="text-[#2C1A0E]/85 font-serif leading-relaxed">{archetype.kryptonite}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
