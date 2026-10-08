"use client";

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Award, AlertTriangle, Users, Copy, Check, 
  ExternalLink, Sparkles, MessageCircle, RefreshCw, X, 
  CheckCircle2, Clock, Calendar, Shield, HeartHandshake,
  Search, ArrowRight, Ban, Award as TrophyIcon, UserCheck, Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Clean & Format Nigerian WhatsApp Links according to workspace invariant:
 * - 11-digit numbers starting with 0 -> strip 0, prepend 234
 * - Strip all \D regex characters
 */
function getNigerianWhatsAppUrl(phone, message = '') {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  } else if (digits.length === 10 && !digits.startsWith('234')) {
    digits = '234' + digits;
  }
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${textParam}`;
}

export default function AdminCrucibleTab({ initialData, allMembers = [] }) {
  const [crucibleData, setCrucibleData] = useState(initialData || {
    dueForEviction: [],
    watchlist: [],
    evictedMembers: [],
    sabbaticalMembers: [],
    shieldedVeterans: [],
    monthlyLaurels: { prose: [], poetry: [], reviewers: [], cycleName: 'Current Cycle' },
    stats: { dueCount: 0, watchlistCount: 0, evictedCount: 0, sabbaticalCount: 0, shieldedCount: 0, petitionsCount: 0 }
  });

  const [activeSubTab, setActiveSubTab] = useState('due'); // 'due' | 'laurels' | 'evicted' | 'sabbatical' | 'watchlist'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false);

  // Modal states (all portaled to document.body)
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmEvictModal, setConfirmEvictModal] = useState(null); // member object
  const [grantSabbaticalModal, setGrantSabbaticalModal] = useState(null); // member object or null
  const [sabbaticalDuration, setSabbaticalDuration] = useState('1');
  const [sabbaticalType, setSabbaticalType] = useState('general');
  const [sabbaticalSearchMemberId, setSabbaticalSearchMemberId] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [confirmAuditModal, setConfirmAuditModal] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Portal mount check for SSR safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    const isAnyModalOpen = !!confirmEvictModal || !!grantSabbaticalModal || confirmAuditModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [confirmEvictModal, grantSabbaticalModal, confirmAuditModal]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dispatch administrative action to /api/admin/crucible
  const handleApiAction = async (payload) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/crucible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Crucible operation failed');
      }

      if (data.data) {
        setCrucibleData(data.data);
      }
      return data;
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const refreshCrucibleData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/crucible');
      const json = await res.json();
      if (json.success && json.data) {
        setCrucibleData(json.data);
        showToast('✨ Crucible records refreshed.');
      }
    } catch (err) {
      showToast(`Failed to refresh: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Eviction Execution
  const executeEviction = async (member) => {
    try {
      await handleApiAction({
        action: 'evict',
        userId: member.id,
        reason: `${member.probationStrikes} Strikes / ${member.botmMisses} Missed BOTMs`
      });
      setConfirmEvictModal(null);
      showToast(`🥀 ${member.name} has been placed in Eviction Status.`);
    } catch {
      // Handled in handleApiAction
    }
  };

  // Pardon Execution
  const executePardon = async (member) => {
    try {
      await handleApiAction({
        action: 'pardon',
        userId: member.id,
        resetStrikes: true,
        grantSilverBullet: false
      });
      showToast(`🛡️ Pardon granted to ${member.name}. Strikes reset to 0.`);
    } catch {
      // Handled in handleApiAction
    }
  };

  // Grant Sabbatical Execution
  const executeGrantSabbatical = async () => {
    const targetUserId = grantSabbaticalModal?.id || sabbaticalSearchMemberId;
    if (!targetUserId) {
      showToast('⚠️ Please select a member.');
      return;
    }

    try {
      await handleApiAction({
        action: 'sabbatical',
        userId: targetUserId,
        durationMonths: parseInt(sabbaticalDuration),
        sabbaticalType
      });
      setGrantSabbaticalModal(null);
      setSabbaticalSearchMemberId('');
      showToast(`🎓 Sabbatical shield activated for ${sabbaticalDuration} month(s).`);
    } catch {
      // Handled
    }
  };

  // End Sabbatical
  const executeEndSabbatical = async (member) => {
    try {
      await handleApiAction({
        action: 'end_sabbatical',
        userId: member.id
      });
      showToast(`🛡️ Sabbatical concluded for ${member.name}.`);
    } catch {
      // Handled
    }
  };

  // Adjudicate Returner Petition
  const executeReturnerDecision = async (member, decision) => {
    try {
      await handleApiAction({
        action: 'adjudicate_returner',
        userId: member.id,
        subAction: decision
      });
      if (decision === 'approve') {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        showToast(`✨ ${member.name} re-admitted to the Sanctuary!`);
      } else {
        showToast(`Petition declined for ${member.name}.`);
      }
    } catch {
      // Handled
    }
  };

  // Run Monthly Governance Audit
  const executeMonthlyAudit = async () => {
    try {
      const res = await handleApiAction({ action: 'audit' });
      setAuditResult(res.result);
      setConfirmAuditModal(false);
      showToast('⚡ Monthly Governance Audit executed successfully.');
    } catch {
      // Handled
    }
  };

  // Copy WhatsApp Monthly Announcement Summary
  const copyWhatsAppAnnouncement = () => {
    const cycle = crucibleData.monthlyLaurels.cycleName;
    const { prose, poetry, reviewers } = crucibleData.monthlyLaurels;

    let text = `🏆 *PAPER THOUGHTS — MONTHLY LAURELS OF VALOR* 🏆\n`;
    text += `_Honoring the Ink & Critiques of ${cycle}_\n\n`;

    text += `📖 *FICTION & PROSE PODIUM (₦2,000 Cash Laurel each)*\n`;
    prose.slice(0, 3).forEach((p, idx) => {
      const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
      text += `${medals[idx]}: *${p.name}* (${p.submissionsCount} submissions)\n`;
    });
    if (prose.length === 0) text += `_No qualifying storytellers this cycle_\n`;
    text += `\n`;

    text += `🪶 *POETRY & VERSES PODIUM (₦2,000 Cash Laurel each)*\n`;
    poetry.slice(0, 3).forEach((p, idx) => {
      const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
      text += `${medals[idx]}: *${p.name}* (${p.submissionsCount} verses)\n`;
    });
    if (poetry.length === 0) text += `_No qualifying poets this cycle_\n`;
    text += `\n`;

    text += `🔍 *REVIEWERS OF THE MONTH (₦2,000 Cash Laurel each)*\n`;
    reviewers.slice(0, 3).forEach((r, idx) => {
      const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
      text += `${medals[idx]}: *${r.name}* (${r.helpfulCount || 0} helpful critiques)\n`;
    });
    if (reviewers.length === 0) text += `_No qualifying reviewers this cycle_\n`;
    text += `\n`;

    text += `💰 *Total Cash Laurels Awarded:* ₦18,000 🍃\n`;
    text += `_"To write is to remember. To critique is to sharpen."_\n`;
    text += `Congratulations to all our laureled scribes! 🥂✨`;

    navigator.clipboard.writeText(text);
    setCopiedAnnouncement(true);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setCopiedAnnouncement(false), 3000);
    showToast('📋 WhatsApp Announcement copied to clipboard!');
  };

  // Filtered members for Sabbatical picker
  const filteredSearchMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return allMembers.slice(0, 15);
    const q = memberSearchQuery.toLowerCase();
    return allMembers.filter(m => 
      (m.name || '').toLowerCase().includes(q) || 
      (m.email || '').toLowerCase().includes(q) ||
      (m.lkid || '').toLowerCase().includes(q)
    ).slice(0, 15);
  }, [allMembers, memberSearchQuery]);

  const { stats, dueForEviction, monthlyLaurels, evictedMembers, sabbaticalMembers, watchlist } = crucibleData;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#20070e] border border-[#c96a42] text-[#FBF7EE] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <Sparkles className="w-5 h-5 text-[#F2A98A]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Room Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120308] via-[#20070e] to-[#2c0b15] border border-[#c96a42]/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#c96a42]/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c96a42]/20 border border-[#c96a42]/40 text-[#F2A98A] text-xs font-serif uppercase tracking-widest mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              Paper Thoughts Sanctuary Governance
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#FBF7EE] tracking-tight">
              The Crucible & Evictions Control Room ⚖️
            </h1>
            <p className="text-[#F2A98A]/80 text-sm md:text-base mt-2 max-w-2xl font-serif">
              Real-time member probation radar, one-click Nigerian WhatsApp eviction notices, 
              ₦18,000 monthly laurels payout terminal, and Returner’s Crossing petition adjudication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setConfirmAuditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#c96a42]/20 hover:bg-[#c96a42]/30 text-[#F2A98A] border border-[#c96a42]/50 text-xs font-serif font-medium transition-all flex items-center gap-2 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Run Governance Audit
            </button>
            <button
              onClick={refreshCrucibleData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#FBF7EE] border border-white/10 text-xs transition-all disabled:opacity-50"
              title="Refresh Crucible State"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Quick Metric Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#c96a42]/20">
          <div className="bg-[#120308]/60 rounded-2xl p-4 border border-red-900/30">
            <div className="flex items-center justify-between text-xs text-red-300 font-serif">
              <span>Due for Eviction</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-serif font-bold text-red-200 mt-1">
              {stats.dueCount}
            </div>
            <div className="text-[11px] text-red-400/80 mt-1">3+ strikes or BOTM misses</div>
          </div>

          <div className="bg-[#120308]/60 rounded-2xl p-4 border border-amber-900/30">
            <div className="flex items-center justify-between text-xs text-[#F2A98A] font-serif">
              <span>Monthly Laurels Pool</span>
              <TrophyIcon className="w-4 h-4 text-[#F2A98A]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#FBF7EE] mt-1">
              ₦18,000
            </div>
            <div className="text-[11px] text-[#F2A98A]/80 mt-1">9 Monthly Laurels (₦2k each)</div>
          </div>

          <div className="bg-[#120308]/60 rounded-2xl p-4 border border-[#c96a42]/30">
            <div className="flex items-center justify-between text-xs text-[#F2A98A] font-serif">
              <span>Evicted & Returners</span>
              <Ban className="w-4 h-4 text-[#c96a42]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#FBF7EE] mt-1">
              {stats.evictedCount}
            </div>
            <div className="text-[11px] text-[#F2A98A]/80 mt-1">
              {stats.petitionsCount} active petition{stats.petitionsCount === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-[#120308]/60 rounded-2xl p-4 border border-emerald-900/30">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-serif">
              <span>Sabbaticals & Shields</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif font-bold text-emerald-200 mt-1">
              {stats.sabbaticalCount}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              {stats.shieldedCount} veteran silver bullet{stats.shieldedCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#c96a42]/20 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('due')}
          className={`px-4 py-2.5 rounded-xl font-serif text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'due'
              ? 'bg-[#c96a42] text-[#FBF7EE] shadow-lg shadow-[#c96a42]/20 font-bold'
              : 'text-[#F2A98A]/70 hover:text-[#FBF7EE] hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-300" />
          <span>Due for Eviction</span>
          {stats.dueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-950 text-red-200 font-bold">
              {stats.dueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('laurels')}
          className={`px-4 py-2.5 rounded-xl font-serif text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'laurels'
              ? 'bg-[#c96a42] text-[#FBF7EE] shadow-lg shadow-[#c96a42]/20 font-bold'
              : 'text-[#F2A98A]/70 hover:text-[#FBF7EE] hover:bg-white/5'
          }`}
        >
          <TrophyIcon className="w-4 h-4 text-amber-300" />
          <span>Monthly Laurels (₦18k)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('evicted')}
          className={`px-4 py-2.5 rounded-xl font-serif text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'evicted'
              ? 'bg-[#c96a42] text-[#FBF7EE] shadow-lg shadow-[#c96a42]/20 font-bold'
              : 'text-[#F2A98A]/70 hover:text-[#FBF7EE] hover:bg-white/5'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Evicted & Petitions</span>
          {stats.petitionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-black font-bold animate-pulse">
              {stats.petitionsCount} Petition{stats.petitionsCount === 1 ? '' : 's'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('sabbatical')}
          className={`px-4 py-2.5 rounded-xl font-serif text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'sabbatical'
              ? 'bg-[#c96a42] text-[#FBF7EE] shadow-lg shadow-[#c96a42]/20 font-bold'
              : 'text-[#F2A98A]/70 hover:text-[#FBF7EE] hover:bg-white/5'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-300" />
          <span>Sabbaticals & Shields</span>
          {stats.sabbaticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-950 text-emerald-200 font-bold">
              {stats.sabbaticalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('watchlist')}
          className={`px-4 py-2.5 rounded-xl font-serif text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'watchlist'
              ? 'bg-[#c96a42] text-[#FBF7EE] shadow-lg shadow-[#c96a42]/20 font-bold'
              : 'text-[#F2A98A]/70 hover:text-[#FBF7EE] hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Probation Watchlist ({stats.watchlistCount})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DUE FOR EVICTION RADAR */}
      {/* ========================================================================= */}
      {activeSubTab === 'due' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#FBF7EE]">
                Due for Eviction Queue
              </h2>
              <p className="text-xs text-[#F2A98A]/70 font-serif">
                Members exceeding 3 annual probation strikes or 3 consecutive missed BOTMs without a Silver Bullet or active Sabbatical.
              </p>
            </div>
            <div className="text-xs text-[#F2A98A]/60 font-serif">
              Threshold: 3 Strikes OR 3 Missed BOTMs
            </div>
          </div>

          {dueForEviction.length === 0 ? (
            <div className="bg-[#120308]/60 rounded-3xl border border-[#c96a42]/20 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#FBF7EE]">
                The Sanctuary is Whole
              </h3>
              <p className="text-sm font-serif text-[#F2A98A]/70 max-w-md mx-auto mt-2">
                No active scribes currently breach the 3-strike eviction threshold. All members are either in good standing, shielded by Silver Bullets, or resting on approved sabbaticals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dueForEviction.map((member) => {
                const whatsappMessage = `Greetings ${member.name}, this is Paper Thoughts Leadership. Our monthly community audit indicates you have accumulated ${member.probationStrikes} probation strikes / ${member.botmMisses} missed reading cycles without an active sabbatical shield. Before eviction lockout proceeds, please reach out to us if you need sabbatical grace or assistance.`;
                const waUrl = getNigerianWhatsAppUrl(member.whatsapp, whatsappMessage);

                return (
                  <div 
                    key={member.id}
                    className="bg-[#120308]/90 rounded-2xl border border-red-900/40 p-5 space-y-4 hover:border-red-600/50 transition-all shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-[#FBF7EE] text-base">
                            {member.name}
                          </span>
                          <span className="text-xs font-mono text-[#F2A98A]/70">
                            {member.lkid || `LK-2026-${member.id}`}
                          </span>
                        </div>
                        <div className="text-xs text-[#F2A98A]/60 font-serif mt-0.5">
                          {member.email} • {member.chapter || 'Clubhouse'}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2.5 py-1 rounded-full text-xs font-serif font-bold bg-red-950/80 border border-red-500/50 text-red-200">
                          3+ Breaches
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-serif py-2 border-y border-red-900/20 bg-black/20 px-3 rounded-xl">
                      <div>
                        <span className="text-[#F2A98A]/60 block text-[11px]">Probation Strikes</span>
                        <span className="text-red-300 font-bold font-mono">{member.probationStrikes} / 3 Strikes</span>
                      </div>
                      <div>
                        <span className="text-[#F2A98A]/60 block text-[11px]">BOTM Reading Misses</span>
                        <span className="text-amber-300 font-bold font-mono">{member.botmMisses} / 3 Misses</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 text-xs font-serif flex items-center gap-1.5 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Notice</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-xs text-white/40 italic">No WhatsApp number</span>
                      )}

                      <button
                        onClick={() => executePardon(member)}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/40 text-xs font-serif flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Grant Pardon</span>
                      </button>

                      <button
                        onClick={() => setGrantSabbaticalModal(member)}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 border border-blue-500/40 text-xs font-serif flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Sabbatical</span>
                      </button>

                      <button
                        onClick={() => setConfirmEvictModal(member)}
                        disabled={actionLoading}
                        className="ml-auto px-3.5 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-100 border border-red-500/60 text-xs font-serif font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Confirm Eviction</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MONTHLY LAURELS PAYOUT TERMINAL (₦18,000) */}
      {/* ========================================================================= */}
      {activeSubTab === 'laurels' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#120308] to-[#20070e] border border-[#c96a42]/30">
            <div>
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-serif font-bold text-[#FBF7EE]">
                  Monthly Laurels Terminal ({monthlyLaurels.cycleName})
                </h2>
              </div>
              <p className="text-xs text-[#F2A98A]/70 font-serif mt-1">
                ₦18,000 monthly cash honors awarded to the Top 3 Fiction Writers, Top 3 Poets, and Top 3 Reviewers (₦2,000 each).
              </p>
            </div>

            <button
              onClick={copyWhatsAppAnnouncement}
              className="px-4 py-2.5 rounded-xl bg-[#c96a42] hover:bg-[#d9754b] text-[#FBF7EE] text-xs font-serif font-bold shadow-lg flex items-center gap-2 transition-all"
            >
              {copiedAnnouncement ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>Copy WhatsApp Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Fiction & Prose Podium */}
            <div className="bg-[#120308]/80 rounded-2xl border border-[#c96a42]/30 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#c96a42]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📖</span>
                  <h3 className="font-serif font-bold text-[#FBF7EE]">Fiction & Prose</h3>
                </div>
                <span className="text-xs font-serif text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  ₦6,000 Total
                </span>
              </div>

              {monthlyLaurels.prose.length === 0 ? (
                <div className="text-center py-8 text-xs font-serif text-[#F2A98A]/50">
                  No submissions recorded this cycle.
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyLaurels.prose.slice(0, 3).map((w, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const waUrl = getNigerianWhatsAppUrl(w.whatsapp, `Congratulations ${w.name}! You have won a ₦2,000 Monthly Cash Laurel on Paper Thoughts for Fiction & Prose in ${monthlyLaurels.cycleName}! Please confirm your account details for transfer.`);
                    return (
                      <div key={w.id || idx} className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{medals[idx]}</span>
                            <span className="font-serif font-bold text-[#FBF7EE] text-sm">{w.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-300">₦2,000</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#F2A98A]/60 font-serif">
                          <span>{w.submissionsCount} submissions</span>
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Poetry & Verses Podium */}
            <div className="bg-[#120308]/80 rounded-2xl border border-[#c96a42]/30 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#c96a42]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🪶</span>
                  <h3 className="font-serif font-bold text-[#FBF7EE]">Poetry & Verses</h3>
                </div>
                <span className="text-xs font-serif text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  ₦6,000 Total
                </span>
              </div>

              {monthlyLaurels.poetry.length === 0 ? (
                <div className="text-center py-8 text-xs font-serif text-[#F2A98A]/50">
                  No poems recorded this cycle.
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyLaurels.poetry.slice(0, 3).map((w, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const waUrl = getNigerianWhatsAppUrl(w.whatsapp, `Congratulations ${w.name}! You have won a ₦2,000 Monthly Cash Laurel on Paper Thoughts for Poetry & Verses in ${monthlyLaurels.cycleName}! Please confirm your account details for transfer.`);
                    return (
                      <div key={w.id || idx} className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{medals[idx]}</span>
                            <span className="font-serif font-bold text-[#FBF7EE] text-sm">{w.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-300">₦2,000</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#F2A98A]/60 font-serif">
                          <span>{w.submissionsCount} verses</span>
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Reviewers Podium */}
            <div className="bg-[#120308]/80 rounded-2xl border border-[#c96a42]/30 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#c96a42]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔍</span>
                  <h3 className="font-serif font-bold text-[#FBF7EE]">Reviewers of Month</h3>
                </div>
                <span className="text-xs font-serif text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  ₦6,000 Total
                </span>
              </div>

              {monthlyLaurels.reviewers.length === 0 ? (
                <div className="text-center py-8 text-xs font-serif text-[#F2A98A]/50">
                  No helpful reviews confirmed this cycle.
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyLaurels.reviewers.slice(0, 3).map((w, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const waUrl = getNigerianWhatsAppUrl(w.whatsapp, `Congratulations ${w.name}! You have won a ₦2,000 Monthly Cash Laurel on Paper Thoughts as Reviewer of the Month in ${monthlyLaurels.cycleName}! Please confirm your account details for transfer.`);
                    return (
                      <div key={w.id || idx} className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{medals[idx]}</span>
                            <span className="font-serif font-bold text-[#FBF7EE] text-sm">{w.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-300">₦2,000</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#F2A98A]/60 font-serif">
                          <span>{w.helpfulCount || 0} helpful critiques</span>
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: EVICTED & RETURNER PETITIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'evicted' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#FBF7EE]">
                Evicted Members & Returner Petitions
              </h2>
              <p className="text-xs text-[#F2A98A]/70 font-serif">
                Review evicted accounts and adjudicate renewal petitions submitted via The Returner’s Crossing.
              </p>
            </div>
            <span className="text-xs font-mono text-[#F2A98A]/70 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Total Evicted: {evictedMembers.length}
            </span>
          </div>

          {evictedMembers.length === 0 ? (
            <div className="bg-[#120308]/60 rounded-3xl border border-[#c96a42]/20 p-12 text-center text-[#F2A98A]/70 font-serif">
              No members are currently in eviction status.
            </div>
          ) : (
            <div className="space-y-4">
              {evictedMembers.map((member) => {
                const hasPetition = !!member.returnerPetition;
                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      hasPetition 
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-xl' 
                        : 'bg-[#120308]/60 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-[#FBF7EE] text-base">
                            {member.name}
                          </span>
                          <span className="text-xs font-mono text-[#F2A98A]/60">
                            {member.lkid || `LK-2026-${member.id}`}
                          </span>
                          {hasPetition && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-serif font-bold bg-amber-500 text-black">
                              Petition Pending
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#F2A98A]/60 font-serif mt-1">
                          {member.email} • {member.chapter || 'Clubhouse'} • Evicted: {member.evictedAt ? new Date(member.evictedAt).toLocaleDateString() : 'Recorded'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPetition ? (
                          <>
                            <button
                              onClick={() => executeReturnerDecision(member, 'approve')}
                              disabled={actionLoading}
                              className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-serif font-bold flex items-center gap-1.5 shadow"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Accept Petition & Re-admit</span>
                            </button>
                            <button
                              onClick={() => executeReturnerDecision(member, 'reject')}
                              disabled={actionLoading}
                              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-serif border border-white/10"
                            >
                              <span>Decline</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => executePardon(member)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/40 text-xs font-serif flex items-center gap-1.5"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Pardon & Restore Active</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {hasPetition && (
                      <div className="mt-4 p-4 rounded-xl bg-black/40 border border-amber-500/20 text-xs font-serif text-[#FBF7EE]/90 space-y-2">
                        <div className="text-[#F2A98A] font-bold flex items-center gap-1.5 text-xs">
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>Submitted Petition Reflection:</span>
                        </div>
                        <p className="italic whitespace-pre-wrap leading-relaxed text-[#FBF7EE]">
                          &ldquo;{member.returnerPetition}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SABBATICALS & SHIELDS */}
      {/* ========================================================================= */}
      {activeSubTab === 'sabbatical' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#120308]/80 border border-[#c96a42]/30">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#FBF7EE]">
                Sabbatical Grace & Shield Terminal
              </h2>
              <p className="text-xs text-[#F2A98A]/70 font-serif mt-0.5">
                Grant temporary sabbatical shields (1 to 3 months) or inspect veteran Silver Bullet holders.
              </p>
            </div>

            <button
              onClick={() => setGrantSabbaticalModal({})}
              className="px-4 py-2.5 rounded-xl bg-[#c96a42] hover:bg-[#d9754b] text-[#FBF7EE] text-xs font-serif font-bold shadow-lg flex items-center gap-2 transition-all self-start md:self-auto"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Grant Sabbatical to Member</span>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#F2A98A] tracking-wider uppercase">
              Active Sabbatical Shields ({sabbaticalMembers.length})
            </h3>

            {sabbaticalMembers.length === 0 ? (
              <div className="bg-[#120308]/40 rounded-2xl border border-white/5 p-8 text-center text-xs font-serif text-[#F2A98A]/60">
                No members are currently on sabbatical.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sabbaticalMembers.map((member) => (
                  <div key={member.id} className="bg-[#120308]/80 rounded-2xl border border-emerald-900/40 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-serif font-bold text-[#FBF7EE] text-sm">{member.name}</div>
                        <div className="text-xs text-[#F2A98A]/60 font-serif">{member.email}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-serif bg-emerald-950 text-emerald-200 border border-emerald-500/30">
                        {member.sabbaticalType || 'General'}
                      </span>
                    </div>

                    <div className="text-xs font-serif text-emerald-300/90 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Protected until {member.sabbaticalUntil ? new Date(member.sabbaticalUntil).toLocaleDateString() : 'N/A'}</span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => executeEndSabbatical(member)}
                        className="text-xs font-serif text-red-300 hover:text-red-200 underline"
                      >
                        End Sabbatical Early
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: PROBATION WATCHLIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'watchlist' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#FBF7EE]">
              Early Probation Watchlist ({watchlist.length})
            </h2>
            <p className="text-xs text-[#F2A98A]/70 font-serif">
              Members with 1 or 2 probation strikes or missed reading cycles. Proactive encouragement prevents eviction.
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="bg-[#120308]/40 rounded-2xl border border-white/5 p-8 text-center text-xs font-serif text-[#F2A98A]/60">
              No members are currently on the warning watchlist.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map((member) => {
                const waUrl = getNigerianWhatsAppUrl(member.whatsapp, `Greetings ${member.name}! A quick friendly nudge from Paper Thoughts: we missed your writing/critiques in our recent cycle. Reach out if you need any assistance!`);
                return (
                  <div key={member.id} className="bg-[#120308]/60 rounded-2xl border border-amber-900/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-serif font-bold text-[#FBF7EE] text-sm">{member.name}</div>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {member.probationStrikes} Strike{member.probationStrikes === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="text-xs text-[#F2A98A]/60 font-serif">{member.email}</div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      {waUrl ? (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-serif text-emerald-400 hover:underline flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" /> Friendly Nudge
                        </a>
                      ) : (
                        <span className="text-xs text-white/30 italic">No WhatsApp</span>
                      )}
                      <button
                        onClick={() => executePardon(member)}
                        className="text-xs font-serif text-amber-300 hover:text-amber-200"
                      >
                        Clear Strikes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PORTALED MODAL: CONFIRM EVICTION */}
      {/* ========================================================================= */}
      {mounted && confirmEvictModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#120308] border border-red-600/50 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-serif font-bold text-lg">
                <Ban className="w-5 h-5" />
                <span>Confirm Eviction Lockout</span>
              </div>
              <button onClick={() => setConfirmEvictModal(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-serif text-[#FBF7EE]/90 leading-relaxed">
              Are you sure you want to evict <strong className="text-white">{confirmEvictModal.name}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-xs font-serif text-red-200/90 space-y-1">
              <div>• Their membership status will change to <strong>Evicted</strong>.</div>
              <div>• Access to writing dashboard and reviews will be locked.</div>
              <div>• They can petition for re-entry via <strong>The Returner’s Crossing</strong>.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmEvictModal(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-serif"
              >
                Cancel
              </button>
              <button
                onClick={() => executeEviction(confirmEvictModal)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-serif font-bold shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Locking out...' : 'Confirm Eviction'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* PORTALED MODAL: GRANT SABBATICAL */}
      {/* ========================================================================= */}
      {mounted && grantSabbaticalModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#120308] border border-[#c96a42]/50 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#F2A98A] font-serif font-bold text-lg">
                <HeartHandshake className="w-5 h-5" />
                <span>Grant Sabbatical Grace</span>
              </div>
              <button onClick={() => setGrantSabbaticalModal(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {grantSabbaticalModal.name ? (
              <p className="text-sm font-serif text-[#FBF7EE]">
                Granting sabbatical shield to <strong className="text-[#F2A98A]">{grantSabbaticalModal.name}</strong>.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-serif text-[#F2A98A]">Select Scribe:</label>
                <input
                  type="text"
                  placeholder="Search member name or LK ID..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-[#FBF7EE] font-serif focus:border-[#c96a42] outline-none"
                />
                <select
                  value={sabbaticalSearchMemberId}
                  onChange={(e) => setSabbaticalSearchMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-[#FBF7EE] font-serif focus:border-[#c96a42] outline-none mt-1"
                >
                  <option value="">-- Choose member --</option>
                  {filteredSearchMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.lkid || m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3 text-xs font-serif">
              <div>
                <label className="block text-[#F2A98A] mb-1">Duration:</label>
                <select
                  value={sabbaticalDuration}
                  onChange={(e) => setSabbaticalDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-[#FBF7EE] focus:border-[#c96a42] outline-none"
                >
                  <option value="1">1 Month Grace</option>
                  <option value="2">2 Months Grace</option>
                  <option value="3">3 Months Grace (Maximum)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#F2A98A] mb-1">Reason / Category:</label>
                <select
                  value={sabbaticalType}
                  onChange={(e) => setSabbaticalType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-[#FBF7EE] focus:border-[#c96a42] outline-none"
                >
                  <option value="academic">Academic / Exams</option>
                  <option value="medical">Medical / Health</option>
                  <option value="bereavement">Personal / Bereavement</option>
                  <option value="workload">Intense Workload</option>
                  <option value="general">General Grace</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setGrantSabbaticalModal(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-serif"
              >
                Cancel
              </button>
              <button
                onClick={executeGrantSabbatical}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-[#c96a42] hover:bg-[#d9754b] text-[#FBF7EE] text-xs font-serif font-bold shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Granting...' : 'Activate Shield'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* PORTALED MODAL: RUN MONTHLY GOVERNANCE AUDIT */}
      {/* ========================================================================= */}
      {mounted && confirmAuditModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[#120308] border border-amber-600/50 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
                <Play className="w-5 h-5" />
                <span>Execute Monthly Audit</span>
              </div>
              <button onClick={() => setConfirmAuditModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-serif text-[#FBF7EE]/90 leading-relaxed">
              This will evaluate all active members across the previous 30 days:
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-serif text-[#F2A98A]/80 space-y-1">
              <div>• Flags members with 0 submissions and 0 critiques in the prior 30 days.</div>
              <div>• Adds +1 probation strike (skipping members on active sabbatical).</div>
              <div>• Updates Due for Eviction radar in real-time.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-serif"
              >
                Cancel
              </button>
              <button
                onClick={executeMonthlyAudit}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-[#c96a42] hover:bg-[#d9754b] text-[#FBF7EE] text-xs font-serif font-bold shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Auditing...' : 'Run Audit Now'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
