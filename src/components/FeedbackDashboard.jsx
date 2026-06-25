"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, BarChart2, CheckSquare, Eye, Compass, Star, ChevronRight, FileText } from 'lucide-react';

export default function FeedbackDashboard({ submissionId, onClose }) {
  const [report, setReport] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/ai-report?submissionId=${submissionId}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setSubmission(data.submission);
      } else {
        setError(data.error || 'Failed to retrieve synthesis report.');
      }
    } catch (err) {
      console.error('Failed to load AI report:', err);
      setError('A connection error occurred. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (submissionId) {
      fetchReport();
    }
  }, [submissionId, fetchReport]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(92,26,46,0.3) 0%, rgba(92,26,46,0.05) 100%)',
              border: '1px solid rgba(242,169,138,0.2)',
            }}
          >
            <svg 
              className="w-10 h-10 animate-spin text-[#F2A98A]" 
              viewBox="0 0 100 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="4" 
              strokeLinecap="round"
              style={{ animationDuration: '4s' }}
            >
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="4" fill="currentColor" />
              <circle cx="50" cy="50" r="30" strokeWidth="2" />
              <line x1="50" y1="10" x2="50" y2="90" />
              <line x1="10" y1="50" x2="90" y2="50" />
              <line x1="22" y1="22" x2="78" y2="78" />
              <line x1="22" y1="78" x2="78" y2="22" />
              <line x1="50" y1="20" x2="50" y2="2" strokeWidth="5" />
              <line x1="50" y1="80" x2="50" y2="98" strokeWidth="5" />
              <line x1="20" y1="50" x2="2" y2="50" strokeWidth="5" />
              <line x1="80" y1="50" x2="98" y2="50" strokeWidth="5" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-display text-burgundy font-bold animate-pulse-subtle">Compiling Manuscript Synthesis...</h3>
        <p className="text-xs text-ink/50 mt-2 font-serif">Consulting the Friday Archive summaries</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white/40 border border-sage/15 rounded-3xl max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 bg-burgundy/10 text-burgundy rounded-full flex items-center justify-center mb-4">
          <RefreshCw size={24} className="animate-spin-slow" />
        </div>
        <h3 className="text-xl font-display text-burgundy font-bold mb-2">Report Not Ready</h3>
        <p className="text-sm text-ink/70 leading-relaxed font-serif mb-6">
          {error}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-[#E8DFC9] hover:bg-ink hover:text-cream text-ink text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Go Back
          </button>
          <button 
            onClick={fetchReport}
            className="px-6 py-2.5 bg-burgundy hover:bg-ink text-cream text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  const { intentMetrics, structuralMetrics, synthesizedMirror, synthesizedHighwater, synthesizedPivot, createdAt } = report;

  // Process data for charts
  const titleWeight = intentMetrics?.title_weight ?? 0;
  const tropeWeight = intentMetrics?.trope_weight ?? 0;
  const loglineWeight = intentMetrics?.logline_weight ?? 0;

  const pacingScore = structuralMetrics?.pacing ?? 3;
  const technicalScore = structuralMetrics?.technical ?? 3;

  // Semicircle gauge calculation
  const gaugeRadius = 30;
  const gaugeCircumference = Math.PI * gaugeRadius; // ~94.25
  const pacingOffset = gaugeCircumference - (pacingScore / 5) * gaugeCircumference;
  const technicalOffset = gaugeCircumference - (technicalScore / 5) * gaugeCircumference;

  // Date formatting
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown Date';

  // Format steps of the pivot response
  const formatPivotSteps = (text) => {
    // LLM response synthesized_pivot can contain list markers (e.g. 1., 2., 3., -)
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const steps = [];
    
    lines.forEach(line => {
      // Remove leading bullet/number signs
      const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*+]\s*/, '');
      if (cleanLine) steps.push(cleanLine);
    });

    if (steps.length === 0) {
      return [text];
    }
    return steps;
  };

  const pivotSteps = formatPivotSteps(synthesizedPivot);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-sage/10">
        <div>
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-sans font-bold text-ink/60 hover:text-burgundy uppercase tracking-wider mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <span className="bg-burgundy/10 text-burgundy p-1.5 rounded-lg border border-burgundy/15">
              <FileText size={16} />
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-burgundy">{submission?.title}</h2>
          </div>
          <p className="text-xs text-ink/50 mt-1 font-serif font-medium">
            Compiled: {formattedDate}
          </p>
        </div>
      </div>
      {submission?.isRevised && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 font-bold font-sans">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>Note: You have revised this manuscript since this feedback report was compiled. The critiques below correspond to a previous version of the text.</span>
          </div>
        </div>
      )}

      {/* Visual Aggregates Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Click Intent Bar Chart Card */}
        <div className="parchment-card p-6 flex flex-col justify-between lg:col-span-2 min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 text-burgundy/40 mb-3">
              <BarChart2 size={16} />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]">Audience Click-Intent Distribution</span>
            </div>
            <h3 className="text-xl font-display font-extrabold text-burgundy leading-snug">What Hooked Your Readers?</h3>
            <p className="text-xs text-ink/60 leading-relaxed font-serif mt-1">
              Percentage of reviewers motivated by the Title, core Trope theme, or the Logline.
            </p>
          </div>

          {/* SVG Custom Horizontal Bar Chart */}
          <div className="mt-6 space-y-4">
            {/* Title Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans font-bold">
                <span className="text-burgundy">Title Hook</span>
                <span className="text-ink/80">{titleWeight}%</span>
              </div>
              <div className="w-full bg-[#E8DFC9] h-3.5 rounded-full overflow-hidden border border-sage/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${titleWeight}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #5C1A2E 0%, #C96A42 100%)',
                    boxShadow: '0 0 10px rgba(92,26,46,0.15)'
                  }}
                />
              </div>
            </div>

            {/* Trope Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans font-bold">
                <span className="text-sage">Trope / Theme Hook</span>
                <span className="text-ink/80">{tropeWeight}%</span>
              </div>
              <div className="w-full bg-[#E8DFC9] h-3.5 rounded-full overflow-hidden border border-sage/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${tropeWeight}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #7A9E7E 0%, #F2A98A 100%)',
                    boxShadow: '0 0 10px rgba(122,158,126,0.15)'
                  }}
                />
              </div>
            </div>

            {/* Logline Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans font-bold">
                <span className="text-accent">Logline Hook</span>
                <span className="text-ink/80">{loglineWeight}%</span>
              </div>
              <div className="w-full bg-[#E8DFC9] h-3.5 rounded-full overflow-hidden border border-sage/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loglineWeight}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #C96A42 0%, #FAF7F2 100%)',
                    boxShadow: '0 0 10px rgba(201,106,66,0.15)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Structural Score Semicircle Gauges */}
        <div className="parchment-card p-6 flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 text-burgundy/40 mb-3">
              <Compass size={16} />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]">Structural Review Metrics</span>
            </div>
            <h3 className="text-xl font-display font-extrabold text-burgundy leading-snug">Structural Scores</h3>
            <p className="text-xs text-ink/60 leading-relaxed font-serif mt-1">
              Aggregated technical consensus from active reader critiques.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Pacing Gauge */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-14 flex items-end justify-center">
                <svg className="w-full h-full" viewBox="0 0 80 40">
                  <path 
                    d="M 10 35 A 30 30 0 0 1 70 35" 
                    fill="none" 
                    stroke="#E8DFC9" 
                    strokeWidth="5" 
                    strokeLinecap="round"
                  />
                  <motion.path 
                    d="M 10 35 A 30 30 0 0 1 70 35" 
                    fill="none" 
                    stroke="#5C1A2E" 
                    strokeWidth="5.5" 
                    strokeLinecap="round"
                    strokeDasharray={gaugeCircumference}
                    initial={{ strokeDashoffset: gaugeCircumference }}
                    animate={{ strokeDashoffset: pacingOffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute bottom-0 text-center">
                  <span className="text-lg font-display font-black text-burgundy">{pacingScore.toFixed(1)}</span>
                  <span className="text-[9px] font-sans text-ink/40 font-bold block leading-none">/ 5.0</span>
                </div>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-burgundy/80 mt-2">Pacing</span>
            </div>

            {/* Technical Gauge */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-14 flex items-end justify-center">
                <svg className="w-full h-full" viewBox="0 0 80 40">
                  <path 
                    d="M 10 35 A 30 30 0 0 1 70 35" 
                    fill="none" 
                    stroke="#E8DFC9" 
                    strokeWidth="5" 
                    strokeLinecap="round"
                  />
                  <motion.path 
                    d="M 10 35 A 30 30 0 0 1 70 35" 
                    fill="none" 
                    stroke="#7A9E7E" 
                    strokeWidth="5.5" 
                    strokeLinecap="round"
                    strokeDasharray={gaugeCircumference}
                    initial={{ strokeDashoffset: gaugeCircumference }}
                    animate={{ strokeDashoffset: technicalOffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute bottom-0 text-center">
                  <span className="text-lg font-display font-black text-sage">{technicalScore.toFixed(1)}</span>
                  <span className="text-[9px] font-sans text-ink/40 font-bold block leading-none">/ 5.0</span>
                </div>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-sage mt-2">Technical Prose</span>
            </div>
          </div>
        </div>

      </div>

      {/* Synthesis 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* The Mirror */}
        <div 
          className="parchment-card p-6 sm:p-8 flex flex-col justify-between"
          style={{ borderTop: '4px solid #F2A98A' }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-burgundy/40 mb-4">
              <Eye size={16} className="text-[#F2A98A]" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em]">The Mirror</span>
            </div>
            <h4 className="text-xl font-display font-extrabold text-burgundy mb-4">Audience Theme Perception</h4>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-serif">
              {synthesizedMirror}
            </p>
          </div>
          <div className="border-t border-sage/10 pt-4 mt-6 text-[10px] text-ink/40 font-serif italic">
            Reflecting what the readers decoded.
          </div>
        </div>

        {/* The High-Water Mark */}
        <div 
          className="parchment-card p-6 sm:p-8 flex flex-col justify-between"
          style={{ borderTop: '4px solid #7A9E7E' }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-burgundy/40 mb-4">
              <Star size={16} className="text-sage" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em]">High-Water Mark</span>
            </div>
            <h4 className="text-xl font-display font-extrabold text-burgundy mb-4">Celebrated Lines & Details</h4>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-serif">
              {synthesizedHighwater}
            </p>
          </div>
          <div className="border-t border-sage/10 pt-4 mt-6 text-[10px] text-ink/40 font-serif italic">
            Identifying universally praised phrases and strong hooks.
          </div>
        </div>

        {/* The Constructive Pivot */}
        <div 
          className="bg-ink text-cream p-6 sm:p-8 rounded-[24px] shadow-xl flex flex-col justify-between border border-white/5"
          style={{ borderTop: '4px solid #C96A42' }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-cream/40 mb-4">
              <CheckSquare size={16} className="text-[#C96A42]" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em]">Constructive Pivot</span>
            </div>
            <h4 className="text-xl font-display font-extrabold text-cream mb-4">Revision Action Plan</h4>
            <div className="space-y-4">
              {pivotSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(201,106,66,0.2)', border: '1px solid #C96A42', color: '#F2A98A' }}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-cream/80 leading-relaxed font-serif">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 mt-6 text-[10px] text-cream/40 font-serif italic">
            Practical roadmap for self-directed polishing.
          </div>
        </div>

      </div>

    </motion.div>
  );
}
