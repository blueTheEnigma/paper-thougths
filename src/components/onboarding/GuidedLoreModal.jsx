"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, X, ChevronRight, ChevronLeft, Sparkles, 
  Download, Feather, Music, ShoppingBag, ArrowRight, 
  CheckCircle2, Play, BookOpen, Layers
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 'install',
    title: 'Install the App',
    tagline: 'No App Store bloat. Standalone PWA on your home screen in 10 seconds.',
    icon: Download,
    badge: 'Step 1: Setup',
    accentColor: 'from-[#5c1a2e] to-[#c96a42]',
    steps: [
      {
        num: '01',
        title: 'iOS (Safari)',
        desc: 'Open paperthoughts.org in Safari -> Tap Share (box with arrow) -> Tap "Add to Home Screen".'
      },
      {
        num: '02',
        title: 'Android (Chrome)',
        desc: 'Open in Chrome -> Tap 3 dots (⋮) -> Tap "Install App" or accept the install banner.'
      },
      {
        num: '03',
        title: 'Instagram / WhatsApp',
        desc: 'If opened inside social apps, tap (⋯) and choose "Open in Safari/Chrome" first.'
      }
    ],
    action: {
      text: 'View Full Install Prompt',
      onClick: () => {}
    }
  },
  {
    id: 'onboarding',
    title: 'Hatch Panguin & Discover Zodiac',
    tagline: 'Claim your initial Leaves and uncover your Sun, Moon, and Rising literary signs.',
    icon: Sparkles,
    badge: 'Step 2: Identity',
    accentColor: 'from-[#7A2040] to-[#F2A98A]',
    steps: [
      {
        num: '01',
        title: 'The Golden Egg',
        desc: 'Tap the ancient egg during onboarding to hatch your custom Panguin companion.'
      },
      {
        num: '02',
        title: 'Earn First Leaves',
        desc: 'Receive starting Leaves to spend in chapter pools, bookstore discounts, and community awards.'
      },
      {
        num: '03',
        title: 'The Book Zodiac Test',
        desc: '12 atmospheric questions generate your official Paper Thoughts literary birth chart.'
      }
    ],
    action: {
      text: 'Take Book Zodiac Test',
      href: '/zodiac'
    }
  },
  {
    id: 'village',
    title: 'Writers’ Village Critique Cycle',
    tagline: 'Submit weekly scenes and poetry to our 3-lens peer review circle across Nigeria.',
    icon: Feather,
    badge: 'Step 3: Craft',
    accentColor: 'from-[#2C1A0E] to-[#5C1A2E]',
    steps: [
      {
        num: '01',
        title: 'Weekly Submissions',
        desc: 'Submit drafts responding to curated prompts before the weekly midnight deadline.'
      },
      {
        num: '02',
        title: 'The 3-Lens Review',
        desc: 'Critique peer manuscripts across Mirror (what worked), Highwater (best line), and Pivot (refinements).'
      },
      {
        num: '03',
        title: 'AI Synthesis & Laurels',
        desc: 'Our AI synthesizes community consensus reports and awards laureled drafts.'
      }
    ],
    action: {
      text: 'Enter Writers’ Village',
      href: '/village'
    }
  },
  {
    id: 'audio',
    title: 'Spoken Lore & Soundscapes',
    tagline: 'When your eyes are tired, listen to short stories by Debbie paired with ambient rain & fires.',
    icon: Music,
    badge: 'Step 4: Sensory',
    accentColor: 'from-[#5C1A2E] to-[#c96a42]',
    steps: [
      {
        num: '01',
        title: 'LIFELORE Podcast',
        desc: 'Stream Debbie Doowuese Ajom’s weekly audio stories directly inside Paper Thoughts.'
      },
      {
        num: '02',
        title: 'Ambient Soundscapes',
        desc: '9 curated Spotify playlists designed to soundtrack your reading life from midnight to dawn.'
      },
      {
        num: '03',
        title: 'Layered Listening',
        desc: 'Play ambient cabin rain underneath audio story narration for total immersion.'
      }
    ],
    action: {
      text: 'Listen to Spoken Lore',
      href: '/podcasts'
    }
  },
  {
    id: 'bookstore',
    title: 'Real Hardcopies, Never PDFs',
    tagline: 'Browse curated African and international literature delivered straight to your doorstep.',
    icon: ShoppingBag,
    badge: 'Step 5: Literature',
    accentColor: 'from-[#c96a42] to-[#20070e]',
    steps: [
      {
        num: '01',
        title: 'Zero PDFs Policy',
        desc: 'We strictly stock authentic physical editions—holding real paper is non-negotiable.'
      },
      {
        num: '02',
        title: '1-Tap WhatsApp Checkout',
        desc: 'Order books in seconds via WhatsApp with automated order summaries.'
      },
      {
        num: '03',
        title: 'Book of the Month',
        desc: 'Vote in monthly chapter book cycles and join synchronous reading discussions.'
      }
    ],
    action: {
      text: 'Explore the Bookstore',
      href: '/bookstore'
    }
  }
];

