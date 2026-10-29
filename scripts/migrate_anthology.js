const { Database } = require('../src/lib/db');

async function runMigration() {
  console.log('Starting Anthology & Editorial Desk migration...');
  
  await Database.transaction(async (client) => {
    // 1. Monthly Anthology Issues Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_anthology_issues (
        id SERIAL PRIMARY KEY,
        month_year VARCHAR(20) UNIQUE NOT NULL,
        display_title VARCHAR(255) NOT NULL,
        curator_foreword TEXT,
        published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Monthly Anthology Entries Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_anthology_entries (
        id SERIAL PRIMARY KEY,
        issue_id INT NOT NULL REFERENCES monthly_anthology_issues(id) ON DELETE CASCADE,
        submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        category VARCHAR(20) NOT NULL CHECK (category IN ('story', 'poem')),
        placement_rank INT NOT NULL CHECK (placement_rank BETWEEN 1 AND 3),
        editor_citation TEXT NOT NULL,
        prize_amount INT DEFAULT 2000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(issue_id, category, placement_rank),
        UNIQUE(issue_id, submission_id)
      );
    `);

    // 3. Submissions Table Alterations
    await client.query(`
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cycle_month VARCHAR(20);
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS anthology_inducted BOOLEAN DEFAULT FALSE;
    `);

    // 4. Backfill cycle_month
    await client.query(`
      UPDATE submissions 
      SET cycle_month = TO_CHAR(created_at, 'YYYY-MM') 
      WHERE cycle_month IS NULL;
    `);

    // 5. Index for fast monthly salon & anthology filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_cycle_status ON submissions(cycle_month, batch_status);
    `);
  });

  console.log('Migration executed successfully!');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

