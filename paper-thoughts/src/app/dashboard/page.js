"use client";
import { useState, useEffect } from 'react';
import { useUser, UserButton, SignOutButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Loader2, Award, Ticket, Users, Copy, CheckCircle2, ShieldCheck, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    } else if (isLoaded && !user) {
      window.location.href = '/sign-in?redirect_url=/dashboard';
    }
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      
      if (data.success && data.profile) {
        setProfile(data.profile);
      } else {
        setError(data.error || "Profile not found.");
      }
    } catch (err) {
      setError("Failed to load profile data.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const copyRefLink = () => {
    if (!profile) return;
    const link = `https://paperthoughts.org/join?ref=${profile.lkid}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDiscountCode = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.lkid);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isLoaded || (loadingProfile && !error)) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-burgundy" size={48} />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center py-12 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full bg-white p-10 rounded-3xl border border-sage/20 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-red-400" size={32} />
          </div>
          <h2 className="text-3xl font-display text-burgundy mb-4">Account Not Linked</h2>
          <p className="text-ink/70 mb-8 leading-relaxed">
            {error || "We couldn't find an Archive profile associated with your email address."} 
            <br/><br/>
            Did you register using a different email address? If you haven't joined the Archive yet, you need to register first.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/join" className="bg-burgundy text-cream py-3 rounded-xl font-bold hover:bg-ink transition-colors">
              Join the Archive
            </Link>
            <SignOutButton>
              <button className="bg-sage/10 text-ink/60 py-3 rounded-xl font-bold hover:bg-sage/20 transition-colors">
                Sign out and try another email
              </button>
            </SignOutButton>
          </div>
        </motion.div>
      </main>
    );
  }

  // Calculate progress
  const eventsNeeded = 6;
  const eventsProgress = Math.min(100, (profile.events / eventsNeeded) * 100);
  
  const referralsNeeded = 5;
  const referralsProgress = Math.min(100, (profile.referrals / referralsNeeded) * 100);

  const isKeeper = profile.tier === "Keeper" || profile.tier === "Lore Keeper";
  const discountPercent = profile.tier === "Lore Keeper" ? "15%" : "10%";

  return (
    <main className="min-h-screen bg-cream selection:bg-primary/30 pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-display text-burgundy mb-2">Welcome back, {profile.name.split(' ')[0]}</h1>
            <p className="text-ink/60 font-mono text-sm flex items-center gap-2">
              <span className="bg-white px-2 py-1 border border-sage/20 rounded">{profile.lkid}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1"><MapPin size={14}/> {profile.chapter}</span>
            </p>
          </div>
          <div className="bg-white border border-sage/20 py-2 px-4 rounded-full flex items-center gap-3 shadow-sm">
             <span className="text-sm font-bold text-ink/70">{user?.primaryEmailAddress?.emailAddress}</span>
             <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Status Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-sage/20 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Award size={160} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 mb-2">Current Tier</h3>
                <div className="flex items-end gap-4 mb-8">
                  <h2 className="text-5xl font-display text-burgundy leading-none">{profile.tier}</h2>
                  {isKeeper && <span className="bg-accent/10 text-accent font-bold text-xs px-2 py-1 rounded mb-1 uppercase tracking-wider">Unlocked</span>}
                </div>

                {isKeeper ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                     <h4 className="font-bold text-burgundy flex items-center gap-2 mb-2"><Ticket size={18}/> Your Cipher Discount</h4>
                     <p className="text-sm text-ink/70 mb-4">You have a permanent <strong>{discountPercent} discount</strong> on all purchases.</p>
                     
                     <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-xl border border-sage/20">
                        <span className="font-mono text-lg font-bold text-ink tracking-widest flex-1">{profile.lkid}</span>
                        <button onClick={copyDiscountCode} className="bg-sage/10 hover:bg-sage/20 text-ink px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                          {copiedCode ? <CheckCircle2 size={16} className="text-sage"/> : <Copy size={16}/>}
                          {copiedCode ? "Copied" : "Copy Code"}
                        </button>
                     </div>
                     <p className="text-xs text-ink/40 mt-3 italic">* Apply this code at checkout.</p>
                  </div>
                ) : (
                  <div className="bg-ink/5 rounded-2xl p-6">
                    <p className="text-sm text-ink/70">
                      You are a Reader. Upgrade to <strong>Keeper</strong> by attending events or referring friends to unlock a lifetime 10% discount.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Progress Trackers */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-sage/20 shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2"><Ticket size={18} className="text-sage"/> Event Points</h3>
                    <p className="text-xs text-ink/50 mt-1">Earn 2 for physical, 1 for virtual.</p>
                  </div>
                  <span className="font-display text-2xl text-burgundy">{profile.events}</span>
                </div>
                
                <div className="w-full bg-sage/20 rounded-full h-3 mb-2 overflow-hidden">
                  <div className="bg-sage h-3 rounded-full transition-all duration-1000" style={{ width: `${eventsProgress}%` }}></div>
                </div>
                <p className="text-xs text-ink/50 text-right">{profile.events} / {eventsNeeded} to Keeper</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-sage/20 shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2"><Users size={18} className="text-accent"/> Referrals</h3>
                    <p className="text-xs text-ink/50 mt-1">Invite friends to the Archive.</p>
                  </div>
                  <span className="font-display text-2xl text-burgundy">{profile.referrals}</span>
                </div>
                
                <div className="w-full bg-primary/20 rounded-full h-3 mb-2 overflow-hidden">
                  <div className="bg-accent h-3 rounded-full transition-all duration-1000" style={{ width: `${referralsProgress}%` }}></div>
                </div>
                <p className="text-xs text-ink/50 text-right">{profile.referrals} / {referralsNeeded} to Keeper</p>
              </div>

            </motion.div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Referral Widget */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-burgundy text-cream p-8 rounded-3xl shadow-xl">
              <h3 className="font-display text-2xl mb-4">Invite the Collective</h3>
              <p className="text-sm text-cream/70 mb-6">
                Share your personal link. Earn 1 referral point for every person who joins the Archive using it.
              </p>
              <button 
                onClick={copyRefLink}
                className="w-full bg-cream text-burgundy py-4 rounded-xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 size={18} className="text-sage"/> : <Copy size={18}/>}
                {copied ? "Link Copied!" : "Copy Referral Link"}
              </button>
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-sage/20 shadow-md">
              <h3 className="font-bold text-ink mb-4 uppercase tracking-widest text-xs border-b border-sage/20 pb-2">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/bookstore" className="text-ink/70 hover:text-accent font-bold text-sm flex items-center gap-2 transition-colors">
                    <ExternalLink size={14}/> Browse Bookstore
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="text-ink/70 hover:text-accent font-bold text-sm flex items-center gap-2 transition-colors">
                    <ExternalLink size={14}/> Upcoming Events
                  </Link>
                </li>
              </ul>
            </motion.div>

          </div>
        </div>
      </div>
    </main>
  );
}
