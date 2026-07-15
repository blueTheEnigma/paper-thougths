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

  // Live profile details from /api/me
  const [dbProfile, setDbProfile] = useState(null);
  
  // Book Club Soulmates State
  const [soulmates, setSoulmates] = useState([]);
  const [loadingSoulmates, setLoadingSoulmates] = useState(false);

  const canvasRef = useRef(null);

  // Trigger confetti burst on reveal
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  // 1. Fetch live profile details on load if logged in (resolves static NextAuth "Anonymous" token issues)
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.profile) {
            setDbProfile(data.profile);
          }
        })
        .catch(err => console.error("Error fetching live profile in quiz:", err));
    }
  }, [isLoggedIn]);

  // 2. Fetch Book Club Soulmates when archetype results are loaded
  useEffect(() => {
    if (result && result.id) {
      setLoadingSoulmates(true);
      fetch(`/api/archetype?archetype=${result.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.soulmates) {
            setSoulmates(data.soulmates);
          }
        })
        .catch(err => console.error("Error fetching soulmates:", err))
        .finally(() => setLoadingSoulmates(false));
    }
  }, [result]);

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setIsFlipped(false);
    setSaved(false);
    setRewarded(false);
    setErrorMessage("");
    setSoulmates([]);
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
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

  const getCardSubHeader = () => {
    if (isLoggedIn) {
      const name = dbProfile?.name || session?.user?.name || "Member";
      const lkid = dbProfile?.lkid || session?.user?.lkid || "LK-xxxx-xxxx";
      return `PAPER THOUGHTS • ASSIGNED TO: ${name.toUpperCase()} (${lkid})`;
    }
    return "PAPER THOUGHTS • ASSIGNED TO: GUEST (JOIN THE ARCHIVE)";
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

    // Draw aged parchment background gradient
    const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width * 0.9);
    grad.addColorStop(0, '#FDFBF7');
    grad.addColorStop(0.7, '#FAF4E8');
    grad.addColorStop(1, '#EFE6D5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Double borders
    ctx.strokeStyle = result.color;
    ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = '#C96A42';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Draw Ornate Filigree Corner Accents
    const drawOrnateCornerBrackets = () => {
      ctx.strokeStyle = result.color;
      ctx.lineWidth = 2.5;
      
      // Top Left
      ctx.beginPath();
      ctx.moveTo(35 + 40, 35);
      ctx.lineTo(35, 35);
      ctx.lineTo(35, 35 + 40);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(43 + 25, 43);
      ctx.lineTo(43, 43);
      ctx.lineTo(43, 43 + 25);
      ctx.stroke();
      
      // Top Right
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(width - 35 - 40, 35);
      ctx.lineTo(width - 35, 35);
      ctx.lineTo(width - 35, 35 + 40);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width - 43 - 25, 43);
      ctx.lineTo(width - 43, 43);
      ctx.lineTo(width - 43, 43 + 25);
      ctx.stroke();

      // Bottom Left
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(35 + 40, height - 35);
      ctx.lineTo(35, height - 35);
      ctx.lineTo(35, height - 35 - 40);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(43 + 25, height - 43);
      ctx.lineTo(43, height - 43);
      ctx.lineTo(43, height - 43 - 25);
      ctx.stroke();

      // Bottom Right
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(width - 35 - 40, height - 35);
      ctx.lineTo(width - 35, height - 35);
      ctx.lineTo(width - 35, height - 35 - 40);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width - 43 - 25, height - 43);
      ctx.lineTo(width - 43, height - 43);
      ctx.lineTo(width - 43, height - 43 - 25);
      ctx.stroke();
    };
    drawOrnateCornerBrackets();

    // Draw Background Watermark Book Icon
    const drawBackgroundWatermark = () => {
      ctx.save();
      ctx.strokeStyle = result.color;
      ctx.fillStyle = result.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.035; // Faint, subtle watermark
      
      const x = width / 2;
      const y = height / 2 - 20;
      const size = 180;
      
      // Draw open book path
      ctx.beginPath();
      // Left Page
      ctx.moveTo(x, y + size/2);
      ctx.bezierCurveTo(x - size/3, y + size/2 - size/4, x - size*0.8, y + size/2 - size/3, x - size, y + size/3);
      ctx.lineTo(x - size, y - size/3);
      ctx.bezierCurveTo(x - size*0.8, y - size/3 - size/3, x - size/3, y - size/3 - size/4, x, y - size/6);
      // Right Page
      ctx.bezierCurveTo(x + size/3, y - size/3 - size/4, x + size*0.8, y - size/3 - size/3, x + size, y - size/3);
      ctx.lineTo(x + size, y + size/3);
      ctx.bezierCurveTo(x + size*0.8, y + size/2 - size/3, x + size/3, y + size/2 - size/4, x, y + size/2);
      ctx.stroke();

      // Spine
      ctx.beginPath();
      ctx.moveTo(x, y - size/6);
      ctx.lineTo(x, y + size/2);
      ctx.stroke();

      // Draw sprouting leaves from center
      ctx.beginPath();
      ctx.moveTo(x, y - size/6);
      ctx.bezierCurveTo(x - 30, y - size/2, x - 50, y - size * 0.7, x - 10, y - size * 0.85);
      ctx.bezierCurveTo(x - 5, y - size * 0.7, x - 5, y - size/2, x, y - size/6);
      
      ctx.moveTo(x, y - size/6);
      ctx.bezierCurveTo(x + 30, y - size/2, x + 50, y - size * 0.7, x + 10, y - size * 0.85);
      ctx.bezierCurveTo(x + 5, y - size * 0.7, x + 5, y - size/2, x, y - size/6);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };
    drawBackgroundWatermark();

    // Dynamic Sub-Header with Name & Lore Keeper ID
    ctx.fillStyle = 'rgba(44, 26, 14, 0.55)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getCardSubHeader(), width / 2, 85);

    // Emoji/Icon
    ctx.font = '72px sans-serif';
    ctx.fillText(result.emoji, width / 2, 185);

    // Archetype Title
    ctx.fillStyle = result.color;
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(result.name.toUpperCase(), width / 2, 245);

    // Tagline
    ctx.fillStyle = 'rgba(44, 26, 14, 0.7)';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText(`"${result.tagline}"`, width / 2, 285);

    // Ornate Editorial Divider
    const drawEditorialDivider = (yOffset) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.12)';
      ctx.lineWidth = 1;
      
      const x = width / 2;
      ctx.beginPath();
      ctx.moveTo(x - 120, yOffset);
      ctx.lineTo(x - 18, yOffset);
      ctx.moveTo(x + 18, yOffset);
      ctx.lineTo(x + 120, yOffset);
      ctx.stroke();
      
      // Draw floron (❦)
      ctx.fillStyle = result.color;
      ctx.font = '20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('❦', x, yOffset + 7);
      ctx.restore();
    };
    drawEditorialDivider(320);

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
      ctx.fillStyle = result.color;
      ctx.fillText('•', leftColX, startY);
      
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

    // C. Right Column - FICTIONAL SOULMATES
    startY = 360;
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('FICTIONAL SOULMATES', rightColX, startY);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';
    result.literarySoulmates.slice(0, 3).forEach((soul, index) => {
      ctx.fillText(`♡  ${soul}`, rightColX, startY + 30 + (index * 25));
    });

    // D. Right Column - AUTHORS YOU'LL LOVE
    startY = 480;
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('AUTHORS YOU\'LL LOVE', rightColX, startY);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
    ctx.font = '14px Georgia, serif';
    result.authors.slice(0, 4).forEach((author, index) => {
      ctx.fillText(`•  ${author}`, rightColX, startY + 30 + (index * 25));
    });

    // E. Right Column - BOOK CLUB SOULMATES
    startY = 635;
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('BOOK CLUB SOULMATES', rightColX, startY);

    if (isLoggedIn) {
      if (soulmates.length > 0) {
        ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
        ctx.font = 'bold 14px Georgia, serif';
        soulmates.slice(0, 3).forEach((mate, index) => {
          const text = `✨ ${mate.name}`;
          const chapterText = `[${mate.chapter || 'Other'}]`;
          ctx.fillText(text, rightColX, startY + 30 + (index * 30));
          ctx.fillStyle = 'rgba(44, 26, 14, 0.4)';
          ctx.font = '11px sans-serif';
          ctx.fillText(chapterText, rightColX + 15, startY + 45 + (index * 30));
          ctx.fillStyle = 'rgba(44, 26, 14, 0.85)';
          ctx.font = 'bold 14px Georgia, serif';
        });
      } else {
        ctx.fillStyle = 'rgba(44, 26, 14, 0.55)';
        ctx.font = 'italic 12px Georgia, serif';
        ctx.fillText('You are the pioneer of this archetype!', rightColX, startY + 30);
        ctx.fillText('Invite friends to find your soulmates.', rightColX, startY + 50);
      }
    } else {
      ctx.fillStyle = '#C96A42';
      ctx.font = 'italic 12px Georgia, serif';
      ctx.fillText('Join the Archive to unlock and connect', rightColX, startY + 30);
      ctx.fillText('with your Book Club Soulmates!', rightColX, startY + 50);
    }

    // Bottom Editorial Divider
    drawEditorialDivider(840);

    // Catchphrase & Fun fact footer
    ctx.textAlign = 'center';
    ctx.fillStyle = result.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CATCHPHRASE', width / 2, 890);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.9)';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText(`"${result.catchphrase}"`, width / 2, 925);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.4)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('FUN FACT', width / 2, 990);

    ctx.fillStyle = 'rgba(44, 26, 14, 0.7)';
    ctx.font = '13px Georgia, serif';
    words = result.funFact.split(' ');
    line = '';
    lineY = 1020;
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
    ctx.fillText('❦', width / 2, 1105);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(44, 26, 14, 0.3)';
    ctx.fillText('DISCOVER YOUR ARCHETYPE AT PAPERTHOUGHTS.ORG', width / 2, 1145);

    // Trigger download
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaperThoughts_${result.name.replace(/\s+/g, '')}_Card.jpg`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] selection:bg-primary/20 relative py-8 md:py-12 px-4 md:px-6">
      
      {/* Background decoration elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-burgundy/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 pt-2 md:pt-4">
        
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
          <div className="max-w-2xl mx-auto mt-6">
            {/* Header progress bar */}
            <div className="mb-8 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
                <div className="flex items-center gap-2.5">
                  {currentQuestionIndex > 0 && (
                    <button 
                      onClick={handlePrevQuestion}
                      className="hover:text-burgundy flex items-center gap-1 cursor-pointer transition-colors font-sans text-[10px] font-extrabold uppercase bg-sage/5 hover:bg-burgundy/5 border border-sage/15 px-2.5 py-1 rounded"
                    >
                      <ArrowLeft size={10} /> Back
                    </button>
                  )}
                  {currentQuestionIndex > 0 && <span className="text-ink/20">|</span>}
                  <span>Scenario {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
                </div>
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
            className="space-y-6 py-2 max-w-3xl mx-auto"
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

            {/* Top Navigation Row */}
            <div className="flex justify-between items-center max-w-xl mx-auto px-4">
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

            {/* Interactive Breathtaking Card Container */}
            <div 
              className="relative w-full max-w-md mx-auto h-[660px] cursor-pointer"
              style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                
                {/* A. FRONT OF CARD (Main Infographic summary) */}
                <div 
                  className="absolute inset-0 bg-[#FAF7F2] rounded-[36px] border-4 p-8 shadow-2xl flex flex-col justify-between overflow-hidden"
                  style={{ 
                    borderColor: result.color,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  {/* Parchment background overlay gradient */}
                  <div 
                    className="absolute inset-0 opacity-95 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, #FDFBF7 0%, #FAF4E8 70%, #EFE6D5 100%)'
                    }}
                  />

                  {/* Ornate corner brackets */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2" style={{ borderColor: result.color }} />
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2" style={{ borderColor: result.color }} />

                  {/* Ornate inner corner bracket lines */}
                  <div className="absolute top-6 left-6 w-6 h-6 border-t border-l opacity-30" style={{ borderColor: result.color }} />
                  <div className="absolute top-6 right-6 w-6 h-6 border-t border-r opacity-30" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-6 left-6 w-6 h-6 border-b border-l opacity-30" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-6 right-6 w-6 h-6 border-b border-r opacity-30" style={{ borderColor: result.color }} />

                  {/* Background open-book watermark */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" viewBox="0 0 100 120" fill="none" stroke="currentColor" style={{ color: result.color }}>
                    <path d="M50,70 C40,70 25,67 15,60 L15,20 C25,27 40,30 50,30 C60,30 75,27 85,20 L85,60 C75,67 60,70 50,70 Z" strokeWidth="1.5" />
                    <line x1="50" y1="30" x2="50" y2="70" strokeWidth="1.5" />
                    <path d="M50,30 C45,22 42,12 38,7 C45,10 48,18 50,30 Z" fill="currentColor" />
                    <path d="M50,30 C55,22 58,12 62,7 C55,10 52,18 50,30 Z" fill="currentColor" />
                  </svg>

                  {/* Header */}
                  <div className="text-center relative z-10">
                    <span className="text-[8.5px] font-sans font-bold tracking-[0.1em] text-ink/55 uppercase block mb-1">
                      {getCardSubHeader()}
                    </span>
                    <div className="text-5xl mb-2">{result.emoji}</div>
                    <h2 className="text-2xl sm:text-3xl font-display font-extrabold leading-tight tracking-tight uppercase" style={{ color: result.color }}>
                      {result.name}
                    </h2>
                    <p className="text-xs text-ink/65 italic font-serif leading-relaxed mt-1">
                      "{result.tagline}"
                    </p>
                  </div>

                  {/* Editorial Divider */}
                  <div className="flex items-center justify-center gap-4 my-2 opacity-25 relative z-10">
                    <div className="h-[1px] w-20 bg-ink/70" />
                    <span className="text-xs font-serif" style={{ color: result.color }}>❦</span>
                    <div className="h-[1px] w-20 bg-ink/70" />
                  </div>

                  {/* Body Info Sections */}
                  <div className="space-y-4 my-auto relative z-10 text-left">
                    {/* Traits */}
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider opacity-60" style={{ color: result.color }}>
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

                  {/* Editorial Divider Bottom */}
                  <div className="flex items-center justify-center gap-4 my-2 opacity-25 relative z-10">
                    <div className="h-[1px] w-20 bg-ink/70" />
                    <span className="text-xs font-serif" style={{ color: result.color }}>❦</span>
                    <div className="h-[1px] w-20 bg-ink/70" />
                  </div>

                  {/* Footer (Witty quote block) */}
                  <div className="text-center relative z-10 pb-2">
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
                  className="absolute inset-0 bg-[#FAF7F2] rounded-[36px] border-4 p-8 shadow-2xl flex flex-col justify-between overflow-hidden"
                  style={{ 
                    borderColor: result.color,
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-95 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, #FDFBF7 0%, #FAF4E8 70%, #EFE6D5 100%)'
                    }}
                  />

                  {/* Ornate corner brackets */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2" style={{ borderColor: result.color }} />
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2" style={{ borderColor: result.color }} />

                  {/* Ornate inner corner bracket lines */}
                  <div className="absolute top-6 left-6 w-6 h-6 border-t border-l opacity-30" style={{ borderColor: result.color }} />
                  <div className="absolute top-6 right-6 w-6 h-6 border-t border-r opacity-30" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-6 left-6 w-6 h-6 border-b border-l opacity-30" style={{ borderColor: result.color }} />
                  <div className="absolute bottom-6 right-6 w-6 h-6 border-b border-r opacity-30" style={{ borderColor: result.color }} />

                  {/* Background open-book watermark */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" viewBox="0 0 100 120" fill="none" stroke="currentColor" style={{ color: result.color }}>
                    <path d="M50,70 C40,70 25,67 15,60 L15,20 C25,27 40,30 50,30 C60,30 75,27 85,20 L85,60 C75,67 60,70 50,70 Z" strokeWidth="1.5" />
                    <line x1="50" y1="30" x2="50" y2="70" strokeWidth="1.5" />
                    <path d="M50,30 C45,22 42,12 38,7 C45,10 48,18 50,30 Z" fill="currentColor" />
                    <path d="M50,30 C55,22 58,12 62,7 C55,10 52,18 50,30 Z" fill="currentColor" />
                  </svg>

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

                  {/* Details Sections */}
                  <div className="space-y-4 my-auto text-left relative z-10">
                    {/* Fictional Soulmates */}
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-sans font-bold uppercase tracking-wider" style={{ color: result.color }}>
                        Fictional Soulmates
                      </h4>
                      <ul className="text-[10.5px] text-ink/80 space-y-0.5 font-serif leading-relaxed font-semibold">
                        {result.literarySoulmates.slice(0, 3).map((soul, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span style={{ color: result.color }}>♡</span> {soul}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Authors You'll Love */}
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-sans font-bold uppercase tracking-wider" style={{ color: result.color }}>
                        Authors You'll Love
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px] text-ink/80 font-serif leading-relaxed font-semibold">
                        {result.authors.slice(0, 4).map((author, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span style={{ color: result.color }}>•</span> {author}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Book Club Soulmates */}
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-sans font-bold uppercase tracking-wider" style={{ color: result.color }}>
                        Book Club Soulmates
                      </h4>
                      {isLoggedIn ? (
                        loadingSoulmates ? (
                          <div className="text-[10px] font-serif text-ink/40 flex items-center gap-1 py-1">
                            <Loader2 size={10} className="animate-spin" /> Gathering soulmates...
                          </div>
                        ) : soulmates.length > 0 ? (
                          <ul className="text-[10.5px] text-ink/80 space-y-0.5 font-serif leading-relaxed font-semibold">
                            {soulmates.slice(0, 3).map((mate, i) => (
                              <li key={i} className="flex items-center gap-1.5 justify-between">
                                <span>✨ {mate.name}</span>
                                <span className="text-[9px] font-sans font-bold text-ink/40 uppercase">
                                  {mate.chapter || 'Other'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] font-serif text-ink/50 italic py-0.5">
                            You are the pioneer of this archetype! Invite friends to find your soulmates.
                          </p>
                        )
                      ) : (
                        <p className="text-[10px] font-serif text-[#C96A42] italic py-0.5">
                          Join the Archive to unlock and connect with your Book Club Soulmates!
                        </p>
                      )}
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
