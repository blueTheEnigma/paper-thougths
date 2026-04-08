"use client";
import { motion } from 'framer-motion';

const defaultEvents = [
  {
    id: 1,
    title: "Paper Thoughts ABU Weekly Saturday Meetings",
    date: "Every Saturday",
    time: "4:30 PM",
    location: "Sculpture Garden",
    description: "Join us for our weekly gathering where we debate literature, sip tea, and dive deep into our current reads. Newcomers always welcome.",
  },
  {
    id: 2,
    title: "Poetry & Wine Night",
    date: "Coming Soon",
    time: "TBD",
    location: "Main Clubhouse",
    description: "An evening of spoken word, vintage selections, and acoustic ambiance. Bring your favorite verses to share with the room.",
  }
];
export default function Events() {
  return (
    <section id="events" className="py-24 px-6 bg-cream border-t border-sage/20 min-h-[80vh]">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-5xl font-display text-burgundy mb-2 text-center">RSVP for our next reading</h2>
        <p className="text-xl text-ink/80 mb-12 font-quote italic text-center">
          Secure your spot below. We have a habit of running out of seats.
        </p>
        
        {/* Static Events Listing */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {defaultEvents.map((event, index) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl border border-sage/30 p-6 md:p-8 flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">{event.date} <span className="opacity-50 mx-1">•</span> {event.time}</div>
              <h3 className="text-2xl font-display text-burgundy mb-1">{event.title}</h3>
              <div className="text-sm font-bold text-ink/50 mb-4">{event.location}</div>
              
              <p className="text-ink/80 mb-8 flex-1 leading-relaxed">
                {event.description}
              </p>
              
              <button 
                disabled
                className="w-full bg-sage/20 text-ink/40 py-3 rounded-xl font-bold cursor-not-allowed border border-sage/30"
              >
                RSVPs Not Yet Open
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
