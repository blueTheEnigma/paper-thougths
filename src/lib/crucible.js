import { Database } from './db.js';
import { getThreeTierLeaderboard } from './leaderboard.js';

/**
 * Paper Thoughts Administrative Crucible & Eviction Service
 */

export async function getCrucibleData() {
  // 1. Due for Eviction (Active members with >= 3 strikes or >= 3 BOTM misses, no silver bullet, no sabbatical)
  const dueForEvictionRaw = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.whatsapp, u.lk_id as lkid,
           u.membership_status as "membershipStatus",
           COALESCE(u.probation_strikes_this_year, 0) as "probationStrikes",
           COALESCE(u.consecutive_botm_misses, 0) as "botmMisses",
           COALESCE(u.silver_bullets, 0) as "silverBullets",
           u.sabbatical_until as "sabbaticalUntil",
           u.sabbatical_type as "sabbaticalType",
           c.name as chapter,
           u.created_at as "createdAt"
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE u.membership_status != 'evicted'
      AND (COALESCE(u.probation_strikes_this_year, 0) >= 3 OR COALESCE(u.consecutive_botm_misses, 0) >= 3)
      AND COALESCE(u.silver_bullets, 0) = 0
      AND (u.sabbatical_until IS NULL OR u.sabbatical_until < NOW())
    ORDER BY u.probation_strikes_this_year DESC, u.consecutive_botm_misses DESC, u.id ASC
  `);

  // 2. Probation Watchlist (Active members with 1 or 2 strikes/misses)
  const watchlistRaw = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.whatsapp, u.lk_id as lkid,
           u.membership_status as "membershipStatus",
           COALESCE(u.probation_strikes_this_year, 0) as "probationStrikes",
           COALESCE(u.consecutive_botm_misses, 0) as "botmMisses",
           COALESCE(u.silver_bullets, 0) as "silverBullets",
           u.sabbatical_until as "sabbaticalUntil",
           c.name as chapter,
           u.created_at as "createdAt"
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE u.membership_status != 'evicted'
      AND (COALESCE(u.probation_strikes_this_year, 0) > 0 OR COALESCE(u.consecutive_botm_misses, 0) > 0)
      AND NOT (COALESCE(u.probation_strikes_this_year, 0) >= 3 OR COALESCE(u.consecutive_botm_misses, 0) >= 3)
    ORDER BY u.probation_strikes_this_year DESC, u.consecutive_botm_misses DESC
  `);

  // 3. Evicted Members (Includes any pending Returner's Crossing petitions)
  const evictedRaw = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.whatsapp, u.lk_id as lkid,
           u.membership_status as "membershipStatus",
           u.evicted_at as "evictedAt",
           u.returner_petition as "returnerPetition",
           u.returner_petition_submitted_at as "returnerPetitionSubmittedAt",
           COALESCE(u.silver_bullets, 0) as "silverBullets",
           c.name as chapter
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE u.membership_status = 'evicted'
    ORDER BY u.returner_petition_submitted_at DESC NULLS LAST, u.evicted_at DESC NULLS LAST
  `);

  // 4. Sabbatical Members (Protected from strikes)
  const sabbaticalRaw = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.whatsapp, u.lk_id as lkid,
           u.sabbatical_until as "sabbaticalUntil",
           u.sabbatical_type as "sabbaticalType",
           u.sabbatical_requested_at as "sabbaticalRequestedAt",
           COALESCE(u.silver_bullets, 0) as "silverBullets",
           c.name as chapter
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE u.sabbatical_until IS NOT NULL AND u.sabbatical_until > NOW()
    ORDER BY u.sabbatical_until ASC
  `);

  // 5. Shielded Veterans (Holders of Silver Bullets)
  const shieldedRaw = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.whatsapp, u.lk_id as lkid,
           u.silver_bullets as "silverBullets",
           u.membership_status as "membershipStatus",
           c.name as chapter
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE COALESCE(u.silver_bullets, 0) > 0
    ORDER BY u.silver_bullets DESC
  `);

  // 6. Monthly Laurels Podium (from Leaderboard Service)
  const leaderboard = await getThreeTierLeaderboard();
  const monthlyPodium = leaderboard.monthlyPodium || {
    prose: [],
    poetry: [],
    reviewers: []
  };

  // Enrich monthly podium winners with user WhatsApp, email, lkid
  const winnerUserIds = [
    ...monthlyPodium.prose.map(w => w.id),
    ...monthlyPodium.poetry.map(w => w.id),
    ...monthlyPodium.reviewers.map(w => w.id)
  ].filter(Boolean);

  let contactMap = {};
  if (winnerUserIds.length > 0) {
    const contactRows = await Database.query(`
      SELECT id, full_name, email, whatsapp, lk_id
      FROM users
      WHERE id = ANY($1::int[])
    `, [winnerUserIds]);
    contactRows.forEach(r => {
      contactMap[r.id] = r;
    });
  }

  const enrichWinner = (w) => ({
    ...w,
    email: contactMap[w.id]?.email || '',
    whatsapp: contactMap[w.id]?.whatsapp || '',
    lkid: contactMap[w.id]?.lk_id || 'LK-CLUB',
    paid: false
  });

  const serializeDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d.toISOString();
    return String(d);
  };

  const dueForEviction = dueForEvictionRaw.map(m => ({
    ...m,
    probationStrikes: parseInt(m.probationStrikes || 0),
    botmMisses: parseInt(m.botmMisses || 0),
    silverBullets: parseInt(m.silverBullets || 0),
    sabbaticalUntil: serializeDate(m.sabbaticalUntil),
    createdAt: serializeDate(m.createdAt)
  }));

  const watchlist = watchlistRaw.map(m => ({
    ...m,
    probationStrikes: parseInt(m.probationStrikes || 0),
    botmMisses: parseInt(m.botmMisses || 0),
    silverBullets: parseInt(m.silverBullets || 0),
    sabbaticalUntil: serializeDate(m.sabbaticalUntil),
    createdAt: serializeDate(m.createdAt)
  }));

  const evictedMembers = evictedRaw.map(m => ({
    ...m,
    silverBullets: parseInt(m.silverBullets || 0),
    evictedAt: serializeDate(m.evictedAt),
    returnerPetitionSubmittedAt: serializeDate(m.returnerPetitionSubmittedAt)
  }));

  const sabbaticalMembers = sabbaticalRaw.map(m => ({
    ...m,
    silverBullets: parseInt(m.silverBullets || 0),
    sabbaticalUntil: serializeDate(m.sabbaticalUntil),
    sabbaticalRequestedAt: serializeDate(m.sabbaticalRequestedAt)
  }));

  const shieldedVeterans = shieldedRaw.map(m => ({
    ...m,
    silverBullets: parseInt(m.silverBullets || 0)
  }));

  return {
    dueForEviction,
    watchlist,
    evictedMembers,
    sabbaticalMembers,
    shieldedVeterans,
    monthlyLaurels: {
      prose: monthlyPodium.prose.map(enrichWinner),
      poetry: monthlyPodium.poetry.map(enrichWinner),
      reviewers: monthlyPodium.reviewers.map(enrichWinner),
      cycleName: leaderboard.monthlyCycleName || 'Current Cycle'
    },
    stats: {
      dueCount: dueForEviction.length,
      watchlistCount: watchlist.length,
      evictedCount: evictedMembers.length,
      sabbaticalCount: sabbaticalMembers.length,
      shieldedCount: shieldedVeterans.length,
      petitionsCount: evictedMembers.filter(m => !!m.returnerPetition).length
    }
  };
}

export async function evictMember(userId, adminClerkId = null, reason = '3rd Probation Strike Accumulation') {
  const result = await Database.queryOne(`
    UPDATE users
    SET membership_status = 'evicted',
        evicted_at = NOW()
    WHERE id = $1
    RETURNING id, full_name, email, whatsapp, membership_status, evicted_at
  `, [userId]);

  if (result) {
    await Database.query(`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES ($1, 'Sanctuary Eviction Notice 🥀', $2, 'eviction')
    `, [
      userId,
      `Your Paper Thoughts membership has entered eviction status (${reason}). Visit The Returner's Crossing to begin your renewal petition.`
    ]);
  }

  return result;
}

