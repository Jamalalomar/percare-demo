// ============================================================
// services/PerCareStatsService.js
// KPI-ready aggregate statistics for the PerCare module.
// Used by:
//   GET /api/percare/stats                  → portal dashboard
//   GET /api/percare/requests/:id/kpi       → per-request KPI card
// ============================================================
'use strict';

const db = require('../../../db/pool');

class PerCareStatsService {

  // ── Global aggregate stats (portal-level) ─────────────────
  /**
   * Returns counts and rates across ALL requests (optionally
   * filtered by provider_id or date range).
   *
   * @param {object} opts
   * @param {string} [opts.provider_id]
   * @param {string} [opts.from_date]   YYYY-MM-DD
   * @param {string} [opts.to_date]     YYYY-MM-DD
   * @param {string} [opts.level_id]
   */
  async getGlobalStats({ provider_id, from_date, to_date, level_id } = {}) {
    const conditions = [];
    const params     = [];
    let   idx        = 1;

    if (provider_id) { conditions.push(`r.provider_id = $${idx++}`); params.push(provider_id); }
    if (level_id)    { conditions.push(`r.level_id = $${idx++}`);    params.push(level_id);    }
    if (from_date)   { conditions.push(`r.start_date >= $${idx++}`); params.push(from_date);   }
    if (to_date)     { conditions.push(`r.start_date <= $${idx++}`); params.push(to_date);     }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const requestStats = await db.query(`
      SELECT
        COUNT(*)                                              AS total_requests,
        COUNT(*) FILTER (WHERE r.status = 'NOT_STARTED')     AS not_started,
        COUNT(*) FILTER (WHERE r.status = 'IN_PROGRESS')     AS in_progress,
        COUNT(*) FILTER (WHERE r.status = 'COMPLETED')       AS completed,
        COUNT(*) FILTER (WHERE r.status = 'DELAYED')         AS delayed,
        COUNT(*) FILTER (WHERE r.status = 'CANCELLED')       AS cancelled,
        COALESCE(SUM(r.total_slots_count),     0)            AS total_slots,
        COALESCE(SUM(r.completed_slots_count), 0)            AS total_completed,
        COALESCE(SUM(r.delayed_slots_count),   0)            AS total_delayed,
        COALESCE(SUM(r.pending_slots_count),   0)            AS total_pending,
        COALESCE(AVG(r.completion_percentage), 0)            AS avg_completion_pct
      FROM percare_requests r
      ${where}
    `, params);

    const r = requestStats.rows[0];

    const totalRequests  = parseInt(r.total_requests,  10) || 0;
    const totalSlots     = parseInt(r.total_slots,     10) || 0;
    const totalCompleted = parseInt(r.total_completed, 10) || 0;
    const totalDelayed   = parseInt(r.total_delayed,   10) || 0;

    return {
      requests: {
        total:      totalRequests,
        notStarted: parseInt(r.not_started, 10) || 0,
        inProgress: parseInt(r.in_progress,  10) || 0,
        completed:  parseInt(r.completed,    10) || 0,
        delayed:    parseInt(r.delayed,      10) || 0,
        cancelled:  parseInt(r.cancelled,    10) || 0,
        completionRate: totalRequests > 0
          ? parseFloat(((parseInt(r.completed, 10) / totalRequests) * 100).toFixed(2))
          : 0,
        delayRate: totalRequests > 0
          ? parseFloat(((parseInt(r.delayed, 10) / totalRequests) * 100).toFixed(2))
          : 0,
      },
      slots: {
        total:         totalSlots,
        completed:     totalCompleted,
        delayed:       totalDelayed,
        pending:       parseInt(r.total_pending, 10) || 0,
        completionRate: totalSlots > 0
          ? parseFloat(((totalCompleted / totalSlots) * 100).toFixed(2))
          : 0,
        delayRate: totalSlots > 0
          ? parseFloat(((totalDelayed / totalSlots) * 100).toFixed(2))
          : 0,
      },
      avgCompletionPct: parseFloat(parseFloat(r.avg_completion_pct || 0).toFixed(2)),
    };
  }

