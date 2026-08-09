'use client';

export default function ArchetypeCardModal({ archetype, onClose }) {
  if (!archetype) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-2xl w-full my-8 space-y-6 shadow-2xl relative animate-scale-up">
        
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <span>{archetype.emoji}</span>
            <span>{archetype.name}</span>
          </div>

          <p className="text-base font-serif italic text-amber-200/90">
            "{archetype.tagline}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs bg-slate-950 p-4 rounded-xl border border-white/5">
            <div>
              <span className="font-bold text-amber-400 block mb-1">⚡ Superpower</span>
              <p className="text-amber-100/80">{archetype.superpower}</p>
            </div>
            <div>
              <span className="font-bold text-rose-400 block mb-1">🥀 Kryptonite</span>
              <p className="text-amber-100/80">{archetype.kryptonite}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
