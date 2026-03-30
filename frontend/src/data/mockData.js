// ─── Mock Data for PerCare Portal Demo ──────────────────────────────────────

import { v4 as uuid } from './uuid.js';

// Deterministic distribution: floor(freq/7) base + remainder on first days
function distribute(freq) {
  const base = Math.floor(freq / 7);
  const rem  = freq % 7;
  return Array.from({ length: 7 }, (_, i) => base + (i < rem ? 1 : 0));
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function makeSlots(requestId, items, startDate) {
  const slots = [];
  for (const item of items) {
    const dist = distribute(item.weekly_frequency);
    let slotIdx = 0;
    for (let day = 0; day < 7; day++) {
      for (let s = 0; s < dist[day]; s++) {
        slotIdx++;
        const scheduledDate = addDays(startDate, day);
        const isPast = new Date(scheduledDate) < new Date('2025-01-10');
        const isCompleted = isPast && Math.random() > 0.3;
        const isDelayed   = isPast && !isCompleted && Math.random() > 0.4;
        slots.push({
          id:             'slot-' + requestId.slice(-4) + '-' + item.service_code + '-' + slotIdx,
          request_id:     requestId,
          item_id:        item.id,
          service_code:   item.service_code,
          service_name:   item.service_name,
          scheduled_date: scheduledDate,
          day_number:     day + 1,
          slot_index:     s + 1,
          status:         isCompleted ? 'COMPLETED' : isDelayed ? 'DELAYED' : 'PENDING',
          completed_at:   isCompleted ? '2025-01-0' + (day + 7) + 'T10:00:00Z' : null,
          completed_by:   isCompleted ? 'ممرضة رنا' : null,
          notes:          null,
        });
      }
    }
  }
  return slots;
}

function computeRollup(slots) {
  const total     = slots.length;
  const completed = slots.filter(s => s.status === 'COMPLETED').length;
  const delayed   = slots.filter(s => s.status === 'DELAYED').length;
  const pending   = slots.filter(s => s.status === 'PENDING').length;
  const skipped   = slots.filter(s => s.status === 'SKIPPED').length;
  return {
    total_slots:     total,
    completed_slots: completed,
    delayed_slots:   delayed,
    pending_slots:   pending,
    skipped_slots:   skipped,
    completion_pct:  total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
  };
}

// ─── Requests ────────────────────────────────────────────────────────────────

const RAW = [
  {
    id: 'req-0001', external_request_id: 'HC-2025-0001',
    external_patient_id: 'PAT-10045', provider_id: 'PROV-RH',
    patient_name: 'أحمد محمد العمري', start_date: '2025-01-06',
    status: 'ACTIVE', notes: 'متابعة ما بعد عملية استبدال مفصل الركبة',
    items: [
      { id: 'item-001-1', service_code: 'NURSING',  service_name: 'تمريض منزلي',      weekly_frequency: 5 },
      { id: 'item-001-2', service_code: 'PHYSIO',   service_name: 'علاج طبيعي',        weekly_frequency: 3 },
      { id: 'item-001-3', service_code: 'DRESSING', service_name: 'تغيير ضمادات',      weekly_frequency: 7 },
    ],
  },
  {
    id: 'req-0002', external_request_id: 'HC-2025-0002',
    external_patient_id: 'PAT-20078', provider_id: 'PROV-RH',
    patient_name: 'فاطمة عبدالله الزهراني', start_date: '2025-01-13',
    status: 'ACTIVE', notes: 'متابعة بعد خروج من وحدة العناية المركزة',
    items: [
      { id: 'item-002-1', service_code: 'NURSING',   service_name: 'تمريض منزلي', weekly_frequency: 7 },
      { id: 'item-002-2', service_code: 'INJECTION', service_name: 'إعطاء حقن',   weekly_frequency: 2 },
      { id: 'item-002-3', service_code: 'VITALS',    service_name: 'قياس علامات حيوية', weekly_frequency: 7 },
    ],
  },
  {
    id: 'req-0003', external_request_id: 'HC-2025-0003',
    external_patient_id: 'PAT-33210', provider_id: 'PROV-RH',
    patient_name: 'خالد سعد القحطاني', start_date: '2025-01-20',
    status: 'COMPLETED', notes: 'برنامج تأهيل ما بعد الجلطة',
    items: [
      { id: 'item-003-1', service_code: 'PHYSIO',  service_name: 'علاج طبيعي',   weekly_frequency: 5 },
      { id: 'item-003-2', service_code: 'SPEECH',  service_name: 'علاج نطق',      weekly_frequency: 3 },
      { id: 'item-003-3', service_code: 'NURSING', service_name: 'تمريض منزلي',  weekly_frequency: 4 },
    ],
  },
  {
    id: 'req-0004', external_request_id: 'HC-2025-0004',
    external_patient_id: 'PAT-44001', provider_id: 'PROV-RH',
    patient_name: 'نورة محمد الغامدي', start_date: '2025-01-27',
    status: 'ACTIVE', notes: 'رعاية ما بعد الولادة القيصرية',
    items: [
      { id: 'item-004-1', service_code: 'NURSING',  service_name: 'تمريض منزلي', weekly_frequency: 3 },
      { id: 'item-004-2', service_code: 'DRESSING', service_name: 'تغيير ضمادات', weekly_frequency: 5 },
    ],
  },
  {
    id: 'req-0005', external_request_id: 'HC-2025-0005',
    external_patient_id: 'PAT-55123', provider_id: 'PROV-RH',
    patient_name: 'عبدالرحمن علي الشمري', start_date: '2025-02-03',
    status: 'CANCELLED', notes: 'تم الإلغاء بطلب المريض',
    items: [
      { id: 'item-005-1', service_code: 'PHYSIO',  service_name: 'علاج طبيعي', weekly_frequency: 4 },
    ],
  },
];

// Build full dataset
const _allSlots = {};
const _requests = RAW.map(raw => {
  const endDate = addDays(raw.start_date, 6);
  const allSlots = makeSlots(raw.id, raw.items, raw.start_date);
  _allSlots[raw.id] = allSlots;

  // Per-item rollup
  const items = raw.items.map(item => {
    const itemSlots = allSlots.filter(s => s.item_id === item.id);
    return { ...item, request_id: raw.id, ...computeRollup(itemSlots) };
  });

  const rollup = computeRollup(allSlots);
  let status = raw.status;
  if (status !== 'CANCELLED') {
    if (rollup.completed_slots === rollup.total_slots) status = 'COMPLETED';
    else if (rollup.completed_slots > 0 || rollup.delayed_slots > 0) status = 'ACTIVE';
    else status = 'ACTIVE';
  }

  return {
    ...raw,
    end_date: endDate,
    status,
    items,
    service_count: items.length,
    ...rollup,
  };
});

// ─── In-memory "DB" ──────────────────────────────────────────────────────────

let requestsDB = _requests;
let slotsDB    = { ..._allSlots };
let logsDB     = {};

// ─── API Simulation ──────────────────────────────────────────────────────────

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export async function apiListRequests({ status = '', search = '', page = 1, limit = 20 } = {}) {
  await delay(400);
  let data = [...requestsDB];
  if (status) data = data.filter(r => r.status === status);
  if (search) {
    const q = search.toLowerCase();
    data = data.filter(r =>
      r.patient_name?.toLowerCase().includes(q) ||
      r.external_request_id?.toLowerCase().includes(q) ||
      r.external_patient_id?.toLowerCase().includes(q)
    );
  }
  const total = data.length;
  const start = (page - 1) * limit;
  return { data: data.slice(start, start + limit), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function apiGetRequest(id) {
  await delay(300);
  const req = requestsDB.find(r => r.id === id);
  if (!req) throw new Error('الطلب غير موجود');
  return { data: req };
}

export async function apiGetSlots(requestId) {
  await delay(250);
  const slots    = slotsDB[requestId] || [];
  const req      = requestsDB.find(r => r.id === requestId);
  const services = req?.items || [];

  // Build grid
  const grid = {};
  for (const svc of services) {
    grid[svc.service_code] = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  }
  for (const slot of slots) {
    if (grid[slot.service_code]) grid[slot.service_code][slot.day_number].push(slot);
  }
  return { data: { slots, grid, services } };
}

export async function apiUpdateSlotStatus(slotId, { status, notes, performed_by }) {
  await delay(400);
  // Find and update slot across all requests
  for (const reqId of Object.keys(slotsDB)) {
    const idx = slotsDB[reqId].findIndex(s => s.id === slotId);
    if (idx !== -1) {
      const oldStatus = slotsDB[reqId][idx].status;
      slotsDB[reqId][idx] = {
        ...slotsDB[reqId][idx],
        status,
        notes: notes || slotsDB[reqId][idx].notes,
        completed_at: status === 'COMPLETED' ? new Date().toISOString() : slotsDB[reqId][idx].completed_at,
        completed_by: status === 'COMPLETED' ? (performed_by || 'مستخدم') : slotsDB[reqId][idx].completed_by,
      };

      // Log
      if (!logsDB[slotId]) logsDB[slotId] = [];
      logsDB[slotId].unshift({
        id: 'log-' + Date.now(),
        action: 'SLOT_UPDATED',
        old_status: oldStatus,
        new_status: status,
        performed_by: performed_by || 'مستخدم',
        note: notes || null,
        created_at: new Date().toISOString(),
      });

      // Recalculate request rollup
      const allSlots = slotsDB[reqId];
      const reqIdx   = requestsDB.findIndex(r => r.id === reqId);
      if (reqIdx !== -1) {
        requestsDB[reqIdx] = {
          ...requestsDB[reqIdx],
          ...computeRollup(allSlots),
          items: requestsDB[reqIdx].items.map(item => {
            const iSlots = allSlots.filter(s => s.item_id === item.id);
            return { ...item, ...computeRollup(iSlots) };
          }),
        };
      }
      return { data: slotsDB[reqId][idx] };
    }
  }
  throw new Error('الجلسة غير موجودة');
}

export async function apiGetSlotLogs(slotId) {
  await delay(200);
  return { data: { logs: logsDB[slotId] || [] } };
}

export async function apiCancelRequest(id, reason) {
  await delay(400);
  const idx = requestsDB.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('الطلب غير موجود');
  requestsDB[idx] = { ...requestsDB[idx], status: 'CANCELLED' };
  return { data: requestsDB[idx] };
}

export async function apiMarkOverdue() {
  await delay(600);
  let count = 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  for (const reqId of Object.keys(slotsDB)) {
    slotsDB[reqId] = slotsDB[reqId].map(s => {
      if (s.status === 'PENDING' && new Date(s.scheduled_date) < today) {
        count++;
        if (!logsDB[s.id]) logsDB[s.id] = [];
        logsDB[s.id].unshift({ id:'log-'+Date.now(), action:'DELAYED_MARKED', old_status:'PENDING', new_status:'DELAYED', performed_by:'system', created_at: new Date().toISOString() });
        return { ...s, status: 'DELAYED' };
      }
      return s;
    });
    // Update rollup
    const reqIdx = requestsDB.findIndex(r => r.id === reqId);
    if (reqIdx !== -1) {
      const allSlots = slotsDB[reqId];
      requestsDB[reqIdx] = {
        ...requestsDB[reqIdx],
        ...computeRollup(allSlots),
        items: requestsDB[reqIdx].items.map(item => {
          const iSlots = allSlots.filter(s => s.item_id === item.id);
          return { ...item, ...computeRollup(iSlots) };
        }),
      };
    }
  }
  return { data: { marked: count, message: `تم تمييز ${count} جلسة كمتأخرة` } };
}
