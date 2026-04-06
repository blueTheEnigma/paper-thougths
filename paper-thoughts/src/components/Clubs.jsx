"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Camera } from 'lucide-react';

const CHAPTERS = [
  {
    id: 'abu',
    name: 'ABU',
    city: 'Zaria',
    established: '2022',
    members: 431,
    catchline: 'where the arguments start and the biscuits run out first.',
    bio: 'The foundational chapter. Mostly comprised of stressed students finding solace in fictional trauma.',
    heroImg: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800'
  },
  {
    id: 'kaduna',
    name: 'Kaduna',
    city: 'Kaduna City',
    established: '2025',
    members: 89,
    catchline: 'the sophisticated new sibling.',
    bio: 'We prefer our book discussions heavily seasoned with crocodile tears and iced lattes.',
    heroImg: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800'
  },
  {
    id: 'abuja',
    name: 'Abuja',
    city: 'Abuja (FCT)',
    established: '2025',
    members: 101,
    catchline: 'readings strictly above our tax bracket.',
    bio: 'Our primary activity is fighting traffic to make it to Saturday readings… finally a place where "I\'m stuck on the bridge" is a valid excuse.',
    heroImg: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=800'
  }
];

export default function Clubs({ images }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <section id="clubs" className="py-24 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-quote text-3xl md:text-5xl italic text-ink mb-6">
            "We don't have a dress code.<br/>We have a reading list."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CHAPTERS.map(chapter => (
            <div key={chapter.id} className="flex flex-col">
              <div 
                onClick={() => setExpanded(expanded === chapter.id ? null : chapter.id)}
                className="relative h-80 rounded-2xl overflow-hidden cursor-pointer group shadow-md"
              >
                <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ${expanded === chapter.id ? 'scale-110' : 'group-hover:scale-105'}`} style={{backgroundImage: `url(${chapter.heroImg})`}}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                  <div className="flex items-center gap-2 text-primary text-sm mb-2 font-bold uppercase tracking-wider">
                    <MapPin size={16} /> {chapter.city} · Est {chapter.established}
                  </div>
                  <h3 className="font-display text-4xl text-cream mb-2">{chapter.name}</h3>
                  <p className="font-quote italic text-cream/90">— {chapter.catchline}</p>
                  
                  <button className="mt-6 border border-primary text-primary px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {expanded === chapter.id ? 'Close' : 'View Chapter'}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {expanded === chapter.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-card mt-4 p-6 rounded-2xl border border-sage/30">
                      <div className="flex justify-between items-center mb-4 border-b border-sage/20 pb-4">
                        <span className="flex items-center gap-2 text-ink/70 font-bold"><Users size={18}/> {chapter.members} Members</span>
                      </div>
                      <p className="text-ink mb-6 leading-relaxed">{chapter.bio}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="h-40 bg-sage/20 rounded object-cover overflow-hidden">
                           <img src={chapter.id === 'abuja' ? (images?.abuja?.[0] || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f') : (images?.community?.[0] || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f')} className="w-full h-full object-cover" />
                        </div>
                        <div className="h-40 bg-primary/20 rounded object-cover overflow-hidden">
                           <img src={chapter.id === 'abuja' ? (images?.abuja?.[1] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c') : (images?.community?.[1] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c')} className="w-full h-full object-cover" />
                        </div>
                        <div className="h-40 bg-accent/20 rounded object-cover overflow-hidden">
                           <img src={chapter.id === 'abuja' ? (images?.abuja?.[2] || 'https://images.unsplash.com/photo-1512820790803-83ca734da794') : (images?.community?.[2] || 'https://images.unsplash.com/photo-1512820790803-83ca734da794')} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <a href="https://instagram.com/paperthoughts.ng" target="_blank" className="flex items-center justify-center gap-2 w-full bg-ink text-cream py-3 rounded-xl font-bold hover:bg-ink/90 transition-colors">
                          <Camera size={18}/> Find us on Instagram
                        </a>
                        <p className="text-center text-sm text-ink/60">DM us to join your local chapter</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
