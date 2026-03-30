/**
 * PerCare Delay Service
 * Wraps the delay job for programmatic invocation
 */

const { markOverdueSlots } = require('../scheduler/delayJob');

class PerCareDelayService {
  async runDelayJob() {
    return markOverdueSlots();
  }
}

module.exports = new PerCareDelayService();
