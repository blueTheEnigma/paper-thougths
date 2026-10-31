"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Feather, Sparkles, Send, Loader2, 
  BookOpen, Calendar, MapPin, CheckCircle2, ShieldCheck,
  Volume2, VolumeX, Flame, CloudRain, RotateCw, Award,
  Bookmark, Eye, Check, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

// =========================================================================
// Web Audio Ambient Synthesizer: Fireplace Crackle & Kaduna Rain
// (100% Client-Side Web Audio API · Zero external mp3 dependencies)
// =========================================================================
class ManorHearthSynth {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.sourceNode = null;
    this.filterNode = null;
    this.currentMode = 'off'; // 'off' | 'fireplace' | 'rain'
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.09, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
  }

  play(mode = 'fireplace') {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stop();
    this.currentMode = mode;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3; // 3-second seamless loop
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    if (mode === 'fireplace') {
      // Pink noise base + organic micro-crackle impulses
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        let val = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
        b6 = white * 0.115926;

        // Random ember sparks
        if (Math.random() < 0.00085) {
          val += (Math.random() * 0.7 - 0.35);
        }
        data[i] = val;
      }
    } else {
      // Kaduna Rain: warm, continuous brown noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.022 * white)) / 1.02 * 0.18;
        lastOut = data[i];
      }
    }

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = mode === 'fireplace' ? 'bandpass' : 'lowpass';
    this.filterNode.frequency.setValueAtTime(mode === 'fireplace' ? 650 : 850, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.1, this.ctx.currentTime);

    this.sourceNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.sourceNode.start();
  }

  stop() {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch (_) {}
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }
    this.currentMode = 'off';
  }
}

// Global synth instance
let globalHearthSynth = null;

// =========================================================================
// Mystery Blind Date Books Catalog (Curated Literary Surprises)
// =========================================================================
const MYSTERY_PARCELS = [
  {
    id: 'mystery-1',
    code: 'SPECIMEN-RED',
    openingConfession: "“I would have lived in peace, but my enemies brought me war.”",
    synopsis: "Buried hundreds of meters beneath Martian soil, a low-caste miner uncovers the ultimate celestial deception. To avenge his murdered wife and dismantle the golden gods who enslave his people, he must become what he hates most.",
    moodTags: ['Space Opera', 'Brutal Rebellion', 'Class Warfare'],
    curatorClue: "For readers hungry for the cutthroat intrigue of Dune and the visceral pace of The Hunger Games.",
    realTitle: "Red Rising",
    realAuthor: "Pierce Brown",
    hardcopyPrice: "₦8,500",
    catalogLink: "/bookstore?search=Red+Rising"
  },
  {
    id: 'mystery-2',
    code: 'SPECIMEN-VIVEK',
    openingConfession: "“Some people call me a monster. Some people call me an angel. I am merely the truth.”",
    synopsis: "One afternoon in southeastern Nigeria, a mother opens her front door to find the lifeless body of her son wrapped in vivid market print. What follows is a luminous, tender puzzle of grief, radical freedom, and chosen family.",
    moodTags: ['Nigerian Sagas', 'Haunting Grief', 'Transcendent Identity'],
    curatorClue: "A masterwork of modern African literature that refuses to fit quietly inside traditional boxes.",
    realTitle: "The Death of Vivek Oji",
    realAuthor: "Akwaeke Emezi",
    hardcopyPrice: "₦6,500",
    catalogLink: "/bookstore?search=Vivek"
  },
  {
    id: 'mystery-3',
    code: 'SPECIMEN-STAY',
    openingConfession: "“If the miracle of pregnancy does not happen this month, I will bring another woman into this bedroom.”",
    synopsis: "In 1980s Ilesa, a modern love match begins to fracture beneath the unbearable weight of ancient family expectations. A breathless story of how far desperation will drive a woman to protect her dignity.",
    moodTags: ['1980s Nigeria', 'Domestic Suspense', 'Searing Heartbreak'],
    curatorClue: "Shortlisted for the Baileys Women's Prize for Fiction. Fast, devastating, impossible to put down.",
    realTitle: "Stay With Me",
    realAuthor: "Ayobami Adebayo",
    hardcopyPrice: "₦5,500",
    catalogLink: "/bookstore?search=Stay+With+Me"
  }
];

