export const CROSSING_CONFIG = {
  // 1. The Register (Required)
  signUpUrl: '/sign-up?callbackUrl=/crossing',

  // 2. The Watchtower
  whatsappChannel: process.env.NEXT_PUBLIC_CROSSING_WHATSAPP_CHANNEL || 'https://whatsapp.com/channel/0029Va7fhJv05MUYW6xOU20S',
  whatsappTv: process.env.NEXT_PUBLIC_CROSSING_WHATSAPP_TV || 'https://wa.me/2347046043294',

  // 3. The Gallery
  instagram: process.env.NEXT_PUBLIC_CROSSING_INSTAGRAM || 'https://www.instagram.com/paperthoughts.ng',
  founderInstagram: process.env.NEXT_PUBLIC_CROSSING_FOUNDER_INSTAGRAM || 'https://www.instagram.com/sixth_sage',
  tiktok: process.env.NEXT_PUBLIC_CROSSING_TIKTOK || 'https://www.tiktok.com/@paper_thoughts_',
  youtube: process.env.NEXT_PUBLIC_CROSSING_YOUTUBE || 'https://www.youtube.com/@Paper_Thoughts',
  facebook: process.env.NEXT_PUBLIC_CROSSING_FACEBOOK || 'https://www.facebook.com/share/18puj6p3F4/',

  // 4. The Archive
  x: process.env.NEXT_PUBLIC_CROSSING_X || 'https://x.com/_paper_thoughts',
  linkedin: process.env.NEXT_PUBLIC_CROSSING_LINKEDIN || 'https://www.linkedin.com/company/106589063/',
  discord: process.env.NEXT_PUBLIC_CROSSING_DISCORD || 'https://discord.gg/jEpF5frtH',

  whatsappGroup: process.env.NEXT_PUBLIC_CROSSING_WHATSAPP_GROUP || '#',
};

export const REALMS = {
  register: {
    id: 'register',
    name: 'THE REGISTER',
    narrative: 'The one non-negotiable — "sign your name in the book, or you were never here"',
    pointsPerWaypoint: 30,
    required: true,
    waypoints: [
      { id: 'app_signup', label: 'Sign up on the app', link: CROSSING_CONFIG.signUpUrl, external: false }
    ]
  },
  watchtower: {
    id: 'watchtower',
    name: 'THE WATCHTOWER',
    narrative: 'The signal fires — where we warn each other, where we witness each other',
    pointsPerWaypoint: 10,
    waypoints: [
      { id: 'whatsapp_channel', label: 'Join the Channel', link: CROSSING_CONFIG.whatsappChannel, external: true },
      { id: 'whatsapp_tv', label: 'Save the number', link: CROSSING_CONFIG.whatsappTv, external: true }
    ]
  },
  gallery: {
    id: 'gallery',
    name: 'THE GALLERY',
    narrative: 'Where the visions are kept — moving light, still frames',
    pointsPerWaypoint: 10,
    waypoints: [
      { id: 'instagram', label: 'Instagram', link: CROSSING_CONFIG.instagram, external: true },
      { id: 'linkedin', label: 'LinkedIn', link: CROSSING_CONFIG.linkedin, external: true },
      { id: 'youtube', label: 'YouTube', link: CROSSING_CONFIG.youtube, external: true },
      { id: 'tiktok', label: 'TikTok', link: CROSSING_CONFIG.tiktok, external: true }
    ]
  },
  archive: {
    id: 'archive',
    name: 'THE ARCHIVE',
    narrative: 'For the ones who want more than a glance — the long-form, the permanent record',
    pointsPerWaypoint: 10,
    waypoints: [
      { id: 'x', label: 'X', link: CROSSING_CONFIG.x, external: true },
      { id: 'discord', label: 'Discord', link: CROSSING_CONFIG.discord, external: true },
      { id: 'founder_instagram', label: 'Follow the Founder', link: CROSSING_CONFIG.founderInstagram, external: true },
      { id: 'facebook', label: 'Facebook', link: CROSSING_CONFIG.facebook, external: true }
    ]
  }
};

