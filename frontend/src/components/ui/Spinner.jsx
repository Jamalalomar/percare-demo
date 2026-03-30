import React from 'react'

export default function Spinner({ size = 'md' }) {
  const s = { sm:'w-4 h-4 border-2', md:'w-8 h-8 border-2', lg:'w-12 h-12 border-4' }[size] || 'w-8 h-8 border-2'
  return <div className={`${s} rounded-full border-blue-100 border-t-blue-600 animate-spin`} />
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm mt-4">جاري التحميل...</p>
      </div>
    </div>
  )
}
