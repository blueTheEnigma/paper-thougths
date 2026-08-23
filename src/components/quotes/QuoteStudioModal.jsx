"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Download, Copy, Share2, Check, X, 
  Layers, Sliders, Type, RefreshCw, Smartphone, 
  Square, Feather, Quote, Send, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FIGMA_TEMPLATES = [
  {
    id: 'figma_carousel_1',
    name: 'Figma Minimalist Dark',
    type: 'image',
    imageSrc: '/images/Templates/Carousel template 001 Template.png',
    textColor: '#FAF7F2',
    authorColor: '#F2A98A',
    contextColor: '#C96A42',
    fontFamily: 'Playfair Display, Georgia, serif',
    defaultFontSize: 40,
    textBounds: { topRatio: 0.30, bottomRatio: 0.70, leftRatio: 0.12, rightRatio: 0.88 }
  },
  {
    id: 'figma_carousel_2',
    name: 'Figma Editorial Glow',
    type: 'image',
    imageSrc: '/images/Templates/Carousel template 002 Template.png',
    textColor: '#FFF5EC',
    authorColor: '#F2A98A',
    contextColor: '#E07A5F',
    fontFamily: 'Playfair Display, Georgia, serif',
    defaultFontSize: 40,
    textBounds: { topRatio: 0.30, bottomRatio: 0.70, leftRatio: 0.12, rightRatio: 0.88 }
  },
  {
    id: 'figma_poetry',
    name: 'Figma Poetry Lore',
    type: 'image',
    imageSrc: '/images/Templates/Poetry Prompt.png',
    textColor: '#FAF7F2',
    authorColor: '#F2A98A',
    contextColor: '#C96A42',
    fontFamily: 'Georgia, serif',
    defaultFontSize: 38,
    textBounds: { topRatio: 0.35, bottomRatio: 0.75, leftRatio: 0.14, rightRatio: 0.86 }
  },
  {
    id: 'velvet_obsidian',
    name: 'Velvet Obsidian',
    type: 'procedural',
    bgStart: '#1A050D',
    bgEnd: '#080104',
    textColor: '#FAF7F2',
    authorColor: '#F2A98A',
    quoteGlyphColor: '#C96A42',
    watermarkColor: 'rgba(242, 169, 138, 0.45)',
    borderColor: 'rgba(242, 169, 138, 0.25)',
    badgeBg: 'rgba(92, 26, 46, 0.6)',
    fontFamily: 'Playfair Display, Georgia, serif',
    defaultFontSize: 42
  },
  {
    id: 'parchment_scribe',
    name: 'Vintage Parchment',
    type: 'procedural',
    bgStart: '#FAF7F2',
    bgEnd: '#F2E9D8',
    textColor: '#2C1A0E',
    authorColor: '#5C1A2E',
    quoteGlyphColor: '#C96A42',
    watermarkColor: 'rgba(44, 26, 14, 0.5)',
    borderColor: 'rgba(44, 26, 14, 0.15)',
    badgeBg: 'rgba(92, 26, 46, 0.1)',
    fontFamily: 'Georgia, serif',
    defaultFontSize: 42
  }
];

