"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Feather, Sparkles, Send, Loader2, 
  Calendar, MapPin, Users
} from 'lucide-react';

export default function Landing({ 
  images, 
  books = [], 
  storyPrompt, 
  poemPrompt, 
  botmBook, 
  generalBotm,
  nextGathering = null 
}) {
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

  // Editorial Glide Motion Variants
  const glideUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
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
          1. HIGH-FASHION EDITORIAL HERO (Visible Photo · True Thesis · Zero Gimmicks)
          ========================================================================= */}
      <section className="relative w-full min-h-[92vh] flex items-center justify-center bg-[#120308] overflow-hidden text-[#FBF7EE] -mt-20 md:-mt-32">
        
        {/* Layer 0: High-Visibility Background Photo with Natural Warm Glow */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.75 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img 
              src={fallbackImages[0]} 
              className="w-full h-full object-cover filter contrast-[1.08] brightness-[0.88]"
              alt="Paper Thoughts Community Gathering"
            />
          </motion.div>

          {/* Vignette: Light & Atmospheric, Not Muddy */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120308] via-[#120308]/50 to-[#120308]/25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(201,106,66,0.18)_0%,transparent_68%)]" />
        </div>
        
        {/* Layer 1: Editorial Gazette Typography */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 text-center space-y-7 pt-28 pb-16">
          
          {/* Folio Dateline Stamp */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <span className="inline-block text-[#F2A98A] uppercase tracking-[0.3em] font-mono text-[11px] bg-black/40 border border-[#c96a42]/30 px-4 py-1.5 rounded-full backdrop-blur-md">
              EST. 2024 · VOL. I · KADUNA / ZARIA / ABUJA
            </span>
          </motion.div>

          {/* True Thesis Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-display leading-[1.06] tracking-tight font-extrabold text-[#FBF7EE]"
          >
            We came for <span className="italic text-[#c96a42]">the books.</span><br/>
            We stayed for <span className="text-[#F2A98A] italic">the chaos.</span>
          </motion.h1>

          {/* Clean Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base sm:text-lg text-[#FBF7EE]/90 max-w-2xl mx-auto font-serif leading-relaxed"
          >
            An opinionated reading community spanning Northern Nigeria. 
            We read heavily, debate fiercely, and never use PDFs.
          </motion.p>
          
          {/* Primary Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
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
              className="text-xs uppercase tracking-widest font-bold text-[#FBF7EE]/90 hover:text-[#F2A98A] transition-colors py-3 px-4 inline-flex items-center gap-2 group font-sans"
            >
              <span>or join the critique cycle</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </div>

        {/* Minimal Scroll Cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-50 text-[#FBF7EE] pointer-events-none">
          <span className="text-[9px] uppercase tracking-[0.25em] font-mono">Scroll</span>
          <div className="w-[1px] h-4 bg-gradient-to-b from-[#FBF7EE] to-transparent" />
        </div>
      </section>

      {/* =========================================================================
          CHAPTER DIVIDER 1
          ========================================================================= */}
      <div className="flex items-center justify-center gap-4 py-8 text-[#c96a42]/35 bg-[#FBF7EE]">
        <div className="w-16 h-px bg-[#20070e]/10" />
        <span className="text-sm font-serif">❦</span>
        <div className="w-16 h-px bg-[#20070e]/10" />
      </div>

      {/* =========================================================================
          BLOCK 1: THE BOOKSTORE (Curated Physical Volumes · Generous Spacing)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#FBF7EE] border-b border-[#20070e]/10 relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="max-w-7xl mx-auto space-y-16"
        >
          {/* Editorial Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#c96a42] uppercase tracking-[0.25em] font-mono font-bold text-xs block">
              Curated Physical Catalog · Zero PDFs
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#20070e] font-bold tracking-tight">
              The Bookstore
            </h2>
            <p className="text-sm md:text-base text-[#120308]/75 font-serif leading-relaxed">
              Every book on our shelf is an authentic physical volume. Hand-delivered across Zaria, Kaduna, and Abuja.
            </p>
          </div>

          {/* 3D Tactile Book Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {bookstoreList.map((book) => (
              <motion.div 
                key={book.id} 
                variants={glideUp} 
                className="flex"
                style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
              >
                <Link 
                  href="/bookstore" 
                  className="group flex flex-col justify-between w-full transition-transform duration-300"
                  style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
                >
                  <div className="space-y-4 w-full">
                    {/* Book Cover with Tactile Spine */}
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border border-[#20070e]/10 bg-white relative group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1.5">
                      <img 
                        src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Tactile Spine Gradient */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-white/10 to-transparent pointer-events-none" />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-[#20070e]/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-[#FBF7EE] text-[#20070e] text-[10px] font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                          View Hardcopy
                        </span>
                      </div>
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#c96a42] uppercase tracking-wider block">
                        {book.genre || 'Hardcopy'}
                      </span>
                      <h4 className="font-display font-bold text-[#20070e] leading-snug line-clamp-1 group-hover:text-[#c96a42] transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#120308]/65 truncate font-serif italic">
                        by {book.author}
                      </p>
                      <div className="pt-1 flex items-baseline justify-between border-t border-[#20070e]/10">
                        <span className="font-mono font-bold text-[#20070e] text-sm">
                          ₦{parseInt(book.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#120308]/50 uppercase tracking-widest font-mono">
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
          CHAPTER DIVIDER 2
          ========================================================================= */}
      <div className="flex items-center justify-center gap-4 py-8 text-[#c96a42]/35 bg-[#F5EDE0]">
        <div className="w-16 h-px bg-[#20070e]/10" />
        <span className="text-sm font-serif">❦</span>
        <div className="w-16 h-px bg-[#20070e]/10" />
      </div>

      {/* =========================================================================
          BLOCK 2: THE SANCTUARY (Book of the Month Spotlight)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#F5EDE0] border-b border-[#20070e]/10 relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={glideUp}
          className="max-w-5xl mx-auto space-y-12"
        >
          {/* Eyebrow */}
          <div className="text-center space-y-2">
            <span className="text-[#c96a42] uppercase tracking-[0.25em] font-mono font-bold text-xs block">
              Active Synchronous Reading Cycle
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#20070e] font-bold tracking-tight">
              The Sanctuary Reading Lounge
            </h2>
          </div>

          {/* Spotlight Card */}
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
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c96a42] uppercase tracking-wider bg-[#c96a42]/10 px-3 py-1 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c96a42] animate-pulse" />
                  Active Book of the Month
                </span>
                <h3 className="text-2xl sm:text-4xl font-display text-[#20070e] font-bold leading-tight">
                  {activeBotm.title}
                </h3>
                <p className="text-sm font-semibold text-[#c96a42] font-serif italic">
                  by {activeBotm.author}
                </p>
              </div>

              {/* Literary Teaser Quote */}
              <p className="text-sm md:text-base text-[#120308]/80 font-serif italic leading-relaxed max-w-xl">
                "{activeBotm.teaser || "A magnificent masterwork handpicked by the community editors. Available for checkout and discussions across all physical chapters."}"
              </p>

              {/* Discussion CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/discussion"
                  className="w-full sm:w-auto bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] px-8 py-3.5 uppercase tracking-widest text-xs font-bold transition-all shadow-md rounded-xl inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer font-sans"
                >
                  <span>Enter Discussion & Reviews</span>
                  <ArrowRight size={14} />
                </Link>

                <span className="text-xs text-[#120308]/60 font-serif italic">
                  Read synchronously with members across Northern Nigeria.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          CHAPTER DIVIDER 3
          ========================================================================= */}
      <div className="flex items-center justify-center gap-4 py-8 text-[#c96a42]/35 bg-[#120308]">
        <div className="w-16 h-px bg-white/10" />
        <span className="text-sm font-serif text-[#F2A98A]">❦</span>
        <div className="w-16 h-px bg-white/10" />
      </div>

      {/* =========================================================================
          BLOCK 3: THE SCRIBE'S DESK (Writers' Village & Prompts)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#120308] text-[#FBF7EE] border-b border-white/10 relative overflow-hidden">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="max-w-7xl mx-auto space-y-14"
        >
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#F2A98A] uppercase tracking-[0.25em] font-mono font-bold text-xs block">
              The Peer Review Circle
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#FBF7EE] font-bold tracking-tight">
              Writers' Village & Active Prompts
            </h2>
            <p className="text-sm md:text-base text-[#FBF7EE]/70 font-serif leading-relaxed">
              Every week, Northern Nigerian scribes submit anonymous drafts to our double-blind workshop. Queue your draft before Saturday 8:00 PM WAT.
            </p>
          </div>

          {/* Consolidated Split: Village Sanctuary on Left, Prompts on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: The Village Overview Card */}
            <motion.div 
              variants={glideUp}
              className="lg:col-span-5 bg-gradient-to-br from-[#20070e] via-[#2A0B14] to-[#120308] border border-[#c96a42]/30 p-8 md:p-10 rounded-3xl shadow-xl flex flex-col justify-between space-y-6"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-[#F2A98A] text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                    <Feather size={14} className="text-[#c96a42]" />
                    Weekly Critique Cycle
                  </span>
                  <span className="text-[10px] bg-white/10 border border-white/10 text-[#FBF7EE] px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                    Saturday Drops
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-display text-[#FBF7EE] font-bold leading-tight">
                  The Scribe's Sanctuary
                </h3>

                <p className="text-sm text-[#FBF7EE]/80 font-serif leading-relaxed">
                  Submit prose or verse under an anonymous pen name. Our 3-lens peer review system ensures unvarnished, constructive critique. Earn Leaves and Milestone Tokens with every review you give.
                </p>

                <div className="space-y-2 pt-2 text-xs font-sans text-[#FBF7EE]/75">
                  <div className="flex items-center gap-2">
                    <span className="text-[#c96a42] font-bold">•</span>
                    <span>Double-blind anonymous peer feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#c96a42] font-bold">•</span>
                    <span>Earn 10 Leaves per confirmed critique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#c96a42] font-bold">•</span>
                    <span>Top laureates inducted into the permanent Anthology</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link 
                  href="/village" 
                  className="w-full bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308] py-3.5 px-6 rounded-xl uppercase tracking-widest text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-3 hover:-translate-y-0.5 active:scale-95 cursor-pointer font-sans"
                >
                  <span>Enter Writers' Village</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Right: Active Prompts */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Story Prompt */}
              <motion.div 
                variants={glideUp}
                className="bg-[#1E110A] border border-[#c96a42]/25 p-7 rounded-3xl shadow-lg flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#F2A98A] bg-[#F2A98A]/10 border border-[#F2A98A]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Story Prompt
                    </span>
                    <Feather size={14} className="text-[#F2A98A]" />
                  </div>
                  <h4 className="text-xl font-display text-[#FBF7EE] font-bold">
                    Prose &amp; Fiction
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
                variants={glideUp}
                className="bg-[#1A0C16] border border-[#F2A98A]/25 p-7 rounded-3xl shadow-lg flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#F2A98A] bg-[#F2A98A]/10 border border-[#F2A98A]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Poem Prompt
                    </span>
                    <Sparkles size={14} className="text-[#F2A98A]" />
                  </div>
                  <h4 className="text-xl font-display text-[#FBF7EE] font-bold">
                    Verse &amp; Poetry
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
          CHAPTER DIVIDER 4
          ========================================================================= */}
      <div className="flex items-center justify-center gap-4 py-8 text-[#c96a42]/35 bg-[#FBF7EE]">
        <div className="w-16 h-px bg-[#20070e]/10" />
        <span className="text-sm font-serif">❦</span>
        <div className="w-16 h-px bg-[#20070e]/10" />
      </div>

      {/* =========================================================================
          BLOCK 4: THE ASSEMBLY (Hosts the Next Event to be Held Directly)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-8 bg-[#FBF7EE] relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={glideUp}
          className="max-w-6xl mx-auto space-y-12"
        >
          {/* Section Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[#c96a42] uppercase tracking-[0.25em] font-mono font-bold text-xs block">
              Physical &amp; Virtual Fellowship
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#20070e] font-bold tracking-tight">
              The Assembly
            </h2>
          </div>

          {/* Next Upcoming Event Broadsheet */}
          {nextGathering ? (
            <div className="bg-[#FAF5EE] border border-[#20070e]/15 rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden flex flex-col md:flex-row gap-8 items-center">
              
              {/* Event Flyer / Cover */}
              <div className="w-full md:w-80 aspect-[16/10] md:aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-[#20070e]/15 shrink-0 bg-black/5 relative">
                <img 
                  src={nextGathering.coverUrl || '/images/gatherings/townhall.jpg'} 
                  alt={nextGathering.title}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-3 left-3 bg-[#20070e]/85 backdrop-blur-md text-[#FBF7EE] text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Upcoming Gathering
                </div>
              </div>

              {/* Event Details & Host Circle */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-mono text-[#c96a42] font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {nextGathering.eventDate ? new Date(nextGathering.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'This Weekend'}
                    </span>
                    <span>•</span>
                    <span>{nextGathering.startTime ? nextGathering.startTime.slice(0, 5) : '20:15'} WAT</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {nextGathering.venueName || 'Google Meet'}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-display text-[#20070e] font-bold leading-tight">
                    {nextGathering.title}
                  </h3>
                </div>

                {nextGathering.description && (
                  <p className="text-xs sm:text-sm text-[#120308]/75 font-serif leading-relaxed line-clamp-2 max-w-xl">
                    {nextGathering.description}
                  </p>
                )}

                {/* Host Circle Avatar Cluster */}
                {(nextGathering.moderatorName || (nextGathering.coHosts && nextGathering.coHosts.length > 0)) && (
                  <div className="pt-1 flex items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#120308]/50">
                      Host Circle:
                    </span>
                    <div className="flex items-center -space-x-1.5">
                      {nextGathering.moderatorAvatarUrl ? (
                        <img 
                          src={nextGathering.moderatorAvatarUrl} 
                          alt={nextGathering.moderatorName} 
                          className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-xs" 
                          title={`Lead Host: ${nextGathering.moderatorName}`}
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-[#c96a42] text-[#FBF7EE] text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                          {nextGathering.moderatorName?.charAt(0) || 'H'}
                        </span>
                      )}
                      {(nextGathering.coHosts || []).map((ch, i) => (
                        ch.avatarUrl ? (
                          <img 
                            key={i} 
                            src={ch.avatarUrl} 
                            alt={ch.name} 
                            className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-xs" 
                            title={`Co-Host: ${ch.name}`}
                          />
                        ) : (
                          <span key={i} className="w-6 h-6 rounded-full bg-[#20070e] text-[#FBF7EE] text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                            {ch.name?.charAt(0) || 'C'}
                          </span>
                        )
                      ))}
                    </div>
                    <span className="text-xs font-serif italic text-[#20070e]/80 pl-1">
                      {nextGathering.moderatorName}
                      {(nextGathering.coHosts || []).length > 0 && ` & ${nextGathering.coHosts.length} co-host${nextGathering.coHosts.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Link 
                    href="/events" 
                    className="bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] px-8 py-3.5 uppercase tracking-widest text-xs font-bold transition-all shadow-md rounded-xl inline-flex items-center gap-3 hover:-translate-y-0.5 active:scale-95 font-sans"
                  >
                    <span>RSVP &amp; Join Table</span>
                    <ArrowRight size={14} />
                  </Link>

                  <span className="text-xs font-mono text-[#120308]/50">
                    {nextGathering.rsvpCount || 0} RSVPs logged
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#FAF5EE] border border-[#20070e]/15 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
              <Calendar size={28} className="mx-auto text-[#c96a42]" />
              <h3 className="text-xl font-display font-bold text-[#20070e]">Next Gathering Inscribing</h3>
              <p className="text-xs text-[#120308]/70 font-serif leading-relaxed">
                The chapter moderators are finalising this weekend's session agenda. Check the calendar for updates.
              </p>
              <Link 
                href="/events" 
                className="inline-block bg-[#20070e] text-[#FBF7EE] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                View Full Calendar
              </Link>
            </div>
          )}

          {/* Part B: The Weekly Dispatch (Newsletter Colophon) */}
          <div className="max-w-2xl mx-auto text-center space-y-6 pt-10 border-t border-[#20070e]/10">
            <div className="space-y-1.5">
              <span className="text-[#c96a42] uppercase tracking-[0.25em] font-mono font-bold text-xs block">
                Stay in the Loop
              </span>
              <h3 className="text-2xl sm:text-3xl font-display text-[#20070e] font-bold">
                Join The Weekly Dispatch
              </h3>
              <p className="text-xs sm:text-sm text-[#120308]/70 max-w-md mx-auto font-serif leading-relaxed">
                Weekly prompt releases, curated book arrivals, and city meetup alerts. No spam. Ever.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto space-y-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input 
                  type="email" 
                  required 
                  disabled={newsletterLoading}
                  placeholder="Enter your email address..." 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white border border-[#20070e]/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#c96a42] text-[#20070e] placeholder-[#20070e]/40 font-serif"
                />
                <button 
                  type="submit" 
                  disabled={newsletterLoading}
                  className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] font-sans font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md active:scale-95 shrink-0"
                >
                  {newsletterLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Inking...</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <Send size={12} />
                    </>
                  )}
                </button>
              </div>
              
              {newsletterStatus && (
                <p className={`text-xs font-bold pt-1 ${newsletterStatus.type === 'success' ? 'text-[#c96a42]' : 'text-red-600'}`}>
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
