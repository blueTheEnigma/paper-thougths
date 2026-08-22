'use client';

export default function ZodiacQuizQuestion({ questionData, selectedIndices = [], onToggleOption }) {
  if (!questionData) return null;

  const currentSelections = Array.isArray(selectedIndices) 
    ? selectedIndices 
    : selectedIndices !== undefined && selectedIndices !== null 
      ? [selectedIndices] 
      : [];

  const selectionCount = currentSelections.length;

  return (
    <div className="bg-[#120308]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[#F2A98A]/25 shadow-2xl space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#F2A98A] uppercase tracking-widest">
            Question #{questionData.id}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-xs font-serif italic text-cream/70">
            Pick up to 2
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1A2E]/40 border border-[#F2A98A]/30 text-xs font-mono">
          <span className={selectionCount > 0 ? "text-[#F2A98A] font-bold" : "text-cream/50"}>
            {selectionCount}/2 Selected
          </span>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-serif font-bold text-cream leading-snug">
        {questionData.question}
      </h3>

      <div className="space-y-3 pt-2">
        {questionData.options.map((option, idx) => {
          const isSelected = currentSelections.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onToggleOption(idx)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer group shadow-sm ${
                isSelected
                  ? 'bg-[#FFF5EC] border-[#C96A42] text-[#2C1A0E] scale-[1.01] shadow-lg shadow-[#5C1A2E]/30 ring-2 ring-[#C96A42]/50'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-white/10 text-cream/80 hover:text-cream hover:border-[#F2A98A]/40'
              }`}
            >
              {/* Checkbox / Letter Icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition-all shrink-0 mt-0.5 border ${
                isSelected
                  ? 'bg-[#5C1A2E] text-cream border-[#5C1A2E] shadow-sm'
                  : 'bg-[#5C1A2E]/20 text-[#F2A98A] border-[#F2A98A]/20 group-hover:border-[#F2A98A]/50 group-hover:bg-[#5C1A2E]/40'
              }`}>
                {isSelected ? '✓' : option.letter}
              </div>

              <div className="flex-grow pt-0.5">
                <span className="text-sm sm:text-base leading-relaxed font-serif font-medium block">
                  {option.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
