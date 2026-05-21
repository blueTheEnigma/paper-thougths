"use client";
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, Clock, MapPin } from 'lucide-react';

export default function Events({ initialEvents = [] }) {
  // Use initialEvents if available, otherwise show nothing or a message
  const displayEvents = initialEvents.length > 0 ? initialEvents : [];

  return (
    <section id="events" className="py-12 md:py-24 px-4 sm:px-6 bg-cream min-h-[80vh]">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl sm:text-5xl font-display text-burgundy mb-2 text-center">Upcoming Gatherings</h2>
        <p className="text-base sm:text-xl text-ink/80 mb-8 sm:mb-16 font-quote italic text-center">
          Secure your spot at the table. We have a habit of running out of seats.
        </p>


        {/* Dynamic Events Listing */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {displayEvents.length > 0 ? (
            displayEvents.map((event, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-[24px] shadow-xl border border-sage/30 p-6 sm:p-8 flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Calendar size={12} /> {event.date || "TBD"} 
                  <span className="opacity-50 mx-1">•</span> 
                  <Clock size={12} /> {event.time || "TBD"}
                </div>
                <h3 className="text-2xl font-display text-burgundy mb-1 leading-tight">{event.name}</h3>
                <div className="text-sm font-bold text-ink/50 mb-4 flex items-center gap-2">
                  <MapPin size={14} /> {event.location || "TBD"}
                </div>
                
                <p className="text-ink/80 mb-8 flex-1 leading-relaxed text-sm">
                  {event.description || "Join us for another captivating gathering of the Archive."}
                </p>
                
                {event.rsvpLink ? (
                  <a 
                    href={event.rsvpLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-burgundy text-white py-3 rounded-xl font-bold border border-burgundy hover:bg-ink transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} /> Register Now
                  </a>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-sage/20 text-ink/40 py-3 rounded-xl font-bold cursor-not-allowed border border-sage/30"
                  >
                    RSVPs Not Yet Open
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border border-dashed border-sage/40">
              <p className="text-ink/40 font-quote italic">The grand ledger is currently quiet. Check back soon for new tales.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
