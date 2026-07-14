"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Sparkles, ArrowRight, RefreshCw, Download, 
  Gift, BookOpen, Share2, CheckCircle2, Loader2, ArrowLeft
} from 'lucide-react';
import { QUESTIONS, ARCHETYPES } from '@/lib/archetypesData';

export default function ArchetypeQuizPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';
  const router = useRouter();

  // Quiz State
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: archetypeId }
  const [result, setResult] = useState(null); // Resolved Archetype object
  const [isFlipped, setIsFlipped] = useState(false); // Result card flip animation
  
  // API & Reward state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [newLeavesBalance, setNewLeavesBalance] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const canvasRef = useRef(null);

  // Trigger confetti burst on reveal
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setIsFlipped(false);
    setSaved(false);
    setRewarded(false);
    setErrorMessage("");
  };

  const handleSelectOption = (archetypeId) => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: archetypeId };
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    } else {
      // Calculate results
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (finalAnswers) => {
    // Count frequencies of each archetype
    const counts = {};
    Object.values(finalAnswers).forEach(arch => {
      counts[arch] = (counts[arch] || 0) + 1;
    });

    // Find the archetype with max count
    let maxArch = null;
    let maxCount = -1;

    Object.keys(counts).forEach(arch => {
      if (counts[arch] > maxCount) {
        maxCount = counts[arch];
        maxArch = arch;
      }
    });

    const finalArchetype = ARCHETYPES[maxArch];
    setResult(finalArchetype);
    
    // Trigger animations
    setTimeout(() => {
      triggerConfetti();
    }, 500);

    // Save result if logged in
    if (isLoggedIn) {
      saveArchetypeToDb(maxArch);
    }
  };

  const saveArchetypeToDb = async (archetypeId) => {
    setSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch('/api/archetype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetype: archetypeId })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setRewarded(data.rewarded);
        if (data.rewarded) {
          setNewLeavesBalance(data.newLeaves);
        }
      } else {
        setErrorMessage(data.error || "Failed to save results.");
      }
    } catch (err) {
      console.error("Save archetype error:", err);
      setErrorMessage("Connection issue. Unable to save your badge.");
    } finally {
      setSaving(false);
    }
  };

  // Generate Image via HTML5 Canvas
  const handleDownloadCard = () => {
    if (!result) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    // Draw background color (light warm cream)
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, width, height);

    // Double borders
    ctx.strokeStyle = result.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = '#C96A42';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Draw Corner Accents
    ctx.fillStyle = result.color;
    const drawAccent = (x, y) => {
      ctx.fillRect(x, y, 12, 12);
    };
    drawAccent(33, 33);
    drawAccent(width - 45, 33);
    drawAccent(33, height - 45);
    drawAccent(width - 45, height - 45);

    // Brand Header
    ctx.fillStyle = 'rgba(44, 26, 14, 0.4)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P A P E R   T H O U G H T S   A R C H I V E', width / 2, 80);

    // Emoji/Icon
    ctx.font = '72px sans-serif';
    ctx.fillText(result.emoji, width / 2, 180);

    // Archetype Title
    ctx.fillStyle = result.color;
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(result.name.toUpperCase(), width / 2, 240);

    // Tagline
    ctx.fillStyle = 'rgba(44, 26, 14, 0.7)';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText(`"${result.tagline}"`, width / 2, 280);

    // Line Divider
    ctx.strokeStyle = 'rgba(44, 26, 14, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 320);
    ctx.lineTo(width - 100, 320);
    ctx.stroke();

    // 2-Column Details
    const colWidth = 280;
    const leftColX = 90;
    const rightColX = 430;

    // A. Left Column - TRAITS
    ctx.textAlign = 'left';
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('TRAITS', leftColX, 360);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';
    let startY = 390;
    result.traits.forEach(trait => {
      // Draw bullet
      ctx.fillStyle = result.color;
      ctx.fillText('•', leftColX, startY);
      
      // Draw wrapped text
      ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
      const words = trait.split(' ');
      let line = '';
      let lineY = startY;
      for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > colWidth - 20 && n > 0) {
          ctx.fillText(line, leftColX + 15, lineY);
          line = words[n] + ' ';
          lineY += 20;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, leftColX + 15, lineY);
      startY = lineY + 30;
    });

    // B. Left Column - SUPERPOWER & KRYPTONITE
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('SUPERPOWER ⚡', leftColX, startY);
    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';
    
    // Draw superpower text
    let words = result.superpower.split(' ');
    let line = '';
    let lineY = startY + 25;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > colWidth && n > 0) {
        ctx.fillText(line, leftColX, lineY);
        line = words[n] + ' ';
        lineY += 20;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, leftColX, lineY);

    startY = lineY + 35;
    ctx.fillStyle = '#C96A42';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('KRYPTONITE 💔', leftColX, startY);
    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';

    // Draw kryptonite text
    words = result.kryptonite.split(' ');
    line = '';
    lineY = startY + 25;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > colWidth && n > 0) {
        ctx.fillText(line, leftColX, lineY);
        line = words[n] + ' ';
        lineY += 20;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, leftColX, lineY);

    // C. Right Column - SOULMATES
    startY = 360;
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('LITERARY SOULMATES', rightColX, startY);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';
    result.literarySoulmates.forEach((soul, index) => {
      ctx.fillText(`♡  ${soul}`, rightColX, startY + 30 + (index * 25));
    });

    // D. Right Column - AUTHORS
    startY = 525;
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('AUTHORS YOU\'LL LOVE', rightColX, startY);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';
    result.authors.forEach((author, index) => {
      ctx.fillText(`•  ${author}`, rightColX, startY + 30 + (index * 25));
    });

    // Separator line
    ctx.strokeStyle = 'rgba(44, 26, 14, 0.1)';
    ctx.beginPath();
    ctx.moveTo(100, 830);
    ctx.lineTo(width - 100, 830);
    ctx.stroke();

    // Catchphrase & Fun fact footer
    ctx.textAlign = 'center';
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CATCHPHRASE', width / 2, 880);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.9)';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText(`"${result.catchphrase}"`, width / 2, 915);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.4)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('FUN FACT', width / 2, 980);

    // Draw fun fact wrapped
    ctx.fillStyle = 'rgba(44, 26, 14, 0.7)';
    ctx.font = '13px Georgia, serif';
    words = result.funFact.split(' ');
    line = '';
    lineY = 1010;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 550 && n > 0) {
        ctx.fillText(line, width / 2, lineY);
        line = words[n] + ' ';
        lineY += 20;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, lineY);

    // Footer decoration
    ctx.fillStyle = result.color;
    ctx.font = '24px Georgia, serif';
    ctx.fillText('❦', width / 2, 1100);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(44, 26, 14, 0.3)';
    ctx.fillText('DISCOVER YOUR ARCHETYPE AT PAPERTHOUGHTS.ORG', width / 2, 1140);

    // Trigger download
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaperThoughts_${result.name.replace(/\s+/g, '')}_Card.jpg`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] selection:bg-primary/20 relative py-20 px-4 md:px-6">
      
      {/* Background decoration elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-burgundy/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 pt-10">
        
        {/* Standalone Canvas (Hidden) for JPEG generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* 1. START SCREEN */}
        {!started && !result && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-2xl mx-auto py-12"
          >
            <div className="w-20 h-20 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto border border-burgundy/20 shadow-inner">
              <BookOpen size={36} className="text-burgundy animate-pulse-subtle" />
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#C96A42]">Paper Thoughts Collective</span>
              <h1 className="text-5xl md:text-6xl font-display font-extrabold text-burgundy tracking-tight">
                Reader Archetypes
              </h1>
              <p className="text-base md:text-lg text-ink/75 font-quote italic leading-relaxed max-w-xl mx-auto pt-2">
                "We read heavily, debate fiercely, and never use PDFs." Take this scenario-based personality test to uncover your true literary avatar.
              </p>
            </div>

            <div className="bg-[#FAF6F0] border border-sage/12 rounded-[28px] p-6 text-left space-y-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center gap-1.5 font-sans">
                <Gift size={14} className="text-accent" /> Gamification & Rewards
              </h4>
              <ul className="text-xs text-ink/70 space-y-2 list-disc pl-4 font-serif">
                <li>Complete all 7 quick scenario questions.</li>
                <li>Unlock a beautiful shareable infographic card matching your profile.</li>
                <li><strong>First-time completion reward</strong>: Earn <strong className="text-burgundy">+10 Paper Leaves</strong> instantly logged in your Archive ledger.</li>
              </ul>
            </div>

            <button 
              onClick={handleStart}
              className="inline-flex items-center gap-2 bg-burgundy text-white font-bold py-5 px-10 rounded-full hover:bg-ink transition-all shadow-lg hover:shadow-xl uppercase tracking-[0.2em] text-xs cursor-pointer active:scale-95"
            >
              Initiate the Test
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}

        {/* 2. QUESTION SCREEN */}
        {started && !result && (
          <div className="max-w-2xl mx-auto">
            {/* Header progress bar */}
            <div className="mb-8 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
                <span>Scenario {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / QUESTIONS.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-1 bg-sage/10 rounded-full overflow-hidden border border-sage/5">
                <div 
                  className="bg-burgundy h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Question Text */}
                <h2 className="text-2xl md:text-3xl font-display font-extrabold text-burgundy leading-tight">
                  {QUESTIONS[currentQuestionIndex].question}
                </h2>

                {/* Option Buttons */}
                <div className="space-y-3">
                  {QUESTIONS[currentQuestionIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(option.archetype)}
                      className="w-full text-left bg-white border border-sage/15 p-5 rounded-2xl hover:border-burgundy hover:shadow-md transition-all font-serif text-sm md:text-base leading-relaxed text-ink/85 hover:text-ink cursor-pointer focus:outline-none flex gap-4 items-center group relative overflow-hidden"
                    >
                      <div className="w-6 h-6 rounded-full border border-ink/15 group-hover:border-burgundy flex items-center justify-center shrink-0 text-[10px] font-bold group-hover:bg-burgundy group-hover:text-white transition-colors">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="relative z-10">{option.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* 3. RESULT SCREEN (FLIP CARD STYLE) */}
        {result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10 py-4 max-w-3xl mx-auto"
          >
            {/* Success Reward notification */}
            {saved && rewarded && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-3xl flex items-center gap-3 justify-between max-w-xl mx-auto shadow-sm"
              >
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wide">Ledger Updated</h4>
                    <p className="text-[11px] text-emerald-700/90 font-serif leading-relaxed">
                      You earned **+10 Paper Leaves** for completing the quiz! Your balance is now: **{newLeavesBalance} 🍃**.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Back to dashboard button (only if logged in) */}
            <div className="flex justify-between items-center max-w-xl mx-auto">
              <button 
                onClick={handleStart}
                className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/40 hover:text-burgundy flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} /> Retake Test
              </button>

              {isLoggedIn ? (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#C96A42] hover:text-burgundy flex items-center gap-1 cursor-pointer"
                >
                  Go to Dashboard <ArrowRight size={12} />
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/join')}
                  className="bg-burgundy text-white text-[9px] font-sans font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-ink transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Gift size={11} className="text-accent" /> Join to Claim +10 Leaves
                </button>
              )}
            </div>

            {/* Interactive Flip Card Container */}
            <div 
              className="relative w-full max-w-md mx-auto h-[680px] perspective-[1200px] cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                
                {/* A. FRONT OF CARD (Main Infographic summary) */}
                <div 
                  className="absolute inset-0 backface-hidden bg-white rounded-[40px] border-4 p-8 shadow-2xl flex flex-col justify-between"
                  style={{ 
                    backgroundImage: result.gradient,
                    borderColor: result.color
                  }}
                >
                  {/* Outer Gold border inside */}
                  <div className="absolute inset-2 border border-[#C96A42]/10 pointer-events-none rounded-[36px]" />

                  {/* Header */}
                  <div className="text-center relative z-10">
                    <span className="text-[9px] font-sans font-bold tracking-[0.2em] text-ink/40 uppercase block mb-1">
                      Reader Archetype Card
                    </span>
                    <div className="text-5xl mb-2">{result.emoji}</div>
                    <h2 className="text-3xl font-display font-extrabold leading-tight tracking-tight uppercase" style={{ color: result.color }}>
                      {result.name}
                    </h2>
                    <p className="text-xs text-ink/65 italic font-serif leading-relaxed mt-1">
                      "{result.tagline}"
                    </p>
                  </div>

                  {/* Body Info Sections */}
                  <div className="space-y-4 my-auto relative z-10 text-left">
                    {/* Traits */}
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider opacity-55" style={{ color: result.color }}>
                        Traits
                      </h4>
                      <ul className="text-[11px] text-ink/80 list-disc pl-4 space-y-0.5 font-serif font-medium leading-relaxed">
                        {result.traits.map((trait, i) => (
                          <li key={i}>{trait}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Superpower & Kryptonite */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: result.color }}>
                          Superpower ⚡
                        </h4>
                        <p className="text-[10px] text-ink/75 font-serif leading-relaxed">
                          {result.superpower}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 text-[#C96A42]">
                          Kryptonite 💔
                        </h4>
                        <p className="text-[10px] text-ink/75 font-serif leading-relaxed">
                          {result.kryptonite}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer (Witty quote block) */}
                  <div className="text-center relative z-10 pt-4 border-t border-sage/10">
                    <span className="text-[8px] font-sans font-bold tracking-wider text-ink/40 uppercase block mb-1">
                      Signature Catchphrase
                    </span>
                    <p className="text-sm font-quote italic leading-relaxed text-ink/90 font-semibold" style={{ color: result.color }}>
                      "{result.catchphrase}"
                    </p>
                    
                    <div className="mt-4 text-[9px] font-sans font-bold tracking-wider opacity-40 uppercase flex items-center justify-center gap-1.5">
                      <Share2 size={10} /> Tap Card to Flip for Soulmates
                    </div>
                  </div>
                </div>

                {/* B. BACK OF CARD (Recommendations, Soulmates, Authors) */}
                <div 
                  className="absolute inset-0 backface-hidden bg-white rounded-[40px] border-4 p-8 shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)]"
                  style={{ 
                    backgroundImage: result.gradient,
                    borderColor: result.color
                  }}
                >
                  <div className="absolute inset-2 border border-[#C96A42]/10 pointer-events-none rounded-[36px]" />

                  {/* Header */}
                  <div className="text-center relative z-10 border-b border-sage/10 pb-3">
                    <div className="text-3xl mb-1">{result.emoji}</div>
                    <h3 className="text-xl font-display font-extrabold uppercase" style={{ color: result.color }}>
                      LITERARY DNA
                    </h3>
                    <p className="text-[10px] text-ink/50 uppercase tracking-widest font-sans font-bold">
                      Your Reading Affinities
                    </p>
                  </div>

                  {/* Details Columns */}
                  <div className="space-y-5 my-auto text-left relative z-10">
                    {/* Literary Soulmates */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider" style={{ color: result.color }}>
                        Literary Soulmates
                      </h4>
                      <ul className="text-[11px] text-ink/80 space-y-1 font-serif leading-relaxed font-semibold">
                        {result.literarySoulmates.map((soul, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span style={{ color: result.color }}>♡</span> {soul}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Authors You'll Love */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider" style={{ color: result.color }}>
                        Authors You'll Love
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-ink/80 font-serif leading-relaxed font-semibold">
                        {result.authors.map((author, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span style={{ color: result.color }}>•</span> {author}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="text-center relative z-10 pt-4 border-t border-sage/10">
                    <span className="text-[8px] font-sans font-bold tracking-wider text-ink/40 uppercase block mb-1">
                      Did You Know?
                    </span>
                    <p className="text-[10px] text-ink/75 leading-relaxed font-serif px-2">
                      {result.funFact}
                    </p>
                    
                    <div className="mt-4 text-[9px] font-sans font-bold tracking-wider opacity-40 uppercase flex items-center justify-center gap-1.5">
                      <Share2 size={10} /> Tap Card to Flip back
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>

            {/* Sharing & Download Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button 
                onClick={handleDownloadCard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#5C1A2E] text-white font-bold py-4 px-8 rounded-2xl hover:bg-ink transition-all shadow-md active:scale-97 cursor-pointer text-xs uppercase tracking-widest"
              >
                <Download size={14} />
                Download Infographic Card
              </button>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  triggerConfetti();
                  alert("Quiz link copied to clipboard! Share it on WhatsApp or Instagram.");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-sage/20 text-ink/80 font-bold py-4 px-8 rounded-2xl hover:bg-[#FAF6F0] hover:text-ink transition-all shadow-sm active:scale-97 cursor-pointer text-xs uppercase tracking-widest"
              >
                <Share2 size={14} />
                Share Quiz Link
              </button>
            </div>
            
          </motion.div>
        )}

      </div>
    </main>
  );
}
