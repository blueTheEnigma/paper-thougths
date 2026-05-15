"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const QUOTES = [
  { text: "There is no agony like bearing an untold story inside you.", author: "Zora Neale Hurston" },
  { text: "We loved with a love that was more than love.", author: "Edgar Allan Poe" },
  { text: "I am a part of all that I have met.", author: "Alfred Lord Tennyson" },
  { text: "The scariest moment is always just before you start.", author: "Stephen King" },
  { text: "Grief is the price we pay for love.", author: "Queen Elizabeth II" },
  { text: "I have loved the stars too fondly to be fearful of the night.", author: "Sarah Williams" }
];

export default function Landing({ images, books = [] }) {
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
              <Link href="/bookstore" className="bg-ink text-cream px-8 py-4 uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-3 hover:bg-burgundy transition-colors">
                Browse The Lore <ArrowRight size={16} />
              </Link>
              <Link href="/clubs" className="border border-ink text-ink px-8 py-4 uppercase tracking-widest text-sm font-bold flex items-center justify-center hover:bg-ink/5 transition-colors">
                Find Your Chapter
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

      {/* 2. Panguin's Picks (Horizontal Cinematic Scroll) */}
      {books.length > 0 && (
        <section className="py-24 px-8 border-b border-ink/10 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-display text-burgundy mb-2">Panguin's Choice</h2>
                <p className="text-ink/60 uppercase tracking-widest text-sm font-bold">Highest Rated Hardcopies</p>
              </div>
              <Link href="/bookstore" className="hidden md:flex text-accent font-bold uppercase tracking-widest text-xs items-center gap-2 hover:text-burgundy transition-colors">
                View The Library <ArrowRight size={14}/>
              </Link>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide snap-x">
              {books.slice(0, 10).map((book, idx) => (
                <Link href="/bookstore" key={book.id} className="min-w-[280px] w-[280px] group snap-start">
                  <div className="relative aspect-[2/3] mb-6 overflow-hidden bg-cream shadow-md transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-2xl">
                    <img src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={book.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none z-10"></div>
                  </div>
                  <h3 className="font-display text-2xl text-ink leading-tight mb-2 group-hover:text-accent transition-colors">{book.title}</h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="italic text-ink/70">{book.author}</span>
                    <span className="flex items-center gap-1 text-accent font-bold"><Star size={12} className="fill-accent"/> {book.rating}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. The Editorial Highlights (Replacing generic icons) */}
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
