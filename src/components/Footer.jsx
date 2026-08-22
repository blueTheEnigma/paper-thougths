"use client";
import { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { usePathname } from 'next/navigation';
import { BookOpen, Send, Loader2 } from 'lucide-react';
import { FaInstagram, FaWhatsapp, FaTiktok, FaYoutube, FaLinkedin, FaDiscord } from "react-icons/fa6";
import { CROSSING_CONFIG } from '@/lib/crossingConfig';
import EasterEgg from './EasterEgg';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/round-table')) {
    return null;
  }
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setEmail("");
      } else {
        setStatus({ type: 'error', message: data.error || 'Subscription failed.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to connect. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-ink text-cream pt-20 pb-10 border-t border-white/10 relative overflow-hidden font-sans">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-burgundy/10 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/5">
        
        {/* Col 1: About (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-white/5 p-2 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
              <Logo className="text-primary" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight uppercase leading-none text-cream">Paper Thoughts</span>
              <span className="text-[9px] text-primary uppercase tracking-widest font-bold mt-1 leading-none">We live in the lines</span>
            </div>
          </Link>
          <p className="text-xs text-cream/65 leading-relaxed max-w-sm">
            An opinionated reading community spanning Zaria, Kaduna, and Abuja. We read heavily, debate fiercely, and never use PDFs. Join us in the lines.
          </p>
          <div className="flex items-center gap-3">
            <a 
              href={CROSSING_CONFIG.instagram} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-[#E1306C] hover:bg-white/10 transition-all"
              title="Instagram"
            >
              <FaInstagram size={16} />
            </a>
            <a 
              href={CROSSING_CONFIG.whatsappChannel} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-[#25D366] hover:bg-white/10 transition-all"
              title="WhatsApp Channel"
            >
              <FaWhatsapp size={16} />
            </a>
            <a 
              href={CROSSING_CONFIG.tiktok} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-white hover:bg-white/10 transition-all"
              title="TikTok"
            >
              <FaTiktok size={14} />
            </a>
            <a 
              href={CROSSING_CONFIG.youtube} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-[#FF0000] hover:bg-white/10 transition-all"
              title="YouTube"
            >
              <FaYoutube size={16} />
            </a>
            <a 
              href={CROSSING_CONFIG.linkedin} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-[#0077b5] hover:bg-white/10 transition-all"
              title="LinkedIn"
            >
              <FaLinkedin size={16} />
            </a>
            <a 
              href={CROSSING_CONFIG.discord} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-[#5865F2] hover:bg-white/10 transition-all"
              title="Discord"
            >
              <FaDiscord size={16} />
            </a>
          </div>
        </div>

        {/* Col 2: Navigation (2.5 cols) */}
        <div className="lg:col-span-2 lg:col-start-6 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Quick Links</h4>
          <ul className="space-y-2.5 text-xs text-cream/75 font-bold">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link href="/podcasts" className="hover:text-primary transition-colors flex items-center gap-1.5"><span className="text-[#F2A98A]">🎙️</span> Spoken Lore (Podcasts)</Link></li>
            <li><Link href="/soundscapes" className="hover:text-primary transition-colors flex items-center gap-1.5"><span className="text-[#F2A98A]">🎵</span> Soundscapes</Link></li>
            <li><Link href="/bookstore" className="hover:text-primary transition-colors">Bookstore</Link></li>
            <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
            <li><Link href="/village" className="hover:text-primary transition-colors">Writers' Village</Link></li>
            <li><Link href="/clubs" className="hover:text-primary transition-colors">Clubs</Link></li>
            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        {/* Col 3: Chapters (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Chapters</h4>
          <ul className="space-y-2.5 text-xs text-cream/70">
            <li><Link href="/clubs" className="hover:text-primary transition-colors">Zaria (ABU)</Link></li>
            <li><Link href="/clubs" className="hover:text-primary transition-colors">Kaduna</Link></li>
            <li><Link href="/clubs" className="hover:text-primary transition-colors">Abuja</Link></li>
          </ul>
        </div>

        {/* Col 4: Newsletter (3.5 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary font-bold">The Weekly Dispatch</h4>
          <p className="text-xs text-cream/65 leading-relaxed">
            Get community updates, reading lists, and event notifications.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input 
                type="email" 
                required 
                placeholder="Your email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-cream placeholder-cream/30"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-primary hover:bg-cream text-ink px-3 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
            {status && (
              <p className={`text-[10px] font-bold ${status.type === 'success' ? 'text-primary' : 'text-red-400'}`}>
                {status.message}
              </p>
            )}
          </form>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <p className="text-[10px] text-cream/40">© {new Date().getFullYear()} Paper Thoughts. All rights reserved.</p>
          <p className="text-[10px] text-cream/30 italic mt-1">We didn't read the terms and conditions either, but please play nice.</p>
        </div>
        <div className="relative z-10">
          <EasterEgg />
        </div>
      </div>
    </footer>
  );
}
