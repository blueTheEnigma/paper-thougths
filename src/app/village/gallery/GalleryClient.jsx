"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, MessageSquare, Sparkles, 
  Search, Feather, X, ChevronRight, Award
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import LiteraryReaderModal from '@/components/common/LiteraryReaderModal';

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
    if (e && e.stopPropagation) e.stopPropagation();
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
      setLikeOverrides(prev => ({
        ...prev,
        [piece.id]: { userLiked: currentLiked, likeCount: currentCount }
      }));
    }
  };

  // Handle Comment Submission
  const handlePostComment = async ({ content, penName }) => {
    if (!currentUser) {
      throw new Error('Please sign in to leave a note.');
    }
    if (!content.trim() || !selectedPiece) return;

    const res = await fetch(`/api/submissions/${selectedPiece.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.trim(),
        penName: penName.trim()
      })
    });

    const data = await res.json();
    if (data.success) {
      setComments(prev => [...prev, data.comment]);
      setSubmissions(prev => prev.map(s => 
        s.id === selectedPiece.id ? { ...s, commentCount: data.commentCount } : s
      ));
    } else {
      throw new Error(data.error || 'Failed to post note.');
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
    
    ctx.beginPath();
    ctx.moveTo(offset, offset + len);
    ctx.lineTo(offset, offset);
    ctx.lineTo(offset + len, offset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - offset, offset + len);
    ctx.lineTo(width - offset, offset);
    ctx.lineTo(width - offset - len, offset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset, height - offset - len);
    ctx.lineTo(offset, height - offset);
    ctx.lineTo(offset + len, height - offset);
    ctx.stroke();

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
    
    // Title
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
    const rawLines = (sub.bodyText || sub.body_text || '').split('\n');
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
    const authorName = sub.displayName || sub.penName || sub.authorFullName || 'Paper Thoughts Writer';
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
    <main className="min-h-screen bg-cream pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-burgundy/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sage/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link 
            href="/village" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} /> Back to Writers&rsquo; Village
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-sage/15 pb-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-burgundy/5 border border-burgundy/10 text-[10px] font-bold text-burgundy uppercase tracking-widest">
                <Sparkles size={12} className="text-accent" />
                <span>The Living Salon</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-burgundy tracking-tight">
                Reading Gallery
              </h1>
              <p className="text-xs sm:text-sm text-ink/70 font-serif leading-relaxed">
                Step into the open salon. Read poems, stories, and reflections from clubhouse authors—leave a leaf, share a note, or export broadsheet cards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/write"
                className="bg-burgundy hover:bg-ink text-cream px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Feather size={13} />
                <span>Write Manuscript</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Controls: Search & Genre Pills */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, pen name, or theme..."
                className="w-full bg-white border border-sage/20 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Count Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-ink/50 bg-white/70 border border-sage/15 px-3 py-2 rounded-xl">
              <span>{submissions.length} Works Unlocked</span>
            </div>
          </div>

          {/* Genre Scrollable Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {GENRES.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/50 border border-sage/15 rounded-2xl p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center bg-white/40 border border-dashed border-sage/30 rounded-2xl max-w-lg mx-auto p-6 space-y-3">
            <BookOpen className="opacity-20 mx-auto text-burgundy" size={40} />
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-burgundy">The Salon is Quiet</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedPiece(sub)}
                  className="bg-white border border-sage/15 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-2">
                    {/* Header: Genre & Badge */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="bg-burgundy/5 text-burgundy text-[8px] font-bold px-2 py-0.5 rounded-full border border-burgundy/10 uppercase tracking-widest">
                        {sub.genre}
                      </span>
                      {sub.hasLaurel && (
                        <span className="text-accent text-[8px] font-bold flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                          <Award size={9} /> Laureled
                        </span>
                      )}
                    </div>

                    {/* Title & Author Pen Name */}
                    <div>
                      <h3 className="font-display font-extrabold text-base sm:text-lg text-burgundy group-hover:text-accent transition-colors line-clamp-1">
                        {sub.title}
                      </h3>
                      <p className="text-[11px] text-ink/60 font-serif italic mt-0.5">
                        by <span className="font-bold text-ink/80 not-italic">{sub.displayName}</span>
                      </p>
                    </div>

                    {/* Teaser Logline */}
                    <p className="text-xs text-ink/75 font-serif leading-relaxed line-clamp-2 italic">
                      &ldquo;{sub.logline}&rdquo;
                    </p>
                  </div>

                  {/* Footer Action Strip */}
                  <div className="border-t border-sage/10 pt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Leaf a Like Button */}
                      <button
                        onClick={(e) => handleToggleLike(sub, e)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                          isLiked
                            ? 'bg-[#c96a42]/15 text-[#c96a42]'
                            : 'text-ink/45 hover:text-[#c96a42] hover:bg-sage/10'
                        }`}
                        title="Leaf a Like"
                      >
                        <span className={`text-xs ${isLiked ? 'scale-110' : ''}`}>🍃</span>
                        <span>{likeCount}</span>
                      </button>

                      {/* Comment Count */}
                      <div className="inline-flex items-center gap-1 text-[11px] text-ink/40 font-medium">
                        <MessageSquare size={12} />
                        <span>{sub.commentCount}</span>
                      </div>
                    </div>

                    {/* Read CTA */}
                    <span className="text-[10px] font-bold text-burgundy group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 uppercase tracking-wider">
                      <span>Read</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── UNIFIED LITERARY FOLIO READER MODAL ── */}
      {selectedPiece && (
        <LiteraryReaderModal
          isOpen={!!selectedPiece}
          onClose={() => setSelectedPiece(null)}
          piece={selectedPiece}
          currentUser={currentUser}
          isLiked={likeOverrides[selectedPiece.id]?.userLiked ?? selectedPiece.userLiked}
          likeCount={likeOverrides[selectedPiece.id]?.likeCount ?? selectedPiece.likeCount}
          onToggleLike={handleToggleLike}
          onDownloadCard={handleDownloadBroadsheet}
          comments={comments}
          loadingComments={loadingComments}
          onPostComment={handlePostComment}
        />
      )}

    </main>
  );
}
