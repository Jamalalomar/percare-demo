/**
 * PerCare Request Validators
 * Input validation using express-validator
 */

const { body, param, query } = require('express-validator');

// ============================================
// Create Request
// ============================================
const validateCreateRequest = [
  body('start_date')
    .notEmpty().withMessage('start_date is required')
    .isDate().withMessage('start_date must be a valid date (YYYY-MM-DD)'),

  body('selected_services')
    .isArray({ min: 1 }).withMessage('selected_services must be a non-empty array'),

  body('selected_services.*.service_code')
    .notEmpty().withMessage('service_code is required for each service')
    .isString().trim(),

  body('selected_services.*.service_name')
    .notEmpty().withMessage('service_name is required for each service')
    .isString().trim(),

  body('selected_services.*.weekly_frequency')
    .isInt({ min: 1 }).withMessage('weekly_frequency must be a positive integer'),

  body('selected_services')
    .custom((services) => {
      const codes = services.map(s => s.service_code);
      const unique = new Set(codes);
      if (unique.size !== codes.length) {
        throw new Error('Duplicate service_code found in selected_services');
      }
      return true;
    }),

  body('patient_name').optional().isString().trim(),
  body('external_request_id').optional().isString().trim(),
  body('external_patient_id').optional().isString().trim(),
  body('provider_id').optional().isString().trim(),
  body('notes').optional().isString().trim(),
];

// ============================================
// Update Slot Status
// ============================================
const validateUpdateSlotStatus = [
  param('slotId').isUUID().withMessage('slotId must be a valid UUID'),

  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(['COMPLETED', 'SKIPPED', 'DELAYED', 'CANCELLED'])
    .withMessage('status must be one of: COMPLETED, SKIPPED, DELAYED, CANCELLED'),

  body('notes').optional().isString().trim().isLength({ max: 1000 }),
  body('performed_by').optional().isString().trim(),
];

// ============================================
// Bulk Update Slots
// ============================================
const validateBulkUpdate = [
  body('slot_ids')
    .isArray({ min: 1 }).withMessage('slot_ids must be a non-empty array')
    .custom((ids) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!ids.every(id => uuidRegex.test(id))) {
        throw new Error('All slot_ids must be valid UUIDs');
      }
      return true;
    }),

  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(['COMPLETED', 'SKIPPED', 'CANCELLED'])
    .withMessage('status must be one of: COMPLETED, SKIPPED, CANCELLED'),

  body('notes').optional().isString().trim().isLength({ max: 1000 }),
  body('performed_by').optional().isString().trim(),
];

// ============================================
// Request ID param
// ============================================
const validateRequestId = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

// ============================================
// List Requests query params
// ============================================
const validateListQuery = [
  query('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD'])
    .withMessage('Invalid status value'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = {
  validateCreateRequest,
  validateUpdateSlotStatus,
  validateBulkUpdate,
  validateRequestId,
  validateListQuery,
};
