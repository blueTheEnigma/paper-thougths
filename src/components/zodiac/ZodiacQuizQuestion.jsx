'use client';

export default function ZodiacQuizQuestion({ questionData, selectedOptionIdx, onSelectOption }) {
  if (!questionData) return null;

  return (
    <div className="bg-[#120308]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[#F2A98A]/20 shadow-2xl space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono font-bold text-[#F2A98A] uppercase tracking-widest">
          Question #{questionData.id}
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-cream leading-snug">
          {questionData.question}
        </h3>
      </div>

      <div className="space-y-3 pt-2">
        {questionData.options.map((option, idx) => {
          const isSelected = selectedOptionIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer group shadow-sm ${
                isSelected
                  ? 'bg-[#FFF5EC] border-[#C96A42] text-[#2C1A0E] scale-[1.01] shadow-lg shadow-[#5C1A2E]/30'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-white/5 text-cream/80 hover:text-cream hover:border-[#F2A98A]/40'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors shrink-0 mt-0.5 ${
                isSelected
                  ? 'bg-[#5C1A2E] text-cream'
                  : 'bg-[#5C1A2E]/20 text-[#F2A98A] group-hover:bg-[#5C1A2E]/40'
              }`}>
                {option.letter}
              </span>
              <span className="text-base leading-relaxed pt-0.5 font-serif font-medium">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
