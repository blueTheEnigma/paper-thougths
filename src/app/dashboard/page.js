"use client";
import { useState, useEffect } from 'react';
import { useUser, UserButton, SignOutButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Loader2, Award, Ticket, Users, Copy, CheckCircle2, ShieldCheck, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
      fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/me/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
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
  const discountPercent = profile.tier === "Lore Keeper" ? "10%" : "5%";

  return (
    <main className="min-h-screen bg-cream selection:bg-primary/30 pt-20 md:pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-burgundy mb-3 leading-tight">
              Welcome back, <br className="sm:hidden" />
              <span className="text-burgundy/90">{profile.name.split(' ')[0]}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] sm:text-xs">
              <span className="bg-white px-2 py-1 border border-sage/20 rounded shadow-sm text-burgundy font-bold">{profile.lkid}</span>
              <span className="text-ink/30">•</span>
              <span className="flex items-center gap-1.5 text-ink/60"><MapPin size={12} className="text-sage"/> {profile.chapter}</span>
            </div>
          </div>
          <div className="w-full md:w-auto bg-white/60 backdrop-blur-sm border border-sage/20 py-2.5 px-5 rounded-2xl flex items-center justify-between md:justify-start gap-4 shadow-sm">
             <span className="text-xs sm:text-sm font-bold text-ink/70 truncate max-w-[180px] sm:max-w-none">{user?.primaryEmailAddress?.emailAddress}</span>
             <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Status Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-10 rounded-[32px] border border-sage/20 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5">
                <Award size={180} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-3">Membership Status</h3>
                <div className="flex flex-wrap items-end gap-4 mb-8">
                  <h2 className="text-4xl sm:text-6xl font-display text-burgundy leading-none tracking-tight">{profile.tier}</h2>
                  {isKeeper && (
                    <span className="bg-sage/10 text-sage font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest border border-sage/20 mb-1">
                      Unlocked
                    </span>
                  )}
                </div>

                {isKeeper ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-8">
                     <h4 className="font-bold text-burgundy flex items-center gap-2 mb-3"><Ticket size={18}/> Your Cipher Discount</h4>
                     <p className="text-sm text-ink/70 mb-6 leading-relaxed">
                        As a trusted member of the Archive, you have a permanent <strong>{discountPercent} discount</strong> on all purchases.
                     </p>
                     
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2 pl-4 rounded-xl border border-sage/20">
                        <span className="font-mono text-xl font-bold text-ink tracking-[0.2em] flex-1 py-2 sm:py-0">{profile.lkid}</span>
                        <button onClick={copyDiscountCode} className="bg-sage/10 hover:bg-sage/20 text-ink px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                          {copiedCode ? <CheckCircle2 size={16} className="text-sage"/> : <Copy size={16}/>}
                          {copiedCode ? "Copied" : "Copy Code"}
                        </button>
                     </div>
                     <p className="text-[10px] text-ink/40 mt-4 italic text-center sm:text-left">* Apply this code at checkout to claim your lore.</p>
                  </div>
                ) : (
                  <div className="bg-ink/5 rounded-2xl p-6 border border-sage/10">
                    <p className="text-sm text-ink/70 leading-relaxed">
                      You are currently a <strong>Reader</strong>. Upgrade to <strong>Keeper</strong> by attending events or referring friends to unlock your lifetime 5% discount and exclusive Archive access.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Progress Trackers */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-sage/20 shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><Ticket size={16} className="text-sage"/> Event Points</h3>
                    <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-wider font-medium">Physical: 2 • Virtual: 1</p>
                  </div>
                  <span className="font-display text-3xl text-burgundy">{profile.events}</span>
                </div>
                
                <div className="w-full bg-sage/10 rounded-full h-3 mb-3 overflow-hidden border border-sage/5">
                  <div className="bg-sage h-3 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${eventsProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  <span>{eventsProgress.toFixed(0)}% Complete</span>
                  <span>{profile.events}/{eventsNeeded}</span>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-sage/20 shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><Users size={16} className="text-accent"/> Referrals</h3>
                    <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-wider font-medium">Invite the collective</p>
                  </div>
                  <span className="font-display text-3xl text-burgundy">{profile.referrals}</span>
                </div>
                
                <div className="w-full bg-primary/10 rounded-full h-3 mb-3 overflow-hidden border border-primary/5">
                  <div className="bg-accent h-3 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${referralsProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  <span>{referralsProgress.toFixed(0)}% Complete</span>
                  <span>{profile.referrals}/{referralsNeeded}</span>
                </div>
              </div>

            </motion.div>

            {/* My Archive Orders Section - NEW */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 sm:p-10 rounded-[32px] border border-sage/20 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display text-burgundy">My Archive Orders</h3>
                {loadingOrders && <Loader2 size={18} className="animate-spin text-burgundy/40" />}
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-sage/5 rounded-2xl border border-sage/10 group hover:border-burgundy/20 transition-all">
                      <div>
                        <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">{order.orderId} · {new Date(order.date).toLocaleDateString()}</div>
                        <h4 className="font-bold text-ink text-sm mb-1">{order.items}</h4>
                        <p className="text-xs text-burgundy font-bold">₦{order.total}</p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-burgundy/10 text-burgundy'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loadingOrders && (
                <div className="py-12 text-center bg-cream/50 rounded-2xl border border-dashed border-sage/30">
                  <p className="text-ink/40 font-quote italic">Your personal archive history is currently empty.</p>
                  <Link href="/bookstore" className="inline-block mt-4 text-xs font-bold text-burgundy underline uppercase tracking-widest">Browse Bookstore</Link>
                </div>
              )}
            </motion.div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Referral Widget */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-burgundy text-cream p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              <h3 className="font-display text-2xl mb-4 relative z-10">Invite the Collective</h3>
              <p className="text-sm text-cream/70 mb-8 leading-relaxed relative z-10">
                Share your personal link. Earn 1 referral point for every person who joins the Archive using it.
              </p>
              <button 
                onClick={copyRefLink}
                className="w-full bg-cream text-burgundy py-4 rounded-2xl font-bold hover:bg-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 relative z-10"
              >
                {copied ? <CheckCircle2 size={18} className="text-sage"/> : <Copy size={18}/>}
                {copied ? "Link Copied!" : "Copy Referral Link"}
              </button>
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[32px] border border-sage/20 shadow-lg">
              <h3 className="font-bold text-ink mb-6 uppercase tracking-[0.2em] text-[10px] border-b border-sage/10 pb-3">Quick Navigation</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/bookstore" className="group text-ink/70 hover:text-accent font-bold text-sm flex items-center gap-3 transition-colors">
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <ExternalLink size={16}/>
                    </div>
                    Browse Bookstore
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="group text-ink/70 hover:text-accent font-bold text-sm flex items-center gap-3 transition-colors">
                    <div className="p-2 bg-sage/5 rounded-lg group-hover:bg-accent/10 transition-colors">
                      <ExternalLink size={16}/>
                    </div>
                    Upcoming Events
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
