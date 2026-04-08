"use client";
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MessageCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = "2349055433811";
const CHECKOUT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSchF6OdKRpWyjDZ7NxFLzyuAbaTLmd_11Dnn4eCiKz_HbyKkw/viewform?usp=header";

export default function Bookstore({ initialBooks }) {
  const [activeGenre, setActiveGenre] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showSoldOut, setShowSoldOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedBook) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedBook]);

  // Derive genres and counts
  const genres = useMemo(() => {
    const counts = { All: initialBooks.length };
    initialBooks.forEach(b => {
      const g = b.genre || 'Uncategorized';
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.keys(counts).sort((a,b) => a === 'All' ? -1 : a.localeCompare(b)).map(name => ({
      name, count: counts[name]
    }));
  }, [initialBooks]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return initialBooks.filter(b => {
      const matchesGenre = activeGenre === 'All' || b.genre === activeGenre;
      const matchesSearch = b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase());
      const isSoldOut = b.status?.toUpperCase() === 'SOLD OUT';
      const matchesSoldOut = showSoldOut ? true : !isSoldOut;
      return matchesGenre && matchesSearch && matchesSoldOut;
    });
  }, [activeGenre, search, initialBooks, showSoldOut]);

  const featured = useMemo(() => initialBooks.filter(b => b.featured), [initialBooks]);

  const handleWhatsapp = (book) => {
    const msg = `Hi, I'd like to order: *${book.title}* by ${book.author} (ID: ${book.id})`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const RatingDots = ({ rating }) => {
    const full = Math.floor(rating);
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full ${i <= full ? 'bg-accent' : 'bg-sage/30'}`} />
        ))}
      </div>
    );
  };

  return (
    <section id="bookstore" className="bg-[#FFF5EC] py-20 px-6 border-b border-sage/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-5xl font-display text-burgundy mb-4">Bookstore</h2>
          <p className="text-ink/70 max-w-xl mx-auto">Browse our full catalogue. Everything you see here is physically available, carefully curated, and not a PDF.</p>
        </div>

        {/* Panguin Picks */}
        {featured.length > 0 && (
          <div className="mb-16">
            <h3 className="text-xl font-bold text-accent uppercase tracking-widest mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-accent"></span> Panguin Picks
            </h3>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {featured.map(b => (
                <div key={`feat-${b.id}`} onClick={() => setSelectedBook(b)} className="min-w-[200px] w-[200px] cursor-pointer group">
                  <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md mb-3 border border-sage/20">
                    <img src={b.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={b.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <h4 className="font-bold text-ink leading-tight group-hover:text-accent transition-colors">{b.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* Left Sidebar (Desktop Filters) & Top Control Bar (Mobile) */}
          <div className="w-full lg:w-[250px] flex-shrink-0 flex flex-col gap-4 lg:gap-6 sticky top-[72px] sm:top-20 z-40 bg-cream/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-4 lg:p-0 rounded-2xl lg:rounded-none shadow-lg lg:shadow-none border border-sage/40 lg:border-none">
            
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input 
                type="text" 
                placeholder="Search titles or authors..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-cream lg:bg-transparent lg:border-none border border-sage/30 lg:border-b lg:border-ink/20 rounded-full lg:rounded-none py-3 pl-12 pr-4 text-ink focus:outline-none focus:border-ink transition-colors"
              />
            </div>
            
            {/* Desktop Category List */}
            <div className="hidden lg:flex flex-col gap-1 w-full">
              <h3 className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-3 border-b border-sage/30 pb-2">Categories</h3>
              {genres.map(g => (
                <button
                  key={g.name}
                  onClick={() => setActiveGenre(g.name)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 w-full flex justify-between items-center ${activeGenre === g.name ? 'bg-burgundy text-cream shadow-md' : 'bg-transparent text-ink/70 hover:bg-sage/20 hover:text-ink'}`}
                >
                  <span>{g.name}</span> <span className="opacity-50 text-xs">{g.count}</span>
                </button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="w-full lg:hidden block">
              <div className="relative w-full">
                <select 
                  value={activeGenre}
                  onChange={e => setActiveGenre(e.target.value)}
                  className="w-full bg-cream border border-sage/30 focus:border-accent transition-colors rounded-xl py-3 px-4 text-ink font-bold appearance-none cursor-pointer"
                >
                  {genres.map(g => (
                    <option key={g.name} value={g.name}>
                      {g.name} ({g.count})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink/50 text-xs">▼</div>
              </div>
            </div>
            
            {/* Sold Out Toggle */}
            <div className="flex items-center justify-between w-full pt-2 lg:mt-4 lg:pt-6 lg:border-t border-sage/20">
              <span className="text-sm font-bold text-ink/70">Show Sold Out</span>
              <button 
                onClick={() => setShowSoldOut(!showSoldOut)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${showSoldOut ? 'bg-burgundy' : 'bg-sage/80'}`}
                aria-label="Toggle sold out books"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${showSoldOut ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>

          {/* Right Content: Grid */}
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredBooks.map(book => (
              <div key={book.id} onClick={() => setSelectedBook(book)} className="group cursor-pointer flex flex-col">
                <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-sm border border-sage/20 mb-3 bg-cream relative">
                  <img src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={book.title} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${book.status?.toUpperCase() === 'SOLD OUT' ? 'grayscale opacity-50' : ''}`} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none z-10"></div>
                  {book.status?.toUpperCase() === 'SOLD OUT' && (
                    <div className="absolute top-2 right-2 bg-burgundy text-cream text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-20">Sold Out</div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-ink leading-tight group-hover:text-accent transition-colors line-clamp-2">{book.title}</h4>
                  </div>
                  <p className="text-sm text-ink/60 mb-2">
                    {book.author} <span className="opacity-50 mx-1">•</span> <span className="font-mono text-xs opacity-70">#{book.id}</span>
                  </p>
                  <div className="mt-auto flex justify-between items-baseline">
                    <span className="font-display font-bold text-lg text-burgundy">₦{parseInt(book.price).toLocaleString()}</span>
                    <RatingDots rating={book.rating} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedBook && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
                onClick={() => setSelectedBook(null)}
              />
              <motion.div 
                initial={{opacity: 0, y: 50, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 20, scale: 0.95}}
                className="relative w-full max-w-3xl bg-cream rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[90vh]"
              >
                <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 bg-white/50 backdrop-blur rounded-full p-2 hover:bg-white transition-colors z-20">
                  <X size={20} className="text-ink" />
                </button>
                
                <div className="w-full h-56 md:h-auto md:w-2/5 object-cover bg-sage/10 border-b md:border-b-0 md:border-r border-sage/20 relative flex-shrink-0 flex items-center justify-center p-4">
                   <img src={selectedBook.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={selectedBook.title} className="w-full h-full object-contain" />
                </div>
                
                <div className="p-6 md:p-8 md:w-3/5 overflow-y-auto">
                  <div className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
                    {selectedBook.genre} <span className="text-ink/30 mx-2">|</span> <span className="font-mono text-ink/50">ID: {selectedBook.id}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display text-burgundy mb-2 leading-tight">{selectedBook.title}</h2>
                  <p className="text-md md:text-lg text-ink/60 mb-4">{selectedBook.author}</p>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xl md:text-2xl font-display font-bold text-ink">₦{parseInt(selectedBook.price).toLocaleString()}</span>
                    <div className="h-4 w-[1px] bg-sage/30"></div>
                    <RatingDots rating={selectedBook.rating} />
                  </div>
                  
                  <p className="text-ink mb-6 leading-relaxed bg-white p-4 rounded-xl shadow-sm border border-sage/10">
                    {selectedBook.description || "A captivating read ready to be pulled off our shelves."}
                  </p>

                  <div className="mb-6">
                    <h4 className="font-quote italic text-sm text-accent mb-2">"Why we love this one"</h4>
                    <p className="text-xs text-ink/80 italic border-l-2 border-accent pl-3">
                      Honestly, {selectedBook.title} is exactly the kind of book that starts debates at our townhalls. Dive in.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href={selectedBook.orderUrl || CHECKOUT_URL} target="_blank" rel="noreferrer"
                      className="flex-1 flex justify-center items-center gap-2 bg-ink text-cream py-3 rounded-xl font-bold hover:bg-ink/90 transition-colors"
                    >
                      <ExternalLink size={18} /> Order via Form
                    </a>
                    <button 
                      onClick={() => handleWhatsapp(selectedBook)}
                      className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-[#1eb757] transition-colors"
                    >
                      <MessageCircle size={18} /> Message on WhatsApp
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
