"use client";
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, Award, Crown, CheckCircle, 
  Loader2, Plus, Sparkles, Radio, Copy, Check, ExternalLink, 
  MessageCircle, ShieldAlert, Image as ImageIcon, ChevronRight, X,
  Edit, Upload, Trash2, Mic, UserCheck
} from 'lucide-react';

export default function AdminGatheringsTab({ initialGatherings = [], chapters = [], members = [] }) {
  const [gatherings, setGatherings] = useState(initialGatherings);
  const [loading, setLoading] = useState(false);
  const [selectedGathering, setSelectedGathering] = useState(null);
  const [gatheringDetails, setGatheringDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Gathering State
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
    coverUrl: '/images/gatherings/townhall.jpg',
    chapterId: '',
    moderatorUserId: '',
    moderatorName: '',
    moderatorAvatarUrl: '',
    moderatorLkid: '',
    moderatorBio: '',
    moderatorLeavesBounty: 50,
    isGuestModerator: false
  });

  // Edit Gathering State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  // File input refs for image upload
  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Corroboration & WhatsApp Draft Modal
  const [reorderedVanguardIds, setReorderedVanguardIds] = useState([]);
  const [whatsappBroadcast, setWhatsappBroadcast] = useState('');
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [isCorroborating, setIsCorroborating] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState(null);

  // Helper to compress uploaded flyer image client-side to Base64 (<150KB)
  const handleFlyerUpload = (file, isEdit = false) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.82);

        if (isEdit) {
          setEditFormData(prev => ({ ...prev, coverUrl: base64Data }));
        } else {
          setFormData(prev => ({ ...prev, coverUrl: base64Data }));
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Template Quick Selectors
  const applyTemplate = (type) => {
    const today = new Date();
    const nextThursday = new Date();
    const day = today.getDay();
    const diff = (4 + 7 - day) % 7 || 7;
    nextThursday.setDate(today.getDate() + diff);
    const thursdayStr = nextThursday.toISOString().split('T')[0];

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
        coverUrl: '/images/gatherings/townhall.jpg',
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
        coverUrl: '/images/gatherings/book_banter.jpg',
        chapterId: ''
      });
    } else if (type === 'botm_review') {
      setFormData({
        title: 'BOTM Review: Red Rising by Pierce Brown',
        gatheringType: 'botm_review',
        eventDate: thursdayStr,
        startTime: '20:15:00',
        meetUrl: 'https://meet.google.com/pt-botm-review',
        venueName: 'Google Meet',
        description: 'Dissecting caste rebellion, Institute trials, and Darrow’s ascent in Pierce Brown’s sci-fi epic. Corona Muralis awarded to #1 arrival.',
        coverUrl: '/images/gatherings/botm_review.jpg',
        chapterId: ''
      });
    } else if (type === 'physical') {
      setFormData({
        title: 'Physical Chapter Gathering: Salon of the Living Lines',
        gatheringType: 'physical',
        eventDate: thursdayStr,
        startTime: '16:00:00',
        meetUrl: '',
        venueName: 'Chapter Sanctuary / Café',
        description: 'In-person book readings, tactile critique, and camaraderie. First arrival posts photo to WhatsApp group to claim Corona Muralis and generate gate code.',
        coverUrl: '/images/gatherings/townhall.jpg',
        chapterId: '1'
      });
    }
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

  // Compute Top Anchors for Hall of Honor
  const anchorStats = (gatherings || []).reduce((acc, g) => {
    if (g.moderatorName) {
      const key = g.moderatorUserId ? `user_${g.moderatorUserId}` : `guest_${g.moderatorName}`;
      if (!acc[key]) {
        acc[key] = {
          name: g.moderatorName,
          lkid: g.moderatorLkid,
          avatarUrl: g.moderatorAvatarUrl,
          count: 0,
          concludedCount: 0
        };
      }
      acc[key].count += 1;
      if (g.status === 'concluded') acc[key].concludedCount += 1;
    }
    return acc;
  }, {});
  const topAnchors = Object.values(anchorStats).sort((a, b) => b.count - a.count);

  const handleSelectMember = (userId, isEdit = false) => {
    const selected = members.find(m => String(m.id) === String(userId));
    if (selected) {
      const update = {
        moderatorUserId: selected.id,
        moderatorName: selected.name,
        moderatorAvatarUrl: selected.avatarUrl || '',
        moderatorLkid: selected.lkid || '',
        isGuestModerator: false
      };
      if (isEdit) {
        setEditFormData(prev => ({ ...prev, ...update }));
      } else {
        setFormData(prev => ({ ...prev, ...update }));
      }
    } else if (!userId) {
      const clear = {
        moderatorUserId: '',
        moderatorName: '',
        moderatorAvatarUrl: '',
        moderatorLkid: '',
        isGuestModerator: false
      };
      if (isEdit) {
        setEditFormData(prev => ({ ...prev, ...clear }));
      } else {
        setFormData(prev => ({ ...prev, ...clear }));
      }
    }
  };

  const handleOpenEdit = (g) => {
    setEditFormData({
      id: g.id,
      title: g.title,
      gatheringType: g.gatheringType,
      eventDate: g.eventDate,
      startTime: g.startTime?.substring(0, 8) || '20:15:00',
      meetUrl: g.meetUrl || '',
      venueName: g.venueName || '',
      description: g.description || '',
      coverUrl: g.coverUrl || '/images/gatherings/townhall.jpg',
      status: g.status || 'published',
      gateCode: g.gateCode || '2015',
      chapterId: g.chapterId ? String(g.chapterId) : '',
      moderatorUserId: g.moderatorUserId ? String(g.moderatorUserId) : '',
      moderatorName: g.moderatorName || '',
      moderatorAvatarUrl: g.moderatorAvatarUrl || '',
      moderatorLkid: g.moderatorLkid || '',
      moderatorBio: g.moderatorBio || '',
      moderatorLeavesBounty: g.moderatorLeavesBounty !== undefined && g.moderatorLeavesBounty !== null ? g.moderatorLeavesBounty : 50,
      moderatorBountyAwarded: !!g.moderatorBountyAwarded,
      isGuestModerator: !g.moderatorUserId && !!g.moderatorName
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/gatherings/${editFormData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (data.success) {
        setIsEditOpen(false);
        await refreshGatherings();
        if (selectedGathering?.id === editFormData.id) {
          await openGatheringDetails({ ...selectedGathering, ...editFormData });
        }
      } else {
        alert(data.error || 'Failed to update gathering');
      }
    } catch {
      alert('Error updating gathering');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteGathering = async (gatheringId) => {
    if (!window.confirm("Are you sure you want to permanently delete this gathering card and its attendance ledger?")) {
      return;
    }
    try {
      const res = await fetch(`/api/gatherings/${gatheringId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setIsEditOpen(false);
        if (selectedGathering?.id === gatheringId) {
          setSelectedGathering(null);
          setGatheringDetails(null);
        }
        await refreshGatherings();
      } else {
        alert(data.error || 'Failed to delete gathering');
      }
    } catch {
      alert('Error deleting gathering');
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

      {/* Anchor Hall of Honor / Moderator Celebrations */}
      {topAnchors.length > 0 && (
        <div className="p-4 rounded-3xl bg-[#20070e] text-[#FBF7EE] border border-[#c96a42]/30 shadow-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎙️</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F2A98A]">
                Ritual Anchors Hall of Honor
              </span>
            </div>
            <span className="text-[11px] text-[#FBF7EE]/60 font-serif">
              Recognizing Kin Who Guard the Sanctuary
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {topAnchors.map((anchor, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 shrink-0 transition-colors"
              >
                {anchor.avatarUrl ? (
                  <img src={anchor.avatarUrl} alt={anchor.name} className="w-7 h-7 rounded-full object-cover border border-[#F2A98A]/50 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#c96a42] text-[#FBF7EE] flex items-center justify-center font-bold text-xs shrink-0">
                    {anchor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-bold text-[#FBF7EE]">{anchor.name}</span>
                    {anchor.lkid && (
                      <span className="text-[9px] font-mono text-[#F2A98A] bg-black/40 px-1.5 py-0.5 rounded">
                        {anchor.lkid}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#FBF7EE]/70 mt-1 block">
                    {anchor.count} {anchor.count === 1 ? 'Ritual' : 'Rituals'} Anchored ({anchor.concludedCount} Concluded)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gatherings List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {gatherings.length > 0 ? (
          gatherings.map((g) => {
            const isLive = g.status === 'live';
            const isConcluded = g.status === 'concluded';
            const coverImg = g.coverUrl || '/images/gatherings/townhall.jpg';

            return (
              <div
                key={g.id}
                className={`rounded-3xl bg-white border overflow-hidden transition-all flex flex-col justify-between ${
                  isLive
                    ? 'border-2 border-[#c96a42] ring-2 ring-[#F2A98A]/30 shadow-md'
                    : 'border-black/8 hover:border-[#c96a42]/35 shadow-xs'
                }`}
              >
                {/* Event Cover Flyer Preview */}
                <div className="aspect-[16/9] w-full overflow-hidden relative bg-black/5">
                  <img src={coverImg} alt={g.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#20070e]/85 text-[#FBF7EE] backdrop-blur-xs">
                    {g.gatheringType}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${
                      isLive ? 'bg-red-600 text-white animate-pulse' : isConcluded ? 'bg-black/60 text-white/80' : 'bg-emerald-600 text-white'
                    }`}>
                      {g.status}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#20070e] leading-snug mb-1 font-display line-clamp-2">
                      {g.title}
                    </h3>

                    <div className="text-[11px] text-[#120308]/60 flex items-center gap-2 mb-3">
                      <Calendar size={12} className="text-[#c96a42]" />
                      <span>{g.eventDate}</span>
                      <span>•</span>
                      <Clock size={12} className="text-[#c96a42]" />
                      <span>{g.startTime?.substring(0, 5)} WAT</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FBF7EE] border border-black/5 text-center text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-[#120308]/40 uppercase font-bold block">RSVPs</span>
                        <span className="font-bold text-[#20070e]">{g.rsvpCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#120308]/40 uppercase font-bold block">Arrivals</span>
                        <span className="font-bold text-[#c96a42]">{g.attendanceCount || 0}</span>
                      </div>
                    </div>

                    {/* Anchor Pill */}
                    {g.moderatorName && (
                      <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-xl bg-[#20070e]/5 border border-[#c96a42]/15">
                        {g.moderatorAvatarUrl ? (
                          <img src={g.moderatorAvatarUrl} alt={g.moderatorName} className="w-5 h-5 rounded-full object-cover border border-[#c96a42]/30 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#20070e] text-[#FBF7EE] flex items-center justify-center text-[10px] font-bold shrink-0">
                            {g.moderatorName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-[#20070e] truncate">
                            🎙️ {g.moderatorName}
                          </span>
                          {g.moderatorLkid && (
                            <span className="text-[9px] font-mono font-bold text-[#c96a42] bg-[#c96a42]/10 px-1.5 py-0.5 rounded shrink-0">
                              {g.moderatorLkid}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
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

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="px-2.5 py-1.5 rounded-lg border border-black/10 hover:border-[#c96a42] text-xs font-bold text-[#20070e] flex items-center gap-1 transition-colors"
                        title="Edit Gathering Details"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        onClick={() => openGatheringDetails(g)}
                        className="text-xs font-bold text-[#20070e] hover:text-[#c96a42] flex items-center gap-1"
                      >
                        War Room <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-[#FBF7EE] rounded-3xl border border-dashed border-[#c96a42]/30 p-8">
            <div className="text-4xl mb-3">🏛️</div>
            <h3 className="text-lg font-bold font-display text-[#20070e] mb-1">
              No Gathering Cards Active
            </h3>
            <p className="text-xs text-[#120308]/60 max-w-md mx-auto font-serif mb-5">
              The ledger is clear. Click below to schedule your weekly Thursday Townhall, Sunday Book Banter on X Spaces, or your chosen Book of the Month.
            </p>
            <button
              onClick={() => {
                applyTemplate('townhall');
                setIsCreateOpen(true);
              }}
              className="bg-[#20070e] text-[#FBF7EE] text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-2xl hover:bg-[#120308] transition-all shadow-sm inline-flex items-center gap-2"
            >
              <Plus size={16} className="text-[#F2A98A]" /> Post Your First Gathering Card
            </button>
          </div>
        )}
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

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c96a42]">
                <Crown size={14} /> Gathering Live War Room
              </div>
              <button
                onClick={() => handleOpenEdit(selectedGathering)}
                className="px-3 py-1 rounded-lg border border-black/10 hover:border-[#c96a42] text-xs font-bold text-[#20070e] flex items-center gap-1 mr-8"
              >
                <Edit size={12} /> Edit Gathering Details
              </button>
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

                {/* Session Anchor / Moderator Banner */}
                {selectedGathering.moderatorName && (
                  <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {selectedGathering.moderatorAvatarUrl ? (
                        <img src={selectedGathering.moderatorAvatarUrl} alt={selectedGathering.moderatorName} className="w-10 h-10 rounded-full object-cover border-2 border-[#c96a42]/40" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#20070e] text-[#FBF7EE] flex items-center justify-center font-bold text-sm">
                          {selectedGathering.moderatorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#20070e] text-sm">{selectedGathering.moderatorName}</span>
                          {selectedGathering.moderatorLkid && (
                            <span className="font-mono text-[9px] bg-[#20070e] text-[#FBF7EE] px-1.5 py-0.5 rounded font-bold">
                              {selectedGathering.moderatorLkid}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#120308]/60 font-serif">
                          Session Anchor & Ritual Moderator
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase block text-[#c96a42]">
                        Anchor Bounty
                      </span>
                      <span className="font-mono font-bold text-xs text-[#20070e]">
                        +{selectedGathering.moderatorLeavesBounty || 50} Leaves {selectedGathering.moderatorBountyAwarded ? '✓ Inscribed' : '(Upon Conclusion)'}
                      </span>
                    </div>
                  </div>
                )}
                
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

      {/* Edit Gathering Modal */}
      {isEditOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-xl w-full border border-black/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-6 right-6 text-black/40 hover:text-black"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c96a42] mb-1">
              <Edit size={14} /> Edit Gathering
            </div>
            <h3 className="text-2xl font-display text-[#20070e] mb-1">
              Update Gathering Details
            </h3>
            <p className="text-xs text-[#120308]/60 mb-5 font-serif">
              Modify title, schedule, flyer image, platform links, or status.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold uppercase tracking-wider">
              {/* Event Flyer / Cover Selector */}
              <div>
                <label className="block mb-1 text-black/70 flex items-center justify-between">
                  <span>Event Cover Flyer (Luma Style)</span>
                  <span className="text-[10px] text-[#c96a42] font-normal lowercase">aspect 16:9</span>
                </label>
                
                {/* Flyer Preview */}
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative border border-black/10 bg-black/5 mb-2.5">
                  <img src={editFormData.coverUrl} alt="Flyer Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs"
                    >
                      <Upload size={11} /> Upload New Flyer
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFlyerUpload(e.target.files?.[0], true)}
                  className="hidden"
                />

                {/* Preset Flyers */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, coverUrl: '/images/gatherings/townhall.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[#20070e]"
                  >
                    🏛️ Townhall Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, coverUrl: '/images/gatherings/book_banter.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[#20070e]"
                  >
                    🎙️ Book Banter Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, coverUrl: '/images/gatherings/botm_review.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[#20070e]"
                  >
                    📖 BOTM Preset
                  </button>
                </div>

                <input
                  type="text"
                  value={editFormData.coverUrl || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, coverUrl: e.target.value })}
                  placeholder="Paste direct image URL or use upload above"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-[11px] font-mono normal-case"
                />
              </div>

              <div>
                <label className="block mb-1 text-black/70">Gathering Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-black/70">Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.eventDate}
                    onChange={(e) => setEditFormData({ ...editFormData, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-black/70">Start Time (WAT)</label>
                  <input
                    type="time"
                    required
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-black/70">Venue / Platform</label>
                  <input
                    type="text"
                    value={editFormData.venueName}
                    onChange={(e) => setEditFormData({ ...editFormData, venueName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-black/70">Meeting URL</label>
                  <input
                    type="url"
                    value={editFormData.meetUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, meetUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono normal-case"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-black/70">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs uppercase"
                  >
                    <option value="published">Published</option>
                    <option value="live">Live 🔴</option>
                    <option value="concluded">Concluded</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-black/70">Gate Code</label>
                  <input
                    type="text"
                    value={editFormData.gateCode}
                    onChange={(e) => setEditFormData({ ...editFormData, gateCode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              {/* Session Anchor / Moderator Assignment */}
              <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#20070e] flex items-center gap-1.5 uppercase tracking-wider">
                    <Mic size={13} className="text-[#c96a42]" /> Session Anchor & Moderator
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] lowercase text-[#120308]/60 font-sans">
                    <input
                      type="checkbox"
                      checked={!!editFormData.isGuestModerator}
                      onChange={(e) => {
                        const isGuest = e.target.checked;
                        setEditFormData(prev => ({
                          ...prev,
                          isGuestModerator: isGuest,
                          moderatorUserId: isGuest ? '' : prev.moderatorUserId
                        }));
                      }}
                      className="rounded text-[#c96a42] focus:ring-[#c96a42]"
                    />
                    <span>guest / external host</span>
                  </label>
                </div>

                {!editFormData.isGuestModerator ? (
                  <div>
                    <select
                      value={editFormData.moderatorUserId || ''}
                      onChange={(e) => handleSelectMember(e.target.value, true)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case bg-white"
                    >
                      <option value="">-- Select Member Anchor (e.g. Naffy) --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.lkid ? `(${m.lkid})` : ''} — {m.chapter || 'Kin'}
                        </option>
                      ))}
                    </select>

                    {editFormData.moderatorName && (
                      <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#c96a42]/20">
                        <div className="flex items-center gap-2">
                          {editFormData.moderatorAvatarUrl ? (
                            <img
                              src={editFormData.moderatorAvatarUrl}
                              alt="Anchor"
                              className="w-7 h-7 rounded-full object-cover border border-[#c96a42]/30 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#20070e] text-[#FBF7EE] flex items-center justify-center font-bold text-xs shrink-0">
                              {editFormData.moderatorName?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-xs text-[#20070e] block normal-case">
                              {editFormData.moderatorName}
                            </span>
                            <span className="text-[10px] text-[#120308]/50 font-mono">
                              {editFormData.moderatorLkid || 'Paper Thoughts Kin'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Assigned Anchor
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block mb-1 text-[10px] text-black/60">Guest Host Full Name</label>
                      <input
                        type="text"
                        value={editFormData.moderatorName || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, moderatorName: e.target.value, moderatorUserId: '' }))}
                        placeholder="e.g. Chimamanda Ngozi Adichie"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] text-black/60">Photo URL (Optional)</label>
                      <input
                        type="url"
                        value={editFormData.moderatorAvatarUrl || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, moderatorAvatarUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-[11px] font-mono normal-case bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] text-black/60">Bio / Credentials (Optional)</label>
                      <textarea
                        rows={2}
                        value={editFormData.moderatorBio || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, moderatorBio: e.target.value }))}
                        placeholder="Short guest bio..."
                        className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case font-serif bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Anchor Bounty Configuration */}
                <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#20070e] block">Anchor Leaves Bounty 🌿</span>
                    <span className="text-[9px] text-[#120308]/60 normal-case font-serif block">
                      {editFormData.moderatorBountyAwarded ? '✓ Bounty already awarded to this host' : 'Awarded to anchor upon event conclusion'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={500}
                      disabled={editFormData.moderatorBountyAwarded}
                      value={editFormData.moderatorLeavesBounty ?? 50}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, moderatorLeavesBounty: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1.5 rounded-lg border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono font-bold text-center bg-white disabled:opacity-50"
                    />
                    <span className="text-[10px] font-bold text-[#c96a42]">Leaves</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-black/70">Description / Lore Notice</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case font-serif"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteGathering(editFormData.id)}
                  className="py-3 px-3.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={13} /> Purge
                </button>
                <div className="flex gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-3 rounded-xl border border-black/10 text-xs font-bold uppercase tracking-wider hover:bg-black/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-3 rounded-xl bg-[#20070e] text-[#FBF7EE] font-bold text-xs uppercase tracking-widest hover:bg-[#120308] transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : <>Save Changes ✦</>}
                  </button>
                </div>
              </div>
            </form>
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
            <div className="flex flex-wrap gap-2 mb-4">
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
              {/* Event Cover Flyer Selector */}
              <div>
                <label className="block mb-1 text-black/70 flex items-center justify-between">
                  <span>Event Cover Flyer (Luma Style)</span>
                  <span className="text-[10px] text-[#c96a42] font-normal lowercase">aspect 16:9</span>
                </label>
                
                {/* Flyer Preview */}
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative border border-black/10 bg-black/5 mb-2">
                  <img src={formData.coverUrl} alt="Flyer Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <button
                      type="button"
                      onClick={() => createFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs"
                    >
                      <Upload size={11} /> Upload Custom Flyer
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={createFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFlyerUpload(e.target.files?.[0], false)}
                  className="hidden"
                />

                {/* Preset Flyers */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverUrl: '/images/gatherings/townhall.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[#20070e]"
                  >
                    🏛️ Townhall Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverUrl: '/images/gatherings/book_banter.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[#20070e]"
                  >
                    🎙️ Book Banter Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverUrl: '/images/gatherings/botm_review.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[#20070e]"
                  >
                    📖 BOTM Preset
                  </button>
                </div>

                <input
                  type="text"
                  value={formData.coverUrl || ''}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="Paste direct image URL or use upload above"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-[11px] font-mono normal-case"
                />
              </div>

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

              {/* Session Anchor / Moderator Assignment */}
              <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#20070e] flex items-center gap-1.5 uppercase tracking-wider">
                    <Mic size={13} className="text-[#c96a42]" /> Session Anchor & Moderator
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] lowercase text-[#120308]/60 font-sans">
                    <input
                      type="checkbox"
                      checked={!!formData.isGuestModerator}
                      onChange={(e) => {
                        const isGuest = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          isGuestModerator: isGuest,
                          moderatorUserId: isGuest ? '' : prev.moderatorUserId
                        }));
                      }}
                      className="rounded text-[#c96a42] focus:ring-[#c96a42]"
                    />
                    <span>guest / external host</span>
                  </label>
                </div>

                {!formData.isGuestModerator ? (
                  <div>
                    <select
                      value={formData.moderatorUserId || ''}
                      onChange={(e) => handleSelectMember(e.target.value, false)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case bg-white"
                    >
                      <option value="">-- Select Member Anchor (e.g. Naffy) --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.lkid ? `(${m.lkid})` : ''} — {m.chapter || 'Kin'}
                        </option>
                      ))}
                    </select>

                    {formData.moderatorName && (
                      <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#c96a42]/20">
                        <div className="flex items-center gap-2">
                          {formData.moderatorAvatarUrl ? (
                            <img
                              src={formData.moderatorAvatarUrl}
                              alt="Anchor"
                              className="w-7 h-7 rounded-full object-cover border border-[#c96a42]/30 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#20070e] text-[#FBF7EE] flex items-center justify-center font-bold text-xs shrink-0">
                              {formData.moderatorName?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-xs text-[#20070e] block normal-case">
                              {formData.moderatorName}
                            </span>
                            <span className="text-[10px] text-[#120308]/50 font-mono">
                              {formData.moderatorLkid || 'Paper Thoughts Kin'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Assigned Anchor
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block mb-1 text-[10px] text-black/60">Guest Host Full Name</label>
                      <input
                        type="text"
                        value={formData.moderatorName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, moderatorName: e.target.value, moderatorUserId: '' }))}
                        placeholder="e.g. Chimamanda Ngozi Adichie"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] text-black/60">Photo URL (Optional)</label>
                      <input
                        type="url"
                        value={formData.moderatorAvatarUrl || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, moderatorAvatarUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-[11px] font-mono normal-case bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] text-black/60">Bio / Credentials (Optional)</label>
                      <textarea
                        rows={2}
                        value={formData.moderatorBio || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, moderatorBio: e.target.value }))}
                        placeholder="Short guest bio..."
                        className="w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case font-serif bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Anchor Bounty Configuration */}
                <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#20070e] block">Anchor Leaves Bounty 🌿</span>
                    <span className="text-[9px] text-[#120308]/60 normal-case font-serif block">
                      Awarded to anchor upon event conclusion
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={formData.moderatorLeavesBounty ?? 50}
                      onChange={(e) => setFormData(prev => ({ ...prev, moderatorLeavesBounty: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1.5 rounded-lg border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs font-mono font-bold text-center bg-white"
                    />
                    <span className="text-[10px] font-bold text-[#c96a42]">Leaves</span>
                  </div>
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
