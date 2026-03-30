/**
 * PerCare Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config    = require('../../../config');

const percareRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { percareRateLimiter };
