"use client";
import { motion } from 'framer-motion';
import { BookOpen, PenTool, Feather, Award, ArrowRight, Sparkles, Clock, Compass } from 'lucide-react';
import Link from 'next/link';

export default function SalonClient({ storyPrompt, poemPrompt, userStats }) {
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 80 }
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-burgundy/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sage/10 rounded-full blur-3xl -z-10" />

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
            <span>The Creative Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display text-burgundy tracking-tight">
            The Writers' Salon
          </h1>
          <p className="text-sm md:text-base text-ink/75 leading-relaxed font-serif">
            Welcome, <span className="font-sans font-bold text-burgundy">{userStats.name}</span> ({userStats.lkId}). Enter the sacred chambers of the Clubhouse. Choose your path: hone your craft under weekly prompts, or critique anonymous manuscripts to guide your peers.
          </p>
        </motion.div>

        {/* User Quick Stats Banner */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/60 backdrop-blur-md border border-sage/20 rounded-[32px] p-6 max-w-4xl mx-auto shadow-sm"
        >
          <div className="text-center space-y-1 p-2">
            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-widest">Milestone Tokens</div>
            <div className="text-2xl font-display text-burgundy font-bold">{userStats.milestoneTokens.toFixed(1)}</div>
          </div>
          <div className="text-center space-y-1 p-2 border-l border-sage/20">
            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-widest">Spendable Leaves</div>
            <div className="text-2xl font-display text-burgundy font-bold">🍃 {userStats.spendableLeaves}</div>
          </div>
          <div className="text-center space-y-1 p-2 border-l border-sage/20">
            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-widest">Weekly Critiques</div>
            <div className="text-2xl font-display text-burgundy font-bold">📚 {userStats.weeklyReviews} / 3</div>
          </div>
          <div className="text-center space-y-1 p-2 border-l border-sage/20">
            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-widest">Membership Status</div>
            <div className="text-xs font-bold text-accent bg-burgundy px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mt-1">
              Active Member
            </div>
          </div>
        </motion.div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: Writing Workspace */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white border border-sage/20 p-8 rounded-[40px] shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-burgundy/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            
            <div className="space-y-6 relative z-10">
              <div className="w-14 h-14 bg-burgundy/5 border border-burgundy/10 rounded-2xl flex items-center justify-center text-burgundy">
                <PenTool size={28} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display text-burgundy">Writing Workspace</h2>
                <p className="text-xs text-ink/60 uppercase tracking-wider font-bold">Draft & Sync Manuscripts Offline</p>
              </div>
              <p className="text-xs text-ink/75 leading-relaxed">
                Bring your ideas to life using our offline-first manuscript editor. Save progress automatically to your local browser storage and sync seamlessly with the Clubhouse database once you go online.
              </p>

              {/* Quick Prompts Info */}
              <div className="border-t border-sage/20 pt-6 space-y-4 bg-cream/20 -mx-8 px-8 pb-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                  <Clock size={12} />
                  <span>Active Weekly Prompts</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-sage/10 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-burgundy bg-burgundy/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Story Prompt</span>
                    <p className="text-[11px] text-ink/80 font-serif line-clamp-2 italic">"{storyPrompt}"</p>
                  </div>
                  <div className="p-3 bg-white border border-sage/10 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Poetry Prompt</span>
                    <p className="text-[11px] text-ink/80 font-serif line-clamp-2 italic">"{poemPrompt}"</p>
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
            className="bg-white border border-sage/20 p-8 rounded-[40px] shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-sage/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            
            <div className="space-y-6 relative z-10">
              <div className="w-14 h-14 bg-sage/10 border border-sage/20 rounded-2xl flex items-center justify-center text-sage">
                <BookOpen size={28} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display text-burgundy">Critique Queue</h2>
                <p className="text-xs text-ink/60 uppercase tracking-wider font-bold">Review Anonymously & Earn Tokens</p>
              </div>
              <p className="text-xs text-ink/75 leading-relaxed">
                Step into the double-blind review pool. Read manuscripts submitted anonymously by other Clubhouse members, write structured feedback, and help decide which works get featured.
              </p>

              {/* Rewards / Guidelines Summary */}
              <div className="border-t border-sage/20 pt-6 space-y-4 bg-cream/20 -mx-8 px-8 pb-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                  <Compass size={12} />
                  <span>Critique Rules & Rewards</span>
                </div>
                
                <ul className="text-[11px] text-ink/75 space-y-2 font-serif list-disc pl-4 leading-relaxed">
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
  );
}
