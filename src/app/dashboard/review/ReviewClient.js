"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MessageSquare, Flame, CheckCircle2, AlertCircle, 
  HelpCircle, Sparkles, BookOpen, Clock, PenTool, Check, Gift 
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function ReviewClient() {
  // Navigation / Loading States
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);

  // Intent Intercept States
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyReason, setSurveyReason] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showSurveyModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showSurveyModal]);
  
  // Manuscript Workspace States
  const [fetchingSubmission, setFetchingSubmission] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Critique Form States
  const [pacingRating, setPacingRating] = useState('');
  const [strengthsArray, setStrengthsArray] = useState([]);
  const [mirrorResponse, setMirrorResponse] = useState('');
  const [highwaterResponse, setHighwaterResponse] = useState('');
  const [pivotResponse, setPivotResponse] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [profile, setProfile] = useState(null);
  
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

  // Available Strengths options
  const strengthOptions = [
    { id: 'voice', label: 'Narrative Voice' },
    { id: 'dialogue', label: 'Dialogue & Rhythm' },
    { id: 'world_building', label: 'World-Building' },
    { id: 'pacing', label: 'Narrative Pacing' },
    { id: 'emotional_impact', label: 'Emotional Impact' },
    { id: 'character_dev', label: 'Character Development' },
    { id: 'prose', label: 'Sentence Prose' },
    { id: 'theme', label: 'Thematic Depth' }
  ];

  // Load Queue of 3 blind cards
  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
      } else {
        setError(data.error || 'Failed to fetch queue.');
      }
    } catch (err) {
      setError('A connection error occurred while loading the queue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch reviewer profile:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchProfile();
  }, []);

  // Handle Card Click (Opens Click Survey Intercept Modal)
  const handleCardSelectionInitiated = (card) => {
    setSelectedCard(card);
    setShowSurveyModal(true);
    setSurveyReason(null);
  };

  // Submit Selection Intent Survey & Fetch Full Submission
  const handleSurveySubmit = async (reason) => {
    setSurveyReason(reason);
    setShowSurveyModal(false);
    setFetchingSubmission(true);

    try {
      // 1. Send PATCH to record intent
      await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selectedCard.id, reason })
      });

      // 2. Fetch full body of the submission
      const res = await fetch(`/api/submissions?id=${selectedCard.id}`);
      const data = await res.json();
      if (data.success && data.submission) {
        setSelectedSubmission(data.submission);
      } else {
        setError(data.error || 'Failed to retrieve manuscript body.');
      }
    } catch (err) {
      setError('An error occurred while loading the manuscript.');
    } finally {
      setFetchingSubmission(false);
    }
  };

  // Toggle Strengths checkboxes
  const handleStrengthToggle = (id) => {
    if (strengthsArray.includes(id)) {
      setStrengthsArray(prev => prev.filter(item => item !== id));
    } else {
      setStrengthsArray(prev => [...prev, id]);
    }
  };

  // Word counter helper
  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const mirrorWordCount = countWords(mirrorResponse);
  const highwaterWordCount = countWords(highwaterResponse);
  const pivotWordCount = countWords(pivotResponse);

  // Submit completed Peer Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Explicit Validation Warnings for Users
    if (!pacingRating) {
      setError("Please select a Narrative Pacing rating.");
      return;
    }
    if (strengthsArray.length === 0) {
      setError("Please select at least one Standout Element.");
      return;
    }
    if (!mirrorResponse.trim()) {
      setError("Please provide a Perception (Theme) analysis.");
      return;
    }
    if (!highwaterResponse.trim()) {
      setError("Please provide a Climax (Standout Moment) analysis.");
      return;
    }
    if (!pivotResponse.trim()) {
      setError("Please provide Constructive Feedback.");
      return;
    }
    if (profile && tipAmount > profile.spendableLeaves) {
      setError(`Insufficient leaves: You tried to tip ${tipAmount} leaves, but only have ${profile.spendableLeaves} spendable leaves.`);
      return;
    }
    if (tipAmount % 5 !== 0) {
      setError("Tip amount must be a multiple of 5.");
      return;
    }

    setSubmittingReview(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          pacingRating,
          strengthsArray,
          mirrorResponse,
          highwaterResponse,
          pivotResponse,
          tipAmount
        })
      });

      const data = await res.json();
      if (data.success) {
        setReviewResult(data);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        setError(data.error || 'Review submission rejected by system.');
      }
    } catch (err) {
      setError('Failed to transmit critique ledger.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReset = () => {
    setSelectedCard(null);
    setSelectedSubmission(null);
    setPacingRating('');
    setStrengthsArray([]);
    setMirrorResponse('');
    setHighwaterResponse('');
    setPivotResponse('');
    setTipAmount(0);
    setReviewResult(null);
    fetchQueue();
    fetchProfile();
  };

  // 1. Success Screen
  if (reviewResult) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-6">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="max-w-xl w-full bg-white p-10 rounded-[36px] border border-sage/20 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
            <CheckCircle2 size={48} />
          </div>

          <h2 className="text-3xl font-display text-burgundy mb-2">Critique Ledger Logged</h2>
          <p className="text-xs font-mono text-ink/40 mb-6">REVIEW ID: {reviewResult.review?.id}</p>

          <div className="bg-sage/5 border border-sage/10 rounded-2xl p-6 mb-8 text-left space-y-4">
            <h4 className="font-bold text-sm text-ink/80 flex items-center gap-1.5"><Sparkles size={16} className="text-accent" /> Rewards Distributed:</h4>
            
            {reviewResult.rewarded ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-sage/10">
                  <div className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Milestone Tokens</div>
                  <div className="text-2xl font-display text-burgundy mt-1">+{reviewResult.tokensEarned.toFixed(1)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-sage/10">
                  <div className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Paper Leaves</div>
                  <div className="text-2xl font-display text-burgundy mt-1">+{reviewResult.leavesEarned} 🍃</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink/60 leading-relaxed italic">
                You have completed more than 3 reviews in this Saturday cycle. This critique was submitted successfully to support your peers, but did not reward additional tokens.
              </p>
            )}

            {reviewResult.earlyBird && reviewResult.rewarded && (
              <div className="bg-burgundy/5 border border-burgundy/15 rounded-xl p-3 text-[11px] font-bold text-burgundy flex items-center gap-1.5">
                <Clock size={14} /> Early-Bird Window active (+1.5x payout rate applied)
              </div>
            )}
            
            {reviewResult.milestoneTriggered && (
              <div className="bg-accent/10 border border-accent/25 rounded-xl p-3 text-[11px] font-bold text-burgundy flex items-center gap-1.5">
                <Gift size={14} className="text-accent" /> 500 Lifetime Leaves milestone reached! A book voucher has been gifted!
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleReset} 
              className="flex-1 bg-burgundy hover:bg-ink text-cream py-4 rounded-xl font-bold transition-all shadow-md"
            >
              Critique Another Manuscript
            </button>
            <Link 
              href="/dashboard" 
              className="flex-1 bg-sage/10 hover:bg-sage/20 text-ink py-4 rounded-xl font-bold transition-all flex items-center justify-center"
            >
              Return to Dashboard
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  // 2. Main Workspace (Manuscript + Critique Ledger Form)
  if (selectedSubmission) {
    return (
      <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => setSelectedSubmission(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors"
            >
              <ArrowLeft size={16} /> Exit Workspace
            </button>
            <div className="bg-white/60 border border-sage/20 rounded-full px-4 py-1.5 text-xs text-ink/50 font-mono">
              MANUSCRIPT #{selectedSubmission.id} (BLIND DRAFT)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: The Manuscript Body */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-[32px] border border-sage/20 shadow-xl space-y-6">
              <div>
                <span className="bg-sage/10 text-sage text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-sage/15">
                  {selectedSubmission.genre}
                </span>
                <h1 className="text-3xl font-display text-burgundy mt-3">{selectedSubmission.title}</h1>
                <div className="mt-4 p-4 bg-cream/40 rounded-xl border border-sage/10">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-ink/40 mb-1">Teaser / Premise</div>
                  <p className="text-xs text-ink/75 italic">&quot;{selectedSubmission.logline}&quot;</p>
                </div>
              </div>

              <hr className="border-sage/10" />

              {/* Manuscript text styled in elegant Georgia font */}
              <div 
                className="text-ink/90 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif tracking-normal max-h-[60vh] overflow-y-auto pr-3 scrollbar-thin"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {selectedSubmission.bodyText}
              </div>
            </div>

            {/* Right Column: Critique Ledger Form */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-[32px] border border-sage/20 shadow-xl">
              <div className="border-b border-sage/10 pb-4 mb-6">
                <h3 className="font-display text-xl text-burgundy flex items-center gap-2"><PenTool size={20}/> The Critique Ledger</h3>
                <p className="text-[10px] text-ink/40 uppercase tracking-widest font-bold mt-1">Review ledger logs on-chain</p>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* 1. Narrative Pacing */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider block">1. Narrative Pacing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['rushed', 'balanced', 'dragging'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPacingRating(option)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                          pacingRating === option
                            ? 'bg-burgundy border-burgundy text-cream shadow-sm'
                            : 'bg-cream/40 border-sage/20 text-ink/60 hover:bg-sage/5'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Standout Elements */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider block">2. Standout Elements (Select 1+)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {strengthOptions.map((opt) => {
                      const active = strengthsArray.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleStrengthToggle(opt.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            active
                              ? 'bg-sage/15 border-sage text-sage font-bold'
                              : 'bg-cream/20 border-sage/10 text-ink/70 hover:bg-sage/5'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {active && <Check size={12} className="text-sage" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Perception Theme Comprehension */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">3. Perception (Theme)</label>
                    <span className="text-[10px] font-mono font-bold text-ink/40">
                      {mirrorWordCount} words
                    </span>
                  </div>
                  <p className="text-[10px] text-ink/50 leading-relaxed italic">
                    How did you interpret the core theme or message of this manuscript?
                  </p>
                  <textarea
                    rows="3"
                    value={mirrorResponse}
                    onChange={(e) => setMirrorResponse(e.target.value)}
                    placeholder="Provide a detailed assessment of your perception of the piece's themes..."
                    className="w-full bg-cream/20 border border-sage/20 rounded-xl p-3 text-xs focus:outline-none focus:border-burgundy placeholder-ink/30 text-ink leading-relaxed"
                  />
                </div>

                {/* 4. Climax Standout Moment */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">4. Climax (Standout Moment)</label>
                    <span className="text-[10px] font-mono font-bold text-ink/40">
                      {highwaterWordCount} words
                    </span>
                  </div>
                  <p className="text-[10px] text-ink/50 leading-relaxed italic">
                    Quote the exact line, stanza, or climax moment that had the highest impact, and why.
                  </p>
                  <textarea
                    rows="3"
                    value={highwaterResponse}
                    onChange={(e) => setHighwaterResponse(e.target.value)}
                    placeholder="Highlight specific phrases or climax moments and describe their resonance..."
                    className="w-full bg-cream/20 border border-sage/20 rounded-xl p-3 text-xs focus:outline-none focus:border-burgundy placeholder-ink/30 text-ink leading-relaxed"
                  />
                </div>

                {/* 5. Constructive Feedback */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">5. Constructive Feedback</label>
                    <span className="text-[10px] font-mono font-bold text-ink/40">
                      {pivotWordCount} words
                    </span>
                  </div>
                  <p className="text-[10px] text-ink/50 leading-relaxed italic">
                    Identify one specific structural or phrasing revision that would elevate this draft.
                  </p>
                  <textarea
                    rows="3"
                    value={pivotResponse}
                    onChange={(e) => setPivotResponse(e.target.value)}
                    placeholder="Offer constructive feedback on what to target for revision..."
                    className="w-full bg-cream/20 border border-sage/20 rounded-xl p-3 text-xs focus:outline-none focus:border-burgundy placeholder-ink/30 text-ink leading-relaxed"
                  />
                </div>

                {/* 6. Support the Author with Leaves (Tipping) */}
                {profile && profile.spendableLeaves > 0 && (
                  <div className="bg-[#FAF6F0] border border-sage/20 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                        Support the Author (Optional Tip)
                      </label>
                      <span className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">
                        Balance: {profile.spendableLeaves} 🍃
                      </span>
                    </div>
                    <p className="text-[10px] text-ink/50 leading-relaxed italic">
                      Author identity is completely anonymous, but you can tip them leaves if you loved their work!
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[0, 5, 10, 20, 50].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setTipAmount(amount)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            tipAmount === amount
                              ? 'bg-burgundy border-burgundy text-cream shadow-sm'
                              : 'bg-white border-sage/15 text-ink/75 hover:bg-sage/10'
                          }`}
                        >
                          {amount === 0 ? 'No Tip' : `${amount} 🍃`}
                        </button>
                      ))}
                      
                      {/* Custom tip input */}
                      <div className="relative flex items-center max-w-[100px]">
                        <input
                          type="number"
                          min="0"
                          max={profile.spendableLeaves}
                          value={tipAmount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setTipAmount(Math.min(profile.spendableLeaves, Math.max(0, val)));
                          }}
                          placeholder="Custom"
                          className="w-full bg-white border border-sage/15 rounded-xl px-2 py-2 text-xs text-center focus:outline-none focus:border-burgundy font-bold text-ink"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-burgundy/5 border border-burgundy/15 p-3.5 rounded-xl flex items-center gap-2 text-xs text-burgundy font-medium">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-burgundy hover:bg-ink text-cream py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-xs cursor-pointer"
                >
                  {submittingReview ? 'Submitting Critique...' : 'Submit Critique'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 3. Selection Queue Landing (Double-Blind 3 cards view)
  return (
    <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8 relative">
      {/* Click Survey Intercept Modal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSurveyModal && selectedCard && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0c0205]/80 backdrop-blur-md cursor-pointer"
                onClick={() => {
                  setShowSurveyModal(false);
                  setSelectedCard(null);
                }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 15 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-[#FAF7F0] max-w-md w-full p-6 sm:p-8 rounded-[32px] border border-[#EADFC9] shadow-2xl text-center z-10 text-ink"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-3 text-burgundy">
                  <HelpCircle size={22} />
                </div>
                
                <h3 className="font-display text-2xl font-bold text-burgundy mb-1">A Moment of Intent</h3>
                <p className="text-[10px] text-ink/40 uppercase tracking-widest font-mono mb-4">Manuscript Selection Hook</p>
                
                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed mb-5 font-serif">
                  Before opening the manuscript ledger, what specific hook drew you to review this piece?
                </p>

                <div className="space-y-2">
                  {[
                    { key: 'title', label: 'The title sounds intriguing.' },
                    { key: 'genre', label: 'I am a fan of this genre.' },
                    { key: 'logline', label: 'The teaser hooks me immediately.' },
                    { key: 'outside_comfort', label: 'I want to step outside my comfort zone.' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleSurveySubmit(opt.key)}
                      className="w-full bg-white hover:bg-burgundy hover:text-cream border border-sage/20 rounded-xl p-3 text-xs font-bold text-ink/80 text-left transition-all cursor-pointer shadow-sm"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setShowSurveyModal(false);
                    setSelectedCard(null);
                  }}
                  className="mt-5 text-xs text-ink/40 font-bold uppercase tracking-wider hover:text-burgundy transition-colors cursor-pointer"
                >
                  Cancel Selection
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <Link 
              href="/dashboard"
              className="flex items-center gap-1 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors mb-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl sm:text-5xl font-display text-burgundy leading-none">The Critique Queue</h1>
            <p className="text-xs text-ink/50 mt-2">Providing perception, climax, and constructive insights for the community collective.</p>
          </div>

          <button 
            onClick={fetchQueue}
            className="bg-white/80 hover:bg-white text-ink border border-sage/25 py-2.5 px-5 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            Re-shuffle Queue
          </button>
        </div>

        {error && (
          <div className="bg-burgundy/5 border border-burgundy/15 p-4 rounded-2xl flex items-center gap-3 text-sm text-burgundy font-medium mb-8">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-burgundy/20 border-t-burgundy rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-ink/40 uppercase tracking-widest">Shuffling blind critique queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-sage/20 text-center shadow-md max-w-lg mx-auto">
            <BookOpen className="text-sage/40 mx-auto mb-4" size={48} />
            <h3 className="font-display text-xl text-burgundy mb-2">No Active Manuscripts</h3>
            <p className="text-xs text-ink/60 leading-relaxed mb-6">
              All stories in this batch have already been archived, or there are no new submissions to critique. Check back on Saturday after the batch drop, or write your own piece!
            </p>
            <Link 
              href="/dashboard/write"
              className="inline-block bg-burgundy hover:bg-ink text-cream py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            >
              Compose a Submission
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs text-burgundy font-medium leading-relaxed max-w-2xl">
              <strong>🔒 Double-Blind Protocols Active:</strong> Author identities are completely stripped. Submissions are sorted dynamically by lowest review counts to ensure all writing receives equal attention.
            </div>

            {/* 3 Blind Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {queue.map((card, idx) => (
                <motion.div 
                  key={card.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-[32px] border border-sage/20 shadow-md p-8 flex flex-col justify-between h-[360px] relative overflow-hidden group hover:border-burgundy/40 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 p-6 font-mono text-6xl text-ink/5 font-bold group-hover:text-burgundy/5 transition-colors">
                    0{idx + 1}
                  </div>

                  <div className="space-y-4">
                    <span className="bg-sage/10 text-sage text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-sage/15">
                      {card.genre}
                    </span>
                    <h3 className="text-xl font-display text-burgundy group-hover:text-accent transition-colors line-clamp-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-ink/60 leading-relaxed italic line-clamp-4">
                      &quot;{card.logline}&quot;
                    </p>
                  </div>

                  <button 
                    onClick={() => handleCardSelectionInitiated(card)}
                    className="w-full bg-cream/50 hover:bg-burgundy text-ink/75 hover:text-cream border border-sage/20 hover:border-burgundy py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Analyze & Critique
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
