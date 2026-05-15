"use client";
import { Coffee, Bookmark, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Collections({ books = [] }) {
  // Pre-filter curated collections
  const hallOfFame = books.filter(b => b.rating >= 4.4).slice(0, 8);
  const nonFiction = books.filter(b => b.genre?.toLowerCase().includes('non-fiction') || b.genre?.toLowerCase().includes('biography')).slice(0, 8);
  
  // A pseudo "Founders Favorites" based on specific strong titles
  const foundersFavs = books.filter(b => b.rating === 4.3 || b.rating === 4.0).slice(0, 8);

  const CollectionRow = ({ title, description, collection, icon: Icon }) => (
    <div className="mb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-ink/10 pb-6">
        <div>
          <h2 className="text-4xl font-display text-burgundy flex items-center gap-4">
            <Icon className="text-accent" size={32}/> {title}
          </h2>
          <p className="text-ink/60 mt-3 max-w-xl text-lg">{description}</p>
        </div>
        <Link href="/bookstore" className="text-accent font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:text-burgundy transition-colors shrink-0">
          View Full Catalogue <ArrowRight size={14}/>
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
        {collection.map(book => (
          <Link href="/bookstore" key={book.id} className="min-w-[220px] w-[220px] group snap-start">
            <div className="relative aspect-[2/3] mb-4 overflow-hidden shadow-sm border border-sage/20 bg-cream">
              <img src={book.imageUrl || 'https://placehold.co/400x600?text=No+Cover'} alt={book.title} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
              {/* Glossy hover glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none z-10"></div>
            </div>
            <h3 className="font-bold text-ink leading-tight mb-1 group-hover:text-accent transition-colors line-clamp-2">{book.title}</h3>
            <p className="text-xs text-ink/70 italic line-clamp-1">{book.author}</p>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <section className="bg-cream py-24 px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-accent uppercase tracking-[0.2em] font-bold text-sm mb-4 block">The Reading Room</span>
          <h1 className="text-6xl md:text-8xl font-display text-ink mb-6">Curated Collections</h1>
          <p className="text-xl text-ink/70 max-w-2xl mx-auto">
            You don't have to wander through the shelves blindly. 
            We grouped our favorites together to save you the trouble.
          </p>
        </div>

        {hallOfFame.length > 0 && (
          <CollectionRow 
            title="The Hall of Fame" 
            description="The undisputed heavyweights. Books that scored above a 4.4 rating from our community."
            collection={hallOfFame}
            icon={Star}
          />
        )}

        {foundersFavs.length > 0 && (
          <CollectionRow 
            title="The Chapter Leads' Cut" 
            description="Books carefully selected by our Zaria, Abuja, and Kaduna moderators. Highly controversial."
            collection={foundersFavs}
            icon={Bookmark}
          />
        )}

        {nonFiction.length > 0 && (
          <CollectionRow 
            title="Non-Fiction & Biographies" 
            description="Real life. Memoirs, history, and philosophy that will probably make you reconsider your life choices."
            collection={nonFiction}
            icon={Coffee}
          />
        )}
      </div>
    </section>
  );
}
