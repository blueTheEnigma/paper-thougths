"use client";

export default function Events() {
  return (
    <section id="events" className="py-24 px-6 bg-cream border-t border-sage/20 min-h-[80vh]">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-5xl font-display text-burgundy mb-2 text-center">RSVP for our next reading</h2>
        <p className="text-xl text-ink/80 mb-12 font-quote italic text-center">
          Secure your spot below. We have a habit of running out of seats.
        </p>
        
        {/* Luma Embed Area */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-sage/30">
          <iframe
            src="https://lu.ma/embed-checkout/evt-rBDsDVUfKi8CYft"
            width="100%"
            height="600"
            frameBorder="0"
            border="0"
            allowFullScreen
            className="w-full"
            aria-label="Luma Event"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
