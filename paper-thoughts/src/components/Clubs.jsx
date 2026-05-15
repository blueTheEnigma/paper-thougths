"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Copy, Check, ShieldCheck, X, ExternalLink, Fingerprint } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const CHAPTERS = [
  {
    id: 'zaria',
    name: 'Zaria Portal',
    city: 'ABU Zaria',
    catchline: 'The Foundation.',
    bio: 'Where the arguments start and the biscuits run out first. Stressed students finding solace in fictional trauma.',
    heroImg: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800',
    link: 'https://chat.whatsapp.com/IWCbTxqmMrU1whaQh8qEr7'
  },
  {
    id: 'kaduna',
    name: 'Kaduna Portal',
    city: 'Kaduna City',
    catchline: 'The Sophistication.',
    bio: 'Book discussions seasoned with iced lattes and fierce intellectual debate. Currently part of the primary community.',
    heroImg: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
    link: 'https://chat.whatsapp.com/IWCbTxqmMrU1whaQh8qEr7'
  },
  {
    id: 'abuja',
    name: 'Abuja Portal',
    city: 'Abuja (FCT)',
    catchline: 'The Collective.',
    bio: 'Finally a place where "I\'m stuck on the bridge" is a valid excuse. Dedicated gatherings for the FCT faithful.',
    heroImg: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=800',
    link: 'https://chat.whatsapp.com/EGOcKnNQ78H6EWJoeM420P'
  }
];

export default function Clubs() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/me')
        .then(res => res.json())
        .then(data => {
          if (data.success) setProfile(data.profile);
        });
    }
  }, [isLoaded, user]);

  const name = profile?.name || user?.fullName || "[Name]";
  const lkid = profile?.lkid || "[LK-ID]";

  const introTemplate = selectedChapter 
    ? `My name is ${name}, identification: ${lkid}. I am entering the Paper Thoughts collective via the ${selectedChapter.city} portal.` 
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(introTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="clubs" className="py-24 px-6 bg-cream min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-display text-burgundy mb-6">Collective Portals</h1>
          <p className="font-quote text-2xl md:text-3xl italic text-ink/70 max-w-2xl mx-auto leading-tight">
            "Identity verification required for entry into the lines."
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {CHAPTERS.map(chapter => (
            <motion.div 
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-sage/20 flex flex-col hover:shadow-2xl transition-all group"
            >
              <div className="h-72 relative overflow-hidden">
                <img src={chapter.heroImg} alt={chapter.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-burgundy/40 group-hover:bg-transparent transition-colors duration-700"></div>
                <div className="absolute bottom-6 left-8">
                  <h3 className="text-4xl font-display text-white">{chapter.name}</h3>
                </div>
              </div>
              
              <div className="p-10 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-burgundy/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                  <MapPin size={12} /> {chapter.city}
                </div>
                <p className="text-ink/80 text-sm leading-relaxed mb-10 flex-1">
                  {chapter.bio}
                </p>
                
                <button 
                  onClick={() => setSelectedChapter(chapter)}
                  className="w-full bg-ink text-white py-5 rounded-2xl font-bold hover:bg-burgundy transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  <Fingerprint size={18} /> Enter Portal
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Dispatch Modal */}
      <AnimatePresence>
        {selectedChapter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-ink/60"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-cream w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative"
            >
              <button 
                onClick={() => setSelectedChapter(null)}
                className="absolute top-8 right-8 text-ink/20 hover:text-burgundy transition-colors"
              >
                <X size={28} />
              </button>

              <div className="p-10 md:p-14">
                <div className="w-20 h-20 bg-burgundy text-white rounded-full flex items-center justify-center mb-8 shadow-xl">
                  <ShieldCheck size={40} />
                </div>
                
                <h2 className="text-4xl font-display text-burgundy mb-4">Security Dispatch</h2>
                <p className="text-ink/60 text-sm mb-10 leading-relaxed font-quote italic">
                  "To enter the collective portal and receive your private cipher key, you must first present your identification."
                </p>

                <div className="space-y-8">
                  {/* Step 1: Identification */}
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 border border-burgundy/20 text-burgundy rounded-full flex items-center justify-center font-bold text-sm">01</div>
                    <div>
                      <h4 className="font-bold text-ink uppercase tracking-widest text-xs mb-2">Identification</h4>
                      {profile ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                          <Check size={16} /> Identity Verified: {lkid}
                        </div>
                      ) : (
                        <p className="text-xs text-ink/40 leading-relaxed">
                          Status: Unknown. <a href="/join" className="text-burgundy font-bold underline">Secure an LK-ID</a> to proceed.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 2: The Transmission */}
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 border border-burgundy/20 text-burgundy rounded-full flex items-center justify-center font-bold text-sm">02</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-ink uppercase tracking-widest text-xs mb-3">Copy Transmission</h4>
                      <div className="bg-white border border-sage/20 rounded-2xl p-5 relative group">
                        <p className="text-xs text-ink/60 pr-10 font-mono leading-relaxed">
                          {introTemplate}
                        </p>
                        <button 
                          onClick={handleCopy}
                          className="absolute top-4 right-4 text-ink/20 hover:text-burgundy transition-colors"
                        >
                          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Enter Group */}
                  <div className="pt-6">
                    <a 
                      href={selectedChapter.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl uppercase tracking-[0.2em] text-xs ${
                        profile ? 'bg-burgundy text-white hover:bg-ink shadow-burgundy/20' : 'bg-sage/10 text-ink/20 cursor-not-allowed border border-sage/20'
                      }`}
                      onClick={(e) => !profile && e.preventDefault()}
                    >
                      Initialize Portal Entry <ExternalLink size={18} />
                    </a>
                    {!profile && (
                      <p className="text-center text-[10px] text-burgundy/60 mt-4 font-bold uppercase tracking-widest">
                        LK-ID required for portal access.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
