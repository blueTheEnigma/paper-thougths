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
  const matchingSoundscape = SOUNDSCAPES.find(s => sunSign.soundscapes?.includes(s.id)) || SOUNDSCAPES[0];

  // Find matching archetypes
  const matchingArchetypeKeys = sunSign.archetypeMatches || ['marathon', 'mood'];
  const matchedArchetypes = matchingArchetypeKeys.map(k => ARCHETYPES[k]).filter(Boolean);

  // Helper to load image for canvas
  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // Generate high-resolution brand-aligned poster image with artworks and trigger download
  const handleDownloadChart = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1450;
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
        { x: 500, y: 1380, r: 1 }
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

      // 5. Draw brand header
      ctx.fillStyle = '#C96A42';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('P A P E R   T H O U G H T S', width / 2, 85);

      // 6. Draw Title: LITERARY NATAL CHART
      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText('LITERARY NATAL CHART', width / 2, 135);

      // Draw main sign name
      ctx.fillStyle = '#F2A98A';
      ctx.font = 'italic bold 42px Georgia, serif';
      ctx.fillText(isCusp ? cuspSignName : `The ${sunSign.name}`, width / 2, 190);

      // Tagline
      ctx.fillStyle = 'rgba(250, 247, 242, 0.8)';
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillText(`"${sunSign.tagline}"`, width / 2, 225);

      // Helper to wrap text
      const wrapText = (text, context, maxW) => {
        if (!text) return [];
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

      // Load images for Sun, Moon, Rising
      const [sunImg, moonImg, risingImg] = await Promise.all([
        loadImage(sunSign.image),
        loadImage(moonSign.image),
        loadImage(risingSign.image)
      ]);

      // 7. Draw Astrological Triad Cards
      const cards = [
        {
          title: '☀️ BOOK SUN',
          name: `The ${sunSign.name}`,
          desc: sunSign.description,
          context: 'Primary Essence: Your core reading taste and official literary identity.',
          img: sunImg,
          x: 75,
        },
        {
          title: '🌙 BOOK MOON',
          name: `The ${moonSign.name}`,
          desc: moonSign.description,
          context: `Inner Driver: What emotionally drives your connection to books (${chosenElement}).`,
          img: moonImg,
          x: 395,
        },
        {
          title: '⬆️ BOOK RISING',
          name: `The ${risingSign.name}`,
          desc: risingSign.description,
          context: `Reading Persona: How you navigate literary realms (${chosenRealm}).`,
          img: risingImg,
          x: 715,
        }
      ];

      const cardW = 290;
      const cardH = 750;
      const cardY = 265;

      cards.forEach(card => {
        // Background card
        ctx.fillStyle = '#FFF5EC';
        ctx.beginPath();
        ctx.roundRect(card.x, cardY, cardW, cardH, 18);
        ctx.fill();

        // Border card
        ctx.strokeStyle = 'rgba(44, 26, 14, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Artwork Image
        if (card.img) {
          ctx.save();
          const imgW = cardW - 32;
          const imgH = 220;
          const imgX = card.x + 16;
          const imgY = cardY + 16;
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 12);
          ctx.clip();
          ctx.drawImage(card.img, imgX, imgY, imgW, imgH);
          ctx.restore();
        }

        // Card Header
        const headerY = cardY + 265;
        ctx.fillStyle = '#5C1A2E';
        ctx.font = 'bold 15px Arial, sans-serif';
        ctx.fillText(card.title, card.x + cardW / 2, headerY);

        // Sign Name
        ctx.fillStyle = '#5C1A2E';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.fillText(card.name, card.x + cardW / 2, headerY + 35);

        // Description lines wrapping
        ctx.fillStyle = '#2C1A0E';
        ctx.font = '13px Georgia, serif';
        const descLines = wrapText(card.desc, ctx, cardW - 40);
        let descY = headerY + 70;
        descLines.slice(0, 8).forEach(line => {
          ctx.fillText(line, card.x + cardW / 2, descY);
          descY += 19;
        });

        // Draw dividing line
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(card.x + 30, cardY + 640);
        ctx.lineTo(card.x + cardW - 30, cardY + 640);
        ctx.stroke();

        // Context Explanation
        ctx.fillStyle = '#C96A42';
        ctx.font = 'italic bold 11px Georgia, serif';
        const contextLines = wrapText(card.context, ctx, cardW - 40);
        let contextY = cardY + 665;
        contextLines.forEach(line => {
          ctx.fillText(line, card.x + cardW / 2, contextY);
          contextY += 16;
        });
      });

      // 8. Draw Details breakdown grid (Element, Realm, House, Medium)
      ctx.fillStyle = 'rgba(255, 245, 236, 0.08)';
      ctx.beginPath();
      ctx.roundRect(75, 1045, 930, 60, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(242, 169, 138, 0.2)';
      ctx.stroke();

      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText(`ELEMENT: ${chosenElement?.toUpperCase()}`, 190, 1081);
      ctx.fillText(`REALM: ${chosenRealm?.toUpperCase()}`, 430, 1081);
      ctx.fillText(`HOUSE: ${chosenHouse?.toUpperCase()}`, 670, 1081);
      ctx.fillText(`MEDIUM: ${chosenMedium?.toUpperCase()}`, 900, 1081);

      // 9. Draw Superpower & Kryptonite
      // Superpower
      ctx.fillStyle = '#FFF5EC';
      ctx.beginPath();
      ctx.roundRect(75, 1130, 450, 125, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('⚡ LITERARY SUPERPOWER', 75 + 225, 1160);
      ctx.fillStyle = '#2C1A0E';
      ctx.font = 'italic 13px Georgia, serif';
      const superpowerLines = wrapText(`"${sunSign.superpower}"`, ctx, 410);
      let spY = 1190;
      superpowerLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, 75 + 225, spY);
        spY += 20;
      });

      // Kryptonite
      ctx.fillStyle = '#FFF5EC';
      ctx.beginPath();
      ctx.roundRect(555, 1130, 450, 125, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#BE123C';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('🥀 LITERARY KRYPTONITE', 555 + 225, 1160);
      ctx.fillStyle = '#2C1A0E';
      ctx.font = 'italic 13px Georgia, serif';
      const kryptoniteLines = wrapText(`"${sunSign.kryptonite}"`, ctx, 410);
      let krY = 1190;
      kryptoniteLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, 555 + 225, krY);
        krY += 20;
      });

      // 10. Draw Footer brand details
      ctx.fillStyle = 'rgba(250, 247, 242, 0.7)';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('DISCOVER YOUR LITERARY ZODIAC CHART AT PAPERTHOUGHTS.ORG', width / 2, 1340);

      // Gold stars decoration
      ctx.fillStyle = '#C5A059';
      ctx.font = '16px Georgia, serif';
      ctx.fillText('❖   ✦   ❖', width / 2, 1375);

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsDownloading(false);
          alert('Failed to generate image blob. Please try again.');
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `paper_thoughts_zodiac_${sunSign.name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        setIsDownloading(false);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error("Zodiac poster generation failed:", err);
      alert("Failed to download zodiac chart poster. Please try again.");
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
        className="bg-gradient-to-b from-[#18050c] via-[#100206] to-[#080103] rounded-3xl p-6 sm:p-10 border-2 border-[#F2A98A]/35 shadow-2xl space-y-10 relative overflow-hidden"
      >
        
        {/* Top Decorative Celestial Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c96a42]/15 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/30 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            ✨ Official Literary Natal Chart
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-cream tracking-tight leading-tight">
            {isCusp ? cuspSignName : `The ${sunSign.name}`}
          </h2>

          <p className="text-lg italic text-[#F2A98A]/90 max-w-xl mx-auto font-serif">
            "{sunSign.tagline}"
          </p>
        </div>

        {/* ASTROLOGICAL TRIAD (Sun, Moon, Rising) - Showcasing Artwork */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* SUN SIGN (Primary Essence) */}
          <div className="bg-[#FFF5EC] rounded-2xl border-2 border-[#C5A059] text-[#2C1A0E] overflow-hidden shadow-2xl flex flex-col justify-between transform md:-translate-y-2 relative">
            <div className="p-4 bg-gradient-to-r from-[#5C1A2E] to-[#7A2040] text-cream flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-amber-200">
                ☀️ Book Sun (Primary)
              </span>
              <span className="text-xl">{sunSign.emoji}</span>
            </div>

            {/* Visual Artwork */}
            {sunSign.image && (
              <div className="w-full aspect-[4/3] overflow-hidden bg-black relative border-b border-[#2C1A0E]/15">
                <img
                  src={sunSign.image}
                  alt={sunSign.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6 space-y-3 flex-grow">
              <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                The {sunSign.name}
              </h3>
              <p className="text-[11px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
                Primary Essence • Score Peak
              </p>
              <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
                {sunSign.description}
              </p>
            </div>
          </div>

          {/* MOON SIGN (Inner Driver) */}
          <div className="bg-[#FFF5EC] rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="p-4 bg-[#2C1A0E] text-cream flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#F2A98A]">
                🌙 Book Moon
              </span>
              <span className="text-xl">{moonSign.emoji}</span>
            </div>

            {/* Visual Artwork */}
            {moonSign.image && (
              <div className="w-full aspect-[4/3] overflow-hidden bg-black relative border-b border-[#2C1A0E]/15">
                <img
                  src={moonSign.image}
                  alt={moonSign.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6 space-y-3 flex-grow">
              <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                The {moonSign.name}
              </h3>
              <p className="text-[11px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
                Inner Reader • {chosenElement} Driven
              </p>
              <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
                {moonSign.description}
              </p>
            </div>
          </div>

          {/* RISING SIGN (Outward Persona) */}
          <div className="bg-[#FFF5EC] rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="p-4 bg-[#2C1A0E] text-cream flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#F2A98A]">
                ⬆️ Book Rising
              </span>
              <span className="text-xl">{risingSign.emoji}</span>
            </div>

            {/* Visual Artwork */}
            {risingSign.image && (
              <div className="w-full aspect-[4/3] overflow-hidden bg-black relative border-b border-[#2C1A0E]/15">
                <img
                  src={risingSign.image}
                  alt={risingSign.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6 space-y-3 flex-grow">
              <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                The {risingSign.name}
              </h3>
              <p className="text-[11px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
                Reading Persona • Inhabits {chosenRealm}
              </p>
              <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
                {risingSign.description}
              </p>
            </div>
          </div>

        </div>

        {/* CHART DETAILS BREAKDOWN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-black/40 rounded-2xl border border-[#F2A98A]/20 text-center text-xs font-mono">
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider text-[11px]">Book Element</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenElement}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider text-[11px]">Book Realm</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenRealm}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider text-[11px]">Story House</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenHouse}</p>
          </div>
          <div className="space-y-1">
            <span className="text-cream/55 uppercase tracking-wider text-[11px]">Story Medium</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenMedium}</p>
          </div>
        </div>

        {/* SUPERPOWER & KRYPTONITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-2 shadow-md">
            <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              ⚡ Literary Superpower
            </span>
            <p className="text-sm leading-relaxed font-serif italic font-medium">
              "{sunSign.superpower}"
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFF5EC] border border-[#2C1A0E]/15 text-[#2C1A0E] space-y-2 shadow-md">
            <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              🥀 Literary Kryptonite
            </span>
            <p className="text-sm leading-relaxed font-serif italic font-medium">
              "{sunSign.kryptonite}"
            </p>
          </div>
        </div>

        {/* MATCHING SOUNDSCAPE BRIDGE */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#5c1a2e]/40 via-[#c96a42]/15 to-[#120308] border border-[#F2A98A]/25 flex flex-col sm:flex-row items-center justify-between gap-6">
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

        {/* MATCHING ARCHETYPES (With New Artwork Thumbnails) */}
        {matchedArchetypes.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#F2A98A] uppercase tracking-wider">
              🎭 Your Matching Reader Archetypes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedArchetypes.slice(0, 2).map((arch) => (
                <Link
                  key={arch.id}
                  href={`/archetype#${arch.id}`}
                  className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-[#F2A98A]/50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-14 h-18 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    <img
                      src={arch.image}
                      alt={arch.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h5 className="text-base font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors flex items-center gap-1.5">
                      <span>{arch.emoji}</span>
                      <span>{arch.name}</span>
                    </h5>
                    <p className="text-xs text-cream/70 italic font-serif mt-0.5 line-clamp-1">
                      "{arch.tagline}"
                    </p>
                    <span className="text-[11px] font-mono text-[#F2A98A]/80 mt-1 inline-block">
                      View Archetype Poster →
                    </span>
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
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-base shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isDownloading ? 'Composing High-Res Poster...' : 'Download Chart Poster'}</span>
            <span>📥</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-cream/90 hover:text-cream text-base font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Share Results</span>
            <span>📲</span>
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
