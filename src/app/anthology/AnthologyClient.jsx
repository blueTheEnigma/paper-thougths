"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, Feather, ArrowLeft, Calendar, 
  Share2, Award, ChevronDown, BookMarked, Check, Heart
} from 'lucide-react';
import ShareableLaureateCard from '@/components/anthology/ShareableLaureateCard';
import LiteraryEngagementBar from '@/components/common/LiteraryEngagementBar';

export default function AnthologyClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeCategory, setActiveCategory] = useState('story'); // 'story' | 'poem'
  const [readingPiece, setReadingPiece] = useState(null);

  const fetchAnthology = async (month = null) => {
    setLoading(true);
    try {
      const url = month ? `/api/anthology?monthYear=${month}` : '/api/anthology';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.issue?.monthYear && !selectedMonth) {
          setSelectedMonth(json.issue.monthYear);
        }
      }
    } catch (err) {
      console.error('Failed to load anthology:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnthology(selectedMonth);
  }, [selectedMonth]);

  // Auto-sync Book Zodiac test results from local device to server profile if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pt_zodiac_result');
      if (stored) {
        try {
          const chart = JSON.parse(stored);
          const primaryArchetype = chart?.sunSign?.archetypeMatches?.[0] || chart?.sunSign?.name?.toLowerCase();
          if (primaryArchetype) {
            fetch('/api/archetype', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                archetype: primaryArchetype,
                zodiacSign: chart?.sunSign?.name,
                scores: chart?.scores
              })
            })
            .then(res => res.json())
            .then(resData => {
              if (resData?.success && resData?.rewarded) {
                // If newly saved/updated, refresh anthology view so laureate cards reflect the synced archetype
                fetchAnthology(selectedMonth);
              }
            })
            .catch(() => {});
          }
        } catch (e) {
          console.error("Zodiac sync error:", e);
        }
      }
    }
  }, [selectedMonth]);

  const issue = data?.issue;
  const currentWorks = activeCategory === 'story' ? (issue?.stories || []) : (issue?.poems || []);

  const formatMonthName = (my) => {
    if (!my) return 'Current Edition';
    if (my.includes('-')) {
      const [y, m] = my.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    return my;
  };

  return (
    <main className="min-h-screen bg-[#FBF7EE] text-[#20070e] pt-24 pb-24 px-4 sm:px-6 lg:px-8 selection:bg-[#F2A98A]/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Navigation & Archive Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#20070e]/10 pb-6">
          <Link 
            href="/village/gallery" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#20070e]/70 hover:text-[#c96a42] transition-colors"
          >
            <ArrowLeft size={14} /> The Living Salon
          </Link>

          {data?.allIssues?.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-[#20070e]/50">Archive Edition:</span>
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-[#20070e]/15 rounded-xl py-1.5 px-3 text-xs font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
              >
                {data.allIssues.map((iss) => (
                  <option key={iss.monthYear} value={iss.monthYear}>
                    {formatMonthName(iss.monthYear)} · {iss.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Hero Title & Literary Foreword */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c96a42]/30 bg-[#c96a42]/5 text-[#c96a42] text-xs font-bold uppercase tracking-widest">
            <Sparkles size={13} /> The Living Anthology
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#20070e] leading-tight">
            {issue?.displayTitle || "Monthly Laureates & Sanctuary Honors"}
          </h1>

          <p className="text-xs font-mono tracking-widest uppercase text-[#c96a42] font-semibold">
            {formatMonthName(issue?.monthYear)} Edition · Curated by the Chief Editorial Desk
          </p>

          {issue?.curatorForeword && (
            <div className="relative mt-6 pt-6 border-t border-[#20070e]/10 max-w-2xl mx-auto">
              <span className="text-3xl text-[#c96a42]/40 font-serif absolute -top-3 left-1/2 -translate-x-1/2">❦</span>
              <p className="font-serif italic text-base sm:text-lg text-[#20070e]/80 leading-relaxed pt-2">
                "{issue.curatorForeword}"
              </p>
              <p className="text-xs font-bold tracking-wider uppercase text-[#20070e]/60 mt-3">
                — Ufuoma Morgan, Chief Creative Director
              </p>
            </div>
          )}
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white/70 p-1.5 rounded-2xl border border-[#20070e]/10 shadow-xs">
            <button
              onClick={() => setActiveCategory('story')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeCategory === 'story'
                  ? 'bg-[#20070e] text-[#FBF7EE] shadow-sm'
                  : 'text-[#20070e]/60 hover:text-[#20070e]'
              }`}
            >
              <BookOpen size={14} /> Fiction & Prose (Top 3)
            </button>
            <button
              onClick={() => setActiveCategory('poem')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeCategory === 'poem'
                  ? 'bg-[#20070e] text-[#FBF7EE] shadow-sm'
                  : 'text-[#20070e]/60 hover:text-[#20070e]'
              }`}
            >
              <Feather size={14} /> Poetry & Verses (Top 3)
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-[#c96a42] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif italic text-sm text-[#20070e]/60">Unrolling the parchment...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && currentWorks.length === 0 && (
          <div className="bg-white border border-[#20070e]/10 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#c96a42]/10 text-[#c96a42] flex items-center justify-center mx-auto text-xl">
              🌿
            </div>
            <h3 className="font-serif text-2xl text-[#20070e]">Laureates Awaiting Adjudication</h3>
            <p className="text-xs text-[#20070e]/70 leading-relaxed">
              The Chief Editor is currently evaluating this month's manuscripts in the Editor's Desk. The Top 3 will be announced today!
            </p>
          </div>
        )}

        {/* Works Grid: 3D Laureate Card + Literary Showcase */}
        {!loading && currentWorks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {currentWorks.map((work) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col space-y-4"
              >
                {/* 3D Laureate Flip Card */}
                <ShareableLaureateCard
                  category={work.category}
                  rank={work.rank}
                  title={work.title}
                  authorName={work.penName || work.authorName}
                  authorArchetype={work.authorArchetype}
                  chapterName={work.chapterName}
                  monthYear={issue?.monthYear}
                  editorCitation={work.editorCitation}
                  averageRating={work.averageRating}
                  ratingsCount={work.ratingsCount}
                  isEditor={false}
                  onReadPiece={() => setReadingPiece(work)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Commercial Engine: Year-End Anthology Teaser */}
        <div className="mt-16 bg-[#20070e] text-[#FBF7EE] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#c96a42]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#F2A98A] font-bold bg-[#F2A98A]/10 px-3 py-1 rounded-full inline-block">
              Year-End Commercial Print & E-Book
            </span>

            <h2 className="font-serif text-2xl sm:text-4xl text-[#FBF7EE] leading-tight">
              Paper Thoughts Anthology: Volume 1 (2026)
            </h2>

            <p className="text-xs sm:text-sm text-[#FBF7EE]/70 leading-relaxed">
              Every month, our 6 finest laureates earn eternal immortality. In December, all 72 canonical works are bound into our inaugural collector's anthology—featuring exclusive author craft essays, editorial forewords, and deluxe typography.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/bookstore"
                className="bg-[#c96a42] hover:bg-[#F2A98A] text-[#20070e] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <BookMarked size={14} /> Explore The Bookstore
              </Link>
              <Link
                href="/join"
                className="border border-[#FBF7EE]/20 hover:border-[#FBF7EE] text-[#FBF7EE] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Feather size={14} /> Submit Next Month
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Immersive Distraction-Free Manuscript Reader Modal */}
      <AnimatePresence>
        {readingPiece && (
          <div className="fixed inset-0 z-50 bg-[#20070e]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#FBF7EE] text-[#20070e] border border-[#c96a42]/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Reader Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-[#20070e]/10 flex items-center justify-between bg-white/50">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c96a42] font-bold">
                    {readingPiece.rank === 1 ? '1st Place' : readingPiece.rank === 2 ? '2nd Place' : '3rd Place'} · {readingPiece.category === 'poem' ? 'Poem' : 'Short Story'}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#20070e]">
                    "{readingPiece.title}"
                  </h3>
                  <p className="text-xs text-[#20070e]/60">
                    By {readingPiece.penName || readingPiece.authorName} · {readingPiece.chapterName} Chapter
                  </p>
                </div>
                <button
                  onClick={() => setReadingPiece(null)}
                  className="w-9 h-9 rounded-full bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] flex items-center justify-center font-bold text-base transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Reader Body */}
              <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
                
                {/* Editor's Citation Callout */}
                <div className="bg-[#20070e] text-[#FBF7EE] p-5 rounded-2xl border border-[#c96a42]/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#F2A98A] font-bold uppercase tracking-wider">
                    <span>❦</span> Chief Editor's Citation
                  </div>
                  <p className="font-serif italic text-sm text-[#FBF7EE]/90 leading-relaxed">
                    "{readingPiece.editorCitation}"
                  </p>
                  <p className="text-[10px] text-[#FBF7EE]/40 uppercase tracking-widest">
                    — Ufuoma Morgan · Chief Creative Director
                  </p>
                </div>

                {/* Manuscript Full Body */}
                <div className="font-serif text-base sm:text-lg leading-relaxed text-[#20070e]/90 whitespace-pre-line selection:bg-[#F2A98A]/30">
                  {readingPiece.bodyText}
                </div>

                {/* Literary Engagement Bar (5-Quill Literary Ratings, Leaves Tipping Drawer, Reader Notes) */}
                <div className="pt-6 border-t border-[#20070e]/10">
                  <LiteraryEngagementBar
                    submissionId={readingPiece.submissionId}
                    category={readingPiece.category}
                    authorName={readingPiece.penName || readingPiece.authorName}
                  />
                </div>
              </div>

              {/* Reader Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-[#20070e]/10 bg-white/50 flex items-center justify-between">
                <span className="text-[11px] text-[#20070e]/50 font-mono">
                  Paper Thoughts Living Anthology
                </span>
                <button
                  onClick={() => setReadingPiece(null)}
                  className="bg-[#20070e] text-[#FBF7EE] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#c96a42] transition-colors"
                >
                  Close Reader
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

