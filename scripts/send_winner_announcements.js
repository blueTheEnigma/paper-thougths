const { Database } = require('../src/lib/db');
const { sendEmail } = require('../src/lib/email');
const { getAnthologyLaureateAnnouncementEmail } = require('../src/lib/emailTemplates');

async function sendWinnerAnnouncements() {
  console.log('Fetching latest published Anthology issue and winners...');

  const issue = await Database.queryOne(`
    SELECT * FROM monthly_anthology_issues 
    WHERE published = TRUE 
    ORDER BY id DESC 
    LIMIT 1
  `);

  if (!issue) {
    console.error('No published anthology issue found.');
    process.exit(1);
  }

  const entries = await Database.query(`
    SELECT 
      mae.id,
      mae.category,
      mae.placement_rank,
      mae.editor_citation,
      mae.prize_amount,
      s.title,
      u.id as user_id,
      u.full_name,
      u.email
    FROM monthly_anthology_entries mae
    JOIN submissions s ON s.id = mae.submission_id
    JOIN users u ON u.id = s.author_id
    WHERE mae.issue_id = $1
    ORDER BY u.id, mae.category, mae.placement_rank
  `, [issue.id]);

  if (entries.length === 0) {
    console.log('No inducted entries found for this issue.');
    process.exit(0);
  }

  // Group honors by user
  const winnersByUser = {};
  for (const entry of entries) {
    if (!winnersByUser[entry.user_id]) {
      winnersByUser[entry.user_id] = {
        name: entry.full_name || 'Sanctuary Author',
        email: entry.email,
        honors: []
      };
    }
    winnersByUser[entry.user_id].honors.push({
      title: entry.title,
      category: entry.category,
      rank: entry.placement_rank,
      citation: entry.editor_citation,
      prizeAmount: entry.prize_amount
    });
  }

  console.log(`Found ${Object.keys(winnersByUser).length} unique winning authors.`);

  for (const [userId, winner] of Object.entries(winnersByUser)) {
    if (!winner.email) {
      console.warn(`User ID ${userId} has no email address. Skipping.`);
      continue;
    }

    console.log(`Sending laureate email to ${winner.name} <${winner.email}>...`);

    const emailPayload = getAnthologyLaureateAnnouncementEmail({
      recipientName: winner.name,
      honors: winner.honors
    });

    try {
      const res = await sendEmail({
        to: winner.email,
        subject: emailPayload.subject,
        html: emailPayload.html
      });
      console.log(`Successfully sent email to ${winner.email}:`, res);
    } catch (err) {
      console.error(`Failed to send email to ${winner.email}:`, err);
    }
  }

  console.log('All winner announcement emails dispatched!');
  process.exit(0);
}

sendWinnerAnnouncements().catch(err => {
  console.error('Fatal error during announcements dispatch:', err);
  process.exit(1);
});

