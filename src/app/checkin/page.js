"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, Loader2, CheckCircle2, ShieldCheck, MapPin, KeyRound, CalendarDays } from 'lucide-react';
import confetti from 'canvas-confetti';

function CheckinFormContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [memberName, setMemberName] = useState("");
  const [points, setPoints] = useState(0);
  
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && data.events) {
          setEvents(data.events);
          
          // Pre-select if URL parameter matches
          const urlEvent = searchParams.get('event');
          if (urlEvent) {
            const matched = data.events.find(e => e.name === urlEvent);
            if (matched) setSelectedEvent(matched);
            else if (data.events.length > 0) setSelectedEvent(data.events[0]);
          } else if (data.events.length > 0) {
            setSelectedEvent(data.events[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setIsLoadingEvents(false);
      }
    }
    fetchEvents();
  }, [searchParams]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!selectedEvent) {
      setError("Please select an event.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.target);
    const data = {
      lkid: formData.get('lkid'),
      secret: formData.get('secret'),
      event: selectedEvent.name,
      eventType: selectedEvent.type
    };

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setMemberName(result.name);
        setPoints(result.points);
        setIsSuccess(true);
        triggerConfetti();
      } else {
        setError(result.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto text-center py-12 px-6"
      >
        <div className="w-24 h-24 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={56} className="text-sage" />
        </div>
        <h2 className="text-5xl font-display text-burgundy mb-4">Checked In!</h2>
        <p className="text-xl text-ink/80 mb-8 font-quote italic">
          Welcome to the lines, {memberName}.
        </p>
        <div className="bg-white border-2 border-sage/20 rounded-3xl p-8 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block mb-2">Event Recorded</span>
          <div className="text-2xl font-bold text-burgundy mb-6">{selectedEvent?.name}</div>
          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 text-sm font-bold text-accent">
            Total Event Points: {points} / 6
          </div>
          {points >= 6 && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm text-sage font-bold px-4 py-2 bg-sage/10 rounded-full inline-block">
              🎉 Keeper Status Achieved!
            </motion.p>
          )}
        </div>
        <button 
          onClick={() => setIsSuccess(false)}
          className="mt-12 text-ink/40 font-bold uppercase tracking-widest text-xs hover:text-burgundy transition-colors"
        >
          Check in another member
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto bg-white p-8 md:p-12 rounded-[40px] border border-sage/20 shadow-xl relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck className="text-sage" size={20} />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Secure Check-in</span>
      </div>
      
      <h2 className="text-4xl font-display text-burgundy mb-8">Log Attendance</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Event Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
            <CalendarDays size={14} className="text-primary" /> Select Event
          </label>
          {isLoadingEvents ? (
            <div className="flex items-center gap-2 py-4 text-ink/50"><Loader2 className="animate-spin" size={16} /> Fetching active events...</div>
          ) : events.length === 0 ? (
            <div className="py-4 text-red-500 font-bold text-sm">No active events found. Please contact an admin.</div>
          ) : (
            <select 
              className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-xl font-bold appearance-none cursor-pointer"
              value={selectedEvent?.name || ""}
              onChange={(e) => {
                const matched = events.find(ev => ev.name === e.target.value);
                if (matched) setSelectedEvent(matched);
              }}
            >
              {events.map((ev, i) => (
                <option key={i} value={ev.name}>{ev.name} ({ev.type === 'physical' ? '2 Pts' : '1 Pt'})</option>
              ))}
            </select>
          )}
        </div>

        {/* LK-ID */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
            <QrCode size={14} className="text-primary" /> Lore Keeper ID
          </label>
          <input 
            type="text" 
            name="lkid" 
            required 
            placeholder="LK-2026-..."
            className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-2xl font-mono uppercase"
          />
        </div>

        {/* Secret Code */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
            <KeyRound size={14} className="text-primary" /> Event Cipher
          </label>
          <input 
            type="text" 
            name="secret" 
            required 
            placeholder="Enter the secret code"
            className="w-full bg-transparent border-b-2 border-sage/20 px-0 py-4 focus:outline-none focus:border-primary transition-colors text-xl"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || events.length === 0}
          className="w-full bg-burgundy text-white font-bold py-6 px-10 rounded-full hover:bg-ink transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-sm disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Log Attendance"}
        </button>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 p-4 rounded-xl border border-red-200">
            <p className="text-red-600 text-center font-bold text-sm">{error}</p>
          </motion.div>
        )}
      </form>

      <div className="mt-8 text-center border-t border-sage/10 pt-8">
        <a href="/lookup" className="text-xs text-ink/60 hover:text-primary font-bold uppercase tracking-widest transition-colors">
          Forgot your LK-ID? Look it up
        </a>
      </div>
    </motion.div>
  );
}

export default function CheckinPage() {
  return (
    <main className="min-h-screen bg-cream selection:bg-primary/30 flex items-center justify-center py-12 px-6">
      <Suspense fallback={<Loader2 className="animate-spin text-primary" size={48} />}>
        <CheckinFormContent />
      </Suspense>
    </main>
  );
}

