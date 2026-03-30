const { query, withTransaction } = require('../../../db/pool');

class PerCareRequestRepository {
  /**
   * Create a new PerCare request
   */
  async create(data, client = null) {
    const q = client || { query: (...args) => query(...args) };
    const sql = `
      INSERT INTO percare_requests
        (external_request_id, external_patient_id, provider_id, patient_name,
         start_date, end_date, status, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;
    const values = [
      data.external_request_id || null,
      data.external_patient_id || null,
      data.provider_id         || null,
      data.patient_name        || null,
      data.start_date,
      data.end_date,
      data.status || 'ACTIVE',
      data.notes  || null,
      data.created_by || null,
    ];
    const { rows } = await q.query(sql, values);
    return rows[0];
  }

  /**
   * Find request by ID
   */
  async findById(id) {
    const { rows } = await query(
      'SELECT * FROM percare_requests WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find request by external ID
   */
  async findByExternalId(externalId) {
    const { rows } = await query(
      'SELECT * FROM percare_requests WHERE external_request_id = $1',
      [externalId]
    );
    return rows[0] || null;
  }

  /**
   * List requests with filters and pagination
   */
  async findAll({ status, provider_id, external_patient_id, search, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (provider_id) {
      params.push(provider_id);
      conditions.push(`r.provider_id = $${params.length}`);
    }
    if (external_patient_id) {
      params.push(external_patient_id);
      conditions.push(`r.external_patient_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(r.patient_name ILIKE $${params.length} OR r.external_request_id ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM percare_requests r ${where}`;
    const { rows: [{ total }] } = await query(countSql, params);

    params.push(limit, offset);
    const dataSql = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM percare_request_items WHERE request_id = r.id) AS service_count
      FROM percare_requests r
      ${where}
      ORDER BY r.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(dataSql, params);

    return {
      data:  rows,
      total: parseInt(total, 10),
      page,
      limit,
      pages: Math.ceil(parseInt(total, 10) / limit),
    };
  }

  /**
   * Update request status
   */
  async updateStatus(id, status, updatedBy = null) {
    const { rows } = await query(
      `UPDATE percare_requests SET status=$1, updated_by=$2 WHERE id=$3 RETURNING *`,
      [status, updatedBy, id]
    );
    return rows[0];
  }

  /**
   * Update rollup counts for a request
   */
  async updateRollup(id, client = null) {
    const q = client ? client : { query: (...args) => query(...args) };
    const { rows } = await q.query(
      `SELECT
         COUNT(*) FILTER (WHERE status='PENDING')   AS pending,
         COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
         COUNT(*) FILTER (WHERE status='DELAYED')   AS delayed,
         COUNT(*) FILTER (WHERE status='SKIPPED')   AS skipped,
         COUNT(*)                                    AS total
       FROM percare_schedule_slots WHERE request_id = $1`,
      [id]
    );
    const r = rows[0];
    const total     = parseInt(r.total, 10);
    const completed = parseInt(r.completed, 10);
    const pct       = total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';

    await q.query(
      `UPDATE percare_requests SET
         total_slots=$1, completed_slots=$2, delayed_slots=$3,
         pending_slots=$4, skipped_slots=$5, completion_pct=$6
       WHERE id=$7`,
      [total, completed, parseInt(r.delayed, 10),
       parseInt(r.pending, 10), parseInt(r.skipped, 10), pct, id]
    );
  }

  /**
   * Update request notes
   */
  async updateNotes(id, notes) {
    const { rows } = await query(
      `UPDATE percare_requests SET notes=$1 WHERE id=$2 RETURNING *`,
      [notes, id]
    );
    return rows[0];
  }

  /**
   * Delete request (hard delete - use with caution)
   */
  async delete(id) {
    await query('DELETE FROM percare_requests WHERE id = $1', [id]);
  }
}

module.exports = new PerCareRequestRepository();
