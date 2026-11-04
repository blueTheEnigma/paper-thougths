"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { 
  PenTool, Flame, TreePine, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, MapPin, Calendar, AtSign, 
  BookOpen, ChevronRight, Gift
} from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa6';

// Simple deterministic LCG random generator to ensure hydration consistency and satisfy React purity rules.
const createRandom = (seed) => {
  let val = seed;
  return () => {
    val = (val * 1103515245 + 12345) & 0x7fffffff;
    return val / 2147483648;
  };
};

const AVAILABLE_CHAPTERS = [
  'Zaria (ABU)',
  'Kaduna',
  'Abuja',
  'Other'
];

const AVAILABLE_GENRES = [
  'Fiction', 'Non-Fiction', 'Literary Fiction', 'Memoir', 
  'Self-Help', 'Fantasy', 'Science Fiction', 'Thriller', 
  'Romance', 'Historical Fiction', 'Classic Fiction', 'Poetry', 'Humour'
];

export default function OnboardingSequence({ userName, lkId, profile, onComplete }) {
  // Acts: 1: Egg, 2: Hatching, 3: Registry & Naming, 4: Scrolls, 5: Doors
  const [act, setAct] = useState(1);
  const [crackStage, setCrackStage] = useState(0); // 0, 1, 2, 3
  const [scrollsOpened, setScrollsOpened] = useState(new Set());
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);

  // Registry Form State
  const [alias, setAlias] = useState(profile?.alias || '');
  const [aliasStatus, setAliasStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'error'
  const [aliasMessage, setAliasMessage] = useState('');
  const [chapter, setChapter] = useState(profile?.chapter || 'Zaria (ABU)');
  const [birthday, setBirthday] = useState(profile?.birthday || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [instagram, setInstagram] = useState(profile?.instagram || '');
  const [selectedGenres, setSelectedGenres] = useState(profile?.preferredGenres || []);
  const [referral, setReferral] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registryError, setRegistryError] = useState('');

  const debounceTimerRef = useRef(null);

  // Check URL / localStorage for referral code on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRef = localStorage.getItem('pt_ref_code') || '';
      if (storedRef && !referral) {
        setReferral(storedRef);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSkipVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Real-time debounced Alias validation
  useEffect(() => {
    const clean = alias.replace(/^@+/, '').trim().toLowerCase();
    if (!clean) {
      setAliasStatus('idle');
      setAliasMessage('');
      return;
    }

    if (clean.length < 3) {
      setAliasStatus('error');
      setAliasMessage('Must be at least 3 characters.');
      return;
    }

    if (clean.length > 25) {
      setAliasStatus('error');
      setAliasMessage('Must be 25 characters or less.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setAliasStatus('error');
      setAliasMessage('Only letters, numbers, and underscores.');
      return;
    }

    setAliasStatus('checking');
    setAliasMessage('Verifying availability...');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/me/check-alias?alias=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.available) {
          setAliasStatus('available');
          setAliasMessage(`@${clean} is available!`);
        } else {
          setAliasStatus('error');
          setAliasMessage(data.reason || 'This alias is not available.');
        }
      } catch (err) {
        setAliasStatus('error');
        setAliasMessage('Could not verify alias.');
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [alias]);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSkip = () => {
    setShowSkipConfirm(true);
  };

  const confirmSkip = () => {
    onComplete();
  };

  const cancelSkip = () => {
    setShowSkipConfirm(false);
  };

  // Egg tapping logic
  const handleEggTap = () => {
    if (crackStage < 3) {
      setCrackStage(prev => prev + 1);
    }
  };

  // When crackStage hits 3, transition to Act 3 after explosion
  useEffect(() => {
    if (crackStage === 3) {
      // Fire confetti for the shattering
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#F2A98A', '#5C1A2E', '#FAF7F2']
        });
      }, 300);

      const timer = setTimeout(() => setAct(3), 3200);
      return () => clearTimeout(timer);
    }
  }, [crackStage]);

  const handleRegistrySubmit = async (e) => {
    e.preventDefault();
    setRegistryError('');

    const cleanAlias = alias.replace(/^@+/, '').trim().toLowerCase();
    if (!cleanAlias) {
      setRegistryError('Please choose a unique Alias (* mandatory).');
      return;
    }

    if (aliasStatus === 'error') {
      setRegistryError(aliasMessage || 'Please choose a valid and available Alias.');
      return;
    }

    if (!chapter) {
      setRegistryError('Please select your Sanctuary Chapter (* mandatory).');
      return;
    }

    if (!birthday) {
      setRegistryError('Please enter your Birthday (* mandatory for leaves honors).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/me/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: cleanAlias,
          chapter,
          birthday,
          whatsapp,
          instagram,
          preferredGenres: selectedGenres,
          referral: referral.trim()
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to consecrate registry. Please try again.');
      }

      // Success celebration!
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#C96A42', '#20070E', '#F2A98A', '#FFF']
      });

      // Clear referral storage if used
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pt_ref_code');
      }

      // Transition to Act 4: The 3 Lore Scrolls
      setAct(4);
    } catch (err) {
      setRegistryError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollTap = (index) => {
    setScrollsOpened(prev => new Set(prev).add(index));
  };

  const handleEnterArchive = () => {
    setDoorsOpen(true);
    // Fire final confetti
    setTimeout(() => {
      confetti({
        particleCount: 220,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#F2A98A', '#FFF', '#C96A42', '#5C1A2E']
      });
    }, 400);

    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  // Particle background logic
  const particles = React.useMemo(() => {
    const rnd = createRandom(42);
    return Array.from({ length: 25 }).map((_, i) => ({
      width: `${1 + (i % 3)}px`,
      height: `${1 + (i % 3)}px`,
      left: `${rnd() * 100}%`,
      top: `${rnd() * 100}%`,
      duration: 3 + rnd() * 4,
      delay: rnd() * 3,
    }));
  }, []);

  // Pre-generate stable random values for shard explosion
  const shardOffsets = React.useMemo(() => {
    const rnd = createRandom(101);
    return Array.from({ length: 12 }).map(() => ({
      distance: 150 + rnd() * 100,
      rotate: rnd() * 360,
    }));
  }, []);

  // Pre-generate stable random values for ink splash
  const inkSplashes = React.useMemo(() => {
    const rnd = createRandom(202);
    return Array.from({ length: 8 }).map(() => ({
      distanceX: 80 + rnd() * 60,
      distanceY: 60 + rnd() * 40,
      scale: rnd() * 1.5 + 0.5,
      size: rnd() * 12 + 4,
    }));
  }, []);

  const bgStyle = act >= 3 && act < 5 
    ? { backgroundColor: '#FFF5EC' } // Warm parchment
    : { background: 'radial-gradient(ellipse at 50% 60%, #1a0610 0%, #0d0406 60%, #060103 100%)' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-start overflow-y-auto py-8 px-4"
      style={bgStyle}
    >
      {/* Background Particles (Visible in acts 1, 2, 5) */}
      {(act < 3 || act === 5) && particles.map((p, i) => (
        <motion.div
          key={`bg-particle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            background: i % 4 === 0 ? 'rgba(242,169,138,0.6)' : 'rgba(201,106,66,0.4)',
          }}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Parchment Noise Overlay (Visible in acts 3, 4) */}
      {(act === 3 || act === 4) && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-30 mix-blend-multiply"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />
      )}

      {/* Skip Button */}
      {skipVisible && !showSkipConfirm && !doorsOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-6 right-6 text-ink/40 hover:text-burgundy font-sans text-xs tracking-widest uppercase z-50 transition-colors cursor-pointer"
          onClick={handleSkip}
        >
          Skip Ritual
        </motion.button>
      )}

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/75 z-[10001] flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] p-8 rounded-3xl max-w-sm w-full text-center border-2 border-burgundy/20 shadow-2xl">
            <h3 className="font-display text-2xl text-burgundy mb-2 font-bold">Skip Consecration?</h3>
            <p className="text-sm font-sans text-ink/70 mb-6">
              You can complete your Reader profile and choose your Alias anytime from Profile Settings.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={cancelSkip} 
                className="px-5 py-2.5 rounded-full border border-ink/30 text-ink font-bold text-xs uppercase tracking-wider hover:bg-ink/5 transition-colors cursor-pointer"
              >
                Never mind
              </button>
              <button 
                onClick={confirmSkip} 
                className="px-5 py-2.5 rounded-full bg-burgundy text-cream font-bold text-xs uppercase tracking-wider hover:bg-ink transition-colors cursor-pointer shadow-md"
              >
                Yes, enter
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ACT 1 & 2: The Egg & Hatching */}
        {(act === 1 || act === 2) && (
          <motion.div 
            key="act-1-2"
            className="flex flex-col items-center justify-center relative w-full max-w-md mx-auto my-auto min-h-[80vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <p className="font-quote italic text-cream/80 text-xl tracking-wide">
                Something stirs in the Archive...
              </p>
            </motion.div>

            <div className="relative w-64 h-64 sm:w-80 sm:h-80 cursor-pointer" onClick={handleEggTap}>
              {/* Seedling (Hidden behind egg until shatter) */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center z-50"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={crackStage === 3 ? { scale: 2.2, opacity: 1 } : { scale: 0.3, opacity: 0 }}
                transition={crackStage === 3 ? { type: "spring", stiffness: 100, damping: 12, delay: 0.4 } : { duration: 0 }}
              >
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  {crackStage === 3 && (
                    <motion.div 
                      className="absolute inset-0 rounded-full blur-[40px] bg-primary/40 -z-10"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <Image src="/images/panguin/seedling.png" alt="Seedling Panguin" fill className="object-contain drop-shadow-2xl z-10" />
                </div>
              </motion.div>

              {/* Egg Image and Cracks */}
              <AnimatePresence>
                {crackStage < 3 && (
                  <motion.div 
                    key="the-egg"
                    className="absolute inset-0 z-40"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    whileHover={crackStage < 3 ? { rotate: [0, -3, 3, -2, 0], transition: { duration: 0.3 } } : {}}
                    exit={{ scale: 3, opacity: 0, filter: "brightness(2) blur(10px)", transition: { duration: 0.5, ease: "easeOut" } }}
                  >
                    <motion.div
                      animate={
                        crackStage === 1 ? { x: [0, -3, 3, -2, 0] } :
                        crackStage === 2 ? { x: [0, -5, 5, -4, 4, -2, 0] } : {}
                      }
                      transition={{ duration: crackStage === 1 ? 0.3 : 0.5 }}
                      className="w-full h-full relative"
                    >
                      <motion.div 
                        className="absolute inset-0 rounded-full blur-[30px] bg-primary/50 -z-10"
                        animate={{ opacity: crackStage === 0 ? 0 : crackStage === 1 ? 0.4 : 0.8 }}
                      />
                      <Image src="/images/panguin/egg.png" alt="Mysterious Egg" fill className="object-contain" priority />
                      
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                        {crackStage >= 1 && (
                          <motion.path 
                            d="M 45 20 Q 50 35 48 50 T 55 75" 
                            stroke="#FFE4C4" strokeWidth="1" fill="transparent" 
                            strokeLinecap="round" strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.8 }}
                            transition={{ duration: 0.4 }}
                            style={{ filter: 'drop-shadow(0px 0px 2px #F2A98A)' }}
                          />
                        )}
                        {crackStage >= 2 && (
                          <>
                            <motion.path 
                              d="M 48 50 Q 30 55 20 45" 
                              stroke="#FFE4C4" strokeWidth="1" fill="transparent" 
                              strokeLinecap="round" strokeLinejoin="round"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.8 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              style={{ filter: 'drop-shadow(0px 0px 3px #F2A98A)' }}
                            />
                            <motion.path 
                              d="M 52 60 Q 70 65 80 55" 
                              stroke="#FFE4C4" strokeWidth="1" fill="transparent" 
                              strokeLinecap="round" strokeLinejoin="round"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.8 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                              style={{ filter: 'drop-shadow(0px 0px 3px #F2A98A)' }}
                            />
                          </>
                        )}
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {crackStage === 3 && (
                <>
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-primary/80 pointer-events-none z-50"
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 8, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {Array.from({ length: 12 }).map((_, i) => {
                    const offset = shardOffsets[i];
                    return (
                      <motion.div
                        key={`shard-${i}`}
                        className="absolute top-1/2 left-1/2 w-4 h-4 rounded-sm bg-[#FFE4C4] border border-primary/40 pointer-events-none z-40"
                        initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                        animate={{ 
                          x: Math.cos(offset.rotate * Math.PI / 180) * offset.distance,
                          y: Math.sin(offset.rotate * Math.PI / 180) * offset.distance,
                          opacity: 0,
                          rotate: offset.rotate * 2
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    );
                  })}
                </>
              )}
            </div>

            <motion.div 
              className="mt-12 text-center h-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: crackStage < 3 ? 1 : 0 }}
              transition={{ delay: 1 }}
            >
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-primary animate-pulse font-bold">
                {crackStage === 0 ? "Tap the egg" : crackStage === 1 ? "Again..." : "One more..."}
              </p>
            </motion.div>
            
            {crackStage === 3 && (
              <motion.div 
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <button 
                  onClick={() => setAct(3)} 
                  className="bg-primary/20 hover:bg-primary/30 text-cream px-8 py-3 rounded-full font-sans tracking-widest text-xs uppercase font-bold transition-colors cursor-pointer border border-primary/30 shadow-lg"
                >
                  Step into the Registry →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ACT 3: The Reader's Registry & Naming Ceremony */}
        {act === 3 && (
          <motion.div 
            key="act-3"
            className="flex flex-col items-center justify-start relative w-full max-w-2xl mx-auto my-auto py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Seedling Icon floating at top */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 relative drop-shadow-md">
                <Image src="/images/panguin/seedling.png" alt="Seedling" fill className="object-contain" />
              </div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-burgundy/70">
                The Sacred Ledger
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-burgundy tracking-tight text-center mb-1">
              Welcome, Reader
            </h1>
            <p className="font-quote italic text-ink/75 text-sm sm:text-base text-center mb-6 max-w-md">
              &quot;Inscribe your unique Alias and consecrate your presence into the grand archive ledger.&quot;
            </p>

            {/* Permanent LK-ID Serial Banner */}
            <div className="bg-[#FAF7F2] border-2 border-[#C96A42]/30 rounded-2xl px-6 py-3 mb-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 shadow-sm w-full max-w-lg justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50 block">Permanent Ledger Serial</span>
                <span className="font-mono font-bold text-burgundy text-lg tracking-wider">{lkId || "CONSECRATING..."}</span>
              </div>
              <span className="text-[11px] font-sans text-ink/60 italic">Your immutable membership token</span>
            </div>

            {/* Registry Card Form */}
            <div className="w-full max-w-lg bg-white/90 backdrop-blur-md border border-[#E6D5C3] rounded-3xl p-6 sm:p-8 shadow-xl">
              <form onSubmit={handleRegistrySubmit} className="space-y-5">
                
                {/* 1. Alias (* Mandatory) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center gap-1.5">
                      <AtSign size={13} className="text-primary" />
                      Alias <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-ink/50 font-sans">Your public clubhouse identity</span>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 font-bold text-sm">@</span>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. foluso_reads"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      className="w-full pl-8 pr-10 py-2.5 bg-[#FAF8F5] border border-ink/15 rounded-xl text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {aliasStatus === 'checking' && <Loader2 size={16} className="text-ink/40 animate-spin" />}
                      {aliasStatus === 'available' && <CheckCircle2 size={16} className="text-green-600" />}
                      {aliasStatus === 'error' && <AlertCircle size={16} className="text-red-600" />}
                    </div>
                  </div>

                  {aliasMessage && (
                    <p className={`text-[11px] font-sans mt-1.5 ${aliasStatus === 'available' ? 'text-green-700' : 'text-red-600'}`}>
                      {aliasMessage}
                    </p>
                  )}
                </div>

                {/* 2. Chapter (* Mandatory) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-burgundy mb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary" />
                    Chapter <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_CHAPTERS.map((chap) => {
                      const isSelected = chapter === chap;
                      return (
                        <button
                          key={chap}
                          type="button"
                          onClick={() => setChapter(chap)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                            isSelected 
                              ? 'bg-burgundy text-cream border-burgundy shadow-sm' 
                              : 'bg-[#FAF8F5] text-ink/70 border-ink/10 hover:border-burgundy/40'
                          }`}
                        >
                          {chap}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Birthday (* Mandatory) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-burgundy mb-1.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" />
                    Birthday <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input 
                    type="date"
                    required
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-ink/15 rounded-xl text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <p className="text-[10px] text-ink/50 mt-1 italic font-sans">
                    Sanctuary birthdays unlock honorary leaves and annual fellowship rewards.
                  </p>
                </div>

                {/* 4. WhatsApp Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-burgundy mb-1.5 flex items-center gap-1.5">
                    <FaWhatsapp size={14} className="text-green-600" />
                    WhatsApp Number
                  </label>
                  <input 
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-ink/15 rounded-xl text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <p className="text-[10px] text-ink/50 mt-1 font-sans">
                    For chapter gathering alerts and book reading circle dispatches.
                  </p>
                </div>

                {/* 5. Instagram Handle (Optional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-burgundy mb-1.5 flex items-center gap-1.5">
                    <FaInstagram size={14} className="text-pink-600" />
                    Instagram <span className="text-[10px] font-normal text-ink/50 lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 font-bold text-sm">@</span>
                    <input 
                      type="text"
                      placeholder="username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-[#FAF8F5] border border-ink/15 rounded-xl text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                    />
                  </div>
                </div>

                {/* 6. Preferred Literary Genres */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-burgundy mb-2 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-primary" />
                    Preferred Genres
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-[#FAF8F5] rounded-xl border border-ink/10">
                    {AVAILABLE_GENRES.map((g) => {
                      const isSelected = selectedGenres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenre(g)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-burgundy text-cream' 
                              : 'bg-white text-ink/70 border border-ink/10 hover:border-burgundy/30'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Referred By (Optional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-burgundy mb-1.5 flex items-center gap-1.5">
                    <Gift size={13} className="text-primary" />
                    Referred By <span className="text-[10px] font-normal text-ink/50 lowercase">(optional)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Friend's LK-ID or @alias"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-ink/15 rounded-xl text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                </div>

                {/* Error Banner */}
                {registryError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{registryError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting || aliasStatus === 'checking'}
                  className="w-full py-3.5 bg-burgundy hover:bg-ink text-cream font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Consecrating Ledger...</span>
                    </>
                  ) : (
                    <>
                      <span>Consecrate Identity & Unfurl Lore</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ACT 4: The Three Scrolls */}
        {act === 4 && (
          <motion.div 
            key="act-4"
            className="flex flex-col items-center justify-center relative w-full max-w-4xl mx-auto px-4 my-auto min-h-[80vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
              <motion.div className="w-12 h-12 sm:w-16 sm:h-16 relative" animate={{ rotate: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <Image src="/images/panguin/seedling.png" alt="Seedling" fill className="object-contain" />
              </motion.div>
            </div>

            <motion.h2 
              className="font-sans font-bold tracking-[0.25em] text-xs sm:text-sm uppercase text-burgundy mb-12 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              The Tenets of the Archive
            </motion.h2>

            <div className="flex flex-col gap-6 w-full max-w-xl">
              {[
                { title: "Honest & Kind Reviews", text: "Give reviews the way you'd want to receive them — honest enough to sharpen, kind enough to encourage.", icon: <PenTool size={20} className="text-accent" /> },
                { title: "Keep the Writing Streak Alive", text: "Write every week. Your streak is your pulse in the Archive — miss a beat and you start again.", icon: <Flame size={20} className="text-orange-500" /> },
                { title: "Respect the Village", text: "Every member is both student and teacher. Lift each other. The Archive grows when you do.", icon: <TreePine size={20} className="text-sage" /> }
              ].map((rule, idx) => (
                <motion.div 
                  key={`rule-${idx}`}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: idx === 0 || scrollsOpened.has(idx - 1) ? 1 : 0, x: 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className={`relative cursor-pointer transition-all ${idx > 0 && !scrollsOpened.has(idx - 1) ? 'pointer-events-none' : ''}`}
                  onClick={() => handleScrollTap(idx)}
                >
                  <motion.div 
                    className="bg-[#FFF8F0] border border-[#E6D5C3] rounded-xl shadow-md overflow-hidden relative"
                    animate={{ height: scrollsOpened.has(idx) ? 'auto' : '64px' }}
                    transition={{ type: "spring", stiffness: 150, damping: 20 }}
                  >
                    {/* Unopened state visual (Rolled scroll) */}
                    <div className="absolute inset-x-0 top-0 h-[64px] flex items-center px-6 gap-4 bg-gradient-to-r from-[#FFF5EC] to-[#FDF0E3]">
                      <div className="w-8 h-8 rounded-full bg-cream border border-[#E6D5C3] flex items-center justify-center shrink-0 shadow-inner">
                        {scrollsOpened.has(idx) ? rule.icon : <span className="text-ink/30 font-display font-bold">{idx + 1}</span>}
                      </div>
                      <h3 className="font-display font-bold text-lg text-ink/80">{rule.title}</h3>
                      {!scrollsOpened.has(idx) && (
                        <span className="ml-auto text-xs font-sans uppercase tracking-widest text-primary animate-pulse">Tap to unfurl</span>
                      )}
                    </div>

                    {/* Opened state content */}
                    <motion.div 
                      className="pt-[76px] pb-6 px-6 sm:px-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: scrollsOpened.has(idx) ? 1 : 0 }}
                      transition={{ duration: 0.3, delay: scrollsOpened.has(idx) ? 0.2 : 0 }}
                    >
                      <p className="font-quote text-ink/75 leading-relaxed text-[15px] italic">&quot;{rule.text}&quot;</p>
                    </motion.div>
                  </motion.div>
                  
                  {/* Dust puff on open */}
                  {scrollsOpened.has(idx) && (
                    <motion.div 
                      className="absolute inset-0 border-2 border-primary/20 rounded-xl pointer-events-none"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.05, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="mt-12 h-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: scrollsOpened.size === 3 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <button 
                onClick={() => setAct(5)} 
                className="bg-burgundy hover:bg-ink text-cream px-10 py-3.5 rounded-full font-sans tracking-widest text-xs uppercase font-bold transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                Proceed to the Doors
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ACT 5: The Grand Doors */}
        {act === 5 && (
          <motion.div 
            key="act-5"
            className="flex flex-col items-center justify-center relative w-full h-full max-w-5xl mx-auto my-auto min-h-[80vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="relative w-[300px] sm:w-[400px] h-[400px] sm:h-[500px] cursor-pointer" 
              onClick={handleEnterArchive}
              style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
            >
              {/* Golden light that pours out when open */}
              <motion.div 
                className="absolute inset-0 bg-cream z-0 blur-[60px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: doorsOpen ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />

              {/* Left Door */}
              <motion.div 
                className="absolute top-0 left-0 w-1/2 h-full bg-[#3d111e] border-2 border-[#C96A42]/40 origin-left z-10 flex items-center justify-end pr-2 overflow-hidden shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: doorsOpen ? -85 : 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  transformStyle: 'preserve-3d', 
                  WebkitTransformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 100%)' 
                }}
              >
                <div className="absolute inset-4 border border-[#C96A42]/20 rounded-sm pointer-events-none" />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-16 bg-[#C96A42] rounded-sm shadow-md" />
              </motion.div>

              {/* Right Door */}
              <motion.div 
                className="absolute top-0 right-0 w-1/2 h-full bg-[#3d111e] border-2 border-[#C96A42]/40 border-l-0 origin-right z-10 flex items-center justify-start pl-2 overflow-hidden shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)]"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: doorsOpen ? 85 : 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  transformStyle: 'preserve-3d', 
                  WebkitTransformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  backgroundImage: 'linear-gradient(-90deg, transparent 0%, rgba(0,0,0,0.2) 100%)' 
                }}
              >
                <div className="absolute inset-4 border border-[#C96A42]/20 rounded-sm pointer-events-none" />
              </motion.div>
            </div>

            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: doorsOpen ? 0 : 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-sans font-bold tracking-[0.3em] uppercase text-primary animate-pulse cursor-pointer" onClick={handleEnterArchive}>
                Enter the Archive
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
