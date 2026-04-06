"use client";
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-sage/20 py-4 px-6 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <BookOpen className="text-burgundy transition-transform group-hover:scale-110" size={32} />
          <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-xl text-ink tracking-tight uppercase leading-none">Paper Thoughts</span>
            <span className="text-[10px] text-ink/60 uppercase tracking-widest font-bold mt-1 leading-none">We live in the lines</span>
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 items-center font-medium">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <Link href="/bookstore" className="hover:text-accent transition-colors">Bookstore</Link>
          <Link href="/events" className="hover:text-accent transition-colors">Events</Link>
          <Link href="/collections" className="hover:text-accent transition-colors">Collections</Link>
          <Link href="/clubs" className="hover:text-accent transition-colors">Clubs</Link>
        </div>
        
        <Link href="/#contact" className="hidden md:inline-block btn-primary text-sm shadow-sm">
          Join Us
        </Link>

        {/* Mobile Toggle */}
        <button className="md:hidden text-ink" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-cream border-b border-sage/20 py-6 px-6 shadow-xl flex flex-col gap-6 font-medium text-center md:hidden">
          <Link href="/" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Home</Link>
          <Link href="/bookstore" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Bookstore</Link>
          <Link href="/events" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Events</Link>
          <Link href="/collections" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Collections</Link>
          <Link href="/clubs" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Clubs</Link>
          <Link href="/#contact" onClick={() => setIsOpen(false)} className="mx-auto btn-primary w-full mt-2">Join Us</Link>
        </div>
      )}
    </nav>
  );
}
