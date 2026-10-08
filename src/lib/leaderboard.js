import { Database } from './db';

/**
 * Paper Thoughts 3-Tier Leaderboard Service
 * 
 * Tier 1: Monthly Laurels (₦18,000 Cash Pool)
 *   - Top 3 Fiction & Prose Authors (₦2,000 each) with 4/4 streak indicators
 *   - Top 3 Poets & Verses Authors (₦2,000 each) with 4/4 streak indicators
 *   - Top 3 Reviewers of the Month (₦2,000 each) ranked by helpful reviews
 *   - Published Monthly Editorial Honors (Bookies, AI nominations)
 * 
 * Tier 2: Annual Crucible (January 1 - December 31)
 *   - Annual standings, probation pips, and Top 10 Veteran Silver Bullet shield threshold
 * 
 * Tier 3: Hall of Lore (Eternal Scribes)
 *   - Lifetime ranking by leaves, submissions, reviews, and Founding Badges
 */

export async function getThreeTierLeaderboard(currentUserId = null) {
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();
  const cycleName = `${currentMonthName} ${currentYear}`;

  // 1. TIER 1: Monthly Laurels
  // Fetch Prose / Fiction
  let proseRows = await Database.query(`
    SELECT 
      u.id, 
      u.full_name as "name", 
      u.avatar_url as "avatarUrl", 
      u.reader_archetype as "archetype", 
      u.founding_badge as "foundingBadge",
      COUNT(s.id)::int as "submissionCount",
      MAX(s.created_at) as "latestSubmission"
    FROM users u
    JOIN submissions s ON s.author_id = u.id
    WHERE s.genre != 'Poetry' 
      AND s.created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY u.id
    ORDER BY "submissionCount" DESC, "latestSubmission" ASC
    LIMIT 10
  `);

  if (proseRows.length < 3) {
    proseRows = await Database.query(`
      SELECT 
        u.id, 
        u.full_name as "name", 
        u.avatar_url as "avatarUrl", 
        u.reader_archetype as "archetype", 
        u.founding_badge as "foundingBadge",
        COUNT(s.id)::int as "submissionCount",
        MAX(s.created_at) as "latestSubmission"
      FROM users u
      JOIN submissions s ON s.author_id = u.id
      WHERE s.genre != 'Poetry' 
        AND s.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id
      ORDER BY "submissionCount" DESC, "latestSubmission" ASC
      LIMIT 10
    `);
  }

  // Fetch Poetry
  let poetryRows = await Database.query(`
    SELECT 
      u.id, 
      u.full_name as "name", 
      u.avatar_url as "avatarUrl", 
      u.reader_archetype as "archetype", 
      u.founding_badge as "foundingBadge",
      COUNT(s.id)::int as "submissionCount",
      MAX(s.created_at) as "latestSubmission"
    FROM users u
    JOIN submissions s ON s.author_id = u.id
    WHERE s.genre = 'Poetry' 
      AND s.created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY u.id
    ORDER BY "submissionCount" DESC, "latestSubmission" ASC
    LIMIT 10
  `);

  if (poetryRows.length < 3) {
    poetryRows = await Database.query(`
      SELECT 
        u.id, 
        u.full_name as "name", 
        u.avatar_url as "avatarUrl", 
        u.reader_archetype as "archetype", 
        u.founding_badge as "foundingBadge",
        COUNT(s.id)::int as "submissionCount",
        MAX(s.created_at) as "latestSubmission"
      FROM users u
      JOIN submissions s ON s.author_id = u.id
      WHERE s.genre = 'Poetry' 
        AND s.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id
      ORDER BY "submissionCount" DESC, "latestSubmission" ASC
      LIMIT 10
    `);
  }

  // Fetch Reviewers
  let reviewerRows = await Database.query(`
    SELECT 
      u.id, 
      u.full_name as "name", 
      u.avatar_url as "avatarUrl", 
      u.reader_archetype as "archetype", 
      u.founding_badge as "foundingBadge",
      COUNT(pr.id)::int as "totalReviews",
      COUNT(CASE WHEN pr.is_helpful = TRUE THEN 1 END)::int as "helpfulCount"
    FROM users u
    JOIN peer_reviews pr ON pr.reviewer_id = u.id
    WHERE pr.created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY u.id
    ORDER BY "helpfulCount" DESC, "totalReviews" DESC, u.id ASC
    LIMIT 10
  `);

  if (reviewerRows.length < 3) {
    reviewerRows = await Database.query(`
      SELECT 
        u.id, 
        u.full_name as "name", 
        u.avatar_url as "avatarUrl", 
        u.reader_archetype as "archetype", 
        u.founding_badge as "foundingBadge",
        COUNT(pr.id)::int as "totalReviews",
        COUNT(CASE WHEN pr.is_helpful = TRUE THEN 1 END)::int as "helpfulCount"
      FROM users u
      JOIN peer_reviews pr ON pr.reviewer_id = u.id
      WHERE pr.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id
      ORDER BY "helpfulCount" DESC, "totalReviews" DESC, u.id ASC
      LIMIT 10
    `);
  }

  // Format Podiums
  const prosePodium = proseRows.map((row, idx) => ({
    rank: idx + 1,
    id: row.id,
    name: row.name || 'Anonymous Author',
    avatarUrl: row.avatarUrl,
    archetype: row.archetype,
    foundingBadge: row.foundingBadge,
    submissionsCount: row.submissionCount,
    streak: Math.min(4, row.submissionCount),
    hasFullStreak: row.submissionCount >= 4,
    isLaurelWinner: idx < 3,
    laurelPrize: idx < 3 ? '₦2,000' : null,
  }));

  const poetryPodium = poetryRows.map((row, idx) => ({
    rank: idx + 1,
    id: row.id,
    name: row.name || 'Anonymous Poet',
    avatarUrl: row.avatarUrl,
    archetype: row.archetype,
    foundingBadge: row.foundingBadge,
    submissionsCount: row.submissionCount,
    streak: Math.min(4, row.submissionCount),
    hasFullStreak: row.submissionCount >= 4,
    isLaurelWinner: idx < 3,
    laurelPrize: idx < 3 ? '₦2,000' : null,
  }));

  const reviewerPodium = reviewerRows.map((row, idx) => ({
    rank: idx + 1,
    id: row.id,
    name: row.name || 'Anonymous Reviewer',
    avatarUrl: row.avatarUrl,
    archetype: row.archetype,
    foundingBadge: row.foundingBadge,
    helpfulCount: row.helpfulCount,
    totalReviews: row.totalReviews,
    isLaurelWinner: idx < 3,
    laurelPrize: idx < 3 ? '₦2,000' : null,
  }));

  // Published Editorial Honors from monthly_leaderboard
  const publishedHonors = await Database.queryOne(`
    SELECT 
      l.id,
      l.month_year as "monthYear",
      l.general_bookie_user_id as "generalBookieUserId",
      l.general_bookie_text as "generalBookieText",
      l.abuja_bookie_user_id as "abujaBookieUserId",
      l.abuja_bookie_text as "abujaBookieText",
      l.review_of_the_month_user_id as "reviewOfTheMonthUserId",
      l.review_of_the_month_text as "reviewOfTheMonthText",
      l.author_of_the_month_user_id as "authorOfTheMonthUserId",
      l.author_of_the_month_text as "authorOfTheMonthText",
      l.most_improved_author_user_id as "mostImprovedAuthorUserId",
      l.most_improved_author_text as "mostImprovedAuthorText",
      l.poet_of_the_month_user_id as "poetOfTheMonthUserId",
      l.poet_of_the_month_text as "poetOfTheMonthText",
      l.most_improved_poet_user_id as "mostImprovedPoetUserId",
      l.most_improved_poet_text as "mostImprovedPoetText",
      l.created_at as "createdAt",
      ug.full_name as "generalBookieName",
      ua.full_name as "abujaBookieName",
      ur.full_name as "reviewWinnerName",
      uw.full_name as "authorWinnerName",
      ui.full_name as "improvedWinnerName",
      up.full_name as "poetWinnerName",
      uip.full_name as "improvedPoetWinnerName"
    FROM monthly_leaderboard l
    LEFT JOIN users ug ON ug.id = l.general_bookie_user_id
    LEFT JOIN users ua ON ua.id = l.abuja_bookie_user_id
    LEFT JOIN users ur ON ur.id = l.review_of_the_month_user_id
    LEFT JOIN users uw ON uw.id = l.author_of_the_month_user_id
    LEFT JOIN users ui ON ui.id = l.most_improved_author_user_id
    LEFT JOIN users up ON up.id = l.poet_of_the_month_user_id
    LEFT JOIN users uip ON uip.id = l.most_improved_poet_user_id
    WHERE l.published = TRUE
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT 1
  `);

  // 2. TIER 2: Annual Crucible
  const annualRows = await Database.query(`
    SELECT 
      u.id, 
      u.full_name as "name", 
      u.avatar_url as "avatarUrl", 
      u.reader_archetype as "archetype", 
      u.founding_badge as "foundingBadge",
      COALESCE(u.membership_status, 'active') as "membershipStatus",
      COALESCE(u.probation_strikes_this_year, 0)::int as "probationStrikes",
      COALESCE(u.consecutive_botm_misses, 0)::int as "consecutiveBotmMisses",
      COALESCE(u.silver_bullets, 0)::int as "silverBullets",
      u.sabbatical_until as "sabbaticalUntil",
      COALESCE(u.spendable_leaves, 0)::int as "spendableLeaves",
      COALESCE(u.lifetime_leaves, 0)::int as "lifetimeLeaves",
      (
        SELECT COUNT(*)::int 
        FROM submissions s 
        WHERE s.author_id = u.id AND s.created_at >= date_trunc('year', CURRENT_DATE)
      ) as "annualSubmissions",
      (
        SELECT COUNT(*)::int 
        FROM peer_reviews pr 
        WHERE pr.reviewer_id = u.id AND pr.created_at >= date_trunc('year', CURRENT_DATE)
      ) as "annualReviews",
      (
        SELECT COUNT(*)::int 
        FROM book_of_the_month_reviews bmr 
        WHERE bmr.user_id = u.id AND bmr.created_at >= date_trunc('year', CURRENT_DATE)
      ) as "annualBotmReviews"
    FROM users u
    WHERE u.clerk_id IS NOT NULL 
      AND (u.membership_status IS NULL OR u.membership_status != 'evicted')
    ORDER BY 
      u.lifetime_leaves DESC, 
      "annualReviews" DESC, 
      "annualSubmissions" DESC, 
      u.id ASC
    LIMIT 60
  `);

  const annualRoster = annualRows.map((row, idx) => {
    const isSabbatical = row.sabbaticalUntil && new Date(row.sabbaticalUntil) > now;
    let statusLabel = 'Good Standing';
    let statusBadge = '🟢 Good Standing';
    let statusVariant = 'good';

    if (isSabbatical) {
      statusLabel = 'Sabbatical Active';
      statusBadge = '🎓 Sabbatical Active';
      statusVariant = 'sabbatical';
    } else if (row.probationStrikes >= 2) {
      statusLabel = 'Strike 2/3 (Warning)';
      statusBadge = '🟠 Strike 2/3';
      statusVariant = 'warning';
    } else if (row.probationStrikes === 1) {
      statusLabel = 'Strike 1/3 (Probation)';
      statusBadge = '🟡 Strike 1/3';
      statusVariant = 'caution';
    }

    return {
      rank: idx + 1,
      id: row.id,
      name: row.name || 'Sanctuary Member',
      avatarUrl: row.avatarUrl,
      archetype: row.archetype,
      foundingBadge: row.foundingBadge,
      membershipStatus: row.membershipStatus,
      probationStrikes: row.probationStrikes,
      silverBullets: row.silverBullets,
      isShieldEligible: idx < 10,
      spendableLeaves: row.spendableLeaves,
      lifetimeLeaves: row.lifetimeLeaves,
      annualSubmissions: row.annualSubmissions,
      annualReviews: row.annualReviews,
      annualBotmReviews: row.annualBotmReviews,
      statusLabel,
      statusBadge,
      statusVariant,
      sabbaticalUntil: row.sabbaticalUntil ? new Date(row.sabbaticalUntil).toISOString().split('T')[0] : null
    };
  });

  // 3. TIER 3: Hall of Lore
  const hallRows = await Database.query(`
    SELECT 
      u.id, 
      u.full_name as "name", 
      u.avatar_url as "avatarUrl", 
      u.reader_archetype as "archetype", 
      u.founding_badge as "foundingBadge",
      COALESCE(u.silver_bullets, 0)::int as "silverBullets",
      COALESCE(u.lifetime_leaves, 0)::int as "lifetimeLeaves",
      COALESCE(u.spendable_leaves, 0)::int as "spendableLeaves",
      u.created_at as "memberSince",
      (SELECT COUNT(*)::int FROM submissions s WHERE s.author_id = u.id) as "totalSubmissions",
      (SELECT COUNT(*)::int FROM peer_reviews pr WHERE pr.reviewer_id = u.id) as "totalReviews",
      (SELECT COUNT(*)::int FROM book_of_the_month_reviews bmr WHERE bmr.user_id = u.id) as "totalBotmReviews"
    FROM users u
    WHERE u.clerk_id IS NOT NULL
    ORDER BY u.lifetime_leaves DESC, u.spendable_leaves DESC, "totalReviews" DESC, u.id ASC
    LIMIT 50
  `);

  const hallOfLore = hallRows.map((row, idx) => ({
    rank: idx + 1,
    id: row.id,
    name: row.name || 'Elder Scribe',
    avatarUrl: row.avatarUrl,
    archetype: row.archetype,
    foundingBadge: row.foundingBadge,
    silverBullets: row.silverBullets,
    lifetimeLeaves: row.lifetimeLeaves,
    spendableLeaves: row.spendableLeaves,
    totalSubmissions: row.totalSubmissions,
    totalReviews: row.totalReviews,
    totalBotmReviews: row.totalBotmReviews,
    memberSince: row.memberSince ? new Date(row.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Archive Era'
  }));

  // 4. Current User Standing
  let userStanding = null;
  if (currentUserId) {
    const dbUser = await Database.queryOne(`SELECT * FROM users WHERE id = $1`, [currentUserId]);
    if (dbUser) {
      const userProseRank = prosePodium.find(p => p.id === dbUser.id)?.rank || null;
      const userPoetryRank = poetryPodium.find(p => p.id === dbUser.id)?.rank || null;
      const userReviewRank = reviewerPodium.find(p => p.id === dbUser.id)?.rank || null;
      const userAnnualRank = annualRoster.find(p => p.id === dbUser.id)?.rank || null;
      const userHallRank = hallOfLore.find(p => p.id === dbUser.id)?.rank || null;

      userStanding = {
        userId: dbUser.id,
        name: dbUser.full_name,
        avatarUrl: dbUser.avatar_url,
        archetype: dbUser.reader_archetype,
        foundingBadge: dbUser.founding_badge,
        proseRank: userProseRank,
        poetryRank: userPoetryRank,
        reviewRank: userReviewRank,
        annualRank: userAnnualRank,
        hallRank: userHallRank,
        silverBullets: dbUser.silver_bullets || 0,
        probationStrikes: dbUser.probation_strikes_this_year || 0,
        isInsideSilverBulletZone: userAnnualRank !== null && userAnnualRank <= 10,
        isWinningMonthlyLaurel: (userProseRank && userProseRank <= 3) || 
                                (userPoetryRank && userPoetryRank <= 3) || 
                                (userReviewRank && userReviewRank <= 3)
      };
    }
  }

  return {
    cycleName,
    year: currentYear,
    poolTotal: '₦18,000',
    laurelAmount: '₦2,000',
    monthly: {
      cycleName,
      prosePodium,
      poetryPodium,
      reviewerPodium,
      editorialHonors: publishedHonors ? {
        monthYear: publishedHonors.monthYear,
        generalBookie: publishedHonors.generalBookieName ? {
          name: publishedHonors.generalBookieName,
          text: publishedHonors.generalBookieText
        } : null,
        abujaBookie: publishedHonors.abujaBookieName ? {
          name: publishedHonors.abujaBookieName,
          text: publishedHonors.abujaBookieText
        } : null,
        reviewOfTheMonth: publishedHonors.reviewWinnerName ? {
          name: publishedHonors.reviewWinnerName,
          text: publishedHonors.reviewOfTheMonthText
        } : null,
        authorOfTheMonth: publishedHonors.authorWinnerName ? {
          name: publishedHonors.authorWinnerName,
          text: publishedHonors.authorOfTheMonthText
        } : null,
        mostImprovedAuthor: publishedHonors.improvedWinnerName ? {
          name: publishedHonors.improvedWinnerName,
          text: publishedHonors.mostImprovedAuthorText
        } : null,
        poetOfTheMonth: publishedHonors.poetWinnerName ? {
          name: publishedHonors.poetWinnerName,
          text: publishedHonors.poetOfTheMonthText
        } : null,
        mostImprovedPoet: publishedHonors.improvedPoetWinnerName ? {
          name: publishedHonors.improvedPoetWinnerName,
          text: publishedHonors.mostImprovedPoetText
        } : null,
      } : null
    },
    annual: {
      year: currentYear,
      silverBulletThreshold: 10,
      roster: annualRoster
    },
    allTime: {
      hallOfLore
    },
    userStanding
  };
}
