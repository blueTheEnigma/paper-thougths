const { Pool } = require('pg');
const fs = require('fs');

const envPath = 'c:/Users/umorg/Documents/PT/.env.local';
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

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('--- Migrating Gatherings Table: Adding Moderator Columns ---');

  const alterQueries = [
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_user_id INT REFERENCES users(id) ON DELETE SET NULL;`,
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_name VARCHAR(255);`,
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_avatar_url TEXT;`,
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_lkid VARCHAR(50);`,
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_bio TEXT;`,
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_leaves_bounty INT DEFAULT 50;`,
    `ALTER TABLE gatherings ADD COLUMN IF NOT EXISTS moderator_bounty_awarded BOOLEAN DEFAULT FALSE;`,
    `CREATE INDEX IF NOT EXISTS idx_gatherings_moderator_user_id ON gatherings(moderator_user_id);`
  ];

  for (const query of alterQueries) {
    await pool.query(query);
    console.log('Executed:', query.trim());
  }

  const colsRes = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'gatherings'
    ORDER BY ordinal_position;
  `);

  console.log('\nUpdated columns in gatherings:');
  console.log(colsRes.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  await pool.end();
  console.log('Migration completed successfully.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