export const MAX_POINTS = 130;
export const MIN_PASSAGE_POINTS = 30; // Signing Register is exactly 30
export const GIFT_THRESHOLD_POINTS = 90;

export const ACCORD = [
  {
    num: 'I',
    title: 'Courtesy is the floor, not the ceiling',
    text: 'We disagree about books constantly — that\'s the whole point. Disagree about the writing. Never about the writer sitting across from you. No insults, no bullying, no discrimination, no exceptions.'
  },
  {
    num: 'II',
    title: 'Stay near the fire',
    text: 'This is a place for books, reading, writing, and the thinking that comes out of them. Wander if you must — every good conversation does — but don\'t build a permanent camp somewhere else.'
  },
  {
    num: 'III',
    title: 'Don\'t flood the signal',
    text: 'No spam, no chains, no clickbait, no wall-to-wall stickers and memes drowning out the actual thoughts. Say something, don\'t just make noise.'
  },
  {
    num: 'IV',
    title: 'Ask before you sell',
    text: 'Your book, your blog, your event, your business — we want to hear about it. Ask an admin first, or wait for the open floor. Uninvited promotion is the fastest way to make a room feel like a marketplace instead of a home.'
  },
  {
    num: 'V',
    title: 'Guard the twist',
    text: 'If the group is mid-read, hold your thoughts until it\'s time. A spoiler dropped early isn\'t a review — it\'s theft of someone else\'s ending.'
  },
  {
    num: 'VI',
    title: 'Respect the hands that made it',
    text: 'Never pass off another writer\'s work as your own. Share from real, legal sources. We\'re a room full of people who make things — we protect that, always.'
  },
  {
    num: 'VII',
    title: 'Argue the idea, not the person',
    text: 'Sharp critique is welcome. Cruelty is not. If a conversation turns from "I disagree with this argument" to "I have a problem with you" — that\'s the line, and we hold it.'
  },
  {
    num: 'VIII',
    title: 'No hate, no exceptions',
    text: 'Racism, sexism, tribalism, religious bigotry — none of it has a seat here, regardless of how it\'s dressed up.'
  },
  {
    num: 'IX',
    title: 'Tread carefully outside the page',
    text: 'Politics and religion can derail a room fast when they arrive uninvited. If they\'re genuinely part of the book on the table, welcome. If they\'re not, take it elsewhere.'
  },
  {
    num: 'X',
    title: 'What\'s shared here, stays yours to share — not ours to leak',
    text: 'Numbers, photos, private messages — nobody\'s business becomes group content without their say-so.'
  },
  {
    num: 'XI',
    title: 'Say it like you\'d want it heard',
    text: 'Civil language, please. This is a diverse room by design — speak like you know that.'
  },
  {
    num: 'XII',
    title: 'Name the machine',
    text: 'If AI helped shape your thought — summarizing, drafting, analyzing — say so. We want your voice first, tools declared honestly.'
  },
  {
    num: 'XIII',
    title: 'Walk at the group\'s pace',
    text: 'Reading timelines exist so no one\'s left behind or spoiled. Respect them, and respect the people still catching up.'
  },
  {
    num: 'XIV',
    title: 'If you\'re missing, say so',
    text: 'Can\'t make an event or a meeting? A short note beats a silent absence.'
  },
  {
    num: 'XV',
    title: 'Speak up, privately if it\'s heavy',
    text: 'Ideas for making this better are always wanted. If it\'s a concern about someone or something specific, bring it to an admin quietly, not into the group at large.'
  },
  {
    num: 'XVI',
    title: 'Trust the ones holding the room',
    text: 'Admins aren\'t here to police you — they\'re here to keep the floor from breaking under everyone\'s weight. If you disagree with a call, say so in private. Public disruption helps no one.'
  },
  {
    num: 'XVII',
    title: 'What happens if the Accord breaks',
    text: 'A reminder first. Then a warning. Then, if it continues, removal — because the room matters more than any one voice that won\'t hold to it.'
  }
];
