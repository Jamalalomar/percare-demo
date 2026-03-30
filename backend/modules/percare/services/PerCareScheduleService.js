/**
 * PerCare Schedule Service
 * Generates and manages weekly schedule slots for service items
 */

const { generateSlots, calculateEndDate } = require('../scheduler/schedulingEngine');
const slotRepo    = require('../repositories/PerCareScheduleSlotRepository');
const itemRepo    = require('../repositories/PerCareRequestItemRepository');
const requestRepo = require('../repositories/PerCareRequestRepository');
const logRepo     = require('../repositories/PerCareStatusLogRepository');
const { withTransaction } = require('../../../db/pool');

class PerCareScheduleService {
  /**
   * Generate slots for all service items of a request (called during creation)
   */
  async generateRequestSlots(requestId, items, startDate, client = null) {
    const doWork = async (txClient) => {
      for (const item of items) {
        const slots = generateSlots({
          requestId,
          itemId:          item.id,
          serviceCode:     item.service_code,
          serviceName:     item.service_name,
          startDate,
          weeklyFrequency: item.weekly_frequency,
        });

        if (slots.length > 0) {
          await slotRepo.bulkCreate(slots, txClient);
        }

        // Update item total_slots count
        await txClient.query(
          `UPDATE percare_request_items SET total_slots=$1, pending_slots=$1 WHERE id=$2`,
          [slots.length, item.id]
        );
      }

      // Update request total_slots
      const { rows } = await txClient.query(
        `SELECT COUNT(*) AS total FROM percare_schedule_slots WHERE request_id=$1`,
        [requestId]
      );
      const total = parseInt(rows[0].total, 10);
      await txClient.query(
        `UPDATE percare_requests SET total_slots=$1, pending_slots=$1 WHERE id=$2`,
        [total, requestId]
      );
    };

    if (client) {
      await doWork(client);
    } else {
      await withTransaction(doWork);
    }
  }

  /**
   * Recalculate schedule for a request
   * Deletes future PENDING slots and regenerates them
   */
  async recalculateSchedule(requestId, performedBy = 'system') {
    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (!['ACTIVE', 'DRAFT'].includes(request.status)) {
      throw new Error(`Cannot recalculate request with status: ${request.status}`);
    }

    const items = await itemRepo.findByRequestId(requestId);

    await withTransaction(async (client) => {
      // Delete only PENDING slots (preserve COMPLETED/DELAYED history)
      await client.query(
        `DELETE FROM percare_schedule_slots WHERE request_id=$1 AND status='PENDING'`,
        [requestId]
      );

      // Regenerate slots for each item (only future dates)
      for (const item of items) {
        const slots = generateSlots({
          requestId,
          itemId:          item.id,
          serviceCode:     item.service_code,
          serviceName:     item.service_name,
          startDate:       request.start_date,
          weeklyFrequency: item.weekly_frequency,
        });

        // Filter to only PENDING-eligible slots (not already completed)
        const existingSlots = await slotRepo.findByItemId(item.id);
        const existingKeys  = new Set(
          existingSlots.map(s => `${s.day_number}-${s.slot_index}`)
        );

        const newSlots = slots.filter(
          s => !existingKeys.has(`${s.day_number}-${s.slot_index}`)
        );

        if (newSlots.length > 0) {
          await slotRepo.bulkCreate(newSlots, client);
        }

        await itemRepo.updateRollup(item.id, client);
      }

      await requestRepo.updateRollup(requestId, client);

      await logRepo.create({
        request_id:   requestId,
        action:       'RESCHEDULED',
        performed_by: performedBy,
        note:         'Schedule recalculated',
      }, client);
    });

    return requestRepo.findById(requestId);
  }

  /**
   * Get weekly slots grid for a request
   * Returns data structured for the 7-day grid view
   */
  async getWeeklyGrid(requestId) {
    const slots = await slotRepo.findByRequestId(requestId);
    const items = await itemRepo.findByRequestId(requestId);

    // Build grid: { [service_code]: { [day_number]: [slots] } }
    const grid = {};
    const serviceMap = {};

    for (const item of items) {
      serviceMap[item.service_code] = item;
      grid[item.service_code] = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    }

    for (const slot of slots) {
      if (grid[slot.service_code]) {
        grid[slot.service_code][slot.day_number].push(slot);
      }
    }

    return {
      services: items,
      grid,
      slots,
    };
  }
}

module.exports = new PerCareScheduleService();
