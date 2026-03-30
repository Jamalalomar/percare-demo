const { query } = require('../../../db/pool');

class PerCareStatusLogRepository {
  /**
   * Create a status log entry
   */
  async create(data, client = null) {
    const q = client || { query: (...args) => query(...args) };
    const { rows } = await q.query(
      `INSERT INTO percare_status_logs
         (request_id, slot_id, item_id, action, old_status, new_status, performed_by, note, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.request_id,
        data.slot_id       || null,
        data.item_id       || null,
        data.action,
        data.old_status    || null,
        data.new_status    || null,
        data.performed_by  || null,
        data.note          || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return rows[0];
  }

  /**
   * Bulk create logs
   */
  async bulkCreate(logs, client = null) {
    if (!logs || logs.length === 0) return [];
    for (const log of logs) {
      await this.create(log, client);
    }
  }

  /**
   * Find logs for a request
   */
  async findByRequestId(requestId, limit = 50) {
    const { rows } = await query(
      `SELECT * FROM percare_status_logs
       WHERE request_id=$1
       ORDER BY created_at DESC
       LIMIT $2`,
      [requestId, limit]
    );
    return rows;
  }

  /**
   * Find logs for a specific slot
   */
  async findBySlotId(slotId) {
    const { rows } = await query(
      `SELECT * FROM percare_status_logs
       WHERE slot_id=$1
       ORDER BY created_at DESC`,
      [slotId]
    );
    return rows;
  }

  /**
   * Find logs for a service item
   */
  async findByItemId(itemId) {
    const { rows } = await query(
      `SELECT * FROM percare_status_logs
       WHERE item_id=$1
       ORDER BY created_at DESC`,
      [itemId]
    );
    return rows;
  }

  /**
   * Count delayed-mark actions in last 24h (for reporting)
   */
  async countRecentDelays() {
    const { rows } = await query(
      `SELECT COUNT(*) AS count FROM percare_status_logs
       WHERE action='DELAYED_MARKED'
         AND created_at > NOW() - INTERVAL '24 hours'`
    );
    return parseInt(rows[0].count, 10);
  }
}

module.exports = new PerCareStatusLogRepository();
