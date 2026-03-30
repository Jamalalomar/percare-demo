import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'

// ── SVG Icons (professional — no emojis) ─────────────────────────────────────
const Icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  heartPulse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z"/>
      <path d="M3.22 12H9.5l1.5-3 2 6 1.5-4.5 1.5 1.5h5.27"/>
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  barChart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="18" y="3" width="4" height="18" rx="1"/>
      <rect x="10" y="8" width="4" height="13" rx="1"/>
      <rect x="2" y="13" width="4" height="8" rx="1"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  chevronsLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
    </svg>
  ),
  chevronsRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
    </svg>
  ),
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'الرئيسية', icon: 'home', to: '/dashboard' },
  {
    label: 'PerCare', icon: 'heartPulse', badge: 'جديد',
    children: [{ label: 'الطلبات', icon: 'list', to: '/percare/requests' }],
  },
  { label: 'المرضى',   icon: 'users',    to: '#', disabled: true },
  { label: 'التقارير', icon: 'barChart', to: '#', disabled: true },
  { label: 'الإعدادات',icon: 'settings', to: '#', disabled: true },
]

// ── Sidebar Item ──────────────────────────────────────────────────────────────
function SidebarItem({ item, collapsed, onMobileClose }) {
  const location = useLocation()
  const [open, setOpen] = useState(
    item.children?.some(c => location.pathname.startsWith(c.to.split('?')[0]))
  )
  const isGroupActive = item.children?.some(c => location.pathname.startsWith(c.to))

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isGroupActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <span className="flex-shrink-0">{Icons[item.icon]}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-right">{item.label}</span>
              {item.badge && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
                  {item.badge}
                </span>
              )}
              <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                {Icons.chevronDown}
              </span>
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="mt-1 mr-3 border-r border-slate-700/60 pr-2 space-y-0.5">
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                  ${isActive ? 'bg-blue-500/20 text-blue-400 font-semibold' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`
                }
              >
                <span className="flex-shrink-0">{Icons[child.icon]}</span>
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (item.disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 cursor-not-allowed select-none">
        <span className="flex-shrink-0 opacity-40">{Icons[item.icon]}</span>
        {!collapsed && <span className="opacity-40">{item.label}</span>}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      onClick={onMobileClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
        ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
      }
    >
      <span className="flex-shrink-0">{Icons[item.icon]}</span>
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  const labels = { percare: 'PerCare', requests: 'الطلبات', dashboard: 'الرئيسية' }
  if (parts.length === 0) return null

  return (
    <nav className="flex items-center gap-1 text-sm overflow-hidden">
      <span className="text-slate-400 hidden sm:inline truncate">الرعاية المنزلية</span>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span className="text-slate-300 hidden sm:inline mx-0.5">›</span>
          <span className={`truncate max-w-[100px] ${i === parts.length - 1 ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
            {labels[p] || (p.length > 10 ? p.slice(0, 10) + '…' : p)}
          </span>
        </React.Fragment>
      ))}
    </nav>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:relative inset-y-0 right-0 z-40 lg:z-auto
        flex flex-col bg-slate-900 transition-all duration-300 flex-shrink-0
        ${collapsed ? 'lg:w-[68px]' : 'lg:w-60'}
        ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-800 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg shadow-blue-900/50">
            HC
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-tight">بوابة الرعاية</div>
              <div className="text-blue-400 text-[11px]">Home Care Portal</div>
            </div>
          )}
          {/* Mobile close */}
          <button
            className="mr-auto lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setMobileOpen(false)}
          >
            {Icons.x}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item, i) => (
            <SidebarItem
              key={i}
              item={item}
              collapsed={collapsed && !mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-slate-800 space-y-2">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                سغ
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-xs font-semibold truncate">م. سعود الغامدي</div>
                <div className="text-slate-400 text-[11px]">مشرف رعاية</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-2 text-slate-500 hover:text-white py-2 rounded-xl hover:bg-slate-800 transition-all text-xs"
          >
            {collapsed ? Icons.chevronsRight : Icons.chevronsLeft}
            {!collapsed && <span>طي القائمة</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {Icons.menu}
          </button>

          <Breadcrumb />

          <div className="flex items-center gap-2 mr-auto">
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              {Icons.bell}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              سغ
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
