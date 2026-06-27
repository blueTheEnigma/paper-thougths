"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Star, BookOpen, MessageSquare, Loader2, 
  CheckCircle2, ShieldAlert, Sparkles, Clock, Coins 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PanguinAvatar from '@/components/PanguinAvatar';

export default function DiscussionClient({ generalBotm, abujaBotm, initialStream }) {
  const [activeStream, setActiveStream] = useState(initialStream || 'general');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fallbacks for BOTM books if DB is empty
  const fallbackGeneral = {
    id: 1,
    title: 'Skin of the Sea',
    author: 'Natasha Bowen',
    imageUrl: '/images/skin_of_the_sea.png',
    teaser: `A story of sirens, Yoruba gods, and a choice that could change the world. Natasha Bowen's debut is a breathtaking fantasy set in a world where history and mythology collide.`
  };

  const fallbackAbuja = {
    id: 2,
    title: 'The Parlour Wife',
    author: 'Foluso Agbaje',
    imageUrl: '/images/the_parlour_wife.png',
    teaser: `Set against the backdrop of colonial Nigeria, 'The Parlour Wife' is a gripping historical drama exploring duty, class, secrets, and a woman's defiance. Foluso Agbaje weaves a rich tapestry of domestic intrigue and social upheaval with breathtaking prose.`
  };

  const botmGeneral = generalBotm || fallbackGeneral;
  const botmAbuja = abujaBotm || fallbackAbuja;
  const activeBook = activeStream === 'general' ? botmGeneral : botmAbuja;

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  // Suggestions & Voting states
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [userVotedSuggestionId, setUserVotedSuggestionId] = useState(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [votingMonthYear, setVotingMonthYear] = useState('');
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestAuthor, setSuggestAuthor] = useState("");
  const [suggestTeaser, setSuggestTeaser] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [suggestSuccess, setSuggestSuccess] = useState(null);
  const [suggestError, setSuggestError] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);

  // Comments / Replies states (nested under reviews)
  const [expandedComments, setExpandedComments] = useState({}); // reviewId -> boolean
  const [comments, setComments] = useState({}); // reviewId -> Array
  const [commentsLoading, setCommentsLoading] = useState({}); // reviewId -> boolean
  const [commentInputs, setCommentInputs] = useState({}); // reviewId -> string
  const [submittingComment, setSubmittingComment] = useState({}); // reviewId -> boolean

  // Fetch current user profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch reviews for active book
  const fetchReviews = useCallback(async (bookId) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/book-of-the-month/reviews?bookId=${bookId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const isVotingPeriodActive = () => {
    return new Date().getDate() <= 3;
  };

  // Fetch suggestions for active stream and cycle
  const fetchSuggestions = useCallback(async () => {
    if (!activeBook?.id) return;
    setSuggestionsLoading(true);
    try {
      const chapterParam = activeBook.chapterId !== undefined && activeBook.chapterId !== null ? activeBook.chapterId : 'null';
      const endpoint = isVotingPeriodActive()
        ? `/api/book-of-the-month/votes?chapterId=${chapterParam}`
        : `/api/book-of-the-month/suggestions?chapterId=${chapterParam}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
        setUserVotedSuggestionId(data.userVotedSuggestionId || null);
        setIsVotingOpen(!!data.isVotingOpen);
        setVotingMonthYear(data.targetMonthYear || '');
      }
    } catch (err) {
      console.error("Failed to load suggestions/votes", err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [activeBook]);

  const handleSuggestBook = async (e) => {
    e.preventDefault();
    if (!profile || !activeBook?.id) return;
    setSubmittingSuggestion(true);
    setSuggestError(null);
    setSuggestSuccess(null);
    try {
      const res = await fetch('/api/book-of-the-month/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: activeBook.id,
          title: suggestTitle,
          author: suggestAuthor,
          teaser: suggestTeaser
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuggestSuccess(data.message);
        setSuggestTitle("");
        setSuggestAuthor("");
        setSuggestTeaser("");
        fetchSuggestions();
      } else {
        setSuggestError(data.error || 'Failed to submit suggestion.');
      }
    } catch (err) {
      console.error("Suggestion error:", err);
      setSuggestError("Connection error occurred.");
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const handleVote = async (suggestionId) => {
    if (!profile || submittingVote) return;
    setSubmittingVote(true);
    try {
      const res = await fetch('/api/book-of-the-month/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSuggestions();
      } else {
        alert(data.error || 'Failed to submit vote.');
      }
    } catch (err) {
      console.error("Voting error:", err);
      alert("Connection error occurred.");
    } finally {
      setSubmittingVote(false);
    }
  };

  useEffect(() => {
    if (activeBook?.id) {
      fetchReviews(activeBook.id);
      fetchSuggestions();
    }
  }, [activeBook, fetchReviews, fetchSuggestions]);

  // Submit review for BOTM
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch('/api/book-of-the-month/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: activeBook.id,
          rating,
          reviewText,
          isFinished
        })
      });
      const data = await res.json();
      if (data.success) {
        setReviewSuccess(data.message);
        setReviewText("");
        setIsFinished(false);
        setRating(5);
        fetchReviews(activeBook.id);
        fetchSuggestions();
        fetchProfile(); // refresh leaves counter in navbar / state

        // Award celebration
        confetti({
          particleCount: 150,
          spread: 85,
          origin: { y: 0.6 }
        });
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error("Review submission error:", err);
      setReviewError("An unexpected connection error occurred.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Toggle comments section and fetch comments
  const toggleComments = async (reviewId) => {
    const isExpanded = !expandedComments[reviewId];
    setExpandedComments(prev => ({ ...prev, [reviewId]: isExpanded }));

    if (isExpanded) {
      setCommentsLoading(prev => ({ ...prev, [reviewId]: true }));
      try {
        const res = await fetch(`/api/book-of-the-month/reviews/comments?reviewId=${reviewId}`);
        const data = await res.json();
        if (data.success) {
          setComments(prev => ({ ...prev, [reviewId]: data.comments || [] }));
        }
      } catch (err) {
        console.error("Failed to fetch replies:", err);
      } finally {
        setCommentsLoading(prev => ({ ...prev, [reviewId]: false }));
      }
    }
  };

  // Post comment reply
  const handleSubmitComment = async (e, reviewId) => {
    e.preventDefault();
    const commentText = commentInputs[reviewId]?.trim();
    if (!commentText) return;

    setSubmittingComment(prev => ({ ...prev, [reviewId]: true }));

    try {
      const res = await fetch('/api/book-of-the-month/reviews/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          commentText
        })
      });
      const data = await res.json();
      if (data.success) {
        setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
        // Refresh comments list
        const commRes = await fetch(`/api/book-of-the-month/reviews/comments?reviewId=${reviewId}`);
        const commData = await commRes.json();
        if (commData.success) {
          setComments(prev => ({ ...prev, [reviewId]: commData.comments || [] }));
        }
      } else {
        alert(data.error || 'Failed to post reply.');
      }
    } catch (err) {
      console.error("Reply submission error:", err);
      alert("A connection error occurred while posting your reply.");
    } finally {
      setSubmittingComment(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-cream text-ink pb-16 pt-24 px-4 sm:px-6 md:px-8 font-sans selection:bg-accent/20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Link & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-sage/10 pb-6 gap-4">
          <div>
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy hover:text-ink transition-colors uppercase tracking-wider mb-2 group"
            >
              <ArrowLeft size={12} className="transform group-hover:-translate-x-0.5 transition-transform" />
              Back to Archive
            </Link>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-burgundy">Book of the Month Discussions</h1>
            <p className="text-xs sm:text-sm text-ink/60 font-serif mt-1">
              Read community critiques, share your reviews, and debate themes under each stream.
            </p>
          </div>

          {/* Bi-Token Balance indicators */}
          {profile && (
            <div className="flex gap-4 items-center bg-white/60 p-3 rounded-2xl border border-sage/15 shadow-sm self-start sm:self-center">
              <div className="text-center px-1">
                <span className="text-[9px] font-bold text-ink/40 uppercase tracking-wider block">Spendable Leaves</span>
                <span className="text-sm font-bold text-burgundy flex items-center justify-center gap-1 font-serif mt-0.5">
                  {profile.spendableLeaves} 🍃
                </span>
              </div>
              <div className="h-6 w-px bg-sage/20" />
              <div className="text-center px-1">
                <span className="text-[9px] font-bold text-ink/40 uppercase tracking-wider block">Tokens Progress</span>
                <span className="text-sm font-bold text-accent flex items-center justify-center gap-1 font-serif mt-0.5">
                  <Coins size={12} className="text-burgundy" /> {parseFloat(profile.milestoneTokens || 0).toFixed(1)} / 10
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toggleable Edition Stream Selector */}
        <div className="flex justify-center">
          <div className="bg-[#FAF6F0] p-1 rounded-2xl border border-sage/15 flex shadow-inner gap-1">
            <button
              onClick={() => setActiveStream('general')}
              className={`px-6 py-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeStream === 'general'
                  ? 'bg-burgundy text-cream shadow-md'
                  : 'text-ink/60 hover:text-ink hover:bg-white/40'
              }`}
            >
              <span>General Edition</span>
              <span>🌍</span>
            </button>
            <button
              onClick={() => setActiveStream('abuja')}
              className={`px-6 py-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeStream === 'abuja'
                  ? 'bg-burgundy text-cream shadow-md'
                  : 'text-ink/60 hover:text-ink hover:bg-white/40'
              }`}
            >
              <span>Abuja Edition</span>
              <span>📍</span>
            </button>
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Book details, Bookie badge, submission form (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Book Detail Card */}
            <div className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-sage/20 shadow-sm space-y-6">
              
              {/* Cover & Info Flex */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="w-36 aspect-[2/3] overflow-hidden bg-cream shadow-md rounded-xl border border-ink/5 flex-shrink-0">
                  <img 
                    src={activeBook.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                    alt={activeBook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <span className="bg-burgundy/10 text-burgundy border border-burgundy/20 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
                    {activeStream === 'general' ? '🌍 General Stream' : '📍 Abuja Chapter'}
                  </span>
                  <h2 className="text-2xl font-display font-bold text-ink leading-tight">{activeBook.title}</h2>
                  <p className="text-xs text-burgundy font-sans italic">— by {activeBook.author}</p>
                </div>
              </div>

              {/* Book Teaser Description */}
              <div className="border-t border-sage/10 pt-4">
                <h4 className="text-[10px] font-sans font-bold text-accent uppercase tracking-wider mb-2">Book Teaser</h4>
                <p className="text-xs sm:text-sm text-ink/70 font-serif leading-relaxed whitespace-pre-wrap">
                  {activeBook.teaser}
                </p>
              </div>

              {/* Bookie badge */}
              <div className="bg-white border border-sage/15 rounded-2xl p-4 text-center sm:text-left">
                <h5 className="text-[10px] font-sans font-bold text-accent uppercase tracking-widest mb-2">Bookie of the Month</h5>
                {reviews.some(r => r.isBookie) ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="bg-primary/20 text-burgundy text-xs font-sans font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start">
                      🏆 {reviews.find(r => r.isBookie)?.reviewerName}
                    </span>
                    <p className="text-[10px] text-ink/50 font-serif italic">
                      Earned Bookie title & +50 leaves bonus!
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="bg-sage/10 text-ink/50 text-[10px] font-sans font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                      Crown is up for grabs!
                    </span>
                    <p className="text-[10px] text-ink/50 font-serif italic mt-2 leading-relaxed">
                      Be the first to finish reading this book and submit your review to earn the 🏆 Bookie title and **+50 Leaves bonus**!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submission form Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/20 shadow-sm space-y-4">
              {!profile ? (
                <div className="bg-cream/40 p-6 rounded-2xl text-center border border-sage/15 space-y-3">
                  <p className="text-xs sm:text-sm text-ink/70 font-serif">
                    You must be signed in to submit a Book of the Month review and earn rewards.
                  </p>
                  <Link
                    href="/sign-in?redirect_url=/discussion"
                    className="bg-burgundy text-cream text-[10px] font-sans font-bold uppercase tracking-widest px-6 py-3 rounded-xl inline-block hover:bg-ink hover:text-white transition-colors cursor-pointer"
                  >
                    Sign In
                  </Link>
                </div>
              ) : reviews.some(r => r.reviewerName === profile.name) ? (
                <div className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-2xl flex items-start gap-2.5 text-emerald-800">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-sans font-bold block uppercase tracking-wider">Review Submitted</span>
                    <p className="text-[11px] text-emerald-700/80 font-serif leading-relaxed">
                      You've submitted your review for this Book of the Month! Your leaves and token rewards have been successfully credited to your ledger.
                    </p>
                  </div>
                </div>
              ) : activeBook.chapterId === 3 && profile.chapter !== 'Abuja' ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-2.5 text-amber-800">
                  <ShieldAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-sans font-bold block uppercase tracking-wider">Stream Restricted</span>
                    <p className="text-[11px] text-amber-700/80 font-serif leading-relaxed">
                      The Abuja Book of the Month stream is restricted. Only active members of the Abuja chapter can submit reviews for this selection.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <h3 className="text-lg font-display font-bold text-burgundy">Submit Your Review</h3>
                  <p className="text-[10px] text-ink/50 font-serif leading-relaxed">
                    Write a review to earn **+10 Leaves** and **+1.0 Milestone Token**. If you are the first to finish, you get crowned Bookie and get **+50 Leaves**!
                  </p>
                  
                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-600 text-xs font-sans font-semibold">
                      {reviewError}
                    </div>
                  )}
                  
                  {reviewSuccess && (
                    <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-xl text-emerald-700 text-xs font-sans font-semibold">
                      {reviewSuccess}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-sans font-bold text-ink/75 uppercase tracking-wide">Rating:</span>
                    <div className="flex gap-1 text-accent">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="hover:scale-120 transition-transform cursor-pointer"
                        >
                          <Star
                            size={16}
                            className={star <= rating ? 'fill-accent stroke-accent' : 'stroke-accent'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      required
                      rows={4}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your thoughts on the narrative pacing, tropes, character defiances, and general impressions..."
                      className="w-full bg-cream/40 border border-sage/20 rounded-2xl p-4 text-xs font-serif focus:outline-none focus:border-burgundy text-ink placeholder-ink/35 transition-all resize-none font-medium"
                    />
                  </div>

                  {/* Finished checkbox and submit */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <label className="flex items-center gap-2 text-xs font-sans font-medium text-ink/75 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFinished}
                        onChange={(e) => setIsFinished(e.target.checked)}
                        className="rounded border-sage/35 text-burgundy focus:ring-burgundy"
                      />
                      <span>I have finished reading this book</span>
                    </label>
                    
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-burgundy hover:bg-ink text-cream hover:text-white px-6 py-3 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Review</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Book of the Month Suggestions / Voting Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/20 shadow-sm space-y-4">
              {isVotingOpen ? (
                <div className="space-y-4">
                  <div className="border-b border-sage/10 pb-3">
                    <h3 className="text-lg font-display font-bold text-burgundy flex items-center gap-1.5">
                      <span>🗳️ Vote for Next BOTM</span>
                    </h3>
                    <p className="text-[10px] text-ink/50 font-serif leading-relaxed mt-1">
                      Voting is open for the first 3 days of the month. Choose the {votingMonthYear} selection!
                    </p>
                  </div>

                  {!profile ? (
                    <div className="bg-cream/40 p-4 rounded-xl text-center border border-sage/15">
                      <p className="text-[11px] text-ink/75 font-serif mb-2">
                        You must be signed in to cast your vote.
                      </p>
                      <Link
                        href="/sign-in?redirect_url=/discussion"
                        className="bg-burgundy text-cream text-[9px] font-sans font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg inline-block hover:bg-ink hover:text-white transition-colors cursor-pointer"
                      >
                        Sign In
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestionsLoading ? (
                        <div className="flex items-center justify-center py-4 text-xs font-bold text-ink/40">
                          <Loader2 size={14} className="animate-spin mr-2" /> Loading candidates...
                        </div>
                      ) : suggestions.length === 0 ? (
                        <p className="text-xs text-ink/50 font-serif italic text-center py-4">
                          No suggestions submitted in the previous cycle.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {suggestions.map((sug) => {
                            const hasVotedThis = userVotedSuggestionId === sug.id;
                            const hasVotedAny = userVotedSuggestionId !== null;
                            return (
                              <div key={sug.id} className={`p-4 rounded-2xl border transition-all ${
                                hasVotedThis ? 'bg-primary/5 border-primary/25 shadow-inner' : 'bg-cream/10 border-sage/15'
                              }`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-1 flex-1">
                                    <h4 className="font-sans font-bold text-xs text-ink leading-tight">{sug.title}</h4>
                                    <p className="text-[10px] text-burgundy font-sans italic">by {sug.author}</p>
                                    <p className="text-[10px] text-ink/65 font-serif line-clamp-2 mt-1">{sug.teaser}</p>
                                    <div className="text-[9px] text-ink/40 font-sans mt-1">
                                      Suggested by {sug.suggestedBy}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold text-burgundy bg-burgundy/5 px-2 py-0.5 rounded border border-burgundy/10 shrink-0">
                                      {sug.votesCount} {sug.votesCount === 1 ? 'vote' : 'votes'}
                                    </span>
                                    {hasVotedThis ? (
                                      <span className="bg-emerald-500 text-cream font-bold text-[8px] px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                                        My Pick ✓
                                      </span>
                                    ) : (
                                      <button
                                        disabled={hasVotedAny || submittingVote}
                                        onClick={() => handleVote(sug.id)}
                                        className="bg-burgundy hover:bg-ink text-cream disabled:opacity-50 text-[8px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors cursor-pointer"
                                      >
                                        Vote
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-sage/10 pb-3">
                    <h3 className="text-lg font-display font-bold text-burgundy flex items-center gap-1.5">
                      <span>💡 Suggest Next Book</span>
                    </h3>
                    <p className="text-[10px] text-ink/50 font-serif leading-relaxed mt-1">
                      Submit your candidate for the next monthly showcase! Only active reviewers can suggest a book.
                    </p>
                  </div>

                  {!profile ? (
                    <div className="bg-cream/40 p-4 rounded-xl text-center border border-sage/15">
                      <p className="text-[11px] text-ink/75 font-serif mb-2">
                        You must be signed in to suggest a book.
                      </p>
                      <Link
                        href="/sign-in?redirect_url=/discussion"
                        className="bg-burgundy text-cream text-[9px] font-sans font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg inline-block hover:bg-ink hover:text-white transition-colors cursor-pointer"
                      >
                        Sign In
                      </Link>
                    </div>
                  ) : !reviews.some(r => r.reviewerName === profile.name) ? (
                    <div className="bg-[#FAF6F0] p-4 rounded-xl text-center border border-sage/15">
                      <p className="text-xs text-ink/60 font-serif leading-relaxed">
                        You have not reviewed this Book of the Month yet. Submit your critique above to unlock candidate suggestions.
                      </p>
                    </div>
                  ) : suggestions.some(sug => sug.suggestedBy === profile.name) ? (
                    <div className="bg-emerald-55 border border-emerald-200/50 p-4 rounded-2xl flex items-start gap-2.5 text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-sans font-bold block uppercase tracking-wider">Candidate Suggested</span>
                        <p className="text-[11px] text-emerald-700/80 font-serif leading-relaxed">
                          You have successfully submitted your book suggestion. Voting for next month's selection starts on the first day of the month!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSuggestBook} className="space-y-3">
                      {suggestError && (
                        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-red-650 text-xs font-sans font-semibold">
                          {suggestError}
                        </div>
                      )}
                      {suggestSuccess && (
                        <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-xl text-emerald-750 text-xs font-sans font-semibold">
                          {suggestSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-ink/40">Book Title</label>
                          <input
                            type="text"
                            required
                            value={suggestTitle}
                            onChange={(e) => setSuggestTitle(e.target.value)}
                            placeholder="e.g. Skin of the Sea"
                            className="w-full bg-cream/40 border border-sage/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy text-ink font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-ink/40">Author</label>
                          <input
                            type="text"
                            required
                            value={suggestAuthor}
                            onChange={(e) => setSuggestAuthor(e.target.value)}
                            placeholder="e.g. Natasha Bowen"
                            className="w-full bg-cream/40 border border-sage/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy text-ink font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-ink/40">Teaser / Description</label>
                        <textarea
                          required
                          rows={3}
                          value={suggestTeaser}
                          onChange={(e) => setSuggestTeaser(e.target.value)}
                          placeholder="Brief description explaining why the clubhouse should read this book next..."
                          className="w-full bg-cream/40 border border-sage/20 rounded-xl p-3 text-xs focus:outline-none focus:border-burgundy text-ink resize-none leading-relaxed font-serif"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingSuggestion}
                        className="w-full bg-burgundy hover:bg-ink text-cream hover:text-white py-2.5 rounded-xl text-[9px] font-sans font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {submittingSuggestion ? (
                          <>
                            <Loader2 size={11} className="animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit Suggestion</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Reviews & Nested Comments Feed (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-xl font-display font-bold text-burgundy border-b border-sage/10 pb-2">
              Reviews & Critique Feed ({reviews.length})
            </h3>

            {reviewsLoading ? (
              <div className="text-center py-16 text-ink/40">
                <Loader2 className="animate-spin mx-auto mb-3" size={32} />
                <span className="text-xs font-bold uppercase tracking-wider font-sans">Loading book reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-[#FAF6F0] rounded-3xl p-12 text-center border border-sage/15 text-ink/40">
                <BookOpen className="opacity-30 mx-auto mb-3" size={40} />
                <p className="text-sm font-serif italic">No reviews submitted yet for this book. Start the discussion!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => {
                  const isExpanded = !!expandedComments[rev.id];
                  const reviewReplies = comments[rev.id] || [];
                  const isReplyLoading = !!commentsLoading[rev.id];
                  const isRepSubmitting = !!submittingComment[rev.id];
                  const replyText = commentInputs[rev.id] || "";

                  return (
                    <div
                      key={rev.id}
                      className={`p-6 rounded-3xl border transition-all shadow-sm ${
                        rev.isBookie ? 'bg-primary/5 border-primary/20' : 'bg-white border-sage/12'
                      }`}
                    >
                      {/* Review Card Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <PanguinAvatar lifetimeLeaves={rev.lifetimeLeaves || 0} avatarUrl={rev.avatarUrl} variant="compact" />
                          <div>
                            <span className="font-sans font-bold text-sm text-ink block">{rev.reviewerName}</span>
                            <span className="text-[10px] font-sans font-semibold text-ink/45 uppercase tracking-wider">
                              {rev.chapterName || 'Other Chapter'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex gap-0.5 text-accent">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < rev.rating ? 'fill-accent stroke-accent' : 'stroke-accent'}
                              />
                            ))}
                          </div>
                          <div className="flex gap-1">
                            {rev.isFinished && (
                              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[8px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                Finished
                              </span>
                            )}
                            {rev.isBookie && (
                              <span className="bg-primary/25 text-burgundy border border-primary/35 text-[8px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                🏆 Bookie
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="text-xs sm:text-sm text-ink/80 font-serif leading-relaxed whitespace-pre-wrap italic pl-2 border-l-2 border-sage/10 mb-4">
                        "{rev.reviewText}"
                      </p>

                      {/* Toggle Comments Trigger */}
                      <div className="flex justify-between items-center border-t border-sage/10 pt-3">
                        <button
                          onClick={() => toggleComments(rev.id)}
                          className="text-xs font-sans font-bold text-burgundy hover:text-ink transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          {isExpanded ? 'Hide Replies' : 'Replies & Discussion'}
                        </button>
                        <span className="text-[9px] font-mono text-ink/35">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Nested Replies Drawer */}
                      {isExpanded && (
                        <div className="mt-4 border-t border-sage/10 pt-4 pl-4 sm:pl-6 space-y-4 bg-cream/10 rounded-2xl">
                          
                          {/* Replies Feed */}
                          <div className="space-y-3">
                            {isReplyLoading ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-ink/40 py-2">
                                <Loader2 size={12} className="animate-spin" />
                                <span>Loading replies...</span>
                              </div>
                            ) : reviewReplies.length === 0 ? (
                              <p className="text-[11px] text-ink/40 font-serif italic py-1">
                                No replies yet. Start the debate on this review!
                              </p>
                            ) : (
                              <div className="space-y-3 border-l border-sage/20 pl-3">
                                {reviewReplies.map((reply) => (
                                  <div key={reply.id} className="text-xs bg-[#FAF6F0] p-3 rounded-2xl border border-sage/10 shadow-sm space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="font-sans font-bold text-ink">{reply.userName}</span>
                                      <span className="text-[9px] font-sans font-semibold text-ink/40 uppercase tracking-wider">
                                        {reply.chapterName || 'Other'}
                                      </span>
                                    </div>
                                    <p className="font-serif text-ink/80 leading-relaxed">
                                      {reply.commentText}
                                    </p>
                                    <div className="text-[8px] font-mono text-ink/30 text-right">
                                      {new Date(reply.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Write Reply Form */}
                          <div className="border-t border-sage/10 pt-3">
                            {!profile ? (
                              <p className="text-[10px] text-ink/50 font-serif italic">
                                You must be signed in to post a reply.
                              </p>
                            ) : (
                              <form 
                                onSubmit={(e) => handleSubmitComment(e, rev.id)}
                                className="flex gap-2 items-stretch"
                              >
                                <input
                                  required
                                  type="text"
                                  placeholder="Post a reply..."
                                  value={replyText}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                  className="flex-1 bg-[#FAF6F0] border border-sage/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy text-ink placeholder-ink/35 font-medium"
                                />
                                <button
                                  type="submit"
                                  disabled={isRepSubmitting || !replyText.trim()}
                                  className="bg-burgundy hover:bg-ink text-cream hover:text-white px-4 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                                >
                                  {isRepSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Reply'}
                                </button>
                              </form>
                            )}
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
