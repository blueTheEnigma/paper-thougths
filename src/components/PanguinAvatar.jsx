"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { getAvatarStage } from '@/lib/avatar';

export default function PanguinAvatar({ lifetimeLeaves, variant = "compact", className = "" }) {
  const stage = getAvatarStage(lifetimeLeaves);
  const [showTooltip, setShowTooltip] = useState(false);

  // Variant "icon": Just the image, tiny.
  if (variant === "icon") {
    return (
      <div 
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-sage/30 bg-cream/80 flex items-center justify-center">
          <Image src={stage.image} alt={stage.name} width={32} height={32} className="object-cover" />
        </div>
        {showTooltip && (
          <div className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 bg-ink text-cream text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-lg">
            {stage.name} • {lifetimeLeaves || 0} 🍃
          </div>
        )}
      </div>
    );
  }

  // Variant "compact": Image + small stage badge (used in discussion/village)
  if (variant === "compact") {
    return (
      <div 
        className={`flex items-center gap-2.5 ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sage/30 bg-cream shadow-sm flex-shrink-0 relative">
          <Image src={stage.image} alt={stage.name} fill sizes="40px" className="object-cover" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-burgundy bg-burgundy/10 px-1.5 py-0.5 rounded-sm inline-block mb-0.5">
            {stage.name}
          </span>
        </div>
        
        {showTooltip && stage.nextStage && (
          <div className="absolute z-50 mt-12 left-auto bg-ink text-cream text-[10px] py-2 px-3 rounded shadow-xl border border-sage/20 whitespace-nowrap">
            <div className="font-bold mb-1 text-accent">{lifetimeLeaves || 0} Lifetime Leaves</div>
            <div className="text-cream/80">{stage.leavesToNext} more to {stage.nextStage}</div>
          </div>
        )}
      </div>
    );
  }

  // Variant "full": Large image, stage name, and full progress bar (used on dashboard)
  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 ${className}`}>
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-cream flex-shrink-0 relative">
        <Image src={stage.image} alt={stage.name} fill sizes="(max-width: 640px) 96px, 112px" className="object-cover" />
      </div>
      <div className="flex flex-col flex-1 w-full max-w-xs text-center sm:text-left">
        <div className="flex items-baseline justify-center sm:justify-start gap-2 mb-1">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink/40">Archive Status</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-burgundy mb-2.5">{stage.name}</h3>
        
        {stage.nextStage ? (
          <div className="space-y-2">
            <div className="w-full bg-sage/15 rounded-full h-2 overflow-hidden border border-sage/10">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-1000 relative overflow-hidden" 
                style={{ width: `${stage.progress}%` }}
              >
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20" style={{ transform: 'skewX(-20deg)', animation: 'shimmer 2s infinite' }}></div>
              </div>
            </div>
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-ink/50">
              <span>{lifetimeLeaves || 0} 🍃</span>
              <span>{stage.leavesToNext} to {stage.nextStage}</span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent mt-1 bg-accent/10 px-3 py-1.5 rounded-full inline-block">
            Maximum Evolution Reached 🌟
          </div>
        )}
      </div>
    </div>
  );
}
