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
      <main className="min-h-screen bg-cream pb-20 px-3.5 sm:px-6 md:px-8 relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-burgundy/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/10 rounded-full blur-[100px] -z-10" />

        <motion.div
          className="max-w-7xl mx-auto space-y-6 sm:space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy/5 border border-burgundy/10 text-[10px] sm:text-xs font-bold text-burgundy uppercase tracking-widest">
              <Sparkles size={12} className="text-accent" />
              <span>Creative Circle</span>
            </div>
            <h1 className="text-2xl sm:text-5xl md:text-6xl font-display font-extrabold text-burgundy tracking-tight leading-tight">
              Writers&rsquo; Village
            </h1>
            <p className="text-xs sm:text-base text-ink/70 leading-relaxed font-serif max-w-2xl mx-auto">
              Welcome,{' '}
              <span className="font-sans font-bold text-burgundy">{userName}</span>{' '}
              <span className="text-ink/40 text-[10px] sm:text-xs font-mono">({userStats.lkId})</span>
              . Hone your craft under weekly prompts, or critique anonymous manuscripts to guide your peers.
            </p>
          </motion.div>

          {/* Stats banner */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 bg-white/50 backdrop-blur-md border border-sage/15 rounded-2xl sm:rounded-[24px] p-3 sm:p-6 max-w-4xl mx-auto shadow-sm"
          >
            <div className="text-center space-y-0.5 sm:space-y-1 p-1.5 sm:p-2">
              <div className="text-[9px] sm:text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Milestone Tokens</div>
              <div className="text-xl sm:text-3xl font-display text-burgundy font-extrabold">{userStats.milestoneTokens.toFixed(1)}</div>
            </div>
            <div className="text-center space-y-0.5 sm:space-y-1 p-1.5 sm:p-2 border-l border-sage/15">
              <div className="text-[9px] sm:text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Spendable Leaves</div>
              <div className="text-xl sm:text-3xl font-display text-burgundy font-extrabold">🍃 {userStats.spendableLeaves}</div>
            </div>
            <div className="text-center space-y-0.5 sm:space-y-1 p-1.5 sm:p-2 border-t md:border-t-0 md:border-l border-sage/15">
              <div className="text-[9px] sm:text-[10px] font-sans font-bold text-ink/50 uppercase tracking-widest">Weekly Critiques</div>
              <div className="text-xl sm:text-3xl font-display text-burgundy font-extrabold">📚 {userStats.weeklyReviews}/3</div>
            </div>
            <div className="text-center space-y-1 p-1.5 sm:p-2 border-t md:border-t-0 border-l border-sage/15 flex flex-col items-center justify-center">
              <PanguinAvatar lifetimeLeaves={userStats.lifetimeLeaves || 0} avatarUrl={userStats.avatarUrl} variant="compact" archetype={userStats.archetype} foundingBadge={userStats.foundingBadge} />
            </div>
          </motion.div>

          <div className="text-center">
            <Link href="/patron" className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-serif italic text-ink/60 hover:text-accent transition-colors">
              <span>Wish to nourish the Literary Fund or sponsor community Leaves?</span>
              <span className="underline underline-offset-4 font-semibold text-burgundy">Visit Patronage →</span>
            </Link>
          </div>

          {/* Village Architecture: 1-Hero (Writing Forge) + 2-Column Split (Salon & Critique Queue) on mobile; 3 balanced pillars on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">

            {/* 1. The Living Salon (Reading Gallery) - Left column on mobile & desktop */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="col-span-1 order-2 sm:order-1 parchment-card p-3 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-5 group border border-accent/20"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(242,169,138,0.12) 0%, rgba(250,247,242,1) 85%)' }}
            >
              <div className="space-y-2 sm:space-y-3.5 relative z-10">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-accent/10 border border-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-accent">
                  <Sparkles size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-accent block">Open Sanctuary</span>
                  <h2 className="text-sm sm:text-xl font-display font-extrabold text-burgundy">The Living Salon</h2>
                  <p className="text-[9px] sm:text-xs text-ink/50 uppercase tracking-wider font-bold">Read &amp; Connect</p>
                </div>
                <p className="text-[11px] sm:text-xs text-ink/75 leading-relaxed font-medium">
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
                  className="w-full bg-accent hover:bg-burgundy text-burgundy hover:text-cream font-bold text-[10px] sm:text-xs py-2 sm:py-3 px-2 sm:px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 group-hover:gap-2"
                >
                  <span>Enter Salon</span>
                  <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* 2. Writing Forge - Hero on mobile (col-span-2 order-first), Center pillar on desktop (sm:col-span-1 sm:order-2) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="col-span-2 sm:col-span-1 order-first sm:order-2 parchment-card p-3.5 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-5 group border border-burgundy/15 relative overflow-hidden"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(163,59,47,0.08) 0%, rgba(250,247,242,1) 85%)' }}
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-accent/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />

              <div className="space-y-2.5 sm:space-y-3.5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 bg-burgundy/5 border border-burgundy/15 rounded-xl sm:rounded-2xl flex items-center justify-center text-burgundy">
                    <PenTool size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[8px] sm:text-[10px] font-sans font-bold uppercase tracking-wider border border-accent/20">
                    <Clock size={10} className="sm:w-3 sm:h-3 animate-spin-slow" />
                    Active Weekly Prompt
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-burgundy block">Creative Forge</span>
                  <h2 className="text-base sm:text-xl font-display font-extrabold text-burgundy">Writing Forge</h2>
                  <p className="text-[9px] sm:text-xs text-ink/50 uppercase tracking-wider font-bold">Draft &amp; Auto-Sync</p>
                </div>

                {/* Prompt blockquote */}
                <div className="p-2.5 sm:p-3.5 bg-white/80 border border-burgundy/15 rounded-xl sm:rounded-2xl space-y-1 shadow-2xs">
                  <blockquote className="text-xs sm:text-sm font-serif italic text-burgundy font-medium leading-relaxed">
                    &ldquo;{weeklyPrompt || storyPrompt || poemPrompt}&rdquo;
                  </blockquote>
                  <p className="text-[9px] sm:text-[11px] text-ink/65 font-serif leading-tight">
                    Earn <strong className="text-burgundy">+1.0 Milestone Token &amp; +5 Leaves</strong> on your first weekly submission.
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-1">
                <Link
                  href="/dashboard/write"
                  className="w-full bg-burgundy hover:bg-ink text-cream font-bold text-[11px] sm:text-xs py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:gap-2.5 cursor-pointer"
                >
                  <PenTool size={13} className="sm:w-3.5 sm:h-3.5" />
                  <span>Enter Forge &amp; Draft</span>
                  <ArrowRight size={13} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* 3. Critique Queue - Right column on mobile & desktop */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="col-span-1 order-3 sm:order-3 parchment-card p-3 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-5 group border border-sage/25"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sage/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

              <div className="space-y-2 sm:space-y-3.5 relative z-10">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-sage/10 border border-sage/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-sage">
                  <BookOpen size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-sage block">Craft Crucible</span>
                  <h2 className="text-sm sm:text-xl font-display font-extrabold text-burgundy">Critique Queue</h2>
                  <p className="text-[9px] sm:text-xs text-ink/50 uppercase tracking-wider font-bold">Review &amp; Earn</p>
                </div>
                <p className="text-[11px] sm:text-xs text-ink/75 leading-relaxed font-medium">
                  Step into the double-blind review pool. Read manuscripts anonymously and earn leaves.
                </p>

                <div className="hidden sm:block border-t border-sage/10 pt-4 space-y-2 bg-cream/35 -mx-6 sm:-mx-7 px-6 sm:px-7 pb-2 text-[11px] font-serif text-ink/75">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <Compass size={12} />
                    <span>Critique Rewards</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 font-medium">
                    <li>Earn <strong>5 Leaves</strong> per critique.</li>
                    <li>Helpful Bonus: <strong>+10 Leaves</strong>.</li>
                    <li>Laurel: <strong>Inquisitor of the Month</strong>.</li>
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-1">
                <Link
                  href="/dashboard/review"
                  className="w-full bg-sage hover:bg-ink hover:text-cream text-ink font-bold text-[10px] sm:text-xs py-2 sm:py-3.5 px-2 sm:px-5 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 group-hover:gap-2"
                >
                  <span>Enter Queue</span>
                  <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </motion.div>

          </div>

          {/* Living Village Showcase (Recent Salon Manuscripts) */}
          {recentSalonWorks && recentSalonWorks.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 pt-1 max-w-7xl mx-auto">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-accent sm:w-4 sm:h-4" />
                  <h3 className="font-display font-extrabold text-xs sm:text-base text-burgundy">
                    From The Living Salon
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-sans font-semibold text-ink/40 uppercase tracking-wider hidden sm:inline">
                    • Reviewed Manuscripts
                  </span>
                </div>
                <Link
                  href="/village/gallery"
                  className="text-[10px] sm:text-xs font-sans font-bold text-accent hover:text-burgundy flex items-center gap-1 uppercase tracking-wider transition-colors"
                >
                  <span>Browse All</span>
                  <ArrowRight size={11} className="sm:w-3 sm:h-3" />
                </Link>
              </div>

              {/* Responsive Preview Grid: 1 col on mobile, 3 cols on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                {recentSalonWorks.map((work) => (
                  <Link
                    key={work.id}
                    href={`/village/gallery?pieceId=${work.id}`}
                    className="parchment-card p-3 sm:p-4 flex flex-col justify-between group hover:-translate-y-0.5 transition-all border border-sage/15 hover:border-accent/40 shadow-2xs hover:shadow-sm"
                  >
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] sm:text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream border border-sage/20 text-burgundy/80 truncate max-w-[90px]">
                          {work.genre || 'Prose'}
                        </span>
                        {work.averageRating > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-sans font-bold text-amber-600 flex items-center gap-0.5">
                            ★ {work.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-xs sm:text-sm text-burgundy group-hover:text-accent transition-colors line-clamp-1 leading-snug">
                        {work.title}
                      </h4>

                      <p className="text-[10px] sm:text-[10px] text-ink/50 font-serif italic truncate">
                        by {work.displayName || 'Anonymous'}
                      </p>

                      {work.logline && (
                        <p className="text-[11px] sm:text-[11px] text-ink/75 font-serif line-clamp-2 leading-relaxed">
                          &ldquo;{work.logline}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-sage/10 flex items-center justify-between text-[10px] text-ink/50 font-sans">
                      <span className="font-bold text-accent group-hover:text-burgundy transition-colors">Read Manuscript</span>
                      <ArrowRight size={11} className="text-accent group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      </main>
    </>
  );
}
