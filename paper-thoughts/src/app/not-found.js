import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center bg-cream">
      <div className="text-9xl font-display text-ink/10 select-none mb-8">404</div>
      <h2 className="text-4xl md:text-5xl font-display text-burgundy mb-6">
        This page has been <br /> torn out of the book.
      </h2>
      <p className="text-ink/60 text-lg max-w-md mx-auto mb-10 font-quote italic">
        "Not all who wander are lost, but you certainly are." 
        <br />
        <span className="text-sm not-italic mt-4 block text-accent font-bold uppercase tracking-widest">— J.R.R. Tolkien (Probably)</span>
      </p>
      
      <Link 
        href="/" 
        className="bg-ink text-cream px-8 py-4 uppercase tracking-widest text-sm font-bold border border-ink hover:bg-cream hover:text-ink transition-colors"
      >
        Return to the Title Page
      </Link>
    </div>
  );
}
