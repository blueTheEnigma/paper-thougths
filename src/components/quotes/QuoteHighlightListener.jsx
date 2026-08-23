"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Sparkles } from 'lucide-react';
import QuoteStudioModal from './QuoteStudioModal';

export default function QuoteHighlightListener() {
  const [selectedText, setSelectedText] = useState('');
  const [coords, setCoords] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setCoords(null);
        return;
      }

      const text = selection.toString().trim();
      // Only trigger for meaningful sentences (e.g. between 10 and 350 chars)
      if (text.length >= 10 && text.length <= 350) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position tooltip above the selection
        setCoords({
          top: rect.top + window.scrollY - 44,
          left: rect.left + window.scrollX + (rect.width / 2)
        });
        setSelectedText(text);
      } else {
        setCoords(null);
      }
    };

    const handleMouseDown = (e) => {
      // If clicking inside the tooltip button, don't clear
      if (e.target.closest('#pt-quote-tooltip')) return;
      setCoords(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {coords && (
          <motion.div
            id="pt-quote-tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: 'translateX(-50%)',
              zIndex: 999
            }}
          >
            <button
              onClick={() => {
                setIsModalOpen(true);
                setCoords(null);
              }}
              className="px-3 py-1.5 rounded-full bg-[#120308] border border-[#F2A98A]/50 text-[#F2A98A] text-[11px] font-mono font-bold uppercase tracking-wider shadow-2xl backdrop-blur-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-[#c96a42]/30"
            >
              <Sparkles size={12} className="text-[#F2A98A] animate-pulse" />
              <span>Quote Card</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <QuoteStudioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuote={selectedText}
        initialAuthor="Paper Thoughts Member"
        initialContext="Writers’ Village"
      />
    </>
  );
}
