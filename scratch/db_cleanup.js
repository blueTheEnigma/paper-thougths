const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Manually parse .env.local to get DATABASE_URL
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL is not set in .env.local!");
  process.exit(1);
}

async function runCleanup() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database. Starting transactional purge...");

    // Start transaction
    await client.query("BEGIN");

    // 1. Delete peer reviews
    console.log("Purging peer_reviews...");
    const reviewsRes = await client.query("DELETE FROM peer_reviews");
    console.log(`Deleted ${reviewsRes.rowCount} peer reviews.`);

    // 2. Delete submission AI reports
    console.log("Purging submission_ai_reports...");
    const aiReportsRes = await client.query("DELETE FROM submission_ai_reports");
    console.log(`Deleted ${aiReportsRes.rowCount} AI reports.`);

    // 3. Delete submissions
    console.log("Purging submissions...");
    const submissionsRes = await client.query("DELETE FROM submissions");
    console.log(`Deleted ${submissionsRes.rowCount} submissions.`);

    // 4. Delete leaf transactions
    console.log("Purging leaf_transactions...");
    const leafTxRes = await client.query("DELETE FROM leaf_transactions");
    console.log(`Deleted ${leafTxRes.rowCount} leaf transactions.`);

    // 5. Delete book vouchers
    console.log("Purging book_vouchers...");
    const vouchersRes = await client.query("DELETE FROM book_vouchers");
    console.log(`Deleted ${vouchersRes.rowCount} vouchers.`);

    // 6. Delete orders
    console.log("Purging orders...");
    const ordersRes = await client.query("DELETE FROM orders");
    console.log(`Deleted ${ordersRes.rowCount} orders.`);

    // 7. Delete non-admin users
    console.log("Purging non-admin users (preserving 'umorgan2001@gmail.com' and admin roles)...");
    const usersRes = await client.query(`
      DELETE FROM users 
      WHERE email != 'umorgan2001@gmail.com' 
        AND (tier IS NULL OR tier != 'admin')
    `);
    console.log(`Deleted ${usersRes.rowCount} users.`);

    // Reset auto-incrementing serial IDs
    console.log("Resetting table primary key sequences...");
    const tables = ['peer_reviews', 'submissions', 'leaf_transactions', 'book_vouchers', 'orders', 'users'];
    for (const table of tables) {
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('${table}', 'id'), 
            COALESCE((SELECT MAX(id) FROM ${table}), 1), 
            false
          )
        `);
      } catch (e) {
        // Safe to ignore if serial sequence does not exist or isn't applicable
      }
    }

    await client.query("COMMIT");
    console.log("-----------------------------------------------------");
    console.log("🎉 Database sandbox cleanup plan prepared successfully!");
    console.log("-----------------------------------------------------");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Purge aborted. Error encountered:", err);
  } finally {
    await client.end();
  }
}

runCleanup();
