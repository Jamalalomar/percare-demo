/**
 * PerCare Module - Seed Data Script
 * Run: node db/seed.js
 */

require('dotenv').config();
const { query, withTransaction } = require('./pool');
const { v4: uuidv4 } = require('uuid');

const SAMPLE_REQUESTS = [
  {
    external_request_id: 'EXT-REQ-001',
    external_patient_id: 'PAT-12345',
    provider_id: 'PROV-001',
    patient_name: 'أحمد محمد علي',
    start_date: '2025-01-06',
    notes: 'طلب رعاية منزلية بعد الخروج من المستشفى',
    services: [
      { service_code: 'NURSING', service_name: 'تمريض منزلي', weekly_frequency: 5 },
      { service_code: 'PHYSIO',  service_name: 'علاج طبيعي',  weekly_frequency: 3 },
      { service_code: 'DRESSING', service_name: 'تغيير ضمادات', weekly_frequency: 7 },
    ],
  },
  {
    external_request_id: 'EXT-REQ-002',
    external_patient_id: 'PAT-67890',
    provider_id: 'PROV-001',
    patient_name: 'فاطمة عبدالله الزهراني',
    start_date: '2025-01-13',
    notes: 'متابعة ما بعد الجراحة',
    services: [
      { service_code: 'NURSING',   service_name: 'تمريض منزلي', weekly_frequency: 7 },
      { service_code: 'INJECTION', service_name: 'إعطاء حقن',   weekly_frequency: 2 },
    ],
  },
];

async function seed() {
  console.log('[Seed] Starting PerCare seed data...');

  for (const req of SAMPLE_REQUESTS) {
    await withTransaction(async (client) => {
      const startDate = new Date(req.start_date);
      const endDate   = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      // Insert request
      const { rows: [request] } = await client.query(
        `INSERT INTO percare_requests
           (external_request_id, external_patient_id, provider_id, patient_name, start_date, end_date, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,'seed')
         RETURNING id`,
        [req.external_request_id, req.external_patient_id, req.provider_id,
         req.patient_name, req.start_date,
         endDate.toISOString().split('T')[0], req.notes]
      );

      const requestId = request.id;
      let totalSlots = 0;

      for (const svc of req.services) {
        // Insert item
        const { rows: [item] } = await client.query(
          `INSERT INTO percare_request_items
             (request_id, service_code, service_name, weekly_frequency)
           VALUES ($1,$2,$3,$4)
           RETURNING id`,
          [requestId, svc.service_code, svc.service_name, svc.weekly_frequency]
        );

        // Distribute slots across 7 days
        const base      = Math.floor(svc.weekly_frequency / 7);
        const remainder = svc.weekly_frequency % 7;
        let slotCount   = 0;

        for (let day = 1; day <= 7; day++) {
          const slotsOnDay = base + (day <= remainder ? 1 : 0);
          const slotDate   = new Date(startDate);
          slotDate.setDate(slotDate.getDate() + day - 1);
          const dateStr = slotDate.toISOString().split('T')[0];

          for (let idx = 1; idx <= slotsOnDay; idx++) {
            await client.query(
              `INSERT INTO percare_schedule_slots
                 (request_id, item_id, service_code, service_name, scheduled_date, day_number, slot_index, status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING')`,
              [requestId, item.id, svc.service_code, svc.service_name, dateStr, day, idx]
            );
            slotCount++;
          }
        }

        // Update item rollup
        await client.query(
          `UPDATE percare_request_items SET total_slots=$1, pending_slots=$1 WHERE id=$2`,
          [slotCount, item.id]
        );

        totalSlots += slotCount;
      }

      // Update request rollup
      await client.query(
        `UPDATE percare_requests SET total_slots=$1, pending_slots=$1 WHERE id=$2`,
        [totalSlots, requestId]
      );

      // Insert creation log
      await client.query(
        `INSERT INTO percare_status_logs (request_id, action, new_status, performed_by, note)
         VALUES ($1,'CREATED','ACTIVE','seed','Seed data creation')`,
        [requestId]
      );

      console.log(`[Seed] Created request ${req.external_request_id} with ${totalSlots} slots`);
    });
  }

  console.log('[Seed] Done! Seed data inserted successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});
