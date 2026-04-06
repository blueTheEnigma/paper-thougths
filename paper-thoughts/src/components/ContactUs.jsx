"use client";
import { Mail, Send } from 'lucide-react';
import { FaInstagram, FaWhatsapp, FaXTwitter, FaTiktok, FaYoutube, FaLinkedin } from "react-icons/fa6";

export default function ContactUs() {
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

        {/* Right side: Form */}
        <div className="flex-1 bg-white p-10 rounded-3xl border border-sage/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          
          <h3 className="text-4xl font-display text-burgundy mb-2 relative z-10">Become a Lore Keeper</h3>
          <p className="text-ink/60 mb-8 relative z-10 font-bold uppercase tracking-widest text-xs">Join our mailing list</p>

          <form action="https://formspree.io/f/mdapybqp" method="POST" className="flex flex-col gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">Full Name</label>
              <input type="text" name="name" required className="w-full bg-cream/50 border-b-2 border-sage/30 px-0 py-3 focus:outline-none focus:border-primary transition-colors text-lg" placeholder="Type here..." />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">Email Address</label>
              <input type="email" name="email" required className="w-full bg-cream/50 border-b-2 border-sage/30 px-0 py-3 focus:outline-none focus:border-primary transition-colors text-lg" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">Chapter Interest</label>
              <select name="chapter" className="w-full bg-cream/50 border-b-2 border-sage/30 px-0 py-3 focus:outline-none focus:border-primary transition-colors text-lg font-bold">
                <option>Zaria (ABU)</option>
                <option>Kaduna City</option>
                <option>Abuja FCT</option>
                <option>Online / Elsewhere</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">The last book you actually finished?</label>
              <input type="text" name="last_book" className="w-full bg-cream/50 border-b-2 border-sage/30 px-0 py-3 focus:outline-none focus:border-primary transition-colors text-lg italic" placeholder="No judgment here..." />
            </div>

            <button type="submit" className="mt-8 bg-ink text-cream font-bold py-5 px-8 rounded-none border border-ink hover:bg-cream hover:text-ink transition-colors uppercase tracking-widest text-sm w-full flex justify-center items-center gap-2">
              Submit Application
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
