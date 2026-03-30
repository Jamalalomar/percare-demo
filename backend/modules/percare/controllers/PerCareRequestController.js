/**
 * PerCare Request Controller
 * Handles HTTP request/response for PerCare request operations
 */

const requestService  = require('../services/PerCareRequestService');
const scheduleService = require('../services/PerCareScheduleService');

class PerCareRequestController {
  /**
   * POST /api/percare/requests
   * Create a new PerCare request
   */
  async create(req, res, next) {
    try {
      const data = {
        ...req.body,
        created_by: req.user?.id || req.body.created_by,
        provider_id: req.user?.provider_id || req.body.provider_id,
      };
      const request = await requestService.createRequest(data);
      res.status(201).json({
        success: true,
        message: 'PerCare request created successfully',
        data:    request,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/percare/requests
   * List requests with filters and pagination
   */
  async list(req, res, next) {
    try {
      const { status, provider_id, external_patient_id, search, page, limit } = req.query;
      const result = await requestService.listRequests({
        status,
        provider_id,
        external_patient_id,
        search,
        page:  page  ? parseInt(page, 10)  : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/percare/requests/:id
   * Get request details
   */
  async getOne(req, res, next) {
    try {
      const request = await requestService.getRequestDetails(req.params.id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/percare/requests/:id/slots
   * Get weekly schedule slots
   */
  async getSlots(req, res, next) {
    try {
      const { service_code, status, day_number } = req.query;
      const { services, grid, slots } = await scheduleService.getWeeklyGrid(req.params.id);
      res.json({
        success: true,
        data:    { services, grid, slots },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/percare/requests/:id/recalculate
   * Recalculate schedule
   */
  async recalculate(req, res, next) {
    try {
      const request = await scheduleService.recalculateSchedule(
        req.params.id,
        req.user?.id || 'system'
      );
      res.json({
        success: true,
        message: 'Schedule recalculated successfully',
        data:    request,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/percare/requests/:id/cancel
   * Cancel a request
   */
  async cancel(req, res, next) {
    try {
      const { reason } = req.body;
      const request = await requestService.cancelRequest(
        req.params.id,
        req.user?.id || 'system',
        reason
      );
      res.json({
        success: true,
        message: 'Request cancelled successfully',
        data:    request,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/percare/requests/:id/stats
   * Get request KPI stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await requestService.getRequestStats(req.params.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PerCareRequestController();
