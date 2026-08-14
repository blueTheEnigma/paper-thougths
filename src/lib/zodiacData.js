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
    questionIndices: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: 'realm',
    title: 'II. BOOK REALM',
    subtitle: 'Where in the literary universe do you naturally belong?',
    questionIndices: [7, 8, 9, 10, 11, 12, 13]
  },
  {
    id: 'house',
    title: 'III. STORY HOUSE',
    subtitle: 'What role do stories play in your life?',
    questionIndices: [14, 15, 16, 17, 18, 19, 20]
  },
  {
    id: 'medium',
    title: 'IV. STORY MEDIUM',
    subtitle: 'How do you naturally experience stories?',
    questionIndices: [21, 22, 23, 24, 25, 26, 27]
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
      { letter: 'D', text: 'Throw me into an experience.', category: 'Adventure' },
      { letter: 'E', text: 'Leave me staring at the ceiling thinking about life.', category: 'Reflection' }
    ]
  },
  {
    id: 2,
    section: 'element',
    question: 'Which compliment about your reading would please you most?',
    options: [
      { letter: 'A', text: '“You have such an incredible imagination.”', category: 'Imagination' },
      { letter: 'B', text: '“You know so much.”', category: 'Knowledge' },
      { letter: 'C', text: '“You really understand what that character was feeling.”', category: 'Emotion' },
      { letter: 'D', text: '“You\'re always looking for your next adventure.”', category: 'Adventure' },
      { letter: 'E', text: '“You notice things other readers miss.”', category: 'Reflection' }
    ]
  },
  {
    id: 3,
    section: 'element',
    question: 'A book has an incredible premise but weak prose. What keeps you reading?',
    options: [
      { letter: 'A', text: 'The world it creates.', category: 'Imagination' },
      { letter: 'B', text: 'The ideas underneath it.', category: 'Knowledge' },
      { letter: 'C', text: 'The characters and their emotions.', category: 'Emotion' },
      { letter: 'D', text: 'What happens next.', category: 'Adventure' },
      { letter: 'E', text: 'The questions it raises.', category: 'Reflection' }
    ]
  },
  {
    id: 4,
    section: 'element',
    question: 'Which reading experience sounds most satisfying?',
    options: [
      { letter: 'A', text: 'Getting completely lost in another reality.', category: 'Imagination' },
      { letter: 'B', text: 'Discovering a concept that changes how I understand something.', category: 'Knowledge' },
      { letter: 'C', text: 'Becoming emotionally attached to people who don\'t even exist.', category: 'Emotion' },
      { letter: 'D', text: 'Feeling like I\'ve gone somewhere without leaving my chair.', category: 'Adventure' },
      { letter: 'E', text: 'Finishing a book and realizing I now see something differently.', category: 'Reflection' }
    ]
  },
  {
    id: 5,
    section: 'element',
    question: 'You finish a brilliant book. What happens next?',
    options: [
      { letter: 'A', text: 'I keep imagining the world beyond the ending.', category: 'Imagination' },
      { letter: 'B', text: 'I start researching things mentioned in it.', category: 'Knowledge' },
      { letter: 'C', text: 'I sit with the feelings it left me.', category: 'Emotion' },
      { letter: 'D', text: 'I immediately want another book with the same energy.', category: 'Adventure' },
      { letter: 'E', text: 'I start thinking about what it actually meant.', category: 'Reflection' }
    ]
  },
  {
    id: 6,
    section: 'element',
    question: 'Pick the sentence that feels most like your relationship with books.',
    options: [
      { letter: 'A', text: '“Books allow me to imagine the impossible.”', category: 'Imagination' },
      { letter: 'B', text: '“Books give me access to minds and knowledge I couldn\'t otherwise reach.”', category: 'Knowledge' },
      { letter: 'C', text: '“Books make me feel things I don\'t always know how to say.”', category: 'Emotion' },
      { letter: 'D', text: '“Books are journeys.”', category: 'Adventure' },
      { letter: 'E', text: '“Books are questions disguised as stories.”', category: 'Reflection' }
    ]
  },
  {
    id: 7,
    section: 'element',
    question: 'If you could keep only one gift from literature, you\'d choose…',
    options: [
      { letter: 'A', text: 'The ability to dream beyond reality.', category: 'Imagination' },
      { letter: 'B', text: 'The ability to understand more.', category: 'Knowledge' },
      { letter: 'C', text: 'The ability to feel more deeply.', category: 'Emotion' },
      { letter: 'D', text: 'The courage to explore.', category: 'Adventure' },
      { letter: 'E', text: 'The ability to question.', category: 'Reflection' }
    ]
  },

  // SECTION II: BOOK REALM
  {
    id: 8,
    section: 'realm',
    question: 'You\'re wandering through an enormous library. Which room pulls you in?',
    options: [
      { letter: 'A', text: 'The room of novels, legends and epic tales.', category: 'Story' },
      { letter: 'B', text: 'The room of history, science, philosophy and ideas.', category: 'Info' },
      { letter: 'C', text: 'The room of myths, mysteries, fantasy and the uncanny.', category: 'Veil' },
      { letter: 'D', text: 'The room filled with plays and dramatic scripts.', category: 'Stage' },
      { letter: 'E', text: 'The room where poetry fills every shelf.', category: 'Verse' }
    ]
  },
  {
    id: 9,
    section: 'realm',
    question: 'Which book would you most likely pick up without knowing anything about it?',
    options: [
      { letter: 'A', text: 'A sweeping novel about someone\'s life.', category: 'Story' },
      { letter: 'B', text: 'A fascinating work of nonfiction.', category: 'Info' },
      { letter: 'C', text: 'A strange book with an unsettling cover.', category: 'Veil' },
      { letter: 'D', text: 'A play by a writer I\'ve never read.', category: 'Stage' },
      { letter: 'E', text: 'A slim volume of poetry.', category: 'Verse' }
    ]
  },
  {
    id: 10,
    section: 'realm',
    question: 'What kind of literary world feels most natural to you?',
    options: [
      { letter: 'A', text: 'One populated by characters whose lives unfold over time.', category: 'Story' },
      { letter: 'B', text: 'One constructed from facts, arguments and ideas.', category: 'Info' },
      { letter: 'C', text: 'One where reality has mysterious cracks in it.', category: 'Veil' },
      { letter: 'D', text: 'One designed to come alive through performance.', category: 'Stage' },
      { letter: 'E', text: 'One where a few words can contain an entire universe.', category: 'Verse' }
    ]
  },
  {
    id: 11,
    section: 'realm',
    question: 'Someone asks what you normally read. Your answer is closest to:',
    options: [
      { letter: 'A', text: '“Stories.”', category: 'Story' },
      { letter: 'B', text: '“Anything that teaches me something.”', category: 'Info' },
      { letter: 'C', text: '“Anything weird.”', category: 'Veil' },
      { letter: 'D', text: '“Drama, scripts, plays…”', category: 'Stage' },
      { letter: 'E', text: '“Poetry. Especially the devastating kind.”', category: 'Verse' }
    ]
  },
  {
    id: 12,
    section: 'realm',
    question: 'Which literary experience would tempt you most?',
    options: [
      { letter: 'A', text: 'Living inside a character\'s story for 600 pages.', category: 'Story' },
      { letter: 'B', text: 'Spending hours exploring an unfamiliar subject.', category: 'Info' },
      { letter: 'C', text: 'Trying to decipher a story that refuses to explain itself.', category: 'Veil' },
      { letter: 'D', text: 'Reading something written to be performed aloud.', category: 'Stage' },
      { letter: 'E', text: 'Reading one poem repeatedly because it keeps revealing something new.', category: 'Verse' }
    ]
  },
  {
    id: 13,
    section: 'realm',
    question: 'Pick your doorway.',
    options: [
      { letter: 'A', text: 'Once upon a time…', category: 'Story' },
      { letter: 'B', text: 'Let us examine the evidence…', category: 'Info' },
      { letter: 'C', text: 'Something was not quite right…', category: 'Veil' },
      { letter: 'D', text: 'Enter. The lights come up.', category: 'Stage' },
      { letter: 'E', text: 'There are words for things we cannot name.', category: 'Verse' }
    ]
  },
  {
    id: 14,
    section: 'realm',
    question: 'If literature were a city, you\'d spend most of your time…',
    options: [
      { letter: 'A', text: 'Wandering through its stories.', category: 'Story' },
      { letter: 'B', text: 'Exploring its archives.', category: 'Info' },
      { letter: 'C', text: 'Following its secret passages.', category: 'Veil' },
      { letter: 'D', text: 'Sitting in its theatres.', category: 'Stage' },
      { letter: 'E', text: 'Walking its quiet streets looking for poems.', category: 'Verse' }
    ]
  },

  // SECTION III: STORY HOUSE
  {
    id: 15,
    section: 'house',
    question: 'When you recognize yourself in a character, your first thought is…',
    options: [
      { letter: 'A', text: '“Oh. Someone finally gets it.”', category: 'Mirror' },
      { letter: 'B', text: '“I needed to meet this version of myself.”', category: 'Haven' },
      { letter: 'C', text: '“Maybe I can become something different.”', category: 'Horizon' },
      { letter: 'D', text: '“This makes me want to create something.”', category: 'Muse' },
      { letter: 'E', text: '“People have been feeling this for centuries.”', category: 'Legacy' },
      { letter: 'F', text: '“Now I understand someone else\'s experience.”', category: 'Bridge' },
      { letter: 'G', text: '“What if life could actually be like this?”', category: 'Dream' }
    ]
  },
  {
    id: 16,
    section: 'house',
    question: 'When life gets difficult, you reach for books because…',
    options: [
      { letter: 'A', text: 'They help me understand myself.', category: 'Mirror' },
      { letter: 'B', text: 'They give me somewhere safe to go.', category: 'Haven' },
      { letter: 'C', text: 'They remind me that there is more beyond my current situation.', category: 'Horizon' },
      { letter: 'D', text: 'They give me ideas and inspiration.', category: 'Muse' },
      { letter: 'E', text: 'They connect me with what came before me.', category: 'Legacy' },
      { letter: 'F', text: 'They help me understand people and perspectives different from mine.', category: 'Bridge' },
      { letter: 'G', text: 'They let me imagine another possibility.', category: 'Dream' }
    ]
  },
  {
    id: 17,
    section: 'house',
    question: 'What makes a book personally important to you?',
    options: [
      { letter: 'A', text: 'It reflected something inside me.', category: 'Mirror' },
      { letter: 'B', text: 'It comforted me when I needed it.', category: 'Haven' },
      { letter: 'C', text: 'It expanded my sense of what was possible.', category: 'Horizon' },
      { letter: 'D', text: 'It inspired me to create or act.', category: 'Muse' },
      { letter: 'E', text: 'It felt like something worth preserving.', category: 'Legacy' },
      { letter: 'F', text: 'It helped me understand another person or culture.', category: 'Bridge' },
      { letter: 'G', text: 'It gave me a world I could dream about.', category: 'Dream' }
    ]
  },
  {
    id: 18,
    section: 'house',
    question: 'Imagine your personal library 50 years from now. What would you want it to say about you?',
    options: [
      { letter: 'A', text: '“This is who I was.”', category: 'Mirror' },
      { letter: 'B', text: '“These books gave me a home.”', category: 'Haven' },
      { letter: 'C', text: '“I was always looking beyond the horizon.”', category: 'Horizon' },
      { letter: 'D', text: '“These books made me create.”', category: 'Muse' },
      { letter: 'E', text: '“I kept the things worth remembering.”', category: 'Legacy' },
      { letter: 'F', text: '“I tried to understand the world and its people.”', category: 'Bridge' },
      { letter: 'G', text: '“I never stopped dreaming.”', category: 'Dream' }
    ]
  },
  {
    id: 19,
    section: 'house',
    question: 'A book changes your life. You want it to…',
    options: [
      { letter: 'A', text: 'Reveal something about yourself.', category: 'Mirror' },
      { letter: 'B', text: 'Help you through something.', category: 'Haven' },
      { letter: 'C', text: 'Open a door you hadn\'t considered.', category: 'Horizon' },
      { letter: 'D', text: 'Give you an idea worth pursuing.', category: 'Muse' },
      { letter: 'E', text: 'Become part of the story you leave behind.', category: 'Legacy' },
      { letter: 'F', text: 'Change how you understand someone else.', category: 'Bridge' },
      { letter: 'G', text: 'Make the impossible feel imaginable.', category: 'Dream' }
    ]
  },
  {
    id: 20,
    section: 'house',
    question: 'If books disappeared tomorrow, what would you mourn most?',
    options: [
      { letter: 'A', text: 'Losing a mirror for my inner world.', category: 'Mirror' },
      { letter: 'B', text: 'Losing a place to retreat to.', category: 'Haven' },
      { letter: 'C', text: 'Losing all those possible worlds.', category: 'Horizon' },
      { letter: 'D', text: 'Losing a source of inspiration.', category: 'Muse' },
      { letter: 'E', text: 'Losing humanity\'s written memory.', category: 'Legacy' },
      { letter: 'F', text: 'Losing one of humanity\'s greatest ways of connecting minds.', category: 'Bridge' },
      { letter: 'G', text: 'Losing one of our greatest ways of dreaming.', category: 'Dream' }
    ]
  },
  {
    id: 21,
    section: 'house',
    question: 'Choose the role you think stories have played most strongly in your life.',
    options: [
      { letter: 'A', text: 'They have helped me know myself.', category: 'Mirror' },
      { letter: 'B', text: 'They have helped me survive difficult moments.', category: 'Haven' },
      { letter: 'C', text: 'They have made my world larger.', category: 'Horizon' },
      { letter: 'D', text: 'They have made me want to make things.', category: 'Muse' },
      { letter: 'E', text: 'They have connected me to something bigger than myself.', category: 'Legacy' },
      { letter: 'F', text: 'They have helped me cross boundaries between people.', category: 'Bridge' },
      { letter: 'G', text: 'They have given my imagination somewhere to live.', category: 'Dream' }
    ]
  },

  // SECTION IV: STORY MEDIUM
  {
    id: 22,
    section: 'medium',
    question: 'Someone gives you your dream book in six formats. Your hand reaches for…',
    options: [
      { letter: 'A', text: 'The beautiful hardcover.', category: 'Legacy Edition' },
      { letter: 'B', text: 'The comfortable paperback.', category: 'Companion Edition' },
      { letter: 'C', text: 'The PDF.', category: 'Archive Edition' },
      { letter: 'D', text: 'The EPUB/e-book.', category: 'Infinite Edition' },
      { letter: 'E', text: 'The audiobook.', category: 'Living Voice' },
      { letter: 'F', text: 'Whichever format is most convenient.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 23,
    section: 'medium',
    question: 'You\'re travelling with only your phone. You have three hours to read. You…',
    options: [
      { letter: 'A', text: 'Wish you\'d brought the physical copy.', category: 'Legacy Edition' },
      { letter: 'B', text: 'Find a physical book when possible.', category: 'Companion Edition' },
      { letter: 'C', text: 'Open the PDF.', category: 'Archive Edition' },
      { letter: 'D', text: 'Download the e-book.', category: 'Infinite Edition' },
      { letter: 'E', text: 'Put on headphones and listen.', category: 'Living Voice' },
      { letter: 'F', text: 'Don\'t care as long as I can read or listen.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 24,
    section: 'medium',
    question: 'Which sounds oddly satisfying?',
    options: [
      { letter: 'A', text: 'Owning a beautiful edition that will outlive you.', category: 'Legacy Edition' },
      { letter: 'B', text: 'Carrying a battered book everywhere until it becomes part of you.', category: 'Companion Edition' },
      { letter: 'C', text: 'Having an entire archive of books at your fingertips.', category: 'Archive Edition' },
      { letter: 'D', text: 'Carrying hundreds of books inside one device.', category: 'Infinite Edition' },
      { letter: 'E', text: 'Hearing a great narrator make the words breathe.', category: 'Living Voice' },
      { letter: 'F', text: 'Switching effortlessly between formats.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 25,
    section: 'medium',
    question: 'Your relationship with a book is closest to…',
    options: [
      { letter: 'A', text: 'An heirloom.', category: 'Legacy Edition' },
      { letter: 'B', text: 'A companion.', category: 'Companion Edition' },
      { letter: 'C', text: 'An archive.', category: 'Archive Edition' },
      { letter: 'D', text: 'An infinite library.', category: 'Infinite Edition' },
      { letter: 'E', text: 'A voice telling me a story.', category: 'Living Voice' },
      { letter: 'F', text: 'A story that doesn\'t need one particular form.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 26,
    section: 'medium',
    question: 'You\'re offered one of these reading spaces:',
    options: [
      { letter: 'A', text: 'An old library with beautiful hardcovers.', category: 'Legacy Edition' },
      { letter: 'B', text: 'A cosy room with shelves of paperbacks.', category: 'Companion Edition' },
      { letter: 'C', text: 'A massive digital archive.', category: 'Archive Edition' },
      { letter: 'D', text: 'A futuristic library where every book is instantly accessible.', category: 'Infinite Edition' },
      { letter: 'E', text: 'A quiet room with excellent audio equipment.', category: 'Living Voice' },
      { letter: 'F', text: 'A magical library where books change format according to your mood.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 27,
    section: 'medium',
    question: 'What makes a book feel real to you?',
    options: [
      { letter: 'A', text: 'Being able to hold it.', category: 'Legacy Edition' },
      { letter: 'B', text: 'Having it beside me as a familiar companion.', category: 'Companion Edition' },
      { letter: 'C', text: 'Being able to preserve and retrieve it.', category: 'Archive Edition' },
      { letter: 'D', text: 'Being able to access it anywhere.', category: 'Infinite Edition' },
      { letter: 'E', text: 'Hearing its words spoken.', category: 'Living Voice' },
      { letter: 'F', text: 'The story itself not the container.', category: 'Boundless Edition' }
    ]
  },
  {
    id: 28,
    section: 'medium',
    question: 'Your reading rule is…',
    options: [
      { letter: 'A', text: 'Give me a beautiful physical edition.', category: 'Legacy Edition' },
      { letter: 'B', text: 'Give me something comfortable and familiar.', category: 'Companion Edition' },
      { letter: 'C', text: 'Give me searchable access to the text.', category: 'Archive Edition' },
      { letter: 'D', text: 'Give me my library wherever I go.', category: 'Infinite Edition' },
      { letter: 'E', text: 'Give me a voice and I\'ll give you my attention.', category: 'Living Voice' },
      { letter: 'F', text: 'Give me the story. I\'ll figure out the format.', category: 'Boundless Edition' }
    ]
  }
];

export function calculateZodiacChart(answers) {
  // Initialize sign totals
  const totals = { Titan: 0, Haven: 0, Matrix: 0, Oracle: 0, Scribe: 0, Votive: 0, Sage: 0 };
  let primaryElement = 'Imagination';
  let primaryRealm = 'Story';
  let primaryHouse = 'Mirror';
  let primaryMedium = 'Legacy Edition';

  // Process answers
  QUESTIONS.forEach((q, idx) => {
    const selectedOptionIdx = answers[idx];
    if (selectedOptionIdx === undefined || selectedOptionIdx === null) return;
    const option = q.options[selectedOptionIdx];
    if (!option) return;

    const section = q.section; // 'element' | 'realm' | 'house' | 'medium'
    const category = option.category;

    // Track chosen categories for Sun/Moon/Rising attribution
    if (idx === 0) primaryElement = category;
    if (idx === 7) primaryRealm = category;
    if (idx === 14) primaryHouse = category;
    if (idx === 21) primaryMedium = category;

    // Map section name to MATRIX key
    const matrixSectionKey = section.charAt(0).toUpperCase() + section.slice(1);
    const sectionMatrix = MATRIX[matrixSectionKey];

    if (sectionMatrix && sectionMatrix[category]) {
      const categoryPoints = sectionMatrix[category];
      Object.keys(categoryPoints).forEach(sign => {
        totals[sign] += categoryPoints[sign];
      });
    }
  });

  // Sort signs by score descending
  const sortedSigns = Object.keys(totals)
    .map(signKey => ({ signKey, score: totals[signKey] }))
    .sort((a, b) => b.score - a.score);

  // Check for ties in 1st place to apply Element tie-breaker
  let topSignObj = sortedSigns[0];
  let secondSignObj = sortedSigns[1];
  let thirdSignObj = sortedSigns[2];
  let isCusp = false;

  if (topSignObj.score === secondSignObj.score) {
    isCusp = true;
  }

  const sunSign = SIGNS[topSignObj.signKey];
  const moonSign = SIGNS[secondSignObj.signKey];
  const risingSign = SIGNS[thirdSignObj.signKey];

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
