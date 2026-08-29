"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, MessageSquare, Send, Compass, 
  ChevronRight, Award, Feather, Heart, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

export default function LiteraryReaderModal({
  isOpen,
  onClose,
  piece,
  currentUser = null,
  isLiked = false,
  likeCount = 0,
  onToggleLike = null,
  onDownloadCard = null,
  comments = null,
  loadingComments = false,
  onPostComment = null
}) {
  const [mounted, setMounted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPenName, setCommentPenName] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock Body Scroll cleanly when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !piece) return null;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!onPostComment || !commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      await onPostComment({ content: commentText.trim(), penName: commentPenName.trim() });
      setCommentText('');
    } catch (err) {
      setCommentError(err.message || 'Failed to post note.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const authorDisplayName = piece.displayName || piece.penName || piece.pen_name || piece.authorFullName || piece.authorName || 'Paper Thoughts Writer';

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        
        {/* Ambient Dark Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-[#0c0205]/80 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />

        {/* Sensory Parchment Folio / Mobile Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-2xl lg:max-w-3xl bg-[#FAF7F0] border-t sm:border border-[#EADFC9] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[86vh] text-ink z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Grab Handle */}
          <div className="w-12 h-1 bg-ink/20 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

          {/* Sticky Header Bar */}
          <div className="px-5 sm:px-7 py-3.5 border-b border-[#EADFC9]/80 flex items-center justify-between bg-white/70 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-burgundy/10 text-burgundy text-[8px] sm:text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-burgundy/15 uppercase tracking-widest">
                {piece.genre || 'Literature'}
              </span>
              {piece.hasLaurel && (
                <span className="bg-accent/15 text-accent text-[8px] sm:text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-accent/25 uppercase tracking-widest flex items-center gap-1">
                  <Award size={11} /> Laureate
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 text-ink/60 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close reader"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Parchment Reader Body */}
          <div className="p-5 sm:p-8 md:p-10 overflow-y-auto paper-scrollbar space-y-6 sm:space-y-7 text-center">
            
            {/* Header: Brand & Title */}
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-[9px] font-sans font-bold uppercase tracking-[0.28em] text-ink/40">
                P A P E R   T H O U G H T S
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-burgundy tracking-tight">
                {piece.title}
              </h2>
              {piece.logline && (
                <p className="text-xs sm:text-sm text-ink/65 font-serif italic leading-relaxed">
                  &ldquo;{piece.logline}&rdquo;
                </p>
              )}
              
              {/* Classical Divider */}
              <div className="w-20 h-px bg-accent/40 mx-auto my-3" />
            </div>

            {/* Stanza Verse Body */}
            <div className="max-w-xl mx-auto text-left sm:text-center">
              <p className="text-sm sm:text-base md:text-lg leading-7 sm:leading-8 md:leading-9 text-ink/90 font-serif whitespace-pre-wrap selection:bg-accent/20">
                {piece.bodyText || piece.body_text || ''}
              </p>
            </div>

            {/* Winged Colophon Close */}
            <div className="pt-4 border-t border-[#EADFC9]/80 space-y-1.5 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2.5 text-accent text-xs">
                <span className="w-10 h-px bg-accent/35" />
                <span>❦</span>
                <span className="w-10 h-px bg-accent/35" />
              </div>
              <p className="font-display italic text-base sm:text-lg text-burgundy font-bold">
                by {authorDisplayName}
              </p>
            </div>

            {/* Action Bar: Like & Download Card */}
            {(onToggleLike || onDownloadCard) && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                {onToggleLike && (
                  <button
                    onClick={() => onToggleLike(piece)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      isLiked
                        ? 'bg-[#c96a42] text-cream'
                        : 'bg-white text-ink/75 border border-sage/25 hover:border-burgundy'
                    }`}
                  >
                    <span>🍃</span>
                    <span>{isLiked ? 'Leafed' : 'Leaf a Like'} ({likeCount})</span>
                  </button>
                )}

                {onDownloadCard && (
                  <button
                    onClick={() => onDownloadCard(piece)}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-burgundy hover:bg-ink text-cream text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Download size={13} />
                    <span>Download Broadsheet</span>
                  </button>
                )}
              </div>
            )}

            {/* Workshop Nudge Ribbon */}
            <div className="bg-sage/10 border border-sage/20 rounded-2xl p-3.5 sm:p-4 max-w-xl mx-auto text-left flex items-start gap-3">
              <Compass size={17} className="text-burgundy flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-[11px] sm:text-xs font-bold text-burgundy uppercase tracking-wider">
                  Love great literature? Sharpen the craft.
                </h4>
                <p className="text-[10px] sm:text-[11px] text-ink/70 font-serif leading-relaxed">
                  Review active prompt manuscripts in the double-blind Workshop to earn Milestone Tokens and spendable Leaves.
                </p>
                <Link
                  href="/dashboard/review"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline pt-0.5"
                >
                  <span>Enter Critique Queue</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Comments & Reader Reactions (Parchment Notes) */}
            {comments !== null && (
              <div className="border-t border-[#EADFC9]/80 pt-5 space-y-4 text-left max-w-xl mx-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base sm:text-lg text-burgundy flex items-center gap-1.5">
                    <MessageSquare size={15} className="text-accent" />
                    <span>Parchment Notes ({comments.length})</span>
                  </h3>
                  <span className="text-[9px] text-ink/40 font-mono">Reader Reflections</span>
                </div>

                {/* Comments Stream */}
                {loadingComments ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-white/60 rounded-xl animate-pulse" />
                    <div className="h-10 bg-white/60 rounded-xl animate-pulse" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-ink/50 font-serif italic bg-white/40 border border-dashed border-sage/20 p-3.5 rounded-xl text-center">
                    No notes left for this piece yet. Leave the author some encouragement!
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-white border border-sage/15 p-3 sm:p-3.5 rounded-2xl space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-burgundy font-sans">{c.displayName}</span>
                          <span className="text-ink/35 font-mono">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-ink/80 font-serif leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Form */}
                {currentUser ? (
                  <form onSubmit={handleCommentSubmit} className="space-y-2 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={commentPenName}
                        onChange={(e) => setCommentPenName(e.target.value)}
                        placeholder="Pen Name (Optional)"
                        className="sm:w-1/3 bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy"
                      />
                      <div className="flex-1 flex gap-1.5">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Leave a warm note for the author..."
                          className="flex-1 bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !commentText.trim()}
                          className="bg-burgundy hover:bg-ink text-cream px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 flex-shrink-0"
                        >
                          <Send size={11} />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                    {commentError && (
                      <p className="text-[10px] text-burgundy font-bold">{commentError}</p>
                    )}
                  </form>
                ) : (
                  <div className="bg-white/70 border border-sage/20 p-2.5 rounded-xl text-center">
                    <Link href="/sign-in?redirect_url=/village/gallery" className="text-xs font-bold text-burgundy hover:underline">
                      Sign in to leave a note for the author ✍️
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
