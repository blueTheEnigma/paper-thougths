"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, User, Mail, MapPin, Send, CheckCircle2, 
  Loader2, Sparkles, ShieldCheck, 
  Copy, Share2, Award, Zap, Heart, Gift
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa6';
import confetti from 'canvas-confetti';

function JoinFormContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [assignedId, setAssignedId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Priority: URL parameter > Manual input (handled in form)
    const ref = searchParams.get('ref');
    if (ref) setReferredBy(ref);
  }, [searchParams]);

  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const instagram = formData.get('instagram');

    if (!instagram && !email) {
      setError("Please provide either an Instagram handle or an Email address so we can reach you.");
      setIsSubmitting(false);
      return;
    }
    
    // Priority: URL referredBy > Manual input
    const finalReferral = referredBy || formData.get('manualReferral');

    const data = {
      fullName: formData.get('fullName'),
      instagram: instagram ? instagram.replace('@', '') : "",
      whatsapp: formData.get('whatsapp'),
      email: email || "",
      chapter: formData.get('chapter'),
      birthday: formData.get('birthday') || null,
      referral: finalReferral,
      consent: formData.get('consent') === 'on'
    };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setAssignedId(result.lkId);
        setIsSuccess(true);
        triggerConfetti();
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSuccess) {
    const refLink = `paperthoughts.org/join?ref=${assignedId}`;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 px-6"
      >
        <div className="w-24 h-24 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <CheckCircle2 size={56} className="text-sage" />
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-accent p-2 rounded-full text-white"
          >
            <Sparkles size={16} />
          </motion.div>
        </div>

        <h2 className="text-5xl font-display text-burgundy mb-4">Welcome, Reader</h2>
        <p className="text-xl text-ink/80 mb-12 font-quote italic">
          Your journey in the Archive has begun. Your official LK-ID is being transcribed into the grand ledger as we speak.
        </p>

        <div className="bg-white border-2 border-sage/20 rounded-[32px] p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Book size={120} />
          </div>
          
          <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block mb-2">Your Membership ID</span>
          <div className="text-5xl font-mono font-bold text-burgundy mb-6 tracking-tighter">
            {assignedId || "GENERATING..."}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => copyToClipboard(assignedId)}
              className="flex items-center justify-center gap-2 bg-cream py-3 px-6 rounded-xl font-bold text-ink hover:bg-sage/10 transition-colors border border-sage/20"
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copied ? "ID Copied" : "Copy ID"}
            </button>
            <button 
              onClick={() => copyToClipboard(refLink)}
              className="flex items-center justify-center gap-2 bg-ink text-cream py-3 px-6 rounded-xl font-bold hover:bg-ink/90 transition-colors"
            >
              <Share2 size={18} /> Share Referral Link
            </button>
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl p-6 text-left border border-primary/20">
          <h4 className="font-bold text-burgundy mb-2 flex items-center gap-2">
            <Zap size={18} /> Next Step: Become a Keeper
          </h4>
          <p className="text-sm text-ink/70">
            You are now a **Reader**. Invite 5 friends using your link above to unlock the **Keeper** tier and get your 10% lifetime Cipher discount.
          </p>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="mt-12 text-ink/40 font-bold uppercase tracking-widest text-xs hover:text-burgundy transition-colors"
        >
          Return to Library
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      
      {/* Benefits Sidebar */}
      <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
        <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[32px] border border-sage/20 sticky top-32">
          <h3 className="font-display text-2xl text-burgundy mb-6">Archive Tiers</h3>
          
          <div className="space-y-6">
            <div className="relative pl-8 border-l-2 border-sage/30 pb-4">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-sage rounded-full border-4 border-cream"></div>
              <h4 className="font-bold text-ink flex items-center gap-2">Reader <span className="text-[10px] bg-sage/20 text-sage px-2 py-0.5 rounded-full uppercase">Current</span></h4>
              <p className="text-xs text-ink/60 mt-1">Free entry. LK-ID assigned. WhatsApp community access.</p>
            </div>
            
            <div className="relative pl-8 border-l-2 border-sage/30 pb-4">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-cream rounded-full border-2 border-sage/30"></div>
              <h4 className="font-bold text-ink/40 flex items-center gap-2 italic">Keeper</h4>
              <p className="text-xs text-ink/40 mt-1">Earned via 5 referrals. 10% Cipher discount. Early stock access.</p>
            </div>

            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-cream rounded-full border-2 border-sage/30"></div>
              <h4 className="font-bold text-ink/40 flex items-center gap-2 italic">Lore Keeper</h4>
              <p className="text-xs text-ink/40 mt-1">Appointed elite. 15% discount. Referral commissions.</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-sage/10">
            <div className="flex items-center gap-3 text-accent mb-4">
              <Heart size={18} fill="currentColor" />
              <span className="font-bold text-sm">Become a Patron</span>
            </div>
            <p className="text-xs text-ink/60 leading-relaxed">
              Donate ₦1,000+ to support the Archive and get your name on the permanent Patron Wall.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8 bg-white p-8 md:p-12 rounded-[40px] border border-sage/20 shadow-xl relative overflow-hidden order-1 lg:order-2"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-sage" size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Secure Registration</span>
          </div>
          
          {searchParams.get('message') === 'please_register' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border-l-4 border-accent p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm"
            >
              <div className="text-2xl mt-0.5">🏰</div>
              <div className="space-y-1">
                <h4 className="font-bold text-burgundy text-sm">Writers' Village Gate Secured</h4>
                <p className="text-xs text-ink/80 leading-relaxed font-sans font-medium">
                  Welcome, traveler! Entering the Writers' Village requires an official LK-ID first. Please take a moment to register below so we can write your name into the grand ledger and secure your LK-ID.
                </p>
              </div>
            </motion.div>
          )}

          <h2 className="text-5xl font-display text-burgundy mb-4">Join the Collective</h2>
          <p className="text-ink/60 mb-10 text-lg font-quote italic">
            A home for the keepers of stories, the builders of libraries, and the seekers of lore.
          </p>

          {referredBy && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-primary/10 p-4 rounded-2xl flex items-center gap-3 mb-8 border border-primary/20"
            >
              <Award className="text-accent" size={20} />
              <p className="text-sm font-bold text-accent">
                Invited by: <span className="font-mono bg-white/50 px-2 py-0.5 rounded ml-1">{referredBy}</span>
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <User size={14} className="text-primary" /> Full Name
              </label>
              <input 
                type="text" 
                name="fullName" 
                required 
                placeholder="First and Last name"
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <FaInstagram size={14} className="text-primary" /> Instagram Handle
              </label>
              <input 
                type="text" 
                name="instagram" 
                placeholder="@username"
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <Send size={14} className="text-primary" /> WhatsApp Number
              </label>
              <input 
                type="tel" 
                name="whatsapp" 
                required
                placeholder="+234..."
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <Mail size={14} className="text-primary" /> Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                placeholder="Optional (for account access)"
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Chapter
              </label>
              <select 
                name="chapter" 
                required
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg font-bold appearance-none cursor-pointer"
              >
                <option value="Zaria (ABU)">Zaria (ABU)</option>
                <option value="Kaduna">Kaduna</option>
                <option value="Abuja">Abuja</option>
                <option value="Other">Other / Remote</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <Gift size={14} className="text-primary" /> Date of Birth
              </label>
              <input 
                type="date" 
                name="birthday" 
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg text-ink cursor-pointer"
              />
              <span className="text-[10px] text-ink/50 block mt-1">
                Share your birthday so we can celebrate you! 🎂
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <Award size={14} className="text-primary" /> Referral Code
              </label>
              <input 
                type="text" 
                name="manualReferral" 
                placeholder="Optional"
                disabled={!!referredBy}
                defaultValue={referredBy}
                className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-lg disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="consent" 
                  required
                  className="mt-1 w-4 h-4 rounded border-sage/40 text-burgundy focus:ring-burgundy" 
                />
                <span className="text-xs text-ink/60 leading-relaxed group-hover:text-ink transition-colors">
                  I agree to join the Collective and receive the Weekly Scroll via WhatsApp/Email. My data is handled under NDPR obligations.
                </span>
              </label>
            </div>

            <div className="md:col-span-2 pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-burgundy text-white font-bold py-6 px-10 rounded-full hover:bg-ink transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Transcribing Lore...
                  </>
                ) : (
                  "Initiate Registration"
                )}
              </button>
              {error && <p className="text-red-500 text-center mt-4 font-bold text-sm">{error}</p>}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-cream selection:bg-primary/30">
      <div className="max-w-6xl mx-auto px-6 py-32">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
          <JoinFormContent />
        </Suspense>
      </div>
    </main>
  );
}
