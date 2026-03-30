// ============================================================
// controllers/PerCareStatsController.js
// ============================================================
'use strict';

const statsSvc = require('../services/PerCareStatsService');

const PerCareStatsController = {

  // GET /api/percare/stats
  async getGlobalStats(req, res) {
    try {
      const { provider_id, from_date, to_date, level_id } = req.query;
      const stats = await statsSvc.getGlobalStats({
        provider_id: provider_id || req.user?.provider_id,
        from_date,
        to_date,
        level_id,
      });
      return res.json({ success: true, data: stats });
    } catch (err) {
      console.error('[PerCareStatsController.getGlobalStats]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/percare/requests/:id/kpi
  async getRequestKPI(req, res) {
    try {
      const kpi = await statsSvc.getRequestKPI(req.params.id);
      return res.json({ success: true, data: kpi });
    } catch (err) {
      console.error('[PerCareStatsController.getRequestKPI]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/percare/stats/top-delayed-services
  async getTopDelayedServices(req, res) {
    try {
      const { provider_id, limit } = req.query;
      const data = await statsSvc.getTopDelayedServices({
        provider_id: provider_id || req.user?.provider_id,
        limit: parseInt(limit || '10', 10),
      });
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[PerCareStatsController.getTopDelayedServices]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = PerCareStatsController;