  // ── Per-request KPI card ───────────────────────────────────
  /**
   * Returns detailed KPI metrics for one specific request.
   * Includes per-service breakdown + timeline data.
   */
  async getRequestKPI(requestId) {
    // Per-service breakdown
    const serviceRows = await db.query(`
      SELECT
        i.service_code,
        i.service_name,
        i.weekly_frequency,
        i.total_required,
        i.completed_count,
        i.delayed_count,
        i.remaining_count,
        i.status,
        CASE WHEN i.total_required > 0
             THEN ROUND((i.completed_count::numeric / i.total_required) * 100, 2)
             ELSE 0
        END AS completion_rate,
        CASE WHEN i.total_required > 0
             THEN ROUND((i.delayed_count::numeric / i.total_required) * 100, 2)
             ELSE 0
        END AS delay_rate
      FROM percare_request_items i
      WHERE i.percare_request_id = $1
      ORDER BY COALESCE(i.sort_order, 9999), i.service_name
    `, [requestId]);

    // Per-day slot counts (timeline)
    const timelineRows = await db.query(`
      SELECT
        scheduled_date,
        scheduled_day_index,
        COUNT(*)                                      AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')  AS completed,
        COUNT(*) FILTER (WHERE status = 'DELAYED')    AS delayed,
        COUNT(*) FILTER (WHERE status = 'PENDING')    AS pending,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')  AS cancelled
      FROM percare_schedule_slots
      WHERE percare_request_id = $1
      GROUP BY scheduled_date, scheduled_day_index
      ORDER BY scheduled_day_index
    `, [requestId]);

    // Overall slot aggregates
    const totalsRow = await db.query(`
      SELECT
        COUNT(*)                                      AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')  AS completed,
        COUNT(*) FILTER (WHERE status = 'DELAYED')    AS delayed,
        COUNT(*) FILTER (WHERE status = 'PENDING')    AS pending,
        MIN(completed_at)                             AS first_completion,
        MAX(completed_at)                             AS last_completion,
        MIN(delayed_at)                               AS first_delay
      FROM percare_schedule_slots
      WHERE percare_request_id = $1
    `, [requestId]);

    const t = totalsRow.rows[0];

    return {
      serviceBreakdown: serviceRows.rows.map(row => ({
        serviceCode:     row.service_code,
        serviceName:     row.service_name,
        weeklyFrequency: parseInt(row.weekly_frequency, 10),
        totalRequired:   parseInt(row.total_required,   10),
        completedCount:  parseInt(row.completed_count,  10),
        delayedCount:    parseInt(row.delayed_count,    10),
        remainingCount:  parseInt(row.remaining_count,  10),
        completionRate:  parseFloat(row.completion_rate),
        delayRate:       parseFloat(row.delay_rate),
        status:          row.status,
      })),
      dailyTimeline: timelineRows.rows.map(row => ({
        date:           row.scheduled_date,
        dayIndex:       parseInt(row.scheduled_day_index, 10),
        total:          parseInt(row.total,     10),
        completed:      parseInt(row.completed, 10),
        delayed:        parseInt(row.delayed,   10),
        pending:        parseInt(row.pending,   10),
        cancelled:      parseInt(row.cancelled, 10),
        completionRate: parseInt(row.total, 10) > 0
          ? parseFloat(((parseInt(row.completed, 10) / parseInt(row.total, 10)) * 100).toFixed(2))
          : 0,
      })),
      summary: {
        totalSlots:      parseInt(t.total,     10) || 0,
        completedSlots:  parseInt(t.completed, 10) || 0,
        delayedSlots:    parseInt(t.delayed,   10) || 0,
        pendingSlots:    parseInt(t.pending,   10) || 0,
        firstCompletion: t.first_completion || null,
        lastCompletion:  t.last_completion  || null,
        firstDelay:      t.first_delay      || null,
      },
    };
  }

  // ── Top delayed services (global) ─────────────────────────
  async getTopDelayedServices({ provider_id, limit = 10 } = {}) {
    const conditions = provider_id ? [`r.provider_id = $1`] : [];
    const params     = provider_id ? [provider_id, limit]  : [limit];
    const where      = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const limitParam = provider_id ? '$2' : '$1';

    const res = await db.query(`
      SELECT
        i.service_code,
        i.service_name,
        SUM(i.delayed_count)    AS total_delayed,
        SUM(i.total_required)   AS total_required,
        SUM(i.completed_count)  AS total_completed,
        ROUND(SUM(i.delayed_count)::numeric / NULLIF(SUM(i.total_required), 0) * 100, 2)
          AS delay_rate
      FROM percare_request_items i
      JOIN percare_requests r ON r.id = i.percare_request_id
      ${where}
      GROUP BY i.service_code, i.service_name
      ORDER BY total_delayed DESC
      LIMIT ${limitParam}
    `, params);

    return res.rows.map(row => ({
      serviceCode:    row.service_code,
      serviceName:    row.service_name,
      totalDelayed:   parseInt(row.total_delayed,   10) || 0,
      totalRequired:  parseInt(row.total_required,  10) || 0,
      totalCompleted: parseInt(row.total_completed, 10) || 0,
      delayRate:      parseFloat(row.delay_rate)    || 0,
    }));
  }
}

module.exports = new PerCareStatsService();
