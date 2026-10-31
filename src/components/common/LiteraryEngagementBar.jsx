"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Heart, Feather, Sparkles, Send, Loader2, 
  MessageSquare, Gift, Check, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORY_TAGS = [
  'Plot Tension',
  'Character Depth',
  'Worldbuilding',
  'Atmospheric',
  'Twist Ending',
  'Philosophical',
  'Vivid Dialogue',
  'Emotional Climax'
];

const POEM_TAGS = [
  'Lyrical Cadence',
  'Emotional Vulnerability',
  'Imagery & Metaphor',
  'Haunting Tone',
  'Rhythmic Meter',
  'Raw Sincerity',
  'Evocative Language',
  'Resonant Ending'
];

export default function LiteraryEngagementBar({ 
  submissionId, 
  category = 'story', 
  authorName = 'Author',
  currentUser = null,
  onBalanceUpdate = null 
}) {
  const isPoem = (category || '').toLowerCase().includes('poem');
  const availableTags = isPoem ? POEM_TAGS : STORY_TAGS;

  // Ratings state
  const [ratingsStats, setRatingsStats] = useState({ totalRatings: 0, averageRating: 0, topTags: [] });
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState(null);

  // Tipping state
  const [tipAmount, setTipAmount] = useState(10);
  const [tipNote, setTipNote] = useState('');
  const [showTipNote, setShowTipNote] = useState(false);
  const [submittingTip, setSubmittingTip] = useState(false);
  const [tipMessage, setTipMessage] = useState(null);
  const [tipError, setTipError] = useState(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch initial ratings and comments
  useEffect(() => {
    if (!submissionId) return;

    // 1. Fetch ratings
    fetch(`/api/submissions/${submissionId}/rate`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setRatingsStats(data.stats);
          if (data.userRating) {
            setUserRating(data.userRating.rating);
            setSelectedTags(data.userRating.tags || []);
          }
        }
      })
      .catch(err => console.error("Ratings fetch error:", err));

    // 2. Fetch comments
    setLoadingComments(true);
    fetch(`/api/submissions/${submissionId}/comments`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.comments) {
          setComments(data.comments);
        }
      })
      .catch(err => console.error("Comments fetch error:", err))
      .finally(() => setLoadingComments(false));
  }, [submissionId]);

  // Handle rating submission (click on star or update tags)
  const handleRatingSubmit = async (scoreToSubmit, tagsToSubmit) => {
    const finalScore = scoreToSubmit || userRating;
    const finalTags = tagsToSubmit !== undefined ? tagsToSubmit : selectedTags;
    if (!finalScore) return;

    setSubmittingRating(true);
    setRatingMessage(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: finalScore,
          tags: finalTags,
          reviewText: ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setUserRating(finalScore);
        if (data.stats) setRatingsStats(data.stats);
        setRatingMessage('Rating recorded!');
        if (finalScore === 5) {
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
        }
        setTimeout(() => setRatingMessage(null), 3000);
      } else {
        setRatingMessage(data.error || 'Failed to submit rating.');
      }
    } catch {
      setRatingMessage('Network error submitting rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleStarClick = (score) => {
    setUserRating(score);
    handleRatingSubmit(score, selectedTags);
  };

  const toggleTag = (tag) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag].slice(0, 4);
    setSelectedTags(updated);
    if (userRating > 0) {
      handleRatingSubmit(userRating, updated);
    }
  };

  // Handle tipping submission
  const handleTipSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!tipAmount || tipAmount <= 0) return;

    setSubmittingTip(true);
    setTipError(null);
    setTipMessage(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tipAmount,
          note: tipNote.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setTipMessage(`Tipped ${tipAmount} Leaves to ${authorName}!`);
        setTipNote('');
        setShowTipNote(false);
        if (onBalanceUpdate && data.newBalance !== undefined) {
          onBalanceUpdate(data.newBalance);
        }
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
        
        // Refresh comments if patron note was added
        const cRes = await fetch(`/api/submissions/${submissionId}/comments`);
        const cData = await cRes.json();
        if (cData.success && cData.comments) setComments(cData.comments);
        setTimeout(() => setTipMessage(null), 4000);
      } else {
        setTipError(data.error || 'Failed to tip leaves.');
      }
    } catch {
      setTipError('Failed to connect to leaves vault.');
    } finally {
      setSubmittingTip(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF5EE] border border-[#20070e]/15 rounded-3xl p-5 sm:p-7 text-[#20070e] space-y-6 my-6 shadow-sm">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP ROW: RATING STARS (LEFT) & LEAF TIPPING PILLS (RIGHT)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#20070e]/10 pb-5">
        
        {/* Left: 5-Quill Literary Rating */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c96a42] font-bold">
              Literary Rating
            </span>
            {ratingMessage && (
              <span className="text-[10px] font-sans font-bold text-[#c96a42] animate-pulse">
                • {ratingMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Stars */}
            <div className="flex items-center gap-1 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={submittingRating}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-120 transition-transform focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star 
                    size={22} 
                    className={`transition-colors ${
                      star <= (hoverRating || userRating)
                        ? 'fill-[#c96a42] text-[#c96a42]'
                        : star <= Math.round(ratingsStats.averageRating)
                          ? 'fill-[#c96a42]/30 text-[#c96a42]/40'
                          : 'text-[#20070e]/20'
                    }`} 
                  />
                </button>
              ))}
            </div>

            {/* Score & Counter */}
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="font-bold text-base text-[#20070e]">
                {ratingsStats.averageRating > 0 ? Number(ratingsStats.averageRating).toFixed(1) : '—'}
              </span>
              <span className="text-xs text-[#20070e]/50">
                ({ratingsStats.totalRatings} {ratingsStats.totalRatings === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#20070e]/60 font-serif italic">
            {userRating > 0 ? `Your assessment: ${userRating} Stars. Click tags below to refine.` : 'Tap a star to rate this manuscript.'}
          </p>
        </div>

        {/* Right: Direct Leaf Tipping Drawer */}
        <div className="w-full md:w-auto space-y-2 border-t md:border-t-0 md:border-l border-[#20070e]/10 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c96a42] font-bold flex items-center gap-1">
              <span>🍃</span> Patron Leaves Tip
            </span>
            {tipMessage && (
              <span className="text-[10px] font-sans font-bold text-emerald-700">
                {tipMessage}
              </span>
            )}
            {tipError && (
              <span className="text-[10px] font-sans font-bold text-rose-600">
                {tipError}
              </span>
            )}
          </div>

          {/* Amount Pills + Send Button */}
          <div className="flex flex-wrap items-center gap-2">
            {[5, 10, 25, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTipAmount(amt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  tipAmount === amt
                    ? 'bg-[#c96a42] text-[#FBF7EE] shadow-sm'
                    : 'bg-white border border-[#20070e]/15 text-[#20070e]/80 hover:border-[#c96a42]'
                }`}
              >
                +{amt} 🍂
              </button>
            ))}

            <button
              type="button"
              disabled={submittingTip || !tipAmount}
              onClick={handleTipSubmit}
              className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submittingTip ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Gift size={12} />
              )}
              <span>Tip {tipAmount} Leaves</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTipNote(!showTipNote)}
              className="text-[11px] text-[#c96a42] hover:underline font-serif italic pl-1"
            >
              {showTipNote ? 'Hide note' : '+ Add patron note'}
            </button>
          </div>

          {/* Optional Patron Note Field */}
          {showTipNote && (
            <div className="pt-1.5">
              <input
                type="text"
                value={tipNote}
                onChange={(e) => setTipNote(e.target.value)}
                placeholder="Attach a personal encouragement note..."
                className="w-full bg-white border border-[#20070e]/20 rounded-xl px-3 py-1.5 text-xs text-[#20070e] placeholder-[#20070e]/35 focus:outline-none focus:border-[#c96a42]"
              />
            </div>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MIDDLE ROW: CATEGORY CRAFT TAGS (PLOT, DIALOGUE, METAPHOR)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#20070e]/50 font-semibold">
            {isPoem ? 'Poetic Elements' : 'Narrative Craft Elements'} (Tap to Endorse)
          </span>
          <span className="text-[10px] text-[#20070e]/40 font-mono">
            {selectedTags.length}/4 selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#20070e] text-[#FBF7EE] font-bold shadow-xs'
                    : 'bg-white/80 border border-[#20070e]/15 text-[#20070e]/75 hover:border-[#c96a42]'
                }`}
              >
                {isSelected && <Check size={11} className="text-[#F2A98A]" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM ROW: READER REFLECTIONS & NOTES STREAM
          ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#20070e]/10 pt-5 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-[#c96a42]" />
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#20070e]">
              Reader Reflections &amp; Notes
            </h4>
            <span className="text-xs text-[#20070e]/50 font-mono">
              ({comments.length})
            </span>
          </div>
          <span className="text-[10px] text-[#20070e]/40 font-mono">
            Clubhouse Scribe Thread
          </span>
        </div>

        {/* Comment Input Box (Always Visible) */}
        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Leave a note of reflection for ${authorName}...`}
            className="flex-1 bg-white border border-[#20070e]/20 rounded-xl px-4 py-2.5 text-xs text-[#20070e] placeholder-[#20070e]/40 focus:outline-none focus:border-[#c96a42] font-serif"
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
          >
            {submittingComment ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            <span className="hidden sm:inline">Send Note</span>
          </button>
        </form>

        {/* Comments Feed */}
        {loadingComments ? (
          <div className="space-y-2 pt-1">
            <div className="h-10 bg-white/60 rounded-xl animate-pulse" />
            <div className="h-10 bg-white/60 rounded-xl animate-pulse" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-[#20070e]/50 font-serif italic bg-white/40 border border-dashed border-[#20070e]/15 p-4 rounded-xl text-center">
            No notes left yet. Be the first reader to share a reflection!
          </p>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 paper-scrollbar">
            {comments.map((c) => (
              <div 
                key={c.id} 
                className="bg-white border border-[#20070e]/10 p-3.5 rounded-2xl space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#20070e] font-sans flex items-center gap-1.5">
                    <span>{c.displayName || 'Reader'}</span>
                    {c.userArchetype && (
                      <span className="text-[9px] font-mono text-[#c96a42] uppercase tracking-wider bg-[#c96a42]/10 px-1.5 py-0.5 rounded-md font-normal">
                        {c.userArchetype}
                      </span>
                    )}
                  </span>
                  <span className="text-[#20070e]/40 font-mono text-[10px]">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-[#20070e]/85 font-serif leading-relaxed">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
