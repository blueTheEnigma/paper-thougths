"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, Compass, ShoppingBag, Feather, Sparkles, 
  User, Settings, ShieldCheck 
} from 'lucide-react';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import PanguinAvatar from '@/components/PanguinAvatar';

export default function Navigation() {
  const pathname = usePathname();
  if (pathname?.startsWith('/round-table')) {
    return null;
  }
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const isLoaded = authLoaded && userLoaded;

  const email = (user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
  const superadminEmail = (process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || "umorgan2001@gmail.com").toLowerCase();
  const isAdmin = email === superadminEmail;

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      const fetchProfile = async () => {
        try {
          const res = await fetch('/api/me');
          const data = await res.json();
          if (data.success) {
            setProfile(data.profile);
          }
        } catch (e) {
          console.error("Auth check failed in nav", e);
        }
      };
      fetchProfile();
    }
  }, [isSignedIn]);

  // Check if a link is active
  const isActive = (path) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname?.startsWith(path);
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Compass },
    { name: "Bookstore", href: "/bookstore", icon: ShoppingBag },
    { name: "Events", href: "/events", icon: Sparkles },
    { name: "Village", href: "/village", icon: Feather },
  ];

  return (
    <>
      {/* 1. Desktop Floating Glassmorphic Top Nav */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl bg-cream/95 backdrop-blur-lg border border-sage/15 py-3 px-6 rounded-2xl flex items-center justify-between shadow-lg"
      >
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="bg-burgundy/5 p-2 rounded-xl border border-burgundy/10 group-hover:bg-burgundy/10 transition-colors">
            <BookOpen className="text-burgundy transition-transform group-hover:scale-105" size={24} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-base text-ink tracking-tight uppercase leading-none">Paper Thoughts</span>
            <span className="text-[9px] text-ink/50 uppercase tracking-widest font-bold mt-1 leading-none">We live in the lines</span>
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex gap-8 items-center font-sans font-bold text-sm text-ink/75">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`relative px-3 py-1.5 transition-colors hover:text-burgundy flex items-center gap-1.5 ${
                  active ? "text-burgundy font-extrabold" : "text-ink/65"
                }`}
              >
                {active && (
                  <motion.span 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-burgundy/5 rounded-lg -z-10 border border-burgundy/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <link.icon size={15} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Right side auth */}
        <div className="flex items-center gap-4">
          {isLoaded && !isSignedIn && (
            <div className="flex items-center gap-4">
              <Link href="/join" className="bg-burgundy hover:bg-ink text-cream text-xs px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm">
                Join Us
              </Link>
              <Link href="/sign-in?redirect_url=/dashboard" className="hidden sm:inline-block text-ink/70 hover:text-burgundy font-bold text-xs uppercase tracking-wider transition-colors">
                Sign In
              </Link>
            </div>
          )}
          {isLoaded && isSignedIn && (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin" className="hidden md:flex items-center gap-1.5 bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-accent/20">
                  <ShieldCheck size={14} />
                  <span>Admin</span>
                </Link>
              )}
              {profile?.isCrewMember && (
                <Link href="/round-table" className="hidden md:flex items-center gap-1.5 bg-burgundy/10 text-burgundy hover:bg-burgundy/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-burgundy/20">
                  <BookOpen size={14} />
                  <span>Crew CRM</span>
                </Link>
              )}
              <Link 
                href="/dashboard" 
                className={`hidden sm:inline-block font-sans font-bold text-xs uppercase tracking-wider transition-colors hover:text-burgundy ${
                  isActive('/dashboard') ? "text-burgundy" : "text-ink/65"
                }`}
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 bg-white/40 p-1 rounded-full border border-sage/10">
                {profile && (
                  <PanguinAvatar lifetimeLeaves={profile.lifetimeLeaves || 0} variant="icon" />
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* 2. Mobile Floating Glassmorphic Bottom Navigation Pill */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-cream/95 backdrop-blur-lg border border-sage/15 rounded-2xl shadow-2xl py-2 px-3 flex justify-around items-center lg:hidden"
      >
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                active ? "text-burgundy scale-105" : "text-ink/50"
              }`}
            >
              <link.icon size={20} className={active ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
              <span className="text-[9px] font-sans font-bold mt-1 tracking-wide">{link.name}</span>
            </Link>
          );
        })}
        {isLoaded && isSignedIn && (
          <Link 
            href="/dashboard" 
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive('/dashboard') ? "text-burgundy scale-105" : "text-ink/50"
            }`}
          >
            <User size={20} className={isActive('/dashboard') ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span className="text-[9px] font-sans font-bold mt-1 tracking-wide">Account</span>
          </Link>
        )}
        {isLoaded && !isSignedIn && (
          <Link 
            href="/sign-in?redirect_url=/dashboard" 
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive('/sign-in') ? "text-burgundy scale-105" : "text-ink/50"
            }`}
          >
            <User size={20} className={isActive('/sign-in') ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span className="text-[9px] font-sans font-bold mt-1 tracking-wide">Sign In</span>
          </Link>
        )}
      </motion.div>
    </>
  );
}
