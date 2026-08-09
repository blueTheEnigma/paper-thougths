'use client';

import { useState } from 'react';

export default function ZodiacShareModal({ chartResult, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const { sunSign, moonSign, risingSign } = chartResult;

  const shareText = `✨ My Literary Natal Chart from Paper Thoughts:
☀️ Sun: The ${sunSign.name} (${sunSign.title})
🌙 Moon: The ${moonSign.name}
⬆️ Rising: The ${risingSign.name}

Discover your Literary Zodiac sign at Paper Thoughts!`;

  // Format WhatsApp Link using Nigerian rule
  const handleWhatsAppShare = () => {
    let cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.startsWith('0') && cleanedNumber.length === 11) {
      cleanedNumber = '234' + cleanedNumber.slice(1);
    }

    const encodedMessage = encodeURIComponent(shareText);
    const whatsappUrl = cleanedNumber 
      ? `https://wa.me/${cleanedNumber}?text=${encodedMessage}`
      : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#120308] border border-[#F2A98A]/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
        >
          ✕
        </button>

        <div className="space-y-2 text-center">
          <span className="text-3xl">📲</span>
          <h3 className="text-2xl font-serif font-bold text-cream">
            Share Your Literary Chart
          </h3>
          <p className="text-xs text-cream/70 font-serif italic">
            Show your literary essence to friends, book clubs, and social media!
          </p>
        </div>

        {/* PREVIEW CARD */}
        <div className="p-5 bg-[#FFF5EC] rounded-2xl border border-[#2C1A0E]/15 text-[#2C1A0E] font-serif space-y-2 text-sm shadow-md">
          <p className="font-bold text-[#5C1A2E]">✨ Paper Thoughts Literary Zodiac</p>
          <p>☀️ <strong>Sun:</strong> The {sunSign.name} ({sunSign.title})</p>
          <p>🌙 <strong>Moon:</strong> The {moonSign.name}</p>
          <p>⬆️ <strong>Rising:</strong> The {risingSign.name}</p>
        </div>

        {/* WHATSAPP INPUT */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-[#F2A98A]/80 block">
            Optional: Enter WhatsApp Phone Number
          </label>
          <input
            type="tel"
            placeholder="e.g. 08031234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-cream placeholder-slate-600 text-sm focus:outline-none focus:border-[#F2A98A]/60"
          />
        </div>

        {/* SHARE BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex-grow py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <span>💬</span> Share to WhatsApp
          </button>

          <button
            onClick={handleCopyText}
            className="py-3.5 px-6 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-cream/80 font-semibold text-sm transition-all cursor-pointer"
          >
            {copied ? 'Copied! ✓' : 'Copy Text 📋'}
          </button>
        </div>

      </div>
    </div>
  );
}
