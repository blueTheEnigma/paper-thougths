"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Wifi, WifiOff, Save, CheckCircle, AlertTriangle, 
  Send, RefreshCw, BookOpen, Trash2, Check, Feather, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const DB_NAME = 'paper-thoughts-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Poetry',
  'Drama',
  'Sci-Fi',
  'Fantasy',
  'Mystery',
  'Memoir',
  'Other'
];

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('Window undefined');
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Helper to retrieve draft by mode ('story' or 'poem')
async function getSavedDraft(mode) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`draft-${mode}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get draft from IndexedDB:', err);
    return null;
  }
}

// Helper to save draft by mode
async function saveDraftToDB(mode, draftData) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: `draft-${mode}`, ...draftData, updatedAt: new Date() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save draft to IndexedDB:', err);
  }
}

// Helper to delete draft by mode
async function deleteDraftFromDB(mode) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(`draft-${mode}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete draft from IndexedDB:', err);
  }
}

export default function WriteClient({ storyPrompt, storyPromptId, poemPrompt, poemPromptId }) {
  const [writingMode, setWritingMode] = useState('story'); // 'story' or 'poem'
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [logline, setLogline] = useState('');
  const [bodyText, setBodyText] = useState('');
  
  const [isOnline, setIsOnline] = useState(true);
  const [saveStatus, setSaveStatus] = useState('All changes saved locally');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPendingSync, setIsPendingSync] = useState(false);
  const [showOfflineBadge, setShowOfflineBadge] = useState(false);

  const saveTimeoutRef = useRef(null);

  // 1. Initialize Network Status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setShowOfflineBadge(false);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowOfflineBadge(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 2. Parse URL parameters (e.g. from landing page buttons)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      if (type === 'poem') {
        setWritingMode('poem');
        setGenre('Poetry');
      } else if (type === 'story') {
        setWritingMode('story');
        setGenre('Fiction');
      }
    }
  }, []);

  // 3. Load draft from IndexedDB when writingMode changes
  useEffect(() => {
    let active = true;
    getSavedDraft(writingMode).then((draft) => {
      if (active) {
        if (draft) {
          setTitle(draft.title || '');
          setGenre(draft.genre || (writingMode === 'poem' ? 'Poetry' : 'Fiction'));
          setLogline(draft.logline || '');
          setBodyText(draft.bodyText || '');
          setIsPendingSync(!!draft.pendingSync);
          if (draft.updatedAt) {
            setLastSaved(new Date(draft.updatedAt));
          }
          setSaveStatus('Draft loaded from browser storage');
        } else {
          // Reset form fields for new draft
          setTitle('');
          setGenre(writingMode === 'poem' ? 'Poetry' : 'Fiction');
          setLogline('');
          setBodyText('');
          setIsPendingSync(false);
          setLastSaved(null);
          setSaveStatus('Ready to write');
        }
      }
    });

    return () => {
      active = false;
    };
  }, [writingMode]);

  // 4. Auto-save Draft to IndexedDB whenever user types
  useEffect(() => {
    // Skip saving if all fields are empty (e.g. during mode toggle or initial load)
    const defaultGenre = writingMode === 'poem' ? 'Poetry' : 'Fiction';
    if (!title && !logline && !bodyText && genre === defaultGenre) return;

    setSaveStatus('Saving draft locally...');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const draftData = { title, genre, logline, bodyText, pendingSync: isPendingSync };
      saveDraftToDB(writingMode, draftData).then(() => {
        const now = new Date();
        setLastSaved(now);
        setSaveStatus(`Draft saved locally at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      });
    }, 1000); // Debounce saves by 1 second

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, genre, logline, bodyText, isPendingSync, writingMode]);

  // 6. Submission Handler
  const handleSyncDraft = useCallback(async () => {
    setErrorMessage(null);
    setIsSyncing(true);

    if (!title.trim() || !logline.trim() || !bodyText.trim()) {
      setErrorMessage('All fields (Title, Genre, Teaser, and Manuscript body) are required to submit.');
      setIsSyncing(false);
      return;
    }

    const submissionData = { title, genre, logline, bodyText };

    // If user is currently offline, queue the draft to be synced automatically later
    if (!navigator.onLine) {
      setIsPendingSync(true);
      await saveDraftToDB(writingMode, { ...submissionData, pendingSync: true });
      setIsSyncing(false);
      alert('You are currently offline. Your manuscript has been saved as a pending upload, and will automatically synchronize with the clubhouse once your network connection is restored!');
      return;
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const data = await res.json();
      if (data.success) {
        // Success: Trigger confetti, delete draft from IndexedDB, and reset state
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        await deleteDraftFromDB(writingMode);
        setIsPendingSync(false);
        setTitle('');
        setGenre(writingMode === 'poem' ? 'Poetry' : 'Fiction');
        setLogline('');
        setBodyText('');
        setLastSaved(null);
        setSaveStatus('All changes saved locally');
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.error || 'Failed to submit manuscript to the clubhouse.');
      }
    } catch (err) {
      setErrorMessage('A network error occurred while submitting. Your draft remains safely saved locally.');
    } finally {
      setIsSyncing(false);
    }
  }, [title, genre, logline, bodyText, writingMode]);

  // 5. Automatic sync dispatcher when network goes back online
  useEffect(() => {
    if (isOnline && isPendingSync) {
      console.log('Network online. Triggering automatic draft synchronization.');
      handleSyncDraft();
    }
  }, [isOnline, isPendingSync, handleSyncDraft]);

  // 7. Delete local draft draft entirely
  const handleDeleteDraft = async () => {
    if (window.confirm('Are you sure you want to delete your current local draft? This action cannot be undone.')) {
      await deleteDraftFromDB(writingMode);
      setTitle('');
      setGenre(writingMode === 'poem' ? 'Poetry' : 'Fiction');
      setLogline('');
      setBodyText('');
      setLastSaved(null);
      setIsPendingSync(false);
      setSaveStatus('Draft deleted successfully');
    }
  };

  const wordCount = bodyText.trim() === '' ? 0 : bodyText.trim().split(/\s+/).length;
  const activePromptText = writingMode === 'poem' ? poemPrompt : storyPrompt;

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Breadcrumbs & Sync Banner */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/village" className="flex items-center gap-1.5 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors">
              <ArrowLeft size={16} /> Back to Writers' Village
            </Link>
            <h1 className="text-3xl sm:text-5xl font-display text-burgundy mt-2">Writing Workspace</h1>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between bg-white border border-sage/20 px-4 py-2.5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                {isOnline ? 'Clubhouse Connected' : 'Offline Workspace'}
              </span>
            </div>
            <div className="text-ink/30 font-mono text-[10px]">|</div>
            <div className="flex items-center gap-1.5 text-xs text-ink/60 font-medium">
              <Save size={13} className="text-sage" />
              <span>{saveStatus}</span>
            </div>
          </div>
        </div>

        {/* Toggle Mode Selector */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-sage/20 shadow-sm max-w-sm mb-8">
          <button
            onClick={() => setWritingMode('story')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              writingMode === 'story'
                ? 'bg-burgundy text-cream shadow-sm'
                : 'text-ink/60 hover:text-burgundy hover:bg-burgundy/5'
            }`}
          >
            <Feather size={14} /> Story Mode
          </button>
          <button
            onClick={() => setWritingMode('poem')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              writingMode === 'poem'
                ? 'bg-accent text-burgundy shadow-sm'
                : 'text-ink/60 hover:text-accent hover:bg-accent/5'
            }`}
          >
            <Sparkles size={14} /> Poetry Mode
          </button>
        </div>

        {errorMessage && (
          <div className="bg-burgundy/5 border border-burgundy/15 p-4 rounded-2xl flex items-center gap-3 text-xs text-burgundy font-medium mb-6">
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isPendingSync && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 font-bold mb-6">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              <span>You have a pending draft. It will automatically upload as soon as you reconnect to the internet.</span>
            </div>
            {isOnline && (
              <button 
                onClick={handleSyncDraft} 
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        )}

        {/* Master Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Prompt & Story Details */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Weekly Prompt Card */}
            <div className="bg-white p-6 rounded-[32px] border border-sage/20 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-burgundy/5 rounded-full blur-xl"></div>
              <h3 className="font-display text-lg text-burgundy mb-3 flex items-center gap-2">
                <BookOpen size={18} className="text-sage" /> {writingMode === 'poem' ? 'Weekly Poetry Prompt' : 'Weekly Story Prompt'}
              </h3>
              <p className="text-xs text-ink/75 leading-relaxed bg-cream/30 border border-sage/10 p-4 rounded-2xl italic whitespace-pre-wrap font-serif">
                "{activePromptText}"
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                <span>Cycle Drop: Saturday 12:00 AM</span>
              </div>
            </div>

            {/* Submission Form Metadata */}
            <div className="bg-white p-6 rounded-[32px] border border-sage/20 shadow-md space-y-4">
              <h3 className="font-bold text-ink text-sm">Manuscript Information</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={writingMode === 'poem' ? "The Sound of Rain..." : "The Name of the Wind..."}
                  className="w-full bg-cream/20 border border-sage/25 rounded-xl py-2.5 px-3 focus:outline-none focus:border-burgundy text-xs font-bold text-ink placeholder-ink/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-white border border-sage/25 rounded-xl py-2.5 px-3 focus:outline-none focus:border-burgundy text-xs font-bold text-burgundy"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Teaser</label>
                  <span className={`text-[9px] font-bold ${logline.length > 200 ? 'text-burgundy' : 'text-ink/40'}`}>
                    {logline.length} / 200 chars
                  </span>
                </div>
                <textarea 
                  value={logline}
                  maxLength={200}
                  onChange={(e) => setLogline(e.target.value)}
                  placeholder={writingMode === 'poem' ? "A brief description of the themes, tone, and poetic devices in your weekly poem..." : "A short, one-sentence elevator pitch describing the hook and stakes of your weekly story..."}
                  rows={3}
                  className="w-full bg-cream/20 border border-sage/25 rounded-xl p-3 focus:outline-none focus:border-burgundy text-xs text-ink placeholder-ink/30 resize-none leading-relaxed"
                />
              </div>

              {/* Actions Grid */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteDraft}
                  disabled={!title && !logline && !bodyText}
                  className="flex-1 bg-sage/5 hover:bg-burgundy/10 text-ink/60 hover:text-burgundy border border-sage/20 hover:border-burgundy/20 rounded-xl py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 size={13} /> Clear Draft
                </button>
              </div>
            </div>

            {/* Clubhouse Rules / Guide */}
            <div className="bg-sage/10 border border-sage/20 p-5 rounded-[24px] text-xs text-ink/80 space-y-2">
              <h4 className="font-bold text-burgundy uppercase tracking-wider text-[10px]">Submission Guidelines</h4>
              <p className="leading-relaxed">All submissions uploaded are completely hidden and stored in double-blind encryption until the <strong>Saturday 12:00 AM</strong> batch transition, where they are randomized into the critique queue.</p>
              <p className="leading-relaxed font-bold">Ensure your manuscript is original and conforms to the weekly prompt structure. Happy writing!</p>
            </div>
          </div>

          {/* RIGHT COLUMN: Manuscript Editor */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Editor Body Box */}
            <div className="bg-[#FAF7F0] border-2 border-[#EADFC9] rounded-[36px] shadow-2xl p-6 sm:p-8 relative min-h-[500px] flex flex-col justify-between">
              {/* Paper Lines background texture overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:100%_2rem] pointer-events-none rounded-[36px] mt-24"></div>
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-[#E3D4B6] pb-4">
                  <span className="font-display font-semibold text-[#8B7355] text-sm italic">
                    {writingMode === 'poem' ? 'Manuscript Paper — Poetry' : 'Manuscript Paper — Prose'}
                  </span>
                  <span className="font-mono text-xs text-[#8B7355] font-bold bg-[#EADFC9]/40 py-1 px-3 rounded-full">
                    {wordCount} words / {bodyText.length} chars
                  </span>
                </div>
                
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder={writingMode === 'poem' ? "Write your poem here...\nUse line breaks and stanzas to format your verses." : "Enter the body of your weekly manuscript here..."}
                  className="w-full flex-1 bg-transparent border-none outline-none focus:ring-0 text-base leading-8 text-ink font-serif placeholder-[#8B7355]/40 resize-none min-h-[380px]"
                  style={{ backgroundImage: 'none' }}
                />
              </div>

              {/* Submit Button Section */}
              <div className="relative z-10 border-t-2 border-dashed border-[#E3D4B6] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">
                  * Submission Gate closes Friday 11:59 PM
                </span>
                
                <button
                  onClick={handleSyncDraft}
                  disabled={isSyncing}
                  className="bg-burgundy hover:bg-ink text-cream font-bold text-xs py-3 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Synchronizing...
                    </>
                  ) : (
                    <>
                      <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> 
                      {isPendingSync ? 'Retry Clubhouse Upload' : 'Submit to Saturday Batch'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white p-8 rounded-[36px] max-w-md w-full border border-sage/20 shadow-2xl text-center space-y-6"
              >
                <div className="mx-auto bg-green-50 text-green-600 p-4 rounded-full w-16 h-16 flex items-center justify-center border border-green-200">
                  <CheckCircle size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl text-burgundy">Manuscript Synced!</h3>
                  <p className="text-xs text-ink/65 leading-relaxed">
                    Your weekly prompt submission has been successfully uploaded and queued in the database. It will reveal inside the double-blind critique queue starting this Saturday at 12:00 AM!
                  </p>
                </div>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-burgundy hover:bg-ink text-cream font-bold text-xs py-3.5 rounded-xl transition-all shadow-md"
                >
                  Return to Workspace
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
