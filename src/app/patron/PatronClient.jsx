"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  HeartHandshake,
  Sparkles,
  Award,
  BookOpen,
  Feather,
  Coins,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  ArrowRight,
  Gift,
  Users,
} from 'lucide-react';

const NAIRA_PRESETS = [2000, 5000, 10000, 25000, 50000];
const LEAVE_BUNDLES = [
  { leaves: 50, naira: 500, label: 'Sprout Gift' },
  { leaves: 100, naira: 1000, label: 'Chapter Boost' },
  { leaves: 200, naira: 2000, label: 'Salon Circle' },
  { leaves: 500, naira: 5000, label: 'Press Patron' },
  { leaves: 1000, naira: 10000, label: 'Anthology Anchor' },
];
const LEAF_GIFTS = [5, 10, 25, 50];

export default function PatronClient({ paystackPublicKey = '', initialUser = null }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modes: 'cash_paystack' | 'leaves_purchase_donation' | 'leaves_donation'
  const [mode, setMode] = useState('cash_paystack');
  const [selectedNaira, setSelectedNaira] = useState(5000);
  const [customNaira, setCustomNaira] = useState('');
  const [selectedBundle, setSelectedBundle] = useState(100);
  const [selectedLeaves, setSelectedLeaves] = useState(10);
  const [customLeaves, setCustomLeaves] = useState('');

  const [donorName, setDonorName] = useState(initialUser?.name || '');
  const [donorEmail, setDonorEmail] = useState(initialUser?.email || '');
  const [note, setNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/patron', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSummary(data);
        if (data.user) {
          if (!donorName) setDonorName(data.user.name || '');
          if (!donorEmail) setDonorEmail(data.user.email || '');
        }
      }
    } catch (err) {
      console.error('Failed to load patronage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Load Paystack Inline V2 dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('paystack-inline-js')) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v2/inline.js';
      script.async = true;
      script.id = 'paystack-inline-js';
      document.body.appendChild(script);
    }
  }, []);

  const currentUser = summary?.user || initialUser;
  const spendableLeaves = currentUser?.spendableLeaves ?? 0;

  const firePatronConfetti = () => {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#c96a42', '#20070e', '#F2A98A', '#e6c594'],
    });
  };

  const resolveActiveNaira = () => {
    const custom = parseInt(customNaira, 10);
    if (!Number.isNaN(custom) && custom > 0) return custom;
    return selectedNaira;
  };

  const resolveActiveLeaves = () => {
    const custom = parseInt(customLeaves, 10);
    if (!Number.isNaN(custom) && custom > 0) return custom;
    return selectedLeaves;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (mode === 'leaves_donation') {
      if (!currentUser) {
        setFeedback({ type: 'error', text: 'Please sign in to gift from your Leaves balance.' });
        return;
      }
      const amount = resolveActiveLeaves();
      if (!amount || amount < 1) {
        setFeedback({ type: 'error', text: 'Enter at least 1 Leave to gift.' });
        return;
      }
      if (amount > spendableLeaves) {
        setFeedback({ type: 'error', text: `You currently have ${spendableLeaves} spendable Leaves.` });
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/patron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'leaves_donation',
            leavesAmount: amount,
            donorName: donorName.trim() || currentUser.name,
            donorEmail: donorEmail.trim() || currentUser.email,
            note,
            isAnonymous,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSummary({ stats: data.stats, wallOfPatrons: data.wallOfPatrons, user: data.user });
          setNote('');
          setCustomLeaves('');
          firePatronConfetti();
          setFeedback({ type: 'success', text: data.message });
        } else {
          setFeedback({ type: 'error', text: data.error || 'Could not process Leaves gift.' });
        }
      } catch {
        setFeedback({ type: 'error', text: 'Network error while recording your gift.' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Paystack flows (cash gift or buy & donate leaves bundle)
    const paystackKey = paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) {
      setFeedback({ type: 'error', text: 'Paystack checkout is not configured yet.' });
      return;
    }
    if (typeof window === 'undefined' || !window.PaystackPop) {
      setFeedback({ type: 'error', text: 'Payment script is still loading. Please try again in a moment.' });
      return;
    }

    const emailToUse = (donorEmail || currentUser?.email || '').trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address for your Paystack receipt.' });
      return;
    }

    const bundleObj = LEAVE_BUNDLES.find((b) => b.leaves === selectedBundle) || LEAVE_BUNDLES[1];
    const nairaTotal = mode === 'leaves_purchase_donation' ? bundleObj.naira : resolveActiveNaira();

    if (!nairaTotal || nairaTotal < 500) {
      setFeedback({ type: 'error', text: 'Minimum Paystack gift is ₦500.' });
      return;
    }

    setSubmitting(true);
    try {
      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: paystackKey,
        email: emailToUse,
        amount: nairaTotal * 100,
        currency: 'NGN',
        ref: `PT-PATRON-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        onSuccess: async (transaction) => {
          try {
            const res = await fetch('/api/patron', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode,
                reference: transaction.reference,
                bundleAmount: mode === 'leaves_purchase_donation' ? bundleObj.leaves : undefined,
                donorName: donorName.trim() || 'Kindred Patron',
                donorEmail: emailToUse,
                note,
                isAnonymous,
              }),
            });
            const data = await res.json();
            if (data.success) {
              setSummary({ stats: data.stats, wallOfPatrons: data.wallOfPatrons, user: data.user });
              setNote('');
              setCustomNaira('');
              firePatronConfetti();
              setFeedback({ type: 'success', text: data.message });
            } else {
              setFeedback({ type: 'error', text: data.error || 'Could not verify Paystack contribution.' });
            }
          } catch {
            setFeedback({
              type: 'error',
              text: `Connection issue verifying payment. Keep reference: ${transaction.reference}`,
            });
          } finally {
            setSubmitting(false);
          }
        },
        onCancel: () => {
          setSubmitting(false);
        },
        onError: () => {
          setSubmitting(false);
          setFeedback({ type: 'error', text: 'An error occurred in Paystack checkout. Please try again.' });
        },
      });
    } catch {
      setSubmitting(false);
      setFeedback({ type: 'error', text: 'Unable to open Paystack checkout. Please refresh and retry.' });
    }
  };

  const stats = summary?.stats || { totalNaira: 0, totalLeaves: 0, totalContributions: 0, patronCount: 0 };
  const wall = summary?.wallOfPatrons || [];

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#120308] pb-20 selection:bg-[#F2A98A]/30">
      {/* Sanctuary Patron Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#20070e] via-[#2c0b16] to-[#17040a] text-[#FBF7EE] p-7 sm:p-12 shadow-2xl border border-[#c96a42]/25">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#c96a42]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#F2A98A]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2A98A]/10 border border-[#F2A98A]/25 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F2A98A]">
              <HeartHandshake size={13} />
              The Paper Thoughts Literary Fund
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight leading-tight">
              Keep the Lantern Lit for Emerging African Writers
            </h1>
            <p className="font-serif italic text-sm sm:text-lg text-[#FBF7EE]/80 leading-relaxed">
              Every contribution sustains anonymous peer critique workshops, prints annual Living Anthology volumes,
              rewards laureates, and puts hardcopy books into the hands of readers across Zaria, Kaduna, Abuja, and beyond.
            </p>
            {currentUser?.isPatron && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-300/35 text-amber-200 text-xs font-bold">
                <Award size={14} />
                Honored Literary Patron
              </div>
            )}
          </div>

          {/* Live Aggregate Impact Cards */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 backdrop-blur-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]/80 mb-1">
                Literary Fund Raised
              </div>
              <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#FBF7EE]">
                {loading ? '—' : `₦${stats.totalNaira.toLocaleString()}`}
              </div>
              <p className="text-[11px] text-[#FBF7EE]/60 mt-1">Direct Naira & sponsored bundles</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 backdrop-blur-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]/80 mb-1">
                Paper Leaves Gifted
              </div>
              <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#FBF7EE]">
                {loading ? '—' : `${stats.totalLeaves.toLocaleString()} 🍂`}
              </div>
              <p className="text-[11px] text-[#FBF7EE]/60 mt-1">Recirculated for critiques & books</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 backdrop-blur-xs">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]/80 mb-1">
                Patrons on the Wall
              </div>
              <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#FBF7EE]">
                {loading ? '—' : stats.patronCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#FBF7EE]/60 mt-1">Friends & Lore Keepers backing the craft</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace: Contribution Form + Wall of Patrons */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3-Mode Patronage Studio */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-black/8 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#20070e]">
              Become a Patron
            </h2>
            <p className="text-xs sm:text-sm text-[#120308]/65 mt-1">
              Open to both kindred guests and clubhouse Lore Keepers. Choose how you wish to nourish the community.
            </p>
          </div>

          {/* 3-Path Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => { setMode('cash_paystack'); setFeedback(null); }}
              className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                mode === 'cash_paystack'
                  ? 'bg-[#20070e] text-[#FBF7EE] border-[#20070e] shadow-md'
                  : 'bg-[#FBF7EE]/60 text-[#20070e] border-black/10 hover:border-[#c96a42]/40'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Gift size={14} className={mode === 'cash_paystack' ? 'text-[#F2A98A]' : 'text-[#c96a42]'} />
                Direct Cash Gift
              </div>
              <p className={`text-[11px] leading-snug ${mode === 'cash_paystack' ? 'text-[#FBF7EE]/75' : 'text-[#120308]/60'}`}>
                Gift Naira via Paystack
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setMode('leaves_purchase_donation'); setFeedback(null); }}
              className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                mode === 'leaves_purchase_donation'
                  ? 'bg-[#20070e] text-[#FBF7EE] border-[#20070e] shadow-md'
                  : 'bg-[#FBF7EE]/60 text-[#20070e] border-black/10 hover:border-[#c96a42]/40'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Coins size={14} className={mode === 'leaves_purchase_donation' ? 'text-[#F2A98A]' : 'text-[#c96a42]'} />
                Sponsor Leaves
              </div>
              <p className={`text-[11px] leading-snug ${mode === 'leaves_purchase_donation' ? 'text-[#FBF7EE]/75' : 'text-[#120308]/60'}`}>
                Buy Leaves into the Fund
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setMode('leaves_donation'); setFeedback(null); }}
              className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                mode === 'leaves_donation'
                  ? 'bg-[#20070e] text-[#FBF7EE] border-[#20070e] shadow-md'
                  : 'bg-[#FBF7EE]/60 text-[#20070e] border-black/10 hover:border-[#c96a42]/40'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Feather size={14} className={mode === 'leaves_donation' ? 'text-[#F2A98A]' : 'text-[#c96a42]'} />
                Gift Your Leaves
              </div>
              <p className={`text-[11px] leading-snug ${mode === 'leaves_donation' ? 'text-[#FBF7EE]/75' : 'text-[#120308]/60'}`}>
                {currentUser ? `${spendableLeaves} 🍂 available` : 'For signed-in members'}
              </p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mode-Specific Amount Controls */}
            {mode === 'cash_paystack' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#20070e]/70">
                  Select Gift Amount (NGN)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {NAIRA_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setSelectedNaira(amt); setCustomNaira(''); }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !customNaira && selectedNaira === amt
                          ? 'bg-[#c96a42] text-white border-[#c96a42] shadow-xs'
                          : 'bg-[#FBF7EE] text-[#20070e] border-black/10 hover:border-[#c96a42]'
                      }`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#120308]/60">Or custom (₦):</span>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    placeholder="e.g. 15000"
                    value={customNaira}
                    onChange={(e) => setCustomNaira(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-black/15 bg-[#FBF7EE]/50 text-sm font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
                  />
                </div>
              </div>
            )}

            {mode === 'leaves_purchase_donation' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#20070e]/70">
                  Choose a Paper Leaves Bundle to Sponsor
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LEAVE_BUNDLES.map((b) => (
                    <button
                      key={b.leaves}
                      type="button"
                      onClick={() => setSelectedBundle(b.leaves)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedBundle === b.leaves
                          ? 'bg-[#c96a42]/12 border-[#c96a42] text-[#20070e] shadow-xs'
                          : 'bg-[#FBF7EE]/60 border-black/10 text-[#20070e] hover:border-[#c96a42]/50'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-bold">{b.leaves} 🍂 Leaves</div>
                        <div className="text-[11px] text-[#120308]/60">{b.label}</div>
                      </div>
                      <div className="text-sm font-display font-bold text-[#c96a42]">
                        ₦{b.naira.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'leaves_donation' && (
              <div className="space-y-3">
                {!currentUser ? (
                  <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs text-[#20070e]/80">
                      <Lock size={16} className="text-[#c96a42] shrink-0 mt-0.5" />
                      <span>Sign in to your Lore Keeper account to gift Paper Leaves straight from your balance.</span>
                    </div>
                    <Link
                      href="/sign-in?redirect_url=/patron"
                      className="shrink-0 px-4 py-2 rounded-xl bg-[#20070e] text-[#FBF7EE] text-xs font-bold uppercase tracking-wider hover:bg-[#c96a42] transition-colors text-center"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#20070e]/70">
                        Leaves to Gift from Balance
                      </label>
                      <span className="text-xs font-bold text-[#c96a42]">
                        Available: {spendableLeaves} 🍂
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {LEAF_GIFTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          disabled={spendableLeaves < amt}
                          onClick={() => { setSelectedLeaves(amt); setCustomLeaves(''); }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-40 ${
                            !customLeaves && selectedLeaves === amt
                              ? 'bg-[#c96a42] text-white border-[#c96a42]'
                              : 'bg-[#FBF7EE] text-[#20070e] border-black/10 hover:border-[#c96a42]'
                          }`}
                        >
                          {amt} 🍂
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max={Math.max(spendableLeaves, 1)}
                        placeholder="Custom 🍂"
                        value={customLeaves}
                        onChange={(e) => setCustomLeaves(e.target.value)}
                        className="w-28 px-3 py-2 rounded-xl border border-black/15 bg-[#FBF7EE]/50 text-xs font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Identity & Anonymity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/8">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#120308]/65 mb-1">
                  Your Name {isAnonymous && '(Shown privately only)'}
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Amina Bello"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 bg-[#FBF7EE]/40 text-sm focus:outline-none focus:border-[#c96a42]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#120308]/65 mb-1">
                  Email {mode !== 'leaves_donation' ? '(Required for Paystack receipt)' : '(Optional)'}
                </label>
                <input
                  type="email"
                  required={mode !== 'leaves_donation'}
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 bg-[#FBF7EE]/40 text-sm focus:outline-none focus:border-[#c96a42]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#120308]/65 mb-1">
                Word of Encouragement for Writers (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={280}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Keep telling honest stories..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 bg-[#FBF7EE]/40 text-sm font-serif italic focus:outline-none focus:border-[#c96a42]"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#20070e]/85 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-[#c96a42] rounded"
              />
              <span>
                <strong>Donate Anonymously</strong> — appear as <em>Anonymous Patron</em> on the Wall of Patrons
              </span>
            </label>

            {feedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                {feedback.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
                <span>{feedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (mode === 'leaves_donation' && (!currentUser || spendableLeaves < 1))}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#20070e] hover:bg-[#3a0d19] text-[#FBF7EE] font-bold text-xs sm:text-sm uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : mode === 'cash_paystack' ? (
                <>
                  Gift ₦{resolveActiveNaira().toLocaleString()} with Paystack <ArrowRight size={15} />
                </>
              ) : mode === 'leaves_purchase_donation' ? (
                <>
                  Sponsor {selectedBundle} 🍂 Leaves (₦{(LEAVE_BUNDLES.find((b) => b.leaves === selectedBundle)?.naira || 1000).toLocaleString()}) <ArrowRight size={15} />
                </>
              ) : (
                <>
                  Gift {resolveActiveLeaves()} 🍂 Leaves Now <Sparkles size={15} />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#120308]/50">
              <ShieldCheck size={13} className="text-[#c96a42]" />
              <span>Verified cleanly & recorded immediately to the Literary Fund ledger.</span>
            </div>
          </form>

          {/* Subtle cross-links for members */}
          <div className="pt-4 border-t border-black/8 flex flex-wrap items-center justify-between gap-3 text-xs text-[#120308]/65">
            <span>Prefer supporting individual manuscripts directly?</span>
            <Link href="/village/gallery" className="font-bold text-[#c96a42] hover:text-[#20070e] flex items-center gap-1">
              <BookOpen size={13} /> Tip Writers in the Living Salon →
            </Link>
          </div>
        </div>

        {/* Right: Warm Wall of Patrons */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-black/8 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-black/8 pb-3.5">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#20070e]">
                  Wall of Patrons
                </h3>
                <p className="text-[11px] text-[#120308]/55">
                  Honoring those who sustain the clubhouse (tier badges protect private gift sizes)
                </p>
              </div>
              <Users size={18} className="text-[#c96a42]" />
            </div>

            {loading ? (
              <div className="py-10 text-center text-xs text-[#120308]/50">Loading patronage ledger...</div>
            ) : wall.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="font-serif italic text-sm text-[#120308]/65">
                  No entries inscribed yet — be the first Patron to light the hearth.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {wall.map((patron) => (
                  <div
                    key={patron.id}
                    className="p-3.5 rounded-2xl bg-[#FBF7EE]/75 border border-[#c96a42]/15 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-[#20070e] truncate">
                        {patron.displayName}
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#20070e]/8 border border-[#20070e]/10 text-[10px] font-bold text-[#20070e]">
                        <span>{patron.tierBadge}</span>
                        <span>{patron.tierLabel}</span>
                      </span>
                    </div>
                    {patron.note && (
                      <p className="text-xs font-serif italic text-[#120308]/75 leading-relaxed">
                        &ldquo;{patron.note}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#120308]/45 uppercase tracking-wider font-medium">
                      <span>
                        {patron.contributionType === 'leaves_donation'
                          ? 'Paper Leaves Gift'
                          : patron.contributionType === 'leaves_purchase_donation'
                          ? 'Sponsored Leaves'
                          : 'Literary Fund Gift'}
                      </span>
                      <span>
                        {patron.createdAt ? new Date(patron.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentUser?.contributions?.length > 0 && (
            <div className="bg-[#20070e] text-[#FBF7EE] rounded-3xl p-5 sm:p-6 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base">Your Patronage History</h4>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F2A98A]">
                  Private to You
                </span>
              </div>
              <div className="space-y-2">
                {currentUser.contributions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5 last:border-none">
                    <span className="text-[#FBF7EE]/85">
                      {item.nairaAmount > 0 ? `₦${item.nairaAmount.toLocaleString()}` : ''}
                      {item.nairaAmount > 0 && item.leavesAmount > 0 ? ' · ' : ''}
                      {item.leavesAmount > 0 ? `${item.leavesAmount} 🍂` : ''}
                    </span>
                    <span className="text-[10px] text-[#F2A98A]/70">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
