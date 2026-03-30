// ============================================================
// services/PerCareBulkService.js
// Bulk slot operations: complete or cancel all pending slots
// for a given (request × day) or (request × service) scope.
// ============================================================
'use strict';

const db          = require('../../../db/pool');
const slotRepo    = require('../repositories/PerCareScheduleSlotRepository');
const logRepo     = require('../repositories/PerCareStatusLogRepository');
const progressSvc = require('./PerCareProgressService');
const { isValidSlotTransition } = require('../utils/statusUtils');

class PerCareBulkService {

  /**
   * Complete (or cancel) all actionable slots for a given date
   * within a request.
   *
   * @param {object} params
   * @param {string} params.requestId
   * @param {string} params.scheduledDate   YYYY-MM-DD
   * @param {string} params.newStatus       'COMPLETED' | 'CANCELLED'
   * @param {string} [params.serviceCode]   optional — scope to one service
   * @param {string} [params.userId]
   * @param {string} [params.note]
   *
   * @returns {{ updated: number, skipped: number, affectedItemIds: string[] }}
   */
  async bulkUpdateByDate({ requestId, scheduledDate, newStatus, serviceCode, userId, note }) {
    const filters = { scheduledDate };
    if (serviceCode) filters.serviceCode = serviceCode;

    const slots = await slotRepo.findByRequestId(requestId, filters);
    const actionable = slots.filter(s => isValidSlotTransition(s.status, newStatus));

    if (!actionable.length) {
      return { updated: 0, skipped: slots.length, affectedItemIds: [] };
    }

    const now              = new Date();
    const affectedItemIds  = new Set();
    let   updated          = 0;
    let   skipped          = slots.length - actionable.length;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      for (const slot of actionable) {
        await slotRepo.updateStatus(slot.id, {
          status:          newStatus,
          completedAt:     newStatus === 'COMPLETED' ? now : null,
          cancelledAt:     newStatus === 'CANCELLED' ? now : null,
          updatedByUserId: userId || null,
          note,
        }, client);

        await logRepo.create({
          slotId:          slot.id,
          oldStatus:       slot.status,
          newStatus,
          changedByUserId: userId || null,
          note: note || `Bulk ${newStatus.toLowerCase()} — ${scheduledDate}`,
        }, client);

        affectedItemIds.add(slot.percare_request_item_id);
        updated++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Recalculate affected items + request
    for (const itemId of affectedItemIds) {
      await progressSvc.recalculateItem(itemId);
    }
    await progressSvc.recalculateRequest(requestId);

    return { updated, skipped, affectedItemIds: [...affectedItemIds] };
  }

  /**
   * Complete (or cancel) ALL pending/delayed slots for an entire request.
   * Use with care — typically used to mark a cancelled visit.
   */
  async bulkUpdateAll({ requestId, newStatus, userId, note }) {
    const slots      = await slotRepo.findByRequestId(requestId);
    const actionable = slots.filter(s => isValidSlotTransition(s.status, newStatus));

    if (!actionable.length) return { updated: 0, skipped: slots.length };

    const now             = new Date();
    const affectedItemIds = new Set();
    let updated = 0;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      for (const slot of actionable) {
        await slotRepo.updateStatus(slot.id, {
          status:          newStatus,
          completedAt:     newStatus === 'COMPLETED' ? now : null,
          cancelledAt:     newStatus === 'CANCELLED' ? now : null,
          updatedByUserId: userId || null,
          note,
        }, client);

        await logRepo.create({
          slotId:          slot.id,
          oldStatus:       slot.status,
          newStatus,
          changedByUserId: userId || null,
          note: note || `Bulk ${newStatus.toLowerCase()} — full request`,
        }, client);

        affectedItemIds.add(slot.percare_request_item_id);
        updated++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    for (const itemId of affectedItemIds) {
      await progressSvc.recalculateItem(itemId);
    }
    await progressSvc.recalculateRequest(requestId);

    return { updated, skipped: slots.length - updated };
  }
}

module.exports = new PerCareBulkService();
