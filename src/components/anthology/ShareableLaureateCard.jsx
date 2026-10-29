"use client";

import React, { useState } from 'react';
import { Download, Copy, Check, RotateCw, BookOpen } from 'lucide-react';
import { ARCHETYPES } from '@/lib/archetypesData';

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
  isEditor = false,
  showControls = true,
  onReadPiece = null
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedType, setCopiedType] = useState(null); // 'ig' or 'wa' or null
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Format clean archetype / chapter display
  const formattedArchetype = authorArchetype && ARCHETYPES[authorArchetype]
    ? ARCHETYPES[authorArchetype].name
    : (authorArchetype && !['writer', 'member', 'reader'].includes(authorArchetype.toLowerCase()) ? authorArchetype : null);

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

  // High-Resolution 1080x1350 PNG Exporter using HTML5 Canvas (Editor Only)
  const handleDownloadPNG = async (face = 'front') => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      const wrapText = (text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
        return currentY;
      };

      if (face === 'front') {
        // FRONT FACE: Cream luxury background
        ctx.fillStyle = '#FBF7EE';
        ctx.fillRect(0, 0, 1080, 1350);

        ctx.strokeStyle = '#c96a42';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, 980, 1250);

        ctx.strokeStyle = 'rgba(32, 7, 14, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(70, 70, 940, 1210);

        ctx.fillStyle = '#c96a42';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦   P A P E R   T H O U G H T S   ✦', 540, 160);

        ctx.fillStyle = 'rgba(32, 7, 14, 0.6)';
        ctx.font = '600 24px monospace';
        ctx.fillText(`${monthDisplay.toUpperCase()} EDITION`, 540, 210);

        ctx.strokeStyle = 'rgba(201, 106, 66, 0.3)';
        ctx.beginPath();
        ctx.moveTo(340, 245);
        ctx.lineTo(740, 245);
        ctx.stroke();

        ctx.fillStyle = '#c96a42';
        ctx.font = 'bold 36px Georgia, serif';
        ctx.fillText(`🌿 ${ordinalRank.toUpperCase()} · ${categoryLabel.toUpperCase()} 🌿`, 540, 360);

        ctx.fillStyle = '#20070e';
        ctx.font = 'bold 64px Georgia, serif';
        wrapText(`"${title}"`, 540, 520, 840, 80);

        ctx.fillStyle = 'rgba(32, 7, 14, 0.5)';
        ctx.font = '24px monospace';
        ctx.fillText('BY', 540, 780);

        ctx.fillStyle = '#20070e';
        ctx.font = 'bold 48px Georgia, serif';
        ctx.fillText(authorName, 540, 840);

        ctx.fillStyle = '#c96a42';
        ctx.font = 'italic 28px Georgia, serif';
        ctx.fillText(chapterByline, 540, 890);

        ctx.fillStyle = '#20070e';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('INDUCTED INTO THE LIVING ANTHOLOGY', 540, 1160);

        ctx.fillStyle = '#c96a42';
        ctx.font = '22px Georgia, serif';
        ctx.fillText('paperthoughts.org/anthology', 540, 1205);

      } else {
        // BACK FACE: Burgundy background
        ctx.fillStyle = '#20070e';
        ctx.fillRect(0, 0, 1080, 1350);

        ctx.strokeStyle = 'rgba(201, 106, 66, 0.5)';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, 980, 1250);

        ctx.fillStyle = '#F2A98A';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('❦   CHIEF EDITOR\'S CITATION   ❦', 540, 170);

        ctx.fillStyle = 'rgba(251, 247, 238, 0.5)';
        ctx.font = '22px monospace';
        ctx.fillText(`LAUREATE SELECTION · ${monthDisplay.toUpperCase()}`, 540, 220);

        ctx.strokeStyle = 'rgba(242, 169, 138, 0.3)';
        ctx.beginPath();
        ctx.moveTo(340, 260);
        ctx.lineTo(740, 260);
        ctx.stroke();

        ctx.fillStyle = 'rgba(201, 106, 66, 0.4)';
        ctx.font = '120px Georgia, serif';
        ctx.fillText('“', 540, 420);

        ctx.fillStyle = '#FBF7EE';
        ctx.font = 'italic 40px Georgia, serif';
        wrapText(`"${editorCitation}"`, 540, 510, 820, 60);

        ctx.fillStyle = '#F2A98A';
        ctx.font = 'bold 36px Georgia, serif';
        ctx.fillText(editorName, 540, 920);

        ctx.fillStyle = 'rgba(251, 247, 238, 0.6)';
        ctx.font = '24px Georgia, serif';
        ctx.fillText('Chief Creative Director · Paper Thoughts', 540, 965);

        ctx.fillStyle = 'rgba(251, 247, 238, 0.4)';
        ctx.font = '20px monospace';
        ctx.fillText('READ THE FULL MANUSCRIPT AT', 540, 1160);

        ctx.fillStyle = '#F2A98A';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('paperthoughts.org/anthology', 540, 1200);
      }

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      link.download = `PT-Laureate-${safeTitle}-${face}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export card image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-sm sm:max-w-md w-full mx-auto">
      
      {/* 3D Flip Card Container */}
      <div 
        className="w-full aspect-[4/5] cursor-pointer relative"
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
          {/* FRONT FACE: Luxury Warm Cream */}
          <div 
            className="absolute inset-0 bg-[#FBF7EE] text-[#20070e] border border-[#c96a42]/30 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
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
            <div className="relative z-10 my-auto text-center space-y-3.5 px-2">
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
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="relative z-10 pt-3 border-t border-[#20070e]/10 flex items-center justify-between text-xs text-[#20070e]/50">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c96a42]"></span>
                <span className="text-[10px] tracking-wide uppercase font-semibold">Living Anthology</span>
              </div>
              <span className="text-[10px] italic text-[#c96a42] flex items-center gap-1">
                Tap to view Citation <RotateCw size={10} />
              </span>
            </div>
          </div>

          {/* BACK FACE: Deep Burgundy Obsidian */}
          <div 
            className="absolute inset-0 bg-[#20070e] text-[#FBF7EE] border border-[#c96a42]/40 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              WebkitTransform: 'rotateY(180deg)'
            }}
          >
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-[#c96a42]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-[#FBF7EE]/10 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#F2A98A]">❦</span>
                <span className="font-serif text-[11px] tracking-[0.2em] uppercase font-bold text-[#F2A98A]">Chief Editor's Citation</span>
              </div>
              <span className="text-[10px] text-[#FBF7EE]/40 uppercase tracking-widest font-mono">
                Anthology Verified
              </span>
            </div>

            {/* Center Area */}
            <div className="relative z-10 my-auto space-y-3 px-2 text-center">
              <p className="font-serif italic text-sm sm:text-base leading-relaxed text-[#FBF7EE]/90">
                "{editorCitation}"
              </p>

              <div className="pt-2">
                <p className="text-xs font-semibold text-[#F2A98A] uppercase tracking-wider">
                  {editorName}
                </p>
                <p className="text-[10px] text-[#FBF7EE]/40 uppercase tracking-widest">
                  Chief Creative Director
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="relative z-10 pt-3 border-t border-[#FBF7EE]/10 flex items-center justify-between text-xs">
              <div>
                <p className="text-[9px] text-[#FBF7EE]/50 uppercase tracking-wider">Read Manuscript At</p>
                <p className="text-[11px] font-mono text-[#F2A98A]">paperthoughts.org/anthology</p>
              </div>
              <span className="text-[10px] italic text-[#F2A98A] flex items-center gap-1">
                Tap to flip <RotateCw size={10} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      {showControls && (
        <div className="w-full mt-3.5 space-y-2">
          
          {/* Public Audience Facing: ONLY Flip & Read */}
          {!isEditor ? (
            <div className="flex items-center gap-2.5 w-full">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex-1 bg-white hover:bg-[#FBF7EE] text-[#20070e] border border-[#20070e]/20 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-2xs cursor-pointer active:scale-[0.98]"
              >
                <RotateCw size={13} /> {isFlipped ? 'View Laureate' : 'Flip Citation'}
              </button>

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
            /* Chief Editor Mode: Full Media Suite with Export & Copy Templates */
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handleDownloadPNG(isFlipped ? 'back' : 'front')}
                  disabled={isDownloading}
                  className="flex-1 bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] font-bold py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 text-[11px]"
                  title="Download high-res 1080x1350 PNG for Instagram / WhatsApp Status"
                >
                  <Download size={13} />
                  {isDownloading ? 'Exporting...' : `Download ${isFlipped ? 'Citation' : 'Laureate'} PNG`}
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="bg-white hover:bg-[#FBF7EE] text-[#20070e] border border-[#20070e]/20 font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1 text-[11px]"
                  title="Flip between front and back"
                >
                  <RotateCw size={13} /> Flip
                </button>

                {onReadPiece && (
                  <button
                    onClick={onReadPiece}
                    className="bg-[#c96a42]/15 hover:bg-[#c96a42]/25 text-[#20070e] font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1 text-[11px]"
                    title="Read full piece"
                  >
                    <BookOpen size={13} /> Read
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopy('ig')}
                  className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  {copiedType === 'ig' ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                  {copiedType === 'ig' ? 'Copied IG Post!' : 'Copy IG Caption'}
                </button>

                <button
                  onClick={() => handleCopy('wa')}
                  className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
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
