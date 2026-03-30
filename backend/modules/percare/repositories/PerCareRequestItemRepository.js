const { query } = require('../../../db/pool');

class PerCareRequestItemRepository {
  /**
   * Create a service item for a request
   */
  async create(data, client = null) {
    const q = client || { query: (...args) => query(...args) };
    const { rows } = await q.query(
      `INSERT INTO percare_request_items
         (request_id, service_code, service_name, weekly_frequency)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [data.request_id, data.service_code, data.service_name, data.weekly_frequency]
    );
    return rows[0];
  }

  /**
   * Find all items for a request
   */
  async findByRequestId(requestId) {
    const { rows } = await query(
      `SELECT * FROM percare_request_items WHERE request_id=$1 ORDER BY created_at ASC`,
      [requestId]
    );
    return rows;
  }

  /**
   * Find item by ID
   */
  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM percare_request_items WHERE id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find item by request + service code
   */
  async findByRequestAndService(requestId, serviceCode) {
    const { rows } = await query(
      `SELECT * FROM percare_request_items WHERE request_id=$1 AND service_code=$2`,
      [requestId, serviceCode]
    );
    return rows[0] || null;
  }

  /**
   * Update item rollup counts
   */
  async updateRollup(itemId, client = null) {
    const q = client || { query: (...args) => query(...args) };
    const { rows } = await q.query(
      `SELECT
         COUNT(*) FILTER (WHERE status='PENDING')   AS pending,
         COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
         COUNT(*) FILTER (WHERE status='DELAYED')   AS delayed,
         COUNT(*) FILTER (WHERE status='SKIPPED')   AS skipped,
         COUNT(*)                                    AS total
       FROM percare_schedule_slots WHERE item_id=$1`,
      [itemId]
    );
    const r = rows[0];
    const total     = parseInt(r.total, 10);
    const completed = parseInt(r.completed, 10);
    const pct       = total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';

    await q.query(
      `UPDATE percare_request_items SET
         total_slots=$1, completed_slots=$2, delayed_slots=$3,
         pending_slots=$4, skipped_slots=$5, completion_pct=$6
       WHERE id=$7`,
      [total, completed, parseInt(r.delayed, 10),
       parseInt(r.pending, 10), parseInt(r.skipped, 10), pct, itemId]
    );
  }

  /**
   * Delete all items for a request
   */
  async deleteByRequestId(requestId, client = null) {
    const q = client || { query: (...args) => query(...args) };
    await q.query(
      `DELETE FROM percare_request_items WHERE request_id=$1`,
      [requestId]
    );
  }
}

module.exports = new PerCareRequestItemRepository();
