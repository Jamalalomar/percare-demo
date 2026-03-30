import React, { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext(null)
let tid = 0

const STYLES = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  error:   'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  info:    'bg-blue-50 border-blue-400 text-blue-800',
}
const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'info', dur = 4000) => {
    const id = ++tid
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), dur)
  }, [])

  const toast = {
    success: (m, d) => add(m, 'success', d),
    error:   (m, d) => add(m, 'error',   d || 6000),
    warning: (m, d) => add(m, 'warning', d),
    info:    (m, d) => add(m, 'info',    d),
  }

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border-r-4 shadow-xl anim-up ${STYLES[t.type]}`}>
            <span>{ICONS[t.type]}</span>
            <p className="text-sm font-medium flex-1">{t.msg}</p>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast outside ToastProvider')
  return c
}
