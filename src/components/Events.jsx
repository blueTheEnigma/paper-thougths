"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, ExternalLink, Award, Sparkles, 
  Users, CheckCircle2, Loader2, Radio, QrCode, X, BookOpen, MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Events({ initialEvents = [] }) {
  const [gatherings, setGatherings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [rsvpLoadingId, setRsvpLoadingId] = useState(null);
  const [modalGathering, setModalGathering] = useState(null); // For guest RSVP modal
  const [guestFormData, setGuestFormData] = useState({ name: '', email: '', whatsapp: '', lkId: '' });
  const [toastMessage, setToastMessage] = useState(null);

  const fetchGatherings = async () => {
    try {
      const res = await fetch('/api/gatherings');
      const data = await res.json();
      if (data.success && data.gatherings) {
        setGatherings(data.gatherings);
      } else {
        // Fallback to legacy events if gatherings empty
        const legacyRes = await fetch('/api/events');
        const legacyData = await legacyRes.json();
        if (legacyData.success && legacyData.events) {
          setGatherings(legacyData.events.map((e, idx) => ({
            id: idx + 1,
            title: e.name,
            gatheringType: e.type || 'townhall',
            eventDate: e.date,
            startTime: e.time,
            venueName: e.location,
            description: e.description,
            meetUrl: e.rsvpLink,
            coverUrl: idx % 2 === 0 ? '/images/gatherings/townhall.jpg' : '/images/gatherings/book_banter.jpg',
            status: 'published',
            rsvpCount: 0,
            hasRsvped: false
          })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch gatherings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatherings();
  }, []);

  const triggerLaurelConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ['#c96a42', '#20070e', '#F2A98A', '#e6c594'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleRsvp = async (gathering) => {
    setRsvpLoadingId(gathering.id);
    try {
      const res = await fetch(`/api/gatherings/${gathering.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestFormData)
      });
      const data = await res.json();

      if (data.success) {
        if (data.isFirstHerald) {
          triggerLaurelConfetti();
          setToastMessage({
            title: "📯 THE FIRST HERALD!",
            description: "You were the first to pledge attendance! +15 Leaves have been inscribed into your ledger.",
            type: "herald"
          });
        } else {
          setToastMessage({
            title: "✦ Attendance Pledged",
            description: data.message || "Your seat at the table is reserved.",
            type: "success"
          });
        }
        setModalGathering(null);
        setGuestFormData({ name: '', email: '', whatsapp: '', lkId: '' });
        await fetchGatherings();
      } else {
        // If error suggests guest needs to provide info
        if (data.error && data.error.includes('Unauthorized')) {
          setModalGathering(gathering);
        } else {
          setToastMessage({ title: "RSVP Notice", description: data.error || "Unable to complete RSVP", type: "error" });
        }
      }
    } catch {
      setToastMessage({ title: "Connection Error", description: "Could not reach the Sanctuary servers", type: "error" });
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const filteredGatherings = gatherings.filter(g => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'townhall') return g.gatheringType === 'townhall';
    if (activeFilter === 'book_banter') return g.gatheringType === 'book_banter';
    if (activeFilter === 'botm_review') return g.gatheringType === 'botm_review';
    if (activeFilter === 'physical') return g.gatheringType === 'physical';
    return true;
  });

  const getDefaultCover = (type) => {
    if (type === 'townhall') return '/images/gatherings/townhall.jpg';
    if (type === 'book_banter') return '/images/gatherings/book_banter.jpg';
    if (type === 'botm_review') return '/images/gatherings/botm_review.jpg';
    return '/images/gatherings/townhall.jpg';
  };

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatEventTime = (timeStr) => {
    if (!timeStr) return '8:15 PM';
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        let hour = parseInt(parts[0], 10);
        const minute = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${hour}:${minute} ${ampm}`;
      }
    } catch {
      // Fallback
    }
    return timeStr;
  };

  return (
    <section id="events" className="w-full px-3 sm:px-6 pb-20 md:pb-28 bg-[#FBF7EE] min-h-[75vh] overflow-x-hidden selection:bg-[#F2A98A]/30">
      <div className="max-w-5xl mx-auto flex flex-col items-center">

        {/* Page Header */}
        <div className="w-full text-center mt-4 sm:mt-6 mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#20070e]/5 border border-[#20070e]/10 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#c96a42] mb-2 sm:mb-3">
            <Sparkles size={12} className="text-[#c96a42]" />
            Sanctuary Gatherings & Townhalls
          </div>
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-display text-[#20070e] mb-2 sm:mb-3 leading-tight tracking-tight">
            Upcoming Gatherings
          </h1>
          <p className="text-xs sm:text-base md:text-lg text-[#120308]/75 font-serif italic max-w-2xl mx-auto leading-relaxed px-2">
            Every Thursday at 8:15 PM WAT on Google Meet. Twice-monthly Sunday Book Banter on X Spaces at 3:00 PM. 
            The first to scale the wall claims the <span className="font-semibold text-[#c96a42]">Corona Muralis</span>.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-5 sm:mt-7">
            {[
              { id: 'all', label: 'All' },
              { id: 'townhall', label: 'Townhall (Thu 8:15 PM)' },
              { id: 'book_banter', label: 'Book Banter (Sun 3 PM)' },
              { id: 'botm_review', label: 'BOTM Review' },
              { id: 'physical', label: 'Chapters' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`text-[10px] sm:text-xs font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full transition-all duration-200 ${
                  activeFilter === tab.id
                    ? 'bg-[#20070e] text-[#FBF7EE] shadow-sm'
                    : 'bg-white/80 text-[#120308]/60 hover:text-[#20070e] border border-black/5 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Responsive Grid (Tiles of 2 on Mobile & Desktop) */}
        <div className="w-full grid grid-cols-2 gap-3 sm:gap-6 md:gap-7">
          {loading ? (
            [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl sm:rounded-3xl border border-black/5 overflow-hidden flex flex-col animate-pulse shadow-xs"
              >
                <div className="w-full aspect-[16/9] bg-black/5"></div>
                <div className="p-3 sm:p-5 space-y-2">
                  <div className="w-20 h-3 bg-black/5 rounded"></div>
                  <div className="w-3/4 h-5 bg-[#20070e]/10 rounded"></div>
                  <div className="w-1/2 h-3 bg-black/5 rounded"></div>
                  <div className="w-full h-8 bg-black/5 rounded-xl mt-3"></div>
                </div>
              </div>
            ))
          ) : filteredGatherings.length > 0 ? (
            filteredGatherings.map((gathering, index) => {
              const isLive = gathering.status === 'live';
              const isTownhall = gathering.gatheringType === 'townhall';
              const isXSpaces = gathering.gatheringType === 'book_banter';
              const isBotm = gathering.gatheringType === 'botm_review';
              const coverImg = gathering.coverUrl || getDefaultCover(gathering.gatheringType);

              return (
                <motion.div
                  key={gathering.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className={`group relative rounded-2xl sm:rounded-3xl flex flex-col bg-white overflow-hidden transition-all duration-300 shadow-xs hover:shadow-xl ${
                    isLive 
                      ? 'border-2 border-[#c96a42] ring-3 ring-[#F2A98A]/30' 
                      : 'border border-black/8 hover:border-[#c96a42]/35'
                  }`}
                >
                  {/* Luma-Style Top Flyer / Banner */}
                  <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden relative bg-[#20070e]/5 border-b border-black/5">
                    <img
                      src={coverImg}
                      alt={gathering.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Shadow Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Event Type Pill */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-[#20070e]/85 text-[#FBF7EE] backdrop-blur-xs shadow-xs border border-white/10">
                      {isTownhall ? '🏛️ Townhall' : isXSpaces ? '🎙️ X Spaces' : isBotm ? '📖 BOTM' : '📍 Chapter'}
                    </div>

                    {/* Live Beacon Badge */}
                    {isLive && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white shadow-md animate-pulse flex items-center gap-1">
                        <Radio size={10} className="animate-spin" /> LIVE
                      </div>
                    )}

                    {/* First Herald Badge Pill on Image (Top Right if not live) */}
                    {!isLive && gathering.firstHeraldName && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-[#c96a42] text-white shadow-xs flex items-center gap-1">
                        <span>📯</span> Herald
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Date & Time Row */}
                      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#c96a42] mb-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatEventDate(gathering.eventDate)}
                        </span>
                        <span className="text-black/20">•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatEventTime(gathering.startTime)} WAT
                        </span>
                      </div>

                      {/* Gathering Title */}
                      <h2 className="text-xs sm:text-base md:text-lg font-display text-[#20070e] leading-snug line-clamp-2 mb-1 group-hover:text-[#c96a42] transition-colors">
                        {gathering.title}
                      </h2>

                      {/* Location / Medium */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-[#120308]/60 mb-2 truncate">
                        <MapPin size={11} className="text-[#c96a42] shrink-0" />
                        <span className="truncate">{gathering.venueName || (isXSpaces ? 'X Spaces' : 'Google Meet')}</span>
                        {gathering.chapterName && (
                          <span className="text-[#c96a42] font-bold">({gathering.chapterName})</span>
                        )}
                      </div>

                      {/* Description (Visible on larger mobile/desktop) */}
                      {gathering.description && (
                        <p className="text-[10px] sm:text-xs text-[#120308]/70 leading-relaxed font-serif line-clamp-2 mb-3 hidden sm:block">
                          {gathering.description}
                        </p>
                      )}

                      {/* First Herald Ribbon (Desktop & Mobile) */}
                      {gathering.firstHeraldName && (
                        <div className="mb-3 p-2 sm:p-2.5 rounded-xl bg-[#FBF7EE] border border-[#c96a42]/20 flex items-center justify-between gap-1 text-[9px] sm:text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs shrink-0">📯</span>
                            <div className="truncate">
                              <span className="font-bold text-[#20070e] block truncate">Herald: {gathering.firstHeraldName}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#c96a42]/10 text-[#c96a42] shrink-0">
                            +15L
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Stats & Action Bar */}
                    <div className="pt-2 sm:pt-3 border-t border-black/5 flex items-center justify-between gap-1.5 sm:gap-2 mt-auto">
                      <div className="text-[9px] sm:text-xs font-bold text-[#120308]/50 flex items-center gap-1 shrink-0">
                        <Users size={11} className="text-[#c96a42]" />
                        <span>{gathering.rsvpCount || 0}</span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        {isLive ? (
                          <a
                            href={`/checkin?gatheringId=${gathering.id}`}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#c96a42] text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 hover:bg-[#20070e] transition-colors shadow-xs"
                          >
                            <QrCode size={12} /> <span className="hidden xs:inline">Check In</span>
                          </a>
                        ) : gathering.hasRsvped ? (
                          <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-[#20070e]/8 text-[#20070e] font-bold text-[10px] sm:text-xs flex items-center gap-1 border border-[#20070e]/15">
                            <CheckCircle2 size={11} className="text-[#c96a42]" /> Pledged
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRsvp(gathering)}
                            disabled={rsvpLoadingId === gathering.id}
                            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#20070e] text-[#FBF7EE] font-bold text-[10px] sm:text-xs flex items-center gap-1 hover:bg-[#120308] transition-colors shadow-xs disabled:opacity-50"
                          >
                            {rsvpLoadingId === gathering.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>
                                <Award size={12} className="text-[#F2A98A]" />
                                <span>RSVP</span>
                              </>
                            )}
                          </button>
                        )}

                        {gathering.meetUrl && (
                          <a
                            href={gathering.meetUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Link"
                            className="p-1.5 sm:p-2 rounded-xl border border-black/10 hover:border-[#c96a42] text-[#120308]/60 hover:text-[#20070e] transition-colors shrink-0"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 bg-white/70 rounded-3xl border border-dashed border-black/10 p-6">
              <span className="text-3xl block mb-2">📖</span>
              <p className="text-[#120308]/50 font-serif italic text-sm">
                No gatherings found for this category.
              </p>
            </div>
          )}
        </div>

        {/* Guest RSVP Modal (Mounted cleanly) */}
        {modalGathering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border border-[#20070e]/10 shadow-2xl relative"
            >
              <button
                onClick={() => setModalGathering(null)}
                className="absolute top-4 right-4 text-[#120308]/40 hover:text-[#20070e]"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#c96a42] mb-1.5">
                <Sparkles size={13} /> Pledge Attendance
              </div>
              <h3 className="text-xl sm:text-2xl font-display text-[#20070e] mb-1">
                Reserve Your Seat
              </h3>
              <p className="text-[11px] sm:text-xs text-[#120308]/60 mb-5 font-serif leading-relaxed">
                Enter your details or Lore Keeper ID to claim your seat for <span className="font-bold text-[#20070e]">{modalGathering.title}</span>.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRsvp(modalGathering);
                }}
                className="space-y-3.5 text-xs font-bold uppercase tracking-wider"
              >
                <div>
                  <label className="block mb-1 text-[#120308]/70">Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestFormData.name}
                    onChange={(e) => setGuestFormData({ ...guestFormData, name: e.target.value })}
                    placeholder="e.g. Zainab Aliyu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[#120308]/70">Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestFormData.email}
                    onChange={(e) => setGuestFormData({ ...guestFormData, email: e.target.value })}
                    placeholder="zainab@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs normal-case"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[#120308]/70">Lore Keeper ID (Optional)</label>
                  <input
                    type="text"
                    value={guestFormData.lkId}
                    onChange={(e) => setGuestFormData({ ...guestFormData, lkId: e.target.value })}
                    placeholder="LK-2026-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-xs uppercase font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rsvpLoadingId === modalGathering.id}
                  className="w-full py-3 rounded-xl bg-[#20070e] text-[#FBF7EE] font-bold text-xs uppercase tracking-widest hover:bg-[#120308] transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {rsvpLoadingId === modalGathering.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>✦ Inscribe My Name</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#20070e] text-[#FBF7EE] p-4 rounded-2xl shadow-2xl border border-[#c96a42]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#F2A98A]">{toastMessage.title}</h4>
                  <p className="text-[11px] sm:text-xs text-[#FBF7EE]/80 mt-1 leading-relaxed font-serif">{toastMessage.description}</p>
                </div>
                <button onClick={() => setToastMessage(null)} className="text-[#FBF7EE]/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
