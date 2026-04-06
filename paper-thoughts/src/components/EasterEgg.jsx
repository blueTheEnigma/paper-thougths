"use client";
import { useState } from 'react';
import { Feather, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EasterEgg() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 text-ink opacity-10 hover:opacity-100 transition-opacity p-2 cursor-pointer"
        aria-label="Unlock Lore"
      >
        <Feather size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/90 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
              className="relative w-full max-w-lg bg-[#FAF0E6] p-10 md:p-16 rounded-sm shadow-2xl border border-ink/20 z-10"
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 bg-ink/10 hover:bg-ink hover:text-white rounded-full p-2 transition-colors">
                <X size={20} />
              </button>

              <div className="flex justify-center mb-8"><Feather size={48} className="text-burgundy opacity-50" /></div>

              <h3 className="font-display text-3xl text-center text-burgundy mb-6">The Lore Keeper's Stash</h3>

              <div className="font-quote text-xl italic text-ink/80 text-center leading-relaxed">
                <p>"They thought we were just reading books.<br />They didn't know we were hoarding ammunition."</p>
              </div>

              <div className="mt-12 text-center text-xs tracking-widest uppercase font-bold text-ink/40 border-t border-ink/10 pt-4">
                You found the secret. Welcome to the inner circle.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
