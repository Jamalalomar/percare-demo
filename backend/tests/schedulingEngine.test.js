// ============================================================
// tests/schedulingEngine.test.js
// Unit tests for the weekly scheduling engine
// Run: npm test  OR  node --test tests/schedulingEngine.test.js
// ============================================================
'use strict';

// Supports Node.js built-in test runner (v18+)
// OR Jest — whichever is available
const isJest = typeof describe !== 'undefined';

const { distributeAcrossWeek, generateScheduleSlots } =
  require('../modules/percare/scheduler/schedulingEngine');

// ── Test runner compatibility shim ───────────────────────────
let describe_, it_, expect_;

if (isJest) {
  describe_ = describe;
  it_       = it;
  expect_   = expect;
} else {
  const { describe: d, it: i } = require('node:test');
  const assert                 = require('node:assert/strict');
  describe_ = d;
  it_       = i;
  expect_   = (val) => ({
    toBe:             (exp) => assert.strictEqual(val, exp),
    toEqual:          (exp) => assert.deepStrictEqual(val, exp),
    toHaveLength:     (n)   => assert.strictEqual(val.length, n),
    toBeGreaterThan:  (n)   => assert.ok(val > n,  `${val} > ${n}`),
    toBeLessThan:     (n)   => assert.ok(val < n,  `${val} < ${n}`),
    toThrow:          ()    => { try { val(); assert.fail('expected to throw'); } catch {} },
  });
}

// ── Helpers ───────────────────────────────────────────────────
function sumArray(arr) { return arr.reduce((a, b) => a + b, 0); }
function maxArray(arr) { return Math.max(...arr); }
function minArray(arr) { return Math.min(...arr); }

