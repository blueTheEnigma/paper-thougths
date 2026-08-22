"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Volume2, Sparkles, Compass, Clock, Search, 
  ExternalLink, Send, CheckCircle2, X, Music, Radio,
  Share2, Heart, Mic, ArrowRight, BookOpen
} from 'lucide-react';
import { FaSpotify, FaYoutube, FaInstagram, FaLink } from 'react-icons/fa6';
import { 
  PODCAST_SHOW, 
  PODCAST_CATEGORIES, 
  PODCAST_EPISODES, 
  ARCHETYPE_TAG_COLORS 
} from '@/lib/podcastsData';

export default function PodcastsGrid() {
  const [activeEpisode, setActiveEpisode] = useState(PODCAST_EPISODES[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Storyteller Submission
  const [formData, setFormData] = useState({
    podcastName: '',
    creatorName: '',
    spotifyLink: '',
    email: '',
    category: 'Short Stories',
    synopsis: ''
  });

  // Filtered Episodes
  const filteredEpisodes = useMemo(() => {
    return PODCAST_EPISODES.filter((episode) => {
      // Category filter
      let matchesCategory = true;
      if (selectedCategory === 'essential') {
        matchesCategory = episode.isEssential;
      } else if (selectedCategory !== 'all') {
        matchesCategory = episode.category === selectedCategory;
      }

      // Search query filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = 
          episode.title.toLowerCase().includes(q) ||
          episode.description.toLowerCase().includes(q) ||
          episode.tags.some(t => t.toLowerCase().includes(q)) ||
          episode.archetypes.some(a => a.toLowerCase().includes(q));
      }

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate lightweight async dispatch
    await new Promise(res => setTimeout(res, 900));
    setIsSubmitting(false);
    setSubmissionSuccess(true);
  };

  const resetModal = () => {
    setIsSubmitModalOpen(false);
    setSubmissionSuccess(false);
    setFormData({
      podcastName: '',
      creatorName: '',
      spotifyLink: '',
      email: '',
      category: 'Short Stories',
      synopsis: ''
    });
  };

  return (
    <div className="space-y-16 selection:bg-[#F2A98A]/30">
      
      {/* 1. ATMOSPHERIC HEADER */}
      <div className="text-center space-y-5 max-w-3xl mx-auto pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/30 text-[#F2A98A] text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-lg"
        >
          <Radio size={14} className="animate-pulse text-[#F2A98A]" />
          <span>Paper Thoughts Spoken Lore & Podcasts</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-cream tracking-tight leading-[1.1]"
        >
          Where Stories <span className="bg-gradient-to-r from-[#F2A98A] via-[#c96a42] to-[#FAF7F2] bg-clip-text text-transparent italic">Speak Aloud</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg font-serif italic text-cream/75 max-w-2xl mx-auto leading-relaxed"
        >
          "Life, literature, and the echoes between the lines — voiced for the wanderer, the dreamer, and the night owl."
        </motion.p>
      </div>

      {/* 2. GRAND HERO SPOTLIGHT (THE CURRENTLY PLAYING TALE) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative bg-gradient-to-b from-[#1c060d]/95 via-[#120308]/95 to-[#080104]/95 border border-[#F2A98A]/25 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden group"
      >
        {/* Atmospheric Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#c96a42]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#c96a42]/25 transition-all duration-700" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#5c1a2e]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Spotlight Metadata & Host Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top pill bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5c1a2e]/60 border border-[#F2A98A]/30 text-[#F2A98A] text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles size={13} />
                <span>Featured Show</span>
              </span>
              <span className="text-xs font-mono text-cream/50">
                • {activeEpisode.duration} • {activeEpisode.releaseDate}
              </span>
            </div>

            {/* Title & Host info */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-cream leading-tight">
                {activeEpisode.title}
              </h2>
              <p className="text-sm sm:text-base font-serif italic text-[#F2A98A]/90">
                {activeEpisode.subtitle}
              </p>
            </div>

            {/* Host Identity Badge */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#050002]/60 border border-white/5 max-w-md">
              <img 
                src={PODCAST_SHOW.coverImage} 
                alt={PODCAST_SHOW.host}
                className="w-12 h-12 rounded-xl object-cover border border-[#F2A98A]/30 shadow-md" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-cream text-sm">{PODCAST_SHOW.host}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c96a42]/30 text-[#F2A98A] font-mono font-bold">Host</span>
                </div>
                <p className="text-[11px] text-cream/60 font-sans">{PODCAST_SHOW.hostRole}</p>
              </div>
            </div>

            {/* Rich Synopsis */}
            <p className="text-sm sm:text-base text-cream/80 leading-relaxed font-serif">
              "{activeEpisode.description}"
            </p>

            {/* Archetype Affinities & Soundscape Pairing */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {activeEpisode.archetypes?.map((arch) => (
                <span 
                  key={arch}
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${ARCHETYPE_TAG_COLORS[arch] || 'bg-white/5 border-white/10 text-cream/80'}`}
                >
                  ✦ {arch}
                </span>
              ))}

              {/* Soundscape Pairing link */}
              {activeEpisode.soundscapePairing && (
                <Link
                  href={`/soundscapes#${activeEpisode.soundscapePairing.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#c96a42]/20 hover:bg-[#c96a42]/35 border border-[#c96a42]/40 text-[#F2A98A] transition-colors"
                  title="Listen with ambient soundscape"
                >
                  <Music size={12} />
                  <span>Ambient: {activeEpisode.soundscapePairing.title} {activeEpisode.soundscapePairing.emoji}</span>
                </Link>
              )}
            </div>

            {/* External Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={activeEpisode.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <FaSpotify size={16} />
                <span>Listen on Spotify</span>
              </a>

              <a
                href={PODCAST_SHOW.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cream text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <FaYoutube size={15} className="text-[#FF0000]" />
                <span>YouTube</span>
              </a>

              <button
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cream text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                title="Copy share link"
              >
                <Share2 size={14} />
                <span>{copiedLink ? "Link Copied!" : "Share"}</span>
              </button>
            </div>

          </div>

          {/* Right Column: Embedded Spotify Audio Player (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#050002]/80 p-2.5 rounded-2xl border border-[#F2A98A]/25 shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-mono text-cream/60 border-b border-white/5 mb-2">
                <span className="flex items-center gap-1.5 text-[#F2A98A] font-bold">
                  <Volume2 size={14} className="animate-pulse" />
                  <span>Now Streaming</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-cream/40">Official Player</span>
              </div>

              {/* Responsive Spotify Iframe Embed */}
              <iframe
                src={activeEpisode.spotifyEmbedUrl}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl w-full"
                style={{ borderRadius: '12px', minHeight: '352px' }}
                title={activeEpisode.title}
              />

              <p className="text-[10px] text-center text-cream/40 pt-2 font-mono">
                Powered by Spotify • Streams count directly to creator metrics
              </p>
            </div>
          </div>

        </div>
      </motion.div>

      {/* 3. SEARCH & DISCOVERY BAR */}
      <div className="space-y-6">
        
        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {PODCAST_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream shadow-lg border border-[#F2A98A]/40 scale-105' 
                      : 'bg-[#120308]/70 hover:bg-[#120308] text-cream/70 hover:text-cream border border-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
            <input 
              type="text"
              placeholder="Search stories, themes, archetypes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#120308]/80 border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl pl-9 pr-4 py-2 text-xs font-sans text-cream placeholder-cream/40 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream"
              >
                <X size={13} />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 4. THE SPOKEN VAULT (EPISODE GRID) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold text-cream">
              The Spoken Vault
            </h3>
            <p className="text-xs font-mono text-cream/60 mt-0.5">
              Showing {filteredEpisodes.length} {filteredEpisodes.length === 1 ? 'tale' : 'tales'} in archive
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c96a42]/20 hover:bg-[#c96a42]/30 border border-[#c96a42]/40 text-[#F2A98A] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Mic size={14} />
            <span>Submit Your Podcast</span>
          </button>
        </div>

        {filteredEpisodes.length === 0 ? (
          <div className="bg-[#120308]/60 border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-3">
            <Radio size={32} className="mx-auto text-cream/30" />
            <h4 className="text-lg font-serif font-bold text-cream">No tales match your search</h4>
            <p className="text-xs text-cream/60 max-w-sm mx-auto">
              Try adjusting your search query or selecting a different category from above.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="px-4 py-2 rounded-xl bg-white/10 text-cream text-xs font-bold hover:bg-white/20 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEpisodes.map((episode) => {
              const isCurrent = activeEpisode.id === episode.id;
              return (
                <div
                  key={episode.id}
                  className={`rounded-3xl p-6 border flex flex-col justify-between transition-all duration-300 group relative overflow-hidden ${
                    isCurrent 
                      ? 'bg-[#1a050c] border-[#F2A98A]/60 shadow-[0_10px_30px_rgba(201,106,66,0.2)] ring-1 ring-[#F2A98A]/40' 
                      : 'bg-[#120308]/85 hover:bg-[#120308] border-[#F2A98A]/15 hover:border-[#F2A98A]/40 shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Subtle Card Glow */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#c96a42]/10 rounded-full blur-2xl group-hover:bg-[#c96a42]/20 transition-all pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    
                    {/* Top Row: Category tag + Duration */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#5c1a2e]/40 border border-[#F2A98A]/25 text-[#F2A98A] font-bold">
                        {episode.category === 'short_story' ? 'Short Story' : episode.category === 'quick_bites' ? 'Quick Bite' : 'Life Lore'}
                      </span>
                      <span className="flex items-center gap-1 text-cream/50">
                        <Clock size={11} />
                        <span>{episode.duration}</span>
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="space-y-1">
                      <h4 className="text-xl font-serif font-bold text-cream group-hover:text-[#F2A98A] transition-colors leading-snug">
                        {episode.title}
                      </h4>
                      <p className="text-xs font-serif italic text-cream/60">
                        {episode.subtitle}
                      </p>
                    </div>

                    {/* Description Excerpt */}
                    <p className="text-xs text-cream/70 leading-relaxed font-serif line-clamp-3">
                      {episode.description}
                    </p>

                    {/* Archetype & Ambient Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {episode.archetypes?.map((arch) => (
                        <span 
                          key={arch}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cream/70"
                        >
                          {arch}
                        </span>
                      ))}

                      {episode.soundscapePairing && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#c96a42]/15 text-[#F2A98A] border border-[#c96a42]/25">
                          {episode.soundscapePairing.emoji} {episode.soundscapePairing.title}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-3 relative z-10">
                    
                    <button
                      onClick={() => {
                        setActiveEpisode(episode);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-[#F2A98A] text-[#20070e] font-extrabold shadow-md' 
                          : 'bg-white/10 hover:bg-white/20 text-cream'
                      }`}
                    >
                      <Play size={13} className={isCurrent ? "fill-current" : ""} />
                      <span>{isCurrent ? "Active In Player" : "Play Episode"}</span>
                    </button>

                    <a
                      href={episode.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-[#1DB954]/20 border border-white/10 hover:border-[#1DB954]/40 text-cream/70 hover:text-[#1DB954] transition-all cursor-pointer"
                      title="Open on Spotify"
                    >
                      <FaSpotify size={16} />
                    </a>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. CREATOR SPOTLIGHT: DEBBIE DOOWUESE AJOM */}
      <div className="bg-gradient-to-r from-[#1c060d] via-[#120308] to-[#250912] border border-[#F2A98A]/25 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[#c96a42]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <div className="relative">
              <img 
                src={PODCAST_SHOW.coverImage}
                alt={PODCAST_SHOW.host}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover border-2 border-[#F2A98A]/40 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-[#5c1a2e] border border-[#F2A98A]/40 text-[#F2A98A] text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg">
                Verified Storyteller
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4 text-center sm:text-left">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#F2A98A] font-bold">
                Featured Paper Thoughts Storyteller
              </span>
              <h3 className="text-3xl sm:text-4xl font-serif font-bold text-cream">
                {PODCAST_SHOW.host}
              </h3>
              <p className="text-xs font-mono text-cream/60">
                {PODCAST_SHOW.hostRole}
              </p>
            </div>

            <p className="text-sm text-cream/75 leading-relaxed font-serif max-w-2xl">
              {PODCAST_SHOW.hostBio}
            </p>

            {/* Creator Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <a
                href={PODCAST_SHOW.socials.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#1DB954]/15 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1DB954] text-xs font-bold flex items-center gap-2 transition-all"
              >
                <FaSpotify size={15} />
                <span>Spotify Show</span>
              </a>

              <a
                href={PODCAST_SHOW.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#FF0000]/15 hover:bg-[#FF0000]/30 border border-[#FF0000]/40 text-[#FF4444] text-xs font-bold flex items-center gap-2 transition-all"
              >
                <FaYoutube size={15} />
                <span>YouTube Channel</span>
              </a>

              <a
                href={PODCAST_SHOW.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#E1306C]/15 hover:bg-[#E1306C]/30 border border-[#E1306C]/40 text-[#E1306C] text-xs font-bold flex items-center gap-2 transition-all"
              >
                <FaInstagram size={15} />
                <span>Instagram</span>
              </a>

              <a
                href={PODCAST_SHOW.socials.linktree}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cream text-xs font-bold flex items-center gap-2 transition-all"
              >
                <FaLink size={13} />
                <span>All Links</span>
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* 6. CALL TO ACTION: THE STORYTELLER'S GUILD */}
      <div className="bg-[#120308]/90 border border-[#F2A98A]/20 rounded-3xl p-8 sm:p-12 text-center space-y-5 max-w-3xl mx-auto shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-[#5c1a2e]/50 border border-[#F2A98A]/30 flex items-center justify-center mx-auto text-[#F2A98A]">
          <Mic size={24} />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-cream">
            Do You Tell Stories on Audio?
          </h3>
          <p className="text-xs sm:text-sm font-serif italic text-cream/70 max-w-lg mx-auto leading-relaxed">
            "Paper Thoughts welcomes voice actors, poets, essayists, and podcasters crafting literature for the ear."
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
        >
          <span>Submit Your Show for Curation</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* 7. CREATOR SUBMISSION MODAL */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#140409] border border-[#F2A98A]/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={resetModal}
                className="absolute top-5 right-5 text-cream/40 hover:text-cream p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {submissionSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center mx-auto text-[#1DB954]">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-2xl font-serif font-bold text-cream">Tale Received</h4>
                    <p className="text-xs font-serif text-cream/70 max-w-sm mx-auto leading-relaxed">
                      Thank you for sharing your spoken lore with Paper Thoughts. Our editorial guild will review your submission and connect with you.
                    </p>
                  </div>
                  <button
                    onClick={resetModal}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] text-cream font-bold text-xs uppercase tracking-wider"
                  >
                    Return to Sanctuary
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2A98A] font-bold">
                      The Storyteller's Portal
                    </span>
                    <h4 className="text-2xl font-serif font-bold text-cream">
                      Submit Your Spoken Lore
                    </h4>
                    <p className="text-xs text-cream/60">
                      Share your podcast or literary audio show to be featured on Paper Thoughts.
                    </p>
                  </div>

                  <div className="space-y-3.5 text-left">
                    <div>
                      <label className="block text-[11px] font-mono text-cream/70 mb-1">
                        Podcast / Show Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LIFELORE or Midnight Pages"
                        value={formData.podcastName}
                        onChange={(e) => setFormData({ ...formData, podcastName: e.target.value })}
                        className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3.5 py-2.5 text-xs text-cream placeholder-cream/30 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-cream/70 mb-1">
                          Creator / Host Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your name"
                          value={formData.creatorName}
                          onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                          className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3.5 py-2.5 text-xs text-cream placeholder-cream/30 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-cream/70 mb-1">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="you@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3.5 py-2.5 text-xs text-cream placeholder-cream/30 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-cream/70 mb-1">
                        Spotify Show or Episode Link *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://open.spotify.com/show/..."
                        value={formData.spotifyLink}
                        onChange={(e) => setFormData({ ...formData, spotifyLink: e.target.value })}
                        className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3.5 py-2.5 text-xs text-cream placeholder-cream/30 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-cream/70 mb-1">
                        Synopsis & Literary Theme *
                      </label>
                      <textarea
                        required
                        rows="3"
                        placeholder="Tell us what stories you tell, the vibe, and what makes your lore special..."
                        value={formData.synopsis}
                        onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                        className="w-full bg-[#080104] border border-[#F2A98A]/20 focus:border-[#F2A98A]/60 rounded-xl px-3.5 py-2.5 text-xs text-cream placeholder-cream/30 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5c1a2e] to-[#c96a42] hover:from-[#7a2040] hover:to-[#e07a5f] text-cream font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Transmitting Lore...</span>
                      ) : (
                        <>
                          <span>Submit for Curation</span>
                          <Send size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