export default function Landing({ 
  images, 
  books = [], 
  storyPrompt, 
  poemPrompt, 
  botmBook, 
  generalBotm,
  latestAnthology = null
}) {
  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  // Manor Soundscape Hearth State
  const [soundMode, setSoundMode] = useState('off'); // 'off' | 'fireplace' | 'rain'

  // Blind Date Wax-Seal Mystery State
  const [currentMysteryIndex, setCurrentMysteryIndex] = useState(0);
  const [isSealBroken, setIsSealBroken] = useState(false);
  const [revealedTitle, setRevealedTitle] = useState(false);

  // Floating Embers array (14 deterministic coordinates)
  const embers = [
    { left: '12%', delay: 0.2, duration: 6.5, size: 4 },
    { left: '22%', delay: 1.8, duration: 8.0, size: 5 },
    { left: '35%', delay: 0.7, duration: 7.2, size: 3 },
    { left: '48%', delay: 2.4, duration: 6.8, size: 6 },
    { left: '58%', delay: 1.1, duration: 7.5, size: 4 },
    { left: '68%', delay: 3.2, duration: 8.5, size: 5 },
    { left: '79%', delay: 0.5, duration: 6.2, size: 3 },
    { left: '88%', delay: 2.0, duration: 7.8, size: 4 },
    { left: '16%', delay: 4.1, duration: 7.1, size: 5 },
    { left: '42%', delay: 3.6, duration: 8.2, size: 4 },
    { left: '62%', delay: 4.8, duration: 6.9, size: 3 },
    { left: '74%', delay: 5.2, duration: 7.4, size: 5 },
    { left: '84%', delay: 4.5, duration: 8.1, size: 4 },
    { left: '28%', delay: 5.8, duration: 6.6, size: 4 }
  ];

  // Soundscape handler
  const handleToggleSound = (mode) => {
    if (typeof window === 'undefined') return;
    if (!globalHearthSynth) {
      globalHearthSynth = new ManorHearthSynth();
    }

    if (soundMode === mode) {
      globalHearthSynth.stop();
      setSoundMode('off');
    } else {
      globalHearthSynth.play(mode);
      setSoundMode(mode);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (globalHearthSynth) {
        globalHearthSynth.stop();
      }
    };
  }, []);

  // Break Wax Seal action
  const handleBreakSeal = () => {
    setIsSealBroken(true);
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#c96a42', '#F2A98A', '#20070e', '#FBF7EE']
    });
  };

  // Next mystery book
  const handleNextMystery = () => {
    setIsSealBroken(false);
    setRevealedTitle(false);
    setCurrentMysteryIndex((prev) => (prev + 1) % MYSTERY_PARCELS.length);
  };

  const currentMystery = MYSTERY_PARCELS[currentMysteryIndex];

  // Newsletter Submit
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
      archiveStamp: "ZARIA ARCHIVES · SPECIMEN #01",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&h=600&fit=crop"
    },
    {
      id: "2",
      title: "Stay With Me",
      author: "Ayobami Adebayo",
      genre: "Fiction",
      price: "5500",
      archiveStamp: "KADUNA CHAPTER · HARDCOPY #02",
      imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&h=600&fit=crop"
    },
    {
      id: "3",
      title: "Akata Witch",
      author: "Nnedi Okorafor",
      genre: "Fantasy",
      price: "6000",
      archiveStamp: "ABUJA TABLE · VERIFIED LOAN #03",
      imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&h=600&fit=crop"
    },
    {
      id: "4",
      title: "Chronicles from the Happiest People",
      author: "Wole Soyinka",
      genre: "Satire",
      price: "8500",
      archiveStamp: "SANCTUARY VAULT · COLLECTOR #04",
      imageUrl: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400&h=600&fit=crop"
    }
  ];

  const rawBooks = books && books.length > 0 ? books.slice(0, 4) : fallbackFeaturedBooks;
  const bookstoreList = rawBooks.map((b, idx) => ({
    ...b,
    archiveStamp: b.archiveStamp || `ZARIA ACCESSION #0${idx + 1} · NO-PDFS`
  }));

  const fallbackBotm = {
    id: 17,
    title: 'Red Rising',
    author: 'Pierce Brown',
    imageUrl: '/images/red_rising.jpg',
    teaser: `“I would have lived in peace, but my enemies brought me war.”\n\nDarrow is a Red, a member of the lowest caste in the color-coded society of the future. Fueled by grief and a burning desire for justice, Darrow sacrifices everything to infiltrate the legendary Institute, a brutal proving ground where the dominant caste’s best and brightest vie for power.`
  };

  const activeBotm = botmBook || generalBotm || fallbackBotm;

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
          1. CINEMATIC HERO (Atmospheric Manor · High Mobile Visibility · Embers)
          ========================================================================= */}
      <section className="relative w-full min-h-[92vh] flex items-center justify-center bg-[#120308] overflow-hidden text-[#FBF7EE] -mt-20 md:-mt-32">
        
        {/* Layer 0: High-Visibility Hero Background with Warm Amber/Sepia Tones */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.82 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img 
              src={fallbackImages[0]} 
              className="w-full h-full object-cover filter sepia-[0.22] saturate-[1.25] contrast-[1.12]"
              alt="Paper Thoughts Literary Manor Atmosphere"
            />
          </motion.div>

          {/* Calibrated Vignette (Preserves Image Recognizability on Mobile) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120308] via-[#120308]/65 to-[#120308]/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(201,106,66,0.22)_0%,transparent_70%)]" />
        </div>

        {/* Layer 1: Floating Luminous Embers (Drifting Hearth Atmosphere) */}
        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
          {embers.map((ember, i) => (
            <div
              key={i}
              className="absolute bottom-4 rounded-full bg-gradient-to-t from-[#c96a42] to-[#F2A98A] shadow-[0_0_10px_#F2A98A] animate-ember"
              style={{
                left: ember.left,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                animationDelay: `${ember.delay}s`,
                animationDuration: `${ember.duration}s`
              }}
            />
          ))}
        </div>
        
        {/* Layer 2: Main Editorial Typography & Master Anchor */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 text-center space-y-7 pt-28 pb-20">
          
          {/* Eyebrow: Cultural & Geographic Anchor */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-[#F2A98A] uppercase tracking-[0.25em] font-sans font-bold text-xs bg-black/40 border border-[#c96a42]/30 px-4 py-2 rounded-full backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#c96a42] animate-pulse" />
              The Physical Literary Clubhouse · Zaria · Kaduna · Abuja
            </span>
          </motion.div>

          {/* Master Headline: Iconic Literary Thesis */}
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-display leading-[1.08] tracking-tight font-extrabold text-[#FBF7EE] drop-shadow-md"
          >
            We came for <span className="italic text-[#c96a42]">the books.</span><br/>
            We stayed for <span className="text-[#F2A98A] italic">the chaos.</span>
          </motion.h1>

          {/* Subtitle: High-Contrast Clarity */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base sm:text-lg text-[#FBF7EE]/95 max-w-2xl mx-auto font-serif leading-relaxed drop-shadow-sm"
          >
            An opinionated reading community spanning Northern Nigeria. 
            We read heavily, debate fiercely, and never use PDFs.
          </motion.p>
          
          {/* Primary Action Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
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
              <span>or join the weekly critique cycle</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </div>

        {/* Ambient Soundscape Hearth Pill (Bottom-Right Floating Dock) */}
        <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 z-20">
          <div className="flex items-center gap-2 bg-[#20070e]/85 backdrop-blur-md border border-[#c96a42]/35 p-1.5 sm:p-2 rounded-2xl shadow-2xl text-[11px] font-mono">
            <span className="text-[#F2A98A] pl-2 font-bold flex items-center gap-1.5 hidden sm:flex">
              <span>❦</span>
              <span>Manor Hearth:</span>
            </span>

            {/* Hearth Fire Toggle */}
            <button
              onClick={() => handleToggleSound('fireplace')}
              className={`px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                soundMode === 'fireplace'
                  ? 'bg-[#c96a42] text-[#120308] shadow-sm'
                  : 'text-[#FBF7EE]/70 hover:text-[#FBF7EE] hover:bg-white/5'
              }`}
              title="Toggle Fireplace Crackle (Web Audio)"
            >
              <Flame size={12} className={soundMode === 'fireplace' ? 'animate-pulse' : ''} />
              <span>Fireplace</span>
            </button>

            {/* Kaduna Rain Toggle */}
            <button
              onClick={() => handleToggleSound('rain')}
              className={`px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                soundMode === 'rain'
                  ? 'bg-[#5c1a2e] text-[#FBF7EE] shadow-sm'
                  : 'text-[#FBF7EE]/70 hover:text-[#FBF7EE] hover:bg-white/5'
              }`}
              title="Toggle Kaduna Rain (Web Audio)"
            >
              <CloudRain size={12} className={soundMode === 'rain' ? 'animate-pulse' : ''} />
              <span>Rain</span>
            </button>

            {/* Mute Pill */}
            {soundMode !== 'off' && (
              <button
                onClick={() => handleToggleSound('off')}
                className="w-7 h-7 rounded-xl bg-white/10 text-[#FBF7EE] hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Silence Soundscape"
              >
                <VolumeX size={12} />
              </button>
            )}
          </div>
        </div>
        
        {/* Subtle Scroll Cue */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-60 text-[#FBF7EE] pointer-events-none">
          <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] font-sans font-bold">Scroll to Enter Manor</span>
          <div className="w-[1px] h-4 bg-gradient-to-b from-[#FBF7EE] to-transparent" />
        </div>
      </section>

      {/* =========================================================================
          2. LIVE CLUBHOUSE DISPATCH MARQUEE (Social Proof & Continuous Pulse)
          ========================================================================= */}
      <div className="bg-[#120308] text-[#FBF7EE] border-y border-[#c96a42]/30 py-3.5 overflow-hidden select-none relative z-10">
        <div className="animate-marquee flex items-center gap-8 text-xs font-mono tracking-widest uppercase font-bold text-[#F2A98A]">
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> 380+ Readers Across Northern Nigeria
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Zero PDFs: 100% Verified Physical Editions
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Active Book of the Month: Red Rising by Pierce Brown
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Saturday Writers' Critique Drop: 8:00 PM WAT
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Monthly Laureates Inducted into the Living Anthology
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Assembly Gatherings: Zaria · Kaduna · Abuja
          </span>
          <span className="text-white/30">|</span>
          {/* Duplicate set for seamless continuous loop */}
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> 380+ Readers Across Northern Nigeria
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Zero PDFs: 100% Verified Physical Editions
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Active Book of the Month: Red Rising by Pierce Brown
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Saturday Writers' Critique Drop: 8:00 PM WAT
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Monthly Laureates Inducted into the Living Anthology
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <span className="text-[#c96a42]">✦</span> Assembly Gatherings: Zaria · Kaduna · Abuja
          </span>
        </div>
      </div>

      {/* =========================================================================
          BLOCK 1: THE CURATED BOOKSTORE (Tactile Physicality · Vintage Archive Stamps)
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
                    {/* Book Cover with Tactile Spine & Vintage Archival Stamp */}
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border border-[#20070e]/10 bg-white relative group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1.5">
                      <img 
                        src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Tactile Book Spine Gradient */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-white/10 to-transparent pointer-events-none" />
                      
                      {/* Vintage Library Archival Watermark Stamp */}
                      <div className="absolute top-2.5 right-2.5 pointer-events-none bg-black/60 backdrop-blur-xs border border-white/20 text-[#FBF7EE] text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                        Physical Loan
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-[#20070e]/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-[#FBF7EE] text-[#20070e] text-[10px] font-sans font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                          View Details
                        </span>
                      </div>
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#c96a42] uppercase tracking-wider block">
                          {book.genre || 'Physical Hardcopy'}
                        </span>
                        <span className="text-[8px] font-mono text-[#120308]/40 uppercase tracking-widest">
                          {book.archiveStamp}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-[#20070e] leading-snug line-clamp-1 group-hover:text-[#c96a42] transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#120308]/65 truncate font-serif italic">
                        by {book.author}
                      </p>
                      <div className="pt-1 flex items-baseline justify-between border-t border-[#20070e]/10">
                        <span className="font-display font-bold text-[#20070e] text-sm">
                          ₦{parseInt(book.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#c96a42] uppercase tracking-widest font-sans font-bold">
                          Authentic Copy
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
          INTERACTIVE SURPRISE: THE WAX-SEAL "BLIND DATE WITH A BOOK"
          (Thing 76: Dopamine Trigger · Gamified Discovery · Literary Delight)
          ========================================================================= */}
      <section className="py-20 px-6 md:px-8 bg-gradient-to-b from-[#F5EDE0] to-[#EFE2CE] border-b border-[#20070e]/15 relative overflow-hidden">
        {/* Parchment background accent glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#c96a42]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-2.5">
            <span className="text-[#c96a42] uppercase tracking-[0.25em] font-sans font-bold text-xs block">
              Curator's Literary Blind Date · Secret Parcel
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-[#20070e] font-bold tracking-tight">
              Don't Judge a Book by Its Cover.
            </h2>
            <p className="text-sm md:text-base text-[#120308]/75 font-serif leading-relaxed max-w-xl mx-auto">
              Break the wax seal to reveal this week's unmasked confession. Read the opening lines before knowing the title.
            </p>
          </div>

          {/* The Wax-Sealed Parcel Card */}
          <div 
            className="bg-[#FAF7F0] border-2 border-[#c96a42]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-500"
            style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
          >
            {/* Specimen Tag Strip */}
            <div className="flex items-center justify-between border-b border-[#20070e]/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c96a42]" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#20070e] font-bold">
                  {currentMystery.code} · CLASSIFIED
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#c96a42] bg-[#c96a42]/10 px-2.5 py-0.5 rounded-full font-bold">
                Mystery Parcel #{currentMysteryIndex + 1} of {MYSTERY_PARCELS.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {!isSealBroken ? (
                /* SEALED STATE */
                <motion.div
                  key="sealed"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-8 text-center space-y-6"
                >
                  <p className="font-serif italic text-lg sm:text-2xl text-[#20070e] max-w-xl mx-auto leading-relaxed">
                    "{currentMystery.openingConfession}"
                  </p>

                  <div className="flex justify-center gap-2">
                    {currentMystery.moodTags.map((tag) => (
                      <span key={tag} className="text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#20070e]/5 text-[#20070e]/75 border border-[#20070e]/10">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Wax Seal Action Button */}
                  <div className="pt-4 flex flex-col items-center gap-3">
                    <button
                      onClick={handleBreakSeal}
                      className="group relative bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] px-8 py-4 rounded-2xl font-sans font-bold text-xs uppercase tracking-widest shadow-xl transition-all duration-300 flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95"
                    >
                      {/* Monogram Seal Icon */}
                      <span className="w-7 h-7 rounded-full bg-[#c96a42] group-hover:bg-[#20070e] text-[#FBF7EE] flex items-center justify-center font-serif text-sm font-bold shadow-inner">
                        ❦
                      </span>
                      <span>Break Wax Seal & Unmask Manuscript</span>
                    </button>
                    <span className="text-[10px] text-[#120308]/50 font-serif italic">
                      Tap to crack the seal and read the curator's verdict
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* UNSEALED / REVEALED STATE */
                <motion.div
                  key="unsealed"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 py-2"
                >
                  {/* Wax Broken Callout */}
                  <div className="bg-[#20070e] text-[#FBF7EE] p-5 sm:p-6 rounded-2xl border border-[#c96a42]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#F2A98A] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span>❦</span> Seal Broken · The Confession
                      </span>
                      <span className="text-[10px] font-mono text-[#F2A98A] bg-[#F2A98A]/10 px-2 py-0.5 rounded-full">
                        Curator Verified
                      </span>
                    </div>
                    <p className="font-serif italic text-base sm:text-lg text-[#FBF7EE] leading-relaxed pt-1">
                      {currentMystery.openingConfession}
                    </p>
                  </div>

                  {/* Synopsis & Curator Note */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-sans font-bold text-[#c96a42] tracking-widest">
                      Manuscript Synopsis:
                    </h4>
                    <p className="text-sm sm:text-base text-[#120308]/85 font-serif leading-relaxed">
                      {currentMystery.synopsis}
                    </p>
                    <div className="bg-[#c96a42]/10 border-l-3 border-[#c96a42] p-3.5 rounded-r-xl">
                      <p className="text-xs text-[#120308]/75 font-serif italic">
                        <strong>Chief Curator Note:</strong> {currentMystery.curatorClue}
                      </p>
                    </div>
                  </div>

                  {/* Unmasked Identity */}
                  <div className="p-5 rounded-2xl bg-white border border-[#20070e]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-[#120308]/50 block">
                        Unmasked Volume
                      </span>
                      <h3 className="text-xl sm:text-2xl font-display font-bold text-[#20070e]">
                        "{currentMystery.realTitle}"
                      </h3>
                      <p className="text-xs font-semibold text-[#c96a42]">
                        by {currentMystery.realAuthor} · Physical Hardcopy ({currentMystery.hardcopyPrice})
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Link
                        href={currentMystery.catalogLink}
                        className="flex-1 sm:flex-initial bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center"
                      >
                        Claim Volume in Bookstore
                      </Link>
                      <button
                        onClick={handleNextMystery}
                        className="px-4 py-2.5 rounded-xl border border-[#20070e]/20 text-[#20070e] hover:bg-black/5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        title="Draw Another Mystery Book"
                      >
                        <RefreshCw size={12} />
                        <span>Draw Next</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVING ANTHOLOGY LAUREATES RIBBON (Connecting Home to Monthly Honors)
          ========================================================================= */}
      <section className="py-12 px-6 md:px-8 bg-[#20070e] text-[#FBF7EE] border-b border-[#c96a42]/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <span className="w-12 h-12 rounded-2xl bg-[#c96a42]/20 border border-[#c96a42]/40 text-[#F2A98A] flex items-center justify-center text-2xl shrink-0">
              🌿
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2A98A] font-bold bg-[#F2A98A]/10 px-2.5 py-0.5 rounded-full">
                  The Living Anthology
                </span>
                <span className="text-[10px] text-white/50 font-mono">
                  Monthly Laureates
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#FBF7EE] font-bold">
                Read the Crowned Short Stories & Poems
              </h3>
              <p className="text-xs text-[#FBF7EE]/70 font-serif">
                5-Quill Literary Ratings, direct Leaves Tipping, and Chief Editor citations. Open to all readers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/anthology"
              className="bg-[#c96a42] hover:bg-[#F2A98A] text-[#120308] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>Explore Anthology Laureates</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
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

              {/* Literary Teaser Quote */}
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

                {/* Scannable Micro-Rules */}
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
          {/* Part A: The Assembly Events Spotlight */}
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
