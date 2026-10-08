"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, BookOpen, Bookmark, Send, CheckCircle2, 
  ArrowRight, ShieldAlert, Sparkles, Lock, RotateCcw, 
  FileText, Compass, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReturnersCrossingClient({ initialProgress, userName = 'Crosser' }) {
  const [progress, setProgress] = useState(initialProgress);
  const [petitionText, setPetitionText] = useState(initialProgress?.gate3?.petitionText || '');
  const [isSubmittingPetition, setIsSubmittingPetition] = useState(false);
  const [petitionSuccess, setPetitionSuccess] = useState(null);
  const [petitionError, setPetitionError] = useState(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationSuccess, setRestorationSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState(null);

  const isEvicted = progress?.isEvicted;

  // Live word counter for Gate 3
  const wordCount = petitionText.trim() ? petitionText.trim().split(/\s+/).filter(Boolean).length : 0;
  const isPetitionWordTargetMet = wordCount >= (progress?.gate3?.requiredWords || 30);

  // Refresh status from API
  const refreshStatus = async () => {
    try {
      const res = await fetch('/api/crossing/returner/status');
      const data = await res.json();
      if (data.success && data.progress) {
        setProgress(data.progress);
        if (data.progress.gate3?.petitionText) {
          setPetitionText(data.progress.gate3.petitionText);
        }
      }
    } catch (err) {
      console.error('Failed to refresh returner status:', err);
    }
  };

  // Submit Gate 3 Petition
  const handlePetitionSubmit = async (e) => {
    e.preventDefault();
    if (!isPetitionWordTargetMet) {
      setPetitionError(`Please write at least ${progress?.gate3?.requiredWords || 30} words. Current: ${wordCount} words.`);
      return;
    }

    setIsSubmittingPetition(true);
    setPetitionError(null);
    setPetitionSuccess(null);

    try {
      const res = await fetch('/api/crossing/returner/petition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petitionText }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit petition');
      }

      setPetitionSuccess('Your Returner’s Petition has been inscribed upon the sanctuary ledger.');
      await refreshStatus();
    } catch (err) {
      setPetitionError(err.message || 'Submission failed');
    } finally {
      setIsSubmittingPetition(false);
    }
  };

  // Trigger Restoration
  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreError(null);

    try {
      const res = await fetch('/api/crossing/returner/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Restoration failed');
      }

      setRestorationSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F2A98A', '#c96a42', '#20070e', '#ffffff'],
      });
      await refreshStatus();
    } catch (err) {
      setRestoreError(err.message || 'Failed to restore membership');
    } finally {
      setIsRestoring(false);
    }
  };

  // If member is not evicted
  if (!isEvicted && !restorationSuccess) {
    return (
      <main className="min-h-screen bg-[#080204] text-cream flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-radial from-burgundy/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-xl w-full bg-[#16040a]/90 border border-[#c96a42]/30 rounded-[32px] p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#20070e] border border-[#F2A98A]/30 flex items-center justify-center text-[#F2A98A] shadow-inner">
            <Flame size={32} className="text-[#F2A98A] animate-pulse" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-cream">
            Your Flame Burns Bright
          </h1>
          <p className="text-sm font-serif text-cream/70 leading-relaxed">
            Welcome, <strong className="text-[#F2A98A]">{userName}</strong>. You are currently an active member in good standing within Paper Thoughts. The Returner’s Crossing is only walked by scribes whose flame has slipped into exile.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-burgundy to-[#5c1a2e] text-cream font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg border border-[#F2A98A]/20"
            >
              <span>Return to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If successfully restored
  if (restorationSuccess) {
    return (
      <main className="min-h-screen bg-[#080204] text-cream flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-radial from-[#c96a42]/20 via-burgundy/30 to-[#080204] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-xl w-full bg-[#16040a]/95 border border-[#F2A98A]/40 rounded-[36px] p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#c96a42] to-burgundy border-2 border-[#F2A98A] flex items-center justify-center text-cream shadow-2xl">
            <Sparkles size={36} className="text-[#F2A98A] animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-cream">
            Sanctuary Restored
          </h1>
          <p className="text-sm sm:text-base font-serif text-cream/80 leading-relaxed">
            The ledger is marked. The three gates have swung open. Your standing has been renewed and all strikes have been cleared from your record.
          </p>
          <div className="p-4 rounded-2xl bg-burgundy/40 border border-[#F2A98A]/20 text-xs font-serif text-[#F2A98A]">
            "To return with renewed intent is the hallmark of a true scribe."
          </div>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#c96a42] to-burgundy text-cream font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl border border-[#F2A98A]/30"
            >
              <span>Enter Sanctuary Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  // Active Eviction Journey View
  return (
    <main className="min-h-screen bg-[#080204] text-cream py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-radial from-burgundy/40 via-[#c96a42]/10 to-transparent blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#c96a42]/10 blur-[120px] pointer-events-none -z-10" />

      {/* Floating Ember Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            left: `${4 + (i * 6.7) % 92}%`,
            top: `${12 + (i * 5.9) % 80}%`,
            background: i % 2 === 0 ? 'rgba(242,169,138,0.7)' : 'rgba(201,106,66,0.6)',
            boxShadow: '0 0 8px rgba(242,169,138,0.8)',
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.3, 0.9, 0.3],
          }}
          transition={{
            duration: 4 + (i % 4),
            repeat: Infinity,
            delay: (i * 0.3) % 3,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-burgundy/60 border border-[#c96a42]/40 text-[#F2A98A] text-xs font-bold uppercase tracking-widest shadow-inner"
          >
            <ShieldAlert size={14} className="text-[#c96a42]" />
            <span>The Gates of Exile</span>
          </motion.div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-cream tracking-tight">
            The Returner’s Crossing
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base font-serif text-cream/70 leading-relaxed">
            Your seat at the roundtable was made dormant due to inactivity strikes. But silence is not finality in Paper Thoughts. Complete the three sacred gates below to rekindle your flame and reclaim your sanctuary standing.
          </p>

          {/* User Status Ribbon */}
          <div className="inline-flex flex-wrap items-center justify-center gap-4 p-3 px-6 rounded-2xl bg-[#17050b]/80 border border-sage/15 text-xs font-mono text-cream/75">
            <span>Scribe: <strong className="text-cream">{userName}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-[#c96a42] uppercase">Exiled / Dormant</strong></span>
            <span>•</span>
            <span>Strikes: <strong className="text-red-400">{progress?.strikes || 3}/3</strong></span>
            {progress?.evictedAt && (
              <>
                <span>•</span>
                <span>Exiled on: <strong className="text-cream/90">{new Date(progress.evictedAt).toLocaleDateString()}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* The 3 Gates Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* GATE 1: The Scribe's Penance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-[28px] border flex flex-col justify-between transition-all ${
              progress?.gate1?.passed
                ? 'bg-[#1b0610]/90 border-green-500/40 shadow-green-950/20 shadow-lg'
                : 'bg-[#16040a]/90 border-[#c96a42]/30 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]">Gate I</span>
                {progress?.gate1?.passed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <CheckCircle2 size={12} /> Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <Lock size={12} /> Pending
                  </span>
                )}
              </div>

              <div className="w-12 h-12 rounded-2xl bg-burgundy/40 border border-[#F2A98A]/20 flex items-center justify-center text-[#F2A98A]">
                <BookOpen size={22} />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-cream">{progress?.gate1?.title}</h3>
                <p className="text-xs font-serif text-cream/70 mt-1 leading-relaxed">
                  Deliver 3 thoughtful peer critiques to weekly submissions written since exile.
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cream/60">Progress</span>
                  <span className="text-[#F2A98A] font-bold">
                    {progress?.gate1?.current} / {progress?.gate1?.required} Critiques
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-cream/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#c96a42] to-[#F2A98A] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, ((progress?.gate1?.current || 0) / (progress?.gate1?.required || 3)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/dashboard/review"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-burgundy/80 hover:bg-burgundy text-cream text-xs font-bold uppercase tracking-wider transition-all border border-[#F2A98A]/20"
              >
                <span>Critique Queue</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>

          {/* GATE 2: The Living Guild (BOTM) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-[28px] border flex flex-col justify-between transition-all ${
              progress?.gate2?.passed
                ? 'bg-[#1b0610]/90 border-green-500/40 shadow-green-950/20 shadow-lg'
                : 'bg-[#16040a]/90 border-[#c96a42]/30 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]">Gate II</span>
                {progress?.gate2?.passed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <CheckCircle2 size={12} /> Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <Lock size={12} /> Pending
                  </span>
                )}
              </div>

              <div className="w-12 h-12 rounded-2xl bg-burgundy/40 border border-[#F2A98A]/20 flex items-center justify-center text-[#F2A98A]">
                <Bookmark size={22} />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-cream">{progress?.gate2?.title}</h3>
                <p className="text-xs font-serif text-cream/70 mt-1 leading-relaxed">
                  Inscribe a full critique for the current Book of the Month.
                </p>
              </div>

              {/* Book Info Card */}
              {progress?.activeBotm && (
                <div className="p-3 rounded-xl bg-burgundy/30 border border-sage/10 flex items-center gap-3">
                  {progress.activeBotm.image_url ? (
                    <img 
                      src={progress.activeBotm.image_url} 
                      alt={progress.activeBotm.title}
                      className="w-10 h-14 object-cover rounded shadow border border-cream/10" 
                    />
                  ) : (
                    <div className="w-10 h-14 bg-cream/10 rounded flex items-center justify-center text-xs">📖</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-cream truncate">{progress.activeBotm.title}</p>
                    <p className="text-[10px] font-serif text-[#F2A98A] truncate">{progress.activeBotm.author}</p>
                    <span className="text-[9px] uppercase tracking-wider text-cream/50">Current BOTM</span>
                  </div>
                </div>
              )}

              {/* Progress Tracker */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cream/60">Status</span>
                  <span className="text-[#F2A98A] font-bold">
                    {progress?.gate2?.passed ? '1 / 1 Completed' : '0 / 1 Completed'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-cream/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#c96a42] to-[#F2A98A] transition-all duration-500 rounded-full"
                    style={{ width: progress?.gate2?.passed ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/books"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-burgundy/80 hover:bg-burgundy text-cream text-xs font-bold uppercase tracking-wider transition-all border border-[#F2A98A]/20"
              >
                <span>Review Book of Month</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>

          {/* GATE 3: The Scroll of Reckoning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-6 rounded-[28px] border flex flex-col justify-between transition-all ${
              progress?.gate3?.passed
                ? 'bg-[#1b0610]/90 border-green-500/40 shadow-green-950/20 shadow-lg'
                : 'bg-[#16040a]/90 border-[#c96a42]/30 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]">Gate III</span>
                {progress?.gate3?.passed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <CheckCircle2 size={12} /> Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <Lock size={12} /> Pending
                  </span>
                )}
              </div>

              <div className="w-12 h-12 rounded-2xl bg-burgundy/40 border border-[#F2A98A]/20 flex items-center justify-center text-[#F2A98A]">
                <FileText size={22} />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-cream">{progress?.gate3?.title}</h3>
                <p className="text-xs font-serif text-cream/70 mt-1 leading-relaxed">
                  Inscribe a written reflection on your return to craft and dedication to fellow scribes.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cream/60">Length</span>
                  <span className={isPetitionWordTargetMet ? 'text-green-400 font-bold' : 'text-[#F2A98A] font-bold'}>
                    {wordCount} / {progress?.gate3?.requiredWords || 30} words
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-cream/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#c96a42] to-green-400 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (wordCount / (progress?.gate3?.requiredWords || 30)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="#petition-section"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-burgundy/80 hover:bg-burgundy text-cream text-xs font-bold uppercase tracking-wider transition-all border border-[#F2A98A]/20"
              >
                <span>{progress?.gate3?.passed ? 'Edit Petition' : 'Inscribe Petition'}</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </motion.div>

        </div>

        {/* PETITION FORM SECTION */}
        <div id="petition-section" className="bg-[#16040a]/90 border border-[#c96a42]/30 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-sage/10 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-display font-extrabold text-cream flex items-center gap-2">
                <FileText className="text-[#F2A98A]" size={20} />
                <span>The Returner’s Petition</span>
              </h2>
              <p className="text-xs font-serif text-cream/70 mt-1">
                Reflect honestly upon your absence, what drew you back to Paper Thoughts, and the energy you bring back.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-cream/60">
              <span>Words:</span>
              <strong className={isPetitionWordTargetMet ? 'text-green-400 font-bold' : 'text-[#F2A98A] font-bold'}>
                {wordCount} / {progress?.gate3?.requiredWords || 30}
              </strong>
            </div>
          </div>

          <form onSubmit={handlePetitionSubmit} className="space-y-4">
            <textarea
              value={petitionText}
              onChange={(e) => setPetitionText(e.target.value)}
              placeholder="Inscribe your reflection here... Share your thoughts on your craft, why you slipped into silence, and what you vow to bring to the roundtable upon your return."
              rows={5}
              className="w-full bg-[#0d0206] border border-[#c96a42]/30 rounded-2xl p-4 text-xs font-serif text-cream placeholder-cream/30 focus:outline-none focus:border-[#F2A98A] transition-all resize-y leading-relaxed"
            />

            {petitionSuccess && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-sans flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{petitionSuccess}</span>
              </div>
            )}

            {petitionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-sans flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{petitionError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingPetition || !isPetitionWordTargetMet}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-burgundy to-[#5c1a2e] text-cream font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#F2A98A]/20 shadow-lg"
              >
                <Send size={14} />
                <span>{isSubmittingPetition ? 'Inscribing...' : 'Submit Returner Petition'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RESTORATION ALTAR (Bottom Action Container) */}
        <div className="bg-gradient-to-b from-[#1b0610] to-[#120308] border-2 border-[#c96a42]/40 rounded-[36px] p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-24 bg-[#F2A98A]/10 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 mx-auto rounded-full bg-[#20070e] border-2 border-[#F2A98A]/40 flex items-center justify-center text-[#F2A98A] shadow-xl relative">
            <Flame 
              size={40} 
              className={progress?.canRestore ? "text-[#F2A98A] animate-pulse" : "text-cream/30"} 
            />
            {progress?.canRestore && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#20070e] flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </span>
            )}
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-cream">
              {progress?.canRestore ? 'The Road is Cleared' : 'The Seal of Exile'}
            </h2>
            <p className="text-xs sm:text-sm font-serif text-cream/70 leading-relaxed">
              {progress?.canRestore
                ? 'All three crossing gates have been completed. The guild ledger recognizes your dedication and penitence.'
                : 'The gates remain shut until all three conditions are satisfied. Fulfill your peer reviews, the Book of the Month critique, and your written reflection above.'}
            </p>
          </div>

          {restoreError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-sans flex items-center gap-2 justify-center">
              <AlertCircle size={16} />
              <span>{restoreError}</span>
            </div>
          )}

          <div className="pt-2">
            {progress?.canRestore ? (
              <motion.button
                onClick={handleRestore}
                disabled={isRestoring}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#c96a42] via-[#e2845c] to-[#c96a42] text-cream font-bold text-sm uppercase tracking-widest shadow-2xl border border-[#F2A98A] transition-all cursor-pointer"
              >
                <Flame size={18} className="text-yellow-200 animate-pulse" />
                <span>{isRestoring ? 'Rekindling Flame...' : 'Relight the Flame — Reclaim Sanctuary'}</span>
                <Sparkles size={16} className="text-yellow-200" />
              </motion.button>
            ) : (
              <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-cream/5 border border-sage/10 text-cream/40 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                <Lock size={14} />
                <span>Gates Incomplete ({[progress?.gate1?.passed, progress?.gate2?.passed, progress?.gate3?.passed].filter(Boolean).length}/3 Cleared)</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
