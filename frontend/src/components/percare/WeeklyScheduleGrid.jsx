import React from 'react'
import { PageSpinner } from '../ui/Spinner'

const STATUS_CLS = {
  PENDING:   'slot-pending',
  COMPLETED: 'slot-completed',
  DELAYED:   'slot-delayed',
  SKIPPED:   'slot-skipped',
  CANCELLED: 'slot-cancelled',
}
const STATUS_ICON = {
  PENDING:   '○',
  COMPLETED: '✓',
  DELAYED:   '!',
  SKIPPED:   '–',
  CANCELLED: '×',
}
const DAY_LABELS  = ['اليوم ١','اليوم ٢','اليوم ٣','اليوم ٤','اليوم ٥','اليوم ٦','اليوم ٧']

function addDays(dateStr, n) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('ar-SA', { month:'short', day:'numeric', weekday:'short' })
}

export default function WeeklyScheduleGrid({ services = [], grid = {}, loading = false, startDate, onSlotClick }) {
  if (loading) return <div className="card flex justify-center py-16"><PageSpinner /></div>

  if (!services.length) return (
    <div className="card text-center py-16 text-gray-300">
      <div className="text-5xl mb-3">📅</div>
      <p className="font-medium">لا توجد جلسات مجدولة</p>
    </div>
  )

  return (
    <div className="card mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">📅</span>
          الجدول الأسبوعي للجلسات
        </h2>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          {[
            ['slot-completed','✓','مكتمل'],
            ['slot-delayed','!','متأخر'],
            ['slot-pending','○','معلق'],
            ['slot-skipped','–','تخطي'],
          ].map(([cls, icon, label]) => (
            <div key={cls} className="flex items-center gap-1.5">
              <span className={`slot-cell ${cls} w-6 h-6 text-xs`}>{icon}</span>
              <span className="text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th className="text-right pb-4 pl-6 font-semibold text-gray-500 text-sm min-w-[170px] sticky right-0 bg-white z-10">
                الخدمة
              </th>
              {Array.from({ length: 7 }, (_, i) => (
                <th key={i} className="pb-4 px-2 text-center">
                  <div className="text-xs font-semibold text-gray-700">{DAY_LABELS[i]}</div>
                  <div className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{addDays(startDate, i)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((svc, svcIdx) => {
              const svcGrid = grid[svc.service_code] || {}
              const rowBg   = svcIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              return (
                <tr key={svc.id || svc.service_code} className={`${rowBg} hover:bg-blue-50/30 transition-colors`}>
                  {/* Service name */}
                  <td className={`py-3 pl-6 sticky right-0 z-10 ${rowBg}`}>
                    <div className="font-semibold text-gray-800 text-sm">{svc.service_name}</div>
                    <div className="text-xs text-blue-500 font-medium mt-0.5">
                      {svc.weekly_frequency}× / أسبوع
                    </div>
                    <div className="text-xs text-gray-400">
                      {svc.completed_slots || 0} ✓ · {svc.delayed_slots || 0} !
                    </div>
                  </td>

                  {/* 7 day cells */}
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const daySlots = svcGrid[dayIdx + 1] || []
                    return (
                      <td key={dayIdx} className="py-3 px-2">
                        <div className="flex flex-wrap gap-1 justify-center min-h-[40px] items-center">
                          {daySlots.length === 0 ? (
                            <span className="text-gray-200 text-lg">—</span>
                          ) : (
                            daySlots.map(slot => (
                              <button
                                key={slot.id}
                                onClick={() => onSlotClick && onSlotClick(slot)}
                                title={`${slot.service_name} · يوم ${slot.day_number} · ${slot.status} · ${slot.scheduled_date}`}
                                className={`slot-cell ${STATUS_CLS[slot.status] || 'slot-pending'}`}
                              >
                                {STATUS_ICON[slot.status] || '○'}
                              </button>
                            ))
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        💡 انقر على أي خلية لعرض التفاصيل وتحديث الحالة
      </p>
    </div>
  )
}
