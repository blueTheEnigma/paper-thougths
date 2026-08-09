'use client';

export default function ZodiacQuizQuestion({ questionData, selectedOptionIdx, onSelectOption }) {
  if (!questionData) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-2xl space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono text-amber-400/80 uppercase tracking-widest">
          Question #{questionData.id}
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-medium text-amber-100 leading-snug">
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
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer group ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 text-amber-100 shadow-lg shadow-amber-500/10 scale-[1.01]'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-white/10 text-amber-100/80 hover:text-amber-50 hover:border-amber-500/40'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors shrink-0 mt-0.5 ${
                isSelected
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-700/80 text-amber-300 group-hover:bg-amber-500/20 group-hover:text-amber-200'
              }`}>
                {option.letter}
              </span>
              <span className="text-base leading-relaxed pt-0.5">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
