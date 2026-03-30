// ============================================================
// controllers/PerCareBulkController.js
// ============================================================
'use strict';

const bulkSvc    = require('../services/PerCareBulkService');
const requestSvc = require('../services/PerCareRequestService');
const requestRepo = require('../repositories/PerCareRequestRepository');

const PerCareBulkController = {

  // POST /api/percare/requests/:id/bulk-complete-day
  // Body: { scheduled_date, service_code?, note? }
  async completeDaySlots(req, res) {
    try {
      const { scheduled_date, service_code, note } = req.body;
      if (!scheduled_date) {
        return res.status(400).json({ success: false, message: 'scheduled_date is required' });
      }
      const result = await bulkSvc.bulkUpdateByDate({
        requestId:     req.params.id,
        scheduledDate: scheduled_date,
        newStatus:     'COMPLETED',
        serviceCode:   service_code,
        userId:        req.user?.id || req.headers['x-user-id'],
        note,
      });
      return res.json({ success: true, data: result, message: `${result.updated} slot(s) marked completed` });
    } catch (err) {
      console.error('[PerCareBulkController.completeDaySlots]', err);
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  },

  // POST /api/percare/requests/:id/cancel
  // Cancel entire request + all pending/delayed slots
  async cancelRequest(req, res) {
    try {
      const { note } = req.body;
      const request  = await requestRepo.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (request.status === 'CANCELLED') {
        return res.status(422).json({ success: false, message: 'Request is already cancelled' });
      }
      if (request.status === 'COMPLETED') {
        return res.status(422).json({ success: false, message: 'Cannot cancel a completed request' });
      }

      // Cancel all pending/delayed slots
      await bulkSvc.bulkUpdateAll({
        requestId: req.params.id,
        newStatus: 'CANCELLED',
        userId:    req.user?.id || req.headers['x-user-id'],
        note:      note || 'Request cancelled',
      });

      // Set request status to CANCELLED
      const updated = await requestRepo.cancel(req.params.id);
      return res.json({
        success: true,
        data:    updated,
        message: 'Request and all pending slots cancelled successfully',
      });
    } catch (err) {
      console.error('[PerCareBulkController.cancelRequest]', err);
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  },
};

module.exports = PerCareBulkController;
