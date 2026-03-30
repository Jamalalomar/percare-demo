import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiListRequests, apiMarkOverdue } from '../../data/mockData'
import { useDebounce } from '../../hooks/useDebounce'
import StatusBadge from '../../components/percare/StatusBadge'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../contexts/ToastContext'

const STATUS_TABS = [
  { v:'',          l:'الكل',      color:'text-gray-700' },
  { v:'ACTIVE',    l:'نشطة',      color:'text-blue-600' },
  { v:'COMPLETED', l:'مكتملة',    color:'text-emerald-600' },
  { v:'CANCELLED', l:'ملغاة',     color:'text-red-600' },
]

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-SA',{day:'numeric',month:'short'})
}

function RequestRow({ req, onClick }) {
  const pct  = parseFloat(req.completion_pct || 0)
  const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <tr
      onClick={() => onClick(req.id)}
      className="hover:bg-blue-50/40 cursor-pointer transition-colors border-b border-gray-50 group"
    >
      <td className="px-6 py-4">
        <div className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{req.patient_name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{req.external_patient_id}</div>
      </td>
      <td className="px-4 py-4 text-sm font-mono text-gray-600">{req.external_request_id}</td>
      <td className="px-4 py-4 text-sm text-gray-600">
        <span className="font-medium">{fmt(req.start_date)}</span>
        <span className="text-gray-300 mx-1">–</span>
        <span>{fmt(req.end_date)}</span>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{req.service_count || req.items?.length || 0}</span>
      </td>
      <td className="px-4 py-4 text-center font-bold text-gray-700">{req.total_slots || 0}</td>
      <td className="px-4 py-4 text-center font-bold text-emerald-600">{req.completed_slots || 0}</td>
      <td className="px-4 py-4 text-center">
        {req.delayed_slots > 0 ? (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{req.delayed_slots} !</span>
        ) : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full`} style={{ width:`${Math.min(pct,100)}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-600 min-w-[36px]">{pct.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-4 py-4"><StatusBadge status={req.status} /></td>
      <td className="px-4 py-4 text-gray-300 group-hover:text-blue-400 transition-colors text-lg">←</td>
    </tr>
  )
}

export default function PerCareRequestsListPage() {
  const navigate = useNavigate()
  const toast    = useToast()

  const [data,    setData]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(1)
  const [status,  setStatus]  = useState('')
  const [search,  setSearch]  = useState('')
  const [jobLoading, setJobLoading] = useState(false)
  const dSearch = useDebounce(search, 400)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiListRequests({ status, search: dSearch, page, limit: 20 })
      setData(res.data); setTotal(res.total); setPages(res.pages)
    } catch(e) { toast.error('فشل تحميل الطلبات: ' + e.message) }
    finally { setLoading(false) }
  }, [status, dSearch, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [status, dSearch])

  const runJob = async () => {
    setJobLoading(true)
    try {
      const r = await apiMarkOverdue()
      toast.success(r.data.message || 'تم تشغيل مهمة التأخير')
      load()
    } catch(e) { toast.error('فشل: ' + e.message) }
    finally { setJobLoading(false) }
  }

  return (
    <div className="p-6">
      {/* Page title */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            🏥 <span>طلبات PerCare</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} طلب · إجمالي طلبات الرعاية المنزلية المجدولة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runJob}
            disabled={jobLoading}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            {jobLoading ? '⏳' : '⏰'} <span>{jobLoading ? 'جاري...' : 'تشغيل مهمة التأخير'}</span>
          </button>
          <button onClick={load} className="btn-secondary text-sm">🔄 تحديث</button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card mb-6 flex items-center gap-4 flex-wrap py-4">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <span className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الطلب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        {/* Status tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {STATUS_TABS.map(t => (
            <button
              key={t.v}
              onClick={() => setStatus(t.v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                status === t.v
                  ? `bg-white shadow-sm ${t.color}`
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          {data.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 font-medium">لا توجد طلبات مطابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth:'900px' }}>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['المريض','رقم الطلب','الفترة','الخدمات','الجلسات','مكتمل','متأخر','التقدم','الحالة',''].map(h => (
                      <th key={h} className="px-4 py-3.5 text-right font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap first:pr-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map(req => (
                    <RequestRow key={req.id} req={req} onClick={id => navigate(`/percare/requests/${id}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => p-1)} disabled={page <= 1} className="btn-secondary text-sm disabled:opacity-40">← السابق</button>
          <span className="text-sm text-gray-600 font-medium">صفحة {page} من {pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= pages} className="btn-secondary text-sm disabled:opacity-40">التالي →</button>
        </div>
      )}
    </div>
  )
}
