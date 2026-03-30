/**
 * PerCare Progress Service
 * Returns progress metrics for requests and items
 */

const requestRepo = require('../repositories/PerCareRequestRepository');
const itemRepo    = require('../repositories/PerCareRequestItemRepository');
const slotRepo    = require('../repositories/PerCareScheduleSlotRepository');

class PerCareProgressService {
  /**
   * Get progress for a request
   */
  async getRequestProgress(requestId) {
    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');

    const items   = await itemRepo.findByRequestId(requestId);
    const dayStats = await slotRepo.getSlotCountsByDay(requestId);

    return {
      request_id:      request.id,
      status:          request.status,
      start_date:      request.start_date,
      end_date:        request.end_date,
      total_slots:     request.total_slots,
      completed_slots: request.completed_slots,
      delayed_slots:   request.delayed_slots,
      pending_slots:   request.pending_slots,
      completion_pct:  parseFloat(request.completion_pct),
      services:        items.map(i => ({
        service_code:    i.service_code,
        service_name:    i.service_name,
        weekly_frequency: i.weekly_frequency,
        total_slots:     i.total_slots,
        completed_slots: i.completed_slots,
        delayed_slots:   i.delayed_slots,
        pending_slots:   i.pending_slots,
        completion_pct:  parseFloat(i.completion_pct),
      })),
      day_breakdown:   dayStats,
    };
  }
}

module.exports = new PerCareProgressService();
