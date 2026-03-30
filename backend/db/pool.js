const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host:     config.db.host,
  port:     config.db.port,
  database: config.db.name,
  user:     config.db.user,
  password: config.db.password,
  max:      config.db.poolMax || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error:', err.message);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[DB Pool] New client connected');
  }
});

/**
 * Execute a single query with optional parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client for transaction usage
 */
const getClient = () => pool.connect();

/**
 * Execute a function within a transaction
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, getClient, withTransaction };
