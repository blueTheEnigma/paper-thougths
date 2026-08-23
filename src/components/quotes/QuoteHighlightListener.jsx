"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuoteHighlightListener() {
  const [selectedText, setSelectedText] = useState('');
  const [coords, setCoords] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setCoords(null);
        return;
      }

      const text = selection.toString().trim();
      // Trigger for clean sentence excerpts
      if (text.length >= 12 && text.length <= 320) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
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

  const handleCopy = () => {
    if (!selectedText) return;
    const cleanText = `“${selectedText.replace(/^["“]|["”]$/g, '').trim()}”\n\n— Paper Thoughts • We live in the lines`;
    navigator.clipboard.writeText(cleanText);
    setCopied(true);

    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#F2A98A', '#5C1A2E', '#C96A42']
    });

    setTimeout(() => {
      setCopied(false);
      setCoords(null);
    }, 1800);
  };

  return (
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
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-full bg-[#120308] border border-[#F2A98A]/50 text-[#F2A98A] text-[11px] font-mono font-bold uppercase tracking-wider shadow-2xl backdrop-blur-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-[#c96a42]/30"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-400" />
                <span className="text-green-300">Spark Saved!</span>
              </>
            ) : (
              <>
                <Sparkles size={12} className="text-[#F2A98A] animate-pulse" />
                <span>Save Spark</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
