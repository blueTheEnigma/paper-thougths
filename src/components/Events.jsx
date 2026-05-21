"use client";
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, Clock, MapPin } from 'lucide-react';

export default function Events({ initialEvents = [] }) {
  const displayEvents = initialEvents.length > 0 ? initialEvents : [];

  return (
    <section id="events" className="px-4 sm:px-6 pb-16 md:pb-24 bg-cream min-h-[70vh]">
      <div className="max-w-4xl mx-auto flex flex-col items-center">

        {/* Page header */}
        <div className="w-full text-center mb-8 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-burgundy mb-3 leading-tight">
            Upcoming Gatherings
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-ink/70 font-quote italic max-w-xl mx-auto leading-relaxed">
            Secure your spot at the table. We have a habit of running out of seats.
          </p>
        </div>

        {/* Events grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {displayEvents.length > 0 ? (
            displayEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="bg-white rounded-2xl sm:rounded-[24px] shadow-md border border-sage/25 p-5 sm:p-7 flex flex-col group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Date & time row */}
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] font-bold text-accent uppercase tracking-widest mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {event.date || 'TBD'}
                  </span>
                  <span className="text-ink/25">•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {event.time || 'TBD'}
                  </span>
                </div>

                {/* Event name */}
                <h2 className="text-xl sm:text-2xl font-display text-burgundy leading-snug mb-1">
                  {event.name}
                </h2>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 mb-3">
                  <MapPin size={12} />
                  <span>{event.location || 'TBD'}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-ink/75 leading-relaxed flex-1 mb-5">
                  {event.description || 'Join us for another captivating gathering of the Archive.'}
                </p>

                {/* CTA */}
                {event.rsvpLink ? (
                  <a
                    href={event.rsvpLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-burgundy text-cream text-sm py-3 rounded-xl font-bold border border-burgundy hover:bg-ink transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={15} /> Register Now
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full bg-sage/15 text-ink/35 text-sm py-3 rounded-xl font-bold cursor-not-allowed border border-sage/20"
                  >
                    RSVPs Not Yet Open
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 sm:py-24 bg-white/60 rounded-2xl sm:rounded-3xl border border-dashed border-sage/30 px-6">
              <span className="text-3xl block mb-3">📖</span>
              <p className="text-ink/40 font-quote italic text-sm sm:text-base">
                The grand ledger is currently quiet. Check back soon for new tales.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
