"use client";

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Sparkles, Plus, Search, Filter, BookOpen, 
  MessageSquare, Download, Send, Check, X, Compass, 
  ChevronRight, Award, Trophy, Bookmark, Heart, Star, 
  HelpCircle, ArrowLeft, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const VIBE_TAGS = [
  'All',
  'Soul-Crushing',
  'Poetic Fire',
  'Dark Academia',
  'Mind-Bender',
  'Heart-Warmer',
  'Page-Turner',
  'Philosophical',
  'African Lore',
  'Classic'
];

export default function ConvinceMeClient({ currentUser }) {
  const [mounted, setMounted] = useState(false);
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('top'); // 'top' or 'recent'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPitchForDetail, setSelectedPitchForDetail] = useState(null);

  // Create Pitch Form State
  const [formBookTitle, setFormBookTitle] = useState('');
  const [formBookAuthor, setFormBookAuthor] = useState('');
  const [formHookLine, setFormHookLine] = useState('');
  const [formAftertaste, setFormAftertaste] = useState('');
  const [formKillerQuote, setFormKillerQuote] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formSelectedVibes, setFormSelectedVibes] = useState([]);
  const [submittingPitch, setSubmittingPitch] = useState(false);
  const [pitchError, setPitchError] = useState(null);

  // Detail Modal Notes State
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [notePenName, setNotePenName] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  // Local Pledge Overrides
  const [pledgeOverrides, setPledgeOverrides] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock Body Scroll when any Modal is open
  useEffect(() => {
    const isAnyModalOpen = showCreateModal || selectedPitchForDetail;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
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
  }, [showCreateModal, selectedPitchForDetail]);

  // Fetch Pitches
  const fetchPitches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVibe !== 'All') params.set('vibe', selectedVibe);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('sort', sortMode);

      const res = await fetch(`/api/pitches?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPitches(data.pitches || []);
      }
    } catch (err) {
      console.error('Failed to load book pitches:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedVibe, searchQuery, sortMode]);

  useEffect(() => {
    fetchPitches();
  }, [fetchPitches]);

  // Fetch Notes for Selected Pitch
  useEffect(() => {
    if (selectedPitchForDetail) {
      setLoadingNotes(true);
      setNoteError(null);
      fetch(`/api/pitches/${selectedPitchForDetail.id}/notes`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotes(data.notes || []);
          }
        })
        .catch(err => console.error('Failed to load pitch notes:', err))
        .finally(() => setLoadingNotes(false));
    } else {
      setNotes([]);
    }
  }, [selectedPitchForDetail]);

  // Handle Toggle Pledge ("I'm Convinced!" -> TBR)
  const handleTogglePledge = async (pitch, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!currentUser) {
      alert('Please sign in to pledge to read books and add them to your TBR shelf!');
      return;
    }

    const currentPledged = pledgeOverrides[pitch.id]?.userPledged !== undefined 
      ? pledgeOverrides[pitch.id].userPledged 
      : pitch.userPledged;
    const currentCount = pledgeOverrides[pitch.id]?.pledgeCount !== undefined 
      ? pledgeOverrides[pitch.id].pledgeCount 
      : pitch.pledgeCount;

    const nextPledged = !currentPledged;
    const nextCount = nextPledged ? currentCount + 1 : Math.max(0, currentCount - 1);

    // Optimistic UI update
    setPledgeOverrides(prev => ({
      ...prev,
      [pitch.id]: { userPledged: nextPledged, pledgeCount: nextCount }
    }));

    if (nextPledged) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#c96a42', '#F2A98A', '#20070e']
      });
    }

    try {
      const res = await fetch(`/api/pitches/${pitch.id}/pledge`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPledgeOverrides(prev => ({
          ...prev,
          [pitch.id]: { userPledged: data.userPledged, pledgeCount: data.pledgeCount }
        }));
      }
    } catch (err) {
      console.error('Pledge toggle failed:', err);
      setPledgeOverrides(prev => ({
        ...prev,
        [pitch.id]: { userPledged: currentPledged, pledgeCount: currentCount }
      }));
    }
  };

  // Handle Create Pitch Submit
  const handleCreatePitch = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please sign in to pitch books.');
      return;
    }
    if (!formBookTitle.trim() || !formBookAuthor.trim() || !formHookLine.trim() || !formAftertaste.trim()) {
      setPitchError('Please fill in the book title, author, hook line, and emotional aftertaste.');
      return;
    }

    setSubmittingPitch(true);
    setPitchError(null);

    try {
      const res = await fetch('/api/pitches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: formBookTitle.trim(),
          bookAuthor: formBookAuthor.trim(),
          hookLine: formHookLine.trim(),
          aftertaste: formAftertaste.trim(),
          killerQuote: formKillerQuote.trim() || null,
          coverUrl: formCoverUrl.trim() || null,
          vibeTags: formSelectedVibes
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        // Reset Form
        setFormBookTitle('');
        setFormBookAuthor('');
        setFormHookLine('');
        setFormAftertaste('');
        setFormKillerQuote('');
        setFormCoverUrl('');
        setFormSelectedVibes([]);

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F2A98A', '#5C1A2E', '#C96A42']
        });

        fetchPitches();
      } else {
        setPitchError(data.error || 'Failed to publish pitch.');
      }
    } catch (err) {
      setPitchError('Network error while publishing pitch.');
    } finally {
      setSubmittingPitch(false);
    }
  };

  // Handle Post Debate Note
  const handlePostNote = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please sign in to join the pitch debate.');
      return;
    }
    if (!newNoteText.trim() || !selectedPitchForDetail) return;

    setSubmittingNote(true);
    setNoteError(null);

    try {
      const res = await fetch(`/api/pitches/${selectedPitchForDetail.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteText.trim(),
          penName: notePenName.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setNotes(prev => [...prev, data.note]);
        setNewNoteText('');
        setPitches(prev => prev.map(p => 
          p.id === selectedPitchForDetail.id ? { ...p, commentCount: data.commentCount } : p
        ));
      } else {
        setNoteError(data.error || 'Failed to post note.');
      }
    } catch (err) {
      setNoteError('Network error while posting note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // 1-Click Pitch Broadsheet JPEG Export
  const handleDownloadPitchCard = (pitch) => {
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
    
    // Frame borders
    ctx.strokeStyle = '#5E1914';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);
    
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34, 34, width - 68, height - 68);

    // Header Brand
    ctx.fillStyle = '#5E1914';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('P A P E R   T H O U G H T S', width / 2, 80);

    ctx.fillStyle = '#C5A059';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('❖   THE CONVINCE-ME ARENA   ❖', width / 2, 115);

    // Book Title & Author
    ctx.fillStyle = '#5E1914';
    ctx.font = 'italic bold 44px Georgia, serif';
    ctx.fillText(pitch.bookTitle || 'Untitled Book', width / 2, 180);

    ctx.fillStyle = '#C96A42';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`by ${pitch.bookAuthor || 'Unknown Author'}`, width / 2, 225);

    // Top Divider
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 265);
    ctx.lineTo(width - 250, 265);
    ctx.stroke();

    // Helper wrap function
    const wrap = (text, maxW) => {
      const words = (text || '').split(' ');
      if (words.length <= 1) return [text];
      const lines = [];
      let cur = words[0];
      for (let i = 1; i < words.length; i++) {
        if (ctx.measureText(cur + ' ' + words[i]).width < maxW) {
          cur += ' ' + words[i];
        } else {
          lines.push(cur);
          cur = words[i];
        }
      }
      lines.push(cur);
      return lines;
    };

    // Section 1: The Hook Line
    ctx.fillStyle = '#5E1914';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('✦ WHY YOUR SOUL NEEDS THIS ✦', width / 2, 320);

    ctx.fillStyle = '#2C1A0E';
    ctx.font = 'italic 24px Georgia, serif';
    const hookLines = wrap(`"${pitch.hookLine}"`, 840);
    let curY = 365;
    hookLines.forEach(l => {
      ctx.fillText(l, width / 2, curY);
      curY += 36;
    });

    // Section 2: The Emotional Aftertaste
    curY += 30;
    ctx.fillStyle = '#C96A42';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('✦ THE EMOTIONAL AFTERTASTE ✦', width / 2, curY);

    curY += 40;
    ctx.fillStyle = '#2C1A0E';
    ctx.font = '22px Georgia, serif';
    const aftertasteLines = wrap(pitch.aftertaste, 840);
    aftertasteLines.forEach(l => {
      ctx.fillText(l, width / 2, curY);
      curY += 34;
    });

    // Section 3: Killer Quote (if provided)
    if (pitch.killerQuote) {
      curY += 30;
      ctx.fillStyle = '#8B7355';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.fillText('✦ RESONANT EXCERPT ✦', width / 2, curY);

      curY += 38;
      ctx.fillStyle = '#5E1914';
      ctx.font = 'italic 20px Georgia, serif';
      const quoteLines = wrap(`“${pitch.killerQuote}”`, 820);
      quoteLines.forEach(l => {
        ctx.fillText(l, width / 2, curY);
        curY += 32;
      });
    }

    // Winged Colophon
    const colophonY = 1175;
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, colophonY);
    ctx.lineTo(width / 2 - 30, colophonY);
    ctx.stroke();

    ctx.fillStyle = '#C5A059';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('❦', width / 2, colophonY + 2);

    ctx.beginPath();
    ctx.moveTo(width / 2 + 30, colophonY);
    ctx.lineTo(width / 2 + 120, colophonY);
    ctx.stroke();

    // Bottom Divider
    ctx.beginPath();
    ctx.moveTo(250, 1220);
    ctx.lineTo(width - 250, 1220);
    ctx.stroke();

    // Attribution
    ctx.fillStyle = '#5E1914';
    ctx.font = 'italic bold 24px Georgia, serif';
    ctx.fillText(`Pitched by ${pitch.authorName || 'Clubhouse Scribe'}`, width / 2, 1268);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `${(pitch.bookTitle || 'book').replace(/\s+/g, '_')}_pitch_card.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const toggleFormVibe = (tag) => {
    if (formSelectedVibes.includes(tag)) {
      setFormSelectedVibes(prev => prev.filter(t => t !== tag));
    } else {
      if (formSelectedVibes.length >= 4) return;
      setFormSelectedVibes(prev => [...prev, tag]);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Ambience glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-burgundy/5 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link 
            href="/village" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} /> Writers&rsquo; Village Hub
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-sage/15 pb-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-widest">
                <Flame size={12} className="text-accent" />
                <span>The Convince-Me Salon</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-burgundy tracking-tight">
                Book Pitch Arena
              </h1>
              <p className="text-xs sm:text-sm text-ink/70 font-serif leading-relaxed">
                Pitch your literary obsessions. Tap 🍃 <strong>&ldquo;I&rsquo;m Convinced!&rdquo;</strong> to pledge and automatically add books to your personal TBR Shelf. The #1 book each cycle is crowned the Community Book of the Month!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert('Please sign in to pitch a book!');
                    return;
                  }
                  setShowCreateModal(true);
                }}
                className="bg-accent hover:bg-burgundy text-burgundy hover:text-cream px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Pitch a Book (+10 Leaves)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls: Search, Sort & Vibe Pills */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title, author, hook, or pitcher..."
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

            {/* Sort Toggle */}
            <div className="flex items-center rounded-xl bg-white/70 border border-sage/15 p-0.5">
              <button
                onClick={() => setSortMode('top')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortMode === 'top'
                    ? 'bg-burgundy text-cream shadow-sm'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                🔥 Top Convinced
              </button>
              <button
                onClick={() => setSortMode('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortMode === 'recent'
                    ? 'bg-burgundy text-cream shadow-sm'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                ✨ Newest
              </button>
            </div>

            {/* Quick Count */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-ink/50 bg-white/70 border border-sage/15 px-3 py-2 rounded-xl">
              <span>{pitches.length} Pitches in Arena</span>
            </div>
          </div>

          {/* Vibe Scrollable Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {VIBE_TAGS.map((vibe) => {
              const active = selectedVibe === vibe;
              return (
                <button
                  key={vibe}
                  onClick={() => setSelectedVibe(vibe)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-accent text-cream shadow-sm'
                      : 'bg-white text-ink/65 border border-sage/15 hover:border-accent/40'
                  }`}
                >
                  {vibe}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pitch Arena Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/50 border border-sage/15 rounded-2xl p-5 h-56 animate-pulse" />
            ))}
          </div>
        ) : pitches.length === 0 ? (
          <div className="py-16 text-center bg-white/40 border border-dashed border-sage/30 rounded-2xl max-w-lg mx-auto p-6 space-y-3">
            <BookOpen className="opacity-20 mx-auto text-accent" size={40} />
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-burgundy">The Arena Awaits Your Passion</h3>
              <p className="text-xs text-ink/60 font-serif leading-relaxed">
                {searchQuery || selectedVibe !== 'All'
                  ? 'No book pitches match your search filters. Try clearing your search.'
                  : 'Be the first to pitch a book and convince the entire clubhouse to read it!'}
              </p>
            </div>
            {(!searchQuery && selectedVibe === 'All') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-accent hover:bg-burgundy text-burgundy hover:text-cream px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
              >
                Submit First Pitch (+10 Leaves)
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {pitches.map((pitch, idx) => {
              const isPledged = pledgeOverrides[pitch.id]?.userPledged !== undefined 
                ? pledgeOverrides[pitch.id].userPledged 
                : pitch.userPledged;
              const pledgeCount = pledgeOverrides[pitch.id]?.pledgeCount !== undefined 
                ? pledgeOverrides[pitch.id].pledgeCount 
                : pitch.pledgeCount;

              return (
                <motion.div
                  key={pitch.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedPitchForDetail(pitch)}
                  className="bg-white border border-sage/15 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    {/* Header: Rank & Vibe Badges */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && sortMode === 'top' && (
                          <span className="bg-amber-500/15 text-amber-700 border border-amber-500/25 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                            <Trophy size={9} /> #1 Contender
                          </span>
                        )}
                        {pitch.vibeTags && pitch.vibeTags[0] && (
                          <span className="bg-burgundy/5 text-burgundy text-[8px] font-bold px-2 py-0.5 rounded-full border border-burgundy/10 uppercase tracking-widest">
                            {pitch.vibeTags[0]}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-accent font-bold font-mono flex items-center gap-1">
                        <span>🍃</span>
                        <span>{pledgeCount} Convinced</span>
                      </span>
                    </div>

                    {/* Book Title & Author */}
                    <div>
                      <h3 className="font-display font-extrabold text-base sm:text-lg text-burgundy group-hover:text-accent transition-colors line-clamp-1">
                        {pitch.bookTitle}
                      </h3>
                      <p className="text-[11px] text-ink/60 font-serif italic mt-0.5">
                        by <span className="font-bold text-ink/80 not-italic">{pitch.bookAuthor}</span>
                      </p>
                    </div>

                    {/* Hook Line */}
                    <p className="text-xs text-ink/80 font-serif leading-relaxed line-clamp-2 italic">
                      &ldquo;{pitch.hookLine}&rdquo;
                    </p>

                    {/* Emotional Aftertaste */}
                    <div className="bg-cream/50 border border-sage/10 p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] font-mono uppercase text-accent font-bold block">
                        Emotional Aftertaste:
                      </span>
                      <p className="text-[11px] text-ink/70 font-serif leading-normal line-clamp-2">
                        {pitch.aftertaste}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action Strip */}
                  <div className="border-t border-sage/10 pt-2.5 flex items-center justify-between">
                    {/* Pledge Button */}
                    <button
                      onClick={(e) => handleTogglePledge(pitch, e)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        isPledged
                          ? 'bg-[#c96a42] text-cream shadow-sm'
                          : 'bg-sage/10 hover:bg-[#c96a42]/15 text-ink/75 hover:text-[#c96a42]'
                      }`}
                      title={isPledged ? "Pledged to Read (in your TBR)" : "Pledge to Read (Add to TBR)"}
                    >
                      <span className={`text-xs ${isPledged ? 'scale-110' : ''}`}>🍃</span>
                      <span>{isPledged ? 'Convinced! (In TBR)' : 'I’m Convinced!'}</span>
                    </button>

                    {/* Comments Count & Read */}
                    <div className="flex items-center gap-2.5">
                      <div className="inline-flex items-center gap-1 text-[11px] text-ink/40 font-medium">
                        <MessageSquare size={12} />
                        <span>{pitch.commentCount}</span>
                      </div>

                      <span className="text-[10px] font-bold text-burgundy group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 uppercase tracking-wider">
                        <span>Debate</span>
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── CREATE PITCH MODAL (PITCH FORGE) ── */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0c0205]/80 backdrop-blur-md cursor-pointer"
                onClick={() => !submittingPitch && setShowCreateModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative w-full sm:max-w-2xl bg-[#FAF7F0] border-t sm:border border-[#EADFC9] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[86vh] text-ink z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Grab Handle */}
                <div className="w-12 h-1 bg-ink/20 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

                {/* Header */}
                <div className="px-5 sm:px-7 py-3.5 border-b border-[#EADFC9]/80 flex items-center justify-between bg-white/70 backdrop-blur-md flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <h3 className="font-display font-extrabold text-lg text-burgundy">The Pitch Forge</h3>
                  </div>
                  <button
                    onClick={() => !submittingPitch && setShowCreateModal(false)}
                    className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 text-ink/60 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleCreatePitch} className="p-5 sm:p-7 overflow-y-auto paper-scrollbar space-y-4 text-left">
                  <div className="bg-accent/10 border border-accent/20 rounded-2xl p-3.5 space-y-1">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider">
                      ✨ Challenge the Clubhouse (+10 Leaves Reward)
                    </p>
                    <p className="text-[11px] text-ink/75 font-serif leading-relaxed">
                      Give us your most passionate 3-part pitch for a book you love. The #1 highest-convinced book is fast-tracked as the Community Book of the Month!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink/60">Book Title *</label>
                      <input
                        type="text"
                        value={formBookTitle}
                        onChange={(e) => setFormBookTitle(e.target.value)}
                        placeholder="e.g. The Secret History"
                        required
                        className="w-full bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs font-bold text-ink focus:outline-none focus:border-burgundy"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink/60">Book Author *</label>
                      <input
                        type="text"
                        value={formBookAuthor}
                        onChange={(e) => setFormBookAuthor(e.target.value)}
                        placeholder="e.g. Donna Tartt"
                        required
                        className="w-full bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs font-bold text-ink focus:outline-none focus:border-burgundy"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/60">
                      1. The 1-Line Hook (&ldquo;Why Your Soul Needs This&rdquo;) *
                    </label>
                    <textarea
                      value={formHookLine}
                      onChange={(e) => setFormHookLine(e.target.value)}
                      placeholder="Why should we drop everything and read this? 1-2 sentence knockout punch."
                      rows={2}
                      required
                      className="w-full bg-white border border-sage/25 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-burgundy leading-relaxed resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/60">
                      2. The Emotional Aftertaste *
                    </label>
                    <textarea
                      value={formAftertaste}
                      onChange={(e) => setFormAftertaste(e.target.value)}
                      placeholder="How will we feel after turning the final page? (e.g. 'You will stare at the ceiling at 3 AM questioning fate.')"
                      rows={2}
                      required
                      className="w-full bg-white border border-sage/25 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-burgundy leading-relaxed resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/60">
                      3. Resonant Excerpt / Killer Quote (Optional)
                    </label>
                    <textarea
                      value={formKillerQuote}
                      onChange={(e) => setFormKillerQuote(e.target.value)}
                      placeholder="Your favorite line or passage that captures the book's genius."
                      rows={2}
                      className="w-full bg-white border border-sage/25 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-burgundy leading-relaxed resize-none font-serif italic"
                    />
                  </div>

                  {/* Vibe Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/60">
                      Vibe Tags (Select up to 3)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {VIBE_TAGS.filter(t => t !== 'All').map((tag) => {
                        const selected = formSelectedVibes.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleFormVibe(tag)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-burgundy text-cream shadow-sm'
                                : 'bg-white text-ink/65 border border-sage/20 hover:border-burgundy'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {pitchError && (
                    <p className="text-xs text-burgundy font-bold bg-burgundy/10 p-2.5 rounded-xl">{pitchError}</p>
                  )}

                  <div className="border-t border-[#EADFC9]/80 pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      disabled={submittingPitch}
                      className="px-4 py-2 rounded-xl bg-white border border-sage/25 text-xs font-bold text-ink cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPitch}
                      className="px-5 py-2 rounded-xl bg-accent hover:bg-burgundy text-burgundy hover:text-cream text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm cursor-pointer"
                    >
                      {submittingPitch ? 'Publishing Pitch...' : 'Publish Pitch (+10 Leaves) 🍃'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── PITCH DETAIL & DEBATE MODAL ── */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedPitchForDetail && (
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0c0205]/80 backdrop-blur-md cursor-pointer"
                onClick={() => setSelectedPitchForDetail(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative w-full sm:max-w-2xl lg:max-w-3xl bg-[#FAF7F0] border-t sm:border border-[#EADFC9] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[86vh] text-ink z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Grab Handle */}
                <div className="w-12 h-1 bg-ink/20 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

                {/* Sticky Header Bar */}
                <div className="px-5 sm:px-7 py-3.5 border-b border-[#EADFC9]/80 flex items-center justify-between bg-white/70 backdrop-blur-md flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-accent/15 text-accent text-[8px] sm:text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-accent/25 uppercase tracking-widest">
                      Book Pitch
                    </span>
                    {selectedPitchForDetail.vibeTags && selectedPitchForDetail.vibeTags[0] && (
                      <span className="bg-burgundy/10 text-burgundy text-[8px] sm:text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-burgundy/15 uppercase tracking-widest">
                        {selectedPitchForDetail.vibeTags[0]}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPitchForDetail(null)}
                    className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 text-ink/60 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrollable Pitch Body */}
                <div className="p-5 sm:p-8 overflow-y-auto paper-scrollbar space-y-6 text-center">
                  
                  {/* Title & Author */}
                  <div className="space-y-1.5 max-w-xl mx-auto">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.28em] text-ink/40">
                      T H E   C O N V I N C E - M E   S A L O N
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-burgundy tracking-tight">
                      {selectedPitchForDetail.bookTitle}
                    </h2>
                    <p className="text-sm sm:text-base font-serif italic text-accent font-bold">
                      by {selectedPitchForDetail.bookAuthor}
                    </p>
                    <div className="w-16 h-px bg-accent/40 mx-auto my-3" />
                  </div>

                  {/* 1. The Hook Line */}
                  <div className="max-w-xl mx-auto text-left space-y-1 bg-white border border-sage/15 p-4 sm:p-5 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-burgundy uppercase tracking-widest block">
                      ✦ Why Your Soul Needs This
                    </span>
                    <p className="text-sm sm:text-base leading-7 text-ink/90 font-serif italic">
                      &ldquo;{selectedPitchForDetail.hookLine}&rdquo;
                    </p>
                  </div>

                  {/* 2. The Emotional Aftertaste */}
                  <div className="max-w-xl mx-auto text-left space-y-1 bg-white border border-sage/15 p-4 sm:p-5 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest block">
                      ✦ The Emotional Aftertaste
                    </span>
                    <p className="text-xs sm:text-sm leading-6 text-ink/80 font-serif">
                      {selectedPitchForDetail.aftertaste}
                    </p>
                  </div>

                  {/* 3. Killer Quote (if exists) */}
                  {selectedPitchForDetail.killerQuote && (
                    <div className="max-w-xl mx-auto text-left space-y-1 bg-cream/70 border border-[#EADFC9] p-4 sm:p-5 rounded-2xl">
                      <span className="text-[9px] font-mono font-bold text-[#8B7355] uppercase tracking-widest block">
                        ✦ Resonant Excerpt
                      </span>
                      <p className="text-xs sm:text-sm leading-6 text-burgundy font-serif italic">
                        &ldquo;{selectedPitchForDetail.killerQuote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Pitcher Byline & Winged Colophon */}
                  <div className="pt-3 border-t border-[#EADFC9]/80 space-y-1.5 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2.5 text-accent text-xs">
                      <span className="w-10 h-px bg-accent/35" />
                      <span>❦</span>
                      <span className="w-10 h-px bg-accent/35" />
                    </div>
                    <p className="font-display italic text-sm sm:text-base text-burgundy font-bold">
                      Pitched by {selectedPitchForDetail.authorName}
                    </p>
                  </div>

                  {/* Action Bar: Pledge & Broadsheet */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleTogglePledge(selectedPitchForDetail)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        pledgeOverrides[selectedPitchForDetail.id]?.userPledged ?? selectedPitchForDetail.userPledged
                          ? 'bg-[#c96a42] text-cream'
                          : 'bg-white text-ink/75 border border-sage/25 hover:border-burgundy'
                      }`}
                    >
                      <span>🍃</span>
                      <span>
                        {pledgeOverrides[selectedPitchForDetail.id]?.userPledged ?? selectedPitchForDetail.userPledged
                          ? 'Convinced! (Added to TBR)'
                          : 'I’m Convinced! (Add to TBR)'} (
                        {pledgeOverrides[selectedPitchForDetail.id]?.pledgeCount ?? selectedPitchForDetail.pledgeCount}
                        )
                      </span>
                    </button>

                    <button
                      onClick={() => handleDownloadPitchCard(selectedPitchForDetail)}
                      className="px-5 py-2.5 rounded-xl bg-burgundy hover:bg-ink text-cream text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Download size={13} />
                      <span>Download Pitch Card</span>
                    </button>
                  </div>

                  {/* ── PARCHMENT NOTES (DEBATE & BANTER) ── */}
                  <div className="border-t border-[#EADFC9]/80 pt-5 space-y-4 text-left max-w-xl mx-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-base sm:text-lg text-burgundy flex items-center gap-1.5">
                        <MessageSquare size={15} className="text-accent" />
                        <span>Pitch Banter &amp; Notes ({notes.length})</span>
                      </h3>
                      <span className="text-[9px] text-ink/40 font-mono">Reader Debates</span>
                    </div>

                    {/* Notes List */}
                    {loadingNotes ? (
                      <div className="space-y-2">
                        <div className="h-10 bg-white/60 rounded-xl animate-pulse" />
                        <div className="h-10 bg-white/60 rounded-xl animate-pulse" />
                      </div>
                    ) : notes.length === 0 ? (
                      <p className="text-xs text-ink/50 font-serif italic bg-white/40 border border-dashed border-sage/20 p-3.5 rounded-xl text-center">
                        No banter notes on this pitch yet. Did they convince you or do you have doubts?
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {notes.map((n) => (
                          <div key={n.id} className="bg-white border border-sage/15 p-3 sm:p-3.5 rounded-2xl space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-burgundy font-sans">{n.displayName}</span>
                              <span className="text-ink/35 font-mono">
                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                              </span>
                            </div>
                            <p className="text-xs text-ink/80 font-serif leading-relaxed">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Note Form */}
                    {currentUser ? (
                      <form onSubmit={handlePostNote} className="space-y-2 pt-1">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={notePenName}
                            onChange={(e) => setNotePenName(e.target.value)}
                            placeholder="Your Pen Name (Optional)"
                            className="sm:w-1/3 bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy"
                          />
                          <div className="flex-1 flex gap-1.5">
                            <input
                              type="text"
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              placeholder="Join the pitch debate..."
                              className="flex-1 bg-white border border-sage/25 rounded-xl py-2 px-3 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-burgundy"
                            />
                            <button
                              type="submit"
                              disabled={submittingNote || !newNoteText.trim()}
                              className="bg-burgundy hover:bg-ink text-cream px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 flex-shrink-0"
                            >
                              <Send size={11} />
                              <span>Send</span>
                            </button>
                          </div>
                        </div>
                        {noteError && (
                          <p className="text-[10px] text-burgundy font-bold">{noteError}</p>
                        )}
                      </form>
                    ) : (
                      <div className="bg-white/70 border border-sage/20 p-2.5 rounded-xl text-center">
                        <Link href="/sign-in?redirect_url=/convince-me" className="text-xs font-bold text-burgundy hover:underline">
                          Sign in to join the pitch debate ✍️
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </main>
  );
}
