import React, { useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'
import Spinner from '../ui/Spinner'

const TRANSITIONS = {
  PENDING:   ['COMPLETED','SKIPPED','DELAYED','CANCELLED'],
  DELAYED:   ['COMPLETED','SKIPPED','CANCELLED'],
  COMPLETED: [],
  SKIPPED:   [],
  CANCELLED: [],
}

const BTN_CFG = {
  COMPLETED: { label:'✓ مكتمل',   cls:'bg-emerald-600 hover:bg-emerald-700 text-white ring-emerald-300' },
  SKIPPED:   { label:'– تخطي',    cls:'bg-amber-500 hover:bg-amber-600 text-white ring-amber-300' },
  DELAYED:   { label:'! تأخير',   cls:'bg-red-500 hover:bg-red-600 text-white ring-red-300' },
  CANCELLED: { label:'× إلغاء',   cls:'bg-slate-500 hover:bg-slate-600 text-white ring-slate-300' },
}

const ACT_LABEL = {
  SLOT_UPDATED:'تحديث الجلسة', DELAYED_MARKED:'تأخير تلقائي',
  BULK_UPDATED:'تحديث جماعي',  CREATED:'إنشاء',
}

export default function SlotUpdateModal({ slot, onClose, onSave, fetchLogs }) {
  const [tab,      setTab]      = useState('update')
  const [status,   setStatus]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [logs,     setLogs]     = useState([])
  const [logLoad,  setLogLoad]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!slot) return
    setTab('update'); setStatus(''); setNotes(slot.notes || ''); setLogs([])
  }, [slot?.id])

  useEffect(() => {
    if (tab === 'history' && slot) {
      setLogLoad(true)
      fetchLogs(slot.id).then(setLogs).catch(() => setLogs([])).finally(() => setLogLoad(false))
    }
  }, [tab, slot?.id])

  if (!slot) return null

  const allowed    = TRANSITIONS[slot.status] || []
  const isTerminal = allowed.length === 0

  const handleSave = async () => {
    if (!status) return
    setSaving(true)
    try { await onSave(slot.id, { status, notes, performed_by:'مستخدم' }); onClose() }
    catch(_) {}
    finally { setSaving(false) }
  }

  const fmtDt = dt => dt ? new Date(dt).toLocaleString('ar-SA',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 anim-fade">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden anim-up">

        {/* Header */}
        <div className="bg-gradient-to-l from-blue-700 to-blue-500 px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-lg leading-none">×</button>
          <div className="font-bold text-lg mb-0.5">{slot.service_name}</div>
          <div className="text-blue-100 text-sm">
            {new Date(slot.scheduled_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <StatusBadge status={slot.status} />
            <span className="text-blue-100 text-sm">اليوم {slot.day_number} · جلسة {slot.slot_index}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[['update','✏️ التحديث'],['history','📜 السجل']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab===t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tab === 'update' && (
            <div className="space-y-5">
              {/* Current info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">الخدمة</span>
                  <span className="font-semibold">{slot.service_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">التاريخ</span>
                  <span className="font-semibold">{slot.scheduled_date}</span>
                </div>
                {slot.completed_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">اكتمل في</span>
                    <span className="font-semibold text-emerald-600">{fmtDt(slot.completed_at)}</span>
                  </div>
                )}
                {slot.completed_by && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">بواسطة</span>
                    <span className="font-semibold">{slot.completed_by}</span>
                  </div>
                )}
              </div>

              {slot.notes && (
                <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl flex gap-2">
                  <span>📝</span><span>{slot.notes}</span>
                </div>
              )}

              {!isTerminal ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">تغيير الحالة إلى:</p>
                    <div className="flex flex-wrap gap-2">
                      {allowed.map(s => (
                        <button key={s} onClick={() => setStatus(s)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${BTN_CFG[s].cls}
                          ${status===s ? `ring-2 ring-offset-2 ${BTN_CFG[s].ring || 'ring-gray-400'} scale-105` : 'opacity-80 hover:opacity-100'}`}>
                          {BTN_CFG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="أضف ملاحظة اختيارية..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
                    <button onClick={handleSave} disabled={!status || saving} className="btn-primary flex-1">
                      {saving ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" /><span>جاري الحفظ...</span></span> : 'حفظ التغيير'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-gray-500 text-sm font-medium">هذه الجلسة في حالة نهائية ولا يمكن تعديلها</p>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              {logLoad ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">لا يوجد سجل لهذه الجلسة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={log.id || i} className="flex gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-700">{ACT_LABEL[log.action] || log.action}</div>
                        {log.old_status && <div className="text-gray-500 text-xs mt-0.5">{log.old_status} → <strong>{log.new_status}</strong></div>}
                        {log.note && <div className="text-gray-400 text-xs italic mt-0.5">{log.note}</div>}
                        <div className="text-gray-400 text-xs mt-1">{fmtDt(log.created_at)} {log.performed_by && '· ' + log.performed_by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
