"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Feather, Sparkles } from 'lucide-react';

const QUOTES = [
  { text: "There is no agony like bearing an untold story inside you.", author: "Zora Neale Hurston" },
  { text: "We loved with a love that was more than love.", author: "Edgar Allan Poe" },
  { text: "I am a part of all that I have met.", author: "Alfred Lord Tennyson" },
  { text: "The scariest moment is always just before you start.", author: "Stephen King" },
  { text: "Grief is the price we pay for love.", author: "Queen Elizabeth II" },
  { text: "I have loved the stars too fondly to be fearful of the night.", author: "Sarah Williams" }
];

export default function Landing({ images, books = [], storyPrompt, poemPrompt, botm }) {
  const [quoteIndex, setQuoteIndex] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const botmBook = botm || {
    title: 'The Parlour Wife',
    author: 'Foluso Agbaje',
    imageUrl: '/images/the_parlour_wife.png',
    teaser: `Set against the backdrop of colonial Nigeria, 'The Parlour Wife' is a gripping historical drama exploring duty, class, secrets, and a woman's defiance. Foluso Agbaje weaves a rich tapestry of domestic intrigue and social upheaval with breathtaking prose.`
  };

  // Scroll animations variants
  const fadeInReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="w-full bg-cream selection:bg-accent/30 overflow-x-hidden">
      
      {/* 1. Full-Bleed Cinematic Hero */}
      <section className="relative w-full min-h-screen flex items-center justify-center bg-ink overflow-hidden text-cream -mt-24 md:-mt-32">
        {/* Parallax / Slowly Scaling Background Image */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img 
              src={fallbackImages[0]} 
              className="w-full h-full object-cover filter grayscale contrast-125 saturate-50"
              alt="Community Gatherings"
            />
          </motion.div>
          {/* Rich Vignette and Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <div className="absolute inset-0 bg-radial-vignette opacity-60" />
        </div>
        
        {/* Layered Serif Typography and Animated Entrance */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 text-center space-y-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="text-primary uppercase tracking-[0.3em] font-sans font-bold text-xs sm:text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-full inline-block backdrop-blur-sm animate-pulse-subtle">
              The Literary Clubhouse
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl font-display leading-[1.05] tracking-tight font-extrabold"
          >
            We came for <span className="italic text-primary">the books.</span><br/>
            We stayed for <span className="text-accent italic">the chaos.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="text-base sm:text-lg md:text-xl text-cream/80 max-w-2xl mx-auto font-sans font-medium"
          >
            An opinionated reading community spanning Zaria, Kaduna, and Abuja. 
            We read heavily, debate fiercely, and never use PDFs.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <Link 
              href="/village" 
              className="bg-primary hover:bg-white text-ink hover:text-burgundy px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all shadow-lg rounded-xl flex items-center justify-center gap-3 hover:-translate-y-0.5"
            >
              <span>Enter The Village</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/bookstore" 
              className="border border-cream/30 hover:border-cream text-cream hover:bg-cream/10 px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all rounded-xl flex items-center justify-center hover:-translate-y-0.5"
            >
              Browse The Lore
            </Link>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40 animate-float text-cream">
          <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold">Scroll to Enter</span>
          <div className="w-[1px] h-6 bg-gradient-to-b from-cream to-transparent" />
        </div>
      </section>

      {/* 2. Light Theme: The Editorial Highlights (Scroll Reveal) */}
      <section className="py-28 px-6 md:px-8 bg-cream relative border-b border-ink/5">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16"
        >
          <motion.div variants={fadeInReveal}>
            <Link href="/bookstore" className="group block space-y-4">
              <span className="text-6xl font-display text-sage/25 group-hover:text-primary transition-colors block leading-none font-black">01</span>
              <h3 className="text-2xl font-display text-ink border-b border-ink/10 pb-4 group-hover:border-primary transition-colors font-bold">The Archive</h3>
              <p className="text-sm sm:text-base text-ink/70 leading-relaxed font-sans font-medium">
                We finally bring hardcopies to you. A rigorously curated selection. And absolutely none of them are PDFs.
              </p>
            </Link>
          </motion.div>

          <motion.div variants={fadeInReveal}>
            <Link href="/events" className="group block space-y-4">
              <span className="text-6xl font-display text-sage/25 group-hover:text-primary transition-colors block leading-none font-black">02</span>
              <h3 className="text-2xl font-display text-ink border-b border-ink/10 pb-4 group-hover:border-primary transition-colors font-bold">The Assembly</h3>
              <p className="text-sm sm:text-base text-ink/70 leading-relaxed font-sans font-medium">
                Monthly events, readings, and fierce debates spanning three cities. People actually show up.
              </p>
            </Link>
          </motion.div>

          <motion.div variants={fadeInReveal}>
            <Link href="/clubs" className="group block space-y-4">
              <span className="text-6xl font-display text-sage/25 group-hover:text-primary transition-colors block leading-none font-black">03</span>
              <h3 className="text-2xl font-display text-ink border-b border-ink/10 pb-4 group-hover:border-primary transition-colors font-bold">The Chapters</h3>
              <p className="text-sm sm:text-base text-ink/70 leading-relaxed font-sans font-medium">
                Zaria, Kaduna, and Abuja. Three cities bound by one very opinionated reading list.
              </p>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. Light Theme: Asymmetric Split (7/5 layout) */}
      <section className="py-24 px-6 md:px-8 bg-cream/40 relative border-b border-ink/5">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch"
        >
          {/* Left: Writers' Village Entrance Card (5 Columns) */}
          <motion.div 
            variants={fadeInReveal}
            className="lg:col-span-5 bg-gradient-to-br from-burgundy to-ink text-cream p-8 md:p-10 rounded-[32px] shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/10 group min-h-[400px]"
          >
            {/* Background Ambient Circles */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-burgundy/30 rounded-full blur-3xl -z-10" />
            
            <div className="space-y-4">
              <span className="text-accent uppercase tracking-[0.25em] font-bold text-[10px] block">Creative Haven</span>
              <h3 className="text-3xl md:text-4xl font-display text-cream font-bold leading-tight">Writers' Village</h3>
              <p className="text-sm text-cream/70 font-sans font-medium leading-relaxed">
                Step into our dedicated creative portal. Submit your drafts to the weekly critique cycle, give constructive feedback on peer manuscripts, and track your milestone tokens. A workspace designed for Zaria, Kaduna, and Abuja members.
              </p>
            </div>
            
            <div className="pt-8">
              <Link 
                href="/village" 
                className="bg-accent hover:bg-white text-burgundy hover:text-ink px-7 py-3.5 rounded-xl uppercase tracking-widest text-xs font-bold transition-all shadow-md inline-flex items-center gap-3 hover:-translate-y-0.5"
              >
                <span>Enter The Village</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* Right: Book of the Month Spotlight (7 Columns) - Pure Community Focus */}
          <motion.div 
            variants={fadeInReveal}
            className="lg:col-span-7 bg-white border border-sage/15 rounded-[32px] shadow-xl p-8 md:p-10 flex flex-col sm:flex-row gap-8 items-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-burgundy/5 rounded-full blur-3xl -z-10" />
            
            {/* Book Cover */}
            <div className="w-full sm:w-2/5 aspect-[2/3] overflow-hidden bg-cream shadow-xl relative group rounded-lg flex-shrink-0 border border-ink/5">
              <img 
                src={botmBook.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                alt={botmBook.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
              />
            </div>

            {/* Book Info */}
            <div className="flex-1 flex flex-col justify-between h-full space-y-5">
              <div className="space-y-2">
                <span className="text-accent uppercase tracking-[0.2em] font-bold text-[9px] block">Book of the Month</span>
                <h3 className="text-2xl md:text-3xl font-display text-ink leading-tight font-extrabold">{botmBook.title}</h3>
                <p className="text-xs font-bold text-burgundy/85 font-sans italic">— by {botmBook.author}</p>
              </div>

              <p className="text-xs sm:text-sm text-ink/75 leading-relaxed font-serif italic whitespace-pre-wrap">
                "{botmBook.teaser || "A magnificent masterwork handpicked by the community editors. Available for checkout and discussions in our physical chapters."}"
              </p>

              {/* Rating and Community Status (NO prices/commercial metrics) */}
              <div className="pt-4 border-t border-sage/10 flex items-center gap-4 text-xs font-sans font-bold text-ink/65">
                <div className="flex items-center gap-1 text-accent">
                  <Star size={14} className="fill-accent stroke-accent" />
                  <Star size={14} className="fill-accent stroke-accent" />
                  <Star size={14} className="fill-accent stroke-accent" />
                  <Star size={14} className="fill-accent stroke-accent" />
                  <Star size={14} className="stroke-accent" />
                </div>
                <span>Community pick & discussion active</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. Strategic Dark Theme: Weekly Prompts & Critique Section */}
      <section className="py-28 px-6 md:px-8 bg-ink text-cream relative border-b border-white/5 overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-burgundy/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInReveal}
            className="text-center space-y-3"
          >
            <span className="text-primary uppercase tracking-[0.2em] font-sans font-bold text-xs block">Active Prompts</span>
            <h2 className="text-4xl md:text-5xl font-display text-cream font-bold">Weekly Writing Prompts</h2>
            <p className="text-sm text-cream/60 max-w-md mx-auto font-sans font-medium">Select a prompt below, write your manuscript in the portal, and queue it for Saturday's drop.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {/* Story Prompt Card - Deep brown parchment tone */}
            <motion.div 
              variants={fadeInReveal}
              whileHover={{ y: -4 }}
              className="bg-[#1E110A] border border-primary/20 p-8 rounded-[32px] shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-burgundy/10 rounded-full blur-xl" />
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">The Story prompt</span>
                  <Feather size={16} className="text-primary" />
                </div>
                <h3 className="text-2xl font-display text-cream font-bold border-b border-white/10 pb-3">Prose & Narrative</h3>
                <p className="text-xs sm:text-sm text-cream/80 leading-relaxed font-serif italic min-h-[95px] bg-white/5 p-4 rounded-xl border border-white/5 flex-1 flex items-center justify-center">
                  "{storyPrompt}"
                </p>
              </div>
              <Link 
                href="/dashboard/write?type=story"
                className="bg-primary hover:bg-white text-ink text-center font-sans font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Write Story Draft</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Poem Prompt Card - Deep purple parchment tone */}
            <motion.div 
              variants={fadeInReveal}
              whileHover={{ y: -4 }}
              className="bg-[#160B18] border border-accent/20 p-8 rounded-[32px] shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-xl" />
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full uppercase tracking-wider">The Poem prompt</span>
                  <Sparkles size={16} className="text-accent" />
                </div>
                <h3 className="text-2xl font-display text-cream font-bold border-b border-white/10 pb-3">Verse & Poetry</h3>
                <p className="text-xs sm:text-sm text-cream/80 leading-relaxed font-serif italic min-h-[95px] bg-white/5 p-4 rounded-xl border border-white/5 flex-1 flex items-center justify-center">
                  "{poemPrompt}"
                </p>
              </div>
              <Link 
                href="/dashboard/write?type=poem"
                className="bg-accent hover:bg-white text-burgundy hover:text-ink text-center font-sans font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Compose Poem Draft</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Immersive CTA to Village */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInReveal}
            className="max-w-4xl mx-auto bg-gradient-to-r from-burgundy/50 to-ink p-10 md:p-12 rounded-[32px] shadow-xl text-center space-y-6 relative overflow-hidden border border-white/10 group"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-burgundy/10 rounded-full blur-3xl -z-10" />

            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-accent uppercase tracking-[0.25em] font-sans font-bold text-[9px] block">Weekly Critique Cycle</span>
              <h3 className="text-3xl md:text-4xl font-display text-cream font-bold">Ready to Share or Critique?</h3>
              <p className="text-sm text-cream/70 font-sans leading-relaxed">
                Step into the **Writers' Village**. Read and review anonymous peer manuscripts, earn leaves and Milestone Tokens, or manage your ongoing drafts.
              </p>
            </div>

            <div className="pt-4">
              <Link 
                href="/village" 
                className="bg-accent hover:bg-white text-burgundy hover:text-ink px-10 py-4 rounded-xl uppercase tracking-widest text-xs font-bold transition-all shadow-md inline-flex items-center gap-3 hover:-translate-y-0.5"
              >
                <span>Enter The Writers' Village</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Strategic Dark Theme: Polaroid Exhibition Slider */}
      <section className="py-32 px-6 md:px-8 bg-ink border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-display text-cream mb-4 font-bold">Bookstore in the wild</h2>
            <p className="uppercase tracking-[0.25em] text-primary text-xs font-bold leading-relaxed font-sans">Capturing the moments that build our community.</p>
          </div>

          {/* Polaroid Card frame */}
          <div className="bg-white p-5 md:p-8 rounded-[4px] shadow-2xl mx-auto max-w-4xl rotate-1 border border-ink/5">
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-sage/5 mb-8 border border-ink/10 rounded-[2px]">
               <AnimatePresence mode="wait">
                  <motion.img 
                    key={quoteIndex}
                    src={fallbackImages[quoteIndex % fallbackImages.length]}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover filter contrast-[1.02] sepia-[0.05]"
                    alt="Exhibition Capture"
                  />
               </AnimatePresence>
            </div>
            
            <div className="text-center px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.8 }}
                  className="min-h-[110px] flex flex-col justify-center"
                >
                  <p className="font-quote text-2xl md:text-3xl italic text-ink mb-4">"{QUOTES[quoteIndex].text}"</p>
                  <p className="uppercase tracking-widest text-[10px] font-bold text-accent font-sans">— {QUOTES[quoteIndex].author}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Polaroid Progress Bar */}
            <div className="h-[2px] w-full bg-ink/10 mt-8 relative overflow-hidden">
               {QUOTES.map((_, i) => (
                 i === quoteIndex && (
                   <motion.div 
                     key={`prog-${i}`}
                     initial={{ width: "0%" }} 
                     animate={{ width: "100%" }} 
                     transition={{ duration: 6, ease: "linear" }}
                     className="absolute top-0 left-0 h-full bg-ink"
                   />
                 )
               ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
