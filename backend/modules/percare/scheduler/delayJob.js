/**
 * PerCare Delay Job (Daily Cron)
 * Marks all PENDING slots past their scheduled date as DELAYED
 * Runs at 1:00 AM daily by default
 */

const cron = require('node-cron');
const config = require('../../../config');
const slotRepo   = require('../repositories/PerCareScheduleSlotRepository');
const itemRepo   = require('../repositories/PerCareRequestItemRepository');
const requestRepo = require('../repositories/PerCareRequestRepository');
const logRepo    = require('../repositories/PerCareStatusLogRepository');
const { withTransaction } = require('../../../db/pool');

let isRunning = false;

/**
 * Core delay marking logic — can be called manually or via cron
 */
async function markOverdueSlots() {
  if (isRunning) {
    console.warn('[DelayJob] Job already running, skipping...');
    return { skipped: true };
  }

  isRunning = true;
  const startTime = Date.now();
  let markedCount = 0;
  const affectedRequests = new Set();
  const affectedItems    = new Set();

  try {
    console.log('[DelayJob] Starting overdue slot marking...');
    const overdueSlots = await slotRepo.findOverdue();
    console.log(`[DelayJob] Found ${overdueSlots.length} overdue slots`);

    if (overdueSlots.length === 0) {
      return { marked: 0, duration_ms: Date.now() - startTime };
    }

    await withTransaction(async (client) => {
      for (const slot of overdueSlots) {
        const updated = await slotRepo.markDelayed(slot.id, client);
        if (updated) {
          markedCount++;
          affectedRequests.add(slot.request_id);
          affectedItems.add(slot.item_id);

          await logRepo.create({
            request_id:   slot.request_id,
            slot_id:      slot.id,
            item_id:      slot.item_id,
            action:       'DELAYED_MARKED',
            old_status:   'PENDING',
            new_status:   'DELAYED',
            performed_by: 'system:delay-job',
            note:         `Auto-delayed: scheduled for ${slot.scheduled_date}`,
            metadata:     { scheduled_date: slot.scheduled_date, job_run_at: new Date().toISOString() },
          }, client);
        }
      }

      // Update rollups for all affected items and requests
      for (const itemId of affectedItems) {
        await itemRepo.updateRollup(itemId, client);
      }
      for (const requestId of affectedRequests) {
        await requestRepo.updateRollup(requestId, client);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`[DelayJob] Done. Marked ${markedCount} slots as DELAYED in ${duration}ms`);
    return {
      marked:           markedCount,
      affected_requests: affectedRequests.size,
      affected_items:    affectedItems.size,
      duration_ms:       duration,
    };
  } catch (err) {
    console.error('[DelayJob] Error:', err.message);
    throw err;
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cron job
 */
function startDelayJob() {
  const schedule = config.cron.delayJobSchedule;
  const timezone = config.cron.timezone;

  console.log(`[DelayJob] Scheduling cron: "${schedule}" (${timezone})`);

  const task = cron.schedule(schedule, async () => {
    try {
      await markOverdueSlots();
    } catch (err) {
      console.error('[DelayJob] Cron execution error:', err.message);
    }
  }, { timezone });

  console.log('[DelayJob] Cron started successfully');
  return task;
}

module.exports = { startDelayJob, markOverdueSlots };
