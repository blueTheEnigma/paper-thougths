"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Loader2, Lock, Unlock, 
  ArrowRight, Gift, Compass, BookOpen, Download, HelpCircle, Copy,
  MessageSquare, ChevronDown, ChevronUp, ShieldCheck, Instagram
} from 'lucide-react';
import { FaInstagram, FaWhatsapp, FaDiscord, FaYoutube, FaTiktok, FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { REALMS, CROSSING_CONFIG, MAX_POINTS, MIN_PASSAGE_POINTS, GIFT_THRESHOLD_POINTS, ACCORD } from '@/lib/crossingConfig';

function CrossingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  
  const [progress, setProgress] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
  const [showBonusRealms, setShowBonusRealms] = useState(false);

  const isLoggedIn = sessionStatus === 'authenticated';
  const isInstagramFollowed = progress.instagram === true;
  const isAccordAffirmed = progress.agreed_to_accord === true;
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
            
            const dbProgress = data.progress || {};
            const merged = { ...localProgress, ...dbProgress, app_signup: true };
            setProgress(merged);
            if (merged.agreed_to_accord) {
              setAccordAgreed(true);
            }
            
            if (JSON.stringify(dbProgress) !== JSON.stringify(merged)) {
              syncProgressToDb(merged);
            } else {
              localStorage.removeItem('crossing_progress');
            }
          }
        })
        .catch(err => console.error('Error fetching database progress:', err))
        .finally(() => setDbLoading(false));
    } else {
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
        if (data.whatsappGroup) {
          setWhatsappGroupLink(data.whatsappGroup);
        }
        localStorage.removeItem('crossing_progress');
      }
    } catch (e) {
      console.error('Failed to sync progress to DB:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleWaypoint = (waypointId, forcedState) => {
    if (waypointId === 'app_signup') {
      if (isLoggedIn) return;
      router.push(signUpUrl);
      return;
    }

    const updated = {
      ...progress,
      [waypointId]: forcedState !== undefined ? forcedState : (progress[waypointId] !== true)
    };

    setProgress(updated);

    if (isLoggedIn) {
      syncProgressToDb(updated);
    } else {
      localStorage.setItem('crossing_progress', JSON.stringify(updated));
    }
  };

  const handleAcceptAccord = async () => {
    const updated = {
      ...progress,
      agreed_to_accord: true
    };
    
    setAccordAgreed(true);
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

  // Calculations
  const totalPoints = Object.keys(progress).reduce((acc, key) => {
    if (key === 'app_signup') {
      return acc + (isLoggedIn ? 30 : 0);
    }
    const isWaypoint = Object.values(REALMS).some(realm => 
      realm.waypoints.some(w => w.id === key)
    );
    return acc + (isWaypoint && progress[key] === true ? 10 : 0);
  }, 0);

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

      // 1. Background
      doc.setFillColor(250, 247, 242);
      doc.rect(0, 0, 600, 420, 'F');

      // 2. Decorative Double Border
      doc.setStrokeColor(92, 26, 46);
      doc.setLineWidth(2);
      doc.rect(20, 20, 560, 380);
      doc.setLineWidth(0.5);
      doc.rect(24, 24, 552, 372);

      // 3. Narrative Headers
      doc.setTextColor(92, 26, 46);
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.text("PAPER THOUGHTS LITERARY CLUBHOUSE", 300, 55, { align: 'center' });

      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.text("RELIC OF THE CROSSING", 300, 95, { align: 'center' });

      doc.setStrokeColor(201, 106, 66);
      doc.setLineWidth(1.5);
      doc.line(220, 115, 380, 115);

      doc.setTextColor(44, 26, 14);
      doc.setFont('times', 'normal');
      doc.setFontSize(14);
      doc.text("Let it be recorded in the ledger of the Archives that", 300, 160, { align: 'center' });

      doc.setFont('times', 'bolditalic');
      doc.setFontSize(22);
      doc.setTextColor(92, 26, 46);
      doc.text(dbName.toUpperCase(), 300, 195, { align: 'center' });

      doc.setTextColor(44, 26, 14);
      doc.setFont('times', 'normal');
      doc.setFontSize(13);
      doc.text("has successfully braved the Waypoints of the Crossing,", 300, 230, { align: 'center' });
      doc.text("affirming the Accord and proving commitment to the written word.", 300, 248, { align: 'center' });
      doc.text("Having crossed the bridge into the Second Chapter,", 300, 266, { align: 'center' });
      doc.text("they are hereby recognized as a", 300, 284, { align: 'center' });

      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(201, 106, 66);
      doc.text("VERIFIED FOUNDING CROSSER", 300, 310, { align: 'center' });

      // LK-ID Box
      doc.setFillColor(255, 245, 236);
      doc.setStrokeColor(44, 26, 14);
      doc.setLineWidth(0.5);
      doc.rect(200, 335, 200, 35, 'FD');

      doc.setTextColor(92, 26, 46);
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text(dbLkid || 'LK-PENDING', 300, 357, { align: 'center' });

      doc.save(`PaperThoughts_CrossingRelic_${dbLkid || 'Founding'}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-10 font-sans text-[#120308] relative min-h-screen">
      
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-[radial-gradient(circle_at_50%_30%,rgba(201,106,66,0.12)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* Header: Mystical Literary Prologue */}
      <section className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#20070e]/15 bg-[#FAF5EE] text-xs font-bold uppercase tracking-widest text-[#20070e]"
        >
          <Compass size={13} className="text-[#c96a42] animate-spin-slow" />
          Act II: The Initiation
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl md:text-5xl font-display font-bold text-[#20070e] tracking-tight"
        >
          The Crossing
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-base text-[#120308]/75 leading-relaxed font-serif italic"
        >
          "The bridge is not a barrier—it is an initiation. Complete the three waypoints below to affirm your place in the ledger and unlock the Clubhouse Sanctuary."
        </motion.p>
      </section>

      {/* =========================================================================
          THE 3 ESSENTIAL WAYPOINTS (Streamlined Primary Path — Things 27, 28, 57)
          ========================================================================= */}
      <section className="space-y-4 mb-12">
        
        {/* WAYPOINT 1: SIGN THE REGISTER */}
        <div className={`p-6 rounded-2xl border transition-all ${isLoggedIn ? 'bg-[#FAFDF9] border-[#25D366]/30 shadow-sm' : 'bg-[#FAF5EE] border-[#20070e]/15 shadow-md'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${isLoggedIn ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e]/10 text-[#20070e]'}`}>
                {isLoggedIn ? <CheckCircle2 size={20} /> : '01'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[#20070e]">
                    Sign the Register
                  </h3>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-[#20070e]/10 text-[#20070e] px-2 py-0.5 rounded">
                    30 pts · Required
                  </span>
                </div>
                <p className="text-xs text-[#120308]/70 font-serif">
                  {isLoggedIn 
                    ? `Recorded in the Archives as ${dbName || session?.user?.name || 'Reader'} (${dbLkid || 'LK-VERIFIED'})`
                    : 'Create or sign in to your Paper Thoughts account to verify your name in the ledger.'
                  }
                </p>
              </div>
            </div>

            <div>
              {isLoggedIn ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-4 py-2 rounded-xl">
                  <CheckCircle2 size={14} />
                  Signed
                </span>
              ) : (
                <button
                  onClick={() => router.push(signUpUrl)}
                  className="w-full sm:w-auto bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-sans"
                >
                  Sign In to Pass
                </button>
              )}
            </div>
          </div>
        </div>

        {/* WAYPOINT 2: THE SIGNAL FIRE (INSTAGRAM) */}
        <div className={`p-6 rounded-2xl border transition-all ${isInstagramFollowed ? 'bg-[#FAFDF9] border-[#25D366]/30 shadow-sm' : 'bg-[#FAF5EE] border-[#20070e]/15 shadow-md'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${isInstagramFollowed ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e]/10 text-[#20070e]'}`}>
                {isInstagramFollowed ? <CheckCircle2 size={20} /> : '02'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[#20070e]">
                    Follow on Instagram
                  </h3>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-[#c96a42]/15 text-[#c96a42] px-2 py-0.5 rounded">
                    10 pts · Signal Fire
                  </span>
                </div>
                <p className="text-xs text-[#120308]/70 font-serif">
                  Follow <strong className="text-[#20070e]">@paperthoughts.ng</strong> where monthly book drops and meeting galleries are posted.
                </p>
              </div>
            </div>

            <div>
              <button
                onClick={handleFollowInstagram}
                className={`w-full sm:w-auto text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-sans flex items-center justify-center gap-2 ${isInstagramFollowed ? 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30' : 'bg-[#c96a42] hover:bg-[#e07a5f] text-[#120308]'}`}
              >
                <FaInstagram size={14} />
                <span>{isInstagramFollowed ? 'Following ✓' : 'Follow @paperthoughts.ng'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* WAYPOINT 3: THE ACCORD OF THE SECOND CHAPTER */}
        <div className={`p-6 rounded-2xl border transition-all ${isAccordAffirmed ? 'bg-[#FAFDF9] border-[#25D366]/30 shadow-sm' : 'bg-[#FAF5EE] border-[#20070e]/15 shadow-md'}`}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${isAccordAffirmed ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e]/10 text-[#20070e]'}`}>
                  {isAccordAffirmed ? <CheckCircle2 size={20} /> : '03'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-[#20070e]">
                      The Accord of the Second Chapter
                    </h3>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-[#20070e]/10 text-[#20070e] px-2 py-0.5 rounded">
                      Community Covenant
                    </span>
                  </div>
                  <p className="text-xs text-[#120308]/70 font-serif">
                    Five fundamental rules to keep the reading room thoughtful, fierce, and free of noise.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAccordDetails(prev => !prev)}
                className="text-xs font-bold text-[#c96a42] hover:text-[#20070e] inline-flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <span>{showAccordDetails ? 'Hide Covenant Rules' : 'Read 5 Rules'}</span>
                {showAccordDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Collapsible Accord Rules */}
            <AnimatePresence>
              {showAccordDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-3 border-t border-[#20070e]/10 overflow-hidden"
                >
                  {ACCORD.map((rule) => (
                    <div key={rule.num} className="bg-white/60 p-3.5 rounded-xl border border-[#20070e]/10 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#c96a42] uppercase tracking-wider">
                        Rule {rule.num}: {rule.title}
                      </span>
                      <p className="text-xs text-[#120308]/80 font-serif leading-relaxed">
                        {rule.text}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accord Action Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#20070e]/10">
              <span className="text-xs text-[#120308]/60 font-serif italic">
                {isAccordAffirmed 
                  ? 'You have affirmed the Accord. The homeland doors are open.' 
                  : 'Affirm the Accord to complete the crossing and unlock WhatsApp.'
                }
              </span>

              <button
                onClick={handleAcceptAccord}
                disabled={syncing}
                className="w-full sm:w-auto bg-[#20070e] hover:bg-[#120308] text-[#FBF7EE] text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-sans disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {syncing ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>{isAccordAffirmed ? 'Accord Affirmed ✓' : 'I Affirm the Accord'}</span>
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          THE UNLOCKED HOMELAND (WhatsApp Entry & Declaration — Instant Passage)
          ========================================================================= */}
      {isAccordAffirmed && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#E6F8ED] via-[#FAFDF9] to-[#E6F8ED] border-2 border-[#25D366]/30 rounded-3xl p-8 mb-12 shadow-xl text-center space-y-6"
        >
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-[10px] font-bold uppercase tracking-widest font-sans">
              <Unlock size={11} />
              The Homeland is Open
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#20070e]">
              Welcome to the Clubhouse
            </h2>
            <p className="text-xs sm:text-sm text-[#120308]/75 font-serif max-w-lg mx-auto leading-relaxed">
              You have crossed the line carrying your name and covenant. Join the main community WhatsApp thread to meet your fellow chapter readers.
            </p>
          </div>

          {/* Prominent WhatsApp Button */}
          <div className="max-w-md mx-auto pt-2">
            <a
              href={whatsappGroupLink || 'https://chat.whatsapp.com/DGDfnoZCM2mH6xqC8cK6Ez'}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 px-8 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest font-sans cursor-pointer"
            >
              <FaWhatsapp size={18} />
              <span>Enter Community WhatsApp Group</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Copyable Declaration */}
          <div className="bg-white/80 border border-[#20070e]/10 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2">
            <span className="text-[10px] font-bold text-[#20070e]/60 uppercase tracking-widest block">
              Declaration of Passage
            </span>
            <p className="text-xs text-[#120308]/85 font-serif italic select-all bg-cream/30 p-2.5 rounded-lg border border-black/5">
              "I, {dbName || session?.user?.name || 'Reader'} ({dbLkid || 'LK-VERIFIED'}), have crossed the bridge and hold the Accord of the Second Chapter."
            </p>
            <button
              onClick={() => {
                const decl = `I, ${dbName || session?.user?.name || 'Reader'} (${dbLkid || 'LK-VERIFIED'}), have crossed the bridge and hold the Accord of the Second Chapter.`;
                navigator.clipboard.writeText(decl);
                setDeclCopied(true);
                setTimeout(() => setDeclCopied(false), 2000);
              }}
              className="text-[11px] font-bold text-[#20070e] hover:text-[#c96a42] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy size={11} />
              <span>{declCopied ? 'Declaration Copied!' : 'Copy Declaration to Clipboard'}</span>
            </button>
          </div>

          {/* Relic PDF Download Trigger */}
          <div className="pt-2">
            <button
              onClick={handleDownloadRelic}
              disabled={pdfGenerating || !isLoggedIn}
              className="text-xs font-bold text-[#c96a42] hover:text-[#20070e] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {pdfGenerating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              <span>Download Official Relic of the Crossing PDF</span>
            </button>
          </div>
        </motion.section>
      )}

      {/* =========================================================================
          OPTIONAL EXPLORER VAULT (Bonus Signal Fires — Progress & Extra Points)
          ========================================================================= */}
      <section className="border-t border-[#20070e]/10 pt-8 pb-12">
        <button
          onClick={() => setShowBonusRealms(prev => !prev)}
          className="w-full bg-[#FAF5EE] hover:bg-[#F5EDE0] border border-[#20070e]/15 p-4 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <Gift size={16} className="text-[#c96a42] group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-bold text-[#20070e] uppercase tracking-wider block font-sans">
                Explorer's Vault: Extra Signal Fires & Bonus Honors
              </span>
              <span className="text-[11px] text-[#120308]/60 font-serif">
                Current Score: {totalPoints} / {MAX_POINTS} pts · Connect with Discord, WhatsApp Channel, and YouTube
              </span>
            </div>
          </div>
          {showBonusRealms ? <ChevronUp size={16} className="text-[#20070e]/50" /> : <ChevronDown size={16} className="text-[#20070e]/50" />}
        </button>

        <AnimatePresence>
          {showBonusRealms && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-6 space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* WhatsApp Channel */}
                <div className="p-3.5 bg-white rounded-xl border border-[#20070e]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FaWhatsapp size={14} className="text-[#25D366]" />
                    <span className="font-bold text-[#20070e]">WhatsApp Channel</span>
                  </div>
                  <button
                    onClick={() => {
                      window.open(CROSSING_CONFIG.whatsappChannel, '_blank', 'noopener,noreferrer');
                      handleToggleWaypoint('whatsapp_channel', true);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${progress.whatsapp_channel ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e] text-[#FBF7EE]'}`}
                  >
                    {progress.whatsapp_channel ? 'Joined ✓' : 'Join'}
                  </button>
                </div>

                {/* Discord */}
                <div className="p-3.5 bg-white rounded-xl border border-[#20070e]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FaDiscord size={14} className="text-[#5865F2]" />
                    <span className="font-bold text-[#20070e]">Discord Server</span>
                  </div>
                  <button
                    onClick={() => {
                      window.open(CROSSING_CONFIG.discord, '_blank', 'noopener,noreferrer');
                      handleToggleWaypoint('discord', true);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${progress.discord ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e] text-[#FBF7EE]'}`}
                  >
                    {progress.discord ? 'Joined ✓' : 'Join'}
                  </button>
                </div>

                {/* YouTube */}
                <div className="p-3.5 bg-white rounded-xl border border-[#20070e]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FaYoutube size={14} className="text-[#FF0000]" />
                    <span className="font-bold text-[#20070e]">YouTube</span>
                  </div>
                  <button
                    onClick={() => {
                      window.open(CROSSING_CONFIG.youtube, '_blank', 'noopener,noreferrer');
                      handleToggleWaypoint('youtube', true);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${progress.youtube ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e] text-[#FBF7EE]'}`}
                  >
                    {progress.youtube ? 'Subscribed ✓' : 'Subscribe'}
                  </button>
                </div>

                {/* TikTok */}
                <div className="p-3.5 bg-white rounded-xl border border-[#20070e]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FaTiktok size={14} className="text-black" />
                    <span className="font-bold text-[#20070e]">TikTok</span>
                  </div>
                  <button
                    onClick={() => {
                      window.open(CROSSING_CONFIG.tiktok, '_blank', 'noopener,noreferrer');
                      handleToggleWaypoint('tiktok', true);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${progress.tiktok ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#20070e] text-[#FBF7EE]'}`}
                  >
                    {progress.tiktok ? 'Followed ✓' : 'Follow'}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

    </main>
  );
}

export default function CrossingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-[#20070e]">
        <Loader2 className="animate-spin text-[#c96a42]" size={28} />
      </div>
    }>
      <CrossingPageContent />
    </Suspense>
  );
}
