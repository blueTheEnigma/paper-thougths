"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserButton, SignOutButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Ticket, Users, Copy, CheckCircle2, ShieldCheck, MapPin, 
  ExternalLink, ShoppingBag, ArrowRight, Clock, Flame, Sparkles, 
  BookOpen, MessageSquare, Gift, Coins, Settings, X 
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

// ─── Cinematic Archive Entrance Portal ────────────────────────────────────────

function ArchivePortal({ onEnter, userName, profile, discountPercent }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 900);
    const t2 = setTimeout(() => setStage(2), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      key="archive-portal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-y-auto bg-ink p-4 sm:p-6"
      style={{ background: 'radial-gradient(ellipse at 50% 60%, #1a0610 0%, #0d0406 60%, #060103 100%)' }}
    >
      {/* Ambient glow layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(92,26,46,0.35) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 30% at 50% 50%, rgba(194,106,66,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Floating speck particles */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            left: `${5 + (i * 5.3) % 90}%`,
            top: `${10 + (i * 7.1) % 80}%`,
            background: i % 4 === 0 ? 'rgba(242,169,138,0.6)' : 'rgba(201,106,66,0.4)',
          }}
          animate={{
            y: [0, -18, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 3 + (i % 3) * 1.2,
            repeat: Infinity,
            delay: (i * 0.25) % 3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl w-full my-auto py-8">
        {/* Sailor's Wheel icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center animate-pulse-subtle"
            style={{
              background: 'radial-gradient(circle, rgba(92,26,46,0.5) 0%, rgba(92,26,46,0.1) 100%)',
              border: '1px solid rgba(242,169,138,0.25)',
              boxShadow: '0 0 40px rgba(92,26,46,0.6), 0 0 80px rgba(92,26,46,0.2)',
            }}
          >
            <svg 
              className="w-10 h-10 animate-spin relative z-10" 
              viewBox="0 0 100 100" 
              fill="none" 
              stroke="#F2A98A" 
              strokeWidth="4" 
              strokeLinecap="round"
              style={{ animationDuration: '8s' }}
            >
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="4" fill="#F2A98A" />
              <circle cx="50" cy="50" r="30" strokeWidth="3" />
              <circle cx="50" cy="50" r="20" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="50" y1="10" x2="50" y2="90" />
              <line x1="10" y1="50" x2="90" y2="50" />
              <line x1="22" y1="22" x2="78" y2="78" />
              <line x1="22" y1="78" x2="78" y2="22" />
              <line x1="50" y1="20" x2="50" y2="2" strokeWidth="6" />
              <line x1="50" y1="80" x2="50" y2="98" strokeWidth="6" />
              <line x1="20" y1="50" x2="2" y2="50" strokeWidth="6" />
              <line x1="80" y1="50" x2="98" y2="50" strokeWidth="6" />
              <line x1="29" y1="29" x2="16" y2="16" strokeWidth="6" />
              <line x1="71" y1="71" x2="84" y2="84" strokeWidth="6" />
              <line x1="29" y1="71" x2="16" y2="84" strokeWidth="6" />
              <line x1="71" y1="29" x2="84" y2="16" strokeWidth="6" />
            </svg>
          </div>
        </motion.div>

        {/* Label */}
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="block text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.35em] mb-3"
          style={{ color: '#C96A42' }}
        >
          THE ARCHIVE LEDGER
        </motion.span>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-extrabold leading-tight mb-4 text-3xl sm:text-4xl text-cream"
        >
          Welcome, <span style={{ color: '#F2A98A' }}>{userName.split(' ')[0]}</span>
        </motion.h1>

        {/* Rules container */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full bg-[#1b0610]/80 border border-sage/20 rounded-[28px] p-5 sm:p-7 text-left space-y-5 mb-8 shadow-xl max-w-xl animate-pulse-subtle"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#F2A98A] border-b border-sage/10 pb-2 text-center sm:text-left font-sans">
                ARCHIVE RULES & ECONOMY
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-cream/90">
                {/* Milestone Tokens Column */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5 font-sans">
                    <Award size={14} /> Milestone Tokens
                  </h4>
                  <p className="text-xs sm:text-sm text-cream/90 font-serif leading-relaxed">
                    Power your journey to unlock the <strong>Keeper</strong> tier ({discountPercent} discount on all books for 90 days). Earn tokens by completing activities:
                  </p>
                  <ul className="text-[11px] sm:text-xs text-cream/85 font-serif list-disc pl-4 space-y-1.5">
                    <li><strong>Peer Critique</strong>: Submit detailed reviews (<strong>+1.0 Token</strong>, or <strong>+1.5 Tokens</strong> for early-birds).</li>
                    <li><strong>Weekly Submission</strong>: Write weekly prompt responses (<strong>+1.0 Token</strong>).</li>
                    <li><strong>Invite Readers</strong>: Refer friends (<strong>+1.2 Tokens</strong> per referral, up to your first 5).</li>
                  </ul>
                </div>

                {/* Spendable Leaves Column */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#FF8D5C] flex items-center gap-1.5 font-sans">
                    <Coins size={14} /> Paper Leaves
                  </h4>
                  <p className="text-xs sm:text-sm text-cream/90 font-serif leading-relaxed">
                    Your spendable currency. <strong>Leaves can only be earned from peer critiques</strong> (<strong>+10 Leaves</strong>, or <strong>+15 Leaves</strong> for early-birds), capped at 3 rewarded critiques per week:
                  </p>
                  <ul className="text-[11px] sm:text-xs text-cream/85 font-serif list-disc pl-4 space-y-1.5">
                    <li>Donate leaves to your <strong>Chapter Pool</strong> to fund book vouchers for your local chapter!</li>
                    <li>Vouchers are automatically generated when the pool crosses 500 leaves to pay it forward.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full space-y-4"
            >
              <motion.button
                onClick={onEnter}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 font-sans font-bold uppercase tracking-widest text-xs sm:text-sm cursor-pointer transition-all px-10 py-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #5C1A2E 0%, #7A2040 100%)',
                  color: '#FAF7F2',
                  boxShadow: '0 0 30px rgba(92,26,46,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(242,169,138,0.2)',
                }}
              >
                <span>Pass into the Archive</span>
                <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function DashboardClient({ profile, initialOrders, recommendations, userEmail }) {
  const [orders] = useState(initialOrders || []);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Local States for Bi-token economy
  const [spendableLeaves, setSpendableLeaves] = useState(profile?.spendableLeaves || 0);
  const [milestoneTokens, setMilestoneTokens] = useState(profile?.milestoneTokens || 0);
  const [lifetimeLeaves, setLifetimeLeaves] = useState(profile?.lifetimeLeaves || 0);
  const [bookVouchersGifted, setBookVouchersGifted] = useState(profile?.bookVouchersGifted || 0);
  
  // Chapter Pool States
  const [chapterPool, setChapterPool] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateMessage, setDonateMessage] = useState(null);
  const [poolLoading, setPoolLoading] = useState(true);

  // Milestone Celebration Overlay
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Birthday banner dismissal
  const [bdayDismissed, setBdayDismissed] = useState(true);
  const [showPortal, setShowPortal] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('dismissed_birthday') === 'true';
      setBdayDismissed(dismissed);
      const seen = sessionStorage.getItem('seen_dashboard_portal') === 'true';
      setShowPortal(!seen);
    }
  }, []);

  const handleEnterPortal = () => {
    sessionStorage.setItem('seen_dashboard_portal', 'true');
    setShowPortal(false);
  };

  // Check if today is birthday
  const isBirthdayToday = () => {
    if (!profile?.birthday) return false;
    const parts = profile.birthday.split('-'); // YYYY-MM-DD
    if (parts.length < 3) return false;
    const bdayMonth = parseInt(parts[1], 10) - 1;
    const bdayDay = parseInt(parts[2], 10);
    const today = new Date();
    return today.getMonth() === bdayMonth && today.getDate() === bdayDay;
  };

  const isBday = isBirthdayToday();

  // Load Chapter Pool & Trigger celebrations
  useEffect(() => {
    if (!profile) return;

    // 1. Fetch Chapter Pool
    async function fetchChapterPool() {
      try {
        const res = await fetch('/api/chapter-pools');
        const data = await res.json();
        if (data.success && data.pool) {
          setChapterPool(data.pool);
        }
      } catch (err) {
        console.error("Failed to load chapter pool:", err);
      } finally {
        setPoolLoading(false);
      }
    }
    fetchChapterPool();

    // 2. Birthday Confetti
    if (isBday) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 500);
    }

    // 3. Hidden 500 Lifetime Leaves milestone gift modal check
    if (bookVouchersGifted > 0) {
      const key = `seen_voucher_${profile.id}_${bookVouchersGifted}`;
      if (!localStorage.getItem(key)) {
        setTimeout(() => {
          setShowMilestoneModal(true);
          confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.5 }
          });
        }, 1500);
        localStorage.setItem(key, 'true');
      }
    }
  }, [profile, bookVouchersGifted, isBday]);

  const copyRefLink = () => {
    if (!profile) return;
    const link = `https://paperthoughts.org/join?ref=${profile.lkid}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDiscountCode = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.lkid);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    const amount = parseInt(donationAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setDonateMessage({ type: 'error', text: 'Please enter a valid positive donation amount.' });
      return;
    }
    if (spendableLeaves < amount) {
      setDonateMessage({ type: 'error', text: `Insufficient leaves: You only have ${spendableLeaves} Paper Leaves.` });
      return;
    }

    setDonateLoading(true);
    setDonateMessage(null);

    try {
      const res = await fetch('/api/chapter-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationAmount: amount })
      });
      const data = await res.json();
      if (data.success) {
        setSpendableLeaves(prev => prev - amount);
        setChapterPool(prev => ({
          ...prev,
          current_leaves_balance: data.data.remainingBalance
        }));
        setDonationAmount('');
        
        if (data.data.vouchersGenerated > 0) {
          setDonateMessage({ 
            type: 'success', 
            text: `Donated ${amount} Leaves! You crossed 500 leaves and generated ${data.data.vouchersGenerated} book voucher(s) for the chapter!` 
          });
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        } else {
          setDonateMessage({ 
            type: 'success', 
            text: `Donated ${amount} Leaves to your chapter pool. Thank you for paying it forward!` 
          });
        }
      } else {
        setDonateMessage({ type: 'error', text: data.error || 'Failed to process donation.' });
      }
    } catch (err) {
      setDonateMessage({ type: 'error', text: 'An unexpected connection error occurred.' });
    } finally {
      setDonateLoading(false);
    }
  };

  if (!profile) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center py-12 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full bg-white p-10 rounded-3xl border border-sage/20 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-red-400" size={32} />
          </div>
          <h2 className="text-3xl font-display text-burgundy mb-4 font-bold">Account Not Linked</h2>
          <p className="text-ink/70 mb-8 leading-relaxed">
            We couldn't find an Archive profile associated with your email address. 
            <br/><br/>
            Did you register using a different email address? If you haven't joined the Archive yet, you need to register first.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/join" className="bg-burgundy text-cream py-3 rounded-xl font-bold hover:bg-ink transition-colors">
              Join the Archive
            </Link>
            <SignOutButton>
              <button className="bg-sage/10 text-ink/60 py-3 rounded-xl font-bold hover:bg-sage/20 transition-colors">
                Sign out and try another email
              </button>
            </SignOutButton>
          </div>
        </motion.div>
      </main>
    );
  }

  const eventsNeeded = 6;
  const eventsProgress = Math.min(100, (profile.events / eventsNeeded) * 100);
  const referralsNeeded = 5;
  const referralsProgress = Math.min(100, (profile.referrals / referralsNeeded) * 100);

  const isKeeper = profile.tier === "Keeper" || profile.tier === "Lore Keeper";
  const discountPercent = profile.tier === "Lore Keeper" ? "10%" : "5%";
  
  // Radial SVG calculation for Milestone Tokens
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const tokenGoal = 10.0;
  const tokenPercent = Math.min(100, (milestoneTokens / tokenGoal) * 100);
  const strokeDashoffset = circumference - (tokenPercent / 100) * circumference;

  // Chapter Pool Gifting Progress
  const poolLimit = chapterPool?.target_leaves_limit || 500;
  const poolBalance = chapterPool?.current_leaves_balance || 0;
  const poolPercent = Math.min(100, (poolBalance / poolLimit) * 100);

  // Check if admin
  const isAdmin = profile.permissions && profile.permissions.length > 0;

  // Stagger variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-burgundy/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/5 rounded-full blur-[120px] -z-10" />

      {/* Birthday Celebration Greeting Banner */}
      {isBday && !bdayDismissed && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-primary/30 via-accent/35 to-primary/20 backdrop-blur-lg text-ink p-6 rounded-[24px] flex items-center justify-between shadow-md border border-accent/20 relative overflow-hidden animate-pulse-subtle"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl animate-float">🎂📚</span>
            <div>
              <h4 className="font-display font-bold text-base sm:text-lg text-burgundy">Happy Birthday, {profile.name.split(' ')[0]}!</h4>
              <p className="text-xs sm:text-sm text-ink/80 mt-1 leading-relaxed font-sans font-medium">
                Your chapter loves you. ✨ Keep reading, keep writing — we're glad you're one of us. Wishing you a year of grand stories and rich critiques!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="animate-pulse hidden md:block text-accent/80" size={24} />
            <button 
              onClick={() => {
                sessionStorage.setItem('dismissed_birthday', 'true');
                setBdayDismissed(true);
              }}
              className="p-2 hover:bg-ink/10 rounded-full transition-colors text-ink/60 hover:text-ink cursor-pointer ml-4"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Hidden 500 Lifetime Leaves Milestone Voucher Modal Celebration */}
      <AnimatePresence>
        {showMilestoneModal && (
          <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white max-w-lg w-full p-8 rounded-[32px] border border-sage/20 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent via-burgundy to-accent"></div>
              
              <div className="w-20 h-20 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="text-burgundy animate-float" size={40} />
              </div>
              
              <h2 className="text-3xl font-display text-burgundy font-bold mb-2">Milestone Unlocked!</h2>
              <h3 className="text-lg font-bold text-accent mb-4">500 Lifetime Paper Leaves</h3>
              
              <p className="text-sm text-ink/70 leading-relaxed mb-6 font-serif">
                Exceptional work! You have generated <strong>{lifetimeLeaves}</strong> lifetime leaves through active critique and writing.
                <br/><br/>
                As a token of our appreciation, the Archive has gifted you <strong>{bookVouchersGifted} Free Book Voucher(s)</strong>! Contact an administrator or visit the bookstore desk at your chapter event to redeem your reward.
              </p>

              <div className="bg-sage/5 border border-sage/20 rounded-2xl p-4 mb-8">
                <div className="text-xs uppercase tracking-widest text-ink/50 font-bold mb-1">Vouchers Earned</div>
                <div className="text-3xl font-display text-burgundy font-extrabold">{bookVouchersGifted} 📚</div>
              </div>

              <button 
                onClick={() => setShowMilestoneModal(false)}
                className="w-full bg-burgundy hover:bg-ink text-cream py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Hooray, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        className="max-w-6xl mx-auto space-y-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-sage/10">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-burgundy leading-none tracking-tight font-extrabold mb-3">
              Welcome back, <br className="sm:hidden" />
              <span className="text-burgundy/90">{profile.name.split(' ')[0]}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] sm:text-xs">
              <span className="bg-white px-2.5 py-1 border border-sage/20 rounded shadow-sm text-burgundy font-bold">{profile.lkid}</span>
              <span className="text-ink/30">•</span>
              <span className="flex items-center gap-1.5 text-ink/60 font-bold"><MapPin size={12} className="text-sage"/> {profile.chapter}</span>
              <span className="text-ink/30">•</span>
              <button 
                onClick={() => setShowPortal(true)}
                className="bg-accent/15 hover:bg-accent hover:text-cream text-accent font-bold text-xs px-3.5 py-1.5 rounded-lg border border-accent/30 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all duration-200"
              >
                <BookOpen size={13}/> Rules & Guide
              </button>
              {isAdmin && (
                <>
                  <span className="text-ink/30">•</span>
                  <span className="bg-burgundy/5 text-burgundy font-bold text-[9px] px-2.5 py-1 rounded border border-burgundy/15 uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck size={10}/> Admin
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
            {isAdmin && (
              <Link href="/admin" className="bg-burgundy/10 hover:bg-burgundy/15 text-burgundy p-3 rounded-2xl border border-burgundy/20 transition-all flex items-center gap-2 text-sm font-bold shadow-sm">
                <Settings size={16}/>
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}
            <div className="bg-white/50 backdrop-blur-sm border border-sage/15 py-2.5 px-5 rounded-2xl flex items-center justify-between md:justify-start gap-4 shadow-sm">
               <span className="text-xs font-bold text-ink/70 truncate max-w-[180px] sm:max-w-none">{userEmail}</span>
               <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </motion.div>

        {/* Bi-Token Economy & Membership Status Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Membership Status Card */}
          <div className="parchment-card p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Award size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Membership Status</h3>
                <div className="flex flex-wrap items-baseline gap-2 mt-1">
                  <h2 className="text-4xl font-display font-extrabold text-burgundy leading-none tracking-tight">{profile.tier}</h2>
                  {isKeeper && (
                    <span className="bg-sage/10 text-sage font-bold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-sage/20">
                      Unlocked
                    </span>
                  )}
                </div>
              </div>

              {isKeeper ? (
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 space-y-2.5">
                   <h4 className="font-bold text-burgundy flex items-center gap-1.5 text-xs font-sans"><Ticket size={14}/> {discountPercent} Discount</h4>
                   
                   <div className="flex items-center gap-2 bg-white/70 p-1.5 pl-3 rounded-lg border border-sage/15">
                      <span className="font-mono text-sm font-bold text-ink tracking-wider flex-1">{profile.lkid}</span>
                      <button onClick={copyDiscountCode} className="bg-sage/10 hover:bg-sage/25 text-ink px-3 py-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
                         {copiedCode ? <CheckCircle2 size={12} className="text-sage"/> : <Copy size={12}/>}
                         {copiedCode ? "Copied" : "Copy"}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="bg-ink/5 rounded-xl p-4 border border-sage/10">
                  <p className="text-xs sm:text-sm text-ink/85 leading-relaxed font-serif">
                    Upgrade to <strong>Keeper</strong> to unlock your {discountPercent} discount on all books for 90 days and exclusive Archive access.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Milestone Tokens Circle Progress Card */}
          <div className="parchment-card p-8 flex items-center justify-between relative group min-h-[220px]">
            <div className="space-y-3">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Milestone Tokens</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-display text-burgundy font-extrabold font-serif">{milestoneTokens.toFixed(1)}</span>
                <span className="text-sm font-bold text-ink/40">/ {tokenGoal}</span>
              </div>
              <p className="text-xs text-ink/60 leading-relaxed max-w-[160px] font-serif font-medium">
                Earned via reviews, submissions, and referrals. 10.0 unlocks Keeper.
              </p>
            </div>
            
            <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="40" 
                  cy="40" 
                  r={radius} 
                  stroke="#E8DFC9" 
                  strokeWidth="6" 
                  fill="transparent" 
                />
                <motion.circle 
                  cx="40" 
                  cy="40" 
                  r={radius} 
                  stroke="#5C1A2E" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute text-xs font-sans font-extrabold text-burgundy">{tokenPercent.toFixed(0)}%</div>
            </div>
          </div>

          {/* Spendable Leaves Card */}
          <div className="parchment-card p-8 flex flex-col justify-between group min-h-[220px]">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
              <Coins size={60} className="text-burgundy" />
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Spendable Leaves</span>
                <div className="text-4xl font-display text-burgundy font-extrabold mt-1">{spendableLeaves} <span className="text-2xl">🍃</span></div>
              </div>
              
              {/* Lifetime Leaves / Mystery Package Progression */}
              <div className="border-t border-sage/10 pt-3.5">
                <div className="flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-ink/50 mb-1.5">
                  <span className="flex items-center gap-1"><Gift size={11} className="text-accent" /> Next Mystery Gift</span>
                  <span>{lifetimeLeaves % 500} / 500 🍃</span>
                </div>
                <div className="w-full bg-[#E8DFC9] rounded-full h-2 relative overflow-hidden border border-sage/5">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-1000 shadow-sm" 
                    style={{ width: `${((lifetimeLeaves % 500) / 500) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-ink/45 mt-1 font-serif">
                  <span>Lifetime: {lifetimeLeaves} leaves</span>
                  <span className="font-bold text-accent italic">🎁 Secret reward at 500</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Workspace Hub Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Writing Workspace Card */}
          <Link href="/dashboard/write" className="group">
            <div className="parchment-card p-8 flex flex-col justify-between h-56 relative group transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
              
              <div className="flex justify-between items-start">
                <div className="bg-primary/5 text-burgundy p-3.5 rounded-2xl border border-primary/10 group-hover:bg-primary/10 transition-colors">
                  <Flame size={24} className={profile.streak > 0 ? "animate-pulse text-burgundy" : ""} />
                </div>
                {profile.streak > 0 && (
                  <span className="bg-primary/10 text-burgundy text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-primary/20">
                    🔥 {profile.streak} Week Streak
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-display font-extrabold text-burgundy group-hover:text-accent transition-colors flex items-center gap-1.5">
                  Writing Workspace <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs sm:text-sm text-ink/60 mt-2 leading-relaxed">
                  Compose and save offline-capable draft submissions for the weekly prompt. Syncs seamlessly online.
                </p>
              </div>
            </div>
          </Link>

          {/* Critique Workspace Card */}
          <Link href="/dashboard/review" className="group">
            <div className="parchment-card p-8 flex flex-col justify-between h-56 relative group transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sage/5 rounded-full blur-2xl group-hover:bg-sage/10 transition-all"></div>
              
              <div className="flex justify-between items-start">
                <div className="bg-sage/5 text-sage p-3.5 rounded-2xl border border-sage/10 group-hover:bg-sage/10 transition-colors">
                  <MessageSquare size={24} />
                </div>
                <span className="bg-sage/10 text-sage text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-sage/20">
                  📚 {profile.weeklyReviews} / 3 Rewarded Crits
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-extrabold text-burgundy group-hover:text-accent transition-colors flex items-center gap-1.5">
                  Critique Queue <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs sm:text-sm text-ink/60 mt-2 leading-relaxed">
                  Provide detailed critiques in the double-blind queue. Earn 1.0 Milestone Token per review (1.5 for early-birds).
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Dynamic Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            


            {/* Achievements & Cycles */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blackbox Tracker */}
              <div className="bg-ink text-cream p-8 rounded-[24px] shadow-xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <ShoppingBag size={120} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-cream/40 mb-2">The Archive Blackbox</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-display font-extrabold font-serif">{orders.filter(o => o.status === 'Paid').length}</span>
                      <span className="text-lg text-cream/40 font-display">/ 10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(231,111,81,0.4)]" 
                        style={{ width: `${Math.min(100, (orders.filter(o => o.status === 'Paid').length / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-cream/60 leading-relaxed uppercase tracking-wider">
                    {orders.filter(o => o.status === 'Paid').length >= 10 
                      ? "Blackbox Unlocked. Consult the Lore Keeper." 
                      : `${10 - orders.filter(o => o.status === 'Paid').length} more paid orders until Blackbox.`}
                  </p>
                </div>
              </div>

              {/* Archive Economy Guide */}
              <div className="parchment-card p-8 flex flex-col justify-between min-h-[220px]">
                <div className="relative z-10 space-y-4">
                  <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Archive Economy Guide</h3>
                  
                  <div className="space-y-4">
                    {/* Milestone Tokens */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-burgundy uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Award size={14} /> Milestone Tokens
                      </h4>
                      <p className="text-xs text-ink/85 leading-relaxed font-serif font-medium">
                        Power your upgrade to the <strong>Keeper</strong> tier. Earn tokens by completing activities:
                      </p>
                      <ul className="text-xs text-ink/80 font-serif list-disc pl-4 space-y-1.5">
                        <li><strong>Peer Critique</strong>: Submit detailed reviews (<strong>+1.0 Token</strong>, or <strong>+1.5 Tokens</strong> for early-birds).</li>
                        <li><strong>Weekly Submission</strong>: Write weekly prompt responses (<strong>+1.0 Token</strong>).</li>
                        <li><strong>Invite Readers</strong>: Refer friends (<strong>+1.2 Tokens</strong> per referral, up to your first 5).</li>
                      </ul>
                    </div>
                    
                    {/* Paper Leaves */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-sage uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Coins size={14} className="text-sage" /> Paper Leaves Economy
                      </h4>
                      <p className="text-xs text-ink/85 leading-relaxed font-serif font-medium">
                        Spendable currency. <strong>Paper Leaves can only be earned from peer critiques</strong> (<strong>+10 Paper Leaves</strong>, or <strong>+15 Paper Leaves</strong> for early-birds), and rewards are capped after 3 reviews per week to avoid spamming. Submissions and referrals do not earn leaves.
                      </p>
                      <p className="text-[11px] text-ink/70 font-serif italic">
                        Donate leaves to the <strong>Chapter Book Pool</strong> to pay it forward and fund book bundles for your local chapter!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recommendations Section */}
            {recommendations && recommendations.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-display font-extrabold text-burgundy">Curated for Your Archive</h3>
                  <Link href="/bookstore" className="text-xs font-bold text-accent hover:text-burgundy flex items-center gap-1 transition-colors">
                    Explore Full Store <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                  {recommendations.map((book) => (
                    <Link key={book.id} href={`/bookstore?search=${encodeURIComponent(book.title)}`} className="min-w-[160px] w-[160px] group block">
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md border border-sage/10 mb-3 bg-white relative">
                        <img src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-cream text-burgundy p-2 rounded-full shadow-lg">
                            <ShoppingBag size={18} />
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-ink text-xs leading-tight line-clamp-2 group-hover:text-accent transition-colors">{book.title}</h4>
                      <p className="text-[10px] text-ink/50 mt-1">{book.genre}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Progress Trackers */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="parchment-card p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><Ticket size={16} className="text-sage"/> Event Points</h3>
                    <p className="text-[9px] text-ink/50 mt-1 uppercase tracking-wider font-bold">Physical: 2 • Virtual: 1</p>
                  </div>
                  <span className="font-display font-extrabold text-3xl text-burgundy font-serif">{profile.events}</span>
                </div>
                
                <div className="w-full bg-sage/10 rounded-full h-2 mb-3 overflow-hidden border border-sage/5">
                  <div className="bg-sage h-2 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${eventsProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">
                  <span>{eventsProgress.toFixed(0)}% Complete</span>
                  <span>{profile.events}/{eventsNeeded}</span>
                </div>
              </div>

              <div className="parchment-card p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><Users size={16} className="text-accent"/> Referrals</h3>
                    <p className="text-[9px] text-ink/50 mt-1 uppercase tracking-wider font-bold">Invite the collective</p>
                  </div>
                  <span className="font-display font-extrabold text-3xl text-burgundy font-serif">{profile.referrals}</span>
                </div>
                
                <div className="w-full bg-primary/10 rounded-full h-2 mb-3 overflow-hidden border border-primary/5">
                  <div className="bg-accent h-2 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${referralsProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">
                  <span>{referralsProgress.toFixed(0)}% Complete</span>
                  <span>{profile.referrals}/{referralsNeeded}</span>
                </div>
              </div>

            </motion.div>

            {/* My Archive Orders Section */}
            <motion.div variants={itemVariants} className="parchment-card p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-extrabold text-burgundy">My Archive Orders</h3>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-sage/5 rounded-2xl border border-sage/10 group hover:border-burgundy/25 transition-all">
                      <div>
                        <div className="text-[9px] font-bold text-ink/40 uppercase tracking-widest mb-1">{order.orderId} · {new Date(order.date).toLocaleDateString()}</div>
                        <h4 className="font-bold text-ink text-sm mb-1">{order.items}</h4>
                        <p className="text-xs text-burgundy font-bold">₦{order.total}</p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          order.status === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-burgundy/10 text-burgundy border border-burgundy/15'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-cream/35 rounded-2xl border border-dashed border-sage/30">
                  <p className="text-ink/40 font-serif italic">Your personal archive history is currently empty.</p>
                  <Link href="/bookstore" className="inline-block mt-4 text-[10px] font-sans font-bold text-burgundy underline uppercase tracking-widest">Browse Bookstore</Link>
                </div>
              )}
            </motion.div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Pay It Forward Chapter Pool Gifting Widget (Glassmorphic) */}
            <motion.div 
              variants={itemVariants}
              className="glass-counter p-8 rounded-[24px] shadow-lg relative overflow-hidden"
            >
              <h3 className="font-bold text-ink mb-2 uppercase tracking-[0.2em] text-[10px]">Pay It Forward</h3>
              <h4 className="font-display font-extrabold text-xl text-burgundy mb-4">Chapter Book Pool</h4>

              {poolLoading ? (
                <div className="py-8 text-center text-xs text-ink/40 font-medium">Loading chapter pool data...</div>
              ) : !chapterPool ? (
                <div className="bg-sage/5 border border-sage/10 rounded-xl p-4 text-xs text-ink/60 leading-relaxed italic font-serif">
                  To contribute to a chapter pool, please ensure you are registered to a specific chapter (Zaria, Kaduna, or Abuja).
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-white/40 border border-sage/10 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-ink/75">
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-sage" /> {chapterPool.chapter_name}</span>
                      <span>{poolBalance} / {poolLimit} Leaves</span>
                    </div>
                    
                    <div className="w-full bg-sage/10 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="bg-sage h-2 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${poolPercent}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <p className="text-[9px] text-ink/50 leading-relaxed font-serif">
                      At {poolLimit} leaves, the system auto-generates a book voucher to sponsor books for local chapter members.
                    </p>
                  </div>

                  <form onSubmit={handleDonate} className="space-y-3">
                    <div className="flex items-stretch gap-2">
                      <input 
                        type="number" 
                        placeholder="Leaves..." 
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        min="1"
                        max={spendableLeaves}
                        disabled={donateLoading}
                        className="flex-1 bg-cream/70 border border-sage/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sage placeholder-ink/30 font-medium text-ink"
                      />
                      <button 
                        type="submit" 
                        disabled={donateLoading || !donationAmount}
                        className="bg-sage hover:bg-ink hover:text-cream text-ink px-4 rounded-xl text-xs font-sans font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Donate
                      </button>
                    </div>
                    
                    {donateMessage && (
                      <p className={`text-[10px] font-bold ${donateMessage.type === 'success' ? 'text-green-700' : 'text-burgundy'}`}>
                        {donateMessage.text}
                      </p>
                    )}
                  </form>
                </div>
              )}
            </motion.div>

            {/* Referral Widget */}
            <motion.div variants={itemVariants} className="bg-burgundy text-cream p-8 rounded-[24px] shadow-xl relative overflow-hidden group border border-white/5">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              <h3 className="font-display font-extrabold text-2xl mb-4 relative z-10">Invite the Collective</h3>
              <p className="text-xs sm:text-sm text-cream/70 mb-8 leading-relaxed relative z-10 font-serif">
                Share your personal link. Earn 1.2 Milestone Tokens for each of your first 5 referrals. (Referrals do not earn leaves).
              </p>
              <button 
                onClick={copyRefLink}
                className="w-full bg-cream text-burgundy py-3.5 rounded-xl font-bold hover:bg-white transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 relative z-10 cursor-pointer text-xs"
              >
                {copied ? <CheckCircle2 size={16} className="text-sage"/> : <Copy size={16}/>}
                {copied ? "Link Copied!" : "Copy Referral Link"}
              </button>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants} className="parchment-card p-8">
              <h3 className="font-bold text-ink mb-6 uppercase tracking-[0.2em] text-[10px] border-b border-sage/10 pb-3">Quick Navigation</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/bookstore" className="group text-ink/75 hover:text-accent font-bold text-xs uppercase tracking-wider flex items-center gap-3 transition-colors">
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <ExternalLink size={16} className="text-sage" />
                    </div>
                    Browse Bookstore
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="group text-ink/75 hover:text-accent font-bold text-xs uppercase tracking-wider flex items-center gap-3 transition-colors">
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <ExternalLink size={16} className="text-sage" />
                    </div>
                    Upcoming Events
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPortal(true)}
                    className="w-full text-left group text-ink/75 hover:text-accent font-bold text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer bg-transparent border-0 p-0"
                  >
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <BookOpen size={16} className="text-sage" />
                    </div>
                    Rules & Onboarding Guide
                  </button>
                </li>
              </ul>
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* Onboarding Game Rules Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {showPortal && (
            <ArchivePortal
              onEnter={handleEnterPortal}
              userName={profile.name}
              profile={profile}
              discountPercent={discountPercent}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </main>
  );
}
