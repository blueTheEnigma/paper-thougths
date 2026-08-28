"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, PenTool, Feather, Award, ArrowRight,
  Sparkles, Clock, Compass, DoorOpen
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import PanguinAvatar from '@/components/PanguinAvatar';

// ─── Cinematic Entrance Portal ──────────────────────────────────────────────

function EntrancePortal({ onEnter, userName, isSignedIn, redirectUrl }) {
  const [stage, setStage] = useState(0);

  // Sequence: 0 = fade-in logo  →  1 = quote line  →  2 = CTA revealed
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 900);
    const t2 = setTimeout(() => setStage(2), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      key="portal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
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
            background: i % 4 === 0
              ? 'rgba(242,169,138,0.6)'
              : 'rgba(201,106,66,0.4)',
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
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">

        {/* Gate icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center animate-pulse-subtle"
            style={{
              background: 'radial-gradient(circle, rgba(92,26,46,0.5) 0%, rgba(92,26,46,0.1) 100%)',
              border: '1px solid rgba(242,169,138,0.25)',
              boxShadow: '0 0 40px rgba(92,26,46,0.6), 0 0 80px rgba(92,26,46,0.2)',
            }}
          >
            <DoorOpen
              size={36}
              className="animate-float"
              style={{ color: '#F2A98A' }}
            />
          </div>
        </motion.div>

        {/* Label */}
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="block text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.35em] mb-4"
          style={{ color: '#C96A42' }}
        >
          Writers&rsquo; Village
        </motion.span>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-extrabold leading-tight mb-5"
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            color: '#FAF7F2',
          }}
        >
          {!isSignedIn ? (
            <>
              To travel beyond,
              <br />
              <span style={{ color: '#F2A98A' }}>one must belong.</span>
            </>
          ) : (
            <>
              Are you ready to step
              <br />
              <span style={{ color: '#F2A98A' }}>into the world of lore?</span>
            </>
          )}
        </motion.h1>

        {/* Lore quote — fades in at stage 1 */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="font-quote italic leading-relaxed mb-8 text-sm sm:text-base px-2"
              style={{ color: 'rgba(250,247,242,0.55)' }}
            >
              {!isSignedIn ? (
                `“A village of ink and parchment, where Zaria, Kaduna, and Abuja voices converge — and only the bold dare to write.”`
              ) : (
                `“Welcome back to the creative heart of the clubhouse, ${userName?.split(' ')[0] || 'Writer'}. Your manuscripts, critiques, and leaves are waiting.”`
              )}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Divider */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-16 h-px mb-8 origin-center"
              style={{ background: 'rgba(242,169,138,0.3)' }}
            />
          )}
        </AnimatePresence>

        {/* CTA block — fades in at stage 2 */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full space-y-4"
            >
              {/* Fun sub-prompt */}
              <p
                className="text-xs sm:text-sm font-sans font-semibold"
                style={{ color: 'rgba(250,247,242,0.5)' }}
              >
                {!isSignedIn ? (
                  <>
                    Join the gang.{' '}
                    <span style={{ color: 'rgba(250,247,242,0.35)' }}>
                      Claim your LK-ID first.
                    </span>
                  </>
                ) : (
                  <>
                    Ready, {userName?.split(' ')[0] || 'Writer'}?{' '}
                    <span style={{ color: 'rgba(250,247,242,0.35)' }}>
                      Step into the world of lore.
                    </span>
                  </>
                )}
              </p>

              {/* Primary CTA */}
              {!isSignedIn ? (
                <Link
                  href="/join"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 font-sans font-bold uppercase tracking-widest text-xs sm:text-sm cursor-pointer transition-all px-10 py-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #5C1A2E 0%, #7A2040 100%)',
                    color: '#FAF7F2',
                    boxShadow: '0 0 30px rgba(92,26,46,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(242,169,138,0.2)',
                  }}
                >
                  <Sparkles size={16} style={{ color: '#F2A98A' }} />
                  Join the Collective
                  <ArrowRight size={14} />
                </Link>
              ) : (
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
                  <DoorOpen size={16} style={{ color: '#F2A98A' }} />
                  Pass Through the Portal
                  <ArrowRight size={14} />
                </motion.button>
              )}

              {/* Ghost secondary */}
              <div>
                {!isSignedIn ? (
                  <Link
                    href={redirectUrl ? `/sign-in?redirect_url=${encodeURIComponent(`/village?redirect=${encodeURIComponent(redirectUrl)}`)}` : "/sign-in?redirect_url=/village"}
                    className="text-[11px] font-sans font-medium transition-colors hover:text-white"
                    style={{ color: 'rgba(250,247,242,0.35)' }}
                  >
                    Already a member? Sign in
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="text-[11px] font-sans font-medium transition-colors hover:text-white"
                    style={{ color: 'rgba(250,247,242,0.35)' }}
                  >
                    Return to dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom grain texture bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(6,1,3,0.9) 0%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}

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

export default function VillageClient({ storyPrompt, poemPrompt, userStats, isSignedIn: serverIsSignedIn, isRegistered: serverIsRegistered }) {
  const [showEntrance, setShowEntrance] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectUrl = searchParams ? searchParams.get('redirect') : null;

  // Client-side authentication sensing
  const { isSignedIn: clientIsSignedIn, isLoaded: authLoaded } = useAuth();
  const { user: clientUser } = useUser();

  const isSignedIn = authLoaded ? clientIsSignedIn : serverIsSignedIn;
  const userName = clientUser ? (clientUser.firstName || clientUser.fullName || userStats?.name || 'Writer') : (userStats?.name || 'Writer');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (typeof window !== 'undefined') {
        const seen = sessionStorage.getItem('seen_village_portal') === 'true';
        setShowEntrance(!seen);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem('seen_village_portal', 'true');
    setShowEntrance(false);
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  };

  return (
    <>
      {/* Cinematic entrance portal — rendered in document.body via React Portal */}
      {mounted && createPortal(
        <AnimatePresence mode="wait">
          {showEntrance && (
            <EntrancePortal
              onEnter={handleEnter}
              userName={userName}
              isSignedIn={isSignedIn}
              redirectUrl={redirectUrl}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Main Workspace (visible after portal dismissed) ── */}
      <main className="min-h-screen bg-cream pb-20 px-4 md:px-8 relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-burgundy/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/10 rounded-full blur-[100px] -z-10" />

        <motion.div
          className="max-w-7xl mx-auto space-y-10 sm:space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate={!showEntrance ? 'visible' : 'hidden'}
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
              <PanguinAvatar lifetimeLeaves={userStats.lifetimeLeaves || 0} avatarUrl={userStats.avatarUrl} variant="compact" archetype={userStats.archetype} />
            </div>
          </motion.div>

          {/* Three Village Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* 1. The Living Salon (Reading Gallery) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="parchment-card p-6 sm:p-7 flex flex-col justify-between space-y-6 group border border-accent/20"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(242,169,138,0.12) 0%, rgba(250,247,242,1) 85%)' }}
            >
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent">
                  <Sparkles size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-accent">Open Sanctuary</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-burgundy">The Living Salon</h2>
                  <p className="text-xs text-ink/50 uppercase tracking-wider font-bold">Read &amp; Connect Freely</p>
                </div>
                <p className="text-xs text-ink/75 leading-relaxed font-medium">
                  Browse weekly prompt manuscripts and poetry from across the clubhouse. No review walls—simply read, tap to leave a leaf (🍃), share notes with authors, and download broadsheet cards.
                </p>

                <div className="border-t border-sage/10 pt-4 space-y-2 bg-cream/35 -mx-6 sm:-mx-7 px-6 sm:px-7 pb-2 text-[11px] font-serif text-ink/75">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <BookOpen size={12} />
                    <span>Salon Highlights</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>Read poems &amp; prose with zero friction.</li>
                    <li>Discover authors by their artistic <strong>Pen Names</strong>.</li>
                    <li>1-click broadsheet card exports for WhatsApp &amp; Instagram.</li>
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href="/village/gallery"
                  className="w-full bg-accent hover:bg-burgundy text-burgundy hover:text-cream font-bold text-xs py-3.5 px-5 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Enter Reading Salon</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* 2. Writing Workspace card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="parchment-card p-6 sm:p-7 flex flex-col justify-between space-y-6 group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-burgundy/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 bg-burgundy/5 border border-burgundy/10 rounded-2xl flex items-center justify-center text-burgundy">
                  <PenTool size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-burgundy">Creative Forge</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-burgundy">Writing Workspace</h2>
                  <p className="text-xs text-ink/50 uppercase tracking-wider font-bold">Draft &amp; Sync Offline</p>
                </div>
                <p className="text-xs text-ink/75 leading-relaxed font-medium">
                  Bring your ideas to life under weekly prompts. Now with support for distinct author <strong>Pen Names</strong> and automatic local browser sync.
                </p>

                <div className="border-t border-sage/10 pt-4 space-y-2 bg-cream/35 -mx-6 sm:-mx-7 px-6 sm:px-7 pb-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <Clock size={12} />
                    <span>Active Weekly Prompts</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-white border border-sage/10 rounded-xl space-y-1 shadow-sm">
                      <span className="text-[8px] font-bold text-burgundy bg-burgundy/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Story Prompt</span>
                      <p className="text-[10px] text-ink/85 font-serif line-clamp-2 italic leading-relaxed">&ldquo;{storyPrompt}&rdquo;</p>
                    </div>
                    <div className="p-2.5 bg-white border border-sage/10 rounded-xl space-y-1 shadow-sm">
                      <span className="text-[8px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Poetry Prompt</span>
                      <p className="text-[10px] text-ink/85 font-serif line-clamp-2 italic leading-relaxed">&ldquo;{poemPrompt}&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href="/dashboard/write"
                  className="w-full bg-burgundy hover:bg-ink text-cream font-bold text-xs py-3.5 px-5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* 3. Critique Queue card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="parchment-card p-6 sm:p-7 flex flex-col justify-between space-y-6 group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sage/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 bg-sage/10 border border-sage/20 rounded-2xl flex items-center justify-center text-sage">
                  <BookOpen size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-sage">Craft Crucible</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-burgundy">Critique Queue</h2>
                  <p className="text-xs text-ink/50 uppercase tracking-wider font-bold">Review &amp; Earn Tokens</p>
                </div>
                <p className="text-xs text-ink/75 leading-relaxed font-medium">
                  Step into the double-blind review pool. Read manuscripts anonymously, write structured craft feedback, and earn spendable Leaves and Milestone Tokens.
                </p>

                <div className="border-t border-sage/10 pt-4 space-y-2 bg-cream/35 -mx-6 sm:-mx-7 px-6 sm:px-7 pb-2 text-[11px] font-serif text-ink/75">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink/40 uppercase tracking-widest font-sans">
                    <Compass size={12} />
                    <span>Critique Rewards</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-4 font-medium">
                    <li>Earn <strong>+1.0 Token</strong> per critique.</li>
                    <li>Early-birds (weekend) reward <strong>+1.5 Tokens &amp; +15 Leaves</strong>.</li>
                    <li>Double-blind active for pure editorial craft.</li>
                  </ul>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href="/dashboard/review"
                  className="w-full bg-sage hover:bg-ink hover:text-cream text-ink font-bold text-xs py-3.5 px-5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:gap-3"
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
