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

  // Robust image loader for canvas drawing
  const loadImage = (src) => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("Could not load image for canvas:", src);
        resolve(null);
      };
      img.src = src;
    });
  };

  // Helper to wrap text on canvas
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

  // Generate high-resolution celestial grimoire poster image and trigger download
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

      // 1. Background: Deep rich Burgundy-to-Midnight radial gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 900);
      bgGrad.addColorStop(0, '#240810');
      bgGrad.addColorStop(0.65, '#0E0206');
      bgGrad.addColorStop(1, '#040002');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Celestial Gold Dust Particles
      const stars = [
        { x: 90, y: 110, r: 1.5, a: 0.7 },
        { x: 260, y: 70, r: 1, a: 0.5 },
        { x: 820, y: 90, r: 2, a: 0.8 },
        { x: 980, y: 180, r: 1.2, a: 0.6 },
        { x: 120, y: 920, r: 1.5, a: 0.5 },
        { x: 960, y: 940, r: 2, a: 0.7 },
        { x: 540, y: 1390, r: 1.5, a: 0.9 },
        { x: 300, y: 1370, r: 1.2, a: 0.6 },
        { x: 780, y: 1360, r: 1.4, a: 0.6 }
      ];
      stars.forEach(s => {
        ctx.fillStyle = `rgba(242, 169, 138, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Ornate Double Gold Borders
      // Outer Gold border
      ctx.strokeStyle = '#FAF7F2';
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, width - 56, height - 56);

      // Inner Gold filigree border
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(38, 38, width - 76, height - 76);

      // Corner flourishes
      const drawCorner = (cx, cy, flipX, flipY) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.strokeStyle = '#C5A059';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.restore();
      };
      drawCorner(44, 44, false, false);
      drawCorner(width - 44, 44, true, false);
      drawCorner(44, height - 44, false, true);
      drawCorner(width - 44, height - 44, true, true);

      // 4. Header Section
      ctx.fillStyle = '#C5A059';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('P A P E R   T H O U G H T S', width / 2, 75);

      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText('LITERARY NATAL CHART', width / 2, 120);

      ctx.fillStyle = '#F2A98A';
      ctx.font = 'italic bold 38px Georgia, serif';
      ctx.fillText(isCusp ? cuspSignName : `The ${sunSign.name}`, width / 2, 168);

      ctx.fillStyle = 'rgba(250, 247, 242, 0.85)';
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillText(`“${sunSign.tagline}”`, width / 2, 202);

      // 5. Preload artworks
      const [sunImg, moonImg, risingImg] = await Promise.all([
        loadImage(sunSign.image),
        loadImage(moonSign.image),
        loadImage(risingSign.image)
      ]);

      // 6. Astrological Triad Cards
      const triadCards = [
        {
          badge: '☀️ BOOK SUN',
          name: `The ${sunSign.name}`,
          tag: 'Primary Essence',
          desc: sunSign.description,
          sub: `Official Identity • ${sunSign.emoji}`,
          img: sunImg,
          x: 52,
          isPrimary: true
        },
        {
          badge: '🌙 BOOK MOON',
          name: `The ${moonSign.name}`,
          tag: 'Inner Driver',
          desc: moonSign.description,
          sub: `Emotional Reader • ${chosenElement}`,
          img: moonImg,
          x: 388,
          isPrimary: false
        },
        {
          badge: '⬆️ BOOK RISING',
          name: `The ${risingSign.name}`,
          tag: 'Reading Persona',
          desc: risingSign.description,
          sub: `Outward Style • ${chosenRealm}`,
          img: risingImg,
          x: 724,
          isPrimary: false
        }
      ];

      const cardW = 304;
      const cardH = 635;
      const cardY = 228;

      triadCards.forEach((card) => {
        // Card Background (Parchment)
        ctx.fillStyle = '#FFF5EC';
        ctx.beginPath();
        ctx.roundRect(card.x, cardY, cardW, cardH, 20);
        ctx.fill();

        // Card Border
        ctx.strokeStyle = card.isPrimary ? '#C5A059' : 'rgba(44, 26, 14, 0.2)';
        ctx.lineWidth = card.isPrimary ? 2.5 : 1.5;
        ctx.stroke();

        // Card Header Banner
        ctx.fillStyle = card.isPrimary ? '#5C1A2E' : '#2C1A0E';
        ctx.beginPath();
        ctx.roundRect(card.x, cardY, cardW, 46, [20, 20, 0, 0]);
        ctx.fill();

        ctx.fillStyle = card.isPrimary ? '#F2A98A' : '#FAF7F2';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(card.badge, card.x + cardW / 2, cardY + 28);

        // Artwork Image or Fallback Astrological Seal
        const imgX = card.x + 16;
        const imgY = cardY + 58;
        const imgW = cardW - 32;
        const imgH = 200;

        if (card.img) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 12);
          ctx.clip();
          ctx.drawImage(card.img, imgX, imgY, imgW, imgH);
          ctx.restore();

          // Image inner border
          ctx.strokeStyle = 'rgba(44, 26, 14, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 12);
          ctx.stroke();
        } else {
          // Fallback Seal
          ctx.fillStyle = '#1A060E';
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 12);
          ctx.fill();

          ctx.fillStyle = '#F2A98A';
          ctx.font = 'bold 36px Georgia, serif';
          ctx.fillText('✦', card.x + cardW / 2, imgY + 110);
        }

        // Sign Name
        ctx.fillStyle = '#5C1A2E';
        ctx.font = 'bold 22px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(card.name, card.x + cardW / 2, cardY + 295);

        // Role Subtitle
        ctx.fillStyle = '#C96A42';
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.fillText(card.tag.toUpperCase(), card.x + cardW / 2, cardY + 316);

        // Description Paragraph
        ctx.fillStyle = '#2C1A0E';
        ctx.font = '13px Georgia, serif';
        const descLines = wrapText(card.desc, ctx, cardW - 36);
        let textY = cardY + 348;
        descLines.slice(0, 8).forEach(line => {
          ctx.fillText(line, card.x + cardW / 2, textY);
          textY += 19;
        });

        // Bottom Talisman Badge Inside Card
        const badgeY = cardY + cardH - 52;
        ctx.fillStyle = 'rgba(92, 26, 46, 0.08)';
        ctx.beginPath();
        ctx.roundRect(card.x + 16, badgeY, cardW - 32, 34, 10);
        ctx.fill();

        ctx.strokeStyle = 'rgba(201, 106, 66, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#5C1A2E';
        ctx.font = 'italic bold 11px Georgia, serif';
        ctx.fillText(card.sub, card.x + cardW / 2, badgeY + 22);
      });

      // 7. Middle Celestial Talisman Badges (Element, Realm, House, Medium)
      const talismanY = 885;
      const talismans = [
        { label: 'ELEMENT', val: chosenElement },
        { label: 'REALM', val: chosenRealm },
        { label: 'HOUSE', val: chosenHouse },
        { label: 'MEDIUM', val: chosenMedium }
      ];

      const talW = 226;
      const talH = 58;
      const talGap = 16;
      const talStartX = 52;

      talismans.forEach((t, i) => {
        const tx = talStartX + i * (talW + talGap);

        ctx.fillStyle = 'rgba(255, 245, 236, 0.08)';
        ctx.beginPath();
        ctx.roundRect(tx, talismanY, talW, talH, 12);
        ctx.fill();

        ctx.strokeStyle = 'rgba(242, 169, 138, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(250, 247, 242, 0.65)';
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.label, tx + talW / 2, talismanY + 23);

        ctx.fillStyle = '#F2A98A';
        ctx.font = 'bold 13px Georgia, serif';
        const displayVal = t.val.length > 20 ? t.val.substring(0, 18) + '…' : t.val;
        ctx.fillText(displayVal, tx + talW / 2, talismanY + 44);
      });

      // 8. Superpower & Kryptonite Dual Parchment Cards
      const superY = 965;
      const superW = 472;
      const superH = 115;

      // Superpower Card
      ctx.fillStyle = '#FFF5EC';
      ctx.beginPath();
      ctx.roundRect(52, superY, superW, superH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ LITERARY SUPERPOWER', 52 + superW / 2, superY + 28);

      ctx.fillStyle = '#2C1A0E';
      ctx.font = 'italic 13px Georgia, serif';
      const spLines = wrapText(`“${sunSign.superpower}”`, ctx, superW - 40);
      let spy = superY + 56;
      spLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, 52 + superW / 2, spy);
        spy += 20;
      });

      // Kryptonite Card
      ctx.fillStyle = '#FFF5EC';
      ctx.beginPath();
      ctx.roundRect(556, superY, superW, superH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(44, 26, 14, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#BE123C';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🥀 LITERARY KRYPTONITE', 556 + superW / 2, superY + 28);

      ctx.fillStyle = '#2C1A0E';
      ctx.font = 'italic 13px Georgia, serif';
      const krLines = wrapText(`“${sunSign.kryptonite}”`, ctx, superW - 40);
      let kry = superY + 56;
      krLines.slice(0, 2).forEach(line => {
        ctx.fillText(line, 556 + superW / 2, kry);
        kry += 20;
      });

      // 9. Footer Brand & Celestial Seals
      ctx.fillStyle = '#C5A059';
      ctx.font = '16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('❖   ✦   ❖', width / 2, 1370);

      ctx.fillStyle = 'rgba(250, 247, 242, 0.75)';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('DISCOVER YOUR LITERARY ZODIAC CHART AT PAPERTHOUGHTS.ORG', width / 2, 1400);

      // 10. Output blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsDownloading(false);
          alert('Failed to generate image. Please try again.');
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
      alert("Failed to download chart poster. Please try again.");
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
        className="bg-gradient-to-b from-[#1c060e] via-[#100206] to-[#080103] rounded-3xl p-6 sm:p-10 border-2 border-[#F2A98A]/35 shadow-2xl space-y-10 relative overflow-hidden"
      >
        
        {/* Top Decorative Celestial Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c96a42]/15 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] text-xs font-bold uppercase tracking-wider">
            ✨ Official Literary Natal Chart
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-cream tracking-tight leading-tight">
            {isCusp ? cuspSignName : `The ${sunSign.name}`}
          </h2>

          <p className="text-lg italic text-[#F2A98A]/90 max-w-xl mx-auto font-serif">
            "{sunSign.tagline}"
          </p>
        </div>

        {/* ASTROLOGICAL TRIAD (Sun, Moon, Rising) - Tight, Gorgeous Tarot Proportions */}
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
            
            <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                  The {sunSign.name}
                </h3>
                <p className="text-[11px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
                  Primary Essence • Official Identity
                </p>
                <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
                  {sunSign.description}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-[#2C1A0E]/10 flex items-center justify-between text-xs font-mono text-[#5C1A2E]">
                <span className="font-bold">✨ Core Power:</span>
                <span className="italic font-serif truncate max-w-[170px]">{sunSign.superpower}</span>
              </div>
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
            
            <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-[#5C1A2E]">
                  The {moonSign.name}
                </h3>
                <p className="text-[11px] text-[#2C1A0E]/60 font-mono font-bold uppercase tracking-wider">
                  Inner Driver • {chosenElement} Driven
                </p>
                <p className="text-sm text-[#2C1A0E]/85 leading-relaxed font-serif pt-1">
                  {moonSign.description}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-[#2C1A0E]/10 flex items-center justify-between text-xs font-mono text-[#2C1A0E]/70">
                <span className="font-bold">Element:</span>
                <span className="font-serif italic font-bold text-[#C96A42]">{chosenElement}</span>
              </div>
            </div>
          </div>

          {/* RISING SIGN (Reading Persona) */}
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
            
            <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
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

              <div className="pt-4 mt-2 border-t border-[#2C1A0E]/10 flex items-center justify-between text-xs font-mono text-[#2C1A0E]/70">
                <span className="font-bold">Realm:</span>
                <span className="font-serif italic font-bold text-[#C96A42]">{chosenRealm}</span>
              </div>
            </div>
          </div>

        </div>

        {/* CHART DETAILS TALISMAN BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-black/40 rounded-2xl border border-[#F2A98A]/20 text-center text-xs font-mono">
          <div className="space-y-1 p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-cream/55 uppercase tracking-wider text-[10px] block">Book Element</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenElement}</p>
          </div>
          <div className="space-y-1 p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-cream/55 uppercase tracking-wider text-[10px] block">Book Realm</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenRealm}</p>
          </div>
          <div className="space-y-1 p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-cream/55 uppercase tracking-wider text-[10px] block">Story House</span>
            <p className="text-sm font-bold text-[#F2A98A]">{chosenHouse}</p>
          </div>
          <div className="space-y-1 p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-cream/55 uppercase tracking-wider text-[10px] block">Story Medium</span>
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

        {/* MATCHING ARCHETYPES */}
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
            type="button"
            onClick={handleDownloadChart}
            disabled={isDownloading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-base shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isDownloading ? 'Composing High-Res Poster...' : 'Download Chart Poster'}</span>
            <span>📥</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-cream/90 hover:text-cream text-base font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Share Results</span>
            <span>📲</span>
          </button>

          <button
            type="button"
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
