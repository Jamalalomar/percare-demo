/**
 * PerCare Module Configuration
 * All config is read from environment variables with defaults
 */

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    name:     process.env.DB_NAME     || 'percare_db',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMax:  parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  jwt: {
    secret:    process.env.JWT_SECRET    || 'percare-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),  // 1 min
    max:      parseInt(process.env.RATE_LIMIT_MAX       || '100',   10),
  },

  cron: {
    delayJobSchedule: process.env.DELAY_JOB_CRON || '0 1 * * *', // 1 AM daily
    timezone:         process.env.CRON_TIMEZONE   || 'Asia/Riyadh',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize:     parseInt(process.env.MAX_PAGE_SIZE     || '100', 10),
  },
};

// Validate critical settings in production
if (config.env === 'production') {
  if (config.jwt.secret === 'percare-secret-change-in-production') {
    console.warn('[Config] WARNING: JWT secret is not set! Use JWT_SECRET env var.');
  }
}

module.exports = config;
