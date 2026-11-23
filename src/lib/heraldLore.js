/**
 * Paper Thoughts Herald Lore Engine
 * Combines Google Gemini Flash for dynamic literary charm with a rich, deterministic local fallback bank.
 */

const LITERARY_QUOTES = [
  { quote: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { quote: "You think your pain is unprecedented in the history of the world, but then you read.", author: "James Baldwin" },
  { quote: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
  { quote: "The world was hers for the reading.", author: "Betty Smith" },
  { quote: "Books are a uniquely portable magic.", author: "Stephen King" },
  { quote: "Storytellers are the memory keepers of humanity.", author: "Chinua Achebe" },
  { quote: "We read to know we're not alone.", author: "C.S. Lewis" },
  { quote: "Words can be like X-rays if you use them properly—they’ll go through anything.", author: "Aldous Huxley" }
];

function getRandomQuote() {
  return LITERARY_QUOTES[Math.floor(Math.random() * LITERARY_QUOTES.length)];
}

/**
 * Helper to detect missing or placeholder Google Meet / chamber URLs
 */
export function isPlaceholderMeetUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ||
    trimmed === 'https://meet.google.com' ||
    trimmed === 'https://meet.google.com/' ||
    trimmed === 'https://x.com' ||
    trimmed === 'https://x.com/' ||
    /placeholder|pt-townhall|pt-botm|pt-book-banter|example|your-link|tbd|tba|none|n\/a|xxx-xxx/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

/**
 * Low-level Gemini Flash Caller
 */
async function callGeminiProse(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MISSING') return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * 1. Midnight Birthday Toast
 */
export async function getBirthdayToast({ fullName, alias, readerArchetype }) {
  const name = alias ? `@${alias}` : fullName;
  const archetype = readerArchetype ? ` (The ${readerArchetype})` : '';

  const aiProse = await callGeminiProse(
    "You are The Herald, the poetic town crier of Paper Thoughts book club. Write a warm, inspiring 3-sentence midnight birthday toast for a community member. Use evocative literary vocabulary (ink, candles, stories, fellowship). Include 2 tasteful emojis. Format using WhatsApp bolding (*word*).",
    `Celebrant: ${name}${archetype}`
  );

  if (aiProse) return aiProse;

  // Local Fallback
  const q = getRandomQuote();
  return `🕯️ *The Midnight Toast of Paper Thoughts* 🕯️\n\n` +
    `Kindred minds, the stars align tonight as we celebrate the birth of our fellow pilgrim, *${name}*${archetype}!\n\n` +
    `_"${q.quote}"_ — ${q.author}\n\n` +
    `May your upcoming year be penned in vibrant ink, filled with profound stories, and embraced by peaceful pages. Leave your warmest wishes below! 🥂📚✨`;
}

/**
 * 2. Real-Time Manuscript Spotlight
 */
export function getSubmissionSpotlight({ title, genre, logline, submissionId }) {
  const reviewUrl = `https://paperthoughts.org/dashboard/review?submissionId=${submissionId}`;

  return `📜 *A New Manuscript Placed Upon the Altar!*\n\n` +
    `A fellow scribe has braved the white page and shared their art with the fellowship:\n\n` +
    `*Title:* "${title}"\n` +
    `*Genre:* ${genre}\n` +
    `*Logline:* _"${logline}"_\n\n` +
    `Who will step forward as their first mirror?\n` +
    `👉 Step into the review crucible: ${reviewUrl}`;
}

/**
 * 3. Townhall Gathering Alerts (Thursdays)
 */
export function getTownhallAlert({ title, meetUrl, isFinalCall = false }) {
  const isPlaceholder = isPlaceholderMeetUrl(meetUrl);
  const validMeetUrl = !isPlaceholder ? meetUrl.trim() : null;

  if (isFinalCall) {
    return `🔔 *Final Call: The Townhall Begins in 30 Minutes!* 🔔\n\n` +
      `Gather your tea and take your seat in the salon. *${title || 'Our Weekly Literary Salon'}* opens its doors at 8:15 PM sharp.\n\n` +
      `👉 Enter the Google Meet: ${validMeetUrl || 'Link will be shared in the salon prior to gathering'}\n\n` +
      `See you within, kindred minds! 🕯️`;
  }

  return `🏛️ *The Thursday Townhall Approaches* 🏛️\n\n` +
    `Tonight at *8:15 PM*, our fellowship gathers for *${title || 'Weekly Literary Discussion'}*.\n\n` +
    `Clear your evening, bring your reflections, and prepare for inspiring book banter.\n` +
    `Meeting Link: ${validMeetUrl || 'Link will be shared in the salon prior to gathering'}\n\n` +
    `Mark your calendars! ✨`;
}

/**
 * 4. Weekly Writing Prompt Drop (Mondays)
 */
export function getPromptDrop({ promptText, promptType = 'story' }) {
  const submissionUrl = `https://paperthoughts.org/dashboard`;

  return `🖋️ *The Monday Spark: New Weekly Writing Prompt* 🖋️\n\n` +
    `Writers, storytellers, and poets—your canvas for the week has arrived:\n\n` +
    `*"${promptText}"*\n\n` +
    `Format: *${promptType.toUpperCase()}*\n` +
    `Submit your draft before Friday midnight to protect your writing streak!\n\n` +
    `👉 Draft your submission on Paper Thoughts: ${submissionUrl}`;
}

/**
 * 5. Friday Critique Countdown
 */
export function getFridayCritiqueAlert({ unreviewedManuscripts = [] }) {
  const count = unreviewedManuscripts.length;
  const reviewUrl = `https://paperthoughts.org/dashboard/review`;

  let listText = '';
  if (count > 0) {
    listText = `\n` + unreviewedManuscripts.slice(0, 5).map((m, i) => `${i + 1}. *"${m.title}"* (${m.genre})`).join('\n') + `\n`;
    if (count > 5) listText += `...and ${count - 5} other manuscripts\n`;
  }

  return `⏳ *Final Critique Bell: The Current Batch Closes Soon!* ⏳\n\n` +
    `Before the weekend batch archives, our writers need your feedback. ` +
    `Remember our core fellowship principle: *Every member must review at least one piece a month.*\n` +
    `${listText}\n` +
    `Step into the review desk and leave your constructive mirror:\n` +
    `👉 ${reviewUrl}`;
}

/**
 * 6. New Member Welcome Greeting
 */
export function getNewMemberGreeting({ phone }) {
  const tag = `@${phone}`;
  const onboardUrl = `https://paperthoughts.org/zodiac`;

  return `✨ *Welcome to the Sanctuary, ${tag}!* ✨\n\n` +
    `We are delighted to welcome you to the Paper Thoughts literary fellowship. Here, stories are cherished, writers are nurtured, and kindred minds meet.\n\n` +
    `To break the ice, we would love to know:\n` +
    `1. *Your Name or Pen Name*\n` +
    `2. *The book currently living on your nightstand*\n` +
    `3. *What brought you to Paper Thoughts?*\n\n` +
    `Claim your profile and discover your Literary Zodiac archetype here:\n` +
    `👉 ${onboardUrl}\n\n` +
    `📌 *Important First Step*: Please save my contact as *Paper Thoughts Herald* so you never miss a sanctuary bell, weekly prompt, or Thursday Townhall link on your WhatsApp Status and updates!\n\n` +
    `Make yourself at home! 📖🕯️`;
}

/**
 * 6b. New Member Introduction Recognition Reply
 */
export function getNewMemberIntroReply({ senderName, phone }) {
  const nameDisplay = senderName ? senderName : (phone ? `@${phone}` : 'pilgrim');
  return `Welcome to the fellowship, ${nameDisplay}! May your time in the sanctuary be legendary. 🕯️📖\n\n` +
    `📌 _(Please save my contact as *Paper Thoughts Herald* so you receive sanctuary announcements, writing sparks, and Thursday Townhall links on your WhatsApp status and updates!)_`;
}

/**
 * 7. Answer community queries via Gemini Flash
 */
export async function getHeraldOracleAnswer(userQuestion, senderName = 'Pilgrim') {
  const systemPrompt = `You are The Herald, the witty, warm, and highly erudite literary town crier and salon master for Paper Thoughts book club.
Respond to the member in 2-3 concise, charming sentences.
Ground your response in literary wisdom, warmth, and fellowship.
Format using WhatsApp bolding (*word*). Include 1-2 tasteful literary emojis (📖, 🕯️, ☕, ✨).`;

  const aiAnswer = await callGeminiProse(systemPrompt, `Member (${senderName}) asks: "${userQuestion}"`);
  if (aiAnswer) return aiAnswer;

  const q = getRandomQuote();
  return `Kindred mind, as ${q.author} once wrote: _"${q.quote}"_\nKeep your pages open and your pen sharp! 🕯️📖`;
}

/**
 * 8. New Gathering / Event Proclamation (Broadcast with @everyone tag)
 */
export function getNewEventProclamation({ title, gatheringType, eventDate, startTime, meetUrl, venueName, gatheringId, description }) {
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Lagos',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Upcoming';

  const timeDisplay = startTime ? startTime.slice(0, 5) : '8:15 PM';
  const typeDisplay = (gatheringType || 'Townhall').replace('_', ' ').toUpperCase();
  const eventUrl = `https://paperthoughts.org/events`;

  const isPlaceholder = isPlaceholderMeetUrl(meetUrl);
  let chamber;
  if (!isPlaceholder) {
    chamber = meetUrl.trim();
  } else if (gatheringType === 'book_banter' || /spaces/i.test(venueName || '')) {
    chamber = 'X Spaces (Link will be shared in the salon prior to gathering)';
  } else if (venueName && !/online|google meet|virtual/i.test(venueName)) {
    chamber = venueName.trim();
  } else {
    chamber = 'Google Meet (Link will be shared in the salon prior to gathering)';
  }

  return `🏛️ *Hear Ye, Kindred Fellowship! A New Gathering is Proclaimed!* 🏛️\n\n` +
    `@all\n\n` +
    `The sanctuary wardens have opened the chambers for our next ritual:\n\n` +
    `✦ *Ritual:* *"${title}"*\n` +
    `✦ *Type:* ${typeDisplay}\n` +
    `✦ *Date:* ${formattedDate}\n` +
    `✦ *Time:* ${timeDisplay} WAT\n` +
    `✦ *Sanctuary Chamber:* ${chamber}\n\n` +
    (description ? `_${description.slice(0, 200)}${description.length > 200 ? '...' : ''}_\n\n` : '') +
    `👉 *RSVP & Claim Your Seat Upon the Altar*:\n${eventUrl}\n\n` +
    `Mark your scrolls, brew your tea, and bring your reflections! 🕯️📜✨`;
}

/**
 * 9. Creative Writing & Reading Boost (/boost)
 */
export async function getLiteraryBoost({ senderName = 'Kindred Pilgrim' }) {
  const systemPrompt = `You are The Herald, the impassioned, poetic literary town crier and salon master of Paper Thoughts book club.
Deliver an electrifying, poetic 2-3 sentence creative boost to inspire a fellow scribe or reader to conquer the page or finish their chapter today.
Use rich evocative imagery (ink, embers, midnight candle, untamed courage). Include 1-2 emojis (⚡, 🕯️, 🖋️, 📖). Format using WhatsApp bolding (*word*).`;

  const aiProse = await callGeminiProse(systemPrompt, `Pilgrim name: ${senderName}`);
  if (aiProse) return aiProse;

  // Local Fallback
  const q = getRandomQuote();
  return `⚡ *The Herald's Spark of Fire* ⚡\n\n` +
    `*${senderName}*, the blank page is not an abyss—it is an unmapped continent waiting for your footprints. ` +
    `Pick up your pen or open your book tonight. Ten minutes of fierce devotion will outshine hours of hesitation.\n\n` +
    `_"${q.quote}"_ — ${q.author}\n\n` +
    `Go make the ink bleed! 🖋️🔥`;
}

/**
 * 10. Community Reading & Writing Goal Commitment (/goal)
 */
export async function getGoalPrompt({ senderName = 'Kindred Pilgrim' }) {
  const systemPrompt = `You are The Herald, guardian of Paper Thoughts sanctuary rituals.
Give a sharp, encouraging 2-sentence accountability prompt challenging a member to set and declare their reading or writing goal for today.
Mention protecting their streak before Friday. Include 1-2 emojis (🎯, 📜, ⏳). Format using WhatsApp bolding (*word*).`;

  const aiProse = await callGeminiProse(systemPrompt, `Pilgrim name: ${senderName}`);
  if (aiProse) return aiProse;

  // Local Fallback
  return `🎯 *The Sanctuary Accountability Ledger* 🎯\n\n` +
    `*${senderName}*, words spoken into the void vanish, but commitments forged in fellowship endure. What is your pledge today?\n\n` +
    `• *Reading*: 1 chapter / 30 pages\n` +
    `• *Writing*: 300 words / 1 polished scene\n` +
    `• *Critique*: Reviewing 1 manuscript in the queue\n\n` +
    `Declare your target below and hold yourself to the altar! Submit before Friday midnight to protect your writing streak: https://paperthoughts.org/dashboard ⏳🕯️`;
}

/**
 * 11. Live Gathering Alert (When meeting goes live / doors open)
 */
export function getGatheringLiveAlert({ title, gatheringType, meetUrl, venueName }) {
  const isPlaceholder = isPlaceholderMeetUrl(meetUrl);
  let chamber;
  if (!isPlaceholder) {
    chamber = meetUrl.trim();
  } else if (gatheringType === 'book_banter' || /spaces/i.test(venueName || '')) {
    chamber = 'X Spaces (Link in the salon)';
  } else if (venueName && !/online|google meet|virtual/i.test(venueName)) {
    chamber = venueName.trim();
  } else {
    chamber = 'Google Meet (Link in the salon)';
  }

  return `🔴 *The Salon Doors are Open: We Are LIVE!* 🔴\n\n` +
    `@all\n\n` +
    `Kindred minds, the chambers have opened for *"${title || 'Our Literary Gathering'}"*!\n\n` +
    `👉 *Enter the Chamber Now*:\n${chamber}\n\n` +
    `👉 *Tap to Confirm Attendance & Claim Leaves*:\nhttps://paperthoughts.org/events\n\n` +
    `Take your seats—the salon discussion begins now! 🕯️☕✨`;
}

