const { query } = require('../../../db/pool');

class PerCareScheduleSlotRepository {
  /**
   * Bulk insert slots
   */
  async bulkCreate(slots, client = null) {
    if (!slots || slots.length === 0) return [];
    const q = client || { query: (...args) => query(...args) };

    const values = [];
    const placeholders = slots.map((s, i) => {
      const base = i * 8;
      values.push(
        s.request_id, s.item_id, s.service_code, s.service_name,
        s.scheduled_date, s.day_number, s.slot_index, s.status || 'PENDING'
      );
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`;
    });

    const sql = `
      INSERT INTO percare_schedule_slots
        (request_id, item_id, service_code, service_name, scheduled_date, day_number, slot_index, status)
      VALUES ${placeholders.join(',')}
      RETURNING *
    `;
    const { rows } = await q.query(sql, values);
    return rows;
  }

  /**
   * Find all slots for a request
   */
  async findByRequestId(requestId, filters = {}) {
    const params = [requestId];
    const conditions = ['request_id=$1'];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status=$${params.length}`);
    }
    if (filters.service_code) {
      params.push(filters.service_code);
      conditions.push(`service_code=$${params.length}`);
    }
    if (filters.day_number) {
      params.push(filters.day_number);
      conditions.push(`day_number=$${params.length}`);
    }

    const { rows } = await query(
      `SELECT * FROM percare_schedule_slots
       WHERE ${conditions.join(' AND ')}
       ORDER BY day_number ASC, slot_index ASC`,
      params
    );
    return rows;
  }

  /**
   * Find slot by ID
   */
  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM percare_schedule_slots WHERE id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find slots by item ID
   */
  async findByItemId(itemId) {
    const { rows } = await query(
      `SELECT * FROM percare_schedule_slots WHERE item_id=$1 ORDER BY day_number, slot_index`,
      [itemId]
    );
    return rows;
  }

  /**
   * Update slot status
   */
  async updateStatus(id, status, additionalData = {}, client = null) {
    const q = client || { query: (...args) => query(...args) };
    const updates = ['status=$1'];
    const params  = [status];

    if (status === 'COMPLETED') {
      params.push(additionalData.completed_by || null);
      updates.push(`completed_at=NOW(), completed_by=$${params.length}`);
    }
    if (additionalData.notes !== undefined) {
      params.push(additionalData.notes);
      updates.push(`notes=$${params.length}`);
    }

    params.push(id);
    const { rows } = await q.query(
      `UPDATE percare_schedule_slots SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    return rows[0];
  }

  /**
   * Find overdue PENDING slots (past today)
   */
  async findOverdue() {
    const { rows } = await query(
      `SELECT s.*, r.provider_id, r.external_patient_id
       FROM percare_schedule_slots s
       JOIN percare_requests r ON r.id = s.request_id
       WHERE s.status='PENDING'
         AND s.scheduled_date < CURRENT_DATE
         AND r.status IN ('ACTIVE','ON_HOLD')`,
    );
    return rows;
  }

  /**
   * Mark a slot as DELAYED
   */
  async markDelayed(id, client = null) {
    const q = client || { query: (...args) => query(...args) };
    const { rows } = await q.query(
      `UPDATE percare_schedule_slots SET status='DELAYED' WHERE id=$1 AND status='PENDING' RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Delete slots for a request (used during recalculation)
   */
  async deleteByRequestId(requestId, client = null) {
    const q = client || { query: (...args) => query(...args) };
    await q.query(
      `DELETE FROM percare_schedule_slots WHERE request_id=$1`,
      [requestId]
    );
  }

  /**
   * Delete slots for an item
   */
  async deleteByItemId(itemId, client = null) {
    const q = client || { query: (...args) => query(...args) };
    await q.query(
      `DELETE FROM percare_schedule_slots WHERE item_id=$1`,
      [itemId]
    );
  }

  /**
   * Bulk update slot statuses
   */
  async bulkUpdateStatus(slotIds, status, updatedBy = null, client = null) {
    if (!slotIds || slotIds.length === 0) return [];
    const q = client || { query: (...args) => query(...args) };

    const params = [status];
    const placeholders = slotIds.map((id, i) => {
      params.push(id);
      return `$${params.length}`;
    });

    let extraUpdates = '';
    if (status === 'COMPLETED') {
      params.push(updatedBy);
      extraUpdates = `, completed_at=NOW(), completed_by=$${params.length}`;
    }

    const { rows } = await q.query(
      `UPDATE percare_schedule_slots
       SET status=$1${extraUpdates}
       WHERE id IN (${placeholders.join(',')})
         AND status='PENDING'
       RETURNING *`,
      params
    );
    return rows;
  }

  /**
   * Get slot counts grouped by day for a request
   */
  async getSlotCountsByDay(requestId) {
    const { rows } = await query(
      `SELECT day_number,
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
              COUNT(*) FILTER (WHERE status='DELAYED')   AS delayed,
              COUNT(*) FILTER (WHERE status='PENDING')   AS pending
       FROM percare_schedule_slots
       WHERE request_id=$1
       GROUP BY day_number
       ORDER BY day_number`,
      [requestId]
    );
    return rows;
  }
}

module.exports = new PerCareScheduleSlotRepository();