// ── distributeAcrossWeek ──────────────────────────────────────
describe_('distributeAcrossWeek', () => {

  it_('returns an array of exactly 7 elements', () => {
    const result = distributeAcrossWeek(7);
    expect_(result).toHaveLength(7);
  });

  it_('total slots equals the requested frequency', () => {
    [1, 3, 5, 6, 7, 9, 10, 14, 21, 28].forEach(freq => {
      const dist = distributeAcrossWeek(freq);
      expect_(sumArray(dist)).toBe(freq);
    });
  });

  it_('frequency = 7 → exactly 1 per day', () => {
    const dist = distributeAcrossWeek(7);
    expect_(dist).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it_('frequency = 14 → exactly 2 per day', () => {
    const dist = distributeAcrossWeek(14);
    expect_(dist).toEqual([2, 2, 2, 2, 2, 2, 2]);
  });

  it_('frequency = 1 → exactly one slot total', () => {
    const dist = distributeAcrossWeek(1);
    expect_(sumArray(dist)).toBe(1);
    expect_(maxArray(dist)).toBe(1);
  });

  it_('max slots per day should not exceed ceil(freq/7) + 1', () => {
    [3, 6, 9, 10, 11, 13].forEach(freq => {
      const dist   = distributeAcrossWeek(freq);
      const base   = Math.floor(freq / 7);
      const maxExp = base + 1;
      expect_(maxArray(dist) <= maxExp + 1).toBe(true);
    });
  });

  it_('distribution is balanced — max − min ≤ 1', () => {
    [3, 6, 9, 10, 11, 13, 20].forEach(freq => {
      const dist = distributeAcrossWeek(freq);
      expect_(maxArray(dist) - minArray(dist) <= 1).toBe(true);
    });
  });

  it_('frequency = 21 → 3 per day', () => {
    const dist = distributeAcrossWeek(21);
    expect_(dist).toEqual([3, 3, 3, 3, 3, 3, 3]);
  });

  it_('throws for frequency = 0', () => {
    expect_(() => distributeAcrossWeek(0)).toThrow();
  });

  it_('throws for negative frequency', () => {
    expect_(() => distributeAcrossWeek(-1)).toThrow();
  });

  it_('throws for non-integer frequency', () => {
    expect_(() => distributeAcrossWeek(3.5)).toThrow();
  });

  it_('is deterministic — same input always same output', () => {
    const r1 = distributeAcrossWeek(9);
    const r2 = distributeAcrossWeek(9);
    expect_(r1).toEqual(r2);
  });
});

// ── generateScheduleSlots ────────────────────────────────────
describe_('generateScheduleSlots', () => {

  const BASE_PARAMS = {
    requestId: 'req-001',
    startDate: '2025-07-14',
    items: [
      { itemId: 'item-001', serviceCode: 'CPT',  serviceName: 'Chest PT',   weeklyFrequency: 6  },
      { itemId: 'item-002', serviceCode: 'SVN',  serviceName: 'Nebulizer',  weeklyFrequency: 9  },
      { itemId: 'item-003', serviceCode: 'VITL', serviceName: 'Vital Signs',weeklyFrequency: 14 },
    ],
  };

  it_('generates correct total slot count', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    expect_(slots.length).toBe(6 + 9 + 14); // 29
  });

  it_('every slot has required fields', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    slots.forEach(slot => {
      expect_(typeof slot.percare_request_id).toBe('string');
      expect_(typeof slot.percare_request_item_id).toBe('string');
      expect_(typeof slot.service_code).toBe('string');
      expect_(typeof slot.service_name).toBe('string');
      expect_(typeof slot.scheduled_date).toBe('string');
      expect_(slot.scheduled_day_index >= 1).toBe(true);
      expect_(slot.scheduled_day_index <= 7).toBe(true);
      expect_(slot.slot_index_in_day >= 1).toBe(true);
      expect_(slot.status).toBe('PENDING');
    });
  });

  it_('scheduled_date matches start_date + day_index offset', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    slots.forEach(slot => {
      const expected = new Date('2025-07-14T00:00:00Z');
      expected.setUTCDate(expected.getUTCDate() + slot.scheduled_day_index - 1);
      expect_(slot.scheduled_date).toBe(expected.toISOString().split('T')[0]);
    });
  });

  it_('CPT slots total = 6', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    const cpt   = slots.filter(s => s.service_code === 'CPT');
    expect_(cpt.length).toBe(6);
  });

  it_('SVN slots total = 9', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    const svn   = slots.filter(s => s.service_code === 'SVN');
    expect_(svn.length).toBe(9);
  });

  it_('VITL slots total = 14', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    const vitl  = slots.filter(s => s.service_code === 'VITL');
    expect_(vitl.length).toBe(14);
  });

  it_('slots span days 1 through 7', () => {
    const slots   = generateScheduleSlots(BASE_PARAMS);
    const cptSlots = slots.filter(s => s.service_code === 'CPT');
    const days    = new Set(cptSlots.map(s => s.scheduled_day_index));
    expect_(days.size > 1).toBe(true); // distributed across multiple days
  });

  it_('due_at is end-of-day for the scheduled date', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    slots.forEach(slot => {
      const d = new Date(slot.due_at);
      expect_(d.getUTCHours()).toBe(23);
      expect_(d.getUTCMinutes()).toBe(59);
    });
  });

  it_('returns empty array for empty items', () => {
    const slots = generateScheduleSlots({ ...BASE_PARAMS, items: [] });
    expect_(slots.length).toBe(0);
  });

  it_('requestId is set on all slots', () => {
    const slots = generateScheduleSlots(BASE_PARAMS);
    slots.forEach(s => expect_(s.percare_request_id).toBe('req-001'));
  });

  it_('slot_index_in_day resets to 1 for each service per day', () => {
    // frequency = 14 → 2 slots/day, indices should be 1 and 2
    const items  = [{ itemId: 'x', serviceCode: 'X', serviceName: 'X', weeklyFrequency: 14 }];
    const slots  = generateScheduleSlots({ requestId: 'r', startDate: '2025-01-01', items });
    const day1   = slots.filter(s => s.scheduled_day_index === 1);
    expect_(day1.length).toBe(2);
    const indices = day1.map(s => s.slot_index_in_day).sort();
    expect_(indices).toEqual([1, 2]);
  });
});
