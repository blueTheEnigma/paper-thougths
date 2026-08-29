"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, Compass, ShoppingBag, Feather, Sparkles, 
  User, Settings, ShieldCheck, Flame
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

  const [profile, setProfile] = useState(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const superadminEmails = [
    (process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || "umorgan2001@gmail.com").toLowerCase().trim(),
    "paperthoughts01@gmail.com"
  ];
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim();
  const isSuperadmin = (userEmail && superadminEmails.includes(userEmail)) || 
                       (profile?.email && superadminEmails.includes(profile.email.toLowerCase().trim()));
  const isAdmin = isSuperadmin || (profile?.permissions && profile.permissions.length > 0);

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

  // Scroll detection to auto-hide navbar on scroll down and reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 40) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down -> hide navbar
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up -> show navbar
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Check if a link is active
  const isActive = (path) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname?.startsWith(path);
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Compass, mobileLabel: "Home" },
    { name: "Events", href: "/events", icon: Sparkles, mobileLabel: "Events" },
    { name: "Bookstore", href: "/bookstore", icon: ShoppingBag, mobileLabel: "Books" },
    { name: "Village", href: "/village", icon: Feather, mobileLabel: "Village" },
    { name: "Book Zodiac", href: "/zodiac", icon: Sparkles, mobileLabel: "Zodiac" },
  ];

  return (
    <>
      {/* 1. Desktop Floating Glassmorphic Top Nav (With Smart Auto-Hide) */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: isNavVisible ? 0 : -100, 
          opacity: isNavVisible ? 1 : 0 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl bg-cream/95 backdrop-blur-lg border border-sage/15 py-3 px-5 sm:px-6 rounded-2xl flex items-center justify-between shadow-lg"
      >
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="bg-burgundy/5 p-2 rounded-xl border border-burgundy/10 group-hover:bg-burgundy/10 transition-colors">
            <Logo className="text-burgundy transition-transform group-hover:scale-105" size={24} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-base text-ink tracking-tight uppercase leading-none">Paper Thoughts</span>
            <span className="text-[9px] text-ink/50 uppercase tracking-widest font-bold mt-1 leading-none">We live in the lines</span>
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex gap-4 xl:gap-6 items-center font-sans font-bold text-xs xl:text-sm text-ink/75">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`relative px-2.5 py-1.5 transition-colors hover:text-burgundy flex items-center gap-1.5 whitespace-nowrap ${
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
                <link.icon size={14} />
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
              <NotificationBell userId={profile?.id} />
              
              <div className="flex items-center gap-2">
                {profile && (
                  <div className="p-0.5 rounded-full border border-sage/20 bg-white/60 shadow-sm flex items-center justify-center">
                    <PanguinAvatar lifetimeLeaves={profile.lifetimeLeaves || 0} avatarUrl={profile.avatarUrl} variant="icon" archetype={profile.archetype} />
                  </div>
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
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-cream/95 backdrop-blur-lg border border-sage/15 rounded-2xl shadow-2xl py-1.5 px-2 flex justify-between items-center lg:hidden"
      >
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                active ? "text-burgundy scale-105 font-extrabold" : "text-ink/50"
              }`}
            >
              <link.icon size={18} className={active ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
              <span className="text-[9px] font-sans font-bold mt-0.5 tracking-tight truncate max-w-full text-center">
                {link.mobileLabel || link.name}
              </span>
            </Link>
          );
        })}
        {isLoaded && isSignedIn && profile?.isCrewMember && (
          <Link 
            href="/round-table" 
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              isActive('/round-table') ? "text-burgundy scale-105 font-extrabold" : "text-sage"
            }`}
          >
            <BookOpen size={18} className={isActive('/round-table') ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span className="text-[9px] font-sans font-bold mt-0.5 tracking-tight truncate max-w-full text-center">CRM</span>
          </Link>
        )}
        {isLoaded && isSignedIn && isAdmin && (
          <Link 
            href="/admin" 
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              isActive('/admin') ? "text-burgundy scale-105 font-extrabold" : "text-accent"
            }`}
          >
            <ShieldCheck size={18} className={isActive('/admin') ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span className="text-[9px] font-sans font-bold mt-0.5 tracking-tight truncate max-w-full text-center">Admin</span>
          </Link>
        )}
        {isLoaded && isSignedIn && (
          <Link 
            href="/dashboard" 
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              isActive('/dashboard') ? "text-burgundy scale-105 font-extrabold" : "text-ink/50"
            }`}
          >
            <User size={18} className={isActive('/dashboard') ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span className="text-[9px] font-sans font-bold mt-0.5 tracking-tight truncate max-w-full text-center">Account</span>
          </Link>
        )}
        {isLoaded && !isSignedIn && (
          <Link 
            href="/sign-in?redirect_url=/dashboard" 
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              isActive('/sign-in') ? "text-burgundy scale-105 font-extrabold" : "text-ink/50"
            }`}
          >
            <User size={18} className={isActive('/sign-in') ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span className="text-[9px] font-sans font-bold mt-0.5 tracking-tight truncate max-w-full text-center">Sign In</span>
          </Link>
        )}
      </motion.div>
    </>
  );
}
