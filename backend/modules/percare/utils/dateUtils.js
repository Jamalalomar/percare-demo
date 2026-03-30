/**
 * Date utility functions for PerCare module
 */

/**
 * Format a date to YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Add N days to a date
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Check if a date is in the past
 */
function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

/**
 * Check if a date is today
 */
function isToday(date) {
  const d     = new Date(date);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth()    === today.getMonth()    &&
         d.getDate()     === today.getDate();
}

/**
 * Get day name in Arabic
 */
function getDayNameAr(date) {
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  return days[new Date(date).getDay()];
}

/**
 * Get day name in English
 */
function getDayNameEn(date) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(date).getDay()];
}

module.exports = { formatDate, addDays, isPast, isToday, getDayNameAr, getDayNameEn };