export default function QuoteStudioModal({ 
  isOpen, 
  onClose, 
  initialQuote = '', 
  initialAuthor = '', 
  initialContext = 'Writers’ Village • Paper Thoughts' 
}) {
  const canvasRef = useRef(null);
  const [quoteText, setQuoteText] = useState(initialQuote || "We loved with a love that was more than love, and lived in the lines left behind.");
  const [authorName, setAuthorName] = useState(initialAuthor || "Paper Thoughts Writer");
  const [contextTag, setContextTag] = useState(initialContext || "Writers’ Village");
  const [selectedTemplateId, setSelectedTemplateId] = useState('figma_carousel_1');
  const [aspectRatio, setAspectRatio] = useState('square'); // 'square' (1:1) or 'story' (9:16)
  const [fontSize, setFontSize] = useState(40);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Sync state when props update
  useEffect(() => {
    if (initialQuote) setQuoteText(initialQuote);
    if (initialAuthor) setAuthorName(initialAuthor);
    if (initialContext) setContextTag(initialContext);
  }, [initialQuote, initialAuthor, initialContext]);

  const currentTemplate = FIGMA_TEMPLATES.find(t => t.id === selectedTemplateId) || FIGMA_TEMPLATES[0];

  // Canvas Drawing Routine
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const width = 1080;
    const height = aspectRatio === 'square' ? 1080 : 1920;

    canvas.width = width;
    canvas.height = height;

    const renderTextOverlays = () => {
      const cleanQuote = quoteText.replace(/^["“]|["”]$/g, '').trim();

      if (currentTemplate.type === 'image') {
        // --- FIGMA TEMPLATE TEXT PLACEMENT ---
        const bounds = currentTemplate.textBounds || { topRatio: 0.28, bottomRatio: 0.72, leftRatio: 0.12, rightRatio: 0.88 };
        const contentLeft = width * bounds.leftRatio;
        const contentRight = width * bounds.rightRatio;
        const contentMaxWidth = contentRight - contentLeft;
        const centerY = height * ((bounds.topRatio + bounds.bottomRatio) / 2);

        // 1. Context Tag
        if (contextTag) {
          ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = currentTemplate.contextColor || '#F2A98A';
          ctx.textAlign = 'center';
          ctx.fillText(contextTag.toUpperCase(), width / 2, height * bounds.topRatio - 20);
        }

        // 2. Quote Text (Multi-line wrap)
        const computedFontSize = fontSize;
        ctx.font = `italic ${computedFontSize}px ${currentTemplate.fontFamily}`;
        ctx.fillStyle = currentTemplate.textColor || '#FAF7F2';
        ctx.textAlign = 'center';

        const words = cleanQuote.split(' ');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > contentMaxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = computedFontSize * 1.42;
        const totalTextHeight = lines.length * lineHeight;
        const startY = centerY - (totalTextHeight / 2) + (computedFontSize / 3);

        // Render Opening Quote Mark
        ctx.fillStyle = currentTemplate.authorColor || '#F2A98A';
        ctx.font = 'italic bold 80px Georgia, serif';
        ctx.fillText('“', width / 2, startY - 40);

        // Render Lines
        ctx.font = `italic ${computedFontSize}px ${currentTemplate.fontFamily}`;
        ctx.fillStyle = currentTemplate.textColor || '#FAF7F2';
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], width / 2, startY + (i * lineHeight));
        }

        // 3. Author Byline
        const authorY = startY + totalTextHeight + 35;
        ctx.fillStyle = currentTemplate.authorColor || '#F2A98A';
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`— ${authorName || 'Paper Thoughts Member'}`, width / 2, authorY);

      } else {
        // --- PROCEDURAL TEMPLATE RENDERING ---
        const padding = aspectRatio === 'square' ? 65 : 85;
        
        // Background Gradient
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, 50,
          width / 2, height / 2, width * 0.75
        );
        gradient.addColorStop(0, currentTemplate.bgStart);
        gradient.addColorStop(1, currentTemplate.bgEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Ornate Border
        ctx.strokeStyle = currentTemplate.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, width - (padding * 2), height - (padding * 2));

        // Corner Accents
        const notchSize = 14;
        ctx.strokeStyle = currentTemplate.authorColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(padding - 4, padding - 4, notchSize, notchSize);
        ctx.strokeRect(width - padding - notchSize + 4, padding - 4, notchSize, notchSize);
        ctx.strokeRect(padding - 4, height - padding - notchSize + 4, notchSize, notchSize);
        ctx.strokeRect(width - padding - notchSize + 4, height - padding - notchSize + 4, notchSize, notchSize);

        // Context Badge
        if (contextTag) {
          ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const tagText = contextTag.toUpperCase();
          const tagWidth = ctx.measureText(tagText).width + 36;
          const tagHeight = 34;
          const tagX = (width - tagWidth) / 2;
          const tagY = padding + 50;

          ctx.fillStyle = currentTemplate.badgeBg;
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 17);
          ctx.fill();

          ctx.strokeStyle = currentTemplate.borderColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = currentTemplate.authorColor;
          ctx.textAlign = 'center';
          ctx.fillText(tagText, width / 2, tagY + 23);
        }

        // Giant Quote Glyph
        ctx.fillStyle = currentTemplate.quoteGlyphColor;
        ctx.font = 'italic bold 110px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('“', width / 2, padding + 170);

        // Wrap Quote Text
        const contentMaxWidth = width - (padding * 2) - 120;
        const computedFontSize = fontSize;
        ctx.font = `italic ${computedFontSize}px ${currentTemplate.fontFamily}`;
        ctx.fillStyle = currentTemplate.textColor;

        const words = cleanQuote.split(' ');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > contentMaxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = computedFontSize * 1.45;
        const totalTextHeight = lines.length * lineHeight;
        const startY = (height / 2) - (totalTextHeight / 2) + 20;

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], width / 2, startY + (i * lineHeight));
        }

        // Author Byline
        const dividerY = startY + totalTextHeight + 40;
        ctx.strokeStyle = currentTemplate.quoteGlyphColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 60, dividerY);
        ctx.lineTo(width / 2 + 60, dividerY);
        ctx.stroke();

        ctx.fillStyle = currentTemplate.authorColor;
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`— ${authorName || 'Paper Thoughts Member'}`, width / 2, dividerY + 48);

        // Watermark Footer
        const footerY = height - padding - 35;
        ctx.fillStyle = currentTemplate.watermarkColor;
        ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('PAPER THOUGHTS • WE LIVE IN THE LINES', width / 2, footerY);
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('paperthoughts.org', width / 2, footerY + 22);
      }
    };

    // If Figma image template, draw background image first
    if (currentTemplate.type === 'image' && currentTemplate.imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentTemplate.imageSrc;
      img.onload = () => {
        // Draw background image scaled to fill canvas
        ctx.drawImage(img, 0, 0, width, height);
        renderTextOverlays();
        setImageLoaded(true);
      };
      img.onerror = () => {
        // Fallback to dark background if image fails
        ctx.fillStyle = '#1A050D';
        ctx.fillRect(0, 0, width, height);
        renderTextOverlays();
      };
    } else {
      renderTextOverlays();
    }

  }, [quoteText, authorName, contextTag, selectedTemplateId, aspectRatio, fontSize, currentTemplate]);

  // Redraw canvas on state changes
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        drawCanvas();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [isOpen, drawCanvas, selectedTemplateId, aspectRatio, fontSize]);

  // 1-Click Download High-Res PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    const imageUri = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const slug = (authorName || 'quote').replace(/\s+/g, '_').toLowerCase();
    link.download = `PaperThoughts_${slug}_${aspectRatio}.png`;
    link.href = imageUri;
    link.click();
    setIsExporting(false);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#F2A98A', '#5C1A2E', '#C96A42']
    });
  };

  // 1-Click Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedStatus(true);
        setIsExporting(false);
        setTimeout(() => setCopiedStatus(false), 2500);
      });
    } catch (err) {
      console.error("Clipboard copy fallback", err);
      handleDownload();
    }
  };

  // Native Mobile Share
  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `paper_thoughts_quote.png`, { type: 'image/png' });
        try {
          await navigator.share({
            title: `Quote by ${authorName} | Paper Thoughts`,
            text: `“${quoteText}” — ${authorName}\n\nJoin the lines: paperthoughts.org`,
            files: [file]
          });
        } catch (e) {
          console.log("Share dismissed");
        }
      });
    } else {
      handleCopyImage();
    }
  };

  // Copy Formatted Social Caption
  const handleCopyCaption = () => {
    const caption = `“${quoteText.trim()}”\n\n— ${authorName}\n\nWritten in the Writers’ Village at Paper Thoughts. Join the lines at paperthoughts.org\n\n#PaperThoughts #AfricanLiterature #WritersVillage #WeLiveInTheLines #NigerianWriters`;
    navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#140409] border border-[#F2A98A]/30 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden relative text-cream flex flex-col my-auto"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080104]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5c1a2e] to-[#c96a42] text-[#F2A98A] flex items-center justify-center shadow-md">
              <Quote size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-cream">Social Quote Studio</h3>
              <p className="text-[10px] font-mono text-[#F2A98A]">Powered by Official Paper Thoughts Figma Templates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Workspace: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          
          {/* Left Column: Real-time Interactive Canvas Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4 bg-[#080104]/60 p-4 sm:p-6 rounded-2xl border border-white/5">
            
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setAspectRatio('square')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  aspectRatio === 'square'
                    ? 'bg-[#5c1a2e] text-[#F2A98A] border border-[#F2A98A]/30 shadow-sm'
                    : 'text-cream/60 hover:text-cream'
                }`}
              >
                <Square size={13} />
                <span>Square (1:1 Feed)</span>
              </button>

              <button
                onClick={() => setAspectRatio('story')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  aspectRatio === 'story'
                    ? 'bg-[#5c1a2e] text-[#F2A98A] border border-[#F2A98A]/30 shadow-sm'
                    : 'text-cream/60 hover:text-cream'
                }`}
              >
                <Smartphone size={13} />
                <span>Story (9:16 Status)</span>
              </button>
            </div>

            {/* Canvas Container */}
            <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-[#F2A98A]/30 flex items-center justify-center max-w-full">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto max-h-[420px] rounded-xl object-contain"
                style={{
                  aspectRatio: aspectRatio === 'square' ? '1 / 1' : '9 / 16'
                }}
              />
            </div>

            {/* Quick Action Row */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full">
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Download size={14} />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handleCopyImage}
                disabled={isExporting}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-cream font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
              >
                {copiedStatus ? <Check size={14} className="text-[#1DB954]" /> : <Copy size={14} />}
                <span>{copiedStatus ? "Image Copied!" : "Copy Image"}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="py-2.5 px-4 rounded-xl bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1DB954] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Share to Instagram / WhatsApp"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>

          </div>

          {/* Right Column: Customization Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            
            {/* 1. Template Selector (Figma & Procedural) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#F2A98A] font-bold">
                Template Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FIGMA_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        if (tmpl.defaultFontSize) setFontSize(tmpl.defaultFontSize);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#F2A98A] ring-1 ring-[#F2A98A] bg-white/10 shadow-sm' 
                          : 'border-white/10 bg-[#080104]/80 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-lg bg-[#5c1a2e] flex items-center justify-center text-[#F2A98A] flex-shrink-0">
                        {tmpl.type === 'image' ? <ImageIcon size={12} /> : <Layers size={12} />}
                      </div>
                      <span className="text-xs font-sans font-bold text-cream truncate">
                        {tmpl.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quote Text Editor */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#F2A98A] font-bold">
                Quote Text
              </label>
              <textarea
                rows="4"
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Paste or write the quote..."
                className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl p-3 text-xs font-serif text-cream placeholder-cream/30 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* 3. Author Name & Context Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-cream/70">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author Name"
                  className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3 py-2 text-xs text-cream placeholder-cream/30 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-cream/70">
                  Tag / Chapter
                </label>
                <input
                  type="text"
                  value={contextTag}
                  onChange={(e) => setContextTag(e.target.value)}
                  placeholder="e.g. Writers' Village"
                  className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3 py-2 text-xs text-cream placeholder-cream/30 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Font Size Slider */}
            <div className="flex items-center justify-between text-xs font-mono text-cream/70 pt-1">
              <span>Font Size ({fontSize}px)</span>
              <input
                type="range"
                min="24"
                max="56"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-32 accent-[#F2A98A] cursor-pointer"
              />
            </div>

            {/* 5. Copy Ready-to-Post Caption */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleCopyCaption}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cream text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {captionCopied ? <Check size={14} className="text-[#1DB954]" /> : <Send size={13} />}
                <span>{captionCopied ? "Caption Copied with Hashtags!" : "Copy Ready-to-Post Caption"}</span>
              </button>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
