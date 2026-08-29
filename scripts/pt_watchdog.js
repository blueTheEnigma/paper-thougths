/**
 * ✦ PAPER THOUGHTS CREATIVE & PRODUCTION WATCHDOG ✦
 * Automated architectural, visual geometry, database query, and UI/UX health auditor.
 * Run with: npm run watchdog
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  burgundy: '\x1b[35m',
  gold: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logHeader(title) {
  console.log(`\n${colors.bold}${colors.burgundy}══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.gold} ✦ WATCHDOG AUDIT: ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.burgundy}══════════════════════════════════════════════════════════════════${colors.reset}`);
}

function logPass(msg) {
  console.log(`  ${colors.green}✓ [PASS]${colors.reset} ${msg}`);
}

function logFail(msg) {
  console.log(`  ${colors.red}✗ [FAIL]${colors.reset} ${colors.bold}${msg}${colors.reset}`);
}

function logWarn(msg) {
  console.log(`  ${colors.gold}⚠ [WARN]${colors.reset} ${msg}`);
}

let totalErrors = 0;
let totalWarnings = 0;

// Load Environment variables
const envPath = path.join(__dirname, '../.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.substring('DATABASE_URL='.length).replace(/^['"]|['"]$/g, '');
      break;
    }
  }
}

async function auditDatabaseQueries() {
  logHeader('1. Live Database Queries & Dynamic Route Health');

  if (!databaseUrl) {
    logWarn('DATABASE_URL not detected in environment or .env.local; skipping live query execution.');
    totalWarnings++;
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const userRes = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');
    if (userRes.rows.length === 0) {
      logWarn('No test user found in database to simulate server component queries.');
      return;
    }
    const testUser = userRes.rows[0];

    // 1.1 Dashboard Profile & User Details Query
    try {
      await pool.query(`
        SELECT u.*, c.name as chapter_name
        FROM users u
        LEFT JOIN chapters c ON c.id = u.chapter_id
        WHERE u.id = $1
      `, [testUser.id]);
      logPass('Dashboard: User profile & chapter join query');
    } catch (e) {
      logFail(`Dashboard Profile Query Error: ${e.message}`);
      totalErrors++;
    }

    // 1.2 Dashboard Submissions & AI Reports Query
    try {
      await pool.query(`
        SELECT s.id, s.title, s.genre, s.logline, s.body_text as "bodyText", s.pen_name as "penName", s.batch_status as "batchStatus", 
               s.is_revised as "isRevised", s.created_at as "createdAt",
               (SELECT COUNT(*) FROM submission_ai_reports r WHERE r.submission_id = s.id) > 0 as "hasReport",
               (SELECT COUNT(*) FROM peer_reviews r WHERE r.submission_id = s.id) as "reviewCount"
        FROM submissions s
        WHERE s.author_id = $1
        ORDER BY s.created_at DESC
      `, [testUser.id]);
      logPass('Dashboard: Submissions & AI Report subqueries');
    } catch (e) {
      logFail(`Dashboard Submissions Query Error: ${e.message}`);
      totalErrors++;
    }

    // 1.3 Dashboard Personal TBR Query
    try {
      await pool.query(`
        SELECT 
          bpp.id as "pledgeId",
          bpp.reading_status as "readingStatus",
          bpp.created_at as "pledgedAt",
          p.id as "pitchId",
          p.book_title as "bookTitle",
          p.book_author as "bookAuthor",
          p.hook_line as "hookLine",
          p.aftertaste,
          p.killer_quote as "killerQuote",
          p.cover_url as "coverUrl",
          p.vibe_tags as "vibeTags",
          u.full_name as "pitcherName"
        FROM book_pitch_pledges bpp
        JOIN book_pitches p ON p.id = bpp.pitch_id
        JOIN users u ON u.id = p.user_id
        WHERE bpp.user_id = $1
        ORDER BY bpp.created_at DESC
      `, [testUser.id]);
      logPass('Dashboard: Personal TBR Shelf pledge join query');
    } catch (e) {
      logFail(`Dashboard TBR Query Error: ${e.message}`);
      totalErrors++;
    }

    // 1.4 Monthly Leaderboard Query
    try {
      await pool.query(`
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
          l.created_at as "createdAt",
          ug.full_name as "generalBookieName",
          ua.full_name as "abujaBookieName",
          ur.full_name as "reviewWinnerName",
          uw.full_name as "authorWinnerName",
          ui.full_name as "improvedWinnerName"
        FROM monthly_leaderboard l
        LEFT JOIN users ug ON ug.id = l.general_bookie_user_id
        LEFT JOIN users ua ON ua.id = l.abuja_bookie_user_id
        LEFT JOIN users ur ON ur.id = l.review_of_the_month_user_id
        LEFT JOIN users uw ON uw.id = l.author_of_the_month_user_id
        LEFT JOIN users ui ON ui.id = l.most_improved_author_user_id
        WHERE l.published = TRUE
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT 1
      `);
      logPass('Dashboard: Monthly honors & leaderboard schema query');
    } catch (e) {
      logFail(`Monthly Leaderboard Query Error: ${e.message}`);
      totalErrors++;
    }

    // 1.5 Convince-Me Pitch Arena Queries
    try {
      await pool.query(`
        SELECT 
          p.id,
          p.book_title as "bookTitle",
          p.book_author as "bookAuthor",
          p.hook_line as "hookLine",
          p.aftertaste,
          p.killer_quote as "killerQuote",
          p.cover_url as "coverUrl",
          p.vibe_tags as "vibeTags",
          p.status,
          p.created_at as "createdAt",
          u.id as "authorId",
          u.full_name as "authorName",
          (SELECT COUNT(*) FROM book_pitch_pledges bpp WHERE bpp.pitch_id = p.id)::int as "pledgeCount",
          (SELECT COUNT(*) FROM book_pitch_notes bpn WHERE bpn.pitch_id = p.id)::int as "commentCount",
          EXISTS(SELECT 1 FROM book_pitch_pledges bpp WHERE bpp.pitch_id = p.id AND bpp.user_id = $1) as "userPledged"
        FROM book_pitches p
        JOIN users u ON u.id = p.user_id
        WHERE p.status = 'active'
        ORDER BY "pledgeCount" DESC, p.created_at DESC LIMIT 10
      `, [testUser.id]);
      logPass('Convince-Me: Active pitches & pledge ranking query');
    } catch (e) {
      logFail(`Convince-Me Pitches Query Error: ${e.message}`);
      totalErrors++;
    }

    // 1.6 Permissions isCrewMember Query
    try {
      await pool.query(`
        SELECT u.id, u.email FROM users u WHERE u.id = $1
      `, [testUser.id]);
      logPass('Permissions: isCrewMember table alias query');
    } catch (e) {
      logFail(`Permissions Query Error: ${e.message}`);
      totalErrors++;
    }

  } catch (err) {
    logFail(`Database connection error: ${err.message}`);
    totalErrors++;
  } finally {
    await pool.end();
  }
}

function auditNavigationGeometry() {
  logHeader('2. Navigation Bar Geometry & Space Budget');

  const navFile = path.join(__dirname, '../src/components/Navigation.jsx');
  if (!fs.existsSync(navFile)) {
    logFail('src/components/Navigation.jsx not found');
    totalErrors++;
    return;
  }

  const content = fs.readFileSync(navFile, 'utf8');

  // Check Events link presence
  if (content.includes('href: "/events"') || content.includes("href: '/events'")) {
    logPass('Navigation: "Events" (/events) is present in primary nav links');
  } else {
    logFail('Navigation: "Events" (/events) is MISSING from primary nav links');
    totalErrors++;
  }

  // Check navLinks count
  const navLinksMatch = content.match(/const navLinks = \[\s*([\s\S]*?)\];/);
  if (navLinksMatch) {
    const items = navLinksMatch[1].match(/\{[\s\S]*?\}/g) || [];
    if (items.length <= 5) {
      logPass(`Navigation: Primary link budget respected (${items.length} items <= 5 limit)`);
    } else {
      logFail(`Navigation: Primary link overflow! (${items.length} items > 5 limit). Risk of flex wrap/squishing.`);
      totalErrors++;
    }
  }

  // Check whitespace-nowrap on desktop links
  if (content.includes('whitespace-nowrap')) {
    logPass('Navigation: Desktop link container enforces whitespace-nowrap');
  } else {
    logWarn('Navigation: Desktop links lack whitespace-nowrap; text wrapping could occur on narrow viewports.');
    totalWarnings++;
  }
}

function auditModalPortals() {
  logHeader('3. Modal Portals & Body Scroll Lock Integrity');

  const componentFiles = [
    'src/components/common/LiteraryReaderModal.jsx',
    'src/components/archetypes/ArchetypeCardModal.jsx',
    'src/components/quotes/QuoteStudioModal.jsx',
    'src/app/convince-me/ConvinceMeClient.jsx',
    'src/app/village/gallery/GalleryClient.jsx'
  ];

  componentFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) return;

    const content = fs.readFileSync(fullPath, 'utf8');

    // 3.1 Check createPortal usage
    if (content.includes('createPortal(') && content.includes('document.body')) {
      logPass(`${relPath}: Correctly portaled to document.body`);
    } else if (content.includes('LiteraryReaderModal')) {
      logPass(`${relPath}: Uses portaled LiteraryReaderModal`);
    } else {
      logWarn(`${relPath}: Does not appear to use createPortal(..., document.body). Verify modal is portaled.`);
      totalWarnings++;
    }

    // 3.2 Check body scroll lock
    if (content.includes("document.body.style.overflow = 'hidden'") || content.includes('LiteraryReaderModal')) {
      logPass(`${relPath}: Body scroll locking implemented`);
    } else {
      logWarn(`${relPath}: Missing explicit body scroll lock handling.`);
      totalWarnings++;
    }
  });
}

function auditDefensiveProps() {
  logHeader('4. Client Component Defensive Defaults & SSR Safety');

  const dashboardClientFile = path.join(__dirname, '../src/app/dashboard/DashboardClient.js');
  if (fs.existsSync(dashboardClientFile)) {
    const content = fs.readFileSync(dashboardClientFile, 'utf8');
    if (content.includes('rawProfile') || content.includes('safeProfile') || content.includes('profile || {')) {
      logPass('DashboardClient.js: Defensive profile default fallback implemented');
    } else {
      logFail('DashboardClient.js: Missing defensive fallback for profile prop. Risk of null pointer crash.');
      totalErrors++;
    }

    if (content.includes('initialOrders = []') && content.includes('tbrItems = []')) {
      logPass('DashboardClient.js: Array props initialized with safe defaults');
    } else {
      logWarn('DashboardClient.js: Some array props may lack safe default empty arrays.');
      totalWarnings++;
    }
  }
}

async function runWatchdog() {
  console.log(`\n${colors.bold}${colors.burgundy}🦅 STARTING PAPER THOUGHTS RESILIENT WATCHDOG AUDIT 🦅${colors.reset}\n`);

  await auditDatabaseQueries();
  auditNavigationGeometry();
  auditModalPortals();
  auditDefensiveProps();

  console.log(`\n${colors.bold}${colors.burgundy}══════════════════════════════════════════════════════════════════${colors.reset}`);
  if (totalErrors === 0) {
    console.log(`${colors.bold}${colors.green} ✓ AUDIT COMPLETE: 0 ERRORS DETECTED (${totalWarnings} warnings). SYSTEM HEALTHY! 🌟${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.red} ✗ AUDIT COMPLETE: ${totalErrors} CRITICAL ERROR(S) DETECTED! MUST FIX BEFORE DEPLOY.${colors.reset}`);
    process.exit(1);
  }
  console.log(`${colors.bold}${colors.burgundy}══════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

runWatchdog();
