/**
 * PerCare Job Controller
 * Handles manual triggering of scheduled jobs
 */

const { markOverdueSlots } = require('../scheduler/delayJob');

class PerCareJobController {
  /**
   * POST /api/percare/jobs/mark-overdue
   * Manually trigger the delay marking job
   */
  async markOverdue(req, res, next) {
    try {
      const result = await markOverdueSlots();
      res.json({
        success: true,
        message: result.skipped
          ? 'Job already running, skipped'
          : `Marked ${result.marked} slots as DELAYED`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PerCareJobController();
