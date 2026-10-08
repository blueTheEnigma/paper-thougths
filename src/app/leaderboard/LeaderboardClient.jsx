"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Award, Shield, Sparkles, Feather, BookOpen, 
  Flame, CheckCircle2, ChevronRight, Search, 
  Star, HelpCircle, ArrowUpRight, GraduationCap,
  Calendar, Layers, Crown, Info, Share2, Check
} from 'lucide-react';
import PanguinAvatar from '@/components/PanguinAvatar';

export default function LeaderboardClient({ initialData, currentUserId }) {
  const [data] = useState(initialData || {});
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'annual' | 'allTime'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const monthly = data.monthly || {};
  const annual = data.annual || {};
  const allTime = data.allTime || {};
  const userStanding = data.userStanding || null;

  const prosePodium = monthly.prosePodium || [];
  const poetryPodium = monthly.poetryPodium || [];
  const reviewerPodium = monthly.reviewerPodium || [];
  const editorialHonors = monthly.editorialHonors || null;
  const annualRoster = annual.roster || [];
  const hallOfLore = allTime.hallOfLore || [];

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Filter annual roster and hall of lore
  const filteredAnnual = annualRoster.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.archetype?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHall = hallOfLore.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.archetype?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#120308] pb-24 pt-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambient Vignettes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-[#20070e]/8 rounded-full blur-[140px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-[#c96a42]/10 rounded-full blur-[120px]" />
        <div className="absolute top-60 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#F2A98A]/12 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ========================================================= */}
        {/* HERO HEADER: The Scribes' Monument                        */}
        {/* ========================================================= */}
        <div className="text-center space-y-4 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#20070e]/5 border border-[#20070e]/15 text-[#20070e] text-xs font-mono uppercase tracking-widest font-bold">
            <Trophy size={13} className="text-[#c96a42]" />
            <span>The Scribes&apos; Monument • 3-Tier Arena</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-[#20070e] tracking-tight leading-tight">
            The Arena of Laurels
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#120308]/70 font-serif italic">
            Where ink turns to laurel, literary fellowship is rewarded, and endurance is inscribed into the permanent lore of Paper Thoughts.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs font-mono">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-[#20070e]/10 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c96a42] animate-pulse" />
              <span className="text-[#20070e] font-bold">₦18,000</span>
              <span className="text-[#120308]/50">Monthly Laurels Pool</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-[#20070e]/10 shadow-xs">
              <Shield size={13} className="text-amber-600" />
              <span className="text-[#20070e] font-bold">Top 10</span>
              <span className="text-[#120308]/50">Veteran Silver Bullet Zone</span>
            </div>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-[#20070e]/5 hover:bg-[#20070e]/10 px-3 py-2 rounded-xl border border-[#20070e]/10 text-[#20070e] font-bold transition-all cursor-pointer"
            >
              {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
              <span>{copiedLink ? "Link Copied!" : "Share Arena"}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CURRENT USER STANDING BANNER (Personalized Gamification) */}
        {/* ========================================================= */}
        {userStanding && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#20070e] via-[#3a0d1a] to-[#20070e] text-[#FAF7F0] p-4 sm:p-5 rounded-2xl shadow-xl border border-[#c96a42]/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-full bg-radial from-[#F2A98A]/20 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="p-0.5 rounded-full border border-[#F2A98A]/40 bg-white/10">
                  <PanguinAvatar 
                    lifetimeLeaves={userStanding.lifetimeLeaves || 0} 
                    avatarUrl={userStanding.avatarUrl} 
                    variant="icon" 
                    archetype={userStanding.archetype} 
                    foundingBadge={userStanding.foundingBadge} 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base sm:text-lg text-white">
                      {userStanding.name}
                    </span>
                    {userStanding.isInsideSilverBulletZone && (
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                        🛡️ Top 10 Shielded
                      </span>
                    )}
                    {userStanding.isWinningMonthlyLaurel && (
                      <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                        👑 ₦2k Laurel Track
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 font-sans mt-0.5">
                    {userStanding.proseRank ? `Prose: #${userStanding.proseRank} • ` : ''}
                    {userStanding.poetryRank ? `Poetry: #${userStanding.poetryRank} • ` : ''}
                    {userStanding.reviewRank ? `Reviews: #${userStanding.reviewRank} • ` : ''}
                    Annual Crucible: #{userStanding.annualRank || 'Unranked'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setActiveTab('monthly')}
                  className="bg-[#c96a42] hover:bg-[#d8764e] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Your Standing</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* 3-TIER TAB SWITCHER                                       */}
        {/* ========================================================= */}
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-[#20070e]/15 shadow-sm inline-flex gap-1 sm:gap-2 max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'bg-[#20070e] text-[#FAF7F0] shadow-md'
                  : 'text-[#120308]/60 hover:text-[#20070e] hover:bg-black/5'
              }`}
            >
              <Calendar size={15} className={activeTab === 'monthly' ? 'text-[#F2A98A]' : ''} />
              <span>Monthly Laurels (₦18k Pool)</span>
            </button>

            <button
              onClick={() => setActiveTab('annual')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'annual'
                  ? 'bg-[#20070e] text-[#FAF7F0] shadow-md'
                  : 'text-[#120308]/60 hover:text-[#20070e] hover:bg-black/5'
              }`}
            >
              <Shield size={15} className={activeTab === 'annual' ? 'text-amber-400' : ''} />
              <span>Annual Crucible (Jan 1 Reset)</span>
            </button>

            <button
              onClick={() => setActiveTab('allTime')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'allTime'
                  ? 'bg-[#20070e] text-[#FAF7F0] shadow-md'
                  : 'text-[#120308]/60 hover:text-[#20070e] hover:bg-black/5'
              }`}
            >
              <Crown size={15} className={activeTab === 'allTime' ? 'text-[#c96a42]' : ''} />
              <span>Hall of Lore (Eternal Scribes)</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: MONTHLY LAURELS (₦18k Cash Pool & 3 Podiums)      */}
        {/* ========================================================= */}
        <AnimatePresence mode="wait">
          {activeTab === 'monthly' && (
            <motion.div 
              key="monthly"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Explanatory Banner */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-[#20070e]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-lg text-[#20070e]">
                      {monthly.cycleName || 'Active Cycle'} Laurels Race
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#120308]/70 leading-relaxed font-sans">
                    Nine distinct laurels of <strong>₦2,000 each</strong> are minted at month&apos;s end to celebrate our 3 Top Fiction Writers, 3 Top Poets, and 3 Top Intentional Reviewers.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#FAF7F0] px-4 py-2.5 rounded-xl border border-[#20070e]/10 flex-shrink-0 text-xs font-mono">
                  <Flame size={14} className="text-[#c96a42]" />
                  <span className="text-[#120308]/70">Streak Rule:</span>
                  <span className="font-bold text-[#20070e]">4/4 Weekly Prompts</span>
                </div>
              </div>

              {/* PODIUM SECTION 1: Fiction & Prose Authors */}
              <PodiumSection 
                title="Fiction & Prose Laurels"
                subtitle="Top 3 short story & flash fiction writers of the active monthly cycle."
                icon={BookOpen}
                iconColor="text-[#20070e]"
                badgeIcon="🔥"
                items={prosePodium}
                metricLabel="Stories"
                streakLabel="Prompt Streak"
                currentUserId={currentUserId}
              />

              {/* PODIUM SECTION 2: Poetry & Verses Authors */}
              <PodiumSection 
                title="Poetry & Verses Laurels"
                subtitle="Top 3 poets, sonneteers, and lyrical crafters of the active monthly cycle."
                icon={Feather}
                iconColor="text-[#c96a42]"
                badgeIcon="🪶"
                items={poetryPodium}
                metricLabel="Poems"
                streakLabel="Verse Streak"
                currentUserId={currentUserId}
              />

              {/* PODIUM SECTION 3: Reviewers of the Month */}
              <PodiumSection 
                title="Reviewers of the Month"
                subtitle="Top 3 critique corner champions ranked by genuine author helpfulness confirmations."
                icon={Award}
                iconColor="text-amber-600"
                badgeIcon="✨"
                items={reviewerPodium}
                metricLabel="Helpful"
                subMetricLabel="Total Critiques"
                isReviewer={true}
                currentUserId={currentUserId}
              />

              {/* Published Editorial Honors (If Available) */}
              {editorialHonors && (
                <div className="space-y-4 pt-6 border-t border-[#20070e]/15">
                  <div className="flex items-center gap-2">
                    <Crown size={18} className="text-[#c96a42]" />
                    <h3 className="font-display font-bold text-xl text-[#20070e]">
                      Official Editorial Laureates • {editorialHonors.monthYear}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {editorialHonors.generalBookie && (
                      <EditorialCard 
                        title="Bookie of the Month (General)"
                        name={editorialHonors.generalBookie.name}
                        blurb={editorialHonors.generalBookie.text}
                        badge="General BOTM"
                      />
                    )}
                    {editorialHonors.abujaBookie && (
                      <EditorialCard 
                        title="Bookie of the Month (Abuja)"
                        name={editorialHonors.abujaBookie.name}
                        blurb={editorialHonors.abujaBookie.text}
                        badge="Abuja BOTM"
                      />
                    )}
                    {editorialHonors.reviewOfTheMonth && (
                      <EditorialCard 
                        title="Review of the Month"
                        name={editorialHonors.reviewOfTheMonth.name}
                        blurb={editorialHonors.reviewOfTheMonth.text}
                        badge="Golden Critique"
                      />
                    )}
                    {editorialHonors.authorOfTheMonth && (
                      <EditorialCard 
                        title="Author of the Month"
                        name={editorialHonors.authorOfTheMonth.name}
                        blurb={editorialHonors.authorOfTheMonth.text}
                        badge="Master Storyteller"
                      />
                    )}
                    {editorialHonors.poetOfTheMonth && (
                      <EditorialCard 
                        title="Poet of the Month"
                        name={editorialHonors.poetOfTheMonth.name}
                        blurb={editorialHonors.poetOfTheMonth.text}
                        badge="Master of Verses"
                      />
                    )}
                    {editorialHonors.mostImprovedAuthor && (
                      <EditorialCard 
                        title="Most Improved Author"
                        name={editorialHonors.mostImprovedAuthor.name}
                        blurb={editorialHonors.mostImprovedAuthor.text}
                        badge="Ascending Scribe"
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ANNUAL CRUCIBLE (Jan 1 Reset & Silver Bullet Zone) */}
          {/* ========================================================= */}
          {activeTab === 'annual' && (
            <motion.div 
              key="annual"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Silver Bullet Explainer */}
              <div className="bg-gradient-to-br from-[#20070e] via-[#2c0b15] to-[#120308] text-[#FAF7F0] p-6 sm:p-7 rounded-3xl border border-[#c96a42]/30 shadow-xl relative overflow-hidden">
                <div className="max-w-3xl space-y-3 relative z-10">
                  <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <Shield size={12} />
                    <span>The Silver Bullet Veteran Covenant</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                    Annual Crucible ({annual.year || '2026'})
                  </h2>
                  <p className="text-sm text-white/80 font-serif leading-relaxed">
                    Resets every January 1st. Scribes who maintain unwavering dedication and conclude the year in the <strong>Top 10</strong> are bestowed with a sacred <strong>Veteran Silver Bullet</strong>. This talisman automatically intercepts an eviction during unexpected life storms.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-white/70">
                    <span>🟢 Good Standing = 0 Strikes</span>
                    <span>🟡 Strike 1/3 (Probation)</span>
                    <span>🟠 Strike 2/3 (Warning)</span>
                    <span>🎓 Sabbatical = Clock Frozen</span>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#120308]/40" />
                  <input 
                    type="text" 
                    placeholder="Search scribe or archetype..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/80 border border-[#20070e]/15 rounded-xl pl-9 pr-4 py-2 text-xs font-sans placeholder-[#120308]/40 focus:outline-none focus:border-[#c96a42] transition-colors"
                  />
                </div>
                <div className="text-xs font-mono text-[#120308]/60">
                  Showing {filteredAnnual.length} Scribes
                </div>
              </div>

              {/* Roster Table */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#20070e]/15 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#20070e]/5 border-b border-[#20070e]/10 text-[#20070e] font-mono uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4 text-center w-12">Rank</th>
                        <th className="py-3 px-4">Scribe</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Silver Bullets</th>
                        <th className="py-3 px-4 text-center">Reviews</th>
                        <th className="py-3 px-4 text-center">Submissions</th>
                        <th className="py-3 px-4 text-center">BOTM Read</th>
                        <th className="py-3 px-4 text-right">Leaves</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20070e]/10">
                      {filteredAnnual.map((scribe, index) => {
                        const isSilverBulletThreshold = scribe.rank === 10;
                        const isUser = currentUserId && scribe.id === currentUserId;

                        return (
                          <tbody key={scribe.id} className="contents">
                            <tr 
                              className={`transition-colors ${
                                isUser ? 'bg-[#c96a42]/10 font-bold' : 'hover:bg-black/5'
                              }`}
                            >
                              <td className="py-3.5 px-4 text-center font-mono font-bold">
                                {scribe.rank === 1 ? '🥇' : scribe.rank === 2 ? '🥈' : scribe.rank === 3 ? '🥉' : `#${scribe.rank}`}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <PanguinAvatar 
                                    lifetimeLeaves={scribe.lifetimeLeaves || 0} 
                                    avatarUrl={scribe.avatarUrl} 
                                    variant="icon" 
                                    archetype={scribe.archetype} 
                                    foundingBadge={scribe.foundingBadge} 
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5 font-bold text-[#20070e]">
                                      <span>{scribe.name}</span>
                                      {isUser && (
                                        <span className="text-[9px] bg-[#c96a42] text-white px-1.5 py-0.2 rounded font-mono">
                                          YOU
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[#120308]/60 font-serif italic">
                                      {scribe.archetype || 'Sanctuary Scribe'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                                  scribe.statusVariant === 'good' 
                                    ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' 
                                    : scribe.statusVariant === 'sabbatical'
                                    ? 'bg-blue-500/10 text-blue-800 border border-blue-500/20'
                                    : scribe.statusVariant === 'caution'
                                    ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                                    : 'bg-red-500/10 text-red-800 border border-red-500/20'
                                }`}>
                                  {scribe.statusBadge}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono">
                                {scribe.silverBullets > 0 ? (
                                  <span className="text-amber-700 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    🛡️ x{scribe.silverBullets}
                                  </span>
                                ) : (
                                  <span className="text-[#120308]/30">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-semibold">
                                {scribe.annualReviews}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-semibold">
                                {scribe.annualSubmissions}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-semibold">
                                {scribe.annualBotmReviews}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-[#20070e]">
                                {scribe.lifetimeLeaves || 0} 🍃
                              </td>
                            </tr>

                            {/* Glowing Golden Divider between Rank 10 and 11 */}
                            {isSilverBulletThreshold && (
                              <tr className="bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-y-2 border-amber-500/40">
                                <td colSpan={8} className="py-2.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2 text-[11px] font-mono font-bold text-amber-900 uppercase tracking-widest animate-pulse">
                                    <Sparkles size={13} className="text-amber-600" />
                                    <span>✨ TOP 10 SILVER BULLET THRESHOLD — VETERAN SHIELD ZONE FOR NEXT YEAR ✨</span>
                                    <Sparkles size={13} className="text-amber-600" />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: HALL OF LORE (All-Time Eternal Scribes)             */}
          {/* ========================================================= */}
          {activeTab === 'allTime' && (
            <motion.div 
              key="allTime"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-[#20070e] text-[#FAF7F0] p-6 sm:p-8 rounded-3xl border border-[#c96a42]/30 shadow-xl relative overflow-hidden">
                <div className="max-w-3xl space-y-2 relative z-10">
                  <div className="inline-flex items-center gap-1.5 bg-[#c96a42]/20 border border-[#c96a42]/40 text-[#F2A98A] text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <Crown size={12} />
                    <span>The Hall of Lore • Eternal Scribes</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
                    The Clubhouse Hall of Lore
                  </h2>
                  <p className="text-sm text-white/80 font-serif leading-relaxed">
                    Dedicated to the eternal architects of Paper Thoughts. Here stand our Founding Scribes, prolific literary mentors, and lifetime leaf masters whose contributions helped build this sanctuary.
                  </p>
                </div>
              </div>

              {/* Hall of Lore Table */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#20070e]/15 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#20070e]/5 border-b border-[#20070e]/10 text-[#20070e] font-mono uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4 text-center w-12">Rank</th>
                        <th className="py-3 px-4">Scribe</th>
                        <th className="py-3 px-4 text-center">Accolade / Badge</th>
                        <th className="py-3 px-4 text-center">Critiques Given</th>
                        <th className="py-3 px-4 text-center">Works Published</th>
                        <th className="py-3 px-4 text-center">Member Since</th>
                        <th className="py-3 px-4 text-right">Lifetime Leaves</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20070e]/10">
                      {filteredHall.map((scribe) => {
                        const isUser = currentUserId && scribe.id === currentUserId;

                        return (
                          <tr 
                            key={scribe.id} 
                            className={`transition-colors ${
                              isUser ? 'bg-[#c96a42]/10 font-bold' : 'hover:bg-black/5'
                            }`}
                          >
                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              {scribe.rank === 1 ? '👑' : scribe.rank === 2 ? '🥈' : scribe.rank === 3 ? '🥉' : `#${scribe.rank}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <PanguinAvatar 
                                  lifetimeLeaves={scribe.lifetimeLeaves || 0} 
                                  avatarUrl={scribe.avatarUrl} 
                                  variant="icon" 
                                  archetype={scribe.archetype} 
                                  foundingBadge={scribe.foundingBadge} 
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 font-bold text-[#20070e]">
                                    <span>{scribe.name}</span>
                                    {isUser && (
                                      <span className="text-[9px] bg-[#c96a42] text-white px-1.5 py-0.2 rounded font-mono">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#120308]/60 font-serif italic">
                                    {scribe.archetype || 'Sanctuary Scribe'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {scribe.foundingBadge ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                                  {scribe.foundingBadge === 'founding_poet' ? '🪶 Founding Poet' : '📜 Founding Scribe'}
                                </span>
                              ) : scribe.rank <= 3 ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c96a42]/15 text-[#c96a42] border border-[#c96a42]/30">
                                  🏛️ Lore Pillar
                                </span>
                              ) : (
                                <span className="text-[#120308]/40 text-[10px] font-mono">Fellow Scribe</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-semibold">
                              {scribe.totalReviews}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-semibold">
                              {scribe.totalSubmissions}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-[#120308]/60">
                              {scribe.memberSince}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#20070e]">
                              {scribe.lifetimeLeaves || 0} 🍃
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PODIUM COMPONENT FOR MONTHLY LAURELS
// -------------------------------------------------------------
function PodiumSection({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  badgeIcon, 
  items, 
  metricLabel, 
  subMetricLabel = null,
  isReviewer = false,
  currentUserId 
}) {
  const top3 = items.slice(0, 3);
  const runnersUp = items.slice(3, 8);

  // Rearrange for traditional podium presentation: #2 (left), #1 (center), #3 (right)
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push({ ...top3[1], podiumSlot: 'second' });
  if (top3[0]) podiumOrder.push({ ...top3[0], podiumSlot: 'first' });
  if (top3[2]) podiumOrder.push({ ...top3[2], podiumSlot: 'third' });

  return (
    <div className="space-y-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-[#20070e]/10 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#20070e]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#20070e]/5 rounded-xl border border-[#20070e]/10">
            <Icon size={18} className={iconColor} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[#20070e]">
              {title}
            </h3>
            <p className="text-xs text-[#120308]/60 font-serif italic">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
          3x ₦2,000 Cash Laurels
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white/40 rounded-2xl border border-dashed border-[#20070e]/15">
          <Icon size={32} className={`mx-auto mb-3 opacity-30 ${iconColor}`} />
          <h4 className="font-display font-bold text-sm text-[#20070e]">The Laurels Await Your Quill</h4>
          <p className="text-xs text-[#120308]/60 font-serif italic max-w-md mx-auto mt-1">
            {isReviewer 
              ? "No critiques have been submitted yet in this cycle. Visit the Critique Corner to earn leaves and claim the 1st laurel!"
              : "No manuscripts have been submitted yet for this stream. Respond to the weekly prompt to lead the podium!"}
          </p>
          <div className="mt-4">
            <Link 
              href={isReviewer ? "/dashboard/review" : "/dashboard/write"}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-[#20070e] text-[#FAF7F0] px-4 py-2 rounded-xl hover:bg-[#3d111d] transition-colors"
            >
              <span>{isReviewer ? "Visit Critique Corner →" : "Write Manuscript →"}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {podiumOrder.map((scribe) => {
          const isFirst = scribe.podiumSlot === 'first';
          const isSecond = scribe.podiumSlot === 'second';
          const isThird = scribe.podiumSlot === 'third';
          const isUser = currentUserId && scribe.id === currentUserId;

          return (
            <div 
              key={scribe.id}
              className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all ${
                isFirst 
                  ? 'bg-gradient-to-b from-amber-500/15 via-white to-amber-500/5 border-2 border-amber-500/40 shadow-md md:-translate-y-2' 
                  : isSecond
                  ? 'bg-white/80 border border-[#c96a42]/30 shadow-xs'
                  : 'bg-white/80 border border-[#20070e]/15 shadow-xs'
              } ${isUser ? 'ring-2 ring-[#c96a42]' : ''}`}
            >
              {/* Laurel Prize Header Badge */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                  <span>{isFirst ? '👑 1st Laurel' : isSecond ? '🥈 2nd Laurel' : '🥉 3rd Laurel'}</span>
                </div>
                <div className="bg-emerald-600 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
                  ₦2,000
                </div>
              </div>

              {/* Scribe Details */}
              <div className="py-4 flex items-center gap-3.5">
                <PanguinAvatar 
                  lifetimeLeaves={scribe.lifetimeLeaves || 0} 
                  avatarUrl={scribe.avatarUrl} 
                  variant="compact" 
                  archetype={scribe.archetype} 
                  foundingBadge={scribe.foundingBadge} 
                />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#20070e] truncate flex items-center gap-1.5">
                    <span>{scribe.name}</span>
                    {isUser && (
                      <span className="text-[9px] bg-[#c96a42] text-white px-1.5 py-0.2 rounded font-mono flex-shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#120308]/60 font-serif italic truncate">
                    {scribe.archetype || 'Sanctuary Scribe'}
                  </div>
                </div>
              </div>

              {/* Metrics & Streak Pill */}
              <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs font-mono">
                {isReviewer ? (
                  <div className="space-y-0.5">
                    <div className="text-[#20070e] font-bold">
                      {scribe.helpfulCount} {metricLabel}
                    </div>
                    <div className="text-[10px] text-[#120308]/50">
                      {scribe.totalReviews} total critiques
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="text-[#20070e] font-bold">
                      {scribe.submissionsCount} {metricLabel}
                    </div>
                    <div className="text-[10px] text-[#120308]/50">
                      Submitted in cycle
                    </div>
                  </div>
                )}

                {/* Prompt Streak Badge */}
                {!isReviewer && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    scribe.hasFullStreak 
                      ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30' 
                      : 'bg-black/5 text-[#120308]/60'
                  }`}>
                    {badgeIcon} {scribe.streak}/4 Streak
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Runners-Up Collapsible Strip (#4 through #8) */}
      {runnersUp.length > 0 && (
        <div className="pt-2">
          <div className="text-[11px] font-mono text-[#120308]/50 uppercase tracking-wider mb-2 font-bold">
            Chasing the Laurels (#4 – #{3 + runnersUp.length}):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            {runnersUp.map((runner) => (
              <div 
                key={runner.id} 
                className="bg-white/60 p-2.5 rounded-xl border border-black/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[#120308]/40 text-[11px] font-bold">
                    #{runner.rank}
                  </span>
                  <span className="font-bold text-[#20070e] truncate">
                    {runner.name.split(' ')[0]}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#120308]/70 flex-shrink-0">
                  {isReviewer ? `${runner.helpfulCount} helpful` : `${runner.submissionsCount} works`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// EDITORIAL HONORS CARD COMPONENT
// -------------------------------------------------------------
function EditorialCard({ title, name, blurb, badge }) {
  return (
    <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#20070e]/15 shadow-xs flex flex-col justify-between space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono uppercase font-bold text-[#c96a42]">
            {title}
          </span>
          <span className="bg-[#20070e]/5 text-[#20070e] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#20070e]/10">
            {badge}
          </span>
        </div>
        <h4 className="font-display font-bold text-base text-[#20070e]">
          {name}
        </h4>
      </div>
      <p className="text-xs text-[#120308]/70 font-serif italic leading-relaxed line-clamp-3">
        &ldquo;{blurb}&rdquo;
      </p>
    </div>
  );
}
