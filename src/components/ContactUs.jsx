"use client";
import { useState, useEffect } from 'react';
import { Mail, Send, Loader2, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { FaInstagram, FaWhatsapp, FaXTwitter, FaTiktok, FaYoutube, FaLinkedin } from "react-icons/fa6";

export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [referredBy, setReferredBy] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setReferredBy(ref);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      chapter: formData.get('chapter'),
      last_book: formData.get('last_book'),
      referredBy: referredBy,
    };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-6 bg-cream border-t border-sage/20">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">
        
        {/* Left side: Intro & Socials */}
        <div className="flex-1">
          <h2 className="text-5xl font-display text-burgundy mb-6">Contact Us</h2>
          <p className="text-xl text-ink/80 mb-12 font-quote italic">
            We don't bite. We do recommend books you didn't ask for, though.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="mailto:Paperthoughts01@gmail.com" target="_blank" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl border border-sage/20 hover:border-accent hover:shadow-lg transition-all hover:-translate-y-1">
              <Mail size={32} className="text-primary group-hover:text-accent transition-colors" />
              <span className="font-bold text-ink text-sm">Email</span>
            </a>
            <a href="https://whatsapp.com/channel/0029Va7fhJv05MUYW6xOU20S" target="_blank" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl border border-sage/20 hover:border-[#25D366] hover:shadow-lg transition-all hover:-translate-y-1">
              <FaWhatsapp size={32} className="text-primary group-hover:text-[#25D366] transition-colors" />
              <span className="font-bold text-ink text-sm">WhatsApp</span>
            </a>
            <a href="https://www.linkedin.com/company/thoughts-on-paper/" target="_blank" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl border border-sage/20 hover:border-[#0077b5] hover:shadow-lg transition-all hover:-translate-y-1">
              <FaLinkedin size={32} className="text-primary group-hover:text-[#0077b5] transition-colors" />
              <span className="font-bold text-ink text-sm">LinkedIn</span>
            </a>
            <a href="https://www.tiktok.com/@paper_thoughts_?_r=1&_t=ZS-95JRlyYwq4m" target="_blank" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl border border-sage/20 hover:border-black hover:shadow-lg transition-all hover:-translate-y-1">
              <FaTiktok size={32} className="text-primary group-hover:text-black transition-colors" />
              <span className="font-bold text-ink text-sm">TikTok</span>
            </a>
            <a href="https://x.com/_paper_thoughts" target="_blank" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl border border-sage/20 hover:border-[#1DA1F2] hover:shadow-lg transition-all hover:-translate-y-1">
              <FaXTwitter size={32} className="text-primary group-hover:text-[#1DA1F2] transition-colors" />
              <span className="font-bold text-ink text-sm">X (Twitter)</span>
            </a>
            <a href="https://youtube.com/@paper_thoughts/community?si=Xj5kO8dt98FXzyD3" target="_blank" className="group flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl border border-sage/20 hover:border-[#FF0000] hover:shadow-lg transition-all hover:-translate-y-1">
              <FaYoutube size={32} className="text-primary group-hover:text-[#FF0000] transition-colors" />
              <span className="font-bold text-ink text-sm">YouTube</span>
            </a>
          </div>
        </div>

        {/* Right side: Archive CTA */}
        <div className="flex-1 bg-burgundy p-12 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
              <BookOpen size={40} className="text-cream" />
            </div>
            
            <h3 className="text-4xl font-display text-cream mb-4">The Archive Awaits</h3>
            <p className="text-cream/80 mb-10 text-lg font-quote italic max-w-sm mx-auto">
              Ready to claim your LK-ID and start your journey from Reader to Keeper?
            </p>

            <Link href="/join" className="group relative inline-flex items-center gap-3 bg-cream text-burgundy font-bold py-5 px-10 rounded-full hover:bg-white transition-all shadow-xl hover:shadow-2xl">
              <Sparkles size={20} className="text-accent" />
              <span className="uppercase tracking-[0.2em] text-sm">Join the Collective</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
