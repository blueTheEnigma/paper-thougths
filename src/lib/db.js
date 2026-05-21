import { Pool } from 'pg';

let pool;

if (!global.pgPool) {
  const connectionString = process.env.DATABASE_URL;
  const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  
  global.pgPool = new Pool({
    connectionString: connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
}
pool = global.pgPool;

export const Database = {
  /**
   * Execute query and return rows
   */
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query:', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount });
      return res.rows;
    } catch (err) {
      console.error('Database query error:', err, 'Query:', text);
      throw err;
    }
  },

  /**
   * Execute query and return the first row, or null if none
   */
  queryOne: async (text, params) => {
    const rows = await Database.query(text, params);
    return rows[0] || null;
  },

  /**
   * Execute a series of queries in a transaction
   */
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back due to error:', e);
      throw e;
    } finally {
      client.release();
    }
  }
};
