"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, Feather, MessageSquare, Heart, 
  Award, CheckCircle2, AlertCircle, Copy, Check, Download, 
  ExternalLink, ChevronRight, User, ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ShareableLaureateCard from '@/components/anthology/ShareableLaureateCard';

export default function AdminEditorialTab({ isSuperadmin }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('curate'); // 'curate' | 'honors' | 'media'
  const [selectedCategory, setSelectedCategory] = useState('story'); // 'story' | 'poem'
  
  // Date & Scope
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [monthYear, setMonthYear] = useState(defaultMonth);
  const [allEligible, setAllEligible] = useState(true);

  // Data from API
  const [candidates, setCandidates] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Issue Metadata
  const [displayTitle, setDisplayTitle] = useState('The October Laureates: Words of Fire & Silk');
  const [curatorForeword, setCuratorForeword] = useState('Every word submitted to the Sanctuary this month carried the unmistakable pulse of courage. Here are the voices that stopped us in our tracks.');

  // Placement Selections: { [submissionId]: { rank: 1 | 2 | 3, citation: '' } }
  const [storyPlacements, setStoryPlacements] = useState({ 1: null, 2: null, 3: null });
  const [poemPlacements, setPoemPlacements] = useState({ 1: null, 2: null, 3: null });
  const [citations, setCitations] = useState({});

  // Honors
  const [generalBookieUserId, setGeneralBookieUserId] = useState('');
  const [generalBookieText, setGeneralBookieText] = useState('For unmatched reading zeal and sanctuary devotion.');
  const [abujaBookieUserId, setAbujaBookieUserId] = useState('');
  const [abujaBookieText, setAbujaBookieText] = useState('Leading the vanguard in the Abuja Chapter book banter.');
  const [reviewOfTheMonthUserId, setReviewOfTheMonthUserId] = useState('');
  const [reviewOfTheMonthText, setReviewOfTheMonthText] = useState('Crafted critiques that gave authors wings instead of wounds.');

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedType, setCopiedType] = useState(null);

  // Fetch candidates and current state
  const fetchEditorialData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/anthology/candidates?monthYear=${monthYear}&allEligible=${allEligible}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.submissions || []);
        setReviewers(data.reviewers || []);

        // Load existing issue metadata if already saved
        if (data.anthologyIssue) {
          setDisplayTitle(data.anthologyIssue.display_title || displayTitle);
          setCuratorForeword(data.anthologyIssue.curator_foreword || curatorForeword);
        }

        // Load existing placements
        if (data.inductedEntries && data.inductedEntries.length > 0) {
          const sp = { 1: null, 2: null, 3: null };
          const pp = { 1: null, 2: null, 3: null };
          const cits = {};

          data.inductedEntries.forEach(entry => {
            cits[entry.submission_id] = entry.editor_citation;
            if (entry.category === 'story') {
              sp[entry.placement_rank] = entry.submission_id;
            } else if (entry.category === 'poem') {
              pp[entry.placement_rank] = entry.submission_id;
            }
          });

          setStoryPlacements(sp);
          setPoemPlacements(pp);
          setCitations(prev => ({ ...prev, ...cits }));
        }

        // Load existing honors
        if (data.leaderboardHonors) {
          const h = data.leaderboardHonors;
          if (h.general_bookie_user_id) setGeneralBookieUserId(String(h.general_bookie_user_id));
          if (h.general_bookie_text) setGeneralBookieText(h.general_bookie_text);
          if (h.abuja_bookie_user_id) setAbujaBookieUserId(String(h.abuja_bookie_user_id));
          if (h.abuja_bookie_text) setAbujaBookieText(h.abuja_bookie_text);
          if (h.review_of_the_month_user_id) setReviewOfTheMonthUserId(String(h.review_of_the_month_user_id));
          if (h.review_of_the_month_text) setReviewOfTheMonthText(h.review_of_the_month_text);
        }

        // Select first candidate by default
        if (data.submissions?.length > 0 && !selectedSubmission) {
          setSelectedSubmission(data.submissions[0]);
        }
      } else {
        setErrorMsg(data.error || 'Failed to fetch candidate submissions.');
      }
    } catch (err) {
      console.error('Error fetching editorial candidates:', err);
      setErrorMsg('Failed to connect to editorial server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditorialData();
  }, [monthYear, allEligible]);

  const stories = candidates.filter(c => !c.isPoem);
  const poems = candidates.filter(c => c.isPoem);
  const currentList = selectedCategory === 'story' ? stories : poems;

  // Handle assigning rank
  const handleAssignRank = (submissionId, rankNumber) => {
    const isPoetry = selectedCategory === 'poem';
    const targetPlacements = isPoetry ? { ...poemPlacements } : { ...storyPlacements };
    const setTarget = isPoetry ? setPoemPlacements : setStoryPlacements;

    // If already assigned to this rank, unassign
    if (targetPlacements[rankNumber] === submissionId) {
      targetPlacements[rankNumber] = null;
    } else {
      // Clear submission from other ranks if previously assigned
      [1, 2, 3].forEach(r => {
        if (targetPlacements[r] === submissionId) targetPlacements[r] = null;
      });
      targetPlacements[rankNumber] = submissionId;
    }

    setTarget(targetPlacements);
  };

  const getAssignedRank = (submissionId) => {
    const isPoetry = selectedCategory === 'poem';
    const target = isPoetry ? poemPlacements : storyPlacements;
    for (const [rank, subId] of Object.entries(target)) {
      if (subId === submissionId) return parseInt(rank, 10);
    }
    return null;
  };

  // Compile full publish payload
  const handlePublishAll = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const storyEntries = [];
      [1, 2, 3].forEach(rank => {
        const subId = storyPlacements[rank];
        if (subId) {
          storyEntries.push({
            submissionId: subId,
            rank,
            editorCitation: citations[subId] || 'A masterclass in narrative tension and evocative sentence craft.',
            prizeAmount: 2000
          });
        }
      });

      const poemEntries = [];
      [1, 2, 3].forEach(rank => {
        const subId = poemPlacements[rank];
        if (subId) {
          poemEntries.push({
            submissionId: subId,
            rank,
            editorCitation: citations[subId] || 'Exquisite cadence and profound emotional resonance.',
            prizeAmount: 2000
          });
        }
      });

      const payload = {
        monthYear,
        displayTitle,
        curatorForeword,
        stories: storyEntries,
        poems: poemEntries,
        generalBookieUserId: generalBookieUserId ? parseInt(generalBookieUserId, 10) : null,
        generalBookieText,
        abujaBookieUserId: abujaBookieUserId ? parseInt(abujaBookieUserId, 10) : null,
        abujaBookieText,
        reviewOfTheMonthUserId: reviewOfTheMonthUserId ? parseInt(reviewOfTheMonthUserId, 10) : null,
        reviewOfTheMonthText,
        published: true
      };

      const res = await fetch('/api/admin/anthology/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`✨ Laureates Published! Issue "${displayTitle}" is now live on /anthology.`);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        fetchEditorialData();
      } else {
        setErrorMsg(json.error || 'Failed to publish anthology issue.');
      }
    } catch (err) {
      console.error('Publishing failed:', err);
      setErrorMsg('Failed to connect while publishing.');
    } finally {
      setSaving(false);
    }
  };

  // Generate Master WhatsApp Broadcast
  const getMasterWhatsAppBroadcast = () => {
    let text = `🌿 *THE LIVING ANTHOLOGY · ${monthYear} LAUREATES REVEAL* 🌿\n\n`;
    text += `*"${displayTitle}"*\n\n`;
    text += `_${curatorForeword}_\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏆 *TOP 3 FICTION & PROSE:*\n`;
    [1, 2, 3].forEach(rank => {
      const sub = candidates.find(c => c.id === storyPlacements[rank]);
      if (sub) {
        text += `• *${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place:* "${sub.title}" by ${sub.penName} (${sub.chapterName})\n`;
        text += `  _Citation:_ "${citations[sub.id] || 'Outstanding craft and execution.'}"\n\n`;
      }
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🖋️ *TOP 3 POETRY & VERSES:*\n`;
    [1, 2, 3].forEach(rank => {
      const sub = candidates.find(c => c.id === poemPlacements[rank]);
      if (sub) {
        text += `• *${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place:* "${sub.title}" by ${sub.penName} (${sub.chapterName})\n`;
        text += `  _Citation:_ "${citations[sub.id] || 'Profound lyrical imagery and tone.'}"\n\n`;
      }
    });

    if (reviewOfTheMonthUserId) {
      const rev = reviewers.find(r => r.id === parseInt(reviewOfTheMonthUserId, 10));
      if (rev) {
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🔍 *REVIEWER OF THE MONTH:* ${rev.name} (${rev.completionPercentage}% Village Completion)\n`;
        text += `_${reviewOfTheMonthText}_\n\n`;
      }
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📖 Read all winning manuscripts freely on the Living Anthology:\n`;
    text += `https://paperthoughts.org/anthology\n\n`;
    text += `_Winners will receive payouts directly via transfer. Join us in celebrating our literary warriors!_ 🥂`;

    return text;
  };

  // Generate Master Instagram Carousel Text
  const getMasterInstagramText = () => {
    let text = `✦ THE LIVING ANTHOLOGY · LAUREATES REVEAL ✦\n\n`;
    text += `Issue: "${displayTitle}"\n\n`;
    text += `Words of fire, whispers of silk. The Paper Thoughts Chief Editorial Desk has officially crowned the top manuscripts for this cycle.\n\n`;
    text += `🌿 SHORT STORIES:\n`;
    [1, 2, 3].forEach(rank => {
      const sub = candidates.find(c => c.id === storyPlacements[rank]);
      if (sub) {
        text += `${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'} "${sub.title}" — ${sub.penName}\n`;
      }
    });
    text += `\n🌿 POETRY:\n`;
    [1, 2, 3].forEach(rank => {
      const sub = candidates.find(c => c.id === poemPlacements[rank]);
      if (sub) {
        text += `${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'} "${sub.title}" — ${sub.penName}\n`;
      }
    });
    text += `\nRead all winning stories and poems freely at paperthoughts.org/anthology (Link in bio)\n\n`;
    text += `#PaperThoughts #LiteraryMagazine #AfricanLiterature #Anthology #WritingCommunity #Poetry`;
    return text;
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white border border-[#20070e]/15 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c96a42]/10 text-[#c96a42] text-xs font-bold uppercase tracking-wider mb-2">
            <Feather size={13} /> The Chief Editor's Desk
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl text-[#20070e]">Anthology Adjudication Suite</h2>
          <p className="text-xs text-[#20070e]/60 mt-1 max-w-xl">
            Evaluate manuscripts alongside Salon reader love and Critique Corner feedback. Award 1st, 2nd, and 3rd place laurels, write citations, and publish to the Living Anthology.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FBF7EE] border border-[#20070e]/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="font-mono text-[#20070e]/50 uppercase">Cycle:</span>
            <input
              type="text"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="bg-transparent font-bold text-[#20070e] w-20 focus:outline-none"
              placeholder="YYYY-MM"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-[#20070e]/80 cursor-pointer bg-[#FBF7EE] px-3 py-2 rounded-xl border border-[#20070e]/10">
            <input
              type="checkbox"
              checked={allEligible}
              onChange={(e) => setAllEligible(e.target.checked)}
              className="rounded text-[#c96a42] focus:ring-[#c96a42]"
            />
            <span>All Prior Active Works</span>
          </label>

          <button
            onClick={fetchEditorialData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] transition-colors"
            title="Refresh candidate data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handlePublishAll}
            disabled={saving}
            className="bg-[#20070e] hover:bg-[#c96a42] text-[#FBF7EE] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles size={14} />
            {saving ? 'Publishing...' : 'Publish Laurels ✨'}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 shadow-xs">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Issue Metadata Customizer Bar */}
      <div className="bg-white border border-[#20070e]/10 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#20070e]/60">Issue Display Title</label>
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => setDisplayTitle(e.target.value)}
              className="w-full bg-[#FBF7EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
              placeholder="e.g. The Harmattan Awakening"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#20070e]/60">Chief Editor's Foreword / Curatorial Note</label>
            <input
              type="text"
              value={curatorForeword}
              onChange={(e) => setCuratorForeword(e.target.value)}
              className="w-full bg-[#FBF7EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs font-medium text-[#20070e] focus:outline-none focus:border-[#c96a42]"
              placeholder="Opening thoughts celebrating this month's works..."
            />
          </div>
        </div>
      </div>

      {/* Editorial Sub-Tabs */}
      <div className="flex border-b border-[#20070e]/10 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveSubTab('curate')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'curate'
              ? 'border-[#c96a42] text-[#c96a42]'
              : 'border-transparent text-[#20070e]/50 hover:text-[#20070e]'
          }`}
        >
          <BookOpen size={14} /> Manuscript Curation & Village Voice ({candidates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('honors')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'honors'
              ? 'border-[#c96a42] text-[#c96a42]'
              : 'border-transparent text-[#20070e]/50 hover:text-[#20070e]'
          }`}
        >
          <Award size={14} /> Reviewers & Bookies (90% Completion Gate)
        </button>

        <button
          onClick={() => setActiveSubTab('media')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'media'
              ? 'border-[#c96a42] text-[#c96a42]'
              : 'border-transparent text-[#20070e]/50 hover:text-[#20070e]'
          }`}
        >
          <Sparkles size={14} /> Media Pack & Social Broadcasts
        </button>
      </div>

      {/* ================= MODE 1: CURATE ================= */}
      {activeSubTab === 'curate' && (
        <div className="space-y-6">
          
          {/* Category Toggle */}
          <div className="flex items-center justify-between">
            <div className="inline-flex bg-white p-1 rounded-xl border border-[#20070e]/10 shadow-2xs">
              <button
                onClick={() => {
                  setSelectedCategory('story');
                  const firstStory = stories[0];
                  if (firstStory) setSelectedSubmission(firstStory);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCategory === 'story'
                    ? 'bg-[#20070e] text-[#FBF7EE]'
                    : 'text-[#20070e]/60 hover:text-[#20070e]'
                }`}
              >
                Fiction & Stories ({stories.length})
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('poem');
                  const firstPoem = poems[0];
                  if (firstPoem) setSelectedSubmission(firstPoem);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCategory === 'poem'
                    ? 'bg-[#20070e] text-[#FBF7EE]'
                    : 'text-[#20070e]/60 hover:text-[#20070e]'
                }`}
              >
                Poetry & Verses ({poems.length})
              </button>
            </div>

            {/* Current Placements Summary Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#20070e]/60">Selected Laureates:</span>
              {[1, 2, 3].map(rank => {
                const subId = selectedCategory === 'story' ? storyPlacements[rank] : poemPlacements[rank];
                const sub = candidates.find(c => c.id === subId);
                return (
                  <span
                    key={rank}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      sub
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-stone-50 text-stone-400 border-stone-200'
                    }`}
                  >
                    {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}: {sub ? sub.title.slice(0, 16) + '...' : 'Empty'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Dual-Pane Manuscript Evaluation Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Candidate List (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-[#20070e]/10 rounded-2xl p-4 max-h-[800px] overflow-y-auto space-y-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/50 px-2 block">
                {currentList.length} Submissions Ready for Evaluation
              </span>

              {currentList.map((sub) => {
                const rank = getAssignedRank(sub.id);
                const isSelected = selectedSubmission?.id === sub.id;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#20070e] text-[#FBF7EE] border-[#20070e] shadow-sm'
                        : 'bg-[#FBF7EE]/60 hover:bg-[#FBF7EE] text-[#20070e] border-[#20070e]/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm leading-snug line-clamp-1">
                        "{sub.title}"
                      </div>
                      {rank && (
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 ${
                          isSelected ? 'bg-[#c96a42] text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#FBF7EE]/70' : 'text-[#20070e]/60'}`}>
                      By {sub.penName} · {sub.chapterName}
                    </p>

                    <div className={`flex items-center gap-3 mt-2 text-[10px] font-mono ${
                      isSelected ? 'text-[#FBF7EE]/60' : 'text-[#20070e]/40'
                    }`}>
                      <span className="flex items-center gap-1"><Heart size={10} /> {sub.likesCount}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={10} /> {sub.comments.length} salon</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={10} /> {sub.reviews.length} reviews</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Manuscript Reader + Voice of the Village (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {selectedSubmission ? (
                <div className="space-y-6">
                  
                  {/* Manuscript Focus Card */}
                  <div className="bg-white border border-[#20070e]/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                    
                    {/* Header & Placement Awarding Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#20070e]/10">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#c96a42] font-bold">
                          {selectedSubmission.genre} · Uploaded {new Date(selectedSubmission.createdAt).toLocaleDateString()}
                        </span>
                        <h3 className="font-serif text-2xl sm:text-3xl text-[#20070e] font-bold mt-1">
                          "{selectedSubmission.title}"
                        </h3>
                        <p className="text-xs text-[#20070e]/60 mt-0.5">
                          By <span className="font-bold text-[#20070e]">{selectedSubmission.penName}</span> ({selectedSubmission.authorName}) · {selectedSubmission.chapterName} Chapter
                        </p>
                      </div>

                      {/* Rank Award Buttons */}
                      <div className="flex items-center gap-1.5 bg-[#FBF7EE] p-1.5 rounded-2xl border border-[#20070e]/10">
                        {[1, 2, 3].map(rank => {
                          const currentRank = getAssignedRank(selectedSubmission.id);
                          const isRank = currentRank === rank;
                          return (
                            <button
                              key={rank}
                              onClick={() => handleAssignRank(selectedSubmission.id, rank)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                isRank
                                  ? 'bg-[#c96a42] text-white shadow-xs'
                                  : 'text-[#20070e]/60 hover:text-[#20070e] hover:bg-white'
                              }`}
                            >
                              {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chief Editor Citation Box */}
                    <div className="bg-[#20070e] text-[#FBF7EE] rounded-2xl p-5 space-y-2 border border-[#c96a42]/30">
                      <div className="flex items-center justify-between text-xs text-[#F2A98A] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span>❦</span> Chief Editor's Citation (Displayed on 3D Card & Anthology)
                        </span>
                        <span className="text-[10px] text-[#FBF7EE]/40 font-mono">Ufuoma Morgan</span>
                      </div>
                      <textarea
                        rows={2}
                        value={citations[selectedSubmission.id] || ''}
                        onChange={(e) => setCitations({ ...citations, [selectedSubmission.id]: e.target.value })}
                        placeholder="Write an evocative 1-2 sentence citation detailing why this piece captivated the editorial desk..."
                        className="w-full bg-[#20070e]/80 border border-[#c96a42]/30 rounded-xl p-3 text-xs text-[#FBF7EE] placeholder-[#FBF7EE]/30 focus:outline-none focus:border-[#F2A98A]"
                      />
                    </div>

                    {/* Manuscript Logline & Full Text */}
                    <div className="space-y-4">
                      <div className="bg-[#FBF7EE] p-4 rounded-xl border border-[#20070e]/10 text-xs italic text-[#20070e]/80">
                        <span className="font-bold uppercase not-italic text-[10px] text-[#c96a42] block mb-1">Logline:</span>
                        "{selectedSubmission.logline}"
                      </div>

                      <div className="max-h-96 overflow-y-auto p-5 rounded-2xl bg-[#FBF7EE]/30 border border-[#20070e]/10 font-serif text-sm sm:text-base leading-relaxed text-[#20070e]/90 whitespace-pre-line">
                        {selectedSubmission.bodyText}
                      </div>
                    </div>

                  </div>

                  {/* VOICE OF THE VILLAGE: Salon Comments & Critique Corner Reviews */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Salon Reader Comments */}
                    <div className="bg-white border border-[#20070e]/10 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#20070e] flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-[#c96a42]" /> Living Salon Love ({selectedSubmission.comments.length})
                        </h4>
                        <span className="text-[10px] font-mono text-[#20070e]/40">Community Impressions</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {selectedSubmission.comments.length === 0 ? (
                          <p className="text-xs italic text-[#20070e]/40 py-4 text-center">No salon comments left yet.</p>
                        ) : (
                          selectedSubmission.comments.map(c => (
                            <div key={c.id} className="p-3 bg-[#FBF7EE] rounded-xl text-xs space-y-1 border border-[#20070e]/5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-[#20070e]">{c.author}</span>
                                <span className="text-[#20070e]/40 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[#20070e]/80">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Critique Corner Peer Reviews */}
                    <div className="bg-white border border-[#20070e]/10 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#20070e] flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-[#c96a42]" /> Critique Corner ({selectedSubmission.reviews.length})
                        </h4>
                        <span className="text-[10px] font-mono text-[#20070e]/40">Structured Rubrics</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {selectedSubmission.reviews.length === 0 ? (
                          <p className="text-xs italic text-[#20070e]/40 py-4 text-center">No peer reviews recorded.</p>
                        ) : (
                          selectedSubmission.reviews.map(r => (
                            <div key={r.id} className="p-3 bg-[#FBF7EE] rounded-xl text-xs space-y-1.5 border border-[#20070e]/5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-[#20070e]">{r.reviewerName}</span>
                                <span className="text-[#c96a42] font-mono font-bold capitalize">Pacing: {r.pacingRating}</span>
                              </div>
                              <p className="text-[11px] text-[#20070e]/70"><strong className="text-[#20070e]">Highwater:</strong> {r.highwater}</p>
                              <p className="text-[11px] text-[#20070e]/70"><strong className="text-[#20070e]">Pivot:</strong> {r.pivot}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-[#20070e]/10 rounded-3xl p-16 text-center text-[#20070e]/50">
                  Select a manuscript from the ledger to begin editorial evaluation.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ================= MODE 2: HONORS & 90% REVIEWER GATE ================= */}
      {activeSubTab === 'honors' && (
        <div className="space-y-8">
          
          {/* 90% Reviewer Completion Gate Leaderboard */}
          <div className="bg-white border border-[#20070e]/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck size={13} className="text-emerald-600" /> The Master Critic 90% Completion Gate
              </div>
              <h3 className="font-serif text-2xl text-[#20070e]">Inquisitor Guild Podium Eligibility (90%+ Gate)</h3>
              <p className="text-xs text-[#20070e]/60 mt-1">
                To unlock the Inquisitor of the Month podium laurels (+150 🍃 / +2.0 🪙), members must review ≥ 90% of eligible village submissions. Members below 90% qualify for standard critique leaves.
              </p>
            </div>

            <div className="overflow-x-auto -mx-6 sm:-mx-8">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#20070e]/10 text-[#20070e]/40 uppercase tracking-wider font-bold">
                    <th className="py-3 px-6">Reviewer</th>
                    <th className="py-3 px-6">Total Reviews</th>
                    <th className="py-3 px-6">Helpful Votes</th>
                    <th className="py-3 px-6">Completion %</th>
                    <th className="py-3 px-6">Inquisitor Status</th>
                    <th className="py-3 px-6 text-right">Award Honor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20070e]/5">
                  {reviewers.map(r => (
                    <tr key={r.id} className="hover:bg-[#FBF7EE]/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#20070e] flex items-center gap-2">
                        {r.name}
                        {r.archetype && <span className="text-[10px] text-[#c96a42] font-normal italic">({r.archetype})</span>}
                      </td>
                      <td className="py-4 px-6 font-mono">{r.totalReviews} / {r.eligibleSubmissions}</td>
                      <td className="py-4 px-6 font-mono text-emerald-700 font-bold">{r.helpfulReviews}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-[#20070e]/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${r.qualifiesForCash ? 'bg-emerald-600' : 'bg-[#c96a42]'}`} 
                              style={{ width: `${Math.min(100, r.completionPercentage)}%` }} 
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold">{r.completionPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.qualifiesForCash
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {r.cashPrizeLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setReviewOfTheMonthUserId(String(r.id))}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                            reviewOfTheMonthUserId === String(r.id)
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e]'
                          }`}
                        >
                          {reviewOfTheMonthUserId === String(r.id) ? 'Selected MVP' : 'Select as MVP'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reviewers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs italic text-[#20070e]/40">
                        No peer reviews submitted for this evaluation window yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bookie Honors Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* General Bookie */}
            <div className="bg-white border border-[#20070e]/10 rounded-2xl p-6 space-y-4 shadow-2xs">
              <h4 className="font-bold text-sm text-[#20070e] flex items-center gap-1.5 uppercase tracking-wider">
                <Award size={15} className="text-[#c96a42]" /> General Bookie of the Month
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/50">Winner User ID</label>
                <input
                  type="text"
                  value={generalBookieUserId}
                  onChange={(e) => setGeneralBookieUserId(e.target.value)}
                  className="w-full bg-[#FBF7EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
                  placeholder="e.g. 1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/50">Citation / Praise</label>
                <textarea
                  rows={2}
                  value={generalBookieText}
                  onChange={(e) => setGeneralBookieText(e.target.value)}
                  className="w-full bg-[#FBF7EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs text-[#20070e] focus:outline-none focus:border-[#c96a42]"
                />
              </div>
            </div>

            {/* Abuja Bookie */}
            <div className="bg-white border border-[#20070e]/10 rounded-2xl p-6 space-y-4 shadow-2xs">
              <h4 className="font-bold text-sm text-[#20070e] flex items-center gap-1.5 uppercase tracking-wider">
                <Award size={15} className="text-[#c96a42]" /> Abuja Bookie of the Month
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/50">Winner User ID</label>
                <input
                  type="text"
                  value={abujaBookieUserId}
                  onChange={(e) => setAbujaBookieUserId(e.target.value)}
                  className="w-full bg-[#FBF7EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#20070e]/50">Citation / Praise</label>
                <textarea
                  rows={2}
                  value={abujaBookieText}
                  onChange={(e) => setAbujaBookieText(e.target.value)}
                  className="w-full bg-[#FBF7EE] border border-[#20070e]/15 rounded-xl px-3 py-2 text-xs text-[#20070e] focus:outline-none focus:border-[#c96a42]"
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================= MODE 3: MEDIA PACK & SOCIAL BROADCASTS ================= */}
      {activeSubTab === 'media' && (
        <div className="space-y-8">
          
          {/* Copy-Paste Master Announcement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WhatsApp Community Broadcast */}
            <div className="bg-white border border-[#20070e]/10 rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Send size={13} className="text-emerald-600" /> WhatsApp Community Broadcast
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getMasterWhatsAppBroadcast());
                    setCopiedType('master_wa');
                    setTimeout(() => setCopiedType(null), 2500);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedType === 'master_wa' ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                  {copiedType === 'master_wa' ? 'Copied Broadcast!' : 'Copy WhatsApp Announcement'}
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={getMasterWhatsAppBroadcast()}
                className="w-full bg-[#FBF7EE] border border-[#20070e]/10 rounded-xl p-3 text-xs font-mono text-[#20070e]/80 leading-relaxed focus:outline-none"
              />
            </div>

            {/* Instagram Post & Carousel Caption */}
            <div className="bg-white border border-[#20070e]/10 rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#20070e] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#c96a42]" /> Instagram Carousel & Bio Caption
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getMasterInstagramText());
                    setCopiedType('master_ig');
                    setTimeout(() => setCopiedType(null), 2500);
                  }}
                  className="bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] border border-[#20070e]/15 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedType === 'master_ig' ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                  {copiedType === 'master_ig' ? 'Copied IG Post!' : 'Copy Instagram Caption'}
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={getMasterInstagramText()}
                className="w-full bg-[#FBF7EE] border border-[#20070e]/10 rounded-xl p-3 text-xs font-mono text-[#20070e]/80 leading-relaxed focus:outline-none"
              />
            </div>

          </div>

          {/* Live Generated 3D Cards Suite for All 6 Laureates */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl text-[#20070e]">
              Laureate 3D Cards Suite (Export to 1080x1350 PNG)
            </h3>
            <p className="text-xs text-[#20070e]/60">
              Each card below updates dynamically. Tap or click any card to flip it, or click "Download PNG" to export high-res front and back graphics for your Instagram carousel and WhatsApp stories.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              
              {/* Fiction Top 3 Cards */}
              {[1, 2, 3].map(rank => {
                const subId = storyPlacements[rank];
                const sub = candidates.find(c => c.id === subId);
                if (!sub) return null;

                return (
                  <div key={`story-${rank}`} className="space-y-2">
                    <ShareableLaureateCard
                      category="Short Story"
                      rank={rank}
                      title={sub.title}
                      authorName={sub.penName}
                      authorArchetype={sub.authorArchetype}
                      chapterName={sub.chapterName}
                      monthYear={monthYear}
                      editorCitation={citations[sub.id] || 'A masterclass in quiet tension and evocative sentence craft.'}
                      isEditor={true}
                    />
                  </div>
                );
              })}

              {/* Poetry Top 3 Cards */}
              {[1, 2, 3].map(rank => {
                const subId = poemPlacements[rank];
                const sub = candidates.find(c => c.id === subId);
                if (!sub) return null;

                return (
                  <div key={`poem-${rank}`} className="space-y-2">
                    <ShareableLaureateCard
                      category="Poetry"
                      rank={rank}
                      title={sub.title}
                      authorName={sub.penName}
                      authorArchetype={sub.authorArchetype}
                      chapterName={sub.chapterName}
                      monthYear={monthYear}
                      editorCitation={citations[sub.id] || 'Exquisite cadence and profound emotional resonance.'}
                      isEditor={true}
                    />
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

