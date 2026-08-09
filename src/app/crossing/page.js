"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Loader2, Lock, Unlock, 
  ArrowRight, Gift, Compass, BookOpen, Download, HelpCircle, Copy,
  MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa6';
import { REALMS, CROSSING_CONFIG, MAX_POINTS, MIN_PASSAGE_POINTS, GIFT_THRESHOLD_POINTS, ACCORD } from '@/lib/crossingConfig';

function CrossingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  
  const [progress, setProgress] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submittingRelic, setSubmittingRelic] = useState(false);
  const [dbLkid, setDbLkid] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbHasRelic, setDbHasRelic] = useState(false);
  const [showRelicModal, setShowRelicModal] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [accordAgreed, setAccordAgreed] = useState(false);
  const [declCopied, setDeclCopied] = useState(false);
  const [refParam, setRefParam] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [showAccordDetails, setShowAccordDetails] = useState(false);

  const isLoggedIn = sessionStatus === 'authenticated';
  const isInstagramFollowed = progress.instagram === true;
  const hasPassage = isLoggedIn && isInstagramFollowed;

  const handleFollowInstagram = () => {
    window.open(CROSSING_CONFIG.instagram, '_blank', 'noopener,noreferrer');
    if (progress.instagram !== true) {
      handleToggleWaypoint('instagram', true);
    }
  };

  // Handle referral capture
  useEffect(() => {
    const urlRef = searchParams.get('ref');
    if (urlRef) {
      localStorage.setItem('crossing_ref', urlRef);
      setRefParam(urlRef);
    } else {
      const storedRef = localStorage.getItem('crossing_ref');
      if (storedRef) {
        setRefParam(storedRef);
      }
    }
  }, [searchParams]);

  const signUpUrl = refParam ? `${CROSSING_CONFIG.signUpUrl}&ref=${refParam}` : CROSSING_CONFIG.signUpUrl;

  // Load progress initially
  useEffect(() => {
    // 1. Load from localStorage first (for speed and fallback)
    const localProgressStr = localStorage.getItem('crossing_progress');
    let localProgress = {};
    if (localProgressStr) {
      try {
        localProgress = JSON.parse(localProgressStr);
      } catch (e) {
        console.error('Error parsing local progress', e);
      }
    }

    if (isLoggedIn) {
      // 2. Fetch from DB if logged in
      setDbLoading(true);
      fetch('/api/crossing')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDbLkid(data.lkId || '');
            setDbName(data.name || session.user.name || '');
            setDbHasRelic(data.hasRelic || false);
            if (data.whatsappGroup) {
              setWhatsappGroupLink(data.whatsappGroup);
            }
            
            // Merge database progress with local progress
            const dbProgress = data.progress || {};
            const merged = { ...localProgress, ...dbProgress, app_signup: true };
            setProgress(merged);
            
            // Sync merged progress back to DB if it differs
            if (JSON.stringify(dbProgress) !== JSON.stringify(merged)) {
              syncProgressToDb(merged);
            } else {
              localStorage.removeItem('crossing_progress'); // Clean local storage once synced
            }
          }
        })
        .catch(err => console.error('Error fetching database progress:', err))
        .finally(() => setDbLoading(false));
    } else {
      // If not logged in, ensure app_signup is false
      const anonProgress = { ...localProgress, app_signup: false };
      setProgress(anonProgress);
    }
  }, [isLoggedIn, sessionStatus]);

  // Sync progress helper
  const syncProgressToDb = async (updatedProgress) => {
    setSyncing(true);
    try {
      const res = await fetch('/api/crossing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: updatedProgress }),
      });
      const data = await res.json();
      if (data.success) {
        setDbHasRelic(data.hasRelic || false);
        if (data.hasNewlyUnlockedRelic) {
          setShowRelicModal(true);
        }
        localStorage.removeItem('crossing_progress'); // Safely clear now that DB holds it
      }
    } catch (e) {
      console.error('Failed to sync progress to DB:', e);
    } finally {
      setSyncing(false);
    }
  };

  // Toggle waypoint
  const handleToggleWaypoint = (waypointId, isExternalLink = false) => {
    if (waypointId === 'app_signup') {
      if (isLoggedIn) return; // Cannot toggle signup if logged in
      router.push(signUpUrl);
      return;
    }

    const updated = {
      ...progress,
      [waypointId]: progress[waypointId] !== true
    };

    setProgress(updated);

    if (isLoggedIn) {
      syncProgressToDb(updated);
    } else {
      localStorage.setItem('crossing_progress', JSON.stringify(updated));
    }
  };

  const handleAcceptAccord = async () => {
    if (!accordAgreed) return;
    
    const updated = {
      ...progress,
      agreed_to_accord: true
    };
    
    setProgress(updated);
    
    let activeLink = whatsappGroupLink;
    
    if (isLoggedIn) {
      setSyncing(true);
      try {
        const res = await fetch('/api/crossing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: updated }),
        });
        const data = await res.json();
        if (data.success) {
          setDbHasRelic(data.hasRelic || false);
          if (data.hasNewlyUnlockedRelic) {
            setShowRelicModal(true);
          }
          if (data.whatsappGroup) {
            activeLink = data.whatsappGroup;
            setWhatsappGroupLink(data.whatsappGroup);
          }
          localStorage.removeItem('crossing_progress');
        }
      } catch (e) {
        console.error('Failed to sync progress to DB:', e);
      } finally {
        setSyncing(false);
      }
    } else {
      localStorage.setItem('crossing_progress', JSON.stringify(updated));
    }
    
    if (activeLink) {
      window.open(activeLink, '_blank', 'noopener,noreferrer');
    } else {
      window.open('https://chat.whatsapp.com/DGDfnoZCM2mH6xqC8cK6Ez', '_blank', 'noopener,noreferrer');
    }
  };

  // Click waypoint link helper
  const handleWaypointClick = (waypoint) => {
    // Open in new tab if external
    if (waypoint.external) {
      window.open(waypoint.link, '_blank', 'noopener,noreferrer');
    }

    // Set checked state if not already checked
    if (progress[waypoint.id] !== true) {
      handleToggleWaypoint(waypoint.id, true);
    }
  };

  // Calculations
  const totalPoints = Object.keys(progress).reduce((acc, key) => {
    // app_signup is 30 points, rest are 10
    if (key === 'app_signup') {
      return acc + (isLoggedIn ? 30 : 0);
    }
    const isWaypoint = Object.values(REALMS).some(realm => 
      realm.waypoints.some(w => w.id === key)
    );
    return acc + (isWaypoint && progress[key] === true ? 10 : 0);
  }, 0);

  // Dynamic progress copy
  let progressCopy = "You're standing at the edge. The Register is the only step that isn't optional.";
  if (totalPoints >= GIFT_THRESHOLD_POINTS) {
    progressCopy = "You made it. And you didn't just cross — you carried something with you. Check your gift on the other side.";
  } else if (totalPoints >= 60) {
    progressCopy = "Close. Something is watching to see if you'll finish.";
  } else if (totalPoints >= MIN_PASSAGE_POINTS) {
    progressCopy = "You're on the bridge. It holds. Keep walking if you want more than passage.";
  }

  const isRegisterSigned = isLoggedIn;

  // Generate PDF Relic Card
  const handleDownloadRelic = async () => {
    if (!isLoggedIn) return;
    setPdfGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [600, 420]
      });

      const primaryColor = '#F2A98A';
      const accentColor = '#C96A42';
      const creamBg = '#FAF7F2';
      const inkColor = '#2C1A0E';
      const burgundyColor = '#5C1A2E';

      // 1. Background
      doc.setFillColor(250, 247, 242); // #FAF7F2
      doc.rect(0, 0, 600, 420, 'F');

      // 2. Decorative Double Border
      doc.setStrokeColor(92, 26, 46); // Burgundy
      doc.setLineWidth(2);
      doc.rect(20, 20, 560, 380);
      doc.setLineWidth(0.5);
      doc.rect(24, 24, 552, 372);

      // Corner flourishes (simple lines)
      doc.setLineWidth(1);
      doc.line(15, 35, 35, 15);
      doc.line(565, 15, 585, 35);
      doc.line(15, 385, 35, 405);
      doc.line(565, 405, 585, 385);

      // 3. Narrative Text Headers
      doc.setTextColor(92, 26, 46);
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.text("PAPER THOUGHTS LITERARY CLUBHOUSE", 300, 55, { align: 'center' });

      // Title
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.text("RELIC OF THE CROSSING", 300, 95, { align: 'center' });

      // Gilded divider
      doc.setStrokeColor(201, 106, 66); // Accent #C96A42
      doc.setLineWidth(1.5);
      doc.line(220, 115, 380, 115);

      // Core prose
      doc.setTextColor(44, 26, 14); // Ink
      doc.setFont('times', 'normal');
      doc.setFontSize(14);
      doc.text("Let it be recorded in the ledger of the Archives that", 300, 160, { align: 'center' });

      // User's Name
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(22);
      doc.setTextColor(92, 26, 46); // Burgundy
      doc.text(dbName.toUpperCase(), 300, 195, { align: 'center' });

      // Prose body
      doc.setTextColor(44, 26, 14);
      doc.setFont('times', 'normal');
      doc.setFontSize(13);
      doc.text("has successfully braved the Waypoints of the Four Realms,", 300, 230, { align: 'center' });
      doc.text("proving commitment to the word, the signal fire, the vision, and the ledger.", 300, 248, { align: 'center' });
      doc.text("Having crossed the bridge carrying the weight of the crossing,", 300, 266, { align: 'center' });
      doc.text("they are hereby recognized as a", 300, 284, { align: 'center' });

      // Status title
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(201, 106, 66); // Accent
      doc.text("VERIFIED FOUNDING CROSSER", 300, 310, { align: 'center' });

      // 4. LK-ID box
      doc.setFillColor(255, 245, 236); // Card background
      doc.setStrokeColor(44, 26, 14);
      doc.setLineWidth(0.5);
      doc.rect(200, 335, 200, 35, 'FD');

      doc.setTextColor(92, 26, 46);
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text(dbLkid || 'LK-PENDING', 300, 357, { align: 'center' });

      // Save PDF
      doc.save(`PaperThoughts_CrossingRelic_${dbLkid || 'Founding'}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 font-sans text-ink relative min-h-screen">
      
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-radial from-burgundy/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header section */}
      <section className="text-center max-w-3xl mx-auto mb-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-burgundy/20 bg-card/60 text-xs font-bold uppercase tracking-widest text-burgundy"
        >
          <Compass size={12} className="animate-spin-slow" />
          Act II: The Crossing
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-4xl md:text-6xl font-display font-bold text-burgundy tracking-tight"
        >
          Relics of the Crossing
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-sm md:text-base text-ink/75 leading-relaxed font-quote italic space-y-3"
        >
          <p>You've crossed the first line. Good.</p>
          <p>The bridge is not one plank — it's four. Each realm you touch steadies the crossing. Miss all of them, and the wind takes you. Touch enough, and you don't just arrive — you arrive carrying something.</p>
          <p>One realm is not optional. The Register. Sign it, and you may pass — thin, unsteady, but through.</p>
          <p>Touch three realms fully, and something will be waiting for you on the other side. Not everyone will find it. That's the point.</p>
        </motion.div>
      </section>

      {/* Visual Bridge Progress Tracker */}
      <section className="bg-card/75 border border-burgundy/10 rounded-[32px] p-6 md:p-10 mb-16 shadow-lg max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles size={160} className="text-burgundy" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-burgundy/10 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ink/50">Your Crossing Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-display font-bold text-burgundy">{totalPoints}</span>
              <span className="text-lg text-ink/40 font-semibold">/ {MAX_POINTS} pts</span>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <span className="text-xs font-bold uppercase tracking-widest text-ink/50 block mb-2">Narrative Resonance</span>
            <p className="text-sm font-semibold text-burgundy leading-snug italic font-quote">
              "{progressCopy}"
            </p>
          </div>
        </div>

        {/* Bridge Track bar */}
        <div className="relative my-10 pt-4 pb-2">
          {/* Main Track Background */}
          <div className="h-3 w-full bg-[#EFECE6] rounded-full border border-ink/5 overflow-hidden">
            {/* Progress Fill */}
            <motion.div 
              className="h-full bg-gradient-to-r from-accent to-burgundy rounded-full shadow-[0_0_8px_rgba(201,106,66,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${(totalPoints / MAX_POINTS) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Key Milestones */}
          {/* 1. Start (0 pts) */}
          <div className="absolute left-0 top-0 -translate-y-1/3 flex flex-col items-center">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${totalPoints >= 0 ? 'bg-accent border-accent text-white' : 'bg-cream border-ink/20'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold mt-2 uppercase tracking-wider text-ink/40">The Edge</span>
          </div>

          {/* 2. Gate of Passage (40 pts) */}
          <div className="absolute left-[30.7%] top-0 -translate-y-1/3 flex flex-col items-center -translate-x-1/2">
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${hasPassage ? 'bg-burgundy border-burgundy text-primary' : 'bg-[#FAF8F5] border-ink/20 text-ink/30'}`}>
              {hasPassage ? <Unlock size={12} /> : <Lock size={12} />}
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold mt-2 uppercase tracking-wider text-ink/60 text-center">
              <span className="hidden sm:inline">Passage (40)</span>
              <span className="inline sm:hidden">Passage</span>
            </span>
          </div>

          {/* 3. The Relic Milestone (90 pts) */}
          <div className="absolute left-[75%] top-0 -translate-y-1/3 flex flex-col items-center -translate-x-1/2">
            <motion.div 
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${totalPoints >= GIFT_THRESHOLD_POINTS ? 'bg-accent border-accent text-cream animate-bounce' : 'bg-[#FAF8F5] border-ink/20 text-ink/30'}`}
              animate={totalPoints >= GIFT_THRESHOLD_POINTS ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Gift size={12} />
            </motion.div>
            <span className="text-[8px] sm:text-[10px] font-bold mt-2 uppercase tracking-wider text-ink/60 text-center">
              <span className="hidden sm:inline">The Relic (90)</span>
              <span className="inline sm:hidden">Relic</span>
            </span>
          </div>
        </div>

        {syncing && (
          <div className="absolute bottom-2 right-4 flex items-center gap-1.5 text-xs text-ink/40">
            <Loader2 size={12} className="animate-spin" />
            Saving progress...
          </div>
        )}
      </section>

      {/* Quick Passage Hero Card for Mobile & Fast Access */}
      <section className="bg-gradient-to-br from-[#FFF9F3] via-card to-[#FDF8F3] border-2 border-burgundy/20 rounded-[32px] p-6 md:p-8 mb-16 shadow-xl max-w-4xl mx-auto relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-burgundy/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-burgundy/10 border border-burgundy/20 flex items-center justify-center text-burgundy shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent block">Fast-Track Mobile Crossing</span>
              <h2 className="text-xl md:text-2xl font-display font-bold text-burgundy leading-tight">
                Town Hall Quick Passage
              </h2>
            </div>
          </div>
          <span className={`self-start sm:self-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${hasPassage ? 'bg-sage/10 text-sage border-sage/30' : 'bg-burgundy/10 text-burgundy border-burgundy/20'}`}>
            {hasPassage ? 'Passage Unlocked' : '2 Steps Required'}
          </span>
        </div>

        <p className="text-xs md:text-sm text-ink/75 mb-6 font-quote italic">
          Complete both required steps below to unlock immediate access to the Town Hall WhatsApp group.
        </p>

        {/* 2 Step Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Step 1: Sign up */}
          <div className={`p-4 rounded-2xl border transition-all ${isLoggedIn ? 'bg-[#FAFDF9] border-sage/40' : 'bg-cream/60 border-burgundy/20'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLoggedIn ? 'bg-sage text-white' : 'bg-burgundy/10 text-burgundy border border-burgundy/20'}`}>
                  {isLoggedIn ? <CheckCircle2 size={16} /> : '1'}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Step 1</span>
              </div>
              <span className="text-[10px] font-bold text-burgundy/60 bg-burgundy/5 px-2 py-0.5 rounded">30 pts</span>
            </div>
            <h3 className="text-sm font-bold text-burgundy mb-1">Sign up on the App</h3>
            <p className="text-xs text-ink/60 mb-3">Register your name in the clubhouse ledger.</p>
            {isLoggedIn ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sage">
                <CheckCircle2 size={14} />
                <span>Registered</span>
              </div>
            ) : (
              <button
                onClick={() => router.push(signUpUrl)}
                className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
              >
                Sign Up Now
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {/* Step 2: Follow Instagram */}
          <div className={`p-4 rounded-2xl border transition-all ${isInstagramFollowed ? 'bg-[#FAFDF9] border-sage/40' : 'bg-cream/60 border-burgundy/20'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isInstagramFollowed ? 'bg-sage text-white' : 'bg-burgundy/10 text-burgundy border border-burgundy/20'}`}>
                  {isInstagramFollowed ? <CheckCircle2 size={16} /> : '2'}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Step 2</span>
              </div>
              <span className="text-[10px] font-bold text-burgundy/60 bg-burgundy/5 px-2 py-0.5 rounded">10 pts</span>
            </div>
            <h3 className="text-sm font-bold text-burgundy mb-1">Follow on Instagram</h3>
            <p className="text-xs text-ink/60 mb-3">Join our literary community on Instagram.</p>
            {isInstagramFollowed ? (
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sage">
                  <CheckCircle2 size={14} />
                  <span>Followed</span>
                </div>
                <button
                  onClick={handleFollowInstagram}
                  className="text-[10px] font-bold text-ink/50 hover:text-burgundy underline"
                >
                  Visit Profile
                </button>
              </div>
            ) : (
              <button
                onClick={handleFollowInstagram}
                className="w-full bg-[#E1306C] hover:bg-[#c1255b] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <FaInstagram size={14} />
                Follow on Instagram
              </button>
            )}
          </div>
        </div>

        {/* Town Hall Action Box */}
        {hasPassage ? (
          <div className="bg-[#E6F8ED] border border-[#25D366]/30 rounded-2xl p-5 md:p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-[#25D366] font-bold text-xs uppercase tracking-widest">
              <Unlock size={14} />
              <span>Town Hall Passage Unlocked</span>
            </div>

            {!progress.agreed_to_accord ? (
              <div className="space-y-4 max-w-xl mx-auto text-left">
                {/* Accord Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group bg-white/80 p-3.5 rounded-xl border border-sage/20">
                  <input
                    type="checkbox"
                    checked={accordAgreed}
                    onChange={(e) => setAccordAgreed(e.target.checked)}
                    className="mt-0.5 accent-burgundy rounded border-ink/20 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-ink/80 group-hover:text-burgundy transition-colors leading-snug select-none">
                    I agree to hold the Accord of the Second Chapter in the Town Hall room.
                  </span>
                </label>

                {/* Expand Accord Rules Toggle */}
                <div>
                  <button
                    onClick={() => setShowAccordDetails(!showAccordDetails)}
                    className="text-xs font-bold text-burgundy hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    {showAccordDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showAccordDetails ? 'Hide Accord Rules' : 'View Full Accord Rules (17 Rules)'}
                  </button>

                  {showAccordDetails && (
                    <div className="mt-3 max-h-60 overflow-y-auto border border-burgundy/10 rounded-xl p-4 bg-white/90 space-y-4 scrollbar-thin text-xs text-ink/80">
                      {ACCORD.map((rule) => (
                        <div key={rule.num} className="border-b border-ink/5 pb-3 last:border-0">
                          <span className="font-bold text-accent">{rule.num}. {rule.title}: </span>
                          <span className="font-quote italic">{rule.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAcceptAccord}
                  disabled={!accordAgreed}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={16} />
                  Enter Town Hall WhatsApp Group
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-ink/75 font-quote italic">
                  You have accepted the Accord. The door to the homeland is open.
                </p>
                <a
                  href={whatsappGroupLink || 'https://chat.whatsapp.com/DGDfnoZCM2mH6xqC8cK6Ez'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full max-w-md mx-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded-xl font-bold transition-all shadow-md text-xs uppercase tracking-wider"
                >
                  <MessageSquare size={16} />
                  Join Town Hall WhatsApp Group
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-cream/40 border border-burgundy/10 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-burgundy/80">
              🔒 Complete Step 1 (Sign up) and Step 2 (Follow on Instagram) above to reveal the Town Hall group link.
            </p>
          </div>
        )}
      </section>

      {/* The Map Grid */}
      <section id="realms-section" className="space-y-10">
        <h2 className="text-2xl font-display font-bold text-burgundy text-center mb-8 tracking-wide">
          The Four Realms of the Crossing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.values(REALMS).map((realm) => {
            const isRegister = realm.id === 'register';
            
            return (
              <div 
                key={realm.id}
                className="bg-card border border-burgundy/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  {/* Title and Badge */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-bold font-display text-burgundy uppercase tracking-wide">
                      {realm.name}
                    </h3>
                    
                    {isRegister && (
                      <span className="bg-burgundy/10 border border-burgundy/30 text-burgundy text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink/50 uppercase tracking-widest block mb-4">
                    {realm.pointsPerWaypoint} pts each
                  </p>

                  <p className="text-sm font-quote italic text-ink/85 leading-relaxed border-l-2 border-accent/30 pl-3 mb-6">
                    "{realm.narrative}"
                  </p>
                </div>

                {/* Waypoints lists */}
                <div className="space-y-4 mt-auto">
                  {realm.waypoints.map((waypoint) => {
                    let checked = progress[waypoint.id] === true;
                    if (isRegister && isLoggedIn) {
                      checked = true; // Auto check if logged in
                    }
                    
                    return (
                      <div 
                        key={waypoint.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-2xl p-4 sm:p-3.5 transition-all gap-4 sm:gap-3 ${checked ? 'bg-[#FAFDF9] border-sage/40' : 'bg-cream/40 border-ink/10 hover:border-burgundy/20'}`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => {
                              if (isRegister) {
                                if (isLoggedIn) return; // Account registered
                                router.push(signUpUrl);
                              } else {
                                handleToggleWaypoint(waypoint.id);
                              }
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${checked ? 'text-sage bg-sage/10 border-sage/30' : 'border-ink/20 hover:border-burgundy'}`}
                            disabled={isRegister && isLoggedIn}
                          >
                            {checked ? <CheckCircle2 size={18} className="text-sage" /> : <div className="w-2 h-2 rounded-full bg-transparent border border-ink/20" />}
                          </button>
                          
                          <div className="space-y-0.5">
                            <span className={`text-sm font-bold block ${checked ? 'text-ink/60 line-through font-normal' : 'text-ink'} leading-tight`}>
                              {waypoint.label}
                            </span>
                            
                            {isRegister && !isLoggedIn && (
                              <span className="text-[10px] text-burgundy font-semibold block">
                                Sign up or Log in to pass
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pl-9 sm:pl-0">
                          <button
                            onClick={() => {
                              if (isRegister) {
                                router.push(signUpUrl);
                              } else {
                                handleWaypointClick(waypoint);
                              }
                            }}
                            className={`w-full sm:w-auto px-4 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${checked ? 'bg-cream text-ink/50 border-ink/10' : 'bg-ink text-cream border-ink hover:bg-ink/90'}`}
                          >
                            {isRegister ? (
                              isLoggedIn ? 'Registered' : 'Register'
                            ) : (
                              <>
                                Go to Link
                                <ArrowRight size={10} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Relic Claim Section (if 90+) */}
      <AnimatePresence>
        {totalPoints >= GIFT_THRESHOLD_POINTS && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25 }}
            className="mt-16 bg-[#FFF9F3] border-2 border-accent/20 rounded-[32px] p-6 md:p-10 shadow-xl max-w-4xl mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Gift size={120} className="text-accent animate-pulse" />
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-6">
              <span className="inline-block bg-accent/10 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Relic Unlocked
              </span>
              
              <h2 className="text-3xl font-display font-bold text-burgundy">
                The Gilded Treasure of the Crossing
              </h2>
              
              <p className="text-sm text-ink/75 leading-relaxed">
                You didn't just cross. You carried the weight. Below lies your digital Relic: a personalized Certificate of Passage. This mark has been etched into your app ledger permanently.
              </p>

              {isLoggedIn ? (
                <div className="space-y-6 pt-4">
                  {/* Parchment Display Card */}
                  <div className="parchment-card max-w-md mx-auto p-8 border-2 border-burgundy/30 bg-[#FAF7F2] shadow-inner relative text-center">
                    <div className="absolute inset-2 border border-burgundy/10 pointer-events-none" />
                    
                    <span className="text-[9px] font-bold text-burgundy/60 uppercase tracking-widest block mb-4">
                      Paper Thoughts Archive
                    </span>
                    
                    <h3 className="font-display font-bold text-xl text-burgundy tracking-wide mb-1">
                      FOUNDING CROSSER
                    </h3>
                    
                    <div className="w-16 h-0.5 bg-accent mx-auto mb-6" />
                    
                    <p className="text-xs text-ink/60 font-sans mb-1">Signed by order of the Ledger:</p>
                    <p className="font-display font-bold text-lg text-burgundy mb-6 uppercase tracking-tight">
                      {dbName || session?.user?.name || 'Reader'}
                    </p>

                    <div className="inline-block bg-[#FFF5EC] border border-ink/10 px-4 py-2 rounded-lg font-mono text-sm font-bold text-burgundy">
                      {dbLkid || 'LK-GENERATING...'}
                    </div>

                    <p className="text-[10px] text-sage font-bold uppercase tracking-wider mt-4">
                      ✦ Verified Founding Crosser ✦
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadRelic}
                    disabled={pdfGenerating}
                    className="btn-primary w-full max-w-xs flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {pdfGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download Relic PDF
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-cream/60 border border-burgundy/10 rounded-2xl p-6 max-w-md mx-auto">
                  <p className="text-sm font-semibold text-burgundy mb-4">
                    Your Relic is Waiting, but you are anonymous.
                  </p>
                  <p className="text-xs text-ink/60 mb-6">
                    We require registration to personalize and issue your unique LK-ID. Sign up now to save your progress and claim your certificate.
                  </p>
                  <button
                    onClick={() => router.push(signUpUrl)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Sign the Register to Claim
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* The Final Gate */}
      <section className="mt-16 max-w-4xl mx-auto text-center border-t border-burgundy/10 pt-16 pb-20">
        {hasPassage ? (
          progress.agreed_to_accord === true ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-card border border-burgundy/10 rounded-[32px] p-8 md:p-12 shadow-md relative"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage/10 border border-sage/30 text-sage text-[10px] font-bold uppercase tracking-widest mb-6">
                <Unlock size={10} />
                The homeland is open
              </span>
              
              <h2 className="text-3xl md:text-4xl font-display font-bold text-burgundy mb-4">
                Welcome to the Second Chapter
              </h2>
              
              <p className="text-sm text-ink/75 leading-relaxed max-w-2xl mx-auto mb-8 font-quote italic">
                "The door was always going to open for anyone who signed the Register. The rest was never about the door. It was about what you'd be carrying when you walked through it."
              </p>

              {/* Congratulations message for 90+ crossers */}
              {totalPoints >= GIFT_THRESHOLD_POINTS && (
                <div className="bg-[#FAFDF9] border border-sage/30 rounded-2xl p-6 max-w-xl mx-auto mb-8 text-center animate-pulse-subtle">
                  <Sparkles className="text-sage mx-auto mb-2" size={24} />
                  <p className="text-sm font-bold text-sage uppercase tracking-wider">Congratulations, Founding Crosser</p>
                  <p className="text-xs text-ink/70 mt-1">You crossed the bridge carrying the Relic. The ledger holds your name in gold.</p>
                </div>
              )}

              {/* WhatsApp Prominent Entry Card */}
              <div className="bg-[#E6F8ED] border border-[#25D366]/20 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <MessageSquare size={100} className="text-[#25D366]" />
                </div>
                <div className="relative z-10 space-y-4">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded inline-block">
                    Clubhouse Community
                  </span>
                  <h3 className="font-display font-extrabold text-xl text-burgundy mt-1">Enter the Homeland</h3>
                  <p className="text-xs text-ink/70 leading-relaxed font-serif">
                    Join the main WhatsApp collective where crossers chat, debate literary themes, and organize chapter meetings.
                  </p>
                  <a
                    href={whatsappGroupLink || 'https://chat.whatsapp.com/DGDfnoZCM2mH6xqC8cK6Ez'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] text-xs uppercase tracking-wider font-sans cursor-pointer mt-2"
                  >
                    <MessageSquare size={14} /> Join WhatsApp Group
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Copyable Declaration Card */}
              <div className="bg-[#FFF5EC] border border-burgundy/10 rounded-2xl p-6 max-w-xl mx-auto mb-8 text-left relative overflow-hidden">
                <span className="text-[10px] font-bold text-burgundy/50 uppercase tracking-widest block mb-2">Declaration of Passage</span>
                <p className="text-sm text-ink/85 font-quote italic bg-white/50 p-4 border border-ink/5 rounded-xl select-all">
                  "I, {dbName || session?.user?.name || 'Reader'} ({dbLkid || 'LK-PENDING'}), have crossed the bridge. I carry a quest score of {totalPoints}/120 {totalPoints >= GIFT_THRESHOLD_POINTS ? 'and bear the Relic of the Crossing' : ''}. I agree to hold the Accord of the Second Chapter in this room."
                </p>
                <button
                  onClick={() => {
                    const decl = `I, ${dbName || session?.user?.name || 'Reader'} (${dbLkid || 'LK-PENDING'}), have crossed the bridge. I carry a quest score of ${totalPoints}/120 ${totalPoints >= GIFT_THRESHOLD_POINTS ? 'and bear the Relic of the Crossing' : ''}. I agree to hold the Accord of the Second Chapter in this room.`;
                    navigator.clipboard.writeText(decl);
                    setDeclCopied(true);
                    setTimeout(() => setDeclCopied(false), 2000);
                  }}
                  className="mt-3 text-xs font-bold text-burgundy hover:text-accent flex items-center gap-1.5 transition-colors"
                >
                  <Copy size={12} />
                  {declCopied ? 'Declaration Copied!' : 'Copy Declaration to Clipboard'}
                </button>
              </div>

              {totalPoints >= GIFT_THRESHOLD_POINTS && (
                <p className="text-xs text-sage font-bold uppercase tracking-wider mt-4">
                  (Your Relic is waiting — check your app inbox.)
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-card border border-burgundy/10 rounded-[32px] p-6 md:p-10 max-w-3xl mx-auto shadow-xl relative text-left"
            >
              <div className="text-center pb-6 border-b border-burgundy/10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest mb-4">
                  <Unlock size={10} />
                  Passage Unlocked
                </span>
                <h2 className="text-3xl font-display font-bold text-burgundy">
                  THE ACCORD OF THE SECOND CHAPTER
                </h2>
                <div className="w-16 h-0.5 bg-accent mx-auto mt-4" />
              </div>

              <div className="text-sm text-ink/80 font-quote italic leading-relaxed space-y-3 pt-6">
                <p>You made it. However far you walked to get here — the Register, the Watchtower, the Gallery, the Archive — you're standing on the other side now. The bridge is behind you. What's ahead is a room. And every room, no matter how good the story that led to it, is only as strong as what the people inside agree to carry.</p>
                <p>This isn't a list of what you can't do. It's the shape of what we're building, said out loud, so no one has to guess at it.</p>
                <p>Here is the Accord.</p>
              </div>

              {/* Scrollable Rules Container */}
              <div className="max-h-80 overflow-y-auto border border-burgundy/10 rounded-2xl p-4 md:p-6 my-6 bg-cream/30 space-y-6 scrollbar-thin">
                {ACCORD.map((rule) => (
                  <div key={rule.num} className="border-b border-ink/5 pb-4 last:border-0">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-display font-bold text-accent text-lg">{rule.num}.</span>
                      <h4 className="font-display font-bold text-burgundy text-base">{rule.title}</h4>
                    </div>
                    <p className="text-sm text-ink/75 leading-relaxed pl-6 font-quote">
                      {rule.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Accord Footer Prose */}
              <div className="text-sm text-ink/80 leading-relaxed font-quote italic text-center mb-6">
                <p>You crossed a bridge for this. Not everyone did. Let's make sure it was worth the crossing — for you, and for the next person standing where you stood.</p>
                <p className="font-bold text-burgundy mt-2">Welcome to the Second Chapter</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-burgundy/10 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group justify-center">
                  <input
                    type="checkbox"
                    checked={accordAgreed}
                    onChange={(e) => setAccordAgreed(e.target.checked)}
                    className="mt-1 accent-burgundy rounded border-ink/10"
                  />
                  <span className="text-xs font-bold text-ink/70 group-hover:text-burgundy transition-colors text-left max-w-lg select-none">
                    I have read the Accord of the Second Chapter and agree to carry it in the room ahead.
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={handleAcceptAccord}
                    disabled={!accordAgreed}
                    className="btn-primary w-full sm:w-auto text-xs py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    Enter the homeland
                    <ArrowRight size={14} />
                  </button>
                  {totalPoints < GIFT_THRESHOLD_POINTS && (
                    <button
                      onClick={() => {
                        document.getElementById('realms-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="btn-ghost w-full sm:w-auto text-xs py-3 px-8"
                    >
                      Keep Walking (Claim Relic)
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        ) : (
          <div className="bg-cream/40 border border-ink/5 rounded-[32px] p-8 md:p-12 text-ink/40 max-w-md mx-auto flex flex-col items-center">
            <Lock size={32} className="mb-4 text-ink/20" />
            <h3 className="font-display text-lg font-bold text-ink/40 mb-2">The Final Gate is Locked</h3>
            <p className="text-xs leading-relaxed mb-6">
              To cross into the next chapter, you must first sign up on the app and follow on Instagram.
            </p>
            <button
              onClick={() => router.push(signUpUrl)}
              className="btn-ghost inline-flex items-center gap-2 text-xs py-2 px-5"
            >
              Sign the Register
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </section>

      {/* Relic Newly Unlocked Modal */}
      <AnimatePresence>
        {showRelicModal && (
          <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-accent/20 rounded-[32px] p-8 max-w-lg w-full text-center shadow-2xl relative"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-accent rounded-full flex items-center justify-center text-cream shadow-lg">
                <Gift size={40} className="animate-bounce" />
              </div>

              <h3 className="text-2xl font-display font-bold text-burgundy mt-10 mb-3">
                The Relic is Yours
              </h3>
              
              <p className="text-sm text-ink/70 leading-relaxed mb-6">
                You have reached the 90+ threshold. Your name has been written in gold inside the ledger. Your personalized Relic PDF is ready for download, and we have dispatched a copy directly to your email inbox!
              </p>

              <div className="parchment-card p-6 bg-[#FAF7F2] border border-burgundy/10 mb-6 font-mono text-burgundy text-lg font-bold">
                {dbLkid}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowRelicModal(false);
                    handleDownloadRelic();
                  }}
                  className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  Download Relic
                </button>
                <button
                  onClick={() => setShowRelicModal(false)}
                  className="btn-ghost text-xs flex-1"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </main>
  );
}

export default function CrossingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
        <div className="text-center font-sans text-ink/60 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-burgundy" size={32} />
          <span>Stepping onto the bridge...</span>
        </div>
      </main>
    }>
      <CrossingPageContent />
    </Suspense>
  );
}
