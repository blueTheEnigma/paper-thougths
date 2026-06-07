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
import FeedbackDashboard from '@/components/FeedbackDashboard';
import PanguinAvatar from '@/components/PanguinAvatar';
import OnboardingSequence from '@/components/OnboardingSequence';
import { getAvatarStage } from '@/lib/avatar';

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
              className="w-full bg-[#1b0610]/80 border border-sage/20 rounded-[28px] p-5 sm:p-7 text-left space-y-5 mb-8 shadow-xl max-w-2xl animate-pulse-subtle"
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
                  <p className="text-[11px] sm:text-xs text-cream/90 font-serif leading-relaxed">
                    Power your journey to unlock the <strong>Keeper</strong> tier ({discountPercent} discount on all books for 90 days). Earn tokens by completing activities:
                  </p>
                  <ul className="text-[10px] sm:text-[11px] text-cream/85 font-serif list-disc pl-4 space-y-1.5">
                    <li><strong>Peer Critique</strong>: Submit detailed reviews (<strong>+1.0 Token</strong>, or <strong>+1.5 Tokens</strong> for early-birds).</li>
                    <li><strong>Weekly Submission</strong>: Write weekly prompt responses (<strong>+1.0 Token</strong>).</li>
                    <li><strong>Invite Readers</strong>: Refer friends (<strong>+1.2 Tokens</strong> per referral, up to your first 5).</li>
                  </ul>
                </div>

                {/* Spendable Leaves Column */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#FF8D5C] flex items-center gap-1.5 font-sans">
                    <Coins size={14} /> Paper Leaves (Save to Buy)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-cream/90 font-serif leading-relaxed font-semibold" style={{ color: '#F2A98A' }}>
                    1 Leaf = ₦10 at checkout. Spend leaves to buy physical books!
                  </p>
                  <p className="text-[11px] sm:text-xs text-cream/80 font-serif leading-relaxed">
                    Accumulate leaves to discount or fully buy books. Grow your balance by:
                  </p>
                  <ul className="text-[10px] sm:text-[11px] text-cream/85 font-serif list-disc pl-4 space-y-1.5">
                    <li><strong>Peer Critique</strong>: Earn leaves per critique (<strong>+10 Leaves</strong>, or <strong>+15 Leaves</strong> for early-birds, capped at 3 reviews/week).</li>
                    <li><strong>Weekly Submission</strong>: Respond to weekly writing prompts (<strong>+5 Leaves</strong> for your first submission of the week).</li>
                    <li><strong>Buy Bundles</strong>: Purchase bundles of leaves (e.g. 50, 100, 200, or 500 leaves) directly from your dashboard using Paystack.</li>
                    <li><strong>Chapter Pool</strong>: Share the love by donating to your chapter's book pool to fund vouchers for your community.</li>
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

export default function DashboardClient({ profile, initialOrders, submissions = [], recommendations, userEmail, paystackPublicKey, activeLeaderboard }) {
  const [orders] = useState(initialOrders || []);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // Tab state: 'overview', 'workspaces', 'ledger', 'honors'
  
  // Local States for Bi-token economy
  const [spendableLeaves, setSpendableLeaves] = useState(profile?.spendableLeaves || 0);
  const [milestoneTokens, setMilestoneTokens] = useState(profile?.milestoneTokens || 0);
  const [lifetimeLeaves, setLifetimeLeaves] = useState(profile?.lifetimeLeaves || 0);
  const [bookVouchersGifted, setBookVouchersGifted] = useState(profile?.bookVouchersGifted || 0);
  
  // States for leaf purchases & transactions history
  const [showBuyLeavesModal, setShowBuyLeavesModal] = useState(false);
  const [isBuyingLeaves, setIsBuyingLeaves] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Chapter Pool States
  const [chapterPool, setChapterPool] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateMessage, setDonateMessage] = useState(null);
  const [poolLoading, setPoolLoading] = useState(true);

  // Milestone Celebration Overlay
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolvedStage, setEvolvedStage] = useState(null);

  // Birthday banner dismissal
  const [bdayDismissed, setBdayDismissed] = useState(true);
  const [showPortal, setShowPortal] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load transaction history ledger from local DB
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const res = await fetch('/api/leaves/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchTransactions();
    }
  }, [mounted]);

  // Load Paystack Inline script on client mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('dismissed_birthday') === 'true';
      setBdayDismissed(dismissed);
      const seen = sessionStorage.getItem('seen_dashboard_portal') === 'true';
      
      // Onboarding logic:
      if (profile && profile.onboarded === false) {
        setShowOnboarding(true);
        setShowPortal(false); // Hide standard portal until onboarding finishes
      } else {
        setShowPortal(!seen);
      }

      if (!document.getElementById('paystack-inline-js')) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v2/inline.js';
        script.async = true;
        script.id = 'paystack-inline-js';
        document.body.appendChild(script);
      }
    }
  }, [profile]);

  // Purchase Leaves inline payment with Paystack
  const handlePurchaseLeaves = async (leavesAmount, priceAmount) => {
    if (isBuyingLeaves) return;

    const paystackKey = paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) {
      alert("Paystack is not configured on the client.");
      return;
    }

    if (typeof window === 'undefined' || !window.PaystackPop) {
      alert("Paystack script is still loading. Please try again in a few seconds.");
      return;
    }

    setIsBuyingLeaves(true);

    try {
      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: paystackKey,
        email: userEmail || profile?.email || 'member@paperthoughts.org',
        amount: priceAmount * 100, // NGN in kobo
        currency: 'NGN',
        ref: 'PL-' + Math.floor((Math.random() * 1000000000) + 1),
        onSuccess: async (transaction) => {
          try {
            const verifyRes = await fetch('/api/leaves/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: transaction.reference,
                bundleAmount: leavesAmount,
                price: priceAmount
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setSpendableLeaves(verifyData.spendableLeaves);
              setLifetimeLeaves(prev => prev + leavesAmount);
              
              // Trigger confetti celebration
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });

              alert(`Success! You have purchased ${leavesAmount} leaves.`);
              setShowBuyLeavesModal(false);
              
              // Refetch transactions ledger list
              fetchTransactions();
            } else {
              alert(verifyData.error || 'Failed to verify transaction. Please contact support.');
            }
          } catch (e) {
            console.error('Failed to verify leaf purchase', e);
            alert('A connection error occurred during verification. Reference: ' + transaction.reference);
          } finally {
            setIsBuyingLeaves(false);
          }
        },
        onCancel: () => {
          setIsBuyingLeaves(false);
        },
        onError: (error) => {
          console.error('Paystack transaction error:', error);
          setIsBuyingLeaves(false);
          alert('An error occurred during payment. Please try again.');
        }
      });
    } catch (err) {
      console.error('Paystack initialization error:', err);
      setIsBuyingLeaves(false);
      alert('Failed to initialize checkout. Please try again.');
    }
  };

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false);
    
    // Once onboarding finishes, they should see the rules portal if they haven't seen it in this session
    const seen = sessionStorage.getItem('seen_dashboard_portal') === 'true';
    if (!seen) {
      setShowPortal(true);
    }

    try {
      await fetch('/api/me/onboard', { method: 'POST' });
    } catch (e) {
      console.error("Failed to save onboarding state", e);
    }
  };

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

    // 4. Panguin Evolution Celebration check
    if (profile?.lifetimeLeaves >= 0) {
      const currentStageObj = getAvatarStage(profile.lifetimeLeaves);
      const storageKey = `panguin_stage_${profile.id}`;
      const savedStage = localStorage.getItem(storageKey);
      
      if (savedStage && savedStage !== currentStageObj.name) {
        // Find if they moved up
        const isLevelUp = currentStageObj.stageIndex > parseInt(localStorage.getItem(`${storageKey}_idx`) || -1);
        if (isLevelUp) {
          setTimeout(() => {
            setEvolvedStage(currentStageObj);
            setShowEvolutionModal(true);
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#F2A98A', '#5C1A2E', '#8F9B82']
            });
          }, 2000);
        }
      }
      localStorage.setItem(storageKey, currentStageObj.name);
      localStorage.setItem(`${storageKey}_idx`, currentStageObj.stageIndex);
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
        fetchTransactions(); // Refresh transactions ledger history!
        
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
    <main className="min-h-screen bg-cream pt-4 pb-20 px-4 md:px-8 relative overflow-hidden">
      
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

      {/* Panguin Evolution Modal Celebration */}
      <AnimatePresence>
        {showEvolutionModal && evolvedStage && (
          <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white max-w-lg w-full p-8 rounded-[32px] border border-sage/20 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent via-burgundy to-accent"></div>
              
              <div className="mx-auto mb-6 flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-sage/30 shadow-lg relative animate-float">
                  <img src={evolvedStage.image} alt={evolvedStage.name} className="w-full h-full object-cover" />
                </div>
              </div>
              
              <h2 className="text-3xl font-display text-burgundy font-bold mb-2">Panguin Evolved!</h2>
              <h3 className="text-lg font-bold text-accent mb-4">You are now a {evolvedStage.name}</h3>
              
              <p className="text-sm text-ink/70 leading-relaxed mb-6 font-serif">
                {evolvedStage.description}. 
                <br/><br/>
                Your continued contributions to the Archive have caused your panguin to grow! Keep writing, reviewing, and participating to discover its next form.
              </p>

              <button 
                onClick={() => setShowEvolutionModal(false)}
                className="w-full bg-burgundy hover:bg-ink text-cream py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Amazing!
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
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 pb-8 border-b border-sage/10">
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            <PanguinAvatar lifetimeLeaves={lifetimeLeaves} variant="full" />
            <div>
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
                    <Link href="/admin" className="bg-[#5C1A2E]/10 hover:bg-[#5C1A2E]/20 text-[#5C1A2E] font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-[#5C1A2E]/20 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer">
                      <ShieldCheck size={12}/> Admin Panel
                    </Link>
                  </>
                )}
                {profile?.isCrewMember && (
                  <>
                    <span className="text-ink/30">•</span>
                    <Link href="/round-table" className="bg-sage/15 hover:bg-sage/20 text-sage font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-sage/20 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer">
                      <BookOpen size={12}/> Crew CRM
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-auto flex flex-wrap items-center justify-start sm:justify-between lg:justify-end gap-2.5">
            {isAdmin && (
              <Link href="/admin" className="bg-[#5C1A2E]/10 hover:bg-[#5C1A2E]/15 text-[#5C1A2E] px-4 py-2.5 rounded-2xl border border-[#5C1A2E]/20 transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer">
                <Settings size={14}/>
                <span>Admin Panel</span>
              </Link>
            )}
            {profile?.isCrewMember && (
              <Link href="/round-table" className="bg-sage/10 hover:bg-sage/15 text-sage px-4 py-2.5 rounded-2xl border border-sage/20 transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer">
                <BookOpen size={14}/>
                <span>Crew CRM</span>
              </Link>
            )}
            <div className="bg-white/50 backdrop-blur-sm border border-sage/15 py-2 px-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
               <span className="text-xs font-bold text-ink/70 truncate max-w-[140px] sm:max-w-none">{userEmail}</span>
               <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </motion.div>

        {selectedReportId ? (
          <FeedbackDashboard 
            submissionId={selectedReportId} 
            onClose={() => setSelectedReportId(null)} 
          />
        ) : (
          <div className="space-y-8">
            {/* Tab Selection Navigation */}
            <div className="flex border-b border-sage/15 gap-4 sm:gap-8 overflow-x-auto scrollbar-hide flex-nowrap pb-px">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-xs sm:text-sm font-sans font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex-shrink-0 ${
                  activeTab === 'overview' ? 'text-burgundy' : 'text-ink/40 hover:text-ink/75'
                }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <motion.div layoutId="dashboard-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-burgundy" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('workspaces')}
                className={`pb-3 text-xs sm:text-sm font-sans font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'workspaces' ? 'text-burgundy' : 'text-ink/40 hover:text-ink/75'
                }`}
              >
                <BookOpen size={16} className={activeTab === 'workspaces' ? 'text-burgundy' : 'text-ink/40'} />
                Workspaces
                {activeTab === 'workspaces' && (
                  <motion.div layoutId="dashboard-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-burgundy" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className={`pb-3 text-xs sm:text-sm font-sans font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'ledger' ? 'text-burgundy' : 'text-ink/40 hover:text-ink/75'
                }`}
              >
                <Coins size={16} className={activeTab === 'ledger' ? 'text-burgundy' : 'text-ink/40'} />
                Ledger & Pool
                {activeTab === 'ledger' && (
                  <motion.div layoutId="dashboard-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-burgundy" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('honors')}
                className={`pb-3 text-xs sm:text-sm font-sans font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'honors' ? 'text-burgundy' : 'text-ink/40 hover:text-ink/75'
                }`}
              >
                <Award size={16} className={activeTab === 'honors' ? 'text-burgundy' : 'text-ink/40'} />
                Clubhouse Honors
                {activeTab === 'honors' && (
                  <motion.div layoutId="dashboard-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-burgundy" />
                )}
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
                  {/* Left Column (Stats & Economy Guide) */}
                  <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    
                    {/* User Stats Grid (Membership, Milestone Tokens, Spendable Leaves, Streak if active) */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${profile.streak > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
                      {/* Membership Status Card */}
                      <div className="parchment-card p-5 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
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
                      <div className="parchment-card p-5 sm:p-8 flex items-center justify-between relative group min-h-[220px]">
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
                      <div className="parchment-card p-5 sm:p-8 relative overflow-hidden flex flex-col justify-between group min-h-[220px]">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform pointer-events-none">
                          <Coins size={60} className="text-burgundy" />
                        </div>
                        <div className="relative z-10 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Spendable Leaves</span>
                              <div className="text-4xl font-display text-burgundy font-extrabold mt-1">{spendableLeaves} <span className="text-2xl">🍃</span></div>
                            </div>
                            <button
                              onClick={() => setShowBuyLeavesModal(true)}
                              className="bg-burgundy text-cream text-[10px] font-sans font-bold px-3 py-1.5 rounded-lg hover:bg-ink transition-colors uppercase tracking-wider mt-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                              Buy Leaves
                            </button>
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

                      {/* Streak Card */}
                      {profile.streak > 0 && (
                        <div className="parchment-card p-5 sm:p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                            <Flame size={80} className="text-burgundy" />
                          </div>
                          <div className="relative z-10 space-y-4">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Writing Streak</span>
                            <div className="flex items-baseline gap-2 mt-1">
                              <h2 className="text-4xl font-display font-extrabold text-burgundy leading-none tracking-tight">
                                {profile.streak} <span className="text-2xl">🔥</span>
                              </h2>
                            </div>
                            <p className="text-xs text-ink/60 leading-relaxed font-serif font-medium">
                              Amazing! You've kept your streak active for {profile.streak} consecutive week{profile.streak > 1 ? 's' : ''}.
                            </p>
                          </div>
                          <div className="relative z-10 border-t border-sage/10 pt-3 flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-ink/40">
                            <span>Status: Active</span>
                            <span className="text-sage">Keep it up!</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Trackers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="parchment-card p-5 sm:p-8">
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

                      <div className="parchment-card p-5 sm:p-8">
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
                    </div>

                    {/* Archive Economy Guide */}
                    <div className="parchment-card p-5 sm:p-8 flex flex-col justify-between min-h-[220px]">
                      <div className="relative z-10 space-y-4">
                        <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Archive Economy Guide</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              <Coins size={14} className="text-sage" /> Paper Leaves (Save to Buy)
                            </h4>
                            <p className="text-xs text-ink/85 leading-relaxed font-serif font-semibold text-accent font-sans">
                              1 Leaf = ₦10 at checkout. Spend leaves to buy physical books!
                            </p>
                            <p className="text-xs text-ink/85 leading-relaxed font-serif font-medium">
                              Your spendable currency to discount or fully buy physical books. Accumulate leaves by:
                            </p>
                            <ul className="text-xs text-ink/80 font-serif list-disc pl-4 space-y-1.5">
                              <li><strong>Peer Critique</strong>: Earn <strong>+10 Leaves</strong> (or <strong>+15 Leaves</strong> for early-birds), capped at 3 rewarded critiques per week.</li>
                              <li><strong>Weekly Submission</strong>: Earn <strong>+5 Leaves</strong> for your first prompt submission of the week.</li>
                              <li><strong>Buy Bundles</strong>: Buy leaf bundles (50, 100, 200, or 500 leaves) instantly via Paystack.</li>
                            </ul>
                            <p className="text-[11px] text-ink/70 font-serif italic mt-2">
                              You can also donate leaves to your <strong>Chapter Book Pool</strong> to generate book vouchers for chapter events!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Sidebar Right Column */}
                  <div className="space-y-6">
                    {/* Referral Widget */}
                    <div className="bg-burgundy text-cream p-5 sm:p-8 rounded-[24px] shadow-xl relative overflow-hidden group border border-white/5">
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
                    </div>

                    {/* Quick Links */}
                    <div className="parchment-card p-5 sm:p-8">
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
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Workspaces Tab Content */}
            {activeTab === 'workspaces' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
                  {/* Left Column (Writing and Critique Workspaces) */}
                  <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Writing Workspace Card */}
                      <Link href="/dashboard/write" className="group">
                        <div className="parchment-card p-5 sm:p-8 flex flex-col justify-between h-56 relative group transition-all duration-300">
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
                        <div className="parchment-card p-5 sm:p-8 flex flex-col justify-between h-56 relative group transition-all duration-300">
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
                    </div>
                  </div>

                  {/* Sidebar Right Column */}
                  <div className="space-y-6">
                    {/* My Manuscript Reports */}
                    {submissions && submissions.length > 0 ? (
                      <div className="parchment-card p-5 sm:p-8">
                        <h3 className="font-bold text-ink mb-4 uppercase tracking-[0.2em] text-[10px] border-b border-sage/10 pb-3">My Manuscript Reports</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {submissions.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                if (sub.hasReport) {
                                  setSelectedReportId(sub.id);
                                }
                              }}
                              disabled={!sub.hasReport}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                                sub.hasReport 
                                  ? 'border-sage/15 bg-white/40 hover:border-burgundy/25 hover:bg-white cursor-pointer' 
                                  : 'border-sage/5 bg-sage/5 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="font-bold text-ink truncate">{sub.title}</div>
                              <div className="flex justify-between items-center text-[10px] text-ink/40 font-mono">
                                <span className="capitalize">{sub.genre}</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${
                                  sub.hasReport ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-ink/5 text-ink/45 border border-ink/10'
                                }`}>
                                  {sub.hasReport ? 'Report Ready' : 'Pending Synthesis'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="parchment-card p-5 sm:p-8">
                        <h3 className="font-bold text-ink mb-4 uppercase tracking-[0.2em] text-[10px] border-b border-sage/10 pb-3">My Manuscript Reports</h3>
                        <div className="py-6 text-center bg-cream/35 rounded-2xl border border-dashed border-sage/30">
                          <p className="text-xs text-ink/40 font-serif italic">No submissions or feedback reports yet.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ledger & Pool Tab Content */}
            {activeTab === 'ledger' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
                  {/* Left Column (Recommendations, Ledger, Orders) */}
                  <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    
                    {/* Curated Bookstore Recommendations */}
                    {recommendations && recommendations.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-xl font-display font-extrabold text-burgundy">Curated for Your Archive</h3>
                          <Link href="/bookstore" className="text-xs font-bold text-accent hover:text-burgundy flex items-center gap-1 transition-colors">
                            Explore Full Store <ArrowRight size={14} />
                          </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                          {recommendations.map((book) => (
                            <Link key={book.id} href={`/bookstore?search=${encodeURIComponent(book.title)}`} className="min-w-[140px] w-[140px] group block flex-shrink-0">
                              <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md border border-sage/10 mb-2.5 bg-white relative">
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
                      </div>
                    )}

                    {/* Leaves Ledger Card */}
                    <div className="parchment-card p-5 sm:p-8 md:p-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-burgundy">Leaves Ledger</h3>
                        <span className="text-[10px] font-sans font-bold text-ink/40 uppercase tracking-widest">Transaction History</span>
                      </div>

                      {transactionsLoading ? (
                        <div className="py-8 text-center text-xs text-ink/40 font-medium font-serif italic">Loading transactions...</div>
                      ) : transactions.length > 0 ? (
                        <div className="space-y-4">
                          {transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-4 bg-sage/5 rounded-2xl border border-sage/10 group hover:border-burgundy/25 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm ${
                                  tx.amount > 0 ? 'bg-green-50 text-green-700' : 'bg-burgundy/5 text-burgundy'
                                }`}>
                                  {tx.amount > 0 ? '🍃' : '💸'}
                                </div>
                                <div>
                                  <div className="text-[9px] font-mono text-ink/45 uppercase tracking-wider mb-0.5">
                                    {new Date(tx.date).toLocaleDateString()} · {tx.type.replace('_', ' ')}
                                  </div>
                                  <p className="text-xs text-ink/85 leading-relaxed font-serif">{tx.description}</p>
                                </div>
                              </div>
                              <span className={`font-mono text-xs font-bold ${
                                tx.amount > 0 ? 'text-green-700' : 'text-burgundy'
                              }`}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🍃
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center bg-cream/35 rounded-2xl border border-dashed border-sage/30">
                          <p className="text-ink/40 font-serif italic">No leaf transactions recorded yet.</p>
                          <p className="text-[10px] text-ink/50 mt-1 max-w-sm mx-auto font-serif">Earn leaves by reviewing prompt submissions or writing critiques.</p>
                        </div>
                      )}
                    </div>

                    {/* Bookstore Orders history */}
                    <div className="parchment-card p-5 sm:p-8 md:p-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-burgundy">My Archive Orders</h3>
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
                    </div>

                  </div>

                  {/* Sidebar Right Column */}
                  <div className="space-y-6">
                    {/* Chapter Pool Gifting Widget */}
                    <div className="glass-counter p-5 sm:p-8 rounded-[24px] shadow-lg relative overflow-hidden">
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
                    </div>

                    {/* Blackbox Tracker */}
                    <div className="bg-ink text-cream p-5 sm:p-8 rounded-[24px] shadow-xl relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform pointer-events-none">
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
                  </div>
                </div>
              </motion.div>
            )}

            {/* Honors Tab Content */}
            {activeTab === 'honors' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Header card */}
                <div 
                  className="parchment-card p-5 sm:p-8 md:p-10 relative overflow-hidden border border-accent/20 rounded-[32px] shadow-md text-center max-w-4xl mx-auto"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(242,169,138,0.08) 0%, rgba(250,247,242,1) 90%)' }}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 animate-pulse-subtle">
                    <Award size={180} className="text-burgundy" />
                  </div>
                  <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-accent">Clubhouse Ledger</span>
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-burgundy">
                      {activeLeaderboard ? `🏆 The Clubhouse Honors: ${activeLeaderboard.monthYear}` : '🏆 Clubhouse Honors'}
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/75 font-serif leading-relaxed">
                      Every month, we celebrate the members who read with depth, write with passion, and support the community. Here are the crowned laureles for this cycle.
                    </p>
                  </div>
                </div>

                {!activeLeaderboard ? (
                  <div className="py-20 text-center bg-white/50 backdrop-blur-sm border border-dashed border-sage/35 rounded-[32px] max-w-xl mx-auto">
                    <Award className="opacity-25 mx-auto mb-4 text-burgundy" size={48} />
                    <p className="text-ink/50 font-serif italic">No honors have been published for this cycle yet.</p>
                    <p className="text-xs text-ink/40 mt-2 font-sans font-medium">As reviews flow in, the editors will elect and publish the leaderboard.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
                    
                    {/* General Bookie card */}
                    {activeLeaderboard.generalBookieName && (
                      <div className="bg-white border border-sage/15 p-5 sm:p-8 rounded-[32px] shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden hover:shadow-md transition-shadow">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                        <div className="space-y-4 relative z-10">
                          <span className="bg-primary/10 text-burgundy text-[9px] font-bold px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest inline-block">
                            🌍 General Bookie
                          </span>
                          <h3 className="text-2xl font-display font-bold text-burgundy">{activeLeaderboard.generalBookieName}</h3>
                          <p className="text-xs sm:text-sm text-ink/80 font-serif leading-relaxed italic font-medium">
                            "{activeLeaderboard.generalBookieText || 'First to finish and submit an in-depth review for the General Book of the Month!'}"
                          </p>
                        </div>
                        <div className="border-t border-sage/10 pt-4 flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-ink/40">
                          <span>Status: Crowned 🏆</span>
                          <span className="text-accent">+50 Leaves Bonus</span>
                        </div>
                      </div>
                    )}

                    {/* Abuja Bookie card */}
                    {activeLeaderboard.abujaBookieName && (
                      <div className="bg-white border border-sage/15 p-5 sm:p-8 rounded-[32px] shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden hover:shadow-md transition-shadow">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl"></div>
                        <div className="space-y-4 relative z-10">
                          <span className="bg-accent/15 text-accent text-[9px] font-bold px-3 py-1 rounded-full border border-accent/20 uppercase tracking-widest inline-block">
                            📍 Abuja Bookie
                          </span>
                          <h3 className="text-2xl font-display font-bold text-burgundy">{activeLeaderboard.abujaBookieName}</h3>
                          <p className="text-xs sm:text-sm text-ink/80 font-serif leading-relaxed italic font-medium">
                            "{activeLeaderboard.abujaBookieText || 'First to finish and submit an in-depth review for the Abuja Book of the Month!'}"
                          </p>
                        </div>
                        <div className="border-t border-sage/10 pt-4 flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-ink/40">
                          <span>Status: Crowned 🏆</span>
                          <span className="text-accent">+50 Leaves Bonus</span>
                        </div>
                      </div>
                    )}

                    {/* Review of the Month card */}
                    {activeLeaderboard.reviewWinnerName && (
                      <div className="bg-[#1E110A] text-cream border border-primary/20 p-5 sm:p-8 rounded-[32px] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden md:col-span-2">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-burgundy/10 rounded-full blur-2xl"></div>
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="bg-primary/10 text-primary text-[9px] font-bold px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest inline-block">
                              ✍️ Review of the Month
                            </span>
                            <Sparkles className="text-primary animate-pulse" size={16} />
                          </div>
                          <h3 className="text-2xl font-display font-bold text-cream">{activeLeaderboard.reviewWinnerName}</h3>
                          <p className="text-sm text-cream/90 font-serif leading-relaxed italic font-medium">
                            "{activeLeaderboard.reviewOfTheMonthText}"
                          </p>
                        </div>
                        <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-cream/40">
                          <span>Awarded by Editors</span>
                          <span className="text-primary">Master Critique Laureate</span>
                        </div>
                      </div>
                    )}

                    {/* Author of the Month card */}
                    {activeLeaderboard.authorWinnerName && (
                      <div className="bg-[#160B18] text-cream border border-accent/20 p-5 sm:p-8 rounded-[32px] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-2xl"></div>
                        <div className="space-y-4 relative z-10">
                          <span className="bg-accent/10 text-accent text-[9px] font-bold px-3 py-1 rounded-full border border-accent/20 uppercase tracking-widest inline-block">
                            🖋️ Author of the Month
                          </span>
                          <h3 className="text-2xl font-display font-bold text-cream">{activeLeaderboard.authorWinnerName}</h3>
                          <p className="text-xs sm:text-sm text-cream/90 font-serif leading-relaxed italic font-medium">
                            "{activeLeaderboard.authorOfTheMonthText}"
                          </p>
                        </div>
                        <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-cream/40">
                          <span>Consistent Excellence</span>
                          <span className="text-accent">Prime Writer</span>
                        </div>
                      </div>
                    )}

                    {/* Most Improved Author card */}
                    {activeLeaderboard.improvedWinnerName && (
                      <div className="bg-white border border-sage/15 p-5 sm:p-8 rounded-[32px] shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sage/5 rounded-full blur-2xl"></div>
                        <div className="space-y-4 relative z-10">
                          <span className="bg-sage/10 text-sage text-[9px] font-bold px-3 py-1 rounded-full border border-sage/20 uppercase tracking-widest inline-block">
                            📈 Most Improved Author
                          </span>
                          <h3 className="text-2xl font-display font-bold text-burgundy">{activeLeaderboard.improvedWinnerName}</h3>
                          <p className="text-xs sm:text-sm text-ink/80 font-serif leading-relaxed italic font-medium">
                            "{activeLeaderboard.mostImprovedAuthorText}"
                          </p>
                        </div>
                        <div className="border-t border-sage/10 pt-4 flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-wider text-ink/40">
                          <span>Highest Growth</span>
                          <span className="text-sage">Rising Star</span>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Onboarding & Game Rules Portals */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {showOnboarding && (
            <OnboardingSequence 
              key="onboarding-sequence"
              userName={profile.name.split(' ')[0]} 
              lkId={profile.lkid} 
              onComplete={handleCompleteOnboarding} 
            />
          )}
          {!showOnboarding && showPortal && (
            <ArchivePortal
              key="archive-portal"
              onEnter={handleEnterPortal}
              userName={profile.name}
              profile={profile}
              discountPercent={discountPercent}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Buy Leaves Modal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showBuyLeavesModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
                onClick={() => setShowBuyLeavesModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-cream rounded-3xl p-8 border border-sage/20 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setShowBuyLeavesModal(false)} 
                  className="absolute top-4 right-4 bg-white/50 backdrop-blur rounded-full p-2 hover:bg-white transition-colors z-20"
                >
                  <X size={20} className="text-ink" />
                </button>
                
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins size={24} className="text-burgundy" />
                  </div>
                  <h3 className="text-2xl font-display text-burgundy font-bold">Purchase Paper Leaves</h3>
                  <p className="text-xs text-ink/70 mt-1 max-w-md mx-auto leading-relaxed font-serif">
                    Instantly buy bundles of Paper Leaves. 1 Leaf is worth ₦10 at checkout to purchase physical books from the bookstore.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { leaves: 50, price: 500, label: "Starter Bundle" },
                    { leaves: 100, price: 1000, label: "Reader Choice" },
                    { leaves: 200, price: 2000, label: "Bookworm Pack" },
                    { leaves: 500, price: 5000, label: "Ledger Premium" }
                  ].map((bundle) => (
                    <button
                      key={bundle.leaves}
                      onClick={() => handlePurchaseLeaves(bundle.leaves, bundle.price)}
                      disabled={isBuyingLeaves}
                      className="bg-white hover:bg-sage/10 p-6 rounded-2xl border border-sage/20 text-center flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 group cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-[10px] font-sans font-bold text-accent uppercase tracking-wider">{bundle.label}</span>
                      <span className="text-3xl font-display font-extrabold text-burgundy flex items-center gap-1">
                        {bundle.leaves} <span className="text-lg">🍃</span>
                      </span>
                      <span className="text-xs font-bold text-ink/60 font-mono mt-1">₦{bundle.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>

                {isBuyingLeaves && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-burgundy mb-2 font-serif italic">
                    <div className="w-4 h-4 border-2 border-burgundy/30 border-t-burgundy rounded-full animate-spin"></div>
                    Processing transaction with Paystack...
                  </div>
                )}
                
                <button 
                  onClick={() => setShowBuyLeavesModal(false)}
                  className="w-full bg-white hover:bg-sage/10 text-ink border border-sage/30 py-3.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </main>
  );
}
