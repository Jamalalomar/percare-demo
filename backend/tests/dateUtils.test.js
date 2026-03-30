// ============================================================
// tests/dateUtils.test.js
// Unit tests for date utility functions
// ============================================================
'use strict';

const isJest = typeof describe !== 'undefined';
let describe_, it_, expect_;

if (isJest) {
  describe_ = describe; it_ = it; expect_ = expect;
} else {
  const { describe: d, it: i } = require('node:test');
  const assert = require('node:assert/strict');
  describe_ = d; it_ = i;
  expect_ = (val) => ({
    toBe:         (exp)  => assert.strictEqual(val, exp),
    toHaveLength: (n)    => assert.strictEqual(val.length, n),
    toBeTruthy:   ()     => assert.ok(val),
  });
}

const {
  addDays,
  calcEndDate,
  generateWeekDates,
  isBeforeToday,
  endOfDayUTC,
} = require('../modules/percare/utils/dateUtils');

describe_('addDays', () => {
  it_('adds 0 days returns same date', () => {
    expect_(addDays('2025-07-14', 0)).toBe('2025-07-14');
  });
  it_('adds 6 days correctly', () => {
    expect_(addDays('2025-07-14', 6)).toBe('2025-07-20');
  });
  it_('handles month boundary', () => {
    expect_(addDays('2025-07-30', 2)).toBe('2025-08-01');
  });
  it_('handles year boundary', () => {
    expect_(addDays('2025-12-30', 3)).toBe('2026-01-02');
  });
});

describe_('calcEndDate', () => {
  it_('end date is always start + 6 days', () => {
    expect_(calcEndDate('2025-07-14')).toBe('2025-07-20');
    expect_(calcEndDate('2025-01-01')).toBe('2025-01-07');
    expect_(calcEndDate('2025-12-28')).toBe('2026-01-03');
  });
});

describe_('generateWeekDates', () => {
  it_('returns exactly 7 dates', () => {
    expect_(generateWeekDates('2025-07-14')).toHaveLength(7);
  });
  it_('first date equals start date', () => {
    const dates = generateWeekDates('2025-07-14');
    expect_(dates[0]).toBe('2025-07-14');
  });
  it_('last date equals start + 6', () => {
    const dates = generateWeekDates('2025-07-14');
    expect_(dates[6]).toBe('2025-07-20');
  });
  it_('dates are consecutive', () => {
    const dates = generateWeekDates('2025-07-14');
    for (let i = 1; i < 7; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00Z');
      const curr = new Date(dates[i]     + 'T00:00:00Z');
      const diff = (curr - prev) / 86400000;
      expect_(diff).toBe(1);
    }
  });
});

describe_('isBeforeToday', () => {
  it_('past date returns true', () => {
    expect_(isBeforeToday('2020-01-01')).toBe(true);
  });
  it_('future date returns false', () => {
    expect_(isBeforeToday('2099-12-31')).toBe(false);
  });
});

describe_('endOfDayUTC', () => {
  it_('returns a Date object', () => {
    expect_(endOfDayUTC('2025-07-14') instanceof Date).toBe(true);
  });
  it_('hours are 23', () => {
    const d = endOfDayUTC('2025-07-14');
    expect_(d.getUTCHours()).toBe(23);
  });
  it_('minutes are 59', () => {
    const d = endOfDayUTC('2025-07-14');
    expect_(d.getUTCMinutes()).toBe(59);
  });
});
