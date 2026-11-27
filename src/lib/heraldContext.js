import { Database } from '@/lib/db';
import { formatNigerianPhone } from '@/lib/herald';
import { getBooks } from '@/lib/data';

function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getUTCDay();
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) daysSinceSaturday += 7;
  const lastSaturday = new Date(now);
  lastSaturday.setUTCDate(now.getUTCDate() - daysSinceSaturday);
  lastSaturday.setUTCHours(0, 0, 0, 0);
  return lastSaturday;
}

function getVotingMonthYear() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export async function findUserByWhatsapp(rawPhone) {
  const clean = formatNigerianPhone(rawPhone);
  if (!clean) return null;
  const local0 = clean.startsWith('234') ? `0${clean.slice(3)}` : clean;
  const plus = `+${clean}`;

  return Database.queryOne(`
    SELECT id, full_name as "fullName", alias, reader_archetype as "readerArchetype",
           spendable_leaves as "spendableLeaves", lifetime_leaves as "lifetimeLeaves",
           milestone_tokens as "milestoneTokens", writing_streak as "writingStreak",
           panguin_stage as "panguinStage", membership_status as "membershipStatus",
           whatsapp
    FROM users
    WHERE whatsapp IN ($1, $2, $3)
    LIMIT 1
  `, [clean, local0, plus]).catch(() => null);
}

export async function getActivePromptData() {
  return Database.queryOne(`
    SELECT id, prompt_text as "promptText", prompt_type as "promptType", active_date as "activeDate"
    FROM prompts
    WHERE active_date <= CURRENT_DATE
    ORDER BY active_date DESC, id DESC
    LIMIT 1
  `).catch(() => null);
}

export async function getUpcomingGatheringsData(limit = 3) {
  return Database.query(`
    SELECT g.id, g.title, g.gathering_type as "gatheringType", g.event_date as "eventDate",
           g.start_time as "startTime", g.meet_url as "meetUrl", g.venue_name as "venueName",
           g.status,
           (SELECT COUNT(*) FROM gathering_rsvps r WHERE r.gathering_id = g.id)::int as "rsvpCount"
    FROM gatherings g
    WHERE g.event_date >= CURRENT_DATE AND g.status != 'cancelled'
    ORDER BY g.event_date ASC, g.start_time ASC NULLS LAST
    LIMIT $1
  `, [limit]).catch(() => []);
}

export async function getActiveBotmData() {
  const currentMonthYear = getVotingMonthYear();
  const [activeBook, cycle, topNominees] = await Promise.all([
    Database.queryOne(`
      SELECT id, title, author, teaser, price, purchase_link as "purchaseLink"
      FROM book_of_the_month
      WHERE active = TRUE
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `).catch(() => null),
    Database.queryOne(`
      SELECT voting_open as "votingOpen"
      FROM botm_cycles
      WHERE month_year = $1
    `, [currentMonthYear]).catch(() => null),
    Database.query(`
      SELECT s.title, s.author, COUNT(v.id)::int as "votesCount"
      FROM botm_suggestions s
      LEFT JOIN botm_votes v ON v.suggestion_id = s.id
      WHERE s.month_year = $1
      GROUP BY s.id, s.title, s.author
      ORDER BY "votesCount" DESC, s.created_at ASC
      LIMIT 3
    `, [currentMonthYear]).catch(() => [])
  ]);

  return {
    activeBook,
    votingOpen: Boolean(cycle?.votingOpen),
    monthYear: currentMonthYear,
    topNominees
  };
}

export async function getPendingReviewsData(excludeAuthorId = null, limit = 4) {
  const params = [];
  let excludeSql = '';
  if (excludeAuthorId) {
    params.push(excludeAuthorId);
    excludeSql = `AND s.author_id != $${params.length}`;
  }
  params.push(limit);

  const picks = await Database.query(`
    SELECT s.id, s.title, s.genre, s.logline, COUNT(pr.id)::int as "reviewCount"
    FROM submissions s
    LEFT JOIN peer_reviews pr ON pr.submission_id = s.id
    WHERE s.batch_status = 'active_batch'
      ${excludeSql}
    GROUP BY s.id, s.title, s.genre, s.logline
    HAVING COUNT(pr.id) < 3
    ORDER BY COUNT(pr.id) ASC, s.created_at DESC, s.id ASC
    LIMIT $${params.length}
  `, params).catch(() => []);

  const totalRes = await Database.queryOne(`
    SELECT COUNT(*)::int as total
    FROM (
      SELECT s.id
      FROM submissions s
      LEFT JOIN peer_reviews pr ON pr.submission_id = s.id
      WHERE s.batch_status = 'active_batch'
      GROUP BY s.id
      HAVING COUNT(pr.id) < 3
    ) sub
  `).catch(() => ({ total: picks.length }));

  return { picks, totalNeedingReviews: totalRes?.total || picks.length };
}

