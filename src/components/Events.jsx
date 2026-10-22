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

  return (
    <section id="events" className="w-full px-4 sm:px-6 pb-20 md:pb-28 bg-[#FBF7EE] min-h-[75vh] overflow-x-hidden selection:bg-[#F2A98A]/30">
      <div className="max-w-5xl mx-auto flex flex-col items-center">

        {/* Page Header */}
        <div className="w-full text-center mt-6 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#20070e]/5 border border-[#20070e]/10 text-xs font-bold uppercase tracking-[0.2em] text-[#c96a42] mb-3">
            <Sparkles size={13} className="text-[#c96a42]" />
            Sanctuary Gatherings & Townhalls
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display text-[#20070e] mb-3 leading-tight tracking-tight">
            Upcoming Gatherings
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#120308]/75 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Every Thursday at 8:15 PM WAT on Google Meet. Twice-monthly Sunday Book Banter on X Spaces at 3:00 PM. 
            The first to scale the wall claims the <span className="font-semibold text-[#c96a42]">Corona Muralis</span>.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-6 sm:mt-8">
            {[
              { id: 'all', label: 'All Gatherings' },
              { id: 'townhall', label: 'Weekly Townhalls (Thu 8:15 PM)' },
              { id: 'book_banter', label: 'Book Banter (X Spaces 3 PM)' },
              { id: 'botm_review', label: 'BOTM Review' },
              { id: 'physical', label: 'Physical Chapters' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
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

        {/* Gatherings Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
          {loading ? (
            [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-black/5 p-6 flex flex-col animate-pulse shadow-sm"
              >
                <div className="w-24 h-4 bg-black/5 rounded mb-4"></div>
                <div className="w-3/4 h-7 bg-[#20070e]/10 rounded mb-2"></div>
                <div className="w-1/2 h-4 bg-black/5 rounded mb-6"></div>
                <div className="w-full h-12 bg-black/5 rounded-2xl mt-auto"></div>
              </div>
            ))
          ) : filteredGatherings.length > 0 ? (
            filteredGatherings.map((gathering, index) => {
              const isLive = gathering.status === 'live';
              const isTownhall = gathering.gatheringType === 'townhall';
              const isXSpaces = gathering.gatheringType === 'book_banter';
              const isBotm = gathering.gatheringType === 'botm_review';
              const isPhysical = gathering.gatheringType === 'physical';

              return (
                <motion.div
                  key={gathering.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                  className={`relative rounded-3xl p-6 sm:p-7 flex flex-col bg-white transition-all duration-300 shadow-sm hover:shadow-xl ${
                    isLive 
                      ? 'border-2 border-[#c96a42] ring-4 ring-[#F2A98A]/30' 
                      : 'border border-black/8 hover:border-[#c96a42]/30'
                  }`}
                >
                  {/* Live Status Badge */}
                  {isLive && (
                    <div className="absolute -top-3.5 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c96a42] text-white text-[11px] font-bold uppercase tracking-widest shadow-md animate-pulse">
                      <Radio size={12} className="animate-spin" />
                      Happening Now — Gathering Live
                    </div>
                  )}

                  {/* Header Row: Type, Date, Time */}
                  <div className={`flex items-center justify-between flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider mb-3 ${isLive ? 'mt-2' : ''}`}>
                    <div className="flex items-center gap-1.5 text-[#c96a42]">
                      <Calendar size={13} />
                      <span>{gathering.eventDate}</span>
                      <span className="text-black/20">•</span>
                      <Clock size={13} />
                      <span>{gathering.startTime?.substring(0, 5) || '8:15 PM'} WAT</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#20070e]/5 text-[#20070e]">
                      {isTownhall ? '🏛️ Townhall' : isXSpaces ? '🎙️ X Spaces' : isBotm ? '📖 BOTM Review' : '📍 Chapter'}
                    </span>
                  </div>

                  {/* Gathering Title */}
                  <h2 className="text-xl sm:text-2xl font-display text-[#20070e] leading-snug mb-1">
                    {gathering.title}
                  </h2>

                  {/* Location / Medium */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#120308]/55 mb-3">
                    <MapPin size={13} className="text-[#c96a42]" />
                    <span>{gathering.venueName || (isXSpaces ? 'X Spaces Live Audio' : 'Google Meet Sanctuary')}</span>
                    {gathering.chapterName && (
                      <span className="text-[#c96a42] font-bold">({gathering.chapterName})</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#120308]/75 leading-relaxed flex-1 mb-5 font-serif">
                    {gathering.description || 'Join the kindred circle for literary exploration, readings, and community council.'}
                  </p>

                  {/* The First Herald Spotlight Banner (if claimed) */}
                  {gathering.firstHeraldName && (
                    <div className="mb-4 p-3 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/20 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📯</span>
                        <div>
                          <span className="font-bold text-[#20070e] block">The First Herald</span>
                          <span className="text-[11px] text-[#120308]/60 font-mono">
                            {gathering.firstHeraldName} {gathering.firstHeraldLkId ? `(${gathering.firstHeraldLkId})` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#c96a42]/10 text-[#c96a42]">
                        +15 Leaves
                      </span>
                    </div>
                  )}

                  {/* Bottom Stats & CTAs */}
                  <div className="pt-3 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto">
                    <div className="flex items-center gap-3 text-xs font-bold text-[#120308]/50">
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-[#c96a42]" />
                        {gathering.rsvpCount || 0} Pledged
                      </span>
                      {gathering.attendanceCount > 0 && (
                        <span>• {gathering.attendanceCount} Arrived</span>
                      )}
                    </div>

                    <div className="w-full sm:w-auto flex items-center gap-2">
                      {isLive ? (
                        <a
                          href={`/checkin?gatheringId=${gathering.id}`}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#c96a42] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20070e] transition-colors shadow-md"
                        >
                          <QrCode size={14} /> Enter Sanctuary & Check In
                        </a>
                      ) : gathering.hasRsvped ? (
                        <div className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#20070e]/8 text-[#20070e] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#20070e]/15">
                          <CheckCircle2 size={14} className="text-[#c96a42]" /> Seat Pledged
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRsvp(gathering)}
                          disabled={rsvpLoadingId === gathering.id}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#20070e] text-[#FBF7EE] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#120308] transition-colors shadow-sm disabled:opacity-50"
                        >
                          {rsvpLoadingId === gathering.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Award size={14} className="text-[#F2A98A]" />
                              Pledge Attendance (RSVP)
                            </>
                          )}
                        </button>
                      )}

                      {gathering.meetUrl && (
                        <a
                          href={gathering.meetUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Gathering Link"
                          className="p-2.5 rounded-xl border border-black/10 hover:border-[#c96a42] text-[#120308]/70 hover:text-[#20070e] transition-colors flex items-center justify-center"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 sm:py-24 bg-white/70 rounded-3xl border border-dashed border-black/10 p-8">
              <span className="text-4xl block mb-3">📖</span>
              <p className="text-[#120308]/50 font-serif italic text-base mb-1">
                The grand ledger is quiet for this selection.
              </p>
              <p className="text-xs text-[#120308]/40">
                New gathering cards drop every weekend. Check back soon.
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
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#20070e]/10 shadow-2xl relative"
            >
              <button
                onClick={() => setModalGathering(null)}
                className="absolute top-5 right-5 text-[#120308]/40 hover:text-[#20070e]"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c96a42] mb-2">
                <Sparkles size={14} /> Pledge Attendance
              </div>
              <h3 className="text-2xl font-display text-[#20070e] mb-2">
                Reserve Your Seat
              </h3>
              <p className="text-xs text-[#120308]/60 mb-6 font-serif leading-relaxed">
                Enter your details or Lore Keeper ID to claim your seat for <span className="font-bold text-[#20070e]">{modalGathering.title}</span>.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRsvp(modalGathering);
                }}
                className="space-y-4 text-xs font-bold uppercase tracking-wider"
              >
                <div>
                  <label className="block mb-1 text-[#120308]/70">Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestFormData.name}
                    onChange={(e) => setGuestFormData({ ...guestFormData, name: e.target.value })}
                    placeholder="e.g. Zainab Aliyu"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-sm normal-case"
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
                    className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-sm normal-case"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[#120308]/70">Lore Keeper ID (Optional)</label>
                  <input
                    type="text"
                    value={guestFormData.lkId}
                    onChange={(e) => setGuestFormData({ ...guestFormData, lkId: e.target.value })}
                    placeholder="LK-2026-..."
                    className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-sm uppercase font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rsvpLoadingId === modalGathering.id}
                  className="w-full py-3.5 rounded-xl bg-[#20070e] text-[#FBF7EE] font-bold text-xs uppercase tracking-widest hover:bg-[#120308] transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {rsvpLoadingId === modalGathering.id ? (
                    <Loader2 size={16} className="animate-spin" />
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
              className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#20070e] text-[#FBF7EE] p-4 sm:p-5 rounded-2xl shadow-2xl border border-[#c96a42]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-[#F2A98A]">{toastMessage.title}</h4>
                  <p className="text-xs text-[#FBF7EE]/80 mt-1 leading-relaxed font-serif">{toastMessage.description}</p>
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
