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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getCurrentCycleInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const cycleMonth = `${year}-${String(month).padStart(2, '0')}`;
  const monthName = MONTH_NAMES[now.getMonth()];
  return { year, month, cycleMonth, monthName };
}

function formatCycleTag(cycle) {
  if (!cycle) return 'Sanctuary';
  const parts = cycle.split('-');
  if (parts.length === 2) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (shortMonths[monthIdx]) {
      return `${shortMonths[monthIdx]} ${parts[0]}`;
    }
  }
  return cycle;
}

export default function GalleryClient({ currentUser }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Comments State for selected piece
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const currentInfo = getCurrentCycleInfo();
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'stories' | 'poetry'
  const [selectedCycleMonth, setSelectedCycleMonth] = useState(currentInfo.cycleMonth);
  const [filterOptions, setFilterOptions] = useState([
    { value: currentInfo.cycleMonth, label: currentInfo.monthName }
  ]);

  // Filter submissions by category and genre
  const filteredSubmissions = submissions.filter((sub) => {
    if (activeCategory === 'poetry') {
      return (sub.genre || '').toLowerCase().includes('poem') || (sub.genre || '').toLowerCase() === 'poetry';
    }
    if (activeCategory === 'stories') {
      return !((sub.genre || '').toLowerCase().includes('poem') || (sub.genre || '').toLowerCase() === 'poetry');
    }
    return true;
  });

  const storiesCount = submissions.filter(s => !((s.genre || '').toLowerCase().includes('poem') || (s.genre || '').toLowerCase() === 'poetry')).length;
  const poetryCount = submissions.filter(s => (s.genre || '').toLowerCase().includes('poem') || (s.genre || '').toLowerCase() === 'poetry').length;

  // Local like state overrides
  const [likeOverrides, setLikeOverrides] = useState({});

  // Fetch Gallery Submissions
  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // selectedGenre removed for decluttered format-first navigation
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedCycleMonth) params.set('monthYear', selectedCycleMonth);

      const res = await fetch(`/api/submissions/gallery?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
        if (data.filterOptions && data.filterOptions.length > 0) {
          setFilterOptions(data.filterOptions);
        }
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, searchQuery, selectedCycleMonth]);

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
    <main className="min-h-screen bg-[#FAF7F2] pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#20070e]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c96a42]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-7">
        
        {/* Navigation & Header */}
        <div className="space-y-2.5">
          <Link 
            href="/village" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#20070e] uppercase tracking-widest hover:text-[#c96a42] transition-colors"
          >
            <ArrowLeft size={15} /> Back to Writers&rsquo; Village
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-[#20070e]/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c96a42]/10 text-[10px] font-bold text-[#c96a42] uppercase tracking-widest mb-1">
                <Sparkles size={11} />
                <span>The Living Salon</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#20070e] tracking-tight">
                Reading Gallery
              </h1>
              <p className="text-xs sm:text-sm text-[#20070e]/70 font-serif leading-relaxed mt-0.5">
                Step into the quiet reading room. Explore poems, stories, and reflections from clubhouse authors.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <Link
                href="/anthology"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c96a42] hover:text-[#20070e] transition-colors"
              >
                <span>✦ Living Anthology Laureates</span>
                <ChevronRight size={13} />
              </Link>
              <Link
                href="/dashboard/write"
                className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
              >
                <Feather size={12} />
                <span>Write Manuscript</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decluttered Editorial Toolbar: Format Pills, Cycle Picker & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Format Selection: All / Stories / Poetry */}
          <div className="flex items-center bg-white/70 p-1 rounded-xl border border-[#20070e]/10 text-xs font-bold">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#20070e] text-[#FBF7EE] shadow-xs'
                  : 'text-[#20070e]/60 hover:text-[#20070e]'
              }`}
            >
              All Works ({submissions.length})
            </button>
            <button
              onClick={() => setActiveCategory('stories')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'stories'
                  ? 'bg-[#20070e] text-[#FBF7EE] shadow-xs'
                  : 'text-[#20070e]/60 hover:text-[#20070e]'
              }`}
            >
              Stories ({storiesCount})
            </button>
            <button
              onClick={() => setActiveCategory('poetry')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'poetry'
                  ? 'bg-[#20070e] text-[#FBF7EE] shadow-xs'
                  : 'text-[#20070e]/60 hover:text-[#20070e]'
              }`}
            >
              Poetry ({poetryCount})
            </button>
          </div>

          {/* Cycle Archive Selector & Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-[#20070e]/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#20070e] shadow-2xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#20070e]/40">Month:</span>
              <select
                value={selectedCycleMonth}
                onChange={(e) => setSelectedCycleMonth(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-serif font-bold text-[#20070e] pr-1"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="font-sans text-neutral-800 font-normal">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#20070e]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manuscripts..."
                className="w-full bg-white border border-[#20070e]/10 rounded-xl py-1.5 pl-8 pr-7 text-xs font-medium text-[#20070e] placeholder-[#20070e]/35 focus:outline-none focus:border-[#c96a42] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#20070e]/40 hover:text-[#20070e]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Feed: Pure Literary Dust-Jackets on Warm Parchment */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/50 border border-[#20070e]/10 rounded-2xl p-5 h-52 animate-pulse" />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center bg-white/40 border border-dashed border-[#20070e]/15 rounded-2xl max-w-lg mx-auto p-6 space-y-4">
            <BookOpen className="opacity-25 mx-auto text-[#20070e]" size={42} />
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-xl text-[#20070e]">
                {selectedCycleMonth === currentInfo.cycleMonth
                  ? `The Salon is Quiet this ${currentInfo.monthName}`
                  : 'The Salon is Quiet'}
              </h3>
              <p className="text-xs sm:text-sm text-[#20070e]/70 font-serif leading-relaxed max-w-sm mx-auto">
                {searchQuery || activeCategory !== 'all'
                  ? 'No manuscripts match your active search. Try clearing your search.'
                  : selectedCycleMonth === currentInfo.cycleMonth
                    ? `A new monthly cycle has opened for ${currentInfo.monthName}. Be the first author to ink a manuscript and take the floor!`
                    : 'No manuscripts are archived in this cycle yet.'}
              </p>
            </div>

            {searchQuery || activeCategory !== 'all' ? (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="text-xs font-bold text-[#c96a42] underline uppercase tracking-wider cursor-pointer"
              >
                Reset Search &amp; Filters
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                <Link
                  href="/dashboard/write"
                  className="inline-flex items-center gap-1.5 bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <Feather size={12} />
                  <span>Submit a Manuscript</span>
                </Link>
                {filterOptions.some(f => f.value !== currentInfo.cycleMonth && f.value !== 'all') && (
                  <button
                    onClick={() => {
                      const prev = filterOptions.find(f => f.value !== currentInfo.cycleMonth && f.value !== 'all');
                      if (prev) setSelectedCycleMonth(prev.value);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#c96a42] hover:text-[#20070e] transition-colors py-2 px-3 cursor-pointer"
                  >
                    <span>Read {filterOptions.find(f => f.value !== currentInfo.cycleMonth && f.value !== 'all')?.label} Archive →</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredSubmissions.map((sub) => {
              const isLiked = likeOverrides[sub.id]?.userLiked !== undefined 
                ? likeOverrides[sub.id].userLiked 
                : sub.userLiked;
              const likeCount = likeOverrides[sub.id]?.likeCount !== undefined 
                ? likeOverrides[sub.id].likeCount 
                : sub.likeCount;

              const isPoem = (sub.genre || '').toLowerCase().includes('poem') || (sub.genre || '').toLowerCase() === 'poetry';

              return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPiece(sub)}
                  className="rounded-2xl bg-[#FBF7EE] border border-[#20070e]/12 hover:border-[#c96a42]/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer group p-5 sm:p-6 space-y-3.5 relative"
                >
                  <div className="space-y-2.5">
                    {/* Header: Format Tag & Laurel */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 border ${
                          isPoem 
                            ? 'bg-[#c96a42]/10 text-[#c96a42] border-[#c96a42]/20' 
                            : 'bg-[#20070e]/5 text-[#20070e]/80 border-[#20070e]/10'
                        }`}>
                          <span>{isPoem ? '🪶' : '📖'}</span>
                          <span>{isPoem ? 'Poem' : (sub.genre || 'Prose')}</span>
                        </span>

                        {sub.hasLaurel && (
                          <span className="text-amber-800 text-[9px] font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                            <Award size={10} className="text-amber-600" /> Laureate
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-[#20070e]/40">
                        {formatCycleTag(sub.cycleMonth)}
                      </span>
                    </div>

                    {/* Book Dust-Jacket Typography: Title & Author */}
                    <div>
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-[#20070e] group-hover:text-[#c96a42] transition-colors leading-snug line-clamp-2">
                        "{sub.title}"
                      </h3>
                      <p className="text-xs text-[#c96a42] font-serif italic mt-0.5">
                        by <span className="font-bold text-[#20070e] not-italic">{sub.displayName || sub.penName || 'Sanctuary Writer'}</span>
                      </p>
                    </div>

                    {/* Clean 2-Line Excerpt Directly on Card */}
                    <p className="font-serif italic text-xs text-[#20070e]/75 line-clamp-2 leading-relaxed pt-1">
                      &ldquo;{sub.logline || sub.excerpt || 'Read the full manuscript in the open salon...'}&rdquo;
                    </p>
                  </div>

                  {/* Quiet Editorial Footer */}
                  <div className="border-t border-[#20070e]/10 pt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {/* Leaf a Like Button */}
                      <button
                        onClick={(e) => handleToggleLike(sub, e)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                          isLiked
                            ? 'bg-[#c96a42] text-white shadow-xs'
                            : 'bg-[#20070e]/5 hover:bg-[#c96a42]/15 text-[#20070e]/70 hover:text-[#c96a42]'
                        }`}
                        title="Leaf a Like 🍃"
                      >
                        <span>🍃</span>
                        <span>{likeCount}</span>
                      </button>

                      {/* Comment Count */}
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-[#20070e]/50">
                        <MessageSquare size={11} />
                        <span>{sub.commentCount || 0}</span>
                      </div>

                      {/* Literary Rating Badge */}
                      {(sub.averageRating > 0 || sub.ratingCount > 0) && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#c96a42]">
                          <span>★</span>
                          <span>{Number(sub.averageRating || 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Subtle Read Prompt */}
                    <span className="text-[11px] font-bold text-[#20070e]/50 group-hover:text-[#c96a42] transition-colors flex items-center gap-0.5">
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
