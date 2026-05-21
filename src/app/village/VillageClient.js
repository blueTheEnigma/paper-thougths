"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, PenTool, Feather, Award, ArrowRight, 
  Sparkles, Clock, Compass 
} from 'lucide-react';
import Link from 'next/link';

export default function VillageClient({ storyPrompt, poemPrompt, userStats }) {
  const [showEntrance, setShowEntrance] = useState(true);

  useEffect(() => {
    // Check if we already showed it during this session to prevent repeating
    if (sessionStorage.getItem('seen_village_intro')) {
      setShowEntrance(false);
    }
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem('seen_village_intro', 'true');
    setShowEntrance(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 90, damping: 15 }
    }
  };

  return (
    <>
      {/* 1. Dramatic Entrance Portal Animation Overlay */}
      <AnimatePresence>
        {showEntrance && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-[#120805] flex flex-col items-center justify-center text-cream px-6 text-center"
          >
            <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="max-w-md space-y-6 relative"
            >
              <div className="w-20 h-20 mx-auto rounded-full border border-primary/20 flex items-center justify-center bg-white/5 animate-pulse-subtle">
                <BookOpen className="text-primary animate-float" size={32} />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-primary">Entering the Workspace</span>
                <h2 className="text-4xl md:text-5xl font-display font-extrabold text-cream leading-tight">Writers' Village</h2>
                <p className="text-xs text-cream/60 font-serif leading-relaxed italic">
                  "A village of ink and parchment, where Zaria, Kaduna, and Abuja voices converge."
                </p>
              </div>
              <div className="pt-6">
                <button 
                  onClick={handleEnter}
                  className="bg-primary hover:bg-white text-ink hover:text-burgundy px-8 py-3.5 rounded-xl uppercase tracking-widest text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Cross The Gate</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Writers' Village Workspace */}
      <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-burgundy/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/10 rounded-full blur-[100px] -z-10" />

        <motion.div 
          className="max-w-7xl mx-auto space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-burgundy/5 border border-burgundy/10 text-xs font-bold text-burgundy uppercase tracking-widest">
              <Sparkles size={12} className="text-accent" />
              <span>Creative Circle</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-burgundy tracking-tight">
              Writers' Village
            </h1>
            <p className="text-sm md:text-base text-ink/75 leading-relaxed font-serif">
              Welcome, <span className="font-sans font-bold text-burgundy">{userStats.name}</span> ({userStats.lkId}). Hone your craft under weekly prompts, or critique anonymous manuscripts to guide your peers.
            </p>
          </motion.div>

          {/* User Quick Stats Banner (Glassmorphism layout) */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/40 backdrop-blur-md border border-sage/15 rounded-[24px] p-6 max-w-4xl mx-auto shadow-md"
          >
            <div className="text-center space-y-1 p-2">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Milestone Tokens</div>
              <div className="text-3xl font-display text-burgundy font-extrabold font-serif">{userStats.milestoneTokens.toFixed(1)}</div>
            </div>
            <div className="text-center space-y-1 p-2 border-l border-sage/15">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Spendable Leaves</div>
              <div className="text-3xl font-display text-burgundy font-extrabold">🍃 {userStats.spendableLeaves}</div>
            </div>
            <div className="text-center space-y-1 p-2 border-l border-sage/15">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Weekly Critiques</div>
              <div className="text-3xl font-display text-burgundy font-extrabold">📚 {userStats.weeklyReviews} / 3</div>
            </div>
            <div className="text-center space-y-1 p-2 border-l border-sage/15 flex flex-col items-center justify-center">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Village Tier</div>
              <div className="text-[10px] font-sans font-bold text-accent bg-burgundy px-3 py-1 rounded-full uppercase tracking-wider inline-block mt-2">
                Active Member
              </div>
            </div>
          </motion.div>

          {/* Portals Grid (Parchment Card Styling) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Card 1: Writing Workspace */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="parchment-card p-8 flex flex-col justify-between space-y-8 group"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-burgundy/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 bg-burgundy/5 border border-burgundy/10 rounded-2xl flex items-center justify-center text-burgundy">
                  <PenTool size={26} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-burgundy">Writing Workspace</h2>
                  <p className="text-xs text-ink/50 uppercase tracking-wider font-bold">Draft & Sync Manuscripts Offline</p>
                </div>
                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed font-medium">
                  Bring your ideas to life using our offline-first manuscript editor. Save progress automatically to your local browser storage and sync seamlessly with the Clubhouse database once you go online.
                </p>

                {/* Quick Prompts Info */}
                <div className="border-t border-sage/10 pt-6 space-y-4 bg-cream/35 -mx-8 px-8 pb-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest">
                    <Clock size={12} />
                    <span>Active Weekly Prompts</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-sage/10 rounded-xl space-y-1.5 shadow-sm">
                      <span className="text-[9px] font-bold text-burgundy bg-burgundy/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Story Prompt</span>
                      <p className="text-[11px] text-ink/85 font-serif line-clamp-2 italic leading-relaxed">"{storyPrompt}"</p>
                    </div>
                    <div className="p-3.5 bg-white border border-sage/10 rounded-xl space-y-1.5 shadow-sm">
                      <span className="text-[9px] font-bold text-accent bg-accent/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Poetry Prompt</span>
                      <p className="text-[11px] text-ink/85 font-serif line-clamp-2 italic leading-relaxed">"{poemPrompt}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-4">
                <Link 
                  href="/dashboard/write"
                  className="w-full bg-burgundy hover:bg-ink text-cream font-bold text-xs py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Enter Writing Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Card 2: Critique Queue */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="parchment-card p-8 flex flex-col justify-between space-y-8 group"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-sage/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 bg-sage/10 border border-sage/20 rounded-2xl flex items-center justify-center text-sage">
                  <BookOpen size={26} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-burgundy">Critique Queue</h2>
                  <p className="text-xs text-ink/50 uppercase tracking-wider font-bold">Review Anonymously & Earn Tokens</p>
                </div>
                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed font-medium">
                  Step into the double-blind review pool. Read manuscripts submitted anonymously by other Clubhouse members, write structured feedback, and help decide which works get featured.
                </p>

                {/* Rewards / Guidelines Summary */}
                <div className="border-t border-sage/10 pt-6 space-y-4 bg-cream/35 -mx-8 px-8 pb-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest">
                    <Compass size={12} />
                    <span>Critique Rules & Rewards</span>
                  </div>
                  
                  <ul className="text-[11px] text-ink/75 space-y-2.5 font-serif list-disc pl-5 leading-relaxed font-medium">
                    <li>Earn <strong>1.0 Milestone Token</strong> per completed critique.</li>
                    <li>Early-bird critiques (completed within 24 hours of batch drop) reward <strong>1.5 Tokens</strong>.</li>
                    <li>Earn spendable <strong>Leaves</strong> to gift book vouchers to your chapter pool.</li>
                    <li>Double-blind active: Authors and reviewers remain fully anonymous.</li>
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-4">
                <Link 
                  href="/dashboard/review"
                  className="w-full bg-sage hover:bg-ink hover:text-cream text-ink font-bold text-xs py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Enter Critique Queue</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

          </div>

        </motion.div>
      </main>
    </>
  );
}
