"use client";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText, BookOpen, Award, Clock, Coins } from 'lucide-react';

export default function ClubhouseCharterModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll locking invariant
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-cream rounded-3xl p-6 sm:p-8 border border-sage/20 shadow-2xl z-10 max-h-[88vh] overflow-y-auto space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/70 hover:bg-white p-2 rounded-full border border-sage/15 transition-colors cursor-pointer text-ink/60 hover:text-ink"
            aria-label="Close Charter"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center space-y-1.5 pt-2">
            <div className="w-12 h-12 rounded-full bg-burgundy/10 border border-burgundy/20 flex items-center justify-center mx-auto text-burgundy mb-2">
              <ScrollText size={22} className="text-accent" />
            </div>
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-accent block">
              Sanctuary Lore &amp; Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-burgundy">
              Clubhouse Charter
            </h2>
            <p className="text-xs text-ink/70 font-serif max-w-md mx-auto">
              The four foundational rituals governing double-blind critiques, token milestones, and clubhouse life.
            </p>
          </div>

          {/* 4 Pillars */}
          <div className="space-y-3 font-serif">
            {/* Pillar 1 */}
            <div className="bg-white/80 border border-sage/15 rounded-2xl p-4 flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
                <BookOpen size={16} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-burgundy">1. Double-Blind Peer Review</h3>
                <p className="text-xs text-ink/75 leading-relaxed">
                  Manuscripts in the Critique Corner remain strictly anonymous until reviewed. Pacing, mirror reflections, and constructive feedback sharpen the craft without bias.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white/80 border border-sage/15 rounded-2xl p-4 flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-burgundy/10 border border-burgundy/20 flex items-center justify-center text-burgundy shrink-0 mt-0.5">
                <Award size={16} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-burgundy">2. The 10.0 Milestone Keeper Threshold</h3>
                <p className="text-xs text-ink/75 leading-relaxed">
                  Earn Milestone Tokens through consistent weekly critiques, published submissions, and community events. Accumulating 10.0 tokens permanently unlocks Keeper status and bookstore privileges.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white/80 border border-sage/15 rounded-2xl p-4 flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-sage/15 border border-sage/25 flex items-center justify-center text-sage shrink-0 mt-0.5">
                <Clock size={16} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-burgundy">3. Saturday Batch Drops &amp; Recaps</h3>
                <p className="text-xs text-ink/75 leading-relaxed">
                  Every Saturday at 12:00 AM UTC, the batch rotates. Reviewed pieces graduate to The Living Salon, weekly laurels are bestowed, and fresh prompts spark the week ahead.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white/80 border border-sage/15 rounded-2xl p-4 flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <Coins size={16} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-burgundy">4. The Leaves Ledger</h3>
                <p className="text-xs text-ink/75 leading-relaxed">
                  Spendable Leaves earned through high-quality critiques and prompt participation are redeemable for physical books in our bookstore and secret milestone packages.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full bg-burgundy hover:bg-ink text-cream font-sans font-bold text-xs py-3 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Return to Clubhouse
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

