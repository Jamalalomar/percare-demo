/**
 * PerCare Error Handler Middleware
 */

const { validationResult } = require('express-validator');

/**
 * Handle express-validator errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Global error handler
 */
function globalErrorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Known business errors
  if (err.message.includes('not found')) {
    return res.status(404).json({ success: false, message: err.message });
  }
  if (err.message.includes('Invalid transition') || err.message.includes('Duplicate')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.message.includes('Cannot') || err.message.includes('already')) {
    return res.status(409).json({ success: false, message: err.message });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      message: 'Database constraint error',
      detail:  process.env.NODE_ENV !== 'production' ? err.detail : undefined,
    });
  }

  // Default 500
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    detail:  process.env.NODE_ENV !== 'production' ? err.message : undefined,
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
}

module.exports = { handleValidationErrors, globalErrorHandler, notFoundHandler };
