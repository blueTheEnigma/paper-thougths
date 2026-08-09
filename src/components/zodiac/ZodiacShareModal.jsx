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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
        >
          ✕
        </button>

        <div className="space-y-2 text-center">
          <span className="text-3xl">📲</span>
          <h3 className="text-2xl font-serif font-bold text-amber-100">
            Share Your Literary Chart
          </h3>
          <p className="text-xs text-amber-200/70">
            Show your literary essence to friends, book clubs, and social media!
          </p>
        </div>

        {/* PREVIEW CARD */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/20 font-serif space-y-2 text-sm text-amber-100/90">
          <p className="font-bold text-amber-300">✨ Paper Thoughts Literary Zodiac</p>
          <p>☀️ <strong>Sun:</strong> The {sunSign.name} ({sunSign.title})</p>
          <p>🌙 <strong>Moon:</strong> The {moonSign.name}</p>
          <p>⬆️ <strong>Rising:</strong> The {risingSign.name}</p>
        </div>

        {/* WHATSAPP INPUT */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-amber-300/80">
            Optional: Enter WhatsApp Phone Number
          </label>
          <input
            type="tel"
            placeholder="e.g. 08031234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-amber-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* SHARE BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💬</span> Share to WhatsApp
          </button>

          <button
            onClick={handleCopyText}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-medium text-sm transition-all cursor-pointer"
          >
            {copied ? 'Copied! ✓' : 'Copy Text 📋'}
          </button>
        </div>

      </div>
    </div>
  );
}
