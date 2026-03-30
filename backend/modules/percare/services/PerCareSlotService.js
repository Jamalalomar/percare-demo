/**
 * PerCare Slot Service
 * Handles slot status updates and audit log creation
 */

const slotRepo    = require('../repositories/PerCareScheduleSlotRepository');
const itemRepo    = require('../repositories/PerCareRequestItemRepository');
const requestRepo = require('../repositories/PerCareRequestRepository');
const logRepo     = require('../repositories/PerCareStatusLogRepository');
const { withTransaction } = require('../../../db/pool');

// Valid status transitions
const VALID_TRANSITIONS = {
  PENDING:   ['COMPLETED', 'SKIPPED', 'DELAYED', 'CANCELLED'],
  DELAYED:   ['COMPLETED', 'SKIPPED', 'CANCELLED'],
  COMPLETED: [], // terminal
  SKIPPED:   [], // terminal
  CANCELLED: [], // terminal
};

class PerCareSlotService {
  /**
   * Update a single slot's status
   */
  async updateSlotStatus(slotId, { status, notes, performed_by }) {
    const slot = await slotRepo.findById(slotId);
    if (!slot) throw new Error('Slot not found');

    const allowed = VALID_TRANSITIONS[slot.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(
        `Invalid transition: ${slot.status} → ${status}. Allowed: [${allowed.join(', ')}]`
      );
    }

    let updatedSlot;
    await withTransaction(async (client) => {
      updatedSlot = await slotRepo.updateStatus(slotId, status, { notes, completed_by: performed_by }, client);

      await logRepo.create({
        request_id:   slot.request_id,
        slot_id:      slotId,
        item_id:      slot.item_id,
        action:       'SLOT_UPDATED',
        old_status:   slot.status,
        new_status:   status,
        performed_by,
        note:         notes || null,
      }, client);

      // Update rollups
      await itemRepo.updateRollup(slot.item_id, client);
      await requestRepo.updateRollup(slot.request_id, client);
    });

    return updatedSlot;
  }

  /**
   * Bulk update slot statuses
   */
  async bulkUpdateSlots(slotIds, { status, notes, performed_by }) {
    if (!slotIds || slotIds.length === 0) throw new Error('No slot IDs provided');

    // Verify status is valid for bulk update (only COMPLETED and SKIPPED allowed for bulk)
    if (!['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(status)) {
      throw new Error('Bulk update only supports: COMPLETED, SKIPPED, CANCELLED');
    }

    const results = [];
    const affectedRequests = new Set();
    const affectedItems    = new Set();

    await withTransaction(async (client) => {
      const updatedSlots = await slotRepo.bulkUpdateStatus(slotIds, status, performed_by, client);

      for (const updatedSlot of updatedSlots) {
        // Find original slot to get old_status
        const originalSlot = await slotRepo.findById(updatedSlot.id);
        await logRepo.create({
          request_id:   updatedSlot.request_id,
          slot_id:      updatedSlot.id,
          item_id:      updatedSlot.item_id,
          action:       'BULK_UPDATED',
          old_status:   'PENDING', // bulk only targets PENDING
          new_status:   status,
          performed_by,
          note:         notes || 'Bulk update',
        }, client);

        affectedRequests.add(updatedSlot.request_id);
        affectedItems.add(updatedSlot.item_id);
        results.push(updatedSlot);
      }

      // Update rollups
      for (const itemId of affectedItems) {
        await itemRepo.updateRollup(itemId, client);
      }
      for (const requestId of affectedRequests) {
        await requestRepo.updateRollup(requestId, client);
      }
    });

    return results;
  }

  /**
   * Get slot details with audit log
   */
  async getSlotWithLogs(slotId) {
    const slot = await slotRepo.findById(slotId);
    if (!slot) throw new Error('Slot not found');
    const logs = await logRepo.findBySlotId(slotId);
    return { ...slot, logs };
  }

  /**
   * Get all slots for a request
   */
  async getRequestSlots(requestId, filters = {}) {
    return slotRepo.findByRequestId(requestId, filters);
  }

  /**
   * Check valid transitions for a slot
   */
  getValidTransitions(currentStatus) {
    return VALID_TRANSITIONS[currentStatus] || [];
  }
}

module.exports = new PerCareSlotService();
