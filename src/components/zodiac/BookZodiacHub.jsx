'use client';

import { useState, useEffect } from 'react';
import ZodiacQuizQuestion from './ZodiacQuizQuestion';
import NatalChartCard from './NatalChartCard';
import { QUESTIONS, SECTIONS, calculateZodiacChart } from '../../lib/zodiacData';
import Link from 'next/link';

export default function BookZodiacHub() {
  const [currentStep, setCurrentStep] = useState(0); // 0 to 27
  const [answers, setAnswers] = useState({}); // { 0: optionIdx, 1: optionIdx, ... }
  const [quizState, setQuizState] = useState('intro'); // 'intro' | 'active' | 'generating' | 'result'
  const [chartResult, setChartResult] = useState(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [mounted, setMounted] = useState(false);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = QUESTIONS[currentStep];

  // Determine current section metadata
  const currentSection = SECTIONS.find(s => s.questionIndices.includes(currentStep)) || SECTIONS[0];

  // 1. Mount & Load persisted states
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      // Check for saved completed result
      const savedResult = localStorage.getItem('pt_zodiac_result');
      if (savedResult) {
        try {
          setChartResult(JSON.parse(savedResult));
          setQuizState('result');
          return;
        } catch (e) {
          console.error("Failed to parse saved zodiac result", e);
        }
      }

      // Check for saved active progress
      const savedProgress = localStorage.getItem('pt_zodiac_progress');
      if (savedProgress) {
        try {
          const { answers: savedAns, currentStep: savedSt } = JSON.parse(savedProgress);
          if (savedAns && Object.keys(savedAns).length > 0) {
            setAnswers(savedAns);
            setCurrentStep(savedSt || 0);
            setHasSavedProgress(true);
          }
        } catch (e) {
          console.error("Failed to parse saved zodiac progress", e);
        }
      }
    }
  }, []);

  // 2. Persist active progress to localStorage as user answers
  useEffect(() => {
    if (mounted && quizState === 'active') {
      localStorage.setItem('pt_zodiac_progress', JSON.stringify({ answers, currentStep }));
    }
  }, [answers, currentStep, quizState, mounted]);

  const handleOptionSelect = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [currentStep]: optionIdx }));
  };

  const handleNextStep = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished all 28 questions!
      setQuizState('generating');
      localStorage.removeItem('pt_zodiac_progress'); // Clear active progress

      setTimeout(() => {
        const result = calculateZodiacChart(answers);
        setChartResult(result);
        localStorage.setItem('pt_zodiac_result', JSON.stringify(result)); // Persist final result
        setQuizState('result');
      }, 2000);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem('pt_zodiac_progress');
    setAnswers({});
    setCurrentStep(0);
    setHasSavedProgress(false);
    setQuizState('active');
  };

  const handleResume = () => {
    setQuizState('active');
  };

  const handleRetake = () => {
    localStorage.removeItem('pt_zodiac_progress');
    localStorage.removeItem('pt_zodiac_result');
    setAnswers({});
    setCurrentStep(0);
    setHasSavedProgress(false);
    setChartResult(null);
    setQuizState('intro');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0d0205] text-cream flex items-center justify-center">
        <div className="text-amber-300 animate-pulse text-lg font-mono">Loading Celestial Spheres...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-cream py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent/40"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
    >
      {/* Ambient Speck Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute top-1/2 left-20 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* INTRO SCREEN */}
        {quizState === 'intro' && (
          <div className="text-center py-16 px-6 bg-gradient-to-b from-[#5c1a2e]/25 via-[#20070e]/40 to-[#050002]/90 backdrop-blur-md rounded-3xl border border-[#F2A98A]/20 shadow-2xl space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold tracking-wider uppercase">
              ✨ A Paper Thoughts Original
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-cream via-[#F2A98A] to-[#C96A42] tracking-tight leading-tight">
              The Book Zodiac
            </h1>
            
            <p className="text-xl sm:text-2xl font-serif italic text-cream/90 max-w-2xl mx-auto">
              Who are you in the literary universe?
            </p>

            <div className="p-6 bg-black/40 rounded-2xl border border-white/5 max-w-xl mx-auto text-left text-cream/70 text-sm leading-relaxed space-y-3 font-serif">
              <p>
                The Book Zodiac is a symbolic identity system inspired by astrology, built entirely around books, reading, and human emotion.
              </p>
              <p>
                Through <strong>28 intuitive questions</strong> across 4 sections (<em>Element, Realm, House, Medium</em>), discover your <strong>Literary Natal Chart</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#F2A98A] font-sans font-bold">
                <li>☀️ Book Sun — Your Official Literary Essence</li>
                <li>🌙 Book Moon — Your Instinctive Inner Reader</li>
                <li>⬆️ Book Rising — Your Outward Reading Persona</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {hasSavedProgress ? (
                <>
                  <button
                    onClick={handleResume}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Resume Journey (Question {currentStep + 1}) ⚡
                  </button>
                  <button
                    onClick={handleStartFresh}
                    className="w-full sm:w-auto px-6 py-4 bg-slate-900/80 border border-[#F2A98A]/20 hover:bg-slate-800 text-cream/80 hover:text-cream text-sm font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Start Fresh
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartFresh}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Begin Your Cosmic Chart →
                </button>
              )}
            </div>

            <div className="pt-4 flex justify-center gap-6 text-xs font-mono text-cream/55">
              <Link href="/archetype" className="hover:text-[#F2A98A] underline">Browse 21 Archetypes</Link>
              <span>•</span>
              <Link href="/soundscapes" className="hover:text-[#F2A98A] underline">Listen to Playlists</Link>
            </div>
          </div>
        )}

        {/* ACTIVE QUIZ SCREEN */}
        {quizState === 'active' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Progress */}
            <div className="bg-[#120308]/90 backdrop-blur-md rounded-2xl p-6 border border-[#F2A98A]/15 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold font-sans uppercase tracking-[0.2em] text-[#F2A98A]">
                    {currentSection.title}
                  </h2>
                  <p className="text-xs italic text-cream/70 mt-1 font-serif">{currentSection.subtitle}</p>
                </div>
                <div className="text-xs text-[#F2A98A]/70 font-mono">
                  Question {currentStep + 1} of {totalQuestions}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#20070e] h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-[#5c1a2e] via-[#c96a42] to-[#f2a98a] h-full transition-all duration-300 ease-out"
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
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentStep === 0
                    ? 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900/50'
                    : 'bg-slate-900 border border-white/10 hover:bg-slate-800 text-cream/80 hover:text-white cursor-pointer'
                }`}
              >
                ← Back
              </button>

              <button
                onClick={handleNextStep}
                disabled={answers[currentStep] === undefined}
                className={`px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
                  answers[currentStep] === undefined
                    ? 'bg-slate-900 opacity-55 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream shadow-[#5c1a2e]/20 hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                {currentStep === totalQuestions - 1 ? 'Reveal Your Chart ✨' : 'Next Question →'}
              </button>
            </div>
          </div>
        )}

        {/* GENERATING SCREEN */}
        {quizState === 'generating' && (
          <div className="text-center py-24 px-6 bg-[#120308]/60 backdrop-blur-md rounded-3xl border border-[#F2A98A]/25 shadow-2xl space-y-6 animate-pulse">
            <div className="text-6xl animate-spin inline-block">🔮</div>
            <h2 className="text-3xl font-serif font-bold text-[#F2A98A]">
              Aligning Your Literary Constellations...
            </h2>
            <p className="text-cream/70 italic max-w-md mx-auto font-serif">
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
