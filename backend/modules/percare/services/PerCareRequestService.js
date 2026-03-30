/**
 * PerCare Request Service
 * Handles request creation, retrieval, cancellation
 */

const requestRepo  = require('../repositories/PerCareRequestRepository');
const itemRepo     = require('../repositories/PerCareRequestItemRepository');
const slotRepo     = require('../repositories/PerCareScheduleSlotRepository');
const logRepo      = require('../repositories/PerCareStatusLogRepository');
const scheduleService = require('./PerCareScheduleService');
const { calculateEndDate } = require('../scheduler/schedulingEngine');
const { withTransaction }  = require('../../../db/pool');

class PerCareRequestService {
  /**
   * Create a new PerCare request with items and schedule
   */
  async createRequest(data) {
    const {
      external_request_id, external_patient_id, provider_id, patient_name,
      start_date, notes, selected_services, created_by,
    } = data;

    const end_date = calculateEndDate(start_date);

    const request = await withTransaction(async (client) => {
      // Create request record
      const req = await requestRepo.create(
        { external_request_id, external_patient_id, provider_id, patient_name,
          start_date, end_date, status: 'ACTIVE', notes, created_by },
        client
      );

      // Create items
      const createdItems = [];
      for (const svc of selected_services) {
        const item = await itemRepo.create({
          request_id:      req.id,
          service_code:    svc.service_code,
          service_name:    svc.service_name,
          weekly_frequency: svc.weekly_frequency,
        }, client);
        createdItems.push(item);
      }

      // Generate schedule slots
      await scheduleService.generateRequestSlots(req.id, createdItems, start_date, client);

      // Create log entry
      await logRepo.create({
        request_id:   req.id,
        action:       'CREATED',
        new_status:   'ACTIVE',
        performed_by: created_by || 'system',
        note:         'PerCare request created',
      }, client);

      return req;
    });

    return this.getRequestDetails(request.id);
  }

  /**
   * Get list of requests with filters and pagination
   */
  async listRequests(filters = {}) {
    return requestRepo.findAll(filters);
  }

  /**
   * Get full request details including items and rollup
   */
  async getRequestDetails(requestId) {
    const request = await requestRepo.findById(requestId);
    if (!request) return null;

    const items = await itemRepo.findByRequestId(requestId);
    return { ...request, items };
  }

  /**
   * Cancel a request
   */
  async cancelRequest(requestId, performedBy = 'system', reason = '') {
    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (request.status === 'CANCELLED') throw new Error('Request is already cancelled');
    if (request.status === 'COMPLETED') throw new Error('Cannot cancel a completed request');

    await withTransaction(async (client) => {
      // Cancel pending slots
      await client.query(
        `UPDATE percare_schedule_slots
         SET status='CANCELLED'
         WHERE request_id=$1 AND status='PENDING'`,
        [requestId]
      );

      // Update request status
      await requestRepo.updateStatus(requestId, 'CANCELLED', performedBy);
      await requestRepo.updateRollup(requestId, client);

      await logRepo.create({
        request_id:   requestId,
        action:       'CANCELLED',
        old_status:   request.status,
        new_status:   'CANCELLED',
        performed_by: performedBy,
        note:         reason || 'Request cancelled',
      }, client);
    });

    return requestRepo.findById(requestId);
  }

  /**
   * Get request statistics / KPIs
   */
  async getRequestStats(requestId) {
    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');

    const items = await itemRepo.findByRequestId(requestId);
    const dayStats = await slotRepo.getSlotCountsByDay(requestId);

    return {
      request_id:      request.id,
      status:          request.status,
      total_slots:     request.total_slots,
      completed_slots: request.completed_slots,
      delayed_slots:   request.delayed_slots,
      pending_slots:   request.pending_slots,
      skipped_slots:   request.skipped_slots,
      completion_pct:  parseFloat(request.completion_pct),
      services:        items.map(i => ({
        service_code:    i.service_code,
        service_name:    i.service_name,
        weekly_frequency: i.weekly_frequency,
        total_slots:     i.total_slots,
        completed_slots: i.completed_slots,
        delayed_slots:   i.delayed_slots,
        completion_pct:  parseFloat(i.completion_pct),
      })),
      day_stats: dayStats,
    };
  }
}

module.exports = new PerCareRequestService();
