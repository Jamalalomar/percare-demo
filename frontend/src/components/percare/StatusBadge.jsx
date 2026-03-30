import React from 'react'

const CFG = {
  ACTIVE:    { label:'نشط',         cls:'bg-blue-100 text-blue-700 border border-blue-200' },
  COMPLETED: { label:'مكتمل',       cls:'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  CANCELLED: { label:'ملغي',         cls:'bg-red-100 text-red-700 border border-red-200' },
  DRAFT:     { label:'مسودة',       cls:'bg-gray-100 text-gray-600 border border-gray-200' },
  ON_HOLD:   { label:'موقوف',       cls:'bg-amber-100 text-amber-700 border border-amber-200' },
  PENDING:   { label:'معلق',         cls:'bg-gray-100 text-gray-500 border border-gray-200' },
  DELAYED:   { label:'متأخر',        cls:'bg-red-100 text-red-700 border border-red-200' },
  SKIPPED:   { label:'تخطي',        cls:'bg-amber-100 text-amber-700 border border-amber-200' },
}

export default function StatusBadge({ status }) {
  const c = CFG[status] || { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.cls}`}>
      {c.label}
    </span>
  )
}
