/**
 * PerCare Slot Controller
 */

const slotService = require('../services/PerCareSlotService');
const logRepo     = require('../repositories/PerCareStatusLogRepository');

class PerCareSlotController {
  /**
   * PUT /api/percare/slots/:slotId/status
   */
  async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      const performed_by = req.user?.id || req.body.performed_by || 'system';

      const updated = await slotService.updateSlotStatus(req.params.slotId, {
        status, notes, performed_by,
      });

      res.json({
        success: true,
        message: `Slot marked as ${status}`,
        data:    updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/percare/slots/:slotId/logs
   */
  async getLogs(req, res, next) {
    try {
      const result = await slotService.getSlotWithLogs(req.params.slotId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/percare/slots/bulk-update
   */
  async bulkUpdate(req, res, next) {
    try {
      const { slot_ids, status, notes } = req.body;
      const performed_by = req.user?.id || req.body.performed_by || 'system';

      const updated = await slotService.bulkUpdateSlots(slot_ids, {
        status, notes, performed_by,
      });

      res.json({
        success: true,
        message: `${updated.length} slot(s) updated to ${status}`,
        data:    updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PerCareSlotController();