export default function GuidedLoreModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  const activeChapter = CHAPTERS[activeChapterIndex];

  const handleNext = () => {
    if (activeChapterIndex < CHAPTERS.length - 1) {
      setActiveChapterIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeChapterIndex > 0) {
      setActiveChapterIndex(prev => prev - 1);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="fixed bottom-24 lg:bottom-8 right-5 z-40 px-3.5 py-2.5 rounded-full bg-[#120308]/90 hover:bg-[#20070e] text-[#F2A98A] border border-[#F2A98A]/35 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="Open Paper Thoughts Sanctuary Guide"
      >
        <GraduationCap size={16} className="text-[#F2A98A] group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">How to Use PT</span>
        <span className="sm:hidden">Guide</span>
      </motion.button>

      {/* Main Interactive Guide Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#140409] border border-[#F2A98A]/30 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative text-cream flex flex-col max-h-[90vh]"
            >
              {/* Header Bar */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080104]/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#5c1a2e] text-[#F2A98A] flex items-center justify-center">
                    <GraduationCap size={15} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-cream">The Sanctuary Guide</h3>
                    <p className="text-[10px] font-mono text-cream/50">Mastering Paper Thoughts in 5 Steps</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chapter Navigation Tabs */}
              <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-[#080104]/40 px-4 py-2 gap-1.5">
                {CHAPTERS.map((ch, idx) => {
                  const isActive = idx === activeChapterIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream border border-[#F2A98A]/40 shadow-sm'
                          : 'text-cream/50 hover:text-cream hover:bg-white/5'
                      }`}
                    >
                      <span>{idx + 1}.</span>
                      <span>{ch.title.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Chapter Content Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                
                {/* Chapter Header */}
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] text-[10px] font-mono font-bold uppercase tracking-wider">
                    {activeChapter.badge}
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
                    {activeChapter.title}
                  </h4>
                  <p className="text-xs sm:text-sm font-serif italic text-cream/75 leading-relaxed">
                    "{activeChapter.tagline}"
                  </p>
                </div>

                {/* 3 Step Visual Cards */}
                <div className="space-y-3">
                  {activeChapter.steps.map((step) => (
                    <div 
                      key={step.num}
                      className="p-4 rounded-2xl bg-[#080104]/80 border border-white/5 flex items-start gap-4 hover:border-[#F2A98A]/25 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5c1a2e] to-[#c96a42] text-cream flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5 shadow-md">
                        {step.num}
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold font-serif text-cream">{step.title}</h5>
                        <p className="text-xs text-cream/70 leading-relaxed font-sans">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Action Link */}
                {activeChapter.action.href && (
                  <div className="pt-2">
                    <Link
                      href={activeChapter.action.href}
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95"
                    >
                      <span>{activeChapter.action.text}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}

              </div>

              {/* Footer Progress & Paging */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#080104]/80">
                <button
                  onClick={handlePrev}
                  disabled={activeChapterIndex === 0}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream text-xs font-bold font-mono disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {CHAPTERS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeChapterIndex ? 'w-6 bg-[#F2A98A]' : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={activeChapterIndex === CHAPTERS.length - 1}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream text-xs font-bold font-mono disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
