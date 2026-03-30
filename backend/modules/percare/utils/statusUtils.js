/**
 * Status utility functions for PerCare module
 */

const SLOT_STATUS_COLORS = {
  PENDING:   'gray',
  COMPLETED: 'green',
  DELAYED:   'red',
  SKIPPED:   'yellow',
  CANCELLED: 'slate',
};

const SLOT_STATUS_LABELS_AR = {
  PENDING:   'معلق',
  COMPLETED: 'مكتمل',
  DELAYED:   'متأخر',
  SKIPPED:   'تم التخطي',
  CANCELLED: 'ملغي',
};

const REQUEST_STATUS_LABELS_AR = {
  DRAFT:     'مسودة',
  ACTIVE:    'نشط',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  ON_HOLD:   'معلق',
};

const VALID_SLOT_TRANSITIONS = {
  PENDING:   ['COMPLETED', 'SKIPPED', 'DELAYED', 'CANCELLED'],
  DELAYED:   ['COMPLETED', 'SKIPPED', 'CANCELLED'],
  COMPLETED: [],
  SKIPPED:   [],
  CANCELLED: [],
};

function getSlotColor(status) {
  return SLOT_STATUS_COLORS[status] || 'gray';
}

function getSlotLabel(status, lang = 'ar') {
  return lang === 'ar' ? SLOT_STATUS_LABELS_AR[status] : status;
}

function getRequestLabel(status, lang = 'ar') {
  return lang === 'ar' ? REQUEST_STATUS_LABELS_AR[status] : status;
}

function isTerminalSlotStatus(status) {
  return VALID_SLOT_TRANSITIONS[status]?.length === 0;
}

function canTransition(from, to) {
  return (VALID_SLOT_TRANSITIONS[from] || []).includes(to);
}

module.exports = {
  SLOT_STATUS_COLORS,
  SLOT_STATUS_LABELS_AR,
  REQUEST_STATUS_LABELS_AR,
  VALID_SLOT_TRANSITIONS,
  getSlotColor,
  getSlotLabel,
  getRequestLabel,
  isTerminalSlotStatus,
  canTransition,
};
