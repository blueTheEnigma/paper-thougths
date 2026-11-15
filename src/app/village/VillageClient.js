"use client";
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, PenTool, Award, ArrowRight,
  Sparkles, Clock, Compass, Flame
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import PanguinAvatar from '@/components/PanguinAvatar';

// ─── Animation Variants for main workspace ───────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { y: 22, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 90, damping: 16 },
  },
};

// ─── Main VillageClient ───────────────────────────────────────────────────────

export default function VillageClient({ weeklyPrompt, storyPrompt, poemPrompt, userStats, recentSalonWorks = [], isSignedIn: serverIsSignedIn, isRegistered: serverIsRegistered }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectUrl = searchParams ? searchParams.get('redirect') : null;

  // Client-side authentication sensing
  const { isSignedIn: clientIsSignedIn, isLoaded: authLoaded } = useAuth();
  const { user: clientUser } = useUser();

  const isSignedIn = authLoaded ? clientIsSignedIn : serverIsSignedIn;
  const userName = clientUser ? (clientUser.firstName || clientUser.fullName || userStats?.name || 'Writer') : (userStats?.name || 'Writer');

  // Immediate redirect handling if redirectUrl is passed in query
  useEffect(() => {
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  }, [redirectUrl, router]);

  return (
    <>
      {/* ── Main Workspace (frictionless entry with zero delays) ── */}
      <main className="min-h-screen bg-cream pb-20 px-4 md:px-8 relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-burgundy/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/10 rounded-full blur-[100px] -z-10" />

        <motion.div
          className="max-w-7xl mx-auto space-y-10 sm:space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-3 max-w-3xl mx-auto pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-burgundy/5 border border-burgundy/10 text-xs font-bold text-burgundy uppercase tracking-widest">
              <Sparkles size={12} className="text-accent" />
              <span>Creative Circle</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-burgundy tracking-tight leading-tight">
              Writers&rsquo; Village
            </h1>
            <p className="text-sm md:text-base text-ink/70 leading-relaxed font-serif">
              Welcome,{' '}
              <span className="font-sans font-bold text-burgundy">{userName}</span>{' '}
              <span className="text-ink/40 text-xs font-mono">({userStats.lkId})</span>
              . Hone your craft under weekly prompts, or critique anonymous manuscripts to guide your peers.
            </p>
          </motion.div>

          {/* Stats banner */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-white/50 backdrop-blur-md border border-sage/15 rounded-[24px] p-4 sm:p-6 max-w-4xl mx-auto shadow-sm"
          >
            <div className="text-center space-y-1 p-2">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Milestone Tokens</div>
              <div className="text-2xl sm:text-3xl font-display text-burgundy font-extrabold">{userStats.milestoneTokens.toFixed(1)}</div>
            </div>
            <div className="text-center space-y-1 p-2 border-l border-sage/15">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Spendable Leaves</div>
              <div className="text-2xl sm:text-3xl font-display text-burgundy font-extrabold">🍃 {userStats.spendableLeaves}</div>
            </div>
            <div className="text-center space-y-1 p-2 border-l border-sage/15">
              <div className="text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Weekly Critiques</div>
              <div className="text-2xl sm:text-3xl font-display text-burgundy font-extrabold">📚 {userStats.weeklyReviews}/3</div>
            </div>
            <div className="text-center space-y-1 p-2 border-l border-sage/15 flex flex-col items-center justify-center">
              <PanguinAvatar lifetimeLeaves={userStats.lifetimeLeaves || 0} avatarUrl={userStats.avatarUrl} variant="compact" archetype={userStats.archetype} foundingBadge={userStats.foundingBadge} />
            </div>
          </motion.div>

          {/* Three Village Pillars (3-Across In-Frame on Mobile) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">

            {/* 1. The Living Salon (Reading Gallery) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="parchment-card p-2.5 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-5 group border border-accent/20"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(242,169,138,0.12) 0%, rgba(250,247,242,1) 85%)' }}
            >
              <div className="space-y-2 sm:space-y-3.5 relative z-10">
                <div className="w-7 h-7 sm:w-11 sm:h-11 bg-accent/10 border border-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-accent">
                  <Sparkles size={14} className="sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7px] sm:text-[8px] font-sans font-bold uppercase tracking-wider text-accent block">Open Sanctuary</span>
                  <h2 className="text-xs sm:text-xl font-display font-extrabold text-burgundy line-clamp-1">The Living Salon</h2>
                  <p className="text-[8px] sm:text-[10px] text-ink/50 uppercase tracking-wider font-bold truncate">Read &amp; Connect</p>
                </div>
                <p className="text-[9px] sm:text-xs text-ink/75 leading-snug sm:leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                  Browse weekly prompt manuscripts and poetry from across the clubhouse freely.
                </p>

                <div className="hidden sm:block border-t border-sage/10 pt-3 space-y-1.5 bg-cream/35 -mx-5 sm:-mx-6 px-5 sm:px-6 pb-2 text-[10px] font-serif text-ink/75">
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <BookOpen size={11} />
                    <span>Salon Highlights</span>
                  </div>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>Read poems &amp; prose frictionlessly.</li>
                    <li>Discover authors by Pen Names.</li>
                    <li>1-click JPEG card exports.</li>
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-1">
                <Link
                  href="/village/gallery"
                  className="w-full bg-accent hover:bg-burgundy text-burgundy hover:text-cream font-bold text-[9px] sm:text-xs py-2 sm:py-3 px-1.5 sm:px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 group-hover:gap-1.5"
                >
                  <span>Enter Salon</span>
                  <ArrowRight size={11} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* 2. Writing Workspace card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="parchment-card p-2.5 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-5 group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-burgundy/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

              <div className="space-y-2 sm:space-y-3.5 relative z-10">
                <div className="w-7 h-7 sm:w-11 sm:h-11 bg-burgundy/5 border border-burgundy/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-burgundy">
                  <PenTool size={14} className="sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-burgundy block">Creative Forge</span>
                  <h2 className="text-xs sm:text-xl font-display font-extrabold text-burgundy line-clamp-1">Writing Forge</h2>
                  <p className="text-[8px] sm:text-xs text-ink/50 uppercase tracking-wider font-bold truncate">Draft &amp; Sync</p>
                </div>
                <p className="text-[9px] sm:text-xs text-ink/75 leading-snug sm:leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                  Bring your ideas to life under weekly prompts with local auto-sync.
                </p>

                <div className="hidden sm:block border-t border-sage/10 pt-4 space-y-2 bg-cream/35 -mx-6 sm:-mx-7 px-6 sm:px-7 pb-2">
                  <div className="flex items-center justify-between text-[9px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>Active Weekly Prompt</span>
                    </div>
                    <span className="text-[8px] text-accent font-semibold lowercase">stories &amp; poems</span>
                  </div>
                  <div className="p-3 bg-white border border-sage/10 rounded-xl space-y-1 shadow-sm">
                    <p className="text-[11px] text-ink/85 font-serif line-clamp-3 italic leading-relaxed">&ldquo;{weeklyPrompt || storyPrompt || poemPrompt}&rdquo;</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-1">
                <Link
                  href="/dashboard/write"
                  className="w-full bg-burgundy hover:bg-ink text-cream font-bold text-[9px] sm:text-xs py-2 sm:py-3.5 px-1.5 sm:px-5 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 group-hover:gap-1.5"
                >
                  <span>Enter Forge</span>
                  <ArrowRight size={11} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* 3. Critique Queue card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="parchment-card p-2.5 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-5 group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sage/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

              <div className="space-y-2 sm:space-y-3.5 relative z-10">
                <div className="w-7 h-7 sm:w-11 sm:h-11 bg-sage/10 border border-sage/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-sage">
                  <BookOpen size={14} className="sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-sage block">Craft Crucible</span>
                  <h2 className="text-xs sm:text-xl font-display font-extrabold text-burgundy line-clamp-1">Critique Queue</h2>
                  <p className="text-[8px] sm:text-xs text-ink/50 uppercase tracking-wider font-bold truncate">Review &amp; Earn</p>
                </div>
                <p className="text-[9px] sm:text-xs text-ink/75 leading-snug sm:leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                  Step into the double-blind review pool. Read manuscripts anonymously and earn leaves.
                </p>

                <div className="hidden sm:block border-t border-sage/10 pt-4 space-y-2 bg-cream/35 -mx-6 sm:-mx-7 px-6 sm:px-7 pb-2 text-[11px] font-serif text-ink/75">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <Compass size={12} />
                    <span>Critique Rewards</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 font-medium">
                    <li>Unlimited reviews: Earn <strong>5 Leaves</strong> per critique.</li>
                    <li>Author Helpful Bonus: Earn <strong>+10 Leaves</strong> when confirmed.</li>
                    <li>Compete for <strong>Inquisitor of the Month</strong> (+150 🍃 & +2.0 🪙 podium laurels).</li>
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-1">
                <Link
                  href="/dashboard/review"
                  className="w-full bg-sage hover:bg-ink hover:text-cream text-ink font-bold text-[9px] sm:text-xs py-2 sm:py-3.5 px-1.5 sm:px-5 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 group-hover:gap-1.5"
                >
                  <span>Enter Queue</span>
                  <ArrowRight size={11} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </motion.div>

          </div>

          {/* Living Village Showcase (Active Weekly Prompt & Recent Salon Manuscripts) */}
          <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6 pt-1 max-w-7xl mx-auto">
            
            {/* 1. Active Weekly Prompt Feature Card */}
            <div 
              className="parchment-card p-3.5 sm:p-6 border border-accent/25 relative overflow-hidden group shadow-xs"
              style={{ background: 'radial-gradient(ellipse at 10% 20%, rgba(242,169,138,0.15) 0%, rgba(250,247,242,0.98) 75%)' }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[8px] sm:text-[10px] font-sans font-bold uppercase tracking-wider border border-accent/20">
                      <Clock size={10} className="sm:w-3 sm:h-3 animate-spin-slow" />
                      Active Weekly Prompt
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-sans font-medium text-ink/40 uppercase tracking-widest hidden sm:inline">
                      Saturday Batch Drop
                    </span>
                  </div>
                  
                  <blockquote className="text-xs sm:text-base font-serif italic text-burgundy font-medium leading-relaxed pl-2.5 sm:pl-3 border-l-2 border-accent/40 my-0.5 sm:my-1 line-clamp-3 sm:line-clamp-none">
                    &ldquo;{weeklyPrompt || storyPrompt || poemPrompt}&rdquo;
                  </blockquote>
                  
                  <p className="text-[9px] sm:text-xs text-ink/60 font-serif leading-tight">
                    Pen your story or verse in the Forge. First submission of the week earns <strong className="text-burgundy">+1.0 Milestone Token &amp; +5 Leaves</strong>.
                  </p>
                </div>

                <div className="shrink-0 flex items-center pt-1 md:pt-0">
                  <Link
                    href="/dashboard/write"
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-burgundy hover:bg-ink text-cream font-sans font-bold text-[10px] sm:text-xs py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                  >
                    <PenTool size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span>Craft Manuscript</span>
                    <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. From The Living Salon (Graduated Works) */}
            {recentSalonWorks && recentSalonWorks.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-accent sm:w-4 sm:h-4" />
                    <h3 className="font-display font-extrabold text-xs sm:text-base text-burgundy">
                      From The Living Salon
                    </h3>
                    <span className="text-[8px] sm:text-[9px] font-sans font-semibold text-ink/40 uppercase tracking-wider hidden sm:inline">
                      • Reviewed Manuscripts
                    </span>
                  </div>
                  <Link
                    href="/village/gallery"
                    className="text-[9px] sm:text-xs font-sans font-bold text-accent hover:text-burgundy flex items-center gap-1 uppercase tracking-wider transition-colors"
                  >
                    <span>Browse All</span>
                    <ArrowRight size={11} className="sm:w-3 sm:h-3" />
                  </Link>
                </div>

                {/* 3-Across High-Density Preview Grid */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
                  {recentSalonWorks.map((work) => (
                    <Link
                      key={work.id}
                      href={`/village/gallery?pieceId=${work.id}`}
                      className="parchment-card p-2 sm:p-4 flex flex-col justify-between group hover:-translate-y-0.5 transition-all border border-sage/15 hover:border-accent/40 shadow-2xs hover:shadow-sm"
                    >
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[7px] sm:text-[9px] font-sans font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-cream border border-sage/20 text-burgundy/80 truncate max-w-[65px] sm:max-w-[80px]">
                            {work.genre || 'Prose'}
                          </span>
                          {work.averageRating > 0 && (
                            <span className="text-[7px] sm:text-[10px] font-sans font-bold text-amber-600 flex items-center gap-0.5">
                              ★ {work.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <h4 className="font-display font-bold text-[10px] sm:text-sm text-burgundy group-hover:text-accent transition-colors line-clamp-1 leading-snug">
                          {work.title}
                        </h4>

                        <p className="text-[7px] sm:text-[10px] text-ink/50 font-serif italic truncate">
                          by {work.displayName || 'Anonymous'}
                        </p>

                        {work.logline && (
                          <p className="text-[8px] sm:text-[11px] text-ink/75 font-serif line-clamp-2 leading-relaxed hidden sm:block">
                            {work.logline}
                          </p>
                        )}
                      </div>

                      <div className="pt-1.5 sm:pt-2 border-t border-sage/10 flex items-center justify-between text-[7px] sm:text-[10px] text-ink/50 font-sans">
                        <span className="font-bold text-accent/80">Read</span>
                        <ArrowRight size={9} className="sm:w-2.5 sm:h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </motion.div>
      </main>
    </>
  );
}
