import React from 'react'
import { useNavigate } from 'react-router-dom'

const STATS = [
  { label: 'طلبات نشطة',    value: '4',   icon: '📋', color: 'from-blue-500 to-blue-600',    sub: '+2 هذا الأسبوع' },
  { label: 'جلسات اليوم',   value: '12',  icon: '📅', color: 'from-emerald-500 to-emerald-600', sub: '8 مكتملة' },
  { label: 'جلسات متأخرة',  value: '3',   icon: '⏰', color: 'from-red-500 to-red-600',        sub: 'تحتاج مراجعة' },
  { label: 'نسبة الإنجاز',  value: '72%', icon: '📊', color: 'from-purple-500 to-purple-600',  sub: 'هذا الأسبوع' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">مرحباً، م. سعود 👋</h1>
        <p className="text-gray-500 mt-1">لوحة تحكم بوابة الرعاية المنزلية</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {STATS.map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-black">{s.value}</div>
            <div className="font-semibold mt-1">{s.label}</div>
            <div className="text-white/70 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/percare/requests')}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">🏥</div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">وحدة PerCare</h3>
            <p className="text-gray-500 text-sm">إدارة طلبات الرعاية المنزلية المجدولة — انقر للدخول</p>
          </div>
          <div className="mr-auto text-gray-400 text-2xl">←</div>
        </div>
      </div>
    </div>
  )
}
