"use client";
import { useState } from 'react';

export default function GlobalLoading() {
  const [quote] = useState(() => {
    const quotesList = [
      "“A room without books is like a body without a soul.” — Marcus Tullius Cicero",
      "“I have always imagined that Paradise will be a kind of a library.” — Jorge Luis Borges",
      "“Books are a uniquely portable magic.” — Stephen King",
      "“There is no friend as loyal as a book.” — Ernest Hemingway",
      "“Reading is a conversation. All books talk. But a good book listens as well.” — Mark Haddon",
      "“To read is to voyage through time and space.”",
      "“We live in the lines.” — Paper Thoughts"
    ];
    return quotesList[Math.floor(Math.random() * quotesList.length)];
  });

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-[#FFF5EC] z-[9999] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center max-w-md gap-5">
        
        {/* Refined, smaller and more elegant Sailor's Wheel */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-accent/5 rounded-full blur-lg animate-pulse" />
          <svg 
            className="w-20 h-20 animate-spin text-burgundy relative z-10 overflow-visible" 
            viewBox="0 0 100 100" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            style={{ animationDuration: '6s' }}
          >
            <circle cx="50" cy="50" r="10" />
            <circle cx="50" cy="50" r="4" fill="currentColor" />
            <circle cx="50" cy="50" r="30" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="20" strokeWidth="1.2" strokeDasharray="4 2" />
            <line x1="50" y1="10" x2="50" y2="90" />
            <line x1="10" y1="50" x2="90" y2="50" />
            <line x1="22" y1="22" x2="78" y2="78" />
            <line x1="22" y1="78" x2="78" y2="22" />
            <line x1="50" y1="20" x2="50" y2="2" strokeWidth="5" />
            <line x1="50" y1="80" x2="50" y2="98" strokeWidth="5" />
            <line x1="20" y1="50" x2="2" y2="50" strokeWidth="5" />
            <line x1="80" y1="50" x2="98" y2="50" strokeWidth="5" />
            <line x1="29" y1="29" x2="16" y2="16" strokeWidth="5" />
            <line x1="71" y1="71" x2="84" y2="84" strokeWidth="5" />
            <line x1="29" y1="71" x2="16" y2="84" strokeWidth="5" />
            <line x1="71" y1="29" x2="84" y2="16" strokeWidth="5" />
          </svg>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-ink/40">Unlocking the Archive</h4>
          <p className="text-xs sm:text-sm text-burgundy font-quote italic leading-relaxed px-6">
            {quote}
          </p>
        </div>
      </div>
    </div>
  );
}
