"use client";
import { useState, useEffect } from 'react';
import { UserButton, SignOutButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Ticket, Users, Copy, CheckCircle2, ShieldCheck, MapPin, 
  ExternalLink, ShoppingBag, ArrowRight, Clock, Flame, Sparkles, 
  BookOpen, MessageSquare, Gift, Coins, Settings 
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

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
        setDonateAmount('');
        
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
          <h2 className="text-3xl font-display text-burgundy mb-4">Account Not Linked</h2>
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

  return (
    <main className="min-h-screen bg-cream selection:bg-primary/30 pt-20 md:pt-32 pb-20 px-4 md:px-8 relative">
      
      {/* Birthday Celebration Greeting Banner */}
      {isBday && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-6xl mx-auto mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-cream p-4 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h4 className="font-bold text-sm sm:text-base">Happy Birthday from the Paper Thoughts Archive!</h4>
              <p className="text-xs text-white/95">Wishing you a year filled with grand stories, rich critiques, and endless leaves.</p>
            </div>
          </div>
          <Sparkles className="animate-pulse hidden sm:block text-yellow-300" size={24} />
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
              className="bg-white max-w-lg w-full p-8 rounded-[36px] border border-sage/20 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent via-burgundy to-accent"></div>
              
              <div className="w-20 h-20 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="text-burgundy" size={40} />
              </div>
              
              <h2 className="text-3xl font-display text-burgundy mb-2">Milestone Unlocked!</h2>
              <h3 className="text-lg font-bold text-accent mb-4">500 Lifetime Paper Leaves</h3>
              
              <p className="text-sm text-ink/70 leading-relaxed mb-6">
                Exceptional work! You have generated <strong>{lifetimeLeaves}</strong> lifetime leaves through active critique and writing.
                <br/><br/>
                As a token of our appreciation, the Archive has gifted you <strong>{bookVouchersGifted} Free Book Voucher(s)</strong>! Contact an administrator or visit the bookstore desk at your chapter event to redeem your reward.
              </p>

              <div className="bg-sage/5 border border-sage/20 rounded-2xl p-4 mb-8">
                <div className="text-xs uppercase tracking-widest text-ink/50 font-bold mb-1">Vouchers Earned</div>
                <div className="text-3xl font-display text-burgundy">{bookVouchersGifted} 📚</div>
              </div>

              <button 
                onClick={() => {
                  setShowMilestoneModal(false);
                  // Dismiss confetti
                }}
                className="w-full bg-burgundy hover:bg-ink text-cream py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
              >
                Hooray, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-burgundy mb-3 leading-tight">
              Welcome back, <br className="sm:hidden" />
              <span className="text-burgundy/90">{profile.name.split(' ')[0]}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] sm:text-xs">
              <span className="bg-white px-2 py-1 border border-sage/20 rounded shadow-sm text-burgundy font-bold">{profile.lkid}</span>
              <span className="text-ink/30">•</span>
              <span className="flex items-center gap-1.5 text-ink/60"><MapPin size={12} className="text-sage"/> {profile.chapter}</span>
              {isAdmin && (
                <>
                  <span className="text-ink/30">•</span>
                  <span className="bg-burgundy/5 text-burgundy font-bold text-[9px] px-2 py-0.5 rounded border border-burgundy/15 uppercase tracking-wide flex items-center gap-1">
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
            <div className="bg-white/60 backdrop-blur-sm border border-sage/20 py-2.5 px-5 rounded-2xl flex items-center justify-between md:justify-start gap-4 shadow-sm">
               <span className="text-xs sm:text-sm font-bold text-ink/70 truncate max-w-[180px] sm:max-w-none">{userEmail}</span>
               <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* Bi-Token Economy Radial & Progress Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Milestone Tokens Circle Progress Card */}
          <div className="bg-white p-6 rounded-[32px] border border-sage/20 shadow-md flex items-center justify-between relative overflow-hidden group">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Milestone Tokens</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display text-burgundy">{milestoneTokens.toFixed(1)}</span>
                <span className="text-sm font-bold text-ink/40">/ {tokenGoal}</span>
              </div>
              <p className="text-xs text-ink/60 leading-relaxed max-w-[170px]">
                Earned via double-blind peer reviews. 10.0 unlocks Keeper tier.
              </p>
            </div>
            
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="48" 
                  cy="48" 
                  r={radius} 
                  stroke="#EBEAE5" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <motion.circle 
                  cx="48" 
                  cy="48" 
                  r={radius} 
                  stroke="#8E3C36" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute text-[11px] font-mono font-bold text-burgundy">{tokenPercent.toFixed(0)}%</div>
            </div>
          </div>

          {/* Spendable Leaves Card */}
          <div className="bg-white p-6 rounded-[32px] border border-sage/20 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-burgundy/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
              <Coins size={80} className="text-burgundy" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Spendable Leaves</span>
              <div className="text-4xl font-display text-burgundy mt-1">{spendableLeaves} 🍃</div>
            </div>
            <p className="text-xs text-ink/60 leading-relaxed mt-4">
              Your spendable bi-token currency. Redeem at local bookstore events or donate to chapter pools.
            </p>
          </div>

          {/* Lifetime Leaves Milestone Card */}
          <div className="bg-white p-6 rounded-[32px] border border-sage/20 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-burgundy/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
              <Gift size={80} className="text-burgundy" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Lifetime Leaves</span>
              <div className="text-4xl font-display text-burgundy mt-1">{lifetimeLeaves} 🍃</div>
            </div>
            <div className="flex justify-between items-center text-xs text-ink/60 mt-4 border-t border-sage/10 pt-3">
              <span>Next gift voucher:</span>
              <span className="font-bold text-burgundy">{Math.floor(lifetimeLeaves / 500) + 1} (At {((Math.floor(lifetimeLeaves / 500) + 1) * 500)} Leaves)</span>
            </div>
          </div>
        </div>

        {/* Workspace Hub Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Writing Workspace Card */}
          <Link href="/dashboard/write" className="group">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-[32px] border border-sage/20 shadow-lg flex flex-col justify-between h-56 relative overflow-hidden group hover:border-burgundy/40 transition-all duration-300"
            >
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
                <h3 className="text-xl font-display text-burgundy group-hover:text-accent transition-colors flex items-center gap-1.5">
                  Writing Workspace <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-ink/60 mt-2 leading-relaxed">
                  Compose and save offline-capable draft submissions for the weekly prompt. Syncs seamlessly online.
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Critique Workspace Card */}
          <Link href="/dashboard/review" className="group">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-[32px] border border-sage/20 shadow-lg flex flex-col justify-between h-56 relative overflow-hidden group hover:border-burgundy/40 transition-all duration-300"
            >
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
                <h3 className="text-xl font-display text-burgundy group-hover:text-accent transition-colors flex items-center gap-1.5">
                  Critique Queue <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-ink/60 mt-2 leading-relaxed">
                  Provide detailed critiques in the double-blind queue. Earn 1.0 Milestone Token per review (1.5 for early-birds).
                </p>
              </div>
            </motion.div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Status Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-10 rounded-[32px] border border-sage/20 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5">
                <Award size={180} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-3">Membership Status</h3>
                <div className="flex flex-wrap items-end gap-4 mb-8">
                  <h2 className="text-4xl sm:text-6xl font-display text-burgundy leading-none tracking-tight">{profile.tier}</h2>
                  {isKeeper && (
                    <span className="bg-sage/10 text-sage font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest border border-sage/20 mb-1">
                      Unlocked
                    </span>
                  )}
                </div>

                {isKeeper ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-8">
                     <h4 className="font-bold text-burgundy flex items-center gap-2 mb-3"><Ticket size={18}/> Your Cipher Discount</h4>
                     <p className="text-sm text-ink/70 mb-6 leading-relaxed">
                        As a trusted member of the Archive, you have a permanent <strong>{discountPercent} discount</strong> on all purchases.
                     </p>
                     
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2 pl-4 rounded-xl border border-sage/20">
                        <span className="font-mono text-xl font-bold text-ink tracking-[0.2em] flex-1 py-2 sm:py-0">{profile.lkid}</span>
                        <button onClick={copyDiscountCode} className="bg-sage/10 hover:bg-sage/20 text-ink px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                           {copiedCode ? <CheckCircle2 size={16} className="text-sage"/> : <Copy size={16}/>}
                           {copiedCode ? "Copied" : "Copy Code"}
                        </button>
                     </div>
                     <p className="text-[10px] text-ink/40 mt-4 italic text-center sm:text-left">* Apply this code at checkout to claim your lore.</p>
                  </div>
                ) : (
                  <div className="bg-ink/5 rounded-2xl p-6 border border-sage/10">
                    <p className="text-sm text-ink/70 leading-relaxed">
                      You are currently a <strong>Reader</strong>. Upgrade to <strong>Keeper</strong> by attending events or referring friends to unlock your lifetime 5% discount and exclusive Archive access.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Achievements & Cycles */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blackbox Tracker */}
              <div className="bg-ink text-cream p-8 rounded-[32px] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <ShoppingBag size={120} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/40 mb-2">The Archive Blackbox</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-display">{orders.filter(o => o.status === 'Paid').length}</span>
                      <span className="text-xl text-cream/40 font-display">/ 10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,215,0,0.5)]" 
                        style={{ width: `${Math.min(100, (orders.filter(o => o.status === 'Paid').length / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-cream/60 leading-relaxed uppercase tracking-wider">
                    {orders.filter(o => o.status === 'Paid').length >= 10 
                      ? "Blackbox Unlocked. Consult the Lore Keeper." 
                      : `${10 - orders.filter(o => o.status === 'Paid').length} more paid orders until Blackbox.`}
                  </p>
                </div>
              </div>

              {/* Lore Cycle Timer / Upgrade Info */}
              <div className="bg-white p-8 rounded-[32px] border border-sage/20 shadow-xl flex flex-col justify-between relative overflow-hidden">
                {!isKeeper ? (
                  <>
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-2">Status Potential</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-sage/5 text-sage p-2 rounded-xl">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-ink">Reader Status</p>
                          <p className="text-[10px] font-bold text-sage uppercase tracking-widest">Awaiting Upgrade</p>
                        </div>
                      </div>
                      <p className="text-xs text-ink/60 leading-relaxed mb-6">
                        Reach 6 events or 5 referrals to become a **Keeper**. Your 90-day Lore Cycle begins at upgrade.
                      </p>
                    </div>
                    {(profile.events >= eventsNeeded || profile.referrals >= referralsNeeded) && (
                      <div className="bg-burgundy text-cream p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Threshold Met!</p>
                        <p className="text-xs font-medium">Your status will update in the next Ledger sync.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-2">Current Lore Cycle</h3>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-burgundy/5 text-burgundy p-2 rounded-xl">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-ink">90-Day Season</p>
                          <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Resets Status & Points</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-display text-burgundy">
                          {profile.cycleExpiry ? Math.max(0, Math.ceil((new Date(profile.cycleExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : '90'} Days
                        </span>
                        <span className="text-[10px] font-bold text-ink/40 uppercase mb-1">Remaining</span>
                      </div>
                      <div className="w-full bg-sage/10 rounded-full h-1.5 mb-6 overflow-hidden">
                        <div 
                          className="bg-burgundy h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, ( (profile.cycleExpiry ? Math.ceil((new Date(profile.cycleExpiry) - new Date()) / (1000 * 60 * 60 * 24)) : 90) / 90 ) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                      <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest mb-1">Refuel Bonus</p>
                      <p className="text-[10px] text-ink/60 leading-relaxed italic">
                        Earn status points again before the cycle ends to add **+60 Days** to your season!
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Recommendations Section */}
            {recommendations && recommendations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-display text-burgundy">Curated for Your Archive</h3>
                  <Link href="/bookstore" className="text-xs font-bold text-accent hover:text-burgundy flex items-center gap-1 transition-colors">
                    Explore Full Store <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                  {recommendations.map((book) => (
                    <Link key={book.id} href={`/bookstore?search=${encodeURIComponent(book.title)}`} className="min-w-[160px] w-[160px] group">
                      <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg border border-sage/10 mb-3 bg-white relative">
                        <img src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-cream text-burgundy p-2 rounded-full shadow-lg">
                            <ShoppingBag size={20} />
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-sage/20 shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><Ticket size={16} className="text-sage"/> Event Points</h3>
                    <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-wider font-medium">Physical: 2 • Virtual: 1</p>
                  </div>
                  <span className="font-display text-3xl text-burgundy">{profile.events}</span>
                </div>
                
                <div className="w-full bg-sage/10 rounded-full h-3 mb-3 overflow-hidden border border-sage/5">
                  <div className="bg-sage h-3 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${eventsProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  <span>{eventsProgress.toFixed(0)}% Complete</span>
                  <span>{profile.events}/{eventsNeeded}</span>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-sage/20 shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><Users size={16} className="text-accent"/> Referrals</h3>
                    <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-wider font-medium">Invite the collective</p>
                  </div>
                  <span className="font-display text-3xl text-burgundy">{profile.referrals}</span>
                </div>
                
                <div className="w-full bg-primary/10 rounded-full h-3 mb-3 overflow-hidden border border-primary/5">
                  <div className="bg-accent h-3 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${referralsProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  <span>{referralsProgress.toFixed(0)}% Complete</span>
                  <span>{profile.referrals}/{referralsNeeded}</span>
                </div>
              </div>

            </motion.div>

            {/* My Archive Orders Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 sm:p-10 rounded-[32px] border border-sage/20 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display text-burgundy">My Archive Orders</h3>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-sage/5 rounded-2xl border border-sage/10 group hover:border-burgundy/20 transition-all">
                      <div>
                        <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">{order.orderId} · {new Date(order.date).toLocaleDateString()}</div>
                        <h4 className="font-bold text-ink text-sm mb-1">{order.items}</h4>
                        <p className="text-xs text-burgundy font-bold">₦{order.total}</p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-burgundy/10 text-burgundy'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-cream/50 rounded-2xl border border-dashed border-sage/30">
                  <p className="text-ink/40 font-quote italic">Your personal archive history is currently empty.</p>
                  <Link href="/bookstore" className="inline-block mt-4 text-xs font-bold text-burgundy underline uppercase tracking-widest">Browse Bookstore</Link>
                </div>
              )}
            </motion.div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Pay It Forward Chapter Pool Gifting Widget */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="bg-white p-8 rounded-[32px] border border-sage/20 shadow-lg relative overflow-hidden"
            >
              <h3 className="font-bold text-ink mb-2 uppercase tracking-[0.2em] text-[10px]">Pay It Forward</h3>
              <h4 className="font-display text-xl text-burgundy mb-4">Chapter Book Pool</h4>

              {poolLoading ? (
                <div className="py-8 text-center text-xs text-ink/40 font-medium">Loading chapter pool data...</div>
              ) : !chapterPool ? (
                <div className="bg-sage/5 border border-sage/10 rounded-2xl p-4 text-xs text-ink/60 leading-relaxed italic">
                  To contribute to a chapter pool, please ensure you are registered to a specific chapter (Zaria, Kaduna, or Abuja).
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-sage/5 border border-sage/15 rounded-2xl p-4">
                    <div className="flex justify-between items-center text-xs font-bold text-ink/70 mb-2">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-sage" /> {chapterPool.chapter_name}</span>
                      <span>{poolBalance} / {poolLimit} Leaves</span>
                    </div>
                    
                    <div className="w-full bg-sage/15 rounded-full h-2.5 mb-2 overflow-hidden">
                      <motion.div 
                        className="bg-sage h-2.5 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${poolPercent}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <p className="text-[10px] text-ink/50 leading-relaxed">
                      At {poolLimit} leaves, the system auto-generates a book voucher to sponsor books for local chapter members.
                    </p>
                  </div>

                  <form onSubmit={handleDonate} className="space-y-3">
                    <div className="flex items-stretch gap-2">
                      <input 
                        type="number" 
                        placeholder="Leaves to donate..." 
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        min="1"
                        max={spendableLeaves}
                        disabled={donateLoading}
                        className="flex-1 bg-cream/70 border border-sage/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sage placeholder-ink/30 font-medium text-ink"
                      />
                      <button 
                        type="submit" 
                        disabled={donateLoading || !donationAmount}
                        className="bg-sage hover:bg-sage/90 text-cream px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
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
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-burgundy text-cream p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              <h3 className="font-display text-2xl mb-4 relative z-10">Invite the Collective</h3>
              <p className="text-sm text-cream/70 mb-8 leading-relaxed relative z-10">
                Share your personal link. Earn 1.2 Milestone Tokens & 12 Paper Leaves for each of your first 5 referrals.
              </p>
              <button 
                onClick={copyRefLink}
                className="w-full bg-cream text-burgundy py-4 rounded-2xl font-bold hover:bg-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 relative z-10"
              >
                {copied ? <CheckCircle2 size={18} className="text-sage"/> : <Copy size={18}/>}
                {copied ? "Link Copied!" : "Copy Referral Link"}
              </button>
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[32px] border border-sage/20 shadow-lg">
              <h3 className="font-bold text-ink mb-6 uppercase tracking-[0.2em] text-[10px] border-b border-sage/10 pb-3">Quick Navigation</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/bookstore" className="group text-ink/70 hover:text-accent font-bold text-sm flex items-center gap-3 transition-colors">
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <ExternalLink size={16}/>
                    </div>
                    Browse Bookstore
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="group text-ink/70 hover:text-accent font-bold text-sm flex items-center gap-3 transition-colors">
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <ExternalLink size={16}/>
                    </div>
                    Upcoming Events
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link href="/admin" className="group text-ink/70 hover:text-burgundy font-bold text-sm flex items-center gap-3 transition-colors">
                      <div className="p-2 bg-burgundy/5 rounded-lg group-hover:bg-burgundy/10 transition-colors">
                        <Settings size={16} className="text-burgundy"/>
                      </div>
                      Admin Panel Control
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>

          </div>
        </div>
      </div>
    </main>
  );
}
