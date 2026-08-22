export const SIGNS = {
  Titan: {
    id: 'Titan',
    name: 'Titan',
    title: 'The Unstoppable Explorer',
    emoji: '⚔️',
    color: '#D62828',
    image: '/images/zodiac/titan.jpeg',
    gradient: 'from-[#D62828] to-[#9B1D1D]',
    tagline: 'Fueled by grandeur, courage, and relentless momentum.',
    description: 'You are a powerhouse of literary momentum. Stories to you are epic journeys and vast horizons. You do not just read—you conquer worlds, devour pages, and seek books that test the limits of courage and ambition.',
    superpower: 'Unbreakable reading endurance and epic narrative vision.',
    kryptonite: 'Slow, directionless plots where nothing happens.',
    soundscapes: ['midnight_express', 'castle_archives'],
    archetypeMatches: ['marathon', 'behemoth', 'genre_explorer']
  },
  Haven: {
    id: 'Haven',
    name: 'Haven',
    title: 'The Sanctuary Keeper',
    emoji: '🕯️',
    color: '#D97706',
    image: '/images/zodiac/haven.jpeg',
    gradient: 'from-[#D97706] to-[#B45309]',
    tagline: 'Finding warmth, emotional safety, and home between pages.',
    description: 'Books are your sanctuary. You read to find comfort, process deep emotions, and create a cozy refuge from the noise of the world. You value emotional authenticity, rich atmosphere, and stories that wrap around you like a warm blanket.',
    superpower: 'Profound emotional intelligence and comfort-weaving.',
    kryptonite: 'Cynical stories devoid of hope or warmth.',
    soundscapes: ['forest_cabin', 'corner_cafe'],
    archetypeMatches: ['comfort_rereader', 'mood', 'slow_savorer']
  },
  Matrix: {
    id: 'Matrix',
    name: 'Matrix',
    title: 'The Architect of Knowledge',
    emoji: '🌌',
    color: '#2563EB',
    image: '/images/zodiac/matrix.jpeg',
    gradient: 'from-[#2563EB] to-[#1D4ED8]',
    tagline: 'Decoding systems, history, structure, and hidden truths.',
    description: 'You are the intellect of the literary cosmos. You treat stories and books as intricate systems of knowledge, archives of history, and puzzles to be solved. You love deep lore, complex worldbuilding, and ideas that expand your mind.',
    superpower: 'Mastery of lore, facts, and underlying narrative structures.',
    kryptonite: 'Plot holes and unresearched historical inaccuracies.',
    soundscapes: ['reading_room', 'old_library'],
    archetypeMatches: ['researcher', 'tbr_optimist', 'page_artist']
  },
  Oracle: {
    id: 'Oracle',
    name: 'Oracle',
    title: 'The Weaver of Mysteries',
    emoji: '🔮',
    color: '#7C3AED',
    image: '/images/zodiac/oracle.jpeg',
    gradient: 'from-[#7C3AED] to-[#6D28D9]',
    tagline: 'Drawn to the mystical, the uncanny, and the veil between worlds.',
    description: 'You walk the boundary between reality and imagination. You are drawn to dark tales, surreal mysteries, magical realism, and questions that refuse simple answers. You read to glimpse what lies behind the curtain.',
    superpower: 'Intuitive perception of foreshadowing and atmospheric depth.',
    kryptonite: 'Predictable, cliché stories that explain too much.',
    soundscapes: ['hollow_manor', 'observatory'],
    archetypeMatches: ['fiction_insomniac', 'chaos_reader', 'book_wreck']
  },
  Scribe: {
    id: 'Scribe',
    name: 'Scribe',
    title: 'The Craftsperson of Words',
    emoji: '✍️',
    color: '#059669',
    image: '/images/zodiac/scribe.jpeg',
    gradient: 'from-[#059669] to-[#047857]',
    tagline: 'Honoring rhythm, prose beauty, and the art of creation.',
    description: 'To you, literature is elevated art. You savor the music of language, exquisite prose, poetic cadence, and the precision of written thought. You read like a writer—cherishing sentences and marking margins.',
    superpower: 'Flawless taste in sentence craft and literary elegance.',
    kryptonite: 'Lazy, repetitive prose and poor formatting.',
    soundscapes: ['still_hour', 'corner_cafe'],
    archetypeMatches: ['quote_collector', 'page_artist', 'slow_savorer']
  },
  Votive: {
    id: 'Votive',
    name: 'Votive',
    title: 'The Heart of Connection',
    emoji: '💖',
    color: '#EC4899',
    image: '/images/zodiac/votive.jpeg',
    gradient: 'from-[#EC4899] to-[#BE185D]',
    tagline: 'Driven by deep human bonds, romance, and shared emotion.',
    description: 'You read for the human heart. Characters are real to you, and stories exist to bridge the space between minds. You thrive on character relationships, shared community reads, drama, and intense emotional investment.',
    superpower: 'Unbounded narrative empathy and community connection.',
    kryptonite: 'Cold, clinical stories without emotional heart.',
    soundscapes: ['corner_cafe', 'forest_cabin'],
    archetypeMatches: ['social_reader', 'book_wreck', 'one_genre_wonder']
  },
  Sage: {
    id: 'Sage',
    name: 'Sage',
    title: 'The Keeper of Wisdom',
    emoji: '📜',
    color: '#0F766E',
    image: '/images/zodiac/sage.jpeg',
    gradient: 'from-[#0F766E] to-[#115E59]',
    tagline: 'Reflecting on life, human nature, and timeless truth.',
    description: 'You are a contemplative seeker. You read to understand life, human nature, philosophy, and timeless existence. A great book to you is one that leaves you staring at the ceiling, questioning everything you thought you knew.',
    superpower: 'Profound philosophical depth and life perspective.',
    kryptonite: 'Superficial books that lack substance.',
    soundscapes: ['old_library', 'still_hour'],
    archetypeMatches: ['slow_savorer', 'researcher', 'quote_collector']
  }
};

