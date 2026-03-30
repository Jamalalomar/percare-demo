import React from 'react'
import StatusBadge from './StatusBadge'

function KpiCard({ label, value, color = 'text-gray-900', bg = 'bg-gray-50' }) {
  return (
    <div className={`${bg} rounded-2xl p-4 text-center`}>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  )
}

export default function RequestHeader({ request, onCancel, onRecalculate }) {
  if (!request) return null
  const fmt = d => d ? new Date(d).toLocaleDateString('ar-SA', { day:'numeric', month:'short', year:'numeric' }) : '—'
  const pct  = parseFloat(request.completion_pct || 0)
  const isCancellable = ['ACTIVE','DRAFT','ON_HOLD'].includes(request.status)

  return (
    <div className="card mb-6">
      {/* Top */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-3 mb-2">
            <h1 className="text-2xl font-black text-gray-900">{request.patient_name || 'مريض'}</h1>
            <StatusBadge status={request.status} />
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-gray-500 mb-2">
            {request.external_request_id && (
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center text-xs">🔖</span>
                {request.external_request_id}
              </span>
            )}
            {request.external_patient_id && (
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-purple-50 flex items-center justify-center text-xs">👤</span>
                {request.external_patient_id}
              </span>
            )}
            {request.provider_id && (
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center text-xs">🏥</span>
                {request.provider_id}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>📅 من <strong className="text-gray-700">{fmt(request.start_date)}</strong></span>
            <span className="text-gray-300">|</span>
            <span>إلى <strong className="text-gray-700">{fmt(request.end_date)}</strong></span>
            <span className="text-gray-300">|</span>
            <span>{request.service_count || request.items?.length || 0} خدمات</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {request.status === 'ACTIVE' && (
            <button onClick={onRecalculate} className="btn-secondary text-sm flex items-center gap-1.5">
              🔄 <span>إعادة الحساب</span>
            </button>
          )}
          {isCancellable && onCancel && (
            <button onClick={onCancel} className="btn-danger text-sm flex items-center gap-1.5">
              ✕ <span>إلغاء الطلب</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <KpiCard label="إجمالي الجلسات"  value={request.total_slots     || 0} bg="bg-slate-50" />
        <KpiCard label="مكتملة"           value={request.completed_slots  || 0} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard label="متأخرة"           value={request.delayed_slots    || 0} color="text-red-600"     bg="bg-red-50" />
        <KpiCard label="معلقة"            value={request.pending_slots    || 0} color="text-amber-600"   bg="bg-amber-50" />
        <KpiCard
          label="نسبة الإنجاز"
          value={`${pct.toFixed(1)}%`}
          color={pct >= 75 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}
          bg={pct >= 75 ? 'bg-emerald-50' : pct >= 40 ? 'bg-amber-50' : 'bg-red-50'}
        />
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 75 ? 'bg-gradient-to-l from-emerald-400 to-emerald-600'
            : pct >= 40 ? 'bg-gradient-to-l from-amber-400 to-amber-500'
            : 'bg-gradient-to-l from-red-400 to-red-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0%</span>
        <span>{pct.toFixed(1)}% مكتمل</span>
        <span>100%</span>
      </div>

      {request.notes && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700 flex items-start gap-2">
          <span>📝</span>
          <span>{request.notes}</span>
        </div>
      )}
    </div>
  )
}
