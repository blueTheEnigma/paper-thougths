"use client";
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X } from 'lucide-react';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  
  const isLoaded = authLoaded && userLoaded;

  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-sage/20 py-4 px-6 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <BookOpen className="text-burgundy transition-transform group-hover:scale-110" size={32} />
          <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-xl text-ink tracking-tight uppercase leading-none">Paper Thoughts</span>
            <span className="text-[10px] text-ink/60 uppercase tracking-widest font-bold mt-1 leading-none">We live in the lines</span>
          </div>
        </Link>
        
        {/* Desktop Links - Added more explicit spacing and margin */}
        <div className="hidden lg:flex gap-10 items-center font-medium ml-16">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <Link href="/bookstore" className="hover:text-accent transition-colors">Bookstore</Link>
          <Link href="/events" className="hover:text-accent transition-colors">Events</Link>
          <Link href="/salon" className="hover:text-accent transition-colors">Salon</Link>
          <Link href="/clubs" className="hover:text-accent transition-colors">Clubs</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {isLoaded && !isSignedIn && (
            <div className="flex items-center gap-6">
              <Link href="/join" className="btn-primary text-sm shadow-sm">
                Join Us
              </Link>
              <Link href="/sign-in?redirect_url=/dashboard" className="text-ink hover:text-accent font-bold text-sm transition-colors">
                Sign In
              </Link>
            </div>
          )}
          {isLoaded && isSignedIn && (
            <div className="flex items-center gap-6">
              {/* Secret Admin Link - Now using useUser() */}
              {user?.primaryEmailAddress?.emailAddress === "umorgan2001@gmail.com" && (
                <Link href="/admin/orders" className="text-[10px] bg-accent text-burgundy px-3 py-1.5 rounded-full font-bold uppercase tracking-widest hover:bg-burgundy hover:text-cream transition-all shadow-sm">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="text-burgundy font-bold text-sm hover:text-ink transition-colors">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-ink ml-auto" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-cream border-b border-sage/20 py-6 px-6 shadow-xl flex flex-col gap-6 font-medium text-center lg:hidden">
          <Link href="/" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Home</Link>
          <Link href="/bookstore" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Bookstore</Link>
          <Link href="/events" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Events</Link>
          <Link href="/salon" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Salon</Link>
          <Link href="/clubs" onClick={() => setIsOpen(false)} className="text-xl hover:text-accent">Clubs</Link>
          
          <div className="w-full h-[1px] bg-sage/20 my-2"></div>
          
          {isLoaded && !isSignedIn && (
            <>
              <Link href="/join" onClick={() => setIsOpen(false)} className="mx-auto btn-primary w-full">Join Us</Link>
              <Link href="/sign-in?redirect_url=/dashboard" onClick={() => setIsOpen(false)} className="text-ink font-bold text-lg hover:text-accent">Sign In</Link>
            </>
          )}
          {isLoaded && isSignedIn && (
            <>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="mx-auto bg-burgundy text-white py-3 px-6 rounded-xl font-bold w-full">Dashboard</Link>
              <div className="flex justify-center mt-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