export async function searchStoreCatalog(query = '') {
  try {
    const books = await getBooks();
    const cleanQ = (query || '').trim().toLowerCase();
    const isInStock = (b) => !/(sold out|out of stock|unavailable)/i.test(b.status || '');

    if (!cleanQ) {
      const inStock = books.filter(isInStock);
      const featured = (inStock.filter(b => b.featured).length > 0 ? inStock.filter(b => b.featured) : inStock).slice(0, 4);
      return { query: '', matches: [], featured, totalBooks: books.length };
    }

    const terms = cleanQ.split(/\s+/).filter(t => t.length > 1);
    const matches = books
      .filter(b => {
        const hay = `${b.title || ''} ${b.author || ''} ${b.genre || ''}`.toLowerCase();
        return hay.includes(cleanQ) || (terms.length > 0 && terms.every(t => hay.includes(t)));
      })
      .slice(0, 5);

    return { query: query.trim(), matches, featured: [], totalBooks: books.length };
  } catch (err) {
    console.error('[Herald Context] Bookstore lookup failed:', err.message);
    return { query: query.trim(), matches: [], featured: [], totalBooks: 0, error: true };
  }
}

export async function getMemberWeeklyPassport(rawPhone) {
  const user = await findUserByWhatsapp(rawPhone);
  if (!user) return { user: null };

  const lastSaturday = getLastSaturdayStart();
  const [subRow, revRow] = await Promise.all([
    Database.queryOne(`
      SELECT COUNT(*)::int as c FROM submissions
      WHERE author_id = $1 AND created_at >= $2
    `, [user.id, lastSaturday]).catch(() => ({ c: 0 })),
    Database.queryOne(`
      SELECT COUNT(*)::int as c FROM peer_reviews
      WHERE reviewer_id = $1 AND created_at >= $2
    `, [user.id, lastSaturday]).catch(() => ({ c: 0 }))
  ]);

  return {
    user,
    weeklySubmitted: (subRow?.c || 0) > 0,
    weeklyReviews: revRow?.c || 0
  };
}

/**
 * Grounded snapshot fed into Gemini when @Herald answers open natural-language questions
 */
export async function buildHeraldOracleContext(question = '') {
  const shouldSearchStore = /(book|store|buy|price|cost|naira|stock|copy|hardcopy|have|sell|read|title|find)/i.test(question);
  const storeQuery = question
    .replace(/\b(do you have|is there|how much is|in the store|in stock|bookstore|paper thoughts|find me|looking for|can i buy|the book|a book|by|herald|please|for me)\b/gi, ' ')
    .replace(/[?!.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const [prompt, gatherings, botm, reviewsInfo, storeInfo] = await Promise.all([
    getActivePromptData(),
    getUpcomingGatheringsData(2),
    getActiveBotmData(),
    getPendingReviewsData(null, 3),
    shouldSearchStore && storeQuery.length >= 2 ? searchStoreCatalog(storeQuery) : Promise.resolve(null)
  ]);

  return {
    clubRules: {
      paperLeaves: '1 Leaf = ₦10 discount/credit in the Paper Thoughts Bookstore. Earned via weekly prompt submission (+5 Leaves), peer critiques (+5 Leaves baseline +10 when confirmed helpful), or bundles.',
      weeklyCycle: 'Writing submissions lock Friday at 11:59 PM WAT. Reviews award Milestone Tokens (1.5 in Early-Bird Saturday window, 1.0 afterwards).',
      townhall: 'Thursday at 8:15 PM WAT on Google Meet / X Spaces.',
      commands: ['/prompt', '/reviews', '/botm', '/store <title>', '/events', '/me', '/commands']
    },
    activePrompt: prompt?.promptText || null,
    activeBotm: botm?.activeBook ? `${botm.activeBook.title} by ${botm.activeBook.author}` : null,
    botmVotingOpen: botm?.votingOpen || false,
    upcomingEvents: gatherings.map(g => ({
      title: g.title,
      type: g.gatheringType,
      date: g.eventDate,
      time: g.startTime ? g.startTime.slice(0, 5) + ' WAT' : '8:15 PM WAT',
      venue: g.meetUrl || g.venueName || 'Google Meet'
    })),
    pendingManuscriptsToReview: reviewsInfo.totalNeedingReviews,
    bookstoreMatches: storeInfo?.matches?.map(b => `${b.title} by ${b.author} — ₦${b.price} (${b.status})`) || []
  };
}
