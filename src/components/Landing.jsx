"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Feather, Sparkles, Send, Loader2, X, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';

const QUOTES = [
  { text: "There is no agony like bearing an untold story inside you.", author: "Zora Neale Hurston" },
  { text: "We loved with a love that was more than love.", author: "Edgar Allan Poe" },
  { text: "I am a part of all that I have met.", author: "Alfred Lord Tennyson" },
  { text: "The scariest moment is always just before you start.", author: "Stephen King" },
  { text: "Grief is the price we pay for love.", author: "Queen Elizabeth II" },
  { text: "I have loved the stars too fondly to be fearful of the night.", author: "Sarah Williams" }
];

export default function Landing({ images, books = [], storyPrompt, poemPrompt, generalBotm, abujaBotm }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  
  const [activeStream, setActiveStream] = useState('general');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);



  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);



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
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&h=600&fit=crop",
      rating: 4.8
    },
    {
      id: "2",
      title: "Stay With Me",
      author: "Ayobami Adebayo",
      genre: "Fiction",
      price: "5500",
      imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&h=600&fit=crop",
      rating: 4.6
    },
    {
      id: "3",
      title: "Akata Witch",
      author: "Nnedi Okorafor",
      genre: "Fantasy",
      price: "6000",
      imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&h=600&fit=crop",
      rating: 4.5
    },
    {
      id: "4",
      title: "Chronicles from the Land of the Happiest People on Earth",
      author: "Wole Soyinka",
      genre: "Satire",
      price: "8500",
      imageUrl: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400&h=600&fit=crop",
      rating: 4.7
    }
  ];

  const bookstoreList = books && books.length > 0 ? books.slice(0, 4) : fallbackFeaturedBooks;

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const fallbackGeneral = {
    id: 1,
    title: 'Skin of the Sea',
    author: 'Natasha Bowen',
    imageUrl: '/images/skin_of_the_sea.png',
    teaser: `A story of sirens, Yoruba gods, and a choice that could change the world. Natasha Bowen's debut is a breathtaking fantasy set in a world where history and mythology collide.`
  };

  const fallbackAbuja = {
    id: 2,
    title: 'The Parlour Wife',
    author: 'Foluso Agbaje',
    imageUrl: '/images/the_parlour_wife.png',
    teaser: `Set against the backdrop of colonial Nigeria, 'The Parlour Wife' is a gripping historical drama exploring duty, class, secrets, and a woman's defiance. Foluso Agbaje weaves a rich tapestry of domestic intrigue and social upheaval with breathtaking prose.`
  };

  const botmGeneral = generalBotm || fallbackGeneral;
  const botmAbuja = abujaBotm || fallbackAbuja;
  const botmBook = activeStream === 'general' ? botmGeneral : botmAbuja;

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
            animate={{ scale: 1, opacity: 0.60 }}
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
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/60 to-ink/20" />
          <div className="absolute inset-0 bg-radial-vignette opacity-60" />
          {/* Subtle gold ambient glow behind typography */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(242,169,138,0.08)_0%,transparent_50%)]" />
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
            className="text-5xl sm:text-7xl md:text-8xl font-display leading-[1.05] tracking-tight font-extrabold text-cream"
          >
            We came for <span className="italic text-primary font-bold">the books.</span><br/>
            We stayed for <span className="text-[#FF8D5C] italic font-bold">the chaos.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="text-base sm:text-lg md:text-xl text-cream/95 max-w-2xl mx-auto font-sans font-medium"
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

      {/* NEW FEATURE BANNER: THE LITERARY ECOSYSTEM */}
      <section 
        className="py-20 px-6 border-b border-white/5 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
      >
        {/* Ambient star speck particles */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-1 h-1.5 bg-[#F2A98A] rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#F2A98A] font-bold">
              ✨ Discover Your Literary Essence
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-cream tracking-tight">
              Who Are You in the Literary Universe?
            </h2>
            <p className="text-sm sm:text-base text-cream/70 max-w-xl mx-auto italic font-serif">
              Explore the 3 core pillars of the Paper Thoughts identity system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CARD 1: BOOK ZODIAC */}
            <div className="p-6 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 space-y-5 hover:border-[#5C1A2E]/30 transition-all flex flex-col justify-between group shadow-md relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4.5 bg-[#C5A059]/15 transform rotate-1 border-l border-r border-[#C5A059]/25" />
              <div className="space-y-3 pt-2">
                <span className="text-4xl block">🔮</span>
                <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                  The Book Zodiac
                </h3>
                <p className="text-xs text-[#2C1A0E]/80 leading-relaxed font-serif">
                  A 12-question astrological identity test. Discover your <strong>Sun</strong>, <strong>Moon</strong>, and <strong>Rising</strong> literary signs.
                </p>
              </div>
              <Link
                href="/zodiac"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#5C1A2E] to-[#C96A42] hover:from-[#7A2040] hover:to-[#e07a5f] text-cream font-bold text-xs text-center transition-all shadow-md active:scale-95"
              >
                Discover Your Zodiac Chart →
              </Link>
            </div>

            {/* CARD 2: READER ARCHETYPES */}
            <div className="p-6 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 space-y-5 hover:border-[#5C1A2E]/30 transition-all flex flex-col justify-between group shadow-md relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4.5 bg-[#C5A059]/15 transform -rotate-1 border-l border-r border-[#C5A059]/25" />
              <div className="space-y-3 pt-2">
                <span className="text-4xl block">🎭</span>
                <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                  Reader Archetypes
                </h3>
                <p className="text-xs text-[#2C1A0E]/80 leading-relaxed font-serif">
                  Explore 21 celebrated habits and identities—from the <em>Marathon Reader</em> to the <em>DNF Champion</em>.
                </p>
              </div>
              <Link
                href="/archetype"
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-[#5C1A2E] text-[#F2A98A] hover:text-cream border border-[#F2A98A]/25 font-bold text-xs text-center transition-all shadow-md active:scale-95"
              >
                Browse 21 Archetypes →
              </Link>
            </div>

            {/* CARD 3: LITERARY SOUNDSCAPES */}
            <div className="p-6 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 space-y-5 hover:border-[#5C1A2E]/30 transition-all flex flex-col justify-between group shadow-md relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4.5 bg-[#C5A059]/15 transform rotate-2 border-l border-r border-[#C5A059]/25" />
              <div className="space-y-3 pt-2">
                <span className="text-4xl block">🎧</span>
                <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                  Literary Soundscapes
                </h3>
                <p className="text-xs text-[#2C1A0E]/80 leading-relaxed font-serif">
                  9 Spotify reading playlists crafted to match the mood of every page, from <em>The Still Hour</em> to <em>The Forest Cabin</em>.
                </p>
              </div>
              <Link
                href="/soundscapes"
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-[#5C1A2E] text-[#F2A98A] hover:text-cream border border-[#F2A98A]/25 font-bold text-xs text-center transition-all shadow-md active:scale-95"
              >
                Press Play on Soundscapes →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Light Theme: The Bookstore Showcase */}
      <section className="py-24 px-6 md:px-8 bg-cream relative border-b border-ink/5">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto space-y-16"
        >
          <div className="text-center space-y-3">
            <span className="text-accent uppercase tracking-[0.25em] font-sans font-bold text-xs block">Featured Collection</span>
            <h2 className="text-4xl md:text-5xl font-display text-burgundy font-bold">The Bookstore</h2>
            <p className="text-sm md:text-base text-ink/75 max-w-xl mx-auto font-sans font-medium">
              We finally bring hardcopies to you. A rigorously curated selection. And absolutely none of them are PDFs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {bookstoreList.map((book) => (
              <motion.div key={book.id} variants={fadeInReveal} className="flex">
                <Link 
                  href="/bookstore" 
                  className="group flex flex-col justify-between w-full hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="space-y-4 w-full">
                    <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-md border border-sage/15 bg-card relative">
                      <img 
                        src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-cream text-burgundy text-[9px] font-sans font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          View Details
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-accent uppercase tracking-widest block mb-1">{book.genre}</span>
                      <h4 className="font-bold text-ink leading-tight group-hover:text-accent transition-colors line-clamp-1 mb-1 font-display">{book.title}</h4>
                      <p className="text-xs text-ink/60 mb-2 truncate">by {book.author}</p>
                      <span className="font-display font-bold text-burgundy text-sm">₦{parseInt(book.price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link 
              href="/bookstore" 
              className="bg-burgundy hover:bg-ink text-cream hover:text-white px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all shadow-md rounded-xl inline-flex items-center gap-3 hover:-translate-y-0.5"
            >
              <span>Explore the Bookstore</span>
              <ArrowRight size={16} />
            </Link>
          </div>
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
            className="lg:col-span-7 bg-white border border-sage/15 rounded-[32px] shadow-xl p-8 md:p-10 flex flex-col relative overflow-hidden group justify-between"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-burgundy/5 rounded-full blur-3xl -z-10" />
            
            {/* Stream Toggle Tabs */}
            <div className="flex border-b border-sage/10 pb-4 mb-6 justify-between items-center">
              <span className="text-accent uppercase tracking-[0.2em] font-bold text-[10px]">Book of the Month</span>
              <div className="flex bg-cream p-1 rounded-xl border border-sage/15">
                <button
                  type="button"
                  onClick={() => setActiveStream('general')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeStream === 'general' 
                      ? 'bg-burgundy text-cream shadow-sm' 
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  General Stream
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStream('abuja')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeStream === 'abuja' 
                      ? 'bg-burgundy text-cream shadow-sm' 
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  Abuja Edition
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-center flex-1">
              {/* Book Cover */}
              <div className="w-full sm:w-2/5 aspect-[2/3] overflow-hidden bg-cream shadow-xl relative group rounded-lg flex-shrink-0 border border-ink/5">
                <img 
                  src={botmBook.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                  alt={botmBook.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                />
              </div>

              {/* Book Info */}
              <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <span className="text-burgundy/80 uppercase tracking-widest text-[9px] font-bold">
                    {activeStream === 'general' ? '🌍 Paper Thoughts General' : '📍 Abuja Chapter Exclusive'}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display text-ink leading-tight font-extrabold">{botmBook.title}</h3>
                  <p className="text-xs font-bold text-burgundy/85 font-sans italic">— by {botmBook.author}</p>
                </div>

                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed font-serif italic whitespace-pre-wrap font-medium">
                  "{botmBook.teaser || "A magnificent masterwork handpicked by the community editors. Available for checkout and discussions in our physical chapters."}"
                </p>

                <div className="pt-2">
                  <Link
                    href={`/discussion?stream=${activeStream}`}
                    className="w-full bg-burgundy hover:bg-ink text-cream hover:text-white px-5 py-3 uppercase tracking-widest text-[10px] font-bold transition-all shadow-md rounded-xl inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer text-center"
                  >
                    <span>View Reviews & Discussion</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
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
                href={`/village?redirect=${encodeURIComponent('/dashboard/write?type=story')}`}
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
                href={`/village?redirect=${encodeURIComponent('/dashboard/write?type=poem')}`}
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

      {/* 6. Light Theme: The Assembly & The Chapters (Community at Bottom) */}
      <section className="py-24 px-6 md:px-8 bg-cream/70 relative border-b border-ink/5 overflow-hidden">
        {/* Background visual detail */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-accent uppercase tracking-[0.2em] font-sans font-bold text-xs block">Our Collective</span>
            <h2 className="text-4xl md:text-5xl font-display text-burgundy font-bold">The Assembly & The Chapters</h2>
            <p className="text-sm text-ink/75 max-w-md mx-auto font-sans font-medium">
              Step beyond the page. Meet the minds that read fiercely and write with passion across our physical chapters.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {/* Card 1: The Assembly (Events) */}
            <motion.div 
              variants={fadeInReveal}
              className="bg-white border border-sage/15 p-8 rounded-[32px] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-sage/5 rounded-full blur-xl" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sage bg-sage/10 border border-sage/20 px-3 py-1 rounded-full uppercase tracking-wider">The Assembly</span>
                  <span className="text-4xl font-display text-sage/20 font-black">01</span>
                </div>
                <h3 className="text-2xl font-display text-burgundy border-b border-sage/10 pb-3 font-bold">Events & Readings</h3>
                <p className="text-sm text-ink leading-relaxed font-sans font-medium">
                  Check out our next event and hang with the gang. People actually show up. Monthly events, readings, and fierce debates spanning Zaria, Kaduna, and Abuja.
                </p>
              </div>
              <Link 
                href="/events"
                className="bg-sage hover:bg-burgundy text-cream hover:text-white text-center font-sans font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>View Events Calendar</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Card 2: The Chapters (Clubs) */}
            <motion.div 
              variants={fadeInReveal}
              className="bg-white border border-primary/15 p-8 rounded-[32px] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full uppercase tracking-wider">The Chapters</span>
                  <span className="text-4xl font-display text-primary/20 font-black">02</span>
                </div>
                <h3 className="text-2xl font-display text-burgundy border-b border-primary/10 pb-3 font-bold">Local Chapters</h3>
                <p className="text-sm text-ink leading-relaxed font-sans font-medium">
                  Connect with like minds in Zaria, Kaduna, and Abuja bound by one very opinionated reading list. Join a local group for weekly check-ins.
                </p>
              </div>
              <Link 
                href="/clubs"
                className="bg-accent hover:bg-burgundy text-cream hover:text-white text-center font-sans font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Find Your Chapter</span>
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. The Weekly Dispatch (Prominent Newsletter Signup Section) */}
      <section className="py-24 px-6 md:px-8 bg-ink text-cream relative overflow-hidden">
        {/* Background ambient highlights */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-burgundy/15 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-3">
            <span className="text-primary uppercase tracking-[0.25em] font-sans font-bold text-xs block">Stay in the Loop</span>
            <h2 className="text-3xl md:text-5xl font-display text-cream font-bold leading-tight">Join The Weekly Dispatch</h2>
            <p className="text-sm sm:text-base text-cream/70 max-w-xl mx-auto font-serif leading-relaxed">
              Subscribe to receive weekly prompt releases, curated book summaries, physical meetups notifications, and local chapter highlights straight to your inbox.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                required 
                disabled={newsletterLoading}
                placeholder="Enter your email address..." 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary text-cream placeholder-cream/35 transition-all"
              />
              <button 
                type="submit" 
                disabled={newsletterLoading}
                className="bg-primary hover:bg-cream text-ink font-sans font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md active:scale-95 flex-shrink-0"
              >
                {newsletterLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
            
            {newsletterStatus && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs font-bold ${newsletterStatus.type === 'success' ? 'text-primary' : 'text-red-400'}`}
              >
                {newsletterStatus.message}
              </motion.p>
            )}
          </form>
        </div>
      </section>


    </div>
  );
}