export async function pardonMember(userId, resetStrikes = true, grantSilverBullet = false) {
  let updateClauses = [];
  let params = [userId];
  let pIdx = 2;

  if (resetStrikes) {
    updateClauses.push('probation_strikes_this_year = 0');
    updateClauses.push('consecutive_botm_misses = 0');
    updateClauses.push("membership_status = 'active'");
  }

  if (grantSilverBullet) {
    updateClauses.push('silver_bullets = COALESCE(silver_bullets, 0) + 1');
  }

  if (updateClauses.length === 0) return null;

  const result = await Database.queryOne(`
    UPDATE users
    SET ${updateClauses.join(', ')}
    WHERE id = $1
    RETURNING id, full_name, probation_strikes_this_year, silver_bullets, membership_status
  `, params);

  if (result) {
    await Database.query(`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES ($1, 'Administrative Pardon Granted 🛡️', 'Leadership has granted you an administrative pardon and restored your good standing in the Sanctuary.', 'pardon')
    `, [userId]);
  }

  return result;
}

export async function grantSabbatical(userId, durationMonths = 1, sabbaticalType = 'general') {
  const months = Math.max(1, Math.min(3, parseInt(durationMonths) || 1));
  const result = await Database.queryOne(`
    UPDATE users
    SET sabbatical_until = NOW() + ($2 || ' months')::interval,
        sabbatical_type = $3,
        sabbatical_requested_at = NOW()
    WHERE id = $1
    RETURNING id, full_name, sabbatical_until, sabbatical_type
  `, [userId, months, sabbaticalType]);

  if (result) {
    await Database.query(`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES ($1, 'Sabbatical Shield Activated 🎓', 'Your sabbatical shield has been granted by leadership until ' || to_char($2::timestamptz, 'Mon DD, YYYY') || '.', 'sabbatical')
    `, [userId, result.sabbatical_until]);
  }

  return result;
}

