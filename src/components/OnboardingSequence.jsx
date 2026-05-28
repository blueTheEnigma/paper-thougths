"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { PenTool, Flame, TreePine } from 'lucide-react';

export default function OnboardingSequence({ userName, lkId, onComplete }) {
  // Acts: 1: Egg, 2: Hatching, 3: Naming, 4: Scrolls, 5: Doors
  const [act, setAct] = useState(1);
  const [crackStage, setCrackStage] = useState(0); // 0, 1, 2, 3
  const [scrollsOpened, setScrollsOpened] = useState(new Set());
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSkipVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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

      const timer = setTimeout(() => setAct(3), 3500); // 3.5s to admire the seedling
      return () => clearTimeout(timer);
    }
  }, [crackStage]);

  const handleScrollTap = (index) => {
    setScrollsOpened(prev => new Set(prev).add(index));
  };

  const handleEnterArchive = () => {
    setDoorsOpen(true);
    // Fire final confetti
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#F2A98A', '#FFF', '#C96A42']
      });
    }, 400);

    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  // Particle background logic
  const particles = Array.from({ length: 25 }).map((_, i) => ({
    width: `${1 + (i % 3)}px`,
    height: `${1 + (i % 3)}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
  }));

  const bgStyle = act >= 3 && act < 5 
    ? { backgroundColor: '#FFF5EC' } // Parchment
    : { background: 'radial-gradient(ellipse at 50% 60%, #1a0610 0%, #0d0406 60%, #060103 100%)' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
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
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />
      )}

      {/* Skip Button */}
      {skipVisible && !showSkipConfirm && !doorsOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-6 right-6 text-cream/40 hover:text-cream/70 font-sans text-xs tracking-widest uppercase z-50 transition-colors cursor-pointer"
          onClick={handleSkip}
        >
          Skip
        </motion.button>
      )}

      {/* Skip Confirmation */}
      {showSkipConfirm && (
        <div className="absolute inset-0 bg-ink/90 z-[10001] flex items-center justify-center p-4">
          <div className="bg-cream p-8 rounded-2xl max-w-sm w-full text-center border border-sage/20 shadow-2xl">
            <h3 className="font-display text-2xl text-burgundy mb-2 font-bold">Skip Onboarding?</h3>
            <p className="text-sm font-sans text-ink/70 mb-6">Are you sure? You can replay this from your profile later.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={cancelSkip} className="px-5 py-2.5 rounded-full border border-ink text-ink font-bold text-sm hover:bg-ink/5 transition-colors cursor-pointer">
                Never mind
              </button>
              <button onClick={confirmSkip} className="px-5 py-2.5 rounded-full bg-burgundy text-cream font-bold text-sm hover:bg-ink transition-colors cursor-pointer">
                Yes, skip
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
            className="flex flex-col items-center justify-center relative w-full max-w-md mx-auto"
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
                animate={crackStage === 3 ? { scale: 2.5, opacity: 1 } : { scale: 0.3, opacity: 0 }}
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
                      {/* Inner Glow leak */}
                      <motion.div 
                        className="absolute inset-0 rounded-full blur-[30px] bg-primary/50 -z-10"
                        animate={{ opacity: crackStage === 0 ? 0 : crackStage === 1 ? 0.4 : 0.8 }}
                      />
                      <Image src="/images/panguin/egg.png" alt="Mysterious Egg" fill className="object-contain" priority />
                      
                      {/* SVG Cracks Overlay */}
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

              {/* Egg Shatter Animation Elements */}
              {crackStage === 3 && (
                <>
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-primary/80 pointer-events-none z-50"
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 8, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={`shard-${i}`}
                      className="absolute top-1/2 left-1/2 w-4 h-8 bg-cream/90 rounded-sm"
                      initial={{ scale: 1, x: "-50%", y: "-50%", rotate: 0, opacity: 1 }}
                      animate={{ 
                        x: `calc(-50% + ${Math.cos((i * 30) * Math.PI / 180) * (150 + Math.random() * 100)}px)`, 
                        y: `calc(-50% + ${Math.sin((i * 30) * Math.PI / 180) * (150 + Math.random() * 100)}px)`,
                        rotate: Math.random() * 360,
                        opacity: 0,
                        scale: 0.5
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </div>

            <motion.div 
              className="mt-12 text-center h-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: crackStage < 3 ? 1 : 0 }}
              transition={{ delay: 1 }}
            >
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-primary animate-pulse">
                {crackStage === 0 ? "Tap the egg" : crackStage === 1 ? "Again..." : "One more..."}
              </p>
            </motion.div>
            
            {crackStage === 3 && (
              <motion.div 
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
              >
                <button onClick={() => setAct(3)} className="bg-primary/20 hover:bg-primary/30 text-cream px-8 py-3 rounded-full font-sans tracking-widest text-xs uppercase font-bold transition-colors cursor-pointer border border-primary/30">
                  Continue
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ACT 3: The Naming */}
        {act === 3 && (
          <motion.div 
            key="act-3"
            className="flex flex-col items-center justify-center relative w-full max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute top-4 left-4 sm:top-12 sm:left-12">
              <motion.div 
                className="w-16 h-16 sm:w-24 sm:h-24 relative"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Image src="/images/panguin/seedling.png" alt="Seedling Panguin" fill className="object-contain drop-shadow-md" />
              </motion.div>
            </div>

            <div className="text-center mt-20 sm:mt-0">
              <motion.div 
                className="font-quote italic text-ink/70 text-2xl sm:text-3xl mb-8 flex justify-center"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.5 } }
                }}
              >
                {"You are now a...".split('').map((char, index) => (
                  <motion.span key={index} variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }}>
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.div>

              <div className="relative">
                <motion.h1 
                  className="font-display font-extrabold text-6xl sm:text-8xl text-burgundy tracking-tight relative z-10"
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1.8 }}
                >
                  READER
                </motion.h1>
                
                {/* Ink Splash */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={`ink-${i}`}
                    className="absolute top-1/2 left-1/2 rounded-full bg-burgundy/80 z-0"
                    initial={{ scale: 0, x: "-50%", y: "-50%", opacity: 1 }}
                    animate={{ 
                      x: `calc(-50% + ${Math.cos((i * 45) * Math.PI / 180) * (80 + Math.random() * 60)}px)`, 
                      y: `calc(-50% + ${Math.sin((i * 45) * Math.PI / 180) * (60 + Math.random() * 40)}px)`,
                      scale: Math.random() * 1.5 + 0.5,
                      opacity: 0
                    }}
                    transition={{ duration: 0.6, delay: 1.8, ease: "easeOut" }}
                    style={{ width: `${Math.random() * 12 + 4}px`, height: `${Math.random() * 12 + 4}px` }}
                  />
                ))}
              </div>

              <motion.div 
                className="mt-8 flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.8, duration: 0.8 }}
              >
                <h2 className="font-sans font-bold text-ink text-xl">{userName}</h2>
                <div className="bg-ink/5 px-4 py-1.5 rounded-full border border-ink/10">
                  <span className="font-sans font-medium text-xs tracking-widest text-ink/60 uppercase">{lkId}</span>
                </div>
              </motion.div>

              <motion.div 
                className="mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
              >
                <button onClick={() => setAct(4)} className="bg-burgundy hover:bg-ink text-cream px-8 py-3 rounded-full font-sans tracking-widest text-xs uppercase font-bold transition-colors cursor-pointer shadow-lg hover:-translate-y-1 transform duration-200">
                  Continue
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ACT 4: The Three Scrolls */}
        {act === 4 && (
          <motion.div 
            key="act-4"
            className="flex flex-col items-center justify-center relative w-full max-w-4xl mx-auto px-4"
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
                      <p className="font-quote text-ink/75 leading-relaxed text-[15px] italic">"{rule.text}"</p>
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
                className="bg-burgundy hover:bg-ink text-cream px-10 py-3.5 rounded-full font-sans tracking-widest text-xs uppercase font-bold transition-all shadow-lg hover:-translate-y-1"
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
            className="flex flex-col items-center justify-center relative w-full h-full max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-[300px] sm:w-[400px] h-[400px] sm:h-[500px] perspective-[1000px] cursor-pointer" onClick={handleEnterArchive}>
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
                style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 100%)' }}
              >
                {/* Door Panels */}
                <div className="absolute inset-4 border border-[#C96A42]/20 rounded-sm pointer-events-none" />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-16 bg-[#C96A42] rounded-sm shadow-md" />
              </motion.div>

              {/* Right Door */}
              <motion.div 
                className="absolute top-0 right-0 w-1/2 h-full bg-[#3d111e] border-2 border-[#C96A42]/40 border-l-0 origin-right z-10 flex items-center justify-start pl-2 overflow-hidden shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)]"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: doorsOpen ? 85 : 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundImage: 'linear-gradient(-90deg, transparent 0%, rgba(0,0,0,0.2) 100%)' }}
              >
                {/* Door Panels */}
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
