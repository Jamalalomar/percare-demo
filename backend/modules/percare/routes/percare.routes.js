/**
 * PerCare Module Routes
 * All endpoints prefixed with /api/percare
 */

const router = require('express').Router();
const { optionalAuth } = require('../middleware/percareAuth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { percareRateLimiter } = require('../middleware/rateLimit');

const requestCtrl = require('../controllers/PerCareRequestController');
const slotCtrl    = require('../controllers/PerCareSlotController');
const jobCtrl     = require('../controllers/PerCareJobController');

const {
  validateCreateRequest,
  validateUpdateSlotStatus,
  validateBulkUpdate,
  validateRequestId,
  validateListQuery,
} = require('../validators/percare.validators');

// Apply rate limiting to all routes
router.use(percareRateLimiter);

// Apply optional auth
router.use(optionalAuth);

// ============================================
// REQUEST ROUTES
// ============================================

// POST /api/percare/requests — Create request
router.post(
  '/requests',
  validateCreateRequest,
  handleValidationErrors,
  requestCtrl.create.bind(requestCtrl)
);

// GET /api/percare/requests — List requests
router.get(
  '/requests',
  validateListQuery,
  handleValidationErrors,
  requestCtrl.list.bind(requestCtrl)
);

// GET /api/percare/requests/:id — Get request details
router.get(
  '/requests/:id',
  validateRequestId,
  handleValidationErrors,
  requestCtrl.getOne.bind(requestCtrl)
);

// GET /api/percare/requests/:id/slots — Get weekly slots grid
router.get(
  '/requests/:id/slots',
  validateRequestId,
  handleValidationErrors,
  requestCtrl.getSlots.bind(requestCtrl)
);

// GET /api/percare/requests/:id/stats — Get KPI stats
router.get(
  '/requests/:id/stats',
  validateRequestId,
  handleValidationErrors,
  requestCtrl.getStats.bind(requestCtrl)
);

// POST /api/percare/requests/:id/recalculate — Recalculate schedule
router.post(
  '/requests/:id/recalculate',
  validateRequestId,
  handleValidationErrors,
  requestCtrl.recalculate.bind(requestCtrl)
);

// POST /api/percare/requests/:id/cancel — Cancel request
router.post(
  '/requests/:id/cancel',
  validateRequestId,
  handleValidationErrors,
  requestCtrl.cancel.bind(requestCtrl)
);

// ============================================
// SLOT ROUTES
// ============================================

// PUT /api/percare/slots/:slotId/status — Update slot status
router.put(
  '/slots/:slotId/status',
  validateUpdateSlotStatus,
  handleValidationErrors,
  slotCtrl.updateStatus.bind(slotCtrl)
);

// GET /api/percare/slots/:slotId/logs — Get slot audit logs
router.get(
  '/slots/:slotId/logs',
  slotCtrl.getLogs.bind(slotCtrl)
);

// POST /api/percare/slots/bulk-update — Bulk update slots
router.post(
  '/slots/bulk-update',
  validateBulkUpdate,
  handleValidationErrors,
  slotCtrl.bulkUpdate.bind(slotCtrl)
);

// ============================================
// JOB ROUTES
// ============================================

// POST /api/percare/jobs/mark-overdue — Trigger delay job
router.post(
  '/jobs/mark-overdue',
  jobCtrl.markOverdue.bind(jobCtrl)
);

module.exports = router;
