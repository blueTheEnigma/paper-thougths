"use client";
import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Loader2, CheckCircle2, ShieldCheck, MapPin, KeyRound, 
  CalendarDays, Crown, Award, Users, Camera, Upload, ArrowRight, Sparkles, MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

function CheckinFormContent() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);

  const [gatherings, setGatherings] = useState([]);
  const [isLoadingGatherings, setIsLoadingGatherings] = useState(true);
  const [selectedGathering, setSelectedGathering] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Form Fields
  const [lkid, setLkid] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [isFirstArrival, setIsFirstArrival] = useState(false);
  const [isGroupArrival, setIsGroupArrival] = useState(false);
  const [groupCompanions, setGroupCompanions] = useState("");
  const [photoProofBase64, setPhotoProofBase64] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  // Auto-detect URL parameters
  useEffect(() => {
    async function loadGatherings() {
      try {
        const res = await fetch('/api/gatherings');
        const data = await res.json();
        if (data.success && data.gatherings && data.gatherings.length > 0) {
          setGatherings(data.gatherings);
          
          const paramId = searchParams.get('gatheringId');
          const paramToken = searchParams.get('magicToken');
          const paramCode = searchParams.get('code');
          const paramEvent = searchParams.get('event');

          let matched = null;
          if (paramId) {
            matched = data.gatherings.find(g => String(g.id) === paramId);
          } else if (paramToken) {
            matched = data.gatherings.find(g => g.magicToken?.toUpperCase() === paramToken.toUpperCase());
          } else if (paramCode) {
            matched = data.gatherings.find(g => g.gateCode === paramCode);
          } else if (paramEvent) {
            matched = data.gatherings.find(g => g.title === paramEvent);
          }

          if (matched) {
            setSelectedGathering(matched);
            if (paramCode) setGateCode(paramCode);
          } else {
            setSelectedGathering(data.gatherings[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gatherings for checkin:", err);
      } finally {
        setIsLoadingGatherings(false);
      }
    }
    loadGatherings();
  }, [searchParams]);

  // Image compressor for WhatsApp screenshot proof
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

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
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoProofBase64(compressedBase64);
        setPhotoPreview(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerLaurelCelebration = () => {
    const end = Date.now() + 3500;
    const colors = ['#c96a42', '#20070e', '#F2A98A', '#e6c594'];
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.8 },
        colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.8 },
        colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!selectedGathering) {
      setError("Please select a gathering.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      gateCode: gateCode.trim() || undefined,
      lkId: lkid.trim() || undefined,
      isGroupArrival,
      groupCompanions: isGroupArrival ? groupCompanions.split(',').map(s => s.trim()) : [],
      photoProof: photoProofBase64 || undefined
    };

    try {
      const res = await fetch(`/api/gatherings/${selectedGathering.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessData(data);
        setIsSuccess(true);
        triggerLaurelCelebration();
      } else {
        setError(data.error || "Unable to complete check-in.");
      }
    } catch {
      setError("Network error connecting to Sanctuary records.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && successData) {
    const isPhysical = selectedGathering?.gatheringType === 'physical';

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto text-center py-8 px-4 sm:px-6"
      >
        <div className="w-20 h-20 bg-[#20070e]/8 border border-[#c96a42]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          {successData.isCoronaMuralis ? (
            <Crown size={40} className="text-[#c96a42]" />
          ) : (
            <CheckCircle2 size={42} className="text-[#c96a42]" />
          )}
        </div>

        <h2 className="text-4xl sm:text-5xl font-display text-[#20070e] mb-2">
          {successData.isCoronaMuralis ? "Corona Muralis Claimed!" : "Inscribed in the Lines!"}
        </h2>
        
        <p className="text-sm sm:text-base text-[#120308]/75 mb-6 font-serif italic max-w-md mx-auto">
          {successData.honorTitle} — {selectedGathering?.title}
        </p>

        {/* Laurel / Leaves Award Box */}
        <div className="bg-white border border-[#20070e]/10 rounded-3xl p-6 sm:p-8 shadow-xl mb-6 text-left">
          <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#120308]/40 block">Arrival Sequence</span>
              <span className="text-2xl font-bold font-display text-[#20070e]">Rank #{successData.arrivalOrder}</span>
            </div>
            {successData.leavesAwarded > 0 && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c96a42] block">Laurel Bestowed</span>
                <span className="text-xl font-bold text-[#c96a42]">+{successData.leavesAwarded} Leaves</span>
              </div>
            )}
          </div>

          {/* Physical Host QR Gate Screen for Subsequent Arrivals */}
          {isPhysical && successData.isCoronaMuralis && (
            <div className="mt-4 p-5 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/30 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#20070e] block mb-2">
                🏛️ You Hold the Rampart
              </span>
              <p className="text-xs text-[#120308]/70 mb-4 font-serif">
                Display this gate code to kindred spirits arriving after you:
              </p>
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-[#c96a42] shadow-sm mb-2">
                <span className="text-4xl font-mono font-bold tracking-widest text-[#20070e]">
                  {successData.gateCode || selectedGathering?.gateCode}
                </span>
              </div>
              <p className="text-[11px] text-[#120308]/50 block">Venue Gate Code: {successData.gateCode || selectedGathering?.gateCode}</p>
            </div>
          )}

          {/* Top 5 Vanguard Live Roll */}
          {successData.topVanguard && successData.topVanguard.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20070e] block mb-2.5 flex items-center gap-1.5">
                <Award size={14} className="text-[#c96a42]" /> Punctual Vanguard of this Gathering
              </span>
              <div className="space-y-1.5">
                {successData.topVanguard.map((vg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-black/3">
                    <span className="font-semibold text-[#120308]/80">
                      {vg.arrivalOrder}. {vg.name} {vg.isCoronaMuralis && '👑'} {vg.isCoVanguard && '🤝'}
                    </span>
                    <span className="font-mono text-[10px] text-[#c96a42] font-bold">
                      {vg.leavesAwarded > 0 ? `+${vg.leavesAwarded} Leaves` : 'Verified'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            setIsSuccess(false);
            setSuccessData(null);
          }}
          className="text-[#120308]/50 font-bold uppercase tracking-widest text-xs hover:text-[#20070e] transition-colors"
        >
          ← Check In Another Member
        </button>
      </motion.div>
    );
  }

  const isPhysical = selectedGathering?.gatheringType === 'physical';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-[36px] border border-black/8 shadow-xl relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2 text-[#c96a42]">
        <ShieldCheck size={18} />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#120308]/50">Sanctuary Gate</span>
      </div>
      
      <h1 className="text-3xl sm:text-4xl font-display text-[#20070e] mb-1">
        Log Gathering Attendance
      </h1>
      <p className="text-xs text-[#120308]/60 font-serif mb-6 leading-relaxed">
        Punctual kin are crowned at the wall. The first arrival takes the Corona Muralis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Gathering Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#120308]/80 flex items-center gap-2">
            <CalendarDays size={14} className="text-[#c96a42]" /> Selected Gathering
          </label>
          {isLoadingGatherings ? (
            <div className="flex items-center gap-2 py-3 text-sm text-[#120308]/40">
              <Loader2 className="animate-spin" size={16} /> Fetching active gatherings...
            </div>
          ) : gatherings.length === 0 ? (
            <div className="py-3 text-red-600 font-bold text-xs">No active gatherings found.</div>
          ) : (
            <select 
              className="w-full bg-[#FBF7EE] border border-black/10 rounded-2xl px-4 py-3 text-sm font-bold text-[#20070e] focus:outline-none focus:border-[#c96a42]"
              value={selectedGathering?.id || ""}
              onChange={(e) => {
                const matched = gatherings.find(g => String(g.id) === e.target.value);
                if (matched) setSelectedGathering(matched);
              }}
            >
              {gatherings.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.eventDate} • {g.venueName || 'Virtual'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Lore Keeper ID or Handle */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#120308]/80 flex items-center gap-2">
            <QrCode size={14} className="text-[#c96a42]" /> Lore Keeper ID or Email
          </label>
          <input 
            type="text" 
            required 
            value={lkid}
            onChange={(e) => setLkid(e.target.value)}
            placeholder="e.g. LK-2026-0042 or email"
            className="w-full px-4 py-3 rounded-2xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-sm font-mono uppercase"
          />
        </div>

        {/* Venue Gate Code (For physical gatherings or passcode-protected calls) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#120308]/80 flex items-center gap-2">
            <KeyRound size={14} className="text-[#c96a42]" /> 
            {isPhysical ? "4-Digit Venue Code (from First Man screen)" : "Session Gate Code (Optional)"}
          </label>
          <input 
            type="text" 
            value={gateCode}
            onChange={(e) => setGateCode(e.target.value)}
            placeholder={isPhysical ? "e.g. 2015" : "Enter code if announced"}
            className="w-full px-4 py-3 rounded-2xl border border-black/10 focus:border-[#c96a42] focus:outline-none text-sm font-mono tracking-widest"
          />
        </div>

        {/* Physical Gathering First Arrival & Co-Vanguard Controls */}
        {isPhysical && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF7EE] border border-[#c96a42]/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20070e] flex items-center gap-1.5">
                <Crown size={14} className="text-[#c96a42]" /> Physical Venue Arrival Ceremony
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-[#c96a42] cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isFirstArrival}
                  onChange={(e) => setIsFirstArrival(e.target.checked)}
                  className="rounded text-[#c96a42] focus:ring-[#c96a42]"
                />
                I am First at the Venue
              </label>
            </div>

            {isFirstArrival && (
              <div className="space-y-3 pt-2 border-t border-black/5 text-xs text-[#120308]/75 font-serif">
                <p>
                  To secure the <strong>Corona Muralis</strong>:
                  <br />1. Take a photo of the venue table.
                  <br />2. Post it to your <strong>Chapter WhatsApp Group</strong> announcing your arrival!
                  <br />3. Upload a screenshot of that WhatsApp message below:
                </p>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#c96a42]/40 rounded-xl p-4 text-center cursor-pointer hover:bg-white transition-colors"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                  {photoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={photoPreview} alt="WhatsApp Proof" className="max-h-32 rounded-lg shadow-sm" />
                      <span className="text-[11px] font-bold text-[#c96a42]">✓ WhatsApp Proof Attached (Click to change)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#120308]/60">
                      <Upload size={20} className="text-[#c96a42]" />
                      <span className="font-bold text-xs text-[#20070e]">Upload WhatsApp Screenshot Proof</span>
                      <span className="text-[10px]">Photo with timestamp from the group chat</span>
                    </div>
                  )}
                </div>

                {/* Co-Vanguard Group Option */}
                <div className="pt-2 border-t border-black/5">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#20070e] cursor-pointer mb-2">
                    <input 
                      type="checkbox"
                      checked={isGroupArrival}
                      onChange={(e) => setIsGroupArrival(e.target.checked)}
                      className="rounded text-[#c96a42]"
                    />
                    🤝 We Arrived Together as a Guild / Group (Co-Vanguard)
                  </label>
                  {isGroupArrival && (
                    <input 
                      type="text" 
                      value={groupCompanions}
                      onChange={(e) => setGroupCompanions(e.target.value)}
                      placeholder="List companions: e.g. Tunde, Amaka, Kelechi"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs font-sans"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting || gatherings.length === 0}
          className="w-full bg-[#20070e] text-[#FBF7EE] font-bold py-4 rounded-2xl hover:bg-[#120308] transition-all shadow-md flex justify-center items-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Sparkles size={16} className="text-[#F2A98A]" />
              Inscribe Attendance
            </>
          )}
        </button>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 p-3.5 rounded-xl border border-red-200">
            <p className="text-red-700 text-center font-bold text-xs">{error}</p>
          </motion.div>
        )}
      </form>

      <div className="mt-8 text-center border-t border-black/5 pt-4">
        <a href="/lookup" className="text-[11px] text-[#120308]/50 hover:text-[#c96a42] font-bold uppercase tracking-wider transition-colors">
          Forgot your LK-ID? Search the Codex Directory →
        </a>
      </div>
    </motion.div>
  );
}

export default function CheckinPage() {
  return (
    <main className="min-h-screen bg-[#FBF7EE] selection:bg-[#F2A98A]/30 flex items-center justify-center py-12 px-4 sm:px-6">
      <Suspense fallback={<Loader2 className="animate-spin text-[#c96a42]" size={40} />}>
        <CheckinFormContent />
      </Suspense>
    </main>
  );
}
