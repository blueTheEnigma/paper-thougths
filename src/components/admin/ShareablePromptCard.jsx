"use client";

import React, { useState } from 'react';
import { Download, Copy, Check, Sparkles, BookOpen, Feather, Palette, CheckCircle2 } from 'lucide-react';

/**
 * High-Resolution 1080x1080 HTML5 Canvas PNG Exporter
 * Formatted specifically for Instagram Feed (Square 1:1) and WhatsApp Broadcasts
 */
export const exportPromptCardPNG = async ({
  promptText = "Write about an unexpected meeting. Two strangers cross paths and something changes.",
  promptType = "story", // 'story' | 'poem'
  activeDate = null,
  promptId = null,
  theme = "parchment" // 'parchment' | 'obsidian'
}) => {
  if (typeof document === 'undefined') return;

  const isPoem = promptType === 'poem';
  const categoryLabel = isPoem ? 'Poetry & Verses' : 'Fiction & Prose';
  const categoryBadge = isPoem ? '❦   POETRY & VERSES   ❦' : '✦   FICTION & PROSE   ✦';

  const formatDateLabel = (d) => {
    if (!d) return 'Active Weekly Prompt';
    try {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return String(d);
      return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  const dateLabel = formatDateLabel(activeDate);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // Text wrapping helper with dynamic font measuring
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
  const drawFrames = (outerStroke, innerStroke, flourishStroke) => {
    // Outer rounded frame
    ctx.strokeStyle = outerStroke;
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(42, 42, 996, 996, 28);
      ctx.stroke();
    } else {
      ctx.strokeRect(42, 42, 996, 996);
    }

    // Inner hairline frame
    ctx.strokeStyle = innerStroke;
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(58, 58, 964, 964, 20);
      ctx.stroke();
    } else {
      ctx.strokeRect(58, 58, 964, 964);
    }

    // Four corner flourishes
    ctx.strokeStyle = flourishStroke;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(42, 88); ctx.lineTo(88, 88); ctx.lineTo(88, 42);
    // Top-right
    ctx.moveTo(1038, 88); ctx.lineTo(992, 88); ctx.lineTo(992, 42);
    // Bottom-left
    ctx.moveTo(42, 992); ctx.lineTo(88, 992); ctx.lineTo(88, 1038);
    // Bottom-right
    ctx.moveTo(1038, 992); ctx.lineTo(992, 992); ctx.lineTo(992, 1038);
    ctx.stroke();
  };

  if (theme === 'parchment') {
    // ================= THEME 1: WARM LITERARY PARCHMENT =================
    ctx.fillStyle = '#FBF7EE';
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle peach and copper ambient radial glows
    const peachGrad = ctx.createRadialGradient(920, 160, 20, 920, 160, 480);
    peachGrad.addColorStop(0, 'rgba(242, 169, 138, 0.28)');
    peachGrad.addColorStop(1, 'rgba(251, 247, 238, 0)');
    ctx.fillStyle = peachGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    const copperGrad = ctx.createRadialGradient(160, 920, 20, 160, 920, 480);
    copperGrad.addColorStop(0, 'rgba(201, 106, 66, 0.16)');
    copperGrad.addColorStop(1, 'rgba(251, 247, 238, 0)');
    ctx.fillStyle = copperGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Frames
    drawFrames('#c96a42', 'rgba(32, 7, 14, 0.15)', '#c96a42');

    // Header Title
    ctx.fillStyle = '#c96a42';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦   P A P E R   T H O U G H T S   ✦', 540, 125);

    ctx.fillStyle = 'rgba(32, 7, 14, 0.6)';
    ctx.font = '600 18px monospace';
    const subHeader = promptId ? `WEEKLY WRITING PROMPT · #${promptId}` : 'WEEKLY WRITING PROMPT';
    ctx.fillText(subHeader, 540, 160);

    // Subtle header divider
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(380, 185);
    ctx.lineTo(700, 185);
    ctx.stroke();

    // Category Pill Badge
    ctx.font = 'bold 20px Georgia, serif';
    const badgeWidth = Math.max(380, ctx.measureText(categoryBadge).width + 60);
    const badgeX = 540 - badgeWidth / 2;

    ctx.fillStyle = 'rgba(201, 106, 66, 0.08)';
    ctx.strokeStyle = '#c96a42';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(badgeX, 225, badgeWidth, 46, 23);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeRect(badgeX, 225, badgeWidth, 46);
    }

    ctx.fillStyle = '#c96a42';
    ctx.fillText(categoryBadge, 540, 256);

    // Large Quotation Mark Flourish
    ctx.fillStyle = 'rgba(201, 106, 66, 0.35)';
    ctx.font = '100px Georgia, serif';
    ctx.fillText('“', 540, 370);

    // Dynamic Font Sizing for Prompt Text based on character count
    const safePromptStr = String(promptText || '').trim();
    const cleanText = safePromptStr.replace(/^["“]+|["”]+$/g, '');
    let promptFontSize = 44;
    let promptLineHeight = 64;
    if (cleanText.length > 220) {
      promptFontSize = 32;
      promptLineHeight = 48;
    } else if (cleanText.length > 130) {
      promptFontSize = 38;
      promptLineHeight = 56;
    }

    const fontStyle = `italic ${promptFontSize}px Georgia, serif`;
    const promptLines = wrapLines(`"${cleanText}"`, 840, fontStyle);

    // Calculate balanced vertical centering for prompt block
    const blockHeight = promptLines.length * promptLineHeight;
    // Available middle area is roughly Y=380 to Y=880 (500px total)
    const promptStartY = Math.max(420, 390 + (490 - blockHeight) / 2);

    ctx.fillStyle = '#20070e';
    ctx.font = fontStyle;
    promptLines.forEach((line, idx) => {
      ctx.fillText(line, 540, promptStartY + idx * promptLineHeight);
    });

    const promptEndY = promptStartY + (promptLines.length - 1) * promptLineHeight;

    // Decorative copper divider below quote
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, promptEndY + 50);
    ctx.lineTo(600, promptEndY + 50);
    ctx.stroke();

    // Footer
    ctx.strokeStyle = 'rgba(32, 7, 14, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 930);
    ctx.lineTo(960, 930);
    ctx.stroke();

    ctx.fillStyle = 'rgba(32, 7, 14, 0.75)';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('THE LIVING SALON · WRITERS\' VILLAGE', 540, 968);

    ctx.fillStyle = '#c96a42';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(`Submit at paperthoughts.org/village · ${dateLabel}`, 540, 1000);

  } else {
    // ================= THEME 2: MIDNIGHT OBSIDIAN VELVET =================
    ctx.fillStyle = '#1a050b';
    ctx.fillRect(0, 0, 1080, 1080);

    // Deep burgundy radial glows
    const burgGrad = ctx.createRadialGradient(540, 540, 50, 540, 540, 600);
    burgGrad.addColorStop(0, '#2c0b15');
    burgGrad.addColorStop(1, '#120308');
    ctx.fillStyle = burgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    const peachGrad = ctx.createRadialGradient(940, 140, 20, 940, 140, 480);
    peachGrad.addColorStop(0, 'rgba(242, 169, 138, 0.18)');
    peachGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = peachGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    const copperGrad = ctx.createRadialGradient(140, 940, 20, 140, 940, 480);
    copperGrad.addColorStop(0, 'rgba(201, 106, 66, 0.22)');
    copperGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = copperGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Frames
    drawFrames('#c96a42', 'rgba(242, 169, 138, 0.2)', '#F2A98A');

    // Header Title
    ctx.fillStyle = '#F2A98A';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦   P A P E R   T H O U G H T S   ✦', 540, 125);

    ctx.fillStyle = 'rgba(251, 247, 238, 0.6)';
    ctx.font = '600 18px monospace';
    const subHeader = promptId ? `WEEKLY WRITING PROMPT · #${promptId}` : 'WEEKLY WRITING PROMPT';
    ctx.fillText(subHeader, 540, 160);

    // Subtle header divider
    ctx.strokeStyle = 'rgba(201, 106, 66, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(380, 185);
    ctx.lineTo(700, 185);
    ctx.stroke();

    // Category Pill Badge
    ctx.font = 'bold 20px Georgia, serif';
    const badgeWidth = Math.max(380, ctx.measureText(categoryBadge).width + 60);
    const badgeX = 540 - badgeWidth / 2;

    ctx.fillStyle = 'rgba(201, 106, 66, 0.16)';
    ctx.strokeStyle = '#F2A98A';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(badgeX, 225, badgeWidth, 46, 23);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeRect(badgeX, 225, badgeWidth, 46);
    }

    ctx.fillStyle = '#F2A98A';
    ctx.fillText(categoryBadge, 540, 256);

    // Large Quotation Mark Flourish
    ctx.fillStyle = 'rgba(242, 169, 138, 0.35)';
    ctx.font = '100px Georgia, serif';
    ctx.fillText('“', 540, 370);

    // Dynamic Font Sizing for Prompt Text based on character count
    const safePromptStr = String(promptText || '').trim();
    const cleanText = safePromptStr.replace(/^["“]+|["”]+$/g, '');
    let promptFontSize = 44;
    let promptLineHeight = 64;
    if (cleanText.length > 220) {
      promptFontSize = 32;
      promptLineHeight = 48;
    } else if (cleanText.length > 130) {
      promptFontSize = 38;
      promptLineHeight = 56;
    }

    const fontStyle = `italic ${promptFontSize}px Georgia, serif`;
    const promptLines = wrapLines(`"${cleanText}"`, 840, fontStyle);

    // Calculate balanced vertical centering for prompt block
    const blockHeight = promptLines.length * promptLineHeight;
    const promptStartY = Math.max(420, 390 + (490 - blockHeight) / 2);

    ctx.fillStyle = '#FBF7EE';
    ctx.font = fontStyle;
    promptLines.forEach((line, idx) => {
      ctx.fillText(line, 540, promptStartY + idx * promptLineHeight);
    });

    const promptEndY = promptStartY + (promptLines.length - 1) * promptLineHeight;

    // Decorative copper divider below quote
    ctx.strokeStyle = 'rgba(242, 169, 138, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, promptEndY + 50);
    ctx.lineTo(600, promptEndY + 50);
    ctx.stroke();

    // Footer
    ctx.strokeStyle = 'rgba(251, 247, 238, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 930);
    ctx.lineTo(960, 930);
    ctx.stroke();

    ctx.fillStyle = 'rgba(251, 247, 238, 0.85)';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('THE LIVING SALON · WRITERS\' VILLAGE', 540, 968);

    ctx.fillStyle = '#F2A98A';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(`Submit at paperthoughts.org/village · ${dateLabel}`, 540, 1000);
  }

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeSnippet = cleanSnippet(promptText, 25);
  const typeSlug = isPoem ? 'Poem' : 'Story';
  link.download = `PT-Prompt-${typeSlug}-${safeSnippet}-${theme}-1080x1080.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function cleanSnippet(text, max = 25) {
  return String(text || 'prompt')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, max)
    .replace(/^-+|-+$/g, '') || 'card';
}

export default function ShareablePromptCard({
  promptText = "Write about an unexpected meeting. Two strangers cross paths and something changes.",
  promptType = "story", // 'story' | 'poem'
  activeDate = null,
  promptId = null,
  showControls = true,
  compact = false
}) {
  const [theme, setTheme] = useState('parchment'); // 'parchment' | 'obsidian'
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedType, setCopiedType] = useState(null); // 'ig' | 'wa' | null

  const isPoem = promptType === 'poem';
  const categoryLabel = isPoem ? 'Poetry & Verses' : 'Fiction & Prose';

  const formatDateLabel = (d) => {
    if (!d) return 'Active Weekly Prompt';
    try {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return String(d);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  const dateLabel = formatDateLabel(activeDate);

  const safeText = String(promptText || '').trim();

  // Instagram Caption Generator
  const getInstagramCaption = () => {
    return `✦ WEEKLY WRITING PROMPT · PAPER THOUGHTS ✦\n\n` +
      `Category: ${categoryLabel}\n` +
      `Prompt: #${promptId || 'Active'} · ${dateLabel}\n\n` +
      `" ${safeText} "\n\n` +
      `Take the floor. Ink your manuscript and submit to the Writers' Village this week on Paper Thoughts:\n` +
      `https://paperthoughts.org/village\n\n` +
      `The top manuscripts from this weekly cycle will be inducted into the permanent Living Anthology.\n\n` +
      `—\n` +
      `#PaperThoughts #WeeklyPrompt #AfricanLiterature #CreativeWriting #WritersCommunity #BookClub #ShortStory #Poetry`;
  };

  // WhatsApp Broadcast Generator
  const getWhatsAppBroadcast = () => {
    return `🌿 *PAPER THOUGHTS WEEKLY WRITING PROMPT* 🌿\n\n` +
      `✍️ *Category:* ${categoryLabel}\n` +
      `📅 *Cycle:* ${dateLabel}\n\n` +
      `❦ *This Week's Challenge:*\n` +
      `_"${safeText}"_\n\n` +
      `📖 Write and submit your piece freely to the Living Salon:\n` +
      `https://paperthoughts.org/village\n\n` +
      `🏆 The finest 3 works are inducted into the Living Anthology with permanent author laurels!\n\n` +
      `#PaperThoughts #TheLivingSalon`;
  };

  const handleCopy = (type) => {
    const text = type === 'ig' ? getInstagramCaption() : getWhatsAppBroadcast();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      await exportPromptCardPNG({
        promptText,
        promptType,
        activeDate,
        promptId,
        theme
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export prompt card PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isDark = theme === 'obsidian';

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto">
      
      {/* Visual Square 1:1 Prompt Card */}
      <div 
        className={`w-full aspect-square rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300 border ${
          isDark 
            ? 'bg-[#1a050b] text-[#FBF7EE] border-[#c96a42]/40 shadow-black/40' 
            : 'bg-[#FBF7EE] text-[#20070e] border-[#c96a42]/30 shadow-stone-200/60'
        }`}
      >
        {/* Ambient atmospheric glows */}
        <div 
          className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-[#F2A98A]/15' : 'bg-[#F2A98A]/25'
          }`} 
        />
        <div 
          className={`absolute -left-16 -bottom-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-[#c96a42]/20' : 'bg-[#c96a42]/15'
          }`} 
        />

        {/* Top Header */}
        <div className={`relative z-10 flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-[#FBF7EE]/10' : 'border-[#20070e]/10'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[#c96a42] text-xs">✦</span>
            <span className={`font-serif text-[11px] tracking-[0.2em] uppercase font-bold ${
              isDark ? 'text-[#F2A98A]' : 'text-[#20070e]'
            }`}>
              Paper Thoughts
            </span>
          </div>
          <span className={`text-[10px] font-mono tracking-widest uppercase font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-[#c96a42]/20 text-[#F2A98A]' : 'bg-[#c96a42]/10 text-[#c96a42]'
          }`}>
            {dateLabel}
          </span>
        </div>

        {/* Center Prompt Area */}
        <div className="relative z-10 my-auto text-center px-2 sm:px-4 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c96a42]/30 text-xs font-semibold uppercase tracking-wider bg-[#c96a42]/10 text-[#c96a42]">
            {isPoem ? <Feather size={12} /> : <BookOpen size={12} />}
            <span>{categoryLabel}</span>
          </div>

          <span className={`text-4xl sm:text-5xl font-serif leading-none select-none block -mb-1 ${
            isDark ? 'text-[#F2A98A]/35' : 'text-[#c96a42]/35'
          }`}>
            &ldquo;
          </span>

          <p className={`font-serif italic leading-relaxed font-medium line-clamp-6 ${
            isDark ? 'text-[#FBF7EE]' : 'text-[#20070e]'
          } ${
            safeText.length > 200 ? 'text-xs sm:text-sm' : safeText.length > 120 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
          }`}>
            {safeText || 'No prompt content specified.'}
          </p>

          <div className={`w-12 h-0.5 mx-auto rounded-full mt-2 ${
            isDark ? 'bg-[#F2A98A]/40' : 'bg-[#c96a42]/40'
          }`} />
        </div>

        {/* Bottom Footer */}
        <div className={`relative z-10 pt-2.5 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-[#FBF7EE]/10 text-[#FBF7EE]/50' : 'border-[#20070e]/10 text-[#20070e]/50'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c96a42]" />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Living Salon</span>
          </div>
          <span className="text-[10px] italic text-[#c96a42]">
            paperthoughts.org/village
          </span>
        </div>
      </div>

      {/* Action Controls Suite */}
      {showControls && (
        <div className="w-full mt-3 space-y-2">
          
          {/* Top Bar: Theme Switcher & Main Download Button */}
          <div className="flex items-center gap-2 w-full">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(isDark ? 'parchment' : 'obsidian')}
              className="bg-white hover:bg-stone-50 text-[#20070e] border border-[#20070e]/15 font-bold py-2 px-3 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-[0.98] shrink-0"
              title="Toggle Parchment (Light) or Obsidian (Dark) Palette"
            >
              <Palette size={13} className="text-[#c96a42]" />
              <span>{isDark ? 'Obsidian' : 'Parchment'}</span>
            </button>

            {/* High-Res PNG Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 bg-[#20070e] hover:bg-[#340c17] text-[#F2A98A] border border-[#c96a42]/30 font-bold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
              title="Download 1080x1080 Square Graphic"
            >
              <Download size={13} />
              <span>{isDownloading ? 'Rendering 1080px...' : 'Download Square Card (1080px)'}</span>
            </button>
          </div>

          {/* Secondary Action Bar: Copy Instagram & WhatsApp Captions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCopy('ig')}
              className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-[11px] font-bold py-1.5 px-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
            >
              {copiedType === 'ig' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              <span>{copiedType === 'ig' ? 'Copied IG Post!' : 'Copy IG Caption'}</span>
            </button>

            <button
              onClick={() => handleCopy('wa')}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold py-1.5 px-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
            >
              {copiedType === 'wa' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              <span>{copiedType === 'wa' ? 'Copied WhatsApp!' : 'Copy WhatsApp Post'}</span>
            </button>
          </div>

          {/* Success Indicator */}
          {downloadSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 animate-fadeIn">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span>Prompt card exported to Downloads (1080×1080 PNG)!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
