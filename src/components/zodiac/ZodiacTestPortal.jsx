'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ZodiacQuizQuestion from './ZodiacQuizQuestion';
import NatalChartCard from './NatalChartCard';
import { QUESTIONS, SECTIONS, calculateZodiacChart } from '../../lib/zodiacData';

export default function ZodiacTestPortal() {
  const [currentStep, setCurrentStep] = useState(0); // 0 to 11
  const [answers, setAnswers] = useState({}); // { 0: [idx], 1: [idx1, idx2], ... }
  const [quizState, setQuizState] = useState('active'); // 'active' | 'generating' | 'result'
  const [chartResult, setChartResult] = useState(null);
  const [mounted, setMounted] = useState(false);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = QUESTIONS[currentStep];

  // Determine current section metadata
  const currentSection = SECTIONS.find(s => s.questionIndices.includes(currentStep)) || SECTIONS[0];

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mount & Load persisted states
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
            const normalizedAns = {};
            Object.keys(savedAns).forEach(k => {
              normalizedAns[k] = Array.isArray(savedAns[k]) ? savedAns[k] : [savedAns[k]];
            });
            setAnswers(normalizedAns);
            setCurrentStep(savedSt || 0);
          }
        } catch (e) {
          console.error("Failed to parse saved zodiac progress", e);
        }
      }
    }
  }, []);

  // Persist active progress to localStorage as user answers
  useEffect(() => {
    if (mounted && quizState === 'active') {
      localStorage.setItem('pt_zodiac_progress', JSON.stringify({ answers, currentStep }));
    }
  }, [answers, currentStep, quizState, mounted]);

  // Multi-select toggle handler (max 2 choices)
  const handleToggleOption = (optionIdx) => {
    setAnswers(prev => {
      const currentList = prev[currentStep] ? [...prev[currentStep]] : [];
      const existingIdx = currentList.indexOf(optionIdx);

      if (existingIdx >= 0) {
        // Deselect
        currentList.splice(existingIdx, 1);
      } else {
        // Select (cap at 2; if already 2, cycle oldest)
        if (currentList.length < 2) {
          currentList.push(optionIdx);
        } else {
          currentList.shift();
          currentList.push(optionIdx);
        }
      }

      return {
        ...prev,
        [currentStep]: currentList
      };
    });
  };

  const handleNextStep = () => {
    scrollToTop();
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished all 12 questions!
      setQuizState('generating');
      localStorage.removeItem('pt_zodiac_progress');

      setTimeout(() => {
        const result = calculateZodiacChart(answers);
        setChartResult(result);
        localStorage.setItem('pt_zodiac_result', JSON.stringify(result));
        setQuizState('result');
        scrollToTop();
      }, 1800);
    }
  };

  const handlePrevStep = () => {
    scrollToTop();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRetake = () => {
    localStorage.removeItem('pt_zodiac_progress');
    localStorage.removeItem('pt_zodiac_result');
    setAnswers({});
    setCurrentStep(0);
    setChartResult(null);
    setQuizState('active');
    scrollToTop();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0d0205] text-cream flex items-center justify-center">
        <div className="text-[#F2A98A] animate-pulse text-lg font-mono">Aligning Celestial Spheres...</div>
      </div>
    );
  }

  const currentStepSelections = answers[currentStep] || [];
  const hasSelectedCurrent = currentStepSelections.length > 0;
  const progressPercent = Math.round(((currentStep + 1) / totalQuestions) * 100);

  return (
    <div 
      className="min-h-screen text-cream py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent/40"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
    >
      {/* Ambient Celestial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-1.5 h-1.5 bg-[#F2A98A] rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-[#C96A42] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/zodiac"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#F2A98A] hover:text-cream transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back to Zodiac Hub
          </Link>

          <span className="text-[11px] font-mono text-cream/50 uppercase tracking-widest">
            Celestial Test Portal
          </span>
        </div>

        {/* 1. QUIZ ACTIVE VIEW */}
        {quizState === 'active' && (
          <div className="space-y-6 animate-fade-in">
            {/* Progress & Section Bar */}
            <div className="space-y-3 bg-black/40 border border-white/10 p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentSection.emoji}</span>
                  <span className="text-[#F2A98A] font-bold uppercase tracking-wider">
                    {currentSection.title}
                  </span>
                </div>
                <span className="text-cream/70 font-bold">
                  Question {currentStep + 1} of {totalQuestions} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar Line */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#5c1a2e] via-[#c96a42] to-[#F2A98A] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-cream/50 font-serif italic pt-1">
                <span>{currentSection.desc}</span>
                <span className="font-mono text-[#F2A98A]/80 not-italic text-[10px]">
                  Select 1 or 2 options
                </span>
              </div>
            </div>

            {/* Question Card */}
            <ZodiacQuizQuestion
              questionData={currentQuestion}
              selectedIndices={currentStepSelections}
              onToggleOption={handleToggleOption}
            />

            {/* Navigation Strip */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="px-5 py-3 rounded-xl bg-black/40 border border-white/10 text-cream/70 hover:text-cream text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
              >
                <span>← Previous</span>
              </button>

              <button
                onClick={handleNextStep}
                disabled={!hasSelectedCurrent}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>{currentStep === totalQuestions - 1 ? 'Reveal My Natal Chart ✨' : 'Next Question →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. GENERATING CHART SCREEN */}
        {quizState === 'generating' && (
          <div className="text-center py-24 px-6 bg-gradient-to-b from-[#18050c] to-[#080103] rounded-3xl border border-[#F2A98A]/25 shadow-2xl space-y-6 animate-pulse">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#5c1a2e] to-[#c96a42] flex items-center justify-center text-3xl shadow-xl animate-spin" style={{ animationDuration: '6s' }}>
              ✨
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
                Harmonizing Celestial Triad...
              </h2>
              <p className="text-sm font-serif italic text-[#F2A98A]/80 max-w-md mx-auto">
                Synthesizing your literary Sun, Moon, and Rising signs across the cosmos.
              </p>
            </div>
          </div>
        )}

        {/* 3. CHART RESULT VIEW */}
        {quizState === 'result' && chartResult && (
          <div className="space-y-8 animate-fade-in">
            <NatalChartCard
              chartResult={chartResult}
              onRetake={handleRetake}
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/zodiac"
                className="px-6 py-3 rounded-xl bg-black/50 border border-white/15 hover:border-[#F2A98A]/40 text-cream text-xs font-bold uppercase tracking-wider transition-all"
              >
                ← Explore 7 Signs Codex
              </Link>
              <Link
                href="/archetype"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                Browse 21 Reader Archetypes →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