export const MATRIX = {
  Element: {
    Imagination: { Titan: 1, Haven: 0, Matrix: 0, Oracle: 2, Scribe: 3, Votive: 2, Sage: 1 },
    Knowledge:   { Titan: 0, Haven: 0, Matrix: 3, Oracle: 1, Scribe: 1, Votive: 0, Sage: 2 },
    Emotion:     { Titan: 1, Haven: 3, Matrix: 0, Oracle: 1, Scribe: 1, Votive: 3, Sage: 1 },
    Adventure:   { Titan: 3, Haven: 0, Matrix: 1, Oracle: 1, Scribe: 0, Votive: 1, Sage: 0 },
    Reflection:  { Titan: 0, Haven: 1, Matrix: 2, Oracle: 1, Scribe: 1, Votive: 0, Sage: 3 }
  },
  Realm: {
    Story: { Titan: 2, Haven: 2, Matrix: 0, Oracle: 2, Scribe: 1, Votive: 3, Sage: 1 },
    Info:  { Titan: 0, Haven: 0, Matrix: 3, Oracle: 1, Scribe: 1, Votive: 0, Sage: 3 },
    Veil:  { Titan: 1, Haven: 1, Matrix: 1, Oracle: 3, Scribe: 2, Votive: 2, Sage: 2 },
    Stage: { Titan: 2, Haven: 1, Matrix: 1, Oracle: 1, Scribe: 3, Votive: 2, Sage: 0 },
    Verse: { Titan: 0, Haven: 2, Matrix: 1, Oracle: 2, Scribe: 3, Votive: 2, Sage: 2 }
  },
  House: {
    Mirror:  { Titan: 0, Haven: 1, Matrix: 2, Oracle: 1, Scribe: 1, Votive: 0, Sage: 3 },
    Haven:   { Titan: 0, Haven: 3, Matrix: 0, Oracle: 0, Scribe: 1, Votive: 2, Sage: 1 },
    Horizon: { Titan: 3, Haven: 0, Matrix: 1, Oracle: 1, Scribe: 0, Votive: 1, Sage: 0 },
    Muse:    { Titan: 0, Haven: 1, Matrix: 1, Oracle: 2, Scribe: 3, Votive: 1, Sage: 1 },
    Legacy:  { Titan: 0, Haven: 1, Matrix: 3, Oracle: 0, Scribe: 1, Votive: 1, Sage: 2 },
    Bridge:  { Titan: 1, Haven: 2, Matrix: 1, Oracle: 1, Scribe: 1, Votive: 3, Sage: 1 },
    Dream:   { Titan: 2, Haven: 1, Matrix: 0, Oracle: 3, Scribe: 2, Votive: 1, Sage: 1 }
  },
  Medium: {
    'Legacy Edition':    { Titan: 1, Haven: 1, Matrix: 2, Oracle: 1, Scribe: 2, Votive: 1, Sage: 2 },
    'Companion Edition': { Titan: 1, Haven: 2, Matrix: 0, Oracle: 1, Scribe: 1, Votive: 3, Sage: 1 },
    'Archive Edition':   { Titan: 0, Haven: 0, Matrix: 3, Oracle: 0, Scribe: 1, Votive: 0, Sage: 2 },
    'Infinite Edition':  { Titan: 1, Haven: 1, Matrix: 2, Oracle: 1, Scribe: 2, Votive: 1, Sage: 1 },
    'Living Voice':       { Titan: 2, Haven: 2, Matrix: 0, Oracle: 2, Scribe: 1, Votive: 2, Sage: 1 },
    'Boundless Edition': { Titan: 1, Haven: 1, Matrix: 2, Oracle: 2, Scribe: 2, Votive: 1, Sage: 2 }
  }
};

