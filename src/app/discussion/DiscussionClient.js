"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Star, BookOpen, MessageSquare, Loader2, 
  CheckCircle2, ShieldAlert, Sparkles, Clock, Coins 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PanguinAvatar from '@/components/PanguinAvatar';

export default function DiscussionClient({ activeBook: propActiveBook, generalBotm, abujaBotm }) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fallback for unified BOTM book if DB is empty
  const fallbackBook = {
    id: 17,
    title: 'Red Rising',
    author: 'Pierce Brown',
    imageUrl: '/images/red_rising.jpg',
    teaser: `“I would have lived in peace, but my enemies brought me war.”\n\nDarrow is a Red, a member of the lowest caste in the color-coded society of the future. Like his fellow Reds, he works all day beneath the surface of Mars, believing that his labor will one day make the planet livable for future generations.\n\nYet he spends his life willingly, knowing that his sacrifice will buy a better world for his children. But Darrow has been betrayed. Soon he discovers that humanity reached the surface generations ago—where vast cities and sprawling parks flourish under the rule of the decadent Gold caste.\n\nFueled by grief and a burning desire for justice, Darrow sacrifices everything to infiltrate the legendary Institute, a brutal proving ground where the dominant caste’s best and brightest vie for power. He will be forced to compete for his life and the very future of civilization among the best of his enemies… and he will stop at nothing to bring down his oppressors from within.`
  };

  const activeBook = propActiveBook || generalBotm || fallbackBook;

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
  const [hasReviewedPastBotm, setHasReviewedPastBotm] = useState(false);
  const [qualifyingBotm, setQualifyingBotm] = useState(null);
  const [botmTab, setBotmTab] = useState('ballot'); // 'ballot' | 'suggest'

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

  // Fetch suggestions for unified sanctuary stream and cycle
  const fetchSuggestions = useCallback(async () => {
    if (!activeBook?.id) return;
    setSuggestionsLoading(true);
    try {
      const endpoint = `/api/book-of-the-month/votes?chapterId=null`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
        setUserVotedSuggestionId(data.userVotedSuggestionId || null);
        setIsVotingOpen(!!data.isVotingOpen);
        setVotingMonthYear(data.targetMonthYear || '');
        setHasReviewedPastBotm(Boolean(data.hasReviewedPastBotm));
        setQualifyingBotm(data.qualifyingBotm || null);
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
        await fetchSuggestions();
        setBotmTab('ballot');
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
        setUserVotedSuggestionId(suggestionId);
        await fetchSuggestions();
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
              Read community critiques, share your reviews, and debate themes across our unified sanctuary reading circle.
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

        {/* Unified Sanctuary Flame Ribbon */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#20070e] via-[#330A17] to-[#20070e] border border-[#c96a42]/40 shadow-sm text-xs font-serif text-[#FBF7EE]">
            <span className="text-amber-400 text-sm">🔥</span>
            <span className="font-bold tracking-wide">Unified Sanctuary Reading Lounge</span>
            <span className="text-[#F2A98A]/60 hidden sm:inline">•</span>
            <span className="text-[#F2A98A] text-[11px] hidden sm:inline">All Chapters United (Zaria, Kaduna, Abuja)</span>
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Book details, Bookie badge, submission form (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Book Detail Card */}
            <div className="bg-[#FAF6F0] rounded-3xl p-5 sm:p-8 border border-sage/20 shadow-sm space-y-6">
              
              {/* Cover & Info Flex */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="w-36 sm:w-40 aspect-[2/3] overflow-hidden bg-black shadow-xl rounded-2xl border border-[#c96a42]/30 flex-shrink-0 relative group">
                  <img 
                    src={activeBook.imageUrl || '/images/red_rising.jpg'} 
                    alt={activeBook.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/red_rising.jpg';
                    }}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="bg-burgundy/10 text-burgundy border border-burgundy/20 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block">
                    🔥 Sanctuary Book of the Month
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink leading-tight">{activeBook.title}</h2>
                  <p className="text-xs sm:text-sm text-burgundy font-sans italic">— by {activeBook.author}</p>
                  <p className="text-[10px] text-ink/50 font-mono tracking-wide">Red Rising Saga • Book 1</p>
                </div>
              </div>

              {/* Book Teaser Description */}
              <div className="border-t border-sage/10 pt-4 space-y-2">
                <h4 className="text-[10px] font-sans font-bold text-accent uppercase tracking-wider">Book Synopsis & Themes</h4>
                <div className="text-xs sm:text-sm text-ink/70 font-serif leading-relaxed whitespace-pre-wrap">
                  {activeBook.teaser}
                </div>
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/20 shadow-sm space-y-5">
              <div className="border-b border-sage/10 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#c96a42]">
                    {votingMonthYear || 'Next Cycle'} Selection
                  </span>
                  {suggestions.length > 0 && (
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-burgundy/10 text-burgundy px-2.5 py-0.5 rounded-full border border-burgundy/15">
                      {suggestions.length} {suggestions.length === 1 ? 'Nominee' : 'Nominees'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-display font-extrabold text-burgundy leading-snug">
                  Elect Next Book of the Month
                </h3>
                <p className="text-xs text-ink/60 font-serif leading-relaxed mt-1">
                  Every voice shapes our reading sanctuary. Reviewers of &ldquo;{qualifyingBotm?.title || activeBook?.title}&rdquo; nominate candidates and vote for the next collective journey.
                </p>

                {/* Segmented Tab Control */}
                <div className="flex bg-cream/50 p-1 rounded-2xl border border-sage/15 mt-4">
                  <button
                    type="button"
                    onClick={() => setBotmTab('ballot')}
                    className={`flex-1 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      botmTab === 'ballot'
                        ? 'bg-burgundy text-cream shadow-sm'
                        : 'text-ink/50 hover:text-ink'
                    }`}
                  >
                    <span>🗳️ Ballot</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans ${
                      botmTab === 'ballot' ? 'bg-white/20 text-cream' : 'bg-black/5 text-ink/60'
                    }`}>
                      {suggestions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBotmTab('suggest')}
                    className={`flex-1 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      botmTab === 'suggest'
                        ? 'bg-burgundy text-cream shadow-sm'
                        : 'text-ink/50 hover:text-ink'
                    }`}
                  >
                    <span>💡 Nominate a Book</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Candidate Ballot */}
              {botmTab === 'ballot' && (
                <div className="space-y-4">
                  {!profile ? (
                    <div className="bg-cream/40 p-5 rounded-2xl text-center border border-sage/15">
                      <p className="text-xs text-ink/75 font-serif mb-3">
                        Sign in to view candidate books and cast your vote for the next cycle.
                      </p>
                      <Link
                        href="/sign-in?redirect_url=/discussion"
                        className="bg-burgundy text-cream text-[10px] font-sans font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl inline-block hover:bg-ink hover:text-white transition-colors cursor-pointer shadow-sm"
                      >
                        Sign In to Vote
                      </Link>
                    </div>
                  ) : !hasReviewedPastBotm ? (
                    <div className="bg-[#FAF7F0] border border-[#c96a42]/30 p-5 rounded-2xl text-center space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#c96a42]/15 text-[#c96a42] flex items-center justify-center mx-auto text-base">
                        🔒
                      </div>
                      <h4 className="font-display text-sm font-bold text-burgundy">Merit Ballot Locked</h4>
                      <p className="text-xs text-ink/75 font-serif leading-relaxed max-w-sm mx-auto">
                        To cast your vote for next month&apos;s Book of the Month, submit your review for <strong>&ldquo;{qualifyingBotm?.title || activeBook?.title || 'the current Book of the Month'}&rdquo;</strong> above first.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c96a42] hover:bg-[#b05832] text-cream text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <span>Review &ldquo;{qualifyingBotm?.title || activeBook?.title}&rdquo; to Unlock Ballot ✍️</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestionsLoading ? (
                        <div className="flex items-center justify-center py-6 text-xs font-bold text-ink/40">
                          <Loader2 size={16} className="animate-spin mr-2 text-burgundy" /> Loading candidate books...
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="p-6 bg-cream/30 border border-dashed border-sage/30 rounded-2xl text-center space-y-3">
                          <p className="text-xs text-ink/60 font-serif italic">
                            No candidate books have been nominated yet for {votingMonthYear || 'next month'}.
                          </p>
                          <button
                            type="button"
                            onClick={() => setBotmTab('suggest')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy hover:bg-ink text-cream text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                          >
                            <span>💡 Be the First to Nominate a Book</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {suggestions.map((sug) => {
                            const hasVotedThis = userVotedSuggestionId === sug.id;
                            const hasVotedAny = userVotedSuggestionId !== null;
                            return (
                              <div 
                                key={sug.id} 
                                className={`p-4 rounded-2xl border transition-all ${
                                  hasVotedThis 
                                    ? 'bg-emerald-50/60 border-emerald-300 shadow-sm ring-1 ring-emerald-300' 
                                    : 'bg-[#FBF7EE]/80 border-sage/20 hover:border-burgundy/30'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-display font-extrabold text-sm text-burgundy leading-tight">
                                        &ldquo;{sug.title}&rdquo;
                                      </h4>
                                      <span className="text-[11px] text-[#c96a42] font-serif italic">
                                        by {sug.author}
                                      </span>
                                    </div>
                                    <p className="text-xs text-ink/75 font-serif line-clamp-3 leading-relaxed">
                                      {sug.teaser}
                                    </p>
                                    <div className="text-[10px] text-ink/45 font-sans pt-1">
                                      Nominated by <span className="font-semibold text-ink/70">{sug.suggestedBy}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className="text-[11px] font-display font-bold text-burgundy bg-burgundy/10 px-2.5 py-1 rounded-xl border border-burgundy/15">
                                      {sug.votesCount || 0} {sug.votesCount === 1 ? 'vote' : 'votes'}
                                    </span>
                                    {hasVotedThis ? (
                                      <span className="bg-emerald-600 text-cream font-bold text-[9px] px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <CheckCircle2 size={12} /> My Pick ✓
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={hasVotedAny || submittingVote}
                                        onClick={() => handleVote(sug.id)}
                                        className="bg-burgundy hover:bg-ink text-cream disabled:opacity-40 text-[9px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                      >
                                        {submittingVote ? 'Voting...' : 'Vote'}
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
              )}

              {/* Tab 2: Nominate a Candidate */}
              {botmTab === 'suggest' && (
                <div className="space-y-4">
                  {!profile ? (
                    <div className="bg-cream/40 p-5 rounded-2xl text-center border border-sage/15">
                      <p className="text-xs text-ink/75 font-serif mb-3">
                        Sign in to nominate a book for the next Book of the Month cycle.
                      </p>
                      <Link
                        href="/sign-in?redirect_url=/discussion"
                        className="bg-burgundy text-cream text-[10px] font-sans font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl inline-block hover:bg-ink hover:text-white transition-colors cursor-pointer shadow-sm"
                      >
                        Sign In
                      </Link>
                    </div>
                  ) : !hasReviewedPastBotm ? (
                    <div className="bg-[#FAF7F0] border border-[#c96a42]/30 p-5 rounded-2xl text-center space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#c96a42]/15 text-[#c96a42] flex items-center justify-center mx-auto text-base">
                        🔒
                      </div>
                      <h4 className="font-display text-sm font-bold text-burgundy">Nominations Locked</h4>
                      <p className="text-xs text-ink/75 font-serif leading-relaxed max-w-sm mx-auto">
                        Only active reviewers can nominate candidate books. Submit your review for <strong>&ldquo;{qualifyingBotm?.title || activeBook?.title || 'the current Book of the Month'}&rdquo;</strong> above to unlock.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c96a42] hover:bg-[#b05832] text-cream text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <span>Review &ldquo;{qualifyingBotm?.title || activeBook?.title}&rdquo; to Unlock ✍️</span>
                      </button>
                    </div>
                  ) : suggestions.some(sug => (profile.id && sug.userId === profile.id) || sug.suggestedBy === profile.name || sug.suggestedBy === profile.fullName) ? (
                    (() => {
                      const mySug = suggestions.find(sug => (profile.id && sug.userId === profile.id) || sug.suggestedBy === profile.name || sug.suggestedBy === profile.fullName);
                      return (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                            <span className="text-xs font-sans font-bold uppercase tracking-wider">Candidate Nominated</span>
                          </div>
                          {mySug && (
                            <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200 space-y-1">
                              <p className="font-display font-bold text-sm text-burgundy">&ldquo;{mySug.title}&rdquo; <span className="text-xs font-serif text-[#c96a42] italic">by {mySug.author}</span></p>
                              <p className="text-xs text-ink/70 font-serif line-clamp-2">{mySug.teaser}</p>
                              <div className="text-[10px] text-ink/50 pt-1 font-sans">
                                Current votes: <strong>{mySug.votesCount || 0}</strong>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-emerald-900/80 font-serif leading-relaxed">
                            You have submitted your candidate for {votingMonthYear || 'the next cycle'}. You can now view the ballot and cast your vote!
                          </p>
                          <button
                            type="button"
                            onClick={() => setBotmTab('ballot')}
                            className="w-full py-2.5 bg-burgundy hover:bg-ink text-cream text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                          >
                            <span>View Ballot & Cast Your Vote ({suggestions.length} {suggestions.length === 1 ? 'Nominee' : 'Nominees'}) →</span>
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <form onSubmit={handleSuggestBook} className="space-y-3.5">
                      {suggestError && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-700 text-xs font-sans font-semibold">
                          {suggestError}
                        </div>
                      )}
                      {suggestSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-xs font-sans font-semibold">
                          {suggestSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Book Title</label>
                          <input
                            type="text"
                            required
                            value={suggestTitle}
                            onChange={(e) => setSuggestTitle(e.target.value)}
                            placeholder="e.g. Skin of the Sea"
                            className="w-full bg-cream/40 border border-sage/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-burgundy text-ink font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Author</label>
                          <input
                            type="text"
                            required
                            value={suggestAuthor}
                            onChange={(e) => setSuggestAuthor(e.target.value)}
                            placeholder="e.g. Natasha Bowen"
                            className="w-full bg-cream/40 border border-sage/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-burgundy text-ink font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Teaser / Pitch</label>
                        <textarea
                          required
                          rows={3}
                          value={suggestTeaser}
                          onChange={(e) => setSuggestTeaser(e.target.value)}
                          placeholder="Share an evocative excerpt or why our community should read this next..."
                          className="w-full bg-cream/40 border border-sage/20 rounded-xl p-3.5 text-xs focus:outline-none focus:border-burgundy text-ink resize-none leading-relaxed font-serif"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingSuggestion}
                        className="w-full bg-burgundy hover:bg-ink text-cream hover:text-white py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {submittingSuggestion ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Submitting Nomination...</span>
                          </>
                        ) : (
                          <span>Submit Nomination</span>
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
                          <PanguinAvatar lifetimeLeaves={rev.lifetimeLeaves || 0} avatarUrl={rev.avatarUrl} variant="compact" archetype={rev.archetype} />
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
