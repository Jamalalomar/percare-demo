// ============================================================
// tests/statusUtils.test.js
// Unit tests for status transition and rollup logic
// ============================================================
'use strict';

const isJest = typeof describe !== 'undefined';
let describe_, it_, expect_;

if (isJest) {
  describe_ = describe; it_ = it; expect_ = expect;
} else {
  const { describe: d, it: i } = require('node:test');
  const assert                 = require('node:assert/strict');
  describe_ = d; it_ = i;
  expect_ = (val) => ({
    toBe:    (exp) => assert.strictEqual(val, exp),
    toEqual: (exp) => assert.deepStrictEqual(val, exp),
  });
}

const {
  isValidSlotTransition,
  deriveRequestStatus,
  deriveItemStatus,
} = require('../modules/percare/utils/statusUtils');

// ── Slot transitions ─────────────────────────────────────────
describe_('isValidSlotTransition', () => {
  it_('PENDING → COMPLETED is valid', () => {
    expect_(isValidSlotTransition('PENDING', 'COMPLETED')).toBe(true);
  });
  it_('PENDING → CANCELLED is valid', () => {
    expect_(isValidSlotTransition('PENDING', 'CANCELLED')).toBe(true);
  });
  it_('DELAYED → COMPLETED is valid', () => {
    expect_(isValidSlotTransition('DELAYED', 'COMPLETED')).toBe(true);
  });
  it_('DELAYED → CANCELLED is valid', () => {
    expect_(isValidSlotTransition('DELAYED', 'CANCELLED')).toBe(true);
  });
  it_('COMPLETED → COMPLETED is invalid', () => {
    expect_(isValidSlotTransition('COMPLETED', 'COMPLETED')).toBe(false);
  });
  it_('COMPLETED → CANCELLED is invalid', () => {
    expect_(isValidSlotTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });
  it_('CANCELLED → COMPLETED is invalid', () => {
    expect_(isValidSlotTransition('CANCELLED', 'COMPLETED')).toBe(false);
  });
  it_('PENDING → DELAYED is invalid (delay is system-only)', () => {
    expect_(isValidSlotTransition('PENDING', 'DELAYED')).toBe(false);
  });
});

// ── Request status rollup ─────────────────────────────────────
describe_('deriveRequestStatus', () => {
  it_('all pending → NOT_STARTED', () => {
    expect_(deriveRequestStatus(10, 0, 0, 0, false)).toBe('NOT_STARTED');
  });
  it_('some completed → IN_PROGRESS', () => {
    expect_(deriveRequestStatus(10, 3, 0, 0, false)).toBe('IN_PROGRESS');
  });
  it_('all active completed → COMPLETED', () => {
    // 10 total, 2 cancelled, 8 active — 8 completed
    expect_(deriveRequestStatus(10, 8, 0, 2, false)).toBe('COMPLETED');
  });
  it_('has delayed → DELAYED', () => {
    expect_(deriveRequestStatus(10, 3, 2, 0, false)).toBe('DELAYED');
  });
  it_('manually cancelled → CANCELLED', () => {
    expect_(deriveRequestStatus(10, 0, 0, 0, true)).toBe('CANCELLED');
  });
});

// ── Item status rollup ────────────────────────────────────────
describe_('deriveItemStatus', () => {
  it_('no progress → NOT_STARTED', () => {
    expect_(deriveItemStatus(6, 0, 0, 0, false)).toBe('NOT_STARTED');
  });
  it_('partial completion → IN_PROGRESS', () => {
    expect_(deriveItemStatus(6, 3, 0, 0, false)).toBe('IN_PROGRESS');
  });
  it_('all completed → COMPLETED', () => {
    expect_(deriveItemStatus(6, 6, 0, 0, false)).toBe('COMPLETED');
  });
  it_('has delayed → DELAYED', () => {
    expect_(deriveItemStatus(6, 2, 1, 0, false)).toBe('DELAYED');
  });
  it_('cancelled → CANCELLED', () => {
    expect_(deriveItemStatus(6, 0, 0, 0, true)).toBe('CANCELLED');
  });
});