export const SECTIONS = [
  {
    id: 'element',
    title: 'I. BOOK ELEMENT',
    subtitle: 'What drives your reading?',
    questionIndices: [0, 1, 2]
  },
  {
    id: 'realm',
    title: 'II. BOOK REALM',
    subtitle: 'Where in the literary universe do you naturally belong?',
    questionIndices: [3, 4, 5]
  },
  {
    id: 'house',
    title: 'III. STORY HOUSE',
    subtitle: 'What role do stories play in your life?',
    questionIndices: [6, 7, 8]
  },
  {
    id: 'medium',
    title: 'IV. STORY MEDIUM',
    subtitle: 'How do you naturally experience stories?',
    questionIndices: [9, 10, 11]
  }
];

export const QUESTIONS = [
  // SECTION I: BOOK ELEMENT
  {
    id: 1,
    section: 'element',
    question: 'You have an entirely free weekend and one book. What do you want it to do?',
    options: [
      { letter: 'A', text: "Take me somewhere that doesn't exist.", category: 'Imagination' },
      { letter: 'B', text: 'Teach me something fascinating.', category: 'Knowledge' },
      { letter: 'C', text: 'Make me feel something unforgettable.', category: 'Emotion' },
      { letter: 'D', text: 'Throw me into a high-stakes adventure.', category: 'Adventure' },
      { letter: 'E', text: 'Leave me staring at the ceiling thinking about life.', category: 'Reflection' }
    ]
  },
  {
    id: 2,
    section: 'element',
    question: 'A book has an incredible premise but weak prose. What keeps you reading?',
    options: [
      { letter: 'A', text: 'The rich world and magic it creates.', category: 'Imagination' },
      { letter: 'B', text: 'The ideas and concepts underneath it.', category: 'Knowledge' },
      { letter: 'C', text: 'The characters and their emotional vulnerability.', category: 'Emotion' },
      { letter: 'D', text: 'The pulse-pounding momentum of what happens next.', category: 'Adventure' },
      { letter: 'E', text: 'The deep philosophical questions it raises.', category: 'Reflection' }
    ]
  },
  {
    id: 3,
    section: 'element',
    question: 'If you could keep only one permanent gift from literature, you\'d choose…',
    options: [
      { letter: 'A', text: 'The ability to dream beyond reality.', category: 'Imagination' },
      { letter: 'B', text: 'The ability to understand how the world works.', category: 'Knowledge' },
      { letter: 'C', text: 'The ability to feel human emotions more deeply.', category: 'Emotion' },
      { letter: 'D', text: 'The courage to explore the unknown.', category: 'Adventure' },
      { letter: 'E', text: 'The wisdom to question everything you thought you knew.', category: 'Reflection' }
    ]
  },

  // SECTION II: BOOK REALM
  {
    id: 4,
    section: 'realm',
    question: 'You\'re wandering through an infinite labyrinthian library. Which wing pulls you in first?',
    options: [
      { letter: 'A', text: 'The wing of grand novels, legends, and epic sagas.', category: 'Story' },
      { letter: 'B', text: 'The wing of history, science, philosophy, and discovered truths.', category: 'Info' },
      { letter: 'C', text: 'The wing of myths, magical realism, surreal mysteries, and the uncanny.', category: 'Veil' },
      { letter: 'D', text: 'The wing of plays, dramatic scripts, and spoken performance.', category: 'Stage' },
      { letter: 'E', text: 'The wing of poetry where every line cuts directly to the soul.', category: 'Verse' }
    ]
  },
  {
    id: 5,
    section: 'realm',
    question: 'What kind of literary landscape feels most like home to you?',
    options: [
      { letter: 'A', text: 'One populated by vivid characters whose lives unfold over time.', category: 'Story' },
      { letter: 'B', text: 'One constructed from ideas, facts, archives, and systems.', category: 'Info' },
      { letter: 'C', text: 'One where reality has subtle, beautiful cracks in it.', category: 'Veil' },
      { letter: 'D', text: 'One designed to leap off the page and come alive through dialogue.', category: 'Stage' },
      { letter: 'E', text: 'One where a single stanza can hold an entire universe of meaning.', category: 'Verse' }
    ]
  },
  {
    id: 6,
    section: 'realm',
    question: 'Pick your ideal doorway into a new book:',
    options: [
      { letter: 'A', text: '“Once upon a time in a world forgotten…”', category: 'Story' },
      { letter: 'B', text: '“Let us examine the evidence of what really happened…”', category: 'Info' },
      { letter: 'C', text: '“Something about the house was not quite right…”', category: 'Veil' },
      { letter: 'D', text: '“Enter. The lights come up on a quiet room.”', category: 'Stage' },
      { letter: 'E', text: '“There are words for things we cannot yet name.”', category: 'Verse' }
    ]
  },

  // SECTION III: STORY HOUSE
  {
    id: 7,
    section: 'house',
    question: 'When life feels heavy or turbulent, you reach for books because…',
    options: [
      { letter: 'A', text: 'They hold up a mirror and help me understand myself.', category: 'Mirror' },
      { letter: 'B', text: 'They give me a safe, cozy sanctuary to rest and heal.', category: 'Haven' },
      { letter: 'C', text: 'They remind me that horizons exist far beyond my present situation.', category: 'Horizon' },
      { letter: 'D', text: 'They spark my creative fire and inspire me to write or make things.', category: 'Muse' },
      { letter: 'E', text: 'They connect me with humanity\'s timeless memories and ancient lore.', category: 'Legacy' },
      { letter: 'F', text: 'They build a bridge to empathize with lives completely unlike mine.', category: 'Bridge' },
      { letter: 'G', text: 'They let me dream of possibilities that should exist.', category: 'Dream' }
    ]
  },
  {
    id: 8,
    section: 'house',
    question: 'What makes a story personally unforgettable to you?',
    options: [
      { letter: 'A', text: 'It reflected a secret truth inside me I could never articulate.', category: 'Mirror' },
      { letter: 'B', text: 'It comforted me during a season when I needed comfort most.', category: 'Haven' },
      { letter: 'C', text: 'It shattered my boundaries and expanded what I thought was possible.', category: 'Horizon' },
      { letter: 'D', text: 'It filled me with creative energy to produce something of my own.', category: 'Muse' },
      { letter: 'E', text: 'It felt like an enduring masterpiece built to outlast centuries.', category: 'Legacy' },
      { letter: 'F', text: 'It helped me deeply understand another human being\'s heart.', category: 'Bridge' },
      { letter: 'G', text: 'It gave me a world so luminous I never wanted to wake up.', category: 'Dream' }
    ]
  },
  {
    id: 9,
    section: 'house',
    question: 'Imagine your bookshelf 50 years from now. What should it proclaim?',
    options: [
      { letter: 'A', text: '“This was the intimate map of my inner soul.”', category: 'Mirror' },
      { letter: 'B', text: '“These pages gave me a sanctuary and a home.”', category: 'Haven' },
      { letter: 'C', text: '“I was always looking toward the next great frontier.”', category: 'Horizon' },
      { letter: 'D', text: '“These stories fueled my imagination and creation.”', category: 'Muse' },
      { letter: 'E', text: '“I preserved the wisdom and art worth remembering.”', category: 'Legacy' },
      { letter: 'F', text: '“I sought to understand and love the diverse tapestry of humanity.”', category: 'Bridge' },
      { letter: 'G', text: '“I never stopped believing in wonder.”', category: 'Dream' }
    ]
  },

  // SECTION IV: STORY MEDIUM
  {
    id: 10,
    section: 'medium',
    question: 'Someone offers you your dream book in multiple editions. Your hand reaches for…',
    options: [
      { letter: 'A', text: 'The ornate hardcover keepsake with embossed cloth and ribbon.', category: 'Legacy Edition' },
      { letter: 'B', text: 'The comfortable paperback that fits in my jacket pocket.', category: 'Companion Edition' },
      { letter: 'C', text: 'The annotated PDF/digital archive with rich footnotes and research.', category: 'Archive Edition' },
      { letter: 'D', text: 'The sleek e-reader holding an entire library in my palm.', category: 'Infinite Edition' },
      { letter: 'E', text: 'The audiobook with a master narrator bringing every voice alive.', category: 'Living Voice' },
      { letter: 'F', text: 'Whichever format gets the words into my mind fastest—form doesn\'t matter.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 11,
    section: 'medium',
    question: 'Your ideal atmosphere for a deeply immersive reading session:',
    options: [
      { letter: 'A', text: 'A quiet personal library surrounded by the scent of old paper and bindings.', category: 'Legacy Edition' },
      { letter: 'B', text: 'A cozy chair in a bustling cafe or sunlit nook with a favorite paperback.', category: 'Companion Edition' },
      { letter: 'C', text: 'A focused desk setup with searchable cross-references and notes.', category: 'Archive Edition' },
      { letter: 'D', text: 'Curled up under dark blankets with a backlit e-ink screen in late hours.', category: 'Infinite Edition' },
      { letter: 'E', text: 'Walking under trees or commuting with headphones in rich auditory flow.', category: 'Living Voice' },
      { letter: 'F', text: 'Fluidly switching: audio on the go, e-book at lunch, physical by night.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 12,
    section: 'medium',
    question: 'What makes a story feel most truly and tangibly alive to you?',
    options: [
      { letter: 'A', text: 'The tactile weight, craftsmanship, typography, and paper grain.', category: 'Legacy Edition' },
      { letter: 'B', text: 'The dog-eared corners, highlighted margins, and worn travel creases.', category: 'Companion Edition' },
      { letter: 'C', text: 'The clarity of structured thought, historical citations, and retrieved facts.', category: 'Archive Edition' },
      { letter: 'D', text: 'The instantaneous freedom to search, highlight, and carry infinite knowledge.', category: 'Infinite Edition' },
      { letter: 'E', text: 'The cadence, breath, and emotional intimacy of a human voice speaking.', category: 'Living Voice' },
      { letter: 'F', text: 'The pure consciousness of the story itself—transcending any physical container.', category: 'Boundless Edition' }
    ]
  }
];

export function calculateZodiacChart(answers) {
  // Initialize sign totals
  const totals = { Titan: 0, Haven: 0, Matrix: 0, Oracle: 0, Scribe: 0, Votive: 0, Sage: 0 };
  
  // Track category counts by section for primary attribution
  const categoryCounts = {
    element: {},
    realm: {},
    house: {},
    medium: {}
  };

  // Process answers (supports single index or array of up to 2 indices)
  QUESTIONS.forEach((q, idx) => {
    const rawAnswer = answers[idx];
    if (rawAnswer === undefined || rawAnswer === null) return;
    
    // Normalize to array of indices
    const selectedIndices = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];
    if (selectedIndices.length === 0) return;

    const section = q.section; // 'element' | 'realm' | 'house' | 'medium'
    const matrixSectionKey = section.charAt(0).toUpperCase() + section.slice(1);
    const sectionMatrix = MATRIX[matrixSectionKey];
    
    // Weight per selection (proportional if multiple choices selected)
    const weight = 1 / selectedIndices.length;

    selectedIndices.forEach(optIdx => {
      const option = q.options[optIdx];
      if (!option) return;

      const category = option.category;
      categoryCounts[section][category] = (categoryCounts[section][category] || 0) + 1;

      if (sectionMatrix && sectionMatrix[category]) {
        const categoryPoints = sectionMatrix[category];
        Object.keys(categoryPoints).forEach(sign => {
          totals[sign] += categoryPoints[sign] * weight;
        });
      }
    });
  });

  // Helper to find dominant category in each section
  const getDominantCategory = (sectionKey, defaultCat) => {
    const counts = categoryCounts[sectionKey] || {};
    const entries = Object.entries(counts);
    if (entries.length === 0) return defaultCat;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  const primaryElement = getDominantCategory('element', 'Imagination');
  const primaryRealm = getDominantCategory('realm', 'Story');
  const primaryHouse = getDominantCategory('house', 'Mirror');
  const primaryMedium = getDominantCategory('medium', 'Legacy Edition');

  // Sort signs by score descending
  const sortedSigns = Object.keys(totals)
    .map(signKey => ({ signKey, score: Math.round(totals[signKey] * 10) / 10 }))
    .sort((a, b) => b.score - a.score);

  // Check for ties in 1st place to detect cusp
  let topSignObj = sortedSigns[0] || { signKey: 'Oracle', score: 0 };
  let secondSignObj = sortedSigns[1] || { signKey: 'Scribe', score: 0 };
  let thirdSignObj = sortedSigns[2] || { signKey: 'Sage', score: 0 };
  let isCusp = false;

  if (Math.abs(topSignObj.score - secondSignObj.score) < 0.3) {
    isCusp = true;
  }

  const sunSign = SIGNS[topSignObj.signKey] || SIGNS.Oracle;
  const moonSign = SIGNS[secondSignObj.signKey] || SIGNS.Scribe;
  const risingSign = SIGNS[thirdSignObj.signKey] || SIGNS.Sage;

  return {
    sunSign,
    moonSign,
    risingSign,
    isCusp,
    cuspSignName: isCusp ? `${sunSign.name}-${moonSign.name} Cusp` : null,
    chosenElement: primaryElement,
    chosenRealm: primaryRealm,
    chosenHouse: primaryHouse,
    chosenMedium: primaryMedium,
    scores: totals
  };
}
