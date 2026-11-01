"use client";

import React, { useState } from 'react';
import { Download, Copy, Check, RotateCw, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { ARCHETYPES } from '@/lib/archetypesData';
import { SIGNS } from '@/lib/zodiacData';

// Resolve archetype or zodiac title cleanly
export const formatAuthorBadge = (val) => {
  if (!val) return null;
  const raw = String(val).trim();
  const lower = raw.toLowerCase();
  if (['writer', 'member', 'reader', 'author'].includes(lower)) return null;
  
  if (ARCHETYPES[lower]) return ARCHETYPES[lower].name;
  if (ARCHETYPES[raw]) return ARCHETYPES[raw].name;
  
  const signMatch = SIGNS[raw] || Object.values(SIGNS).find(s => s.name.toLowerCase() === lower);
  if (signMatch) return `${signMatch.name} (Zodiac)`;
  
  return raw;
};

// Exportable High-Resolution 1080x1350 PNG Exporter using HTML5 Canvas (Instagram Carousel 4:5 Ready)
export const exportLaureateCardPNG = async ({
  face = 'front', // 'front' | 'back'
  category = 'Short Story',
  rank = 1,
  title = "Untitled Manuscript",
  authorName = "Paper Thoughts Author",
  authorArchetype = null,
  chapterName = "Sanctuary",
  monthYear = "October 2026",
  editorCitation = "A masterclass in narrative tension and evocative sentence craft.",
  editorName = "Ufuoma Morgan"
}) => {
  if (typeof document === 'undefined') return;

  const ordinalRank = rank === 1 ? '1st Place' : rank === 2 ? '2nd Place' : '3rd Place';
  const categoryLabel = category === 'poem' || category === 'Poetry' ? 'Poem' : 'Short Story';

  const formatMonthName = (my) => {
    if (!my) return 'October 2026';
    if (my.includes('-')) {
      const [y, m] = my.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    return my;
  };

  const monthDisplay = formatMonthName(monthYear);
  const formattedArchetype = formatAuthorBadge(authorArchetype);
  const chapterByline = formattedArchetype 
    ? `${chapterName} Chapter · ${formattedArchetype}` 
    : `${chapterName} Chapter`;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  // Text wrapping helper
  const wrapLines = (text, maxWidth, font) => {
    ctx.font = font;
    const words = String(text || '').trim().split(/\s+/);
    const lines = [];
    let cur = '';
    for (let i = 0; i < words.length; i++) {
      const test = cur ? `${cur} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = words[i];
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // Border & Flourish helper
  const drawCardFrames = (outerColor, innerColor, flourishColor) => {
    // Outer frame
    ctx.strokeStyle = outerColor;
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(44, 44, 992, 1262, 28);
      ctx.stroke();
    } else {
      ctx.strokeRect(44, 44, 992, 1262);
    }

    // Inner frame
    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(62, 62, 956, 1226, 20);
      ctx.stroke();
    } else {
      ctx.strokeRect(62, 62, 956, 1226);
    }

    // Corner flourishes
    ctx.strokeStyle = flourishColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(44, 92); ctx.lineTo(92, 92); ctx.lineTo(92, 44);
    // Top-right
    ctx.moveTo(1036, 92); ctx.lineTo(988, 92); ctx.lineTo(988, 44);
    // Bottom-left
    ctx.moveTo(44, 1258); ctx.lineTo(92, 1258); ctx.lineTo(92, 1306);
    // Bottom-right
    ctx.moveTo(1036, 1258); ctx.lineTo(988, 1258); ctx.lineTo(988, 1306);
    ctx.stroke();
  };

  if (face === 'front') {
    // ================= FRONT FACE: LUXURY WARM CREAM =================
    ctx.fillStyle = '#FBF7EE';
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle peach/amber & copper ambient radial glows
    const peachGrad = ctx.createRadialGradient(920, 180, 20, 920, 180, 500);
    peachGrad.addColorStop(0, 'rgba(242, 169, 138, 0.28)');
    peachGrad.addColorStop(1, 'rgba(251, 247, 238, 0)');
    ctx.fillStyle = peachGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    const copperGrad = ctx.createRadialGradient(160, 1180, 20, 160, 1180, 500);
    copperGrad.addColorStop(0, 'rgba(201, 106, 66, 0.16)');
    copperGrad.addColorStop(1, 'rgba(251, 247, 238, 0)');
    ctx.fillStyle = copperGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Luxury ornamental borders
    drawCardFrames('#c96a42', 'rgba(32, 7, 14, 0.15)', '#c96a42');

    // Header Title
    ctx.fillStyle = '#c96a42';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦   P A P E R   T H O U G H T S   ✦', 540, 145);

    ctx.fillStyle = 'rgba(32, 7, 14, 0.6)';
    ctx.font = '600 20px monospace';
    ctx.fillText(`${monthDisplay.toUpperCase()} EDITION`, 540, 185);

    // Decorative line
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(380, 215);
    ctx.lineTo(700, 215);
    ctx.stroke();

    // Laureate Pill Badge
    const badgeText = `🌿 ${ordinalRank.toUpperCase()} · ${categoryLabel.toUpperCase()} 🌿`;
    ctx.font = 'bold 22px Georgia, serif';
    const badgeWidth = Math.max(480, ctx.measureText(badgeText).width + 80);
    const badgeX = 540 - badgeWidth / 2;
    
    ctx.fillStyle = 'rgba(201, 106, 66, 0.08)';
    ctx.strokeStyle = '#c96a42';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(badgeX, 275, badgeWidth, 52, 26);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeRect(badgeX, 275, badgeWidth, 52);
    }

    ctx.fillStyle = '#c96a42';
    ctx.fillText(badgeText, 540, 310);

    // Title measurement & vertical balance
    const titleFont = 'bold 56px Georgia, serif';
    const titleLines = wrapLines(`"${title}"`, 840, titleFont);
    const titleLineHeight = 72;
    
    // Calculate balanced starting Y for title
    let titleStartY = 510;
    if (titleLines.length === 1) titleStartY = 530;
    else if (titleLines.length === 2) titleStartY = 490;
    else if (titleLines.length >= 3) titleStartY = 450;

    ctx.fillStyle = '#20070e';
    ctx.font = titleFont;
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, 540, titleStartY + idx * titleLineHeight);
    });

    const titleEndY = titleStartY + (titleLines.length - 1) * titleLineHeight;

    // Divider below title
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, titleEndY + 55);
    ctx.lineTo(600, titleEndY + 55);
    ctx.stroke();

    // Author Byline
    ctx.fillStyle = 'rgba(32, 7, 14, 0.5)';
    ctx.font = '500 20px monospace';
    ctx.fillText('AUTHORED BY', 540, titleEndY + 105);

    ctx.fillStyle = '#20070e';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText(authorName, 540, titleEndY + 160);

    ctx.fillStyle = '#c96a42';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText(chapterByline, 540, titleEndY + 205);

    // Footer
    ctx.strokeStyle = 'rgba(32, 7, 14, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 1170);
    ctx.lineTo(960, 1170);
    ctx.stroke();

    ctx.fillStyle = 'rgba(32, 7, 14, 0.8)';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('INDUCTED INTO THE LIVING ANTHOLOGY', 540, 1215);

    ctx.fillStyle = '#c96a42';
    ctx.font = '20px Georgia, serif';
    ctx.fillText('paperthoughts.org/anthology', 540, 1255);

  } else {
    // ================= BACK FACE: LUXURY WARM PARCHMENT CITATION =================
    ctx.fillStyle = '#FBF7EE';
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle peach/amber & copper ambient radial glows
    const peachGrad = ctx.createRadialGradient(920, 180, 20, 920, 180, 500);
    peachGrad.addColorStop(0, 'rgba(242, 169, 138, 0.28)');
    peachGrad.addColorStop(1, 'rgba(251, 247, 238, 0)');
    ctx.fillStyle = peachGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    const copperGrad = ctx.createRadialGradient(160, 1180, 20, 160, 1180, 500);
    copperGrad.addColorStop(0, 'rgba(201, 106, 66, 0.16)');
    copperGrad.addColorStop(1, 'rgba(251, 247, 238, 0)');
    ctx.fillStyle = copperGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Luxury ornamental frames
    drawCardFrames('#c96a42', 'rgba(32, 7, 14, 0.15)', '#c96a42');

    // Header Title
    ctx.fillStyle = '#c96a42';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('❦   EDITOR\'S CITATION   ❦', 540, 145);

    ctx.fillStyle = 'rgba(32, 7, 14, 0.6)';
    ctx.font = '600 20px monospace';
    ctx.fillText(`LAUREATE CRITIQUE · ${monthDisplay.toUpperCase()}`, 540, 185);

    // Decorative line
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(380, 215);
    ctx.lineTo(700, 215);
    ctx.stroke();

    // Manuscript Context Banner (Essential for standalone social carousels)
    ctx.fillStyle = '#c96a42';
    ctx.font = 'bold 20px monospace';
    const subheadUpper = `ON "${title.toUpperCase()}" · ${ordinalRank.toUpperCase()}`;
    ctx.fillText(subheadUpper, 540, 280);

    ctx.fillStyle = 'rgba(32, 7, 14, 0.7)';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText(`By ${authorName}`, 540, 320);

    // Decorative Large Quotation Mark
    ctx.fillStyle = 'rgba(201, 106, 66, 0.35)';
    ctx.font = '120px Georgia, serif';
    ctx.fillText('“', 540, 440);

    // Dynamic Citation text wrapping - generous size & leading for beautiful rendering
    const citFont = 'italic 38px Georgia, serif';
    const citLines = wrapLines(`"${editorCitation}"`, 840, citFont);
    const citLineHeight = 58;
    const citStartY = 510;

    ctx.fillStyle = '#20070e';
    ctx.font = citFont;
    citLines.forEach((line, idx) => {
      ctx.fillText(line, 540, citStartY + idx * citLineHeight);
    });

    const citEndY = citStartY + (citLines.length - 1) * citLineHeight;

    // Delicate decorative rule below quote instead of editor name
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, citEndY + 70);
    ctx.lineTo(600, citEndY + 70);
    ctx.stroke();

    // Footer
    ctx.strokeStyle = 'rgba(32, 7, 14, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 1170);
    ctx.lineTo(960, 1170);
    ctx.stroke();

    ctx.fillStyle = 'rgba(32, 7, 14, 0.8)';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('THE LIVING ANTHOLOGY', 540, 1215);

    ctx.fillStyle = '#c96a42';
    ctx.font = '20px Georgia, serif';
    ctx.fillText('paperthoughts.org/anthology', 540, 1255);
  }

  // Trigger download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeTitle = (title || 'manuscript')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)
    .replace(/^-+|-+$/g, '');
  const catSlug = (category === 'poem' || category === 'Poetry') ? 'Poetry' : 'Prose';
  const rankSlug = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
  const faceLabel = face === 'front' ? 'Winner-Card' : 'Editors-Remark';
  
  link.download = `PT-${catSlug}-${rankSlug}-${safeTitle}-${faceLabel}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ShareableLaureateCard({
  category = 'Short Story', // 'Short Story' or 'Poetry'
  rank = 1,
  title = "Untitled Manuscript",
  authorName = "Paper Thoughts Author",
  authorArchetype = null,
  chapterName = "Sanctuary",
  monthYear = "October 2026",
  editorCitation = "A masterclass in narrative tension and evocative sentence craft.",
  editorName = "Ufuoma Morgan",
  averageRating = 0,
  ratingsCount = 0,
  isEditor = false,
  showControls = true,
  viewMode = 'flip', // 'flip' | 'side-by-side'
  onReadPiece = null
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedType, setCopiedType] = useState(null); // 'ig' or 'wa' or null
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null); // 'front' | 'back' | 'both'

  const ordinalRank = rank === 1 ? '1st Place' : rank === 2 ? '2nd Place' : '3rd Place';
  const categoryLabel = category === 'poem' || category === 'Poetry' ? 'Poem' : 'Short Story';

  const formatMonthName = (my) => {
    if (!my) return 'October 2026';
    if (my.includes('-')) {
      const [y, m] = my.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    return my;
  };

  const monthDisplay = formatMonthName(monthYear);
  const formattedArchetype = formatAuthorBadge(authorArchetype);

  const chapterByline = formattedArchetype 
    ? `${chapterName} Chapter · ${formattedArchetype}` 
    : `${chapterName} Chapter`;

  // Generate WhatsApp broadcast text
  const getWhatsAppBroadcast = () => {
    return `🌿 *PAPER THOUGHTS MONTHLY LAUREATE REVEAL* 🌿\n\n` +
      `We are thrilled to celebrate our *${ordinalRank} ${categoryLabel} Laureate* for ${monthDisplay}:\n\n` +
      `🏆 *"${title}"*\n` +
      `✍️ *Author:* ${authorName} (${chapterName} Chapter)\n\n` +
      `❦ *Chief Editor's Citation:*\n` +
      `_"${editorCitation}"_\n` +
      `— ${editorName}, Chief Creative Director\n\n` +
      `📖 Read the winning manuscript freely on the Living Anthology:\n` +
      `https://paperthoughts.org/anthology\n\n` +
      `#PaperThoughts #MonthlyAnthology #LiterarySanctuary`;
  };

  // Generate Instagram Carousel Caption
  const getInstagramCaption = () => {
    return `✦ THE LIVING ANTHOLOGY · ${monthDisplay.toUpperCase()} LAUREATE ✦\n\n` +
      `Crown him. Crown her. Crown the words that refused to stay silent.\n\n` +
      `Announcing the ${ordinalRank} Winner in ${categoryLabel}:\n` +
      `"${title}" by @${authorName.toLowerCase().replace(/\s+/g, '')}\n\n` +
      `" ${editorCitation} "\n` +
      `— Chief Editor's Citation · ${editorName}\n\n` +
      `The full manuscript has been inducted into the permanent Paper Thoughts Anthology.\n` +
      `No paywall. No sign-in gates. Read it now via the link in our bio.\n\n` +
      `—\n` +
      `#PaperThoughts #AfricanLiterature #CreativeWriting #LiteraryMagazine #ShortStory #Poetry #WritersCommunity #BookClub`;
  };

  const handleCopy = (type) => {
    const text = type === 'ig' ? getInstagramCaption() : getWhatsAppBroadcast();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Handle Export Single or Both PNGs
  const handleDownload = async (targetFace = 'front') => {
    setIsDownloading(true);
    setDownloadSuccess(null);
    try {
      if (targetFace === 'both') {
        await exportLaureateCardPNG({
          face: 'front',
          category,
          rank,
          title,
          authorName,
          authorArchetype,
          chapterName,
          monthYear,
          editorCitation,
          editorName
        });
        await new Promise(r => setTimeout(r, 350));
        await exportLaureateCardPNG({
          face: 'back',
          category,
          rank,
          title,
          authorName,
          authorArchetype,
          chapterName,
          monthYear,
          editorCitation,
          editorName
        });
        setDownloadSuccess('both');
      } else {
        await exportLaureateCardPNG({
          face: targetFace,
          category,
          rank,
          title,
          authorName,
          authorArchetype,
          chapterName,
          monthYear,
          editorCitation,
          editorName
        });
        setDownloadSuccess(targetFace);
      }
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export card image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Render Card Front Face Component
  const renderFrontFace = (standalone = false) => (
    <div 
      className={`w-full aspect-[4/5] bg-[#FBF7EE] text-[#20070e] border border-[#c96a42]/30 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-xl overflow-hidden ${
        standalone ? 'relative' : 'absolute inset-0'
      }`}
      style={standalone ? {} : { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#F2A98A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-[#c96a42]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#20070e]/10 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#c96a42] text-sm">✦</span>
          <span className="font-serif text-[11px] tracking-[0.2em] uppercase font-bold text-[#20070e]">Paper Thoughts</span>
        </div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#c96a42] font-semibold bg-[#c96a42]/10 px-2 py-0.5 rounded-full">
          {monthDisplay}
        </span>
      </div>

      {/* Center Area */}
      <div className="relative z-10 my-auto text-center space-y-3 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c96a42]/30 bg-[#c96a42]/5 text-[#c96a42] text-xs font-semibold uppercase tracking-wider">
          <span>🌿</span> {ordinalRank} · {categoryLabel}
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-normal leading-snug tracking-tight text-[#20070e]">
          "{title}"
        </h3>

        <div className="pt-2 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#20070e]/50 font-medium">By</p>
          <p className="font-serif text-base sm:text-lg font-bold text-[#20070e] tracking-wide">
            {authorName}
          </p>
          <p className="text-[11px] text-[#c96a42] italic">
            {chapterByline}
          </p>
          {averageRating > 0 && (
            <div className="pt-1.5 flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c96a42]/10 border border-[#c96a42]/20 text-[#c96a42] text-[10px] font-mono font-bold">
                <span>★</span>
                <span>{Number(averageRating).toFixed(1)}</span>
                <span className="text-[9px] text-[#20070e]/50 font-normal">({ratingsCount})</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 pt-3 border-t border-[#20070e]/10 flex items-center justify-between text-xs text-[#20070e]/50">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c96a42]"></span>
          <span className="text-[10px] tracking-wide uppercase font-semibold">Living Anthology</span>
        </div>
        <span className="text-[10px] italic text-[#c96a42] flex items-center gap-1">
          {standalone ? '1080×1350 Winner Card' : <>Tap to view Citation <RotateCw size={10} /></>}
        </span>
      </div>
    </div>
  );

  // Render Card Back Face Component: Warm Parchment with Pure Literary Citation
  const renderBackFace = (standalone = false) => (
    <div 
      className={`w-full aspect-[4/5] bg-[#FBF7EE] text-[#20070e] border border-[#c96a42]/30 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-xl overflow-hidden ${
        standalone ? 'relative' : 'absolute inset-0'
      }`}
      style={standalone ? {} : { 
        backfaceVisibility: 'hidden', 
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        WebkitTransform: 'rotateY(180deg)'
      }}
    >
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#F2A98A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-[#c96a42]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#20070e]/10 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#c96a42] text-xs">❦</span>
          <span className="font-serif text-[11px] tracking-[0.2em] uppercase font-bold text-[#c96a42]">
            Editor&rsquo;s Citation
          </span>
        </div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#c96a42] font-semibold bg-[#c96a42]/10 px-2 py-0.5 rounded-full">
          {ordinalRank}
        </span>
      </div>

      {/* Center Area: Pure, Beautifully Rendered Literary Quote */}
      <div className="relative z-10 my-auto text-center px-2 sm:px-4 space-y-3">
        <span className="text-4xl sm:text-5xl font-serif text-[#c96a42]/30 leading-none select-none block -mb-2">
          &ldquo;
        </span>

        <p className="font-serif italic text-sm sm:text-base lg:text-lg text-[#20070e] leading-relaxed line-clamp-6 font-medium">
          {editorCitation}
        </p>

        <div className="w-10 h-0.5 bg-[#c96a42]/30 mx-auto rounded-full mt-2" />
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 pt-3 border-t border-[#20070e]/10 flex items-center justify-between text-xs text-[#20070e]/50">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c96a42]"></span>
          <span className="text-[10px] tracking-wide uppercase font-semibold">Living Anthology</span>
        </div>
        <span className="text-[10px] italic text-[#c96a42] flex items-center gap-1">
          {standalone ? '1080×1350 Editor Remark' : <>Tap to flip <RotateCw size={10} /></>}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full mx-auto">
      
      {/* View Mode: Side-by-Side (Both Faces Visually Displayed Together) */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/60 flex items-center gap-1">
              <span>🎴</span> Winner Card (Front)
            </span>
            {renderFrontFace(true)}
            {isEditor && (
              <button
                onClick={() => handleDownload('front')}
                disabled={isDownloading}
                className="w-full bg-[#c96a42] hover:bg-[#b55832] text-white font-bold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-[0.98]"
              >
                <Download size={13} />
                <span>Download Winner Card PNG</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/60 flex items-center gap-1">
              <span>❦</span> Editor's Remark (Back)
            </span>
            {renderBackFace(true)}
            {isEditor && (
              <button
                onClick={() => handleDownload('back')}
                disabled={isDownloading}
                className="w-full bg-[#20070e] hover:bg-[#340c17] text-[#F2A98A] border border-[#c96a42]/30 font-bold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-[0.98]"
              >
                <Download size={13} />
                <span>Download Editor's Remark PNG</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* View Mode: 3D Flip Card (Interactive 3D Rotation) */
        <div 
          className="w-full aspect-[4/5] cursor-pointer relative max-w-sm sm:max-w-md"
          style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div 
            className="relative w-full h-full duration-700"
            style={{ 
              transformStyle: 'preserve-3d', 
              WebkitTransformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            {renderFrontFace(false)}
            {renderBackFace(false)}
          </div>
        </div>
      )}

      {/* Action Controls */}
      {showControls && (
        <div className="w-full mt-3.5 space-y-2.5 max-w-sm sm:max-w-md">
          
          {/* Public Audience Facing: ONLY Flip & Read */}
          {!isEditor ? (
            <div className="flex items-center gap-2.5 w-full">
              {viewMode !== 'side-by-side' && (
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="flex-1 bg-white hover:bg-[#FBF7EE] text-[#20070e] border border-[#20070e]/20 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-2xs cursor-pointer active:scale-[0.98]"
                >
                  <RotateCw size={13} /> {isFlipped ? 'View Laureate' : 'Flip Citation'}
                </button>
              )}

              {onReadPiece && (
                <button
                  onClick={onReadPiece}
                  className="flex-1 bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  <BookOpen size={13} /> Read Manuscript
                </button>
              )}
            </div>
          ) : (
            /* Chief Editor Mode: Full Media Suite with Dedicated Front/Back/Both Downloads */
            <div className="space-y-2">
              {viewMode !== 'side-by-side' && (
                <>
                  {/* Two Main Download Buttons: Winner Card & Editor's Remark */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownload('front')}
                      disabled={isDownloading}
                      className="bg-[#c96a42] hover:bg-[#b55832] text-white font-bold py-2 px-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-[11px] cursor-pointer active:scale-[0.98]"
                      title="Download 1080x1350 PNG of Winner Card"
                    >
                      <Download size={13} />
                      <span>Winner Card</span>
                    </button>

                    <button
                      onClick={() => handleDownload('back')}
                      disabled={isDownloading}
                      className="bg-[#20070e] hover:bg-[#340c17] text-[#F2A98A] border border-[#c96a42]/30 font-bold py-2 px-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-[11px] cursor-pointer active:scale-[0.98]"
                      title="Download 1080x1350 PNG of Editor's Citation Remark"
                    >
                      <Download size={13} />
                      <span>Editor's Remark</span>
                    </button>
                  </div>

                  {/* Secondary Action Bar: Download Both + Flip */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload('both')}
                      disabled={isDownloading}
                      className="flex-1 bg-[#FBF7EE] hover:bg-[#f3ede0] text-[#20070e] border border-[#20070e]/20 font-bold py-1.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-[11px] shadow-2xs cursor-pointer active:scale-[0.98]"
                      title="Download both Winner Card and Editor's Remark sequentially"
                    >
                      <Download size={12} className="text-[#c96a42]" />
                      <span>Download Both (Front & Back)</span>
                    </button>

                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="bg-white hover:bg-[#FBF7EE] text-[#20070e] border border-[#20070e]/20 font-bold py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1 text-[11px] cursor-pointer shrink-0"
                      title="Flip 3D card preview"
                    >
                      <RotateCw size={12} /> {isFlipped ? 'Front' : 'Back'}
                    </button>
                  </div>
                </>
              )}

              {/* Download Feedback Indicator */}
              {downloadSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>
                    {downloadSuccess === 'both' ? 'Both cards exported to Downloads!' : `${downloadSuccess === 'front' ? 'Winner Card' : "Editor's Remark"} exported!`}
                  </span>
                </div>
              )}

              {/* Instagram & WhatsApp Captions Copy Bar */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => handleCopy('ig')}
                  className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                >
                  {copiedType === 'ig' ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                  {copiedType === 'ig' ? 'Copied IG Post!' : 'Copy IG Caption'}
                </button>

                <button
                  onClick={() => handleCopy('wa')}
                  className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                >
                  {copiedType === 'wa' ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                  {copiedType === 'wa' ? 'Copied WhatsApp!' : 'Copy WhatsApp Post'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
