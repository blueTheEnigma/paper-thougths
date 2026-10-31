"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Feather, Sparkles, Send, Loader2, 
  BookOpen, Calendar, MapPin, CheckCircle2, ShieldCheck
} from 'lucide-react';

export default function Landing({ images, books = [], storyPrompt, poemPrompt, botmBook, generalBotm }) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterLoading(true);
    setNewsletterStatus(null);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterStatus({ type: 'success', message: data.message });
        setNewsletterEmail("");
      } else {
        setNewsletterStatus({ type: 'error', message: data.error || 'Subscription failed.' });
      }
    } catch (err) {
      console.error(err);
      setNewsletterStatus({ type: 'error', message: 'Failed to connect. Please try again.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  const slideImages = [
    ...(images?.community || []),
    ...(images?.art || [])
  ].filter(Boolean);

  const fallbackImages = slideImages.length > 0 
    ? slideImages 
    : [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200"
    ];

  const fallbackFeaturedBooks = [
    {
      id: "1",
      title: "The Death of Vivek Oji",
      author: "Akwaeke Emezi",
      genre: "Fiction",
      price: "6500",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&h=600&fit=crop"
    },
    {
      id: "2",
      title: "Stay With Me",
      author: "Ayobami Adebayo",
      genre: "Fiction",
      price: "5500",
      imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&h=600&fit=crop"
    },
    {
      id: "3",
      title: "Akata Witch",
      author: "Nnedi Okorafor",
      genre: "Fantasy",
      price: "6000",
      imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&h=600&fit=crop"
    },
    {
      id: "4",
      title: "Chronicles from the Happiest People",
      author: "Wole Soyinka",
      genre: "Satire",
      price: "8500",
      imageUrl: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400&h=600&fit=crop"
    }
  ];

  const bookstoreList = books && books.length > 0 ? books.slice(0, 4) : fallbackFeaturedBooks;

  const fallbackBotm = {
    id: 17,
    title: 'Red Rising',
    author: 'Pierce Brown',
    imageUrl: '/images/red_rising.jpg',
    teaser: `“I would have lived in peace, but my enemies brought me war.”\n\nDarrow is a Red, a member of the lowest caste in the color-coded society of the future. Fueled by grief and a burning desire for justice, Darrow sacrifices everything to infiltrate the legendary Institute, a brutal proving ground where the dominant caste’s best and brightest vie for power.`
  };

  const activeBotm = botmBook || generalBotm || fallbackBotm;

  // Refined scroll animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  return (
    <div className="w-full bg-[#FBF7EE] text-[#120308] selection:bg-[#c96a42]/30 overflow-x-hidden font-sans">
      
      {/* =========================================================================
          1. CINEMATIC HERO (Singular Undisputed Anchor — Things 1, 5, 40, 45)
          ========================================================================= */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center bg-[#120308] overflow-hidden text-[#FBF7EE] -mt-20 md:-mt-32">
        {/* Ambient Dark Parchment Texture & Subtle Vignette */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img 
              src={fallbackImages[0]} 
              className="w-full h-full object-cover filter grayscale contrast-125 saturate-50"
              alt="Paper Thoughts Clubhouse Atmosphere"
            />
          </motion.div>
          {/* Layered Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120308] via-[#120308]/75 to-[#120308]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(201,106,66,0.15)_0%,transparent_65%)]" />
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 text-center space-y-8 pt-24 pb-16">
          
          {/* Eyebrow: Explicit Cultural & Geographic Anchor (Thing 14) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-[#F2A98A] uppercase tracking-[0.25em] font-sans font-bold text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#c96a42] animate-pulse" />
              The Physical Literary Clubhouse · Zaria · Kaduna · Abuja
            </span>
          </motion.div>

          {/* Master Headline: Iconic Literary Thesis */}
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-display leading-[1.08] tracking-tight font-extrabold text-[#FBF7EE]"
          >
            We came for <span className="italic text-[#c96a42]">the books.</span><br/>
            We stayed for <span className="text-[#F2A98A] italic">the chaos.</span>
          </motion.h1>

          {/* Subtitle: High-Contrast Clarity */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base sm:text-lg text-[#FBF7EE]/90 max-w-2xl mx-auto font-serif leading-relaxed"
          >
            An opinionated reading community spanning Northern Nigeria. 
            We read heavily, debate fiercely, and never use PDFs.
          </motion.p>
          
          {/* Action Row: ONE Dominant Copper Button + Subtle Secondary Route (Things 5, 40, 92) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
          >
            <Link 
              href="/bookstore" 
              className="w-full sm:w-auto bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308] px-9 py-4 uppercase tracking-widest text-xs font-bold transition-all shadow-xl rounded-xl flex items-center justify-center gap-3 hover:-translate-y-0.5 active:scale-95 cursor-pointer font-sans"
            >
              <span>Browse Physical Hardcopies</span>
              <ArrowRight size={16} />
            </Link>

            <Link 
              href="/village" 
              className="text-xs uppercase tracking-widest font-bold text-[#FBF7EE]/80 hover:text-[#F2A98A] transition-colors py-3 px-4 inline-flex items-center gap-2 group font-sans"
            >
              <span>or join the weekly critique cycle</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </div>
        
        {/* Subtle Scroll Cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50 text-[#FBF7EE]">
          <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold">Scroll to Enter Library</span>
          <div className="w-[1px] h-5 bg-gradient-to-b from-[#FBF7EE] to-transparent" />
        </div>
      </section>

      {/* =========================================================================
          BLOCK 1: THE CURATED BOOKSTORE (Tactile Physicality — Things 74, 92, 100)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#FBF7EE] border-b border-[#20070e]/10 relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-7xl mx-auto space-y-14"
        >
          {/* Editorial Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#c96a42] uppercase tracking-[0.25em] font-sans font-bold text-xs block">
              Curated Physical Editions · No PDFs
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#20070e] font-bold tracking-tight">
              The Bookstore
            </h2>
            <p className="text-sm md:text-base text-[#120308]/75 font-serif leading-relaxed">
              Every book on our shelf is an authentic physical volume. Hand-delivered across Zaria, Kaduna, and Abuja. We do not stock PDFs.
            </p>
          </div>

          {/* 3D Tactile Book Cards Grid (Invariant Compliance: Inline Perspective & Transform) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {bookstoreList.map((book) => (
              <motion.div 
                key={book.id} 
                variants={fadeIn} 
                className="flex"
                style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
              >
                <Link 
                  href="/bookstore" 
                  className="group flex flex-col justify-between w-full transition-transform duration-300"
                  style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
                >
                  <div className="space-y-4 w-full">
                    {/* Book Cover with Tactile Spine & Drop Shadow */}
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border border-[#20070e]/10 bg-white relative group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1.5">
                      <img 
                        src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Tactile Book Spine Gradient */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 via-white/10 to-transparent pointer-events-none" />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-[#20070e]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-[#FBF7EE] text-[#20070e] text-[10px] font-sans font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                          View Details
                        </span>
                      </div>
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#c96a42] uppercase tracking-wider block">
                        {book.genre || 'Physical Hardcopy'}
                      </span>
                      <h4 className="font-display font-bold text-[#20070e] leading-snug line-clamp-1 group-hover:text-[#c96a42] transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#120308]/65 truncate font-serif italic">
                        by {book.author}
                      </p>
                      <div className="pt-1 flex items-baseline justify-between">
                        <span className="font-display font-bold text-[#20070e] text-sm">
                          ₦{parseInt(book.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#120308]/50 uppercase tracking-widest font-sans font-semibold">
                          In Stock
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bookstore CTA */}
          <div className="text-center pt-2">
            <Link 
              href="/bookstore" 
              className="bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] px-8 py-3.5 uppercase tracking-widest text-xs font-bold transition-all shadow-md rounded-xl inline-flex items-center gap-3 hover:-translate-y-0.5 active:scale-95"
            >
              <span>Explore All Hardcopies in Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          BLOCK 2: THE SANCTUARY READING LOUNGE (Book of the Month — Things 56, 65)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#F5EDE0] border-b border-[#20070e]/10 relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeIn}
          className="max-w-5xl mx-auto space-y-10"
        >
          {/* Section Eyebrow */}
          <div className="text-center space-y-2">
            <span className="text-[#c96a42] uppercase tracking-[0.25em] font-sans font-bold text-xs block">
              Synchronous Reading Cycle · All Chapters
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#20070e] font-bold tracking-tight">
              The Sanctuary Reading Lounge
            </h2>
          </div>

          {/* Unified Reading Spotlight Card */}
          <div className="bg-[#FAF5EE] border border-[#20070e]/15 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            {/* Ambient Background Warmth */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#c96a42]/10 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Book Cover */}
            <div 
              className="w-44 sm:w-52 aspect-[2/3] overflow-hidden rounded-2xl shadow-2xl relative flex-shrink-0 border border-[#20070e]/15 group"
              style={{ perspective: '1000px', WebkitPerspective: '1000px' }}
            >
              <img 
                src={activeBotm.imageUrl || '/images/red_rising.jpg'} 
                alt={activeBotm.title} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/red_rising.jpg';
                }}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
            </div>

            {/* Book & Discussion Overview */}
            <div className="flex-1 space-y-5 text-center md:text-left">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c96a42] uppercase tracking-wider bg-[#c96a42]/10 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c96a42] animate-pulse" />
                  Active Book of the Month
                </span>
                <h3 className="text-2xl sm:text-4xl font-display text-[#20070e] font-bold leading-tight">
                  {activeBotm.title}
                </h3>
                <p className="text-sm font-semibold text-[#c96a42] font-sans">
                  by {activeBotm.author}
                </p>
              </div>

              {/* Literary Teaser Quote (Thing 18: optimal line length) */}
              <p className="text-sm md:text-base text-[#120308]/80 font-serif italic leading-relaxed max-w-xl">
                "{activeBotm.teaser || "A magnificent masterwork handpicked by the community editors. Available for checkout and discussions across all physical chapters."}"
              </p>

              {/* Community Pulse & CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/discussion"
                  className="w-full sm:w-auto bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] px-8 py-3.5 uppercase tracking-widest text-xs font-bold transition-all shadow-md rounded-xl inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>Enter Discussion & Reviews</span>
                  <ArrowRight size={14} />
                </Link>

                <span className="text-xs text-[#120308]/60 font-serif italic">
                  Read synchronously with members in Zaria, Kaduna & Abuja.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          BLOCK 3: THE SCRIBE'S DESK (Unified Village & Prompts — Things 17, 34, 50)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#120308] text-[#FBF7EE] border-b border-white/10 relative overflow-hidden">
        {/* Ambient Warm Burgundy Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#20070e]/40 rounded-full blur-[140px] pointer-events-none -z-10" />

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-7xl mx-auto space-y-14"
        >
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#F2A98A] uppercase tracking-[0.25em] font-sans font-bold text-xs block">
              The Creative Portal
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#FBF7EE] font-bold tracking-tight">
              Writers' Village & Active Prompts
            </h2>
            <p className="text-sm md:text-base text-[#FBF7EE]/70 font-serif leading-relaxed">
              Every week, Northern Nigerian scribes submit anonymous drafts to our peer review circle. Queue your draft before Saturday 8:00 PM WAT.
            </p>
          </div>

          {/* Consolidated 2-Column Split: Village Sanctuary on Left, 2 Prompts on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: The Village Portal Card (5 Columns) */}
            <motion.div 
              variants={fadeIn}
              className="lg:col-span-5 bg-gradient-to-br from-[#20070e] via-[#2A0B14] to-[#120308] border border-[#c96a42]/30 p-8 md:p-10 rounded-3xl shadow-xl flex flex-col justify-between space-y-6"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-[#F2A98A] text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                    <Feather size={14} className="text-[#c96a42]" />
                    Weekly Critique Cycle
                  </span>
                  <span className="text-[10px] bg-white/10 border border-white/10 text-[#FBF7EE] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                    Saturday Drops
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-display text-[#FBF7EE] font-bold leading-tight">
                  The Scribe's Sanctuary
                </h3>

                <p className="text-sm text-[#FBF7EE]/80 font-serif leading-relaxed">
                  Submit prose or verse under an anonymous pen name. Our 3-lens peer review system ensures unvarnished, constructive critique. Earn Leaves and Milestone Tokens with every review you give.
                </p>

                {/* Scannable Micro-Rules (Thing 17) */}
                <div className="space-y-2 pt-2 text-xs font-sans text-[#FBF7EE]/75">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#c96a42]" />
                    <span>Double-blind anonymous peer feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#c96a42]" />
                    <span>Earn 10 Leaves per thoughtful critique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#c96a42]" />
                    <span>Unlock physical clubhouse publishing honors</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link 
                  href="/village" 
                  className="w-full bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308] py-3.5 px-6 rounded-xl uppercase tracking-widest text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-3 hover:-translate-y-0.5 active:scale-95 cursor-pointer font-sans"
                >
                  <span>Enter The Writers' Village</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Right: The 2 Active Prompts (7 Columns) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Story Prompt */}
              <motion.div 
                variants={fadeIn}
                className="bg-[#1E110A] border border-[#c96a42]/25 p-7 rounded-3xl shadow-lg flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#F2A98A] bg-[#F2A98A]/10 border border-[#F2A98A]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Story Prompt
                    </span>
                    <Feather size={14} className="text-[#F2A98A]" />
                  </div>
                  <h4 className="text-xl font-display text-[#FBF7EE] font-bold">
                    Prose & Narrative
                  </h4>
                  <p className="text-xs sm:text-sm text-[#FBF7EE]/80 font-serif italic bg-white/5 p-4 rounded-xl border border-white/5 min-h-[110px] flex items-center">
                    "{storyPrompt}"
                  </p>
                </div>

                <Link 
                  href={`/village?redirect=${encodeURIComponent('/dashboard/write?type=story')}`}
                  className="w-full bg-[#F2A98A] hover:bg-white text-[#120308] text-center font-sans font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <span>Draft Story Manuscript</span>
                  <ArrowRight size={13} />
                </Link>
              </motion.div>

              {/* Poem Prompt */}
              <motion.div 
                variants={fadeIn}
                className="bg-[#1A0C16] border border-[#F2A98A]/25 p-7 rounded-3xl shadow-lg flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#F2A98A] bg-[#F2A98A]/10 border border-[#F2A98A]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Poem Prompt
                    </span>
                    <Sparkles size={14} className="text-[#F2A98A]" />
                  </div>
                  <h4 className="text-xl font-display text-[#FBF7EE] font-bold">
                    Verse & Poetry
                  </h4>
                  <p className="text-xs sm:text-sm text-[#FBF7EE]/80 font-serif italic bg-white/5 p-4 rounded-xl border border-white/5 min-h-[110px] flex items-center">
                    "{poemPrompt}"
                  </p>
                </div>

                <Link 
                  href={`/village?redirect=${encodeURIComponent('/dashboard/write?type=poem')}`}
                  className="w-full bg-[#c96a42] hover:bg-white text-[#120308] text-center font-sans font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <span>Compose Verse Draft</span>
                  <ArrowRight size={13} />
                </Link>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          BLOCK 4: PHYSICAL GATHERINGS & DISPATCH (Assembly & Newsletter)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#FBF7EE] relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-6xl mx-auto space-y-16"
        >
          {/* Part A: The Assembly Events Spotlight (Replaces Separate Chapters) */}
          <div className="bg-[#FAF5EE] border border-[#20070e]/15 rounded-3xl p-8 md:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-[#c96a42] uppercase tracking-[0.25em] font-sans font-bold text-xs block flex items-center justify-center md:justify-start gap-2">
                <Calendar size={14} />
                In-Person Fellowship & Debates
              </span>
              <h3 className="text-2xl sm:text-4xl font-display text-[#20070e] font-bold tracking-tight">
                The Assembly & City Readings
              </h3>
              <p className="text-sm md:text-base text-[#120308]/75 font-serif leading-relaxed">
                Step beyond the screen. We meet monthly in quiet cafes, libraries, and book parlors across Zaria, Kaduna, and Abuja. No separate club fees—simply RSVP on the Events calendar and join the table.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link 
                href="/events" 
                className="bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all shadow-md rounded-xl inline-flex items-center gap-3 hover:-translate-y-0.5 active:scale-95 font-sans"
              >
                <span>View Events & RSVP</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Part B: The Weekly Dispatch (Newsletter) */}
          <div className="max-w-3xl mx-auto text-center space-y-8 bg-[#120308] text-[#FBF7EE] p-8 md:p-12 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c96a42]/15 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="space-y-3">
              <span className="text-[#F2A98A] uppercase tracking-[0.25em] font-sans font-bold text-xs block">
                Stay in the Loop
              </span>
              <h3 className="text-2xl sm:text-4xl font-display text-[#FBF7EE] font-bold leading-tight">
                Join The Weekly Dispatch
              </h3>
              <p className="text-xs sm:text-sm text-[#FBF7EE]/70 max-w-md mx-auto font-serif leading-relaxed">
                Weekly prompt releases, curated book arrivals, and city meetup alerts delivered straight to your inbox. No spam. Ever.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  required 
                  disabled={newsletterLoading}
                  placeholder="Enter your email address..." 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:border-[#F2A98A] text-[#FBF7EE] placeholder-[#FBF7EE]/30 transition-all font-sans"
                />
                <button 
                  type="submit" 
                  disabled={newsletterLoading}
                  className="bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308] font-sans font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md active:scale-95 flex-shrink-0"
                >
                  {newsletterLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Inking...</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <Send size={13} />
                    </>
                  )}
                </button>
              </div>
              
              {newsletterStatus && (
                <p className={`text-xs font-bold pt-1 ${newsletterStatus.type === 'success' ? 'text-[#F2A98A]' : 'text-red-400'}`}>
                  {newsletterStatus.message}
                </p>
              )}
            </form>
          </div>

        </motion.div>
      </section>

    </div>
  );
}
