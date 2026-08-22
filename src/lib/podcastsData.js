/**
 * Paper Thoughts — Spoken Lore & Podcasts Data Registry
 * Curated literary audio, short stories, and spoken-word narratives.
 */

export const PODCAST_SHOW = {
  id: 'lifelore',
  title: 'LIFELORE',
  tagline: 'Life retold through its highs, lows, and in-betweens.',
  host: 'Debbie Doowuese Ajom',
  hostRole: 'Master Storyteller & PT Social Media Lead',
  hostBio: 'LIFELORE Podcast is where life is retold through its highs, lows, and in-betweens—The Good, The Bad, and The Ugly—woven into thought-provoking, entertaining, and deeply relatable stories by host Debbie Doowuese Ajom.',
  coverImage: 'https://i.scdn.co/image/ab6765630000ba8a9be26c760ec1a3210b8c1ce9',
  spotifyShowUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
  spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
  socials: {
    spotify: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk?si=p3koHDEoRd6hcFwyfUXBlQ',
    youtube: 'https://youtube.com/@lifelore_podcast?si=LZQumfjW2XRWYsl0',
    instagram: 'https://www.instagram.com/lifelore_podcast',
    linktree: 'https://linktr.ee/debbie705',
    email: 'ajomdebbie@gmail.com'
  },
  genres: ['Audio Literature', 'Short Stories', 'Memoir & Lore', 'Cultural Reflections']
};

export const PODCAST_CATEGORIES = [
  { id: 'all', label: 'All Spoken Lore', icon: '✨' },
  { id: 'essential', label: 'Essential / Most Loved', icon: '🔥' },
  { id: 'short_story', label: 'Short Stories', icon: '📖' },
  { id: 'life_lore', label: 'Life & The Human Condition', icon: '🌙' },
  { id: 'quick_bites', label: 'Quick Bites (< 15 mins)', icon: '⏳' }
];

