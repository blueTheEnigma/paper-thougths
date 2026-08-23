"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Quote, Copy, Check, Sparkles, Filter, Search, 
  BookOpen, Eye, Send, Star, CheckCircle2, Bookmark,
  Layers, ExternalLink, MessageSquare, X, Feather, MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminQuotesTab({ submissions = [] }) {
  const [viewMode, setViewMode] = useState('gold'); // 'gold' or 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedSubForRead, setSelectedSubForRead] = useState(null);
  
  // Track quotes marked as used or starred
  const [postedQuoteIds, setPostedQuoteIds] = useState(new Set());
  const [starredQuoteIds, setStarredQuoteIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [captionCopiedId, setCaptionCopiedId] = useState(null);

  // Derive all quotes from submissions (logline, excerpt, stanzas)
  const quotesList = useMemo(() => {
    return submissions.map(sub => {
      // Standout quote candidates
      const quoteText = sub.logline || (sub.bodyText ? sub.bodyText.slice(0, 200).trim() + '...' : sub.title);
      const isLaureled = !!sub.laurel || !!sub.has_laurel;
      const isPoetry = (sub.genre || '').toLowerCase().includes('poetry');

      return {
        id: sub.id,
        quote: quoteText,
        fullBody: sub.bodyText || '',
        title: sub.title || 'Untitled Manuscript',
        author: sub.author || 'Anonymous Writer',
        authorInstagram: sub.authorInstagram || sub.instagram || '',
        authorEmail: sub.authorEmail || sub.email || '',
        chapter: sub.chapter || 'Clubhouse Member',
        genre: sub.genre || 'Literature',
        date: sub.date ? new Date(sub.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Batch',
        isLaureled,
        isPoetry,
        wordCount: sub.bodyText ? sub.bodyText.split(/\s+/).length : 0,
        status: sub.status || 'active_batch'
      };
    });
  }, [submissions]);

  // Filtered & Ranked Quotes
  const filteredQuotes = useMemo(() => {
    return quotesList.filter(item => {
      // 1. Genre filter
      if (selectedGenre !== 'All' && item.genre.toLowerCase() !== selectedGenre.toLowerCase()) {
        return false;
      }
      // 2. Chapter filter
      if (selectedChapter !== 'All' && !item.chapter.toLowerCase().includes(selectedChapter.toLowerCase())) {
        return false;
      }
      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          item.quote.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.chapter.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // 4. Mode filter
      if (viewMode === 'gold') {
        // Gold mode prioritizes laureled, poetry, starred, or punchy quotes
        return item.isLaureled || item.isPoetry || starredQuoteIds.has(item.id) || (item.quote.length >= 25 && item.quote.length <= 220);
      }
      return true;
    });
  }, [quotesList, selectedGenre, selectedChapter, searchQuery, viewMode, starredQuoteIds]);

  // 1-Click Copy Quote Text for Figma
  const handleCopyQuoteText = (item) => {
    const cleanText = item.quote.replace(/^["“]|["”]$/g, '').trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Copy Instagram/Twitter Caption
  const handleCopyCaption = (item) => {
    const handle = item.authorInstagram ? `@${item.authorInstagram.replace('@', '')}` : item.author;
    const caption = `“${item.quote.trim()}”\n\n— ${handle} (${item.chapter})\n\nFrom '${item.title}' in the Writers’ Village at Paper Thoughts.\nWe live in the lines: paperthoughts.org\n\n#PaperThoughts #AfricanLiterature #WritersVillage #WeLiveInTheLines #NigerianWriters`;
    
    navigator.clipboard.writeText(caption);
    setCaptionCopiedId(item.id);
    setTimeout(() => setCaptionCopiedId(null), 2000);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#F2A98A', '#5C1A2E', '#C96A42']
    });
  };

  const togglePosted = (id) => {
    setPostedQuoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStar = (id) => {
    setStarredQuoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8 text-cream">
      
      {/* 1. Header & Strategy Notice */}
      <div className="bg-gradient-to-r from-[#20070e] via-[#120308] to-[#2c0b15] border border-[#F2A98A]/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5c1a2e]/60 border border-[#F2A98A]/30 text-[#F2A98A] text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Social Media Moderator Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
            Social Quotes &amp; Sparks Vault
          </h2>
          <p className="text-xs sm:text-sm text-cream/70 font-serif leading-relaxed">
            Curated quotes harvested from weekly manuscripts. Copy text directly into your Figma templates and export ready-to-post Instagram/Twitter captions in 1 click.
          </p>
        </div>

        {/* View Mode Toggle (Curated Gold vs Full Stream) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#080104] border border-[#F2A98A]/25 relative z-10 flex-shrink-0">
          <button
            onClick={() => setViewMode('gold')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'gold'
                ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream shadow-md'
                : 'text-cream/50 hover:text-cream'
            }`}
          >
            <Sparkles size={13} />
            <span>Curated Gold ({quotesList.filter(q => q.isLaureled || q.isPoetry).length})</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream shadow-md'
                : 'text-cream/50 hover:text-cream'
            }`}
          >
            <Layers size={13} />
            <span>All Stream ({quotesList.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Suite */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            type="text"
            placeholder="Search by quote, author, title, chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-cream placeholder-cream/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Chapter Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-cream/70">
            <MapPin size={13} />
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="bg-[#080104] border border-[#F2A98A]/20 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none"
            >
              <option value="All">All Chapters</option>
              <option value="Zaria">Zaria (ABU)</option>
              <option value="Kaduna">Kaduna</option>
              <option value="Abuja">Abuja</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-cream/70">
            <Feather size={13} />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-[#080104] border border-[#F2A98A]/20 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none"
            >
              <option value="All">All Genres</option>
              <option value="Fiction">Fiction</option>
              <option value="Poetry">Poetry</option>
              <option value="Drama">Drama</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Memoir">Memoir</option>
            </select>
          </div>
        </div>

      </div>

      {/* 3. Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-[#120308]/60 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3">
          <Quote size={32} className="mx-auto text-cream/30" />
          <h4 className="text-lg font-serif font-bold text-cream">No quotes match your filters</h4>
          <p className="text-xs text-cream/60 max-w-sm mx-auto">
            Try switching to 'All Stream' or resetting your search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((item) => {
            const isPosted = postedQuoteIds.has(item.id);
            const isStarred = starredQuoteIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between space-y-5 transition-all duration-300 relative group overflow-hidden ${
                  isPosted 
                    ? 'bg-[#080104]/80 border-white/10 opacity-70' 
                    : isStarred
                    ? 'bg-[#1c060d] border-[#F2A98A]/50 shadow-lg'
                    : 'bg-[#120308]/90 hover:bg-[#15040a] border-[#F2A98A]/20 hover:border-[#F2A98A]/40 shadow-md'
                }`}
              >
                {/* Top Status & Meta Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#5c1a2e]/50 border border-[#F2A98A]/25 text-[#F2A98A]">
                        {item.genre}
                      </span>
                      {item.isLaureled && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#C96A42]/30 text-[#F2A98A] border border-[#C96A42]/40">
                          👑 Laureled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStar(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isStarred ? 'text-amber-400 bg-amber-400/10' : 'text-cream/30 hover:text-cream'
                        }`}
                        title={isStarred ? "Starred" : "Star quote"}
                      >
                        <Star size={14} className={isStarred ? "fill-current" : ""} />
                      </button>

                      <button
                        onClick={() => togglePosted(item.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                          isPosted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-cream/40 hover:text-cream'
                        }`}
                        title="Mark as posted on socials"
                      >
                        {isPosted ? '✓ Posted' : 'Mark Posted'}
                      </button>
                    </div>
                  </div>

                  {/* The Quote */}
                  <div className="space-y-2">
                    <p className="text-base font-serif italic text-cream leading-relaxed line-clamp-4">
                      “{item.quote}”
                    </p>
                  </div>
                </div>

                {/* Author & Manuscript Details */}
                <div className="space-y-3 border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between text-xs font-serif">
                    <div>
                      <p className="font-bold text-[#F2A98A] leading-tight">{item.author}</p>
                      <p className="text-[11px] text-cream/50 font-mono">
                        {item.chapter} {item.authorInstagram ? `• @${item.authorInstagram.replace('@','')}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedSubForRead(item)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-cream text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                      title="Read full manuscript (Read-only)"
                    >
                      <Eye size={12} />
                      <span>Read Story</span>
                    </button>
                  </div>

                  {/* Actions: Copy for Figma & Copy Caption */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyQuoteText(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-cream text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Copy plain text to paste into Figma text frame"
                    >
                      {copiedId === item.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      <span>{copiedId === item.id ? "Copied for Figma!" : "Copy for Figma"}</span>
                    </button>

                    <button
                      onClick={() => handleCopyCaption(item)}
                      className="py-2 px-3 rounded-xl bg-[#5c1a2e]/60 hover:bg-[#5c1a2e] text-[#F2A98A] hover:text-cream border border-[#F2A98A]/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Copy ready-to-post Instagram/Twitter caption"
                    >
                      {captionCopiedId === item.id ? <Check size={13} className="text-green-400" /> : <Send size={13} />}
                      <span>{captionCopiedId === item.id ? "Caption Copied!" : "Copy Caption"}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. Read-Only Full Manuscript Inspection Modal */}
      <AnimatePresence>
        {selectedSubForRead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#140409] border border-[#F2A98A]/30 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative text-cream flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080104]/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center">
                    <BookOpen size={15} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-cream">{selectedSubForRead.title}</h3>
                    <p className="text-[10px] font-mono text-[#F2A98A]">
                      By {selectedSubForRead.author} • {selectedSubForRead.chapter} (Moderator Read-Only View)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubForRead(null)}
                  className="text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Manuscript Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
                
                {/* Meta details */}
                <div className="p-4 rounded-2xl bg-[#080104] border border-white/5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cream/60">
                    <span>Genre: <strong className="text-cream">{selectedSubForRead.genre}</strong></span>
                    <span>Words: <strong className="text-cream">{selectedSubForRead.wordCount}</strong></span>
                    <span>Date: <strong className="text-cream">{selectedSubForRead.date}</strong></span>
                  </div>
                  {selectedSubForRead.authorInstagram && (
                    <p className="text-xs font-mono text-[#F2A98A]">
                      Instagram Handle: <strong>@{selectedSubForRead.authorInstagram.replace('@','')}</strong>
                    </p>
                  )}
                </div>

                {/* Logline quote */}
                <div className="p-4 rounded-2xl bg-[#5c1a2e]/20 border border-[#F2A98A]/25 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2A98A] font-bold">
                    Author’s Curated Logline
                  </span>
                  <p className="text-sm font-serif italic text-cream leading-relaxed">
                    "{selectedSubForRead.quote}"
                  </p>
                </div>

                {/* Full Body */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cream/50 font-bold block">
                    Full Manuscript Text
                  </span>
                  <div className="text-sm font-serif text-cream/85 leading-relaxed whitespace-pre-wrap bg-[#080104]/50 p-4 rounded-2xl border border-white/5">
                    {selectedSubForRead.fullBody || "No body text uploaded."}
                  </div>
                </div>

              </div>

              {/* Footer Quick Copy Actions */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#080104]/80 gap-3">
                <button
                  onClick={() => handleCopyQuoteText(selectedSubForRead)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-cream text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Logline for Figma</span>
                </button>

                <button
                  onClick={() => handleCopyCaption(selectedSubForRead)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Send size={13} />
                  <span>Copy Social Caption</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
