"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Heart, Feather, Sparkles, Send, Loader2, 
  MessageSquare, Gift, Check, ChevronDown, ChevronUp, AlertCircle
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

  // Active view toggle: 'none' | 'rate' | 'tip' | 'comments'
  const [activeTab, setActiveTab] = useState('none');

  // Ratings state
  const [ratingsStats, setRatingsStats] = useState({ totalRatings: 0, averageRating: 0, topTags: [] });
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState(null);

  // Tipping state
  const [tipAmount, setTipAmount] = useState(10);
  const [tipNote, setTipNote] = useState('');
  const [submittingTip, setSubmittingTip] = useState(false);
  const [tipMessage, setTipMessage] = useState(null);
  const [tipError, setTipError] = useState(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch initial ratings and comments count
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
            setReviewText(data.userRating.reviewText || '');
          }
        }
      })
      .catch(err => console.error("Ratings fetch error:", err));

    // 2. Fetch comments
    fetch(`/api/submissions/${submissionId}/comments`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.comments) {
          setComments(data.comments);
        }
      })
      .catch(err => console.error("Comments fetch error:", err));
  }, [submissionId]);

  // Handle rating submission
  const handleRatingSubmit = async (scoreToSubmit) => {
    const finalScore = scoreToSubmit || userRating;
    if (!finalScore) return;

    setSubmittingRating(true);
    setRatingMessage(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: finalScore,
          tags: selectedTags,
          reviewText: reviewText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setUserRating(finalScore);
        if (data.stats) setRatingsStats(data.stats);
        setRatingMessage('Rating recorded in the Archives!');
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
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

  // Handle tipping submission
  const handleTipSubmit = async (e) => {
    e.preventDefault();
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
        if (onBalanceUpdate && data.newBalance !== undefined) {
          onBalanceUpdate(data.newBalance);
        }
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.8 } });
        // Refresh comments since note is added as comment
        const cRes = await fetch(`/api/submissions/${submissionId}/comments`);
        const cData = await cRes.json();
        if (cData.success) setComments(cData.comments);
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

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 4)
    );
  };

  return (
    <div className="w-full bg-[#FAF5EE] border border-[#20070e]/15 rounded-2xl p-4 sm:p-5 text-[#20070e] space-y-4 my-6 shadow-sm">
      
      {/* 1. Master Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#20070e]/10 pb-4">
        
        {/* Rating Summary Display */}
        <div className="flex items-center gap-2">
          <div className="flex items-center text-[#c96a42]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={16} 
                className={star <= Math.round(ratingsStats.averageRating) ? 'fill-[#c96a42]' : 'text-[#20070e]/20'} 
              />
            ))}
          </div>
          <span className="font-display font-bold text-sm text-[#20070e]">
            {ratingsStats.averageRating > 0 ? ratingsStats.averageRating : 'New Piece'}
          </span>
          <span className="text-xs text-[#20070e]/50 font-serif">
            ({ratingsStats.totalRatings} {ratingsStats.totalRatings === 1 ? 'rating' : 'ratings'})
          </span>
        </div>

        {/* Action Pills: Rate · Tip · Comments */}
        <div className="flex items-center gap-2">
          {/* Rate Button */}
          <button
            onClick={() => setActiveTab(prev => prev === 'rate' ? 'none' : 'rate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'rate' ? 'bg-[#20070e] text-[#FBF7EE]' : 'bg-white border border-[#20070e]/15 hover:border-[#c96a42] text-[#20070e]'}`}
          >
            <Star size={13} className={userRating > 0 ? 'fill-[#c96a42] text-[#c96a42]' : ''} />
            <span>{userRating > 0 ? `Your Rating: ${userRating}★` : 'Rate Piece'}</span>
          </button>

          {/* Tip Leaves Button */}
          <button
            onClick={() => setActiveTab(prev => prev === 'tip' ? 'none' : 'tip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'tip' ? 'bg-[#c96a42] text-[#120308]' : 'bg-[#c96a42]/10 hover:bg-[#c96a42]/20 text-[#c96a42] border border-[#c96a42]/20'}`}
          >
            <Gift size={13} />
            <span>Tip Leaves</span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setActiveTab(prev => prev === 'comments' ? 'none' : 'comments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'comments' ? 'bg-[#20070e] text-[#FBF7EE]' : 'bg-white border border-[#20070e]/15 text-[#20070e]'}`}
          >
            <MessageSquare size={13} />
            <span>Notes ({comments.length})</span>
          </button>
        </div>
      </div>

      {/* Top Consensus Tags Display (if any exist) */}
      {ratingsStats.topTags && ratingsStats.topTags.length > 0 && activeTab === 'none' && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#c96a42]">Reader Impressions:</span>
          {ratingsStats.topTags.map(({ tag, count }) => (
            <span key={tag} className="text-[10px] bg-white border border-[#20070e]/10 px-2 py-0.5 rounded-full text-[#20070e]/80 font-serif">
              {tag} <strong className="text-[#c96a42]">+{count}</strong>
            </span>
          ))}
        </div>
      )}

      {/* 2. Interactive Drawer Views */}
      <AnimatePresence mode="wait">
        
        {/* DRAWER: RATE THIS PIECE */}
        {activeTab === 'rate' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-2 overflow-hidden"
          >
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#20070e]/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#20070e]">
                  {isPoem ? 'Rate this Poem (1–5 Quills)' : 'Rate this Short Story (1–5 Quills)'}
                </span>
                <span className="text-[11px] text-[#c96a42] font-serif italic">
                  {userRating > 0 ? `Selected: ${userRating} Quills` : 'Select your score'}
                </span>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onMouseEnter={() => setHoverRating(score)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setUserRating(score);
                      handleRatingSubmit(score);
                    }}
                    className="p-1 text-[#c96a42] hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star 
                      size={24} 
                      className={(hoverRating || userRating) >= score ? 'fill-[#c96a42]' : 'text-[#20070e]/20'} 
                    />
                  </button>
                ))}
              </div>

              {/* Category-Specific Literary Tags */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/60 block">
                  Select {isPoem ? 'Poetic Elements' : 'Narrative Strengths'} (up to 4):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-serif transition-colors cursor-pointer ${isSelected ? 'bg-[#20070e] text-[#FBF7EE] border-[#20070e]' : 'bg-[#FAF5EE] text-[#20070e]/75 border-[#20070e]/10 hover:border-[#c96a42]'}`}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Reader Review Note */}
              <div className="pt-2 space-y-2">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Optional: What moment in this piece stayed with you?"
                  maxLength={500}
                  className="w-full bg-[#FAF5EE] border border-[#20070e]/15 rounded-xl p-2.5 text-xs text-[#20070e] placeholder-[#20070e]/30 focus:outline-none focus:border-[#c96a42] font-serif"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#20070e]/40 font-serif">
                    Your critique helps authors earn honors.
                  </span>
                  <button
                    onClick={() => handleRatingSubmit(userRating)}
                    disabled={submittingRating || !userRating}
                    className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] text-xs font-bold px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingRating ? 'Recording...' : 'Save Rating & Tags'}
                  </button>
                </div>
              </div>

              {ratingMessage && (
                <p className="text-xs font-bold text-[#c96a42] pt-1">
                  {ratingMessage}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* DRAWER: TIP LEAVES */}
        {activeTab === 'tip' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2 overflow-hidden"
          >
            <form onSubmit={handleTipSubmit} className="bg-white p-4 sm:p-5 rounded-xl border border-[#20070e]/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#20070e] block">
                    Tip Leaves to {authorName}
                  </span>
                  <span className="text-[11px] text-[#20070e]/60 font-serif">
                    Rewarding literary mastery directly from your Paper Leaves balance.
                  </span>
                </div>
                {currentUser && (
                  <span className="text-xs font-bold text-[#c96a42] bg-[#c96a42]/10 px-2.5 py-1 rounded-lg">
                    Balance: {currentUser.spendableLeaves || 0} 🍂
                  </span>
                )}
              </div>

              {/* Preset Leaf Options */}
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTipAmount(amt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${tipAmount === amt ? 'bg-[#c96a42] text-[#120308] border-[#c96a42] shadow-sm' : 'bg-[#FAF5EE] text-[#20070e] border-[#20070e]/15 hover:border-[#c96a42]'}`}
                  >
                    {amt} 🍂
                  </button>
                ))}
              </div>

              {/* Patron Note */}
              <input
                type="text"
                value={tipNote}
                onChange={(e) => setTipNote(e.target.value)}
                placeholder="Add a congratulatory patron note (optional)..."
                maxLength={200}
                className="w-full bg-[#FAF5EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs text-[#20070e] placeholder-[#20070e]/30 focus:outline-none focus:border-[#c96a42] font-serif"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#20070e]/50 font-serif">
                  Leaves transfer immediately to author's permanent archive ledger.
                </span>
                <button
                  type="submit"
                  disabled={submittingTip || !tipAmount}
                  className="bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308] text-xs font-bold uppercase tracking-wider px-5 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingTip ? <Loader2 size={13} className="animate-spin" /> : <Gift size={13} />}
                  <span>Send {tipAmount} Leaves</span>
                </button>
              </div>

              {tipMessage && <p className="text-xs font-bold text-[#25D366]">{tipMessage}</p>}
              {tipError && <p className="text-xs font-bold text-red-500">{tipError}</p>}
            </form>
          </motion.div>
        )}

        {/* DRAWER: READER NOTES / COMMENTS */}
        {activeTab === 'comments' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2 overflow-hidden"
          >
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#20070e]/10 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20070e] block">
                Reader Notes & Margins ({comments.length})
              </span>

              {/* Comments list */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-[#20070e]/50 font-serif italic py-2">
                    No notes left yet. Be the first reader to leave your margin thoughts.
                  </p>
                ) : (
                  comments.map((comment, idx) => (
                    <div key={comment.id || idx} className="bg-[#FAF5EE] p-3 rounded-xl border border-[#20070e]/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#20070e]">
                          {comment.displayName || 'Reader'}
                        </span>
                        {comment.userArchetype && (
                          <span className="text-[9px] font-mono text-[#c96a42] bg-[#c96a42]/10 px-1.5 rounded">
                            {comment.userArchetype}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#20070e]/85 font-serif leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Post note input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2 border-t border-[#20070e]/10">
                <input 
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a thoughtful note for the author..."
                  className="flex-1 bg-[#FAF5EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs text-[#20070e] placeholder-[#20070e]/30 focus:outline-none focus:border-[#c96a42] font-serif"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] px-4 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                >
                  {submittingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

