"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Heart, MessageSquare, Sparkles, 
  Download, Send, Search, Filter, Feather, Share2, 
  Check, X, Compass, ChevronRight, Award
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const GENRES = [
  'All',
  'Poetry',
  'Fiction',
  'Non-Fiction',
  'Drama',
  'Sci-Fi',
  'Fantasy',
  'Mystery',
  'Memoir'
];

export default function GalleryClient({ currentUser }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Comments State for selected piece
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentPenName, setCommentPenName] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Local like state overrides
  const [likeOverrides, setLikeOverrides] = useState({});

  // Fetch Gallery Submissions
  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGenre !== 'All') params.set('genre', selectedGenre);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/submissions/gallery?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, searchQuery]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Fetch comments when piece is opened
  useEffect(() => {
    if (selectedPiece) {
      setLoadingComments(true);
      setCommentError(null);
      fetch(`/api/submissions/${selectedPiece.id}/comments`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setComments(data.comments || []);
          }
        })
        .catch(err => console.error('Failed to load comments:', err))
        .finally(() => setLoadingComments(false));
    } else {
      setComments([]);
    }
  }, [selectedPiece]);

  // Handle Like Toggle
  const handleToggleLike = async (piece, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      alert('Please sign in to like manuscripts and support authors!');
      return;
    }

    const currentLiked = likeOverrides[piece.id]?.userLiked !== undefined 
      ? likeOverrides[piece.id].userLiked 
      : piece.userLiked;
    const currentCount = likeOverrides[piece.id]?.likeCount !== undefined 
      ? likeOverrides[piece.id].likeCount 
      : piece.likeCount;

    const nextLiked = !currentLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    // Optimistic UI update
    setLikeOverrides(prev => ({
      ...prev,
      [piece.id]: { userLiked: nextLiked, likeCount: nextCount }
    }));

    if (nextLiked) {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#c96a42', '#F2A98A', '#20070e']
      });
    }

    try {
      const res = await fetch(`/api/submissions/${piece.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLikeOverrides(prev => ({
          ...prev,
          [piece.id]: { userLiked: data.userLiked, likeCount: data.likeCount }
        }));
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
      // Revert on error
      setLikeOverrides(prev => ({
        ...prev,
        [piece.id]: { userLiked: currentLiked, likeCount: currentCount }
      }));
    }
  };

  // Handle Comment Submission
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please sign in to leave a note for the author.');
      return;
    }
    if (!newCommentText.trim() || !selectedPiece) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/submissions/${selectedPiece.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newCommentText.trim(),
          penName: commentPenName.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setComments(prev => [...prev, data.comment]);
        setNewCommentText('');
        // Update comment count in local list
        setSubmissions(prev => prev.map(s => 
          s.id === selectedPiece.id ? { ...s, commentCount: data.commentCount } : s
        ));
      } else {
        setCommentError(data.error || 'Failed to post note.');
      }
    } catch (err) {
      setCommentError('Network error while posting note.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 1-Click Card Downloader
  const handleDownloadBroadsheet = (sub) => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, Math.max(width, height));
    bgGrad.addColorStop(0, '#FAF7F2');
    bgGrad.addColorStop(1, '#F3EAE0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    
    // Borders
    ctx.strokeStyle = '#5E1914';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);
    
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34, 34, width - 68, height - 68);
    
    // Corner accents
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 3;
    const offset = 34;
    const len = 15;
    
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(offset, offset + len);
    ctx.lineTo(offset, offset);
    ctx.lineTo(offset + len, offset);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - offset, offset + len);
    ctx.lineTo(width - offset, offset);
    ctx.lineTo(width - offset - len, offset);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(offset, height - offset - len);
    ctx.lineTo(offset, height - offset);
    ctx.lineTo(offset + len, height - offset);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - offset, height - offset - len);
    ctx.lineTo(width - offset, height - offset);
    ctx.lineTo(width - offset - len, height - offset);
    ctx.stroke();

    // Brand Header
    ctx.fillStyle = '#5E1914';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P A P E R   T H O U G H T S', width / 2, 80);
    
    // Star ornament
    ctx.fillStyle = '#C5A059';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('❖   ✦   ❖', width / 2, 118);
    
    // Poem Title
    ctx.fillStyle = '#5E1914';
    ctx.font = 'italic bold 44px Georgia, serif';
    ctx.fillText(sub.title || 'Untitled', width / 2, 175);
    
    // Epigraph
    ctx.fillStyle = '#6B5E4F';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText(sub.logline ? `"${sub.logline}"` : '', width / 2, 224);
    
    // Top Divider
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 285);
    ctx.lineTo(width - 250, 285);
    ctx.stroke();
    
    // Body Text
    const rawLines = (sub.bodyText || '').split('\n');
    ctx.font = '22px Georgia, serif';
    const maxTextW = 860;
    
    const wrapText = (text, context, maxW) => {
      const words = text.split(' ');
      if (words.length <= 1) return [text];
      const lines = [];
      let current = words[0];
      for (let i = 1; i < words.length; i++) {
        const w = words[i];
        if (context.measureText(current + ' ' + w).width < maxW) {
          current += ' ' + w;
        } else {
          lines.push(current);
          current = w;
        }
      }
      lines.push(current);
      return lines;
    };
    
    const finalLines = [];
    for (let line of rawLines) {
      if (line.trim() === '') {
        finalLines.push('');
      } else {
        finalLines.push(...wrapText(line, ctx, maxTextW));
      }
    }
    
    let fontSize = 22;
    let lineHeight = fontSize * 1.65;
    let totalHeight = finalLines.length * lineHeight;
    const maxAvailableH = 780;
    
    if (totalHeight > maxAvailableH) {
      fontSize = Math.max(13, Math.floor(maxAvailableH / (finalLines.length * 1.65)));
      lineHeight = fontSize * 1.65;
      totalHeight = finalLines.length * lineHeight;
    }
    
    ctx.fillStyle = '#2C1A0E';
    ctx.font = `${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    
    const startY = 335 + (maxAvailableH - totalHeight) / 2;
    for (let i = 0; i < finalLines.length; i++) {
      if (finalLines[i] !== '') {
        ctx.fillText(finalLines[i], width / 2, startY + (i * lineHeight));
      }
    }
    
    // Winged Colophon Close
    const closeY = 1175;
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, closeY);
    ctx.lineTo(width / 2 - 30, closeY);
    ctx.stroke();
    
    ctx.fillStyle = '#C5A059';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('❦', width / 2, closeY + 2);
    
    ctx.beginPath();
    ctx.moveTo(width / 2 + 30, closeY);
    ctx.lineTo(width / 2 + 120, closeY);
    ctx.stroke();

    // Bottom Divider
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 1220);
    ctx.lineTo(width - 250, 1220);
    ctx.stroke();
    
    // Attribution
    const authorName = sub.displayName || sub.penName || 'Paper Thoughts Writer';
    ctx.fillStyle = '#5E1914';
    ctx.font = 'italic bold 24px Georgia, serif';
    ctx.fillText(`by ${authorName}`, width / 2, 1268);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `${(sub.title || 'manuscript').replace(/\s+/g, '_')}_broadsheet.jpg`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <main className="min-h-screen bg-cream pt-20 sm:pt-24 pb-24 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-burgundy/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link 
            href="/village" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} /> Back to Writers&rsquo; Village
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-sage/15 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy/5 border border-burgundy/10 text-xs font-bold text-burgundy uppercase tracking-widest">
                <Sparkles size={13} className="text-accent" />
                <span>The Living Salon</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-burgundy tracking-tight">
                Reading Gallery
              </h1>
              <p className="text-xs sm:text-sm text-ink/70 font-serif leading-relaxed">
                Step into the open salon. Read poems, stories, and reflections from clubhouse authors—leave a leaf, share a note, or export high-res broadsheet cards to your status.
              </p>
            </div>

            {/* Quick stats or CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/write"
                className="bg-burgundy hover:bg-ink text-cream px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Feather size={14} />
                <span>Write a Manuscript</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Controls: Search & Genre Pills */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, pen name, or theme..."
                className="w-full bg-white border border-sage/20 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Count Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-ink/50 bg-white/70 border border-sage/15 px-3 py-2.5 rounded-2xl">
              <span>{submissions.length} Works Unlocked</span>
            </div>
          </div>

          {/* Genre Scrollable Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GENRES.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-burgundy text-cream shadow-sm'
                      : 'bg-white text-ink/65 border border-sage/15 hover:border-burgundy/30'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Feed Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/50 border border-sage/15 rounded-3xl p-6 h-64 animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-20 text-center bg-white/40 border border-dashed border-sage/30 rounded-[32px] max-w-lg mx-auto p-8 space-y-4">
            <BookOpen className="opacity-20 mx-auto text-burgundy" size={48} />
            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-burgundy">The Salon is Quiet</h3>
              <p className="text-xs text-ink/60 font-serif leading-relaxed">
                {searchQuery || selectedGenre !== 'All'
                  ? 'No unlocked manuscripts match your search filters. Try clearing your search.'
                  : 'Be the first to submit a manuscript to this weekly prompt cycle and grace the gallery!'}
              </p>
            </div>
            {(searchQuery || selectedGenre !== 'All') && (
              <button
                onClick={() => { setSelectedGenre('All'); setSearchQuery(''); }}
                className="text-xs font-bold text-burgundy underline uppercase tracking-wider cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {submissions.map((sub) => {
              const isLiked = likeOverrides[sub.id]?.userLiked !== undefined 
                ? likeOverrides[sub.id].userLiked 
                : sub.userLiked;
              const likeCount = likeOverrides[sub.id]?.likeCount !== undefined 
                ? likeOverrides[sub.id].likeCount 
                : sub.likeCount;

              return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPiece(sub)}
                  className="bg-white border border-sage/15 p-6 rounded-[28px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header: Genre & Date */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="bg-burgundy/5 text-burgundy text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-burgundy/10 uppercase tracking-widest">
                        {sub.genre}
                      </span>
                      {sub.hasLaurel && (
                        <span className="text-accent text-[9px] font-bold flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                          <Award size={10} /> Laureled
                        </span>
                      )}
                    </div>

                    {/* Title & Author Pen Name */}
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-burgundy group-hover:text-accent transition-colors line-clamp-1">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-ink/60 font-serif italic mt-0.5">
                        by <span className="font-bold text-ink/80 not-italic">{sub.displayName}</span>
                      </p>
                    </div>

                    {/* Teaser Logline */}
                    <p className="text-xs text-ink/75 font-serif leading-relaxed line-clamp-3 italic">
                      &ldquo;{sub.logline}&rdquo;
                    </p>
                  </div>

                  {/* Footer Action Strip */}
                  <div className="border-t border-sage/10 pt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Leaf a Like Button */}
                      <button
                        onClick={(e) => handleToggleLike(sub, e)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                          isLiked
                            ? 'bg-[#c96a42]/15 text-[#c96a42]'
                            : 'text-ink/45 hover:text-[#c96a42] hover:bg-sage/10'
                        }`}
                        title="Leaf a Like"
                      >
                        <span className={`text-sm ${isLiked ? 'scale-110' : ''}`}>🍃</span>
                        <span>{likeCount}</span>
                      </button>

                      {/* Comment Count */}
                      <div className="inline-flex items-center gap-1 text-xs text-ink/40 font-medium">
                        <MessageSquare size={13} />
                        <span>{sub.commentCount}</span>
                      </div>
                    </div>

                    {/* Read CTA */}
                    <span className="text-[11px] font-bold text-burgundy group-hover:translate-x-0.5 transition-transform flex items-center gap-1 uppercase tracking-wider">
                      <span>Read</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── IMMERSIVE PARCHMENT READER MODAL ── */}
      <AnimatePresence>
        {selectedPiece && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FAF7F0] border border-[#EADFC9] rounded-[32px] max-w-3xl w-full shadow-2xl overflow-hidden relative text-ink flex flex-col my-auto max-h-[92vh]"
            >
              {/* Header Bar */}
              <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between bg-white/60 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-burgundy/10 text-burgundy text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-burgundy/15 uppercase tracking-widest">
                    {selectedPiece.genre}
                  </span>
                  {selectedPiece.hasLaurel && (
                    <span className="bg-accent/15 text-accent text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-accent/25 uppercase tracking-widest">
                      🏆 Clubhouse Laureate
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPiece(null)}
                  className="text-ink/40 hover:text-ink p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Scrollable Reading Experience */}
              <div className="p-6 sm:p-10 overflow-y-auto space-y-8 text-center relative">
                
                {/* Manuscript Title & Epigraph */}
                <div className="space-y-3 max-w-xl mx-auto">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-ink/40">
                    P A P E R   T H O U G H T S
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-burgundy tracking-tight">
                    {selectedPiece.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-ink/65 font-serif italic leading-relaxed">
                    &ldquo;{selectedPiece.logline}&rdquo;
                  </p>
                  
                  {/* Classical Divider */}
                  <div className="w-24 h-px bg-accent/40 mx-auto my-4" />
                </div>

                {/* Stanza Verse Body */}
                <div className="max-w-xl mx-auto text-left sm:text-center">
                  <p className="text-base sm:text-lg leading-8 sm:leading-9 text-ink/90 font-serif whitespace-pre-wrap selection:bg-accent/20">
                    {selectedPiece.bodyText}
                  </p>
                </div>

                {/* Winged Colophon & Author Attribution */}
                <div className="pt-6 border-t border-sage/15 space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-3 text-accent text-sm">
                    <span className="w-12 h-px bg-accent/30" />
                    <span>❦</span>
                    <span className="w-12 h-px bg-accent/30" />
                  </div>
                  <p className="font-display italic text-lg text-burgundy font-bold">
                    by {selectedPiece.displayName}
                  </p>
                </div>

                {/* Reader Action Bar: Like, Download Card, Share */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleLike(selectedPiece)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                      likeOverrides[selectedPiece.id]?.userLiked ?? selectedPiece.userLiked
                        ? 'bg-[#c96a42] text-cream'
                        : 'bg-white text-ink/75 border border-sage/25 hover:border-burgundy'
                    }`}
                  >
                    <span>🍃</span>
                    <span>
                      {likeOverrides[selectedPiece.id]?.userLiked ?? selectedPiece.userLiked ? 'Leafed' : 'Leaf a Like'} (
                      {likeOverrides[selectedPiece.id]?.likeCount ?? selectedPiece.likeCount}
                      )
                    </span>
                  </button>

                  {/* 1-Click Broadsheet Generator */}
                  <button
                    onClick={() => handleDownloadBroadsheet(selectedPiece)}
                    className="px-5 py-2.5 rounded-2xl bg-burgundy hover:bg-ink text-cream text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Download size={14} />
                    <span>Download Card</span>
                  </button>
                </div>

                {/* Lurker-to-Critic Invitation Ribbon */}
                <div className="bg-sage/10 border border-sage/20 rounded-2xl p-4 max-w-xl mx-auto text-left flex items-start gap-3">
                  <Compass size={18} className="text-burgundy flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-burgundy uppercase tracking-wider">
                      Love great writing? Sharpen the craft.
                    </h4>
                    <p className="text-[11px] text-ink/70 font-serif leading-relaxed">
                      Step into the double-blind Workshop to review active manuscripts and earn Milestone Tokens toward Keeper status.
                    </p>
                    <Link
                      href="/dashboard/review"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline pt-1"
                    >
                      <span>Enter Review Queue</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>

                {/* ── PARCHMENT NOTES (COMMENTS SECTION) ── */}
                <div className="border-t border-sage/15 pt-6 space-y-6 text-left max-w-xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg text-burgundy flex items-center gap-2">
                      <MessageSquare size={16} className="text-accent" />
                      <span>Parchment Notes ({comments.length})</span>
                    </h3>
                    <span className="text-[10px] text-ink/40 font-mono">Warm Reader Reactions</span>
                  </div>

                  {/* Comments List */}
                  {loadingComments ? (
                    <div className="space-y-2">
                      <div className="h-12 bg-white/60 rounded-xl animate-pulse" />
                      <div className="h-12 bg-white/60 rounded-xl animate-pulse" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-ink/50 font-serif italic bg-white/40 border border-dashed border-sage/20 p-4 rounded-xl text-center">
                      No notes left for the author yet. Be the first to leave your thoughts!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((c) => (
                        <div key={c.id} className="bg-white border border-sage/15 p-3.5 rounded-2xl space-y-1">
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
                    <form onSubmit={handlePostComment} className="space-y-2.5 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentPenName}
                          onChange={(e) => setCommentPenName(e.target.value)}
                          placeholder="Your Pen Name (Optional)"
                          className="w-1/3 bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy"
                        />
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Leave a warm note for the author..."
                          className="flex-1 bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !newCommentText.trim()}
                          className="bg-burgundy hover:bg-ink text-cream px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                        >
                          <Send size={12} />
                          <span>Send</span>
                        </button>
                      </div>
                      {commentError && (
                        <p className="text-[10px] text-burgundy font-bold">{commentError}</p>
                      )}
                    </form>
                  ) : (
                    <div className="bg-white/70 border border-sage/20 p-3 rounded-xl text-center">
                      <Link href="/sign-in?redirect_url=/village/gallery" className="text-xs font-bold text-burgundy hover:underline">
                        Sign in to leave a note for the author ✍️
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
