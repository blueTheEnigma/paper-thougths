import { Database } from './db';

/**
 * Returner's Crossing & Governance State Engine
 * Manages membership statuses, sabbatical shields, strike counters,
 * and the 3-gate Returner's Journey for exiled members.
 */

export const RETURNER_GATES = {
  PEER_REVIEWS_REQUIRED: 3,
  BOTM_REVIEWS_REQUIRED: 1,
  PETITION_MIN_WORDS: 30,
};

/**
 * Get the current Returner's Crossing progress for a member.
 */
export async function getReturnerCrossingProgress(userId) {
  const user = await Database.queryOne(`
    SELECT id, full_name, email, membership_status, probation_strikes_this_year,
           consecutive_botm_misses, silver_bullets, sabbatical_until,
           evicted_at, returner_petition, returner_petition_submitted_at
    FROM users 
    WHERE id = $1
  `, [userId]);

  if (!user) {
    throw new Error('User not found');
  }

  const isEvicted = user.membership_status === 'evicted';
  const evictedAt = user.evicted_at ? new Date(user.evicted_at) : new Date(0);

  // Active Book of the Month for Gate 2 reference
  const activeBotm = await Database.queryOne(`
    SELECT id, title, author, image_url, teaser 
    FROM book_of_the_month 
    WHERE active = TRUE 
    ORDER BY created_at DESC 
    LIMIT 1
  `);

  // Gate 1: 3 Backlog Peer Reviews completed since eviction
  const peerReviewsRes = await Database.queryOne(`
    SELECT COUNT(*) as count 
    FROM peer_reviews 
    WHERE reviewer_id = $1 AND created_at >= $2
  `, [userId, evictedAt]);
  const peerReviewsCompleted = parseInt(peerReviewsRes?.count || 0, 10);

  // Gate 2: 1 Book of the Month Review completed since eviction
  const botmReviewsRes = await Database.queryOne(`
    SELECT COUNT(*) as count 
    FROM book_of_the_month_reviews 
    WHERE user_id = $1 AND created_at >= $2
  `, [userId, evictedAt]);
  const botmReviewsCompleted = parseInt(botmReviewsRes?.count || 0, 10);

  // Gate 3: Written Reflection Petition
  const petitionText = user.returner_petition || '';
  const petitionWords = petitionText.trim() ? petitionText.trim().split(/\s+/).filter(Boolean).length : 0;
  const isPetitionComplete = petitionWords >= RETURNER_GATES.PETITION_MIN_WORDS;

  const gate1Passed = peerReviewsCompleted >= RETURNER_GATES.PEER_REVIEWS_REQUIRED;
  const gate2Passed = botmReviewsCompleted >= RETURNER_GATES.BOTM_REVIEWS_REQUIRED;
  const gate3Passed = isPetitionComplete;

  const canRestore = isEvicted && gate1Passed && gate2Passed && gate3Passed;

  return {
    isEvicted,
    evictedAt: user.evicted_at,
    membershipStatus: user.membership_status,
    strikes: parseInt(user.probation_strikes_this_year || 0, 10),
    botmMisses: parseInt(user.consecutive_botm_misses || 0, 10),
    silverBullets: parseInt(user.silver_bullets || 0, 10),
    activeBotm,
    gate1: {
      title: "The Scribe's Penance",
      description: "Deliver 3 thoughtful peer critiques to the weekly community submissions.",
      required: RETURNER_GATES.PEER_REVIEWS_REQUIRED,
      current: peerReviewsCompleted,
      passed: gate1Passed,
    },
    gate2: {
      title: "The Living Guild",
      description: "Read and inscribe an in-depth review on the active Book of the Month.",
      required: RETURNER_GATES.BOTM_REVIEWS_REQUIRED,
      current: botmReviewsCompleted,
      passed: gate2Passed,
      targetBook: activeBotm,
    },
    gate3: {
      title: "The Scroll of Reckoning",
      description: "Submit a written reflection outlining your commitment to community craft and why you seek to reclaim sanctuary (minimum 30 words).",
      requiredWords: RETURNER_GATES.PETITION_MIN_WORDS,
      currentWords: petitionWords,
      passed: gate3Passed,
      petitionText,
      submittedAt: user.returner_petition_submitted_at,
    },
    canRestore,
  };
}

/**
 * Reclaim sanctuary & restore membership once all 3 gates are fulfilled.
 */
export async function restoreReturnerMembership(userId) {
  const progress = await getReturnerCrossingProgress(userId);

  if (!progress.isEvicted) {
    return { success: true, message: 'Member is already active in good standing.' };
  }

  if (!progress.canRestore) {
    const missing = [];
    if (!progress.gate1.passed) {
      missing.push(`Gate 1: Need ${progress.gate1.required - progress.gate1.current} more peer critique(s)`);
    }
    if (!progress.gate2.passed) {
      missing.push(`Gate 2: Need 1 review on the Book of the Month`);
    }
    if (!progress.gate3.passed) {
      missing.push(`Gate 3: Written petition required (minimum ${RETURNER_GATES.PETITION_MIN_WORDS} words)`);
    }
    throw new Error(`Cannot restore sanctuary: Incomplete crossing gates. [${missing.join(', ')}]`);
  }

  // Restore user in database
  await Database.query(`
    UPDATE users 
    SET membership_status = 'active',
        probation_strikes_this_year = 0,
        consecutive_botm_misses = 0,
        evicted_at = NULL
    WHERE id = $1
  `, [userId]);

  return {
    success: true,
    message: 'Welcome back to the sanctuary of Paper Thoughts! Your membership and dashboard privileges are fully restored.'
  };
}
