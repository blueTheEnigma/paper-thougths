"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, Award, Crown, CheckCircle, 
  Loader2, Plus, Sparkles, Radio, Copy, Check, ExternalLink, 
  MessageCircle, ShieldAlert, Image as ImageIcon, ChevronRight, X
} from 'lucide-react';

export default function AdminGatheringsTab({ initialGatherings = [], chapters = [] }) {
  const [gatherings, setGatherings] = useState(initialGatherings);
  const [loading, setLoading] = useState(false);
  const [selectedGathering, setSelectedGathering] = useState(null);
  const [gatheringDetails, setGatheringDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Gathering Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    gatheringType: 'townhall',
    eventDate: '',
    startTime: '20:15:00',
    meetUrl: '',
    venueName: '',
    description: '',
    chapterId: ''
  });

  // Corroboration & WhatsApp Draft Modal
  const [corroborateModalOpen, setCorroborateModalOpen] = useState(false);
  const [reorderedVanguardIds, setReorderedVanguardIds] = useState([]);
  const [whatsappBroadcast, setWhatsappBroadcast] = useState('');
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [isCorroborating, setIsCorroborating] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState(null);

  // Template Quick Selectors
  const applyTemplate = (type) => {
    const today = new Date();
    // Helper to find next Thursday
    const nextThursday = new Date();
    const day = today.getDay();
    const diff = (4 + 7 - day) % 7 || 7; // 4 = Thursday
    nextThursday.setDate(today.getDate() + diff);
    const thursdayStr = nextThursday.toISOString().split('T')[0];

    // Helper to find next Sunday
    const nextSunday = new Date();
    const sunDiff = (7 - day) % 7 || 7;
    nextSunday.setDate(today.getDate() + sunDiff);
    const sundayStr = nextSunday.toISOString().split('T')[0];

    if (type === 'townhall') {
      setFormData({
        title: 'Weekly Townhall: The Grand Archive & Storytellers Circle',
        gatheringType: 'townhall',
        eventDate: thursdayStr,
        startTime: '20:15:00',
        meetUrl: 'https://meet.google.com/pt-townhall-weekly',
        venueName: 'Google Meet',
        description: 'Weekly virtual council on writing craft, manuscript batch review, and chapter chronicles. Punctual kin crowned at the ramparts.',
        chapterId: ''
      });
    } else if (type === 'book_banter') {
      setFormData({
        title: 'Sunday Book Banter: Literary Sparks & Dangerous Tropes',
        gatheringType: 'book_banter',
        eventDate: sundayStr,
        startTime: '15:00:00',
        meetUrl: 'https://x.com/i/spaces/pt-book-banter',
        venueName: 'X Spaces',
        description: 'Live audio debate on controversial endings, plot craft, and reading lore. Spoken vault cipher will be announced live on stage.',
        chapterId: ''
      });
    } else if (type === 'botm_review') {
      setFormData({
        title: 'BOTM Review: The Parlour Wife by Foluso Agbaje',
        gatheringType: 'botm_review',
        eventDate: thursdayStr,
        startTime: '20:15:00',
        meetUrl: 'https://meet.google.com/pt-botm-review',
        venueName: 'Google Meet',
        description: 'Dissecting the secrets, historical prose, and female defiance in Foluso Agbaje’s colonial drama. Corona Muralis awarded to #1 arrival.',
        chapterId: ''
      });
    } else if (type === 'physical') {
      setFormData({
        title: 'Physical Chapter Gathering: Salon of the Living Lines',
        gatheringType: 'physical',
        eventDate: saturdayStr(),
        startTime: '16:00:00',
        meetUrl: '',
        venueName: 'Chapter Sanctuary / Café',
        description: 'In-person book readings, tactile critique, and camaraderie. First arrival posts photo to WhatsApp group to claim Corona Muralis and generate gate code.',
        chapterId: '1'
      });
    }
  };

  const saturdayStr = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (6 + 7 - day) % 7 || 7;
    const sat = new Date();
    sat.setDate(today.getDate() + diff);
    return sat.toISOString().split('T')[0];
  };

  const refreshGatherings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gatherings?filter=all');
      const data = await res.json();
      if (data.success && data.gatherings) {
        setGatherings(data.gatherings);
      }
    } catch (err) {
      console.error('Failed to refresh gatherings:', err);
    } finally {
      setLoading(false);
    }
  };

  const openGatheringDetails = async (g) => {
    setSelectedGathering(g);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/gatherings/${g.id}`);
      const data = await res.json();
      if (data.success) {
        setGatheringDetails(data);
        // Pre-fill top 5 for corroboration
        const initialTop5 = (data.attendances || [])
          .slice(0, 5)
          .map(a => a.id);
        setReorderedVanguardIds(initialTop5);
      }
    } catch (err) {
      console.error('Failed to load gathering details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateGathering = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        await refreshGatherings();
      } else {
        alert(data.error || 'Failed to create gathering');
      }
    } catch {
      alert('Network error creating gathering');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (gatheringId, newStatus) => {
    try {
      const res = await fetch(`/api/gatherings/${gatheringId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        await refreshGatherings();
        if (selectedGathering?.id === gatheringId) {
          openGatheringDetails({ ...selectedGathering, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCorroborateRoster = async () => {
    if (!selectedGathering) return;
    setIsCorroborating(true);
    try {
      const res = await fetch(`/api/gatherings/${selectedGathering.id}/corroborate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topFiveAttendanceIds: reorderedVanguardIds })
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappBroadcast(data.whatsappMessage);
        await openGatheringDetails(selectedGathering);
      } else {
        alert(data.error || 'Failed to corroborate roster');
      }
    } catch {
      alert('Error connecting to corroboration service');
    } finally {
      setIsCorroborating(false);
    }
  };

  const copyToClipboard = () => {
    if (!whatsappBroadcast) return;
    navigator.clipboard.writeText(whatsappBroadcast);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FBF7EE] p-5 rounded-3xl border border-[#c96a42]/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c96a42]">
            <Crown size={15} /> Council of Gatherings
          </div>
          <h2 className="text-2xl font-display text-[#20070e] mt-0.5">
            Rituals, Townhalls & Punctuality Ledger
          </h2>
          <p className="text-xs text-[#120308]/60 mt-0.5 font-serif">
            Manage weekly Thursday 8:15 PM Townhalls, Sunday 3 PM X Spaces, Corona Muralis awards, and WhatsApp celebrations.
          </p>
        </div>

        <button
          onClick={() => {
            applyTemplate('townhall');
            setIsCreateOpen(true);
          }}
          className="bg-[#20070e] text-[#FBF7EE] text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-2xl hover:bg-[#120308] transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          <Plus size={16} className="text-[#F2A98A]" /> Post New Gathering Card
        </button>
      </div>

      {/* Gatherings List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gatherings.map((g) => {
          const isLive = g.status === 'live';
          const isConcluded = g.status === 'concluded';

          return (
            <div
              key={g.id}
              className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                isLive
                  ? 'border-2 border-[#c96a42] ring-2 ring-[#F2A98A]/30 shadow-md'
                  : 'border-black/8 hover:border-[#c96a42]/30 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/5 text-[#120308]/60 uppercase">
                    {g.gatheringType}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isLive ? 'bg-red-100 text-red-700 animate-pulse' : isConcluded ? 'bg-black/5 text-black/40' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {g.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#20070e] leading-snug mb-1 font-display">
                  {g.title}
                </h3>

                <div className="text-[11px] text-[#120308]/60 flex items-center gap-2 mb-3">
                  <Calendar size={12} className="text-[#c96a42]" />
                  <span>{g.eventDate}</span>
                  <span>•</span>
                  <Clock size={12} className="text-[#c96a42]" />
                  <span>{g.startTime?.substring(0, 5)} WAT</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FBF7EE] border border-black/5 text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-[#120308]/40 uppercase font-bold block">RSVPs</span>
                    <span className="font-bold text-[#20070e]">{g.rsvpCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#120308]/40 uppercase font-bold block">Arrivals</span>
                    <span className="font-bold text-[#c96a42]">{g.attendanceCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {g.status === 'published' && (
                    <button
                      onClick={() => handleUpdateStatus(g.id, 'live')}
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-[#c96a42] text-white hover:bg-[#20070e] transition-colors"
                    >
                      Go Live 🔴
                    </button>
                  )}
                  {g.status === 'live' && (
                    <button
                      onClick={() => handleUpdateStatus(g.id, 'concluded')}
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-black/80 text-white hover:bg-black transition-colors"
                    >
                      Conclude
                    </button>
                  )}
                </div>

                <button
                  onClick={() => openGatheringDetails(g)}
                  className="text-xs font-bold text-[#20070e] hover:text-[#c96a42] flex items-center gap-1"
                >
                  War Room <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* War Room & Corroboration Drawer / Modal */}
      {selectedGathering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-black/10 shadow-2xl relative"
          >
            <button
              onClick={() => {
                setSelectedGathering(null);
                setGatheringDetails(null);
                setWhatsappBroadcast('');
              }}
              className="absolute top-6 right-6 text-black/40 hover:text-black"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c96a42] mb-1">
              <Crown size={14} /> Gathering Live War Room
            </div>
            <h3 className="text-2xl font-display text-[#20070e] mb-1">
              {selectedGathering.title}
            </h3>
            <p className="text-xs text-[#120308]/60 mb-6 font-serif">
              Status: <span className="font-bold uppercase text-[#c96a42]">{selectedGathering.status}</span> • Gate Code: <span className="font-mono font-bold text-[#20070e]">{selectedGathering.gateCode}</span> • Token: <span className="font-mono text-xs">{selectedGathering.magicToken}</span>
            </p>

            {loadingDetails ? (
              <div className="py-16 text-center text-black/40 flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} /> Loading attendees & rolls...
              </div>
            ) : gatheringDetails ? (
              <div className="space-y-6">
                
                {/* First Herald Banner */}
                <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📯</span>
                    <div>
                      <span className="font-bold text-[#20070e] block">The First Herald (Fastest RSVP)</span>
                      <span className="text-[11px] text-[#120308]/60">
                        {selectedGathering.firstHeraldName || 'Awaiting first RSVP'} {selectedGathering.firstHeraldLkId ? `(${selectedGathering.firstHeraldLkId})` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#c96a42]/10 text-[#c96a42]">
                    +15 Leaves Inscribed
                  </span>
                </div>

                {/* Checked-in Attendees Roll */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#20070e] flex items-center gap-1.5">
                      <Award size={14} className="text-[#c96a42]" />
                      Recorded Attendees ({gatheringDetails.attendances?.length || 0})
                    </h4>
                    <span className="text-[10px] text-[#120308]/40">
                      Ranks 1-5 hold the Punctual Vanguard
                    </span>
                  </div>

                  <div className="border border-black/10 rounded-2xl overflow-hidden divide-y divide-black/5 text-xs">
                    {gatheringDetails.attendances && gatheringDetails.attendances.length > 0 ? (
                      gatheringDetails.attendances.map((att, idx) => (
                        <div key={att.id} className="p-3 flex items-center justify-between hover:bg-black/2 gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-xs text-black/40 w-5">
                              #{att.arrivalOrder || idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-[#20070e] block">
                                {att.name} {att.isCoronaMuralis && '👑 (First Over Wall)'} {att.isCoVanguard && '🤝 (Co-Vanguard)'}
                              </span>
                              <span className="text-[10px] text-black/40 font-mono">
                                {att.lkId || 'Kindred'} • {new Date(att.checkinTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {att.photoProofUrl && (
                              <button
                                onClick={() => setPhotoViewerUrl(att.photoProofUrl)}
                                className="px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[10px] font-bold text-[#20070e] flex items-center gap-1"
                              >
                                <ImageIcon size={11} /> View WhatsApp Proof
                              </button>
                            )}
                            <span className="text-[10px] font-bold font-mono text-[#c96a42] bg-[#c96a42]/10 px-2 py-0.5 rounded-full">
                              +{att.leavesAwarded || 0} Leaves
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-black/40 text-xs italic">
                        No check-ins recorded yet for this gathering.
                      </div>
                    )}
                  </div>
                </div>

                {/* Moderator Corroboration Action */}
                <div className="p-5 rounded-2xl bg-[#FBF7EE] border border-black/8 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#20070e]">
                        ⚖️ Moderator Call Corroboration
                      </h4>
                      <p className="text-[11px] text-[#120308]/60 font-serif">
                        Confirm the Top 5 attendees who arrived in Google Meet or on stage to generate the WhatsApp celebration copy.
                      </p>
                    </div>
                    <button
                      onClick={handleCorroborateRoster}
                      disabled={isCorroborating || (gatheringDetails.attendances || []).length === 0}
                      className="px-4 py-2 rounded-xl bg-[#20070e] text-[#FBF7EE] text-xs font-bold uppercase tracking-wider hover:bg-[#120308] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isCorroborating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-[#F2A98A]" />}
                      Corroborate & Draft Blast
                    </button>
                  </div>

                  {/* Pre-Formatted WhatsApp Message */}
                  {whatsappBroadcast && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-3 border-t border-black/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#20070e] flex items-center gap-1.5">
                          <MessageCircle size={14} className="text-emerald-600" /> Formatted WhatsApp Broadcast
                        </span>
                        <button
                          onClick={copyToClipboard}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                        >
                          {copiedBroadcast ? <Check size={12} /> : <Copy size={12} />}
                          {copiedBroadcast ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={8}
                        value={whatsappBroadcast}
                        className="w-full p-3 rounded-xl bg-white border border-black/10 font-mono text-[11px] text-black/80 leading-relaxed focus:outline-none"
                      />
                    </motion.div>
                  )}
                </div>

              </div>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* New Gathering Scheduler Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-xl w-full border border-black/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-6 right-6 text-black/40 hover:text-black"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c96a42] mb-1">
              <Sparkles size={14} /> Schedule Gathering
            </div>
            <h3 className="text-2xl font-display text-[#20070e] mb-1">
              Post Gathering Card
            </h3>
            <p className="text-xs text-[#120308]/60 mb-4 font-serif">
              Choose a quick template or configure a custom chapter gathering.
            </p>

            {/* Quick Template Selector Pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                type="button"
                onClick={() => applyTemplate('townhall')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] border border-black/5"
              >
                🏛️ Thursday Townhall (8:15 PM)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('book_banter')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] border border-black/5"
              >
                🎙️ Sunday X Spaces (3:00 PM)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('botm_review')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] border border-black/5"
              >
                📖 BOTM Review Edition
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('physical')}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#20070e]/5 hover:bg-[#20070e]/10 text-[#20070e] border border-black/5"
              >
                📍 Physical Chapter Meet
              </button>
            </div>

            <form onSubmit={handleCreateGathering} className="space-y-4 text-xs font-bold uppercase tracking-wider">
              <div>
                <label className="block mb-1 text-black/70">Gathering Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Townhall: The Grand Archive"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-black/70">Gathering Date</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-black/70">Start Time (WAT)</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-black/70">Venue / Platform</label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    placeholder="Google Meet, X Spaces, etc."
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-black/70">Meeting URL</label>
                  <input
                    type="url"
                    value={formData.meetUrl}
                    onChange={(e) => setFormData({ ...formData, meetUrl: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono normal-case"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-black/70">Description / Lore Notice</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details for the community..."
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case font-serif"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#20070e] text-[#FBF7EE] font-bold text-xs uppercase tracking-widest hover:bg-[#120308] transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>✦ Publish Gathering Card</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* WhatsApp Photo Proof Viewer Modal */}
      {photoViewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative">
            <button
              onClick={() => setPhotoViewerUrl(null)}
              className="absolute top-4 right-4 text-black/40 hover:text-black"
            >
              <X size={20} />
            </button>
            <h4 className="text-sm font-bold text-[#20070e] mb-3">WhatsApp Arrival Screenshot Proof</h4>
            <div className="rounded-2xl overflow-hidden border border-black/10 max-h-[70vh] flex items-center justify-center bg-black/5">
              <img src={photoViewerUrl} alt="WhatsApp Proof" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
