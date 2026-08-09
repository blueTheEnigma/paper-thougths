'use client';

import { useState } from 'react';
import ZodiacQuizQuestion from './ZodiacQuizQuestion';
import NatalChartCard from './NatalChartCard';
import { QUESTIONS, SECTIONS, calculateZodiacChart } from '../../lib/zodiacData';

export default function BookZodiacHub() {
  const [currentStep, setCurrentStep] = useState(0); // 0 to 27
  const [answers, setAnswers] = useState({}); // { 0: optionIdx, 1: optionIdx, ... }
  const [quizState, setQuizState] = useState('intro'); // 'intro' | 'active' | 'generating' | 'result'
  const [chartResult, setChartResult] = useState(null);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = QUESTIONS[currentStep];

  // Determine current section metadata
  const currentSection = SECTIONS.find(s => s.questionIndices.includes(currentStep)) || SECTIONS[0];
  const sectionProgress = currentSection.questionIndices.indexOf(currentStep) + 1;

  const handleOptionSelect = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [currentStep]: optionIdx }));
  };

  const handleNextStep = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished all 28 questions!
      setQuizState('generating');
      setTimeout(() => {
        const result = calculateZodiacChart(answers);
        setChartResult(result);
        setQuizState('result');
      }, 2000);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentStep(0);
    setQuizState('intro');
    setChartResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0D0B14] text-amber-50 selection:bg-amber-500/30 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* INTRO SCREEN */}
        {quizState === 'intro' && (
          <div className="text-center py-16 px-6 bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-black/80 backdrop-blur-md rounded-3xl border border-amber-500/20 shadow-2xl space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium tracking-wide uppercase">
              ✨ A Paper Thoughts Original
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-tight leading-tight">
              The Book Zodiac
            </h1>
            
            <p className="text-xl sm:text-2xl font-serif italic text-amber-200/90 max-w-2xl mx-auto">
              Who are you in the literary universe?
            </p>

            <div className="p-6 bg-black/40 rounded-2xl border border-white/5 max-w-xl mx-auto text-left text-amber-100/70 text-sm leading-relaxed space-y-3">
              <p>
                The Book Zodiac is a symbolic identity system inspired by astrology, built entirely around books, reading, and human emotion.
              </p>
              <p>
                Through <strong>28 intuitive questions</strong> across 4 sections (<em>Element, Realm, House, Medium</em>), discover your <strong>Literary Natal Chart</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-300/90 font-medium">
                <li>☀️ <strong>Book Sun</strong> — Your Official Literary Essence</li>
                <li>🌙 <strong>Book Moon</strong> — Your Instinctive Inner Reader</li>
                <li>⬆️ <strong>Book Rising</strong> — Your Outward Reading Persona</li>
              </ul>
            </div>

            <button
              onClick={() => setQuizState('active')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-lg rounded-full shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Begin Your Cosmic Chart →
            </button>
          </div>
        )}

        {/* ACTIVE QUIZ SCREEN */}
        {quizState === 'active' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Progress */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    {currentSection.title}
                  </h2>
                  <p className="text-sm italic text-amber-200/70">{currentSection.subtitle}</p>
                </div>
                <div className="text-xs text-amber-300/70 font-mono">
                  Question {currentStep + 1} of {totalQuestions}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 ease-out"
                  style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <ZodiacQuizQuestion
              questionData={currentQuestion}
              selectedOptionIdx={answers[currentStep]}
              onSelectOption={handleOptionSelect}
            />

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  currentStep === 0
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-200 hover:text-white cursor-pointer'
                }`}
              >
                ← Back
              </button>

              <button
                onClick={handleNextStep}
                disabled={answers[currentStep] === undefined}
                className={`px-8 py-3 rounded-full text-sm font-bold shadow-lg transition-all ${
                  answers[currentStep] === undefined
                    ? 'bg-slate-800 opacity-50 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                {currentStep === totalQuestions - 1 ? 'Reveal Your Chart ✨' : 'Next Question →'}
              </button>
            </div>
          </div>
        )}

        {/* GENERATING SCREEN */}
        {quizState === 'generating' && (
          <div className="text-center py-24 px-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-amber-500/20 shadow-2xl space-y-6 animate-pulse">
            <div className="text-6xl animate-spin inline-block">🔮</div>
            <h2 className="text-3xl font-serif font-bold text-amber-300">
              Aligning Your Literary Constellations...
            </h2>
            <p className="text-amber-200/70 italic max-w-md mx-auto">
              Calculating your Sun, Moon, and Rising signs across Element, Realm, House, and Medium...
            </p>
          </div>
        )}

        {/* RESULT SCREEN */}
        {quizState === 'result' && chartResult && (
          <NatalChartCard chartResult={chartResult} onRetake={handleRetake} />
        )}

      </div>
    </div>
  );
}
