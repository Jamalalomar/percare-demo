/**
 * PerCare Module - Express Application
 * Can be mounted into an existing Express app or run standalone
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const config  = require('./config');

const percareRouter = require('./modules/percare/routes/percare.routes');
const { globalErrorHandler, notFoundHandler } = require('./modules/percare/middleware/errorHandler');
const { startDelayJob } = require('./modules/percare/scheduler/delayJob');

const app = express();

// ============================================
// Middleware
// ============================================
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ============================================
// Health Check
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'percare-module', timestamp: new Date().toISOString() });
});

// ============================================
// PerCare Routes
// ============================================
app.use('/api/percare', percareRouter);

// ============================================
// Error Handling
// ============================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ============================================
// Start (when running standalone)
// ============================================
if (require.main === module) {
  const port = config.port;
  app.listen(port, () => {
    console.log(`[PerCare] Server running on port ${port} (${config.env})`);
    startDelayJob();
  });
}

module.exports = app;
