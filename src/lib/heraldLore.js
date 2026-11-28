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
export async function callGeminiProse(systemPrompt, userPrompt, { temperature = 0.7, maxOutputTokens = 800, timeoutMs = 7000 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MISSING') return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
          temperature,
          maxOutputTokens,
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
    "You are The Panguin 🐧, the witty, warm literary companion of Paper Thoughts book club. Write a warm, inspiring 3-sentence midnight birthday toast for a community member so the whole group feels moved to celebrate them. Use evocative literary vocabulary (ink, candles, stories, fellowship). Include 2 tasteful emojis. Format using WhatsApp bolding (*word*).",
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
 * 6. New Member Welcome Greeting (Warm Option A + The Panguin persona)
 */
export function getNewMemberGreeting({ phone }) {
  const tag = `@${phone}`;
  const onboardUrl = `https://paperthoughts.org/zodiac`;

  return `Hey ${tag} — pull up a chair and welcome to *Paper Thoughts*! 🐧✨\n\n` +
    `You've just wandered into a corner of the internet where people still argue passionately about books, trade honest feedback on each other's drafts, and celebrate good writing.\n\n` +
    `Whenever you're settled, say hi and tell us what name you go by, what you're currently reading (or avoiding on your nightstand!), and what brought you here.\n\n` +
    `One tiny favor: *save my number as The Panguin* so our prompts, Townhall links, and group updates show up cleanly for you. And whenever you're ready to explore & claim your Literary Zodiac:\n` +
    `👉 ${onboardUrl} 📖🕯️`;
}

/**
 * 6b. New Member Introduction Recognition Reply
 */
export function getNewMemberIntroReply({ senderName, phone }) {
  const nameDisplay = senderName ? senderName : (phone ? `@${phone}` : 'friend');
  return `So glad you're here, ${nameDisplay}! Pull up a mug and make yourself right at home. 🐧📖🕯️\n\n` +
    `_(Quick reminder: save my number as *The Panguin* so prompts, feedback bells, and Thursday Townhall updates always reach you cleanly!)_`;
}

/**
 * 7. Answer community queries via Gemini Flash
 */
export async function getHeraldOracleAnswer(userQuestion, senderName = 'Pilgrim', clubContext = null) {
  const systemPrompt = `You are The Panguin 🐧, the warm, witty, and deeply well-read literary companion of Paper Thoughts book club.
Answer the member's question in 2-4 concise sentences grounded strictly in the live Paper Thoughts context JSON when relevant (never invent events, prices, or club facts not present in the context).
If the question is a general book recommendation or craft question, give thoughtful literary insight.
Tell members they can also use */commands* for quick lookups (*/prompt*, */reviews*, */botm*, */store*, */events*, */me*).
Format using WhatsApp bolding (*word*). Include 1-2 tasteful emojis (🐧, 📖, 🕯️, ☕, ✨).`;

  const userMsg = clubContext
    ? `Member (${senderName}) asks: "${userQuestion}"\n\nLive Paper Thoughts Context:\n${JSON.stringify(clubContext)}`
    : `Member (${senderName}) asks: "${userQuestion}"`;

  const aiAnswer = await callGeminiProse(systemPrompt, userMsg);
  if (aiAnswer) return aiAnswer;

  // Deterministic grounded fallback if Gemini is unavailable
  if (clubContext?.bookstoreMatches?.length > 0) {
    return `📚 *From the Paper Thoughts Bookstore*:\n${clubContext.bookstoreMatches.slice(0, 3).map(m => `• ${m}`).join('\n')}\n\nBrowse & order with cash or Paper Leaves: https://paperthoughts.org/bookstore 📖`;
  }
  const q = getRandomQuote();
  return `Kindred mind, as ${q.author} once wrote: _"${q.quote}"_\nTry */commands* for quick shortcuts (*/prompt*, */reviews*, */botm*, */store*, */events*, */me*)! 🕯️📖`;
}

/**
 * Utility Formatters for Town Hall Slash Commands
 */
export function formatBotmReply({ activeBook, votingOpen, monthYear, topNominees = [] }) {
  if (!activeBook && !votingOpen) {
    return `📚 *Book of the Month*\n\nNo Book of the Month is currently active. Check Nominations or Discussion at:\n👉 https://paperthoughts.org/discussion`;
  }

  let msg = `📚 *Paper Thoughts Book of the Month* 📚\n\n`;
  if (activeBook) {
    msg += `*${activeBook.title}*\n_by ${activeBook.author || 'Community Pick'}_\n`;
    if (activeBook.teaser) {
      msg += `\n_"${activeBook.teaser.slice(0, 220)}${activeBook.teaser.length > 220 ? '...' : ''}"_\n`;
    }
  }

  if (votingOpen && topNominees.length > 0) {
    msg += `\n🗳️ *${monthYear} Voting is LIVE!* Top contenders:\n`;
    msg += topNominees.map((n, i) => `${i + 1}. *${n.title}* (${n.votesCount} votes)`).join('\n') + `\n`;
  }

  msg += `\n👉 Read reviews & join discussion:\nhttps://paperthoughts.org/discussion 🕯️`;
  return msg;
}

export function formatStoreReply({ query, matches = [], featured = [], error = false }) {
  if (error) {
    return `⚠️ Could not reach the Bookstore catalog right now. Browse directly at:\n👉 https://paperthoughts.org/bookstore`;
  }

  const formatLine = (b) => {
    const priceNum = parseInt(String(b.price || '0').replace(/\D/g, ''), 10) || 0;
    const leavesCost = priceNum > 0 ? Math.ceil(priceNum / 10) : 0;
    const critiquesHint = leavesCost > 0 ? ` _(~${Math.ceil(leavesCost / 15)} helpful critiques)_` : '';
    const stockEmoji = /(sold out|out of stock|unavailable)/i.test(b.status || '') ? '❌' : '✅';
    return `• *${b.title}*${b.author ? ` — ${b.author}` : ''}\n  ${stockEmoji} ${b.status || 'In Stock'} | *₦${priceNum.toLocaleString()}* (${leavesCost} 🍃${critiquesHint})`;
  };

  if (query) {
    if (matches.length === 0) {
      return `🔎 No matches for *"${query}"* in the Bookstore.\nTry a shorter title or author keyword (e.g. */store achebe*), or browse the full shelf:\n👉 https://paperthoughts.org/bookstore 📖`;
    }
    return `🛍️ *Bookstore Results for "${query}"*:\n\n${matches.map(formatLine).join('\n\n')}\n\n💡 _1 Paper Leaf = ₦10 discount at checkout!_\n👉 Order here: https://paperthoughts.org/bookstore`;
  }

  const picksText = featured.length > 0
    ? featured.map(formatLine).join('\n\n')
    : 'Visit the Bookstore to explore all available hardcopies.';

  return `🛍️ *Paper Thoughts Hardcopy Bookstore* 🛍️\n\n${picksText}\n\n🔎 Search any title with */store <title or author>*\n👉 Full shelf: https://paperthoughts.org/bookstore 📚`;
}

export function formatEventsReply({ gatherings = [] }) {
  if (!gatherings || gatherings.length === 0) {
    return `🏛️ *Upcoming Paper Thoughts Gatherings*\n\nNo upcoming scheduled events right now — Thursday Townhall details drop soon!\n👉 https://paperthoughts.org/events 🕯️`;
  }

  const lines = gatherings.map((g, idx) => {
    const dateStr = g.eventDate ? new Date(g.eventDate).toLocaleDateString('en-GB', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }) : 'Upcoming';
    const timeStr = g.startTime ? `${g.startTime.slice(0, 5)} WAT` : '8:15 PM WAT';
    const typeLabel = (g.gatheringType || 'Townhall').replace(/_/g, ' ').toUpperCase();
    const isPh = isPlaceholderMeetUrl(g.meetUrl);
    const chamber = !isPh
      ? g.meetUrl.trim()
      : (g.gatheringType === 'book_banter' || /spaces/i.test(g.venueName || '') ? 'X Spaces' : (g.venueName || 'Google Meet'));
    const liveTag = g.status === 'live' ? ' 🔴 LIVE' : '';
    return `${idx + 1}. *"${g.title}"* (${typeLabel})${liveTag}\n   📅 ${dateStr} • ⏰ ${timeStr}\n   📍 ${chamber} • 🎟️ ${g.rsvpCount || 0} RSVPs`;
  }).join('\n\n');

  return `🏛️ *Upcoming Sanctuary Gatherings* 🏛️\n\n${lines}\n\n👉 RSVP & check in to earn Leaves:\nhttps://paperthoughts.org/events 🕯️✨`;
}

export function formatReviewsReply({ picks = [], totalNeedingReviews = 0 }) {
  if (!picks || picks.length === 0) {
    return `✨ *The Critique Corner is Caught Up!*\nEvery active manuscript currently has 3+ reviews. Draft your own piece or visit:\n👉 https://paperthoughts.org/dashboard/review`;
  }

  const blindMatch = picks[0];
  const others = picks.slice(1, 3);

  let msg = `📝 *Blind Critique Match & Review Queue* (${totalNeedingReviews} open)\n\n`;
  msg += `🎯 *Your Blind Pick* (*${blindMatch.reviewCount}/3 reviews*):\n` +
    `*"${blindMatch.title}"* (${blindMatch.genre})\n` +
    (blindMatch.logline ? `_${blindMatch.logline.slice(0, 120)}${blindMatch.logline.length > 120 ? '...' : ''}_\n` : '') +
    `👉 Review now (+5 🍃, +10 🍃 if helpful): https://paperthoughts.org/dashboard/review?submissionId=${blindMatch.id}\n`;

  if (others.length > 0) {
    msg += `\n📌 *Also awaiting eyes:*\n` + others.map(w => `• *"${w.title}"* (${w.genre}, ${w.reviewCount}/3) 👉 https://paperthoughts.org/dashboard/review?submissionId=${w.id}`).join('\n');
  }

  return msg;
}

export function formatPassportDM({ user, weeklySubmitted, weeklyReviews }) {
  if (!user) {
    return `🕯️ *Paper Thoughts Sanctuary Passport*\n\nWe couldn't find your WhatsApp number linked to an Archive profile yet!\nAdd your WhatsApp number inside your Dashboard profile settings to unlock private stats:\n👉 https://paperthoughts.org/dashboard 📖`;
  }

  const leaves = parseInt(user.spendableLeaves || 0, 10);
  const nairaVal = leaves * 10;
  const streak = parseInt(user.writingStreak || 0, 10);
  const tokens = parseFloat(user.milestoneTokens || 0);
  const stage = parseInt(user.panguinStage || 1, 10);
  const archetype = user.readerArchetype || 'Wandering Scribe';

  return `🪪 *Sanctuary Passport: ${user.alias ? `@${user.alias}` : user.fullName}* 🕯️\n\n` +
    `✦ *Identity:* ${archetype} (🐧 Stage ${stage})\n` +
    `✦ *Paper Leaves:* *${leaves} 🍃* _(Worth ₦${nairaVal.toLocaleString()} in the Bookstore)_\n` +
    `✦ *Writing Streak:* *${streak} week${streak === 1 ? '' : 's'}* 🔥\n` +
    `✦ *Milestone Tokens:* *${tokens.toFixed(1)} / 10.0*\n\n` +
    `📅 *This Week's Progress:*\n` +
    `• Weekly Prompt Submission: ${weeklySubmitted ? '✅ Submitted!' : '⏳ Pending (locks Fri 11:59 PM)'}\n` +
    `• Peer Critiques Completed: *${weeklyReviews}* ${weeklyReviews > 0 ? '✨' : '_(Try /reviews to earn 🍃!)_'}\n\n` +
    `👉 Dashboard: https://paperthoughts.org/dashboard`;
}

export function formatCommandsDirectory() {
  return `🐧 *The Panguin's Town Hall Commands* 🐧\n\n` +
    `Use any command directly (or tag *@Panguin* with a question):\n\n` +
    `• */prompt* — This week's writing prompt & deadline\n` +
    `• */reviews* — Blind Critique Match & manuscripts needing eyes\n` +
    `• */botm* — Book of the Month & voting status\n` +
    `• */store <title>* — Check Bookstore stock & price in ₦ / 🍃\n` +
    `• */events* — Upcoming Townhalls & gatherings\n` +
    `• */me* — Private DM of your Leaves, streak & weekly progress\n` +
    `• *@Panguin <question>* — Ask about club rules or book recs!\n\n` +
    `_May your pages stay full._ 🐧📖`;
}

export function getWednesdayNudge({ promptText }) {
  const promptSnippet = promptText
    ? `\n\n🖋️ *This Week's Spark:*\n_"${promptText.slice(0, 180)}${promptText.length > 180 ? '...' : ''}"_\n`
    : '';
  return `✍️ *Mid-Week Ink Check in the Village!* ✍️\n\n` +
    `We are halfway to Friday's midnight cutoff! Even 10 rough minutes of drafting counts — polish later, ink today.` +
    `${promptSnippet}\n👉 Open your draft desk: https://paperthoughts.org/dashboard/write 🕯️`;
}

export function getSaturdayBotmNudge({ bookTitle, bookAuthor, teaser }) {
  return `📚 *Weekend Reading Lounge is Open!* ☕\n\n` +
    (bookTitle
      ? `Settle in with this month's fellowship read:\n✦ *${bookTitle}*${bookAuthor ? ` by ${bookAuthor}` : ''}\n${teaser ? `_"${teaser.slice(0, 180)}${teaser.length > 180 ? '...' : ''}"_\n\n` : '\n'}`
      : '') +
    `Also: Early-Bird Critique Window is open in the Workshop (earn *1.5 Milestone Tokens* + Leaves today!).\n` +
    `👉 BOTM Lounge: https://paperthoughts.org/discussion\n👉 Review Queue: https://paperthoughts.org/dashboard/review 📖✨`;
}

export function getWeeklyLaurelBroadcast({ title, genre, penName, reason }) {
  return `🏆 *The Weekly Sanctuary Laurel is Crowned!* 🏆\n\n` +
    `Join us in celebrating this week's standout manuscript from the Writers' Village:\n\n` +
    `✦ *Title:* *"${title}"* (${genre})\n` +
    `✦ *Author:* *${penName || 'Anonymous Scribe'}*\n` +
    (reason ? `✦ *Editorial Citation:* _${reason}_\n\n` : '\n') +
    `👉 Read & tip Leaves in the Living Salon:\nhttps://paperthoughts.org/village/gallery 🕯️📖✨`;
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
 * 9. Live Gathering Alert (When meeting goes live / doors open)
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