export const PODCAST_EPISODES = [
  {
    id: 'lifelore-show-stream',
    showId: 'lifelore',
    title: 'LIFELORE: Complete Show Stream & Recent Drops',
    subtitle: 'The Good, The Bad, and The Ugly of Being Human',
    host: 'Debbie Doowuese Ajom',
    description: 'Immerse yourself directly into the full stream of LIFELORE. Experience Debbie’s latest narrative drops as they happen on Spotify, spanning raw confessions, poignant humor, and literary short stories.',
    duration: 'Full Show',
    releaseDate: 'Weekly',
    category: 'life_lore',
    isHeroFeatured: true,
    isEssential: true,
    spotifyUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
    archetypes: ['Oracle', 'Haven', 'Scribe'],
    soundscapePairing: {
      id: 'still_hour',
      title: 'The Still Hour',
      emoji: '🌌',
      vibe: 'Midnight solitude & contemplation'
    },
    tags: ['Short Stories', 'Relatable', 'Human Lore', 'Emotional Truth']
  },
  {
    id: 'tale-of-two-cities-untold',
    showId: 'lifelore',
    title: 'The Weight of Unspoken Words',
    subtitle: 'Highs, Lows & Everything Between the Lines',
    host: 'Debbie Doowuese Ajom',
    description: 'An evocative exploration of what we bury in silence. Debbie unpacks the unspoken contracts in modern relationships, nostalgia for forgotten versions of ourselves, and finding peace in honest vulnerability.',
    duration: '14 min',
    releaseDate: 'August 2026',
    category: 'short_story',
    isHeroFeatured: false,
    isEssential: true,
    spotifyUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
    archetypes: ['Scribe', 'Sage'],
    soundscapePairing: {
      id: 'reading_room',
      title: 'The Reading Room',
      emoji: '📚',
      vibe: 'Deep study & intellectual flow'
    },
    tags: ['Reflective', 'Short Fiction', 'Relationships']
  },
  {
    id: 'midnight-confessions-abuja',
    showId: 'lifelore',
    title: 'Midnight in the City: Dreams & Detours',
    subtitle: 'Tales from the Streets, Traffic, and Living in the North',
    host: 'Debbie Doowuese Ajom',
    description: 'A vivid, darkly comedic storytelling piece capturing the unexpected turns of youth, ambition, friendships that fracture, and the strange magic of late-night conversations under northern skies.',
    duration: '18 min',
    releaseDate: 'July 2026',
    category: 'life_lore',
    isHeroFeatured: false,
    isEssential: true,
    spotifyUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
    archetypes: ['Titan', 'Haven'],
    soundscapePairing: {
      id: 'midnight_express',
      title: 'The Midnight Express',
      emoji: '🚂',
      vibe: 'Epic journeys & adventure'
    },
    tags: ['City Lore', 'Memoir', 'Humor & Grit']
  },
  {
    id: 'whispers-in-the-parlour',
    showId: 'lifelore',
    title: 'The Art of Starting Over',
    subtitle: 'When the Page You Thought You Wrote Turns Blank',
    host: 'Debbie Doowuese Ajom',
    description: 'What happens when life refuses to follow the script? A comforting yet bracing narrative on reinventing your narrative after unexpected endings.',
    duration: '11 min',
    releaseDate: 'July 2026',
    category: 'quick_bites',
    isHeroFeatured: false,
    isEssential: false,
    spotifyUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
    archetypes: ['Votive', 'Haven'],
    soundscapePairing: {
      id: 'corner_cafe',
      title: 'The Corner Café',
      emoji: '☕',
      vibe: 'Cozy warmth & healing'
    },
    tags: ['Healing', 'Short Story', 'Courage']
  },
  {
    id: 'gothic-echoes-folklore',
    showId: 'lifelore',
    title: 'Secrets Kept Behind Locked Doors',
    subtitle: 'Suspense, Family Myths, and Unraveling Mysteries',
    host: 'Debbie Doowuese Ajom',
    description: 'Debbie dives into a spellbinding narrative exploring old family secrets, whispered rumors, and how stories passed down generations shape our deepest fears.',
    duration: '19 min',
    releaseDate: 'June 2026',
    category: 'short_story',
    isHeroFeatured: false,
    isEssential: true,
    spotifyUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
    archetypes: ['Oracle', 'Matrix'],
    soundscapePairing: {
      id: 'hollow_manor',
      title: 'The Hollow Manor',
      emoji: '🦇',
      vibe: 'Gothic mystery & suspense'
    },
    tags: ['Mystery', 'Folklore', 'Atmospheric']
  },
  {
    id: 'the-coffee-table-epilogue',
    showId: 'lifelore',
    title: 'Seven Lessons from the Wrong Decisions',
    subtitle: 'A Quick Dose of Unvarnished Perspective',
    host: 'Debbie Doowuese Ajom',
    description: 'A punchy, razor-sharp 9-minute reflection on making mistakes, owning the awkwardness, and the unexpected comedy of growing up in public.',
    duration: '9 min',
    releaseDate: 'May 2026',
    category: 'quick_bites',
    isHeroFeatured: false,
    isEssential: false,
    spotifyUrl: 'https://open.spotify.com/show/1z10DT9xtMxBdanA2Y4lCk',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/show/1z10DT9xtMxBdanA2Y4lCk?utm_source=generator&theme=0',
    archetypes: ['Sage', 'Scribe'],
    soundscapePairing: {
      id: 'forest_cabin',
      title: 'The Forest Cabin',
      emoji: '🌲',
      vibe: 'Nature, peace & emotional comfort'
    },
    tags: ['Quick Bite', 'Wisdom', 'Life Lessons']
  }
];

export const ARCHETYPE_TAG_COLORS = {
  Scribe: 'bg-[#5c1a2e]/40 border-[#F2A98A]/30 text-[#F2A98A]',
  Sage: 'bg-[#1E2A4A]/60 border-[#7A9E7E]/30 text-[#A8D5BA]',
  Oracle: 'bg-[#2A1B28]/80 border-[#C96A42]/40 text-[#F2A98A]',
  Titan: 'bg-[#2C3A33]/70 border-[#C96A42]/30 text-[#E0A96D]',
  Haven: 'bg-[#4A3425]/60 border-[#F2A98A]/30 text-[#F2A98A]',
  Votive: 'bg-[#253B26]/60 border-[#7A9E7E]/30 text-[#A8D5BA]',
  Matrix: 'bg-[#1C2541]/70 border-[#F2A98A]/30 text-[#F2A98A]'
};
