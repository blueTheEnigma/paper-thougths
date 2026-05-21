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
    teaser: `Set against the backdrop of colonial Nigeria, 'The Parlour Wife' is a gripping historical drama exploring duty, class, secrets, and a woman's defiance. Foluso Agbaje weaves a rich tapestry of domestic intrigue and social upheaval with breathtaking prose.`,
    price: '7,500',
    purchaseLink: '/bookstore'
  };

  const formattedPrice = botmBook.price 
    ? (botmBook.price.toString().includes(',') ? botmBook.price : parseFloat(botmBook.price).toLocaleString())
    : '7,500';

  return (
    <div className="w-full bg-cream selection:bg-accent/30">
      
      {/* 1. Asymmetrical Editorial Hero */}
      <section className="relative w-full min-h-[90vh] flex flex-col lg:flex-row border-b border-ink/10">
        
        {/* Left: Typography Focus */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-24 z-10 bg-cream">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <span className="text-accent uppercase tracking-[0.2em] font-bold text-sm mb-6 block">The Literary Clubhouse</span>
            <h1 className="text-6xl lg:text-8xl font-display text-ink leading-[1.1] mb-8">
              We came for <br/><span className="italic text-primary">the books.</span><br/>
              We stayed for <br/><span className="text-burgundy">the chaos.</span>
            </h1>
            <p className="text-xl text-ink/70 max-w-md font-sans mb-12">
              An opinionated reading community spanning Zaria, Kaduna, and Abuja. 
              We read heavily, debate fiercely, and never use PDFs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/village" className="bg-burgundy text-cream px-8 py-4 uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-3 hover:bg-ink transition-colors shadow-md">
                Enter The Village <ArrowRight size={16} />
              </Link>
              <Link href="/bookstore" className="border border-ink text-ink px-8 py-4 uppercase tracking-widest text-sm font-bold flex items-center justify-center hover:bg-ink/5 transition-colors">
                Browse The Lore
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right: The Canvas Canvas (Fading Hero Gallery) */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-full bg-sage/10 overflow-hidden">
          <AnimatePresence mode="wait">
             <motion.img 
                key={quoteIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                src={fallbackImages[quoteIndex % fallbackImages.length]}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Community"
             />
          </AnimatePresence>
        </div>
      </section>

      {/* 2. The Editorial Highlights */}
      <section className="py-24 px-8 bg-cream border-b border-ink/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
          <Link href="/bookstore" className="group">
            <h4 className="text-7xl font-display text-sage/40 mb-6 group-hover:text-primary transition-colors">01</h4>
            <h3 className="text-3xl font-display text-ink mb-4 border-b border-ink/20 pb-4 group-hover:border-primary transition-colors">The Archive</h3>
            <p className="text-lg text-ink/70 leading-relaxed">
              We finally bring hardcopies to you. A rigorously curated selection. And absolutely none of them are PDFs.
            </p>
          </Link>

          <Link href="/events" className="group">
            <h4 className="text-7xl font-display text-sage/40 mb-6 group-hover:text-primary transition-colors">02</h4>
            <h3 className="text-3xl font-display text-ink mb-4 border-b border-ink/20 pb-4 group-hover:border-primary transition-colors">The Assembly</h3>
            <p className="text-lg text-ink/70 leading-relaxed">
              Monthly events, readings, and fierce debates spanning three cities. People actually show up.
            </p>
          </Link>

          <Link href="/clubs" className="group">
            <h4 className="text-7xl font-display text-sage/40 mb-6 group-hover:text-primary transition-colors">03</h4>
            <h3 className="text-3xl font-display text-ink mb-4 border-b border-ink/20 pb-4 group-hover:border-primary transition-colors">The Chapters</h3>
            <p className="text-lg text-ink/70 leading-relaxed">
              Zaria, Kaduna, and Abuja. Three cities bound by one very opinionated reading list.
            </p>
          </Link>
        </div>
      </section>

      {/* 3. Side-by-Side: Writers' Village Entrance & Book of the Month Showcase */}
      <section className="py-24 px-8 bg-cream/40 border-b border-ink/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left: Writers' Village CTA Card (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-burgundy to-ink text-cream p-8 md:p-10 rounded-[40px] shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/10 group min-h-[380px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/15 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-burgundy/20 rounded-full blur-3xl -z-10" />
            
            <div className="space-y-4">
              <span className="text-accent uppercase tracking-[0.25em] font-bold text-[10px] block">Portal Access</span>
              <h3 className="text-3xl md:text-4xl font-display text-cream">Writers' Village</h3>
              <p className="text-sm text-cream/70 font-serif leading-relaxed">
                Step into our dedicated workspace. Submit your drafts to the weekly critique cycle, give constructive feedback on peer manuscripts, and track your milestone tokens. Where Zaria, Kaduna, and Abuja members write, read, and critique.
              </p>
            </div>
            
            <div className="pt-6">
              <Link 
                href="/village" 
                className="bg-accent hover:bg-white text-burgundy hover:text-ink px-8 py-4 rounded-xl uppercase tracking-widest text-xs font-bold transition-all shadow-md inline-flex items-center gap-3 hover:-translate-y-0.5"
              >
                <span>Enter The Village</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right: Book of the Month Spotlight (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-sage/20 rounded-[40px] shadow-xl p-8 md:p-10 flex flex-col sm:flex-row gap-8 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-burgundy/5 rounded-full blur-3xl -z-10" />
            
            {/* Book Cover */}
            <div className="w-full sm:w-1/3 max-w-[180px] aspect-[2/3] overflow-hidden bg-cream shadow-2xl relative group rounded-sm flex-shrink-0">
              <img 
                src={botmBook.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                alt={botmBook.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
              />
            </div>

            {/* Book Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <span className="text-accent uppercase tracking-[0.2em] font-bold text-[10px] block">Book of the Month</span>
                <h3 className="text-2xl font-display text-ink leading-tight">{botmBook.title}</h3>
                <p className="text-xs font-medium text-burgundy/85 font-sans italic">— by {botmBook.author}</p>
              </div>

              <p className="text-xs text-ink/75 leading-relaxed font-serif whitespace-pre-wrap">
                {botmBook.teaser || "A magnificent masterwork handpicked by the Panguin clubhouse editors. Available in hardcopy at the bookstore."}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <span className="text-xl font-display text-ink font-bold">₦{formattedPrice}</span>
                <Link 
                  href={botmBook.purchaseLink || "/bookstore"} 
                  className="bg-burgundy hover:bg-ink text-cream px-6 py-3 uppercase tracking-widest text-[10px] font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <span>Purchase Hardcopy</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Weekly Prompts & Critique Village Section */}
      <section className="py-24 px-8 bg-white border-b border-ink/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sage/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-accent uppercase tracking-[0.2em] font-bold text-xs block">Active Weekly Prompts</span>
            <h2 className="text-4xl md:text-5xl font-display text-burgundy">Weekly Writing Prompts</h2>
            <p className="text-sm text-ink/60 max-w-md mx-auto">Select a prompt below, write your manuscript in the portal, and queue it for Saturday's drop.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Story Prompt Card - Vintage Ledger styling */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-[#FAF6EE] border-2 border-[#E8DFC9] p-8 rounded-[32px] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-burgundy/5 rounded-full blur-xl" />
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-burgundy bg-burgundy/5 px-3 py-1 rounded-full uppercase tracking-wider">The Story prompt</span>
                  <Feather size={16} className="text-burgundy" />
                </div>
                <h3 className="text-2xl font-display text-ink border-b border-[#E8DFC9] pb-3">Prose & Narrative</h3>
                <p className="text-xs text-ink/85 leading-relaxed font-serif italic min-h-[90px] bg-white/40 p-4 rounded-xl border border-[#E8DFC9]/50 flex-1 flex items-center justify-center">
                  "{storyPrompt}"
                </p>
              </div>
              <Link 
                href="/dashboard/write?type=story"
                className="bg-burgundy hover:bg-ink text-cream text-center font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Write Story Draft</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Poem Prompt Card - Calligraphy style */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-[#F8F5FC] border-2 border-[#E7DEEE] p-8 rounded-[32px] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl" />
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-accent bg-accent/5 px-3 py-1 rounded-full uppercase tracking-wider">The Poem prompt</span>
                  <Sparkles size={16} className="text-accent" />
                </div>
                <h3 className="text-2xl font-display text-ink border-b border-[#E7DEEE] pb-3">Verse & Poetry</h3>
                <p className="text-xs text-ink/85 leading-relaxed font-serif italic min-h-[90px] bg-white/40 p-4 rounded-xl border border-[#E7DEEE]/50 flex-1 flex items-center justify-center">
                  "{poemPrompt}"
                </p>
              </div>
              <Link 
                href="/dashboard/write?type=poem"
                className="bg-accent hover:bg-ink text-burgundy hover:text-cream text-center font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Compose Poem Draft</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Premium Call-to-Action to Village */}
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-burgundy to-ink p-10 md:p-12 rounded-[40px] shadow-xl text-center space-y-6 relative overflow-hidden border border-white/10 group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-burgundy/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-accent uppercase tracking-[0.25em] font-bold text-[10px] block">Weekly Critique Cycle</span>
              <h3 className="text-3xl md:text-4xl font-display text-cream">Ready to Share or Critique?</h3>
              <p className="text-sm text-cream/70 font-serif leading-relaxed">
                Step into the **Writers' Village**. Read and review anonymous peer manuscripts, earn leaves and Milestone Tokens, or manage your ongoing drafts.
              </p>
            </div>

            <div className="pt-4">
              <Link 
                href="/village" 
                className="bg-accent hover:bg-white text-burgundy hover:text-ink px-10 py-4.5 rounded-2xl uppercase tracking-widest text-xs font-bold transition-all shadow-md inline-flex items-center gap-3 hover:-translate-y-0.5"
              >
                <span>Enter The Writers' Village</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Contained Lantern Slider (Exhibition Style) */}
      <section className="py-32 px-8 bg-ink">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-display text-cream mb-4">Bookstore in the wild</h2>
            <p className="uppercase tracking-widest text-primary text-xs font-bold leading-relaxed">Capturing the moments that build our community.</p>
          </div>

          {/* Polaroid / Gallery Frame */}
          <div className="bg-white p-4 md:p-8 rounded-sm shadow-2xl mx-auto max-w-4xl rotate-1">
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-sage/10 mb-8 border border-ink/10">
               <AnimatePresence mode="wait">
                  <motion.img 
                    key={quoteIndex}
                    src={fallbackImages[quoteIndex % fallbackImages.length]}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
               </AnimatePresence>
            </div>
            
            <div className="text-center px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.8 }}
                  className="min-h-[100px] flex flex-col justify-center"
                >
                  <p className="font-quote text-2xl md:text-3xl italic text-ink mb-4">"{QUOTES[quoteIndex].text}"</p>
                  <p className="uppercase tracking-widest text-xs font-bold text-accent">— {QUOTES[quoteIndex].author}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Micro Progress Track inside the frame */}
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
