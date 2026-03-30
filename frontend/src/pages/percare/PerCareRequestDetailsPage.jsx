import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGetRequest, apiGetSlots, apiUpdateSlotStatus, apiGetSlotLogs, apiCancelRequest } from '../../data/mockData'
import RequestHeader from '../../components/percare/RequestHeader'
import PlanSummaryTable from '../../components/percare/PlanSummaryTable'
import WeeklyScheduleGrid from '../../components/percare/WeeklyScheduleGrid'
import SlotUpdateModal from '../../components/percare/SlotUpdateModal'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../contexts/ToastContext'

export default function PerCareRequestDetailsPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const [request,      setRequest]      = useState(null)
  const [services,     setServices]     = useState([])
  const [grid,         setGrid]         = useState({})
  const [loading,      setLoading]      = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showCancelDlg, setShowCancelDlg] = useState(false)
  const [cancelReason,  setCancelReason]  = useState('')
  const [cancelling,    setCancelling]    = useState(false)

  // ── Fetch request ──────────────────────────────────────────────────────────
  const loadRequest = useCallback(async () => {
    try {
      const r = await apiGetRequest(id)
      setRequest(r.data)
    } catch(e) { toast.error(e.message) }
  }, [id])

  // ── Fetch slots ────────────────────────────────────────────────────────────
  const loadSlots = useCallback(async () => {
    setSlotsLoading(true)
    try {
      const r = await apiGetSlots(id)
      setServices(r.data.services)
      setGrid(r.data.grid)
    } catch(e) { toast.error('فشل تحميل الجدول') }
    finally { setSlotsLoading(false) }
  }, [id])

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([loadRequest(), loadSlots()]).finally(() => setLoading(false))
  }, [id])

  // ── Slot update ────────────────────────────────────────────────────────────
  const handleSlotSave = async (slotId, data) => {
    await apiUpdateSlotStatus(slotId, data)
    toast.success('✅ تم تحديث حالة الجلسة')
    await Promise.all([loadRequest(), loadSlots()])
  }

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const fetchLogs = async (slotId) => {
    const r = await apiGetSlotLogs(slotId)
    return r.data?.logs || []
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true)
    try {
      await apiCancelRequest(id, cancelReason)
      toast.success('تم إلغاء الطلب')
      setShowCancelDlg(false)
      await loadRequest()
    } catch(e) { toast.error(e.message) }
    finally { setCancelling(false) }
  }

  // ── Recalculate (mock) ─────────────────────────────────────────────────────
  const handleRecalculate = () => {
    toast.info('سيتم إعادة حساب الجدول الزمني عبر API في بيئة الإنتاج')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <PageSpinner />

  if (!request) return (
    <div className="flex items-center justify-center py-24 flex-col gap-4">
      <div className="text-5xl">🔍</div>
      <p className="text-gray-500">الطلب غير موجود</p>
      <button onClick={() => navigate(-1)} className="btn-secondary">← رجوع</button>
    </div>
  )

  return (
    <div className="p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/percare/requests')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-5 transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span>العودة إلى قائمة الطلبات</span>
      </button>

      {/* Header card */}
      <RequestHeader
        request={request}
        onCancel={() => setShowCancelDlg(true)}
        onRecalculate={handleRecalculate}
      />

      {/* Plan summary */}
      <PlanSummaryTable services={request.items || services} />

      {/* Weekly schedule grid */}
      <WeeklyScheduleGrid
        services={request.items || services}
        grid={grid}
        loading={slotsLoading}
        startDate={request.start_date}
        onSlotClick={setSelectedSlot}
      />

      {/* Slot update modal */}
      {selectedSlot && (
        <SlotUpdateModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSave={async (slotId, data) => {
            await handleSlotSave(slotId, data)
            setSelectedSlot(null)
          }}
          fetchLogs={fetchLogs}
        />
      )}

      {/* Cancel dialog */}
      {showCancelDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelDlg(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10 anim-up">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">إلغاء الطلب</h3>
            <p className="text-gray-500 text-sm mb-5">
              هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إلغاء جميع الجلسات المعلقة.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="سبب الإلغاء (اختياري)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelDlg(false)} className="btn-secondary flex-1">تراجع</button>
              <button onClick={handleCancel} disabled={cancelling} className="btn-danger flex-1">
                {cancelling ? 'جاري...' : '✕ تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
