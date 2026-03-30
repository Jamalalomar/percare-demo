/**
 * PerCare Scheduling Engine
 * Distributes weekly service frequency evenly across 7 days
 *
 * Algorithm:
 *   base_per_day = floor(weekly_frequency / 7)
 *   remainder    = weekly_frequency % 7
 *   Days 1..remainder get (base+1) slots; rest get base slots
 */

/**
 * Calculate slot distribution for a single service
 * @param {number} weeklyFrequency - total sessions per week
 * @returns {number[]} Array of 7 elements (index 0=Day1), each = slot count for that day
 */
function distributeFrequency(weeklyFrequency) {
  const base      = Math.floor(weeklyFrequency / 7);
  const remainder = weeklyFrequency % 7;
  return Array.from({ length: 7 }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Generate slot records for a request item
 * @param {object} params
 * @param {string} params.requestId
 * @param {string} params.itemId
 * @param {string} params.serviceCode
 * @param {string} params.serviceName
 * @param {Date|string} params.startDate - ISO date string or Date object
 * @param {number} params.weeklyFrequency
 * @returns {object[]} Array of slot objects ready for DB insertion
 */
function generateSlots({ requestId, itemId, serviceCode, serviceName, startDate, weeklyFrequency }) {
  const start       = new Date(startDate);
  const distribution = distributeFrequency(weeklyFrequency);
  const slots        = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayNumber   = dayIndex + 1;
    const slotsOnDay  = distribution[dayIndex];
    const slotDate    = new Date(start);
    slotDate.setDate(start.getDate() + dayIndex);
    const dateStr = slotDate.toISOString().split('T')[0];

    for (let slotIndex = 1; slotIndex <= slotsOnDay; slotIndex++) {
      slots.push({
        request_id:     requestId,
        item_id:        itemId,
        service_code:   serviceCode,
        service_name:   serviceName,
        scheduled_date: dateStr,
        day_number:     dayNumber,
        slot_index:     slotIndex,
        status:         'PENDING',
      });
    }
  }

  return slots;
}

/**
 * Calculate end_date as start_date + 6 days
 * @param {string} startDate - ISO date string
 * @returns {string} ISO date string for end date
 */
function calculateEndDate(startDate) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

/**
 * Get a human-readable distribution summary
 * @param {number} weeklyFrequency
 * @returns {object} { distribution, base, remainder, total }
 */
function getDistributionSummary(weeklyFrequency) {
  const base        = Math.floor(weeklyFrequency / 7);
  const remainder   = weeklyFrequency % 7;
  const distribution = distributeFrequency(weeklyFrequency);
  return {
    base,
    remainder,
    distribution,
    total: distribution.reduce((sum, d) => sum + d, 0),
  };
}

module.exports = {
  distributeFrequency,
  generateSlots,
  calculateEndDate,
  getDistributionSummary,
};
