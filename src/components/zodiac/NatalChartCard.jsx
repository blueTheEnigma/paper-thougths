'use client';

import { useState } from 'react';
import Link from 'next/link';
import ZodiacShareModal from './ZodiacShareModal';
import { SOUNDSCAPES } from '../../lib/soundscapesData';
import { ARCHETYPES } from '../../lib/archetypesData';

export default function NatalChartCard({ chartResult, onRetake }) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { sunSign, moonSign, risingSign, isCusp, cuspSignName, chosenElement, chosenRealm, chosenHouse, chosenMedium } = chartResult;

  // Find matching soundscape
  const matchingSoundscape = SOUNDSCAPES.find(s => sunSign.soundscapes.includes(s.id)) || SOUNDSCAPES[0];

  // Find matching archetypes
  const matchingArchetypeKeys = sunSign.archetypeMatches || ['marathon', 'mood'];
  const matchedArchetypes = matchingArchetypeKeys.map(k => ARCHETYPES[k]).filter(Boolean);

  // Generate high-resolution brand-aligned poster image and trigger download
  const handleDownloadChart = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Draw rich dark burgundy gradient background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
      bgGrad.addColorStop(0, '#20070E');
      bgGrad.addColorStop(0.7, '#0D0205');
      bgGrad.addColorStop(1, '#050002');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw ambient starry sky speck particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const stars = [
        { x: 100, y: 150, r: 1.5 },
        { x: 300, y: 80, r: 1 },
        { x: 800, y: 120, r: 2 },
        { x: 950, y: 220, r: 1 },
        { x: 150, y: 1100, r: 1.5 },
        { x: 920, y: 1150, r: 2 },
        { x: 500, y: 1280, r: 1 }
      ];
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw outer gold border (inset 24px, thickness 3px)
      ctx.strokeStyle = '#FAF7F2';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, width - 48, height - 48);

      // 4. Draw inner gold border (inset 34px, thickness 1px)
      ctx.strokeStyle = '#C96A42';
      ctx.lineWidth = 1;
      ctx.strokeRect(34, 34, width - 68, height - 68);

      // 5. Draw brand logo at the top
      ctx.fillStyle = '#FAF7F2';
      // Left book: X = 515, Y = 68, W = 8, H = 30
      ctx.beginPath();
      ctx.roundRect(515, 68, 8, 30, [4, 4, 0, 0]);
      ctx.fill();
      // Left head: cx = 519, cy = 54, r = 4
      ctx.beginPath();
      ctx.arc(519, 54, 4, 0, Math.PI * 2);
      ctx.fill();

      // Center book: X = 528, Y = 61, W = 8, H = 37
      ctx.beginPath();
      ctx.roundRect(528, 61, 8, 37, [4, 4, 0, 0]);
      ctx.fill();
      // Center head: cx = 532, cy = 47, r = 4.5
      ctx.beginPath();
      ctx.arc(532, 47, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Right book: X = 541, Y = 68, W = 8, H = 30
      ctx.beginPath();
      ctx.roundRect(541, 68, 8, 30, [4, 4, 0, 0]);
      ctx.fill();
      // Right head: cx = 545, cy = 54, r = 4
      ctx.beginPath();
      ctx.arc(545, 54, 4, 0, Math.PI * 2);
      ctx.fill();

      // Gold Ribbon: X = 534, Y = 98
      ctx.fillStyle = '#C96A42';
      ctx.beginPath();
      ctx.moveTo(534, 98);
      ctx.lineTo(534, 102);
      ctx.lineTo(536, 100);
      ctx.lineTo(538, 102);
      ctx.lineTo(538, 98);
      ctx.closePath();
      ctx.fill();

      // 6. Draw Brand Header text
      ctx.fillStyle = '#C96A42';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('P A P E R   T H O U G H T S', width / 2, 130);

      // 7. Draw Title: LITERARY NATAL CHART
      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText('LITERARY NATAL CHART', width / 2, 185);

      // Draw main sign name
      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'italic bold 44px Georgia, serif';
      ctx.fillText(isCusp ? cuspSignName : `The ${sunSign.name}`, width / 2, 245);

      // Helper to wrap text
      const wrapText = (text, context, maxW) => {
        const words = text.split(' ');
        if (words.length <= 1) return [text];
        const lines = [];
        let current = words[0];
        for (let i = 1; i < words.length; i++) {
          const w = words[i];
          if (context.measureText(current + ' ' + w).width < maxW) {
            current += ' ' + w;
          } else {
            lines.push(current);
            current = w;
          }
        }
        lines.push(current);
        return lines;
      };

      // 8. Draw Astrological Triad Cards (Sun, Moon, Rising)
      const cards = [
        {
          title: '☀️ BOOK SUN',
          name: `The ${sunSign.name}`,
          desc: sunSign.description,
          context: 'Primary Essence: Your core reading taste and official literary identity.',
          x: 90,
        },
        {
          title: '🌙 BOOK MOON',
          name: `The ${moonSign.name}`,
          desc: moonSign.description,
          context: `Inner Driver: What emotionally drives your connection to books (${chosenElement}).`,
          x: 400,
        },
        {
          title: '⬆️ BOOK RISING',
          name: `The ${risingSign.name}`,
          desc: risingSign.description,
          context: `Reading Persona: How you navigate the literary realms (${chosenRealm}).`,
          x: 710,
        }
      ];

      const cardW = 280;
      const cardH = 650;
      const cardY = 300;

      cards.forEach(card => {
        // Background card
        ctx.fillStyle = '#FFF5EC';
        ctx.beginPath();
        ctx.roundRect(card.x, cardY, cardW, cardH, 16);
        ctx.fill();

        // Border card
        ctx.strokeStyle = 'rgba(44, 26, 14, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Top Tape Accent (masking tape look)
        ctx.fillStyle = 'rgba(197, 160, 89, 0.2)';
        ctx.save();
        ctx.translate(card.x + cardW / 2, cardY + 5);
        ctx.rotate(0.02 * (card.x === 400 ? -1 : 1));
        ctx.fillRect(-50, -15, 100, 20);
        ctx.restore();

        // Card Header
        ctx.fillStyle = '#5C1A2E';
        ctx.font = 'bold 15px Arial, sans-serif';
        ctx.fillText(card.title, card.x + cardW / 2, cardY + 55);

        // Sign Name
        ctx.fillStyle = '#5C1A2E';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.fillText(card.name, card.x + cardW / 2, cardY + 95);

        // Description lines wrapping
        ctx.fillStyle = '#2C1A0E';
        ctx.font = '14px Georgia, serif';
        const descLines = wrapText(card.desc, ctx, cardW - 40);
        let descY = cardY + 140;
        descLines.slice(0, 8).forEach(line => {
          ctx.fillText(line, card.x + cardW / 2, descY);
          descY += 22;
        });

        // Draw dividing line
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(card.x + 30, cardY + 480);
        ctx.lineTo(card.x + cardW - 30, cardY + 480);
        ctx.stroke();

        // Draw Context Explanation (giving context for people outside the community!)
        ctx.fillStyle = '#C96A42';
        ctx.font = 'italic bold 11px Georgia, serif';
        const contextLines = wrapText(card.context, ctx, cardW - 40);
        let contextY = cardY + 510;
        contextLines.forEach(line => {
          ctx.fillText(line, card.x + cardW / 2, contextY);
          contextY += 16;
        });
      });

      // 9. Draw Details breakdown grid (Element, Realm, House, Medium)
      ctx.fillStyle = 'rgba(255, 245, 236, 0.08)';
      ctx.beginPath();
      ctx.roundRect(90, 980, 900, 60, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(242, 169, 138, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText(`ELEMENT: ${chosenElement.toUpperCase()}`, 200, 1016);
      ctx.fillText(`REALM: ${chosenRealm.toUpperCase()}`, 430, 1016);
      ctx.fillText(`HOUSE: ${chosenHouse.toUpperCase()}`, 660, 1016);
      ctx.fillText(`MEDIUM: ${chosenMedium.toUpperCase()}`, 880, 1016);

      // 10. Draw Superpower & Kryptonite
      // Superpower
      ctx.fillStyle = '#FFF5EC';
      ctx.beginPath();
      ctx.roundRect(90, 1070, 430, 120, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.12)';
      ctx.stroke();

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('⚡ LITERARY SUPERPOWER', 90 + 215, 1100);
      ctx.fillStyle = '#2C1A0E';
      ctx.font = 'italic 13px Georgia, serif';
      const superpowerLines = wrapText(`"${sunSign.superpower}"`, ctx, 390);
      let spY = 1130;
      superpowerLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, 90 + 215, spY);
        spY += 20;
      });

      // Kryptonite
      ctx.fillStyle = '#FFF5EC';
      ctx.beginPath();
      ctx.roundRect(560, 1070, 430, 120, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.12)';
      ctx.stroke();

      ctx.fillStyle = '#BE123C';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('🥀 LITERARY KRYPTONITE', 560 + 215, 1100);
      ctx.fillStyle = '#2C1A0E';
      ctx.font = 'italic 13px Georgia, serif';
      const kryptoniteLines = wrapText(`"${sunSign.kryptonite}"`, ctx, 390);
      let krY = 1130;
      kryptoniteLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, 560 + 215, krY);
        krY += 20;
      });

      // 11. Draw Footer brand details
      ctx.fillStyle = 'rgba(250, 247, 242, 0.6)';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('DISCOVER YOUR LITERARY ZODIAC CHART AT PAPERTHOUGHTS.ORG', width / 2, 1260);

      // Gold ribbon hanging at the very bottom
      ctx.fillStyle = '#C5A059';
      ctx.font = '16px Georgia, serif';
      ctx.fillText('❖   ✦   ❖', width / 2, 1295);

      // Trigger download link
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `paper_thoughts_zodiac_${sunSign.name.toLowerCase()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Zodiac poster generation failed:", err);
      alert("Failed to download zodiac chart poster. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">

      {/* Share Modal */}
      {isShareModalOpen && (
        <ZodiacShareModal chartResult={chartResult} onClose={() => setIsShareModalOpen(false)} />
      )}

      {/* MAIN NATAL CHART CARD */}
      <div 
        className="bg-gradient-to-b from-[#120308] via-[#0d0205]/95 to-black/95 rounded-3xl p-6 sm:p-10 border border-[#F2A98A]/35 shadow-2xl space-y-10 relative overflow-hidden"
      >
        
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c96a42]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            ✨ Official Literary Natal Chart
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-cream tracking-tight leading-tight">
            {isCusp ? cuspSignName : `The ${sunSign.name}`}
          </h2>

          <p className="text-lg italic text-cream/80 max-w-xl mx-auto font-serif">
            "{sunSign.tagline}"
          </p>
        </div>

        {/* ASTROLOGICAL TRIAD (Sun, Moon, Rising) - Styled as Pinned parchment cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* SUN SIGN */}
          <div className="bg-[#FFF5EC] p-6 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-3 relative shadow-md">
            {/* Taped overlay ornament */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#C5A059]/20 transform rotate-1 border-l border-r border-[#C5A059]/30" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-[#5C1A2E] uppercase tracking-wider">
                ☀️ Book Sun
              </span>
              <span className="text-3xl">{sunSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#5C1A2E]">
              The {sunSign.name}
            </h3>
            <p className="text-[10px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
              Primary Essence • Score Peak
            </p>
            <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
              {sunSign.description}
            </p>
          </div>

          {/* MOON SIGN */}
          <div className="bg-[#FFF5EC] p-6 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-3 relative shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#C5A059]/20 transform -rotate-1 border-l border-r border-[#C5A059]/30" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-[#5C1A2E] uppercase tracking-wider">
                🌙 Book Moon
              </span>
              <span className="text-3xl">{moonSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#5C1A2E]">
              The {moonSign.name}
            </h3>
            <p className="text-[10px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
              Inner Reader • {chosenElement} Driven
            </p>
            <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
              {moonSign.description}
            </p>
          </div>

          {/* RISING SIGN */}
          <div className="bg-[#FFF5EC] p-6 rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-3 relative shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#C5A059]/20 transform rotate-2 border-l border-r border-[#C5A059]/30" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-[#5C1A2E] uppercase tracking-wider">
                ⬆️ Book Rising
              </span>
              <span className="text-3xl">{risingSign.emoji}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#5C1A2E]">
              The {risingSign.name}
            </h3>
            <p className="text-[10px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
              Reading Persona • Inhabits {chosenRealm}
            </p>
            <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
              {risingSign.description}
            </p>
          </div>

        </div>

        {/* CHART DETAILS BREAKDOWN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-[#FFF5EC]/10 rounded-2xl border border-[#F2A98A]/15 text-center text-xs font-mono">
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Book Element</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenElement}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Book Realm</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenRealm}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Story House</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenHouse}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider">Story Medium</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenMedium}</p>
          </div>
        </div>

        {/* SUPERPOWER & KRYPTONITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-2 shadow-md">
            <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
              ⚡ Literary Superpower
            </span>
            <p className="text-sm leading-relaxed font-serif italic font-medium">
              "{sunSign.superpower}"
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-2 shadow-md">
            <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
              🥀 Literary Kryptonite
            </span>
            <p className="text-sm leading-relaxed font-serif italic font-medium">
              "{sunSign.kryptonite}"
            </p>
          </div>
        </div>

        {/* MATCHING SOUNDSCAPE BRIDGE */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#5c1a2e]/30 via-[#c96a42]/10 to-[#120308] border border-[#F2A98A]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-mono font-bold text-[#F2A98A] uppercase tracking-wider">
              🎧 Curated Reading Soundscape Match
            </div>
            <h4 className="text-xl font-serif font-bold text-cream flex items-center justify-center sm:justify-start gap-2">
              <span>{matchingSoundscape.emoji}</span>
              <span>{matchingSoundscape.title}</span>
            </h4>
            <p className="text-xs text-cream/70 font-serif italic">{matchingSoundscape.vibe}</p>
          </div>

          <Link
            href={`/soundscapes#${matchingSoundscape.id}`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Press Play on Spotify 🎵
          </Link>
        </div>

        {/* MATCHING ARCHETYPES */}
        {matchedArchetypes.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#F2A98A]/80 uppercase tracking-wider">
              🎭 Your Matching Reader Archetypes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedArchetypes.slice(0, 2).map((arch) => (
                <Link
                  key={arch.id}
                  href={`/archetype#${arch.id}`}
                  className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-[#F2A98A]/40 transition-all flex items-center gap-4 group"
                >
                  <span className="text-3xl">{arch.emoji}</span>
                  <div>
                    <h5 className="text-base font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors">
                      {arch.name}
                    </h5>
                    <p className="text-xs text-cream/60 italic font-serif mt-0.5">"{arch.tagline}"</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/10">
          <button
            onClick={handleDownloadChart}
            disabled={isDownloading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-base shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? 'Generating Poster...' : 'Download Chart Poster 📥'}
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-cream/80 hover:text-cream text-base font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            Share Results 📲
          </button>

          <button
            onClick={onRetake}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-950 border border-white/10 hover:bg-slate-900 text-cream/70 hover:text-cream text-sm font-semibold transition-all cursor-pointer"
          >
            Retake Quiz 🔄
          </button>
        </div>

      </div>
    </div>
  );
}
