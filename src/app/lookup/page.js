"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Copy, CheckCircle2, BookOpen } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LookupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setResult(null);

    const formData = new FormData(e.target);
    const query = formData.get('query');

    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Member not found.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-cream selection:bg-primary/30 flex items-center justify-center py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white p-8 md:p-12 rounded-[40px] border border-sage/20 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <Logo className="text-sage" size={20} />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Archive Lookup</span>
        </div>
        
        <h2 className="text-4xl font-display text-burgundy mb-4">Find your ID</h2>
        <p className="text-ink/60 mb-10 text-sm font-quote italic">
          Enter your Instagram handle or Email Address to retrieve your Lore Keeper ID.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input 
              type="text" 
              name="query" 
              required 
              placeholder="@username or email"
              className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-xl"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-ink text-cream font-bold py-5 px-10 rounded-full hover:bg-burgundy transition-all flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Search size={18} /> Search Archive</>}
          </button>
        </form>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-center font-bold text-sm mt-6">
            {error}
          </motion.p>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-primary/5 p-6 rounded-3xl border border-primary/20 text-center"
          >
            <p className="text-xs font-bold uppercase text-accent mb-2">Member Found</p>
            <p className="font-display text-2xl text-burgundy mb-4">{result.name}</p>
            <div className="text-3xl font-mono font-bold text-ink tracking-tighter mb-6">
              {result.lkid}
            </div>
            <button 
              onClick={() => copyToClipboard(result.lkid)}
              className="mx-auto flex items-center justify-center gap-2 bg-white border border-sage/20 py-2 px-6 rounded-xl font-bold text-ink hover:bg-sage/10 transition-colors text-sm"
            >
              {copied ? <CheckCircle2 size={16} className="text-sage" /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