export async function endSabbatical(userId) {
  return await Database.queryOne(`
    UPDATE users
    SET sabbatical_until = NULL,
        sabbatical_type = NULL
    WHERE id = $1
    RETURNING id, full_name, sabbatical_until
  `, [userId]);
}

export async function adjudicateReturnerPetition(userId, action = 'approve') {
  if (action === 'approve') {
    const result = await Database.queryOne(`
      UPDATE users
      SET membership_status = 'active',
          evicted_at = NULL,
          probation_strikes_this_year = 0,
          consecutive_botm_misses = 0,
          returner_petition = NULL,
          returner_petition_submitted_at = NULL
      WHERE id = $1
      RETURNING id, full_name, membership_status
    `, [userId]);

    if (result) {
      await Database.query(`
        INSERT INTO user_notifications (user_id, title, message, type)
        VALUES ($1, 'Welcome Home to the Sanctuary ✨', 'Your Returner Petition has been accepted by leadership. Your full privileges have been restored.', 'petition_approved')
      `, [userId]);
    }
    return result;
  } else {
    // Decline petition
    return await Database.queryOne(`
      UPDATE users
      SET returner_petition = NULL,
          returner_petition_submitted_at = NULL
      WHERE id = $1
      RETURNING id, full_name
    `, [userId]);
  }
}

export async function runMonthlyGovernanceAudit() {
  // Identify members who had 0 submissions and 0 reviews in the past 30 days
  // (excluding those on active sabbatical or already evicted)
  const inactiveUsers = await Database.query(`
    SELECT u.id, u.full_name
    FROM users u
    WHERE u.membership_status != 'evicted'
      AND (u.sabbatical_until IS NULL OR u.sabbatical_until < NOW())
      AND NOT EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.author_id = u.id AND s.created_at >= NOW() - INTERVAL '30 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM peer_reviews pr 
        WHERE pr.reviewer_id = u.id AND pr.created_at >= NOW() - INTERVAL '30 days'
      )
  `);

  let strikesAdded = 0;
  if (inactiveUsers.length > 0) {
    const inactiveIds = inactiveUsers.map(u => u.id);
    const updateRes = await Database.query(`
      UPDATE users
      SET probation_strikes_this_year = COALESCE(probation_strikes_this_year, 0) + 1
      WHERE id = ANY($1::int[])
      RETURNING id
    `, [inactiveIds]);
    strikesAdded = updateRes.length;
  }

  return {
    auditedAt: new Date().toISOString(),
    inactiveIdentified: inactiveUsers.length,
    strikesAdded
  };
}
