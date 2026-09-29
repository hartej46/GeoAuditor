/**
 * PostgreSQL Connection Pool
 *
 * Uses the 'pg' library with a connection pool for efficient query handling.
 * Reads DATABASE_URL from environment. Gracefully handles missing config
 * by logging a warning (allows demo mode to work without a database).
 */

const { Pool } = require('pg');

let pool = null;

/**
 * Initialize the connection pool. Call once at server startup.
 * @returns {Pool|null} The pool instance, or null if DATABASE_URL is not set.
 */
function initDB() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('  ⚠ DATABASE_URL not set — running without PostgreSQL (demo mode still works)');
    return null;
  }

  if (pool) return pool;

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('  [db] Unexpected pool error:', err.message);
  });

  console.log('  ✓ PostgreSQL pool created');
  return pool;
}

/**
 * Run a parameterized query against the pool.
 * @param {string} text - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Parameter values
 * @returns {import('pg').QueryResult}
 */
async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database not initialized. Set DATABASE_URL in .env');
  }
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.log(`  [db] Slow query (${duration}ms): ${text.slice(0, 80)}...`);
  }
  return result;
}

/**
 * Get the raw pool for transactions or advanced usage.
 * @returns {Pool|null}
 */
function getPool() {
  return pool;
}

/**
 * Check if the database is available.
 * @returns {boolean}
 */
function isDBAvailable() {
  return pool !== null;
}

module.exports = { initDB, query, getPool, isDBAvailable };
