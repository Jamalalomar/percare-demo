/**
 * Unit tests for PerCare Scheduling Engine
 */

const {
  distributeFrequency,
  generateSlots,
  calculateEndDate,
  getDistributionSummary,
} = require('../modules/percare/scheduler/schedulingEngine');

describe('PerCare Scheduling Engine', () => {

  describe('distributeFrequency', () => {
    test('distributes 7 evenly (1 per day)', () => {
      const dist = distributeFrequency(7);
      expect(dist).toHaveLength(7);
      expect(dist.every(d => d === 1)).toBe(true);
      expect(dist.reduce((a, b) => a + b, 0)).toBe(7);
    });

    test('distributes 9 as [2,2,1,1,1,1,1]', () => {
      const dist = distributeFrequency(9);
      expect(dist[0]).toBe(2);
      expect(dist[1]).toBe(2);
      dist.slice(2).forEach(d => expect(d).toBe(1));
      expect(dist.reduce((a, b) => a + b, 0)).toBe(9);
    });

    test('distributes 3 as [1,1,1,0,0,0,0]', () => {
      const dist = distributeFrequency(3);
      expect(dist.slice(0, 3).every(d => d === 1)).toBe(true);
      expect(dist.slice(3).every(d => d === 0)).toBe(true);
      expect(dist.reduce((a, b) => a + b, 0)).toBe(3);
    });

    test('distributes 14 as [2,2,2,2,2,2,2]', () => {
      const dist = distributeFrequency(14);
      expect(dist.every(d => d === 2)).toBe(true);
      expect(dist.reduce((a, b) => a + b, 0)).toBe(14);
    });

    test('distributes 1 as [1,0,0,0,0,0,0]', () => {
      const dist = distributeFrequency(1);
      expect(dist[0]).toBe(1);
      expect(dist.slice(1).every(d => d === 0)).toBe(true);
    });

    test('total slots always equals weeklyFrequency', () => {
      for (let freq = 1; freq <= 21; freq++) {
        const dist = distributeFrequency(freq);
        const total = dist.reduce((a, b) => a + b, 0);
        expect(total).toBe(freq);
      }
    });
  });

  describe('generateSlots', () => {
    const baseParams = {
      requestId:       'req-uuid-123',
      itemId:          'item-uuid-456',
      serviceCode:     'NURSING',
      serviceName:     'Home Nursing',
      startDate:       '2025-01-06',
      weeklyFrequency: 5,
    };

    test('generates correct number of slots', () => {
      const slots = generateSlots(baseParams);
      expect(slots.length).toBe(5);
    });

    test('all slots have PENDING status', () => {
      const slots = generateSlots(baseParams);
      expect(slots.every(s => s.status === 'PENDING')).toBe(true);
    });

    test('slots span exactly 7 days', () => {
      const slots = generateSlots(baseParams);
      const days = [...new Set(slots.map(s => s.day_number))];
      expect(Math.max(...days)).toBeLessThanOrEqual(7);
    });

    test('slot dates match start_date + day offset', () => {
      const slots = generateSlots(baseParams);
      const slot1 = slots.find(s => s.day_number === 1);
      expect(slot1.scheduled_date).toBe('2025-01-06');
      const slot7 = slots.find(s => s.day_number === 7);
      if (slot7) expect(slot7.scheduled_date).toBe('2025-01-12');
    });

    test('generates 14 slots for weekly_frequency=14', () => {
      const slots = generateSlots({ ...baseParams, weeklyFrequency: 14 });
      expect(slots.length).toBe(14);
    });

    test('slot_index starts at 1', () => {
      const slots = generateSlots({ ...baseParams, weeklyFrequency: 14 });
      const day1Slots = slots.filter(s => s.day_number === 1);
      expect(day1Slots[0].slot_index).toBe(1);
      expect(day1Slots[1].slot_index).toBe(2);
    });
  });

  describe('calculateEndDate', () => {
    test('end_date = start_date + 6 days', () => {
      expect(calculateEndDate('2025-01-06')).toBe('2025-01-12');
    });

    test('handles month boundary', () => {
      expect(calculateEndDate('2025-01-29')).toBe('2025-02-04');
    });
  });

  describe('getDistributionSummary', () => {
    test('returns correct summary for frequency 9', () => {
      const summary = getDistributionSummary(9);
      expect(summary.base).toBe(1);
      expect(summary.remainder).toBe(2);
      expect(summary.total).toBe(9);
      expect(summary.distribution).toHaveLength(7);
    });
  });

});
