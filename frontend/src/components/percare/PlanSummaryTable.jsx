import React from 'react'

function Bar({ pct }) {
  const w = Math.min(parseFloat(pct) || 0, 100)
  const color = w >= 75 ? 'bg-emerald-500' : w >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width:`${w}%` }} />
      </div>
      <span className={`text-xs font-bold min-w-[36px] text-left ${w >= 75 ? 'text-emerald-600' : w >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
        {w.toFixed(0)}%
      </span>
    </div>
  )
}

export default function PlanSummaryTable({ services = [] }) {
  if (!services.length) return null
  return (
    <div className="card mb-6">
      <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">📊</span>
        ملخص الخطة العلاجية
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-50 text-right">
              {['الخدمة','التكرار الأسبوعي','إجمالي','مكتمل','متأخر','معلق','التقدم'].map(h => (
                <th key={h} className="pb-3 pl-4 font-semibold text-gray-500 text-right whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(svc => (
              <tr key={svc.id || svc.service_code} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 pl-4">
                  <div className="font-semibold text-gray-800">{svc.service_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{svc.service_code}</div>
                </td>
                <td className="py-4 pl-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    {svc.weekly_frequency} × / أسبوع
                  </span>
                </td>
                <td className="py-4 pl-4 font-bold text-gray-700">{svc.total_slots || 0}</td>
                <td className="py-4 pl-4">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span>
                    {svc.completed_slots || 0}
                  </span>
                </td>
                <td className="py-4 pl-4">
                  <span className="flex items-center gap-1 text-red-600 font-bold">
                    <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                    {svc.delayed_slots || 0}
                  </span>
                </td>
                <td className="py-4 pl-4 text-gray-500 font-medium">{svc.pending_slots || 0}</td>
                <td className="py-4 pl-4 min-w-[140px]">
                  <Bar pct={parseFloat(svc.completion_pct || 0)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
