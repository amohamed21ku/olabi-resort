import { useState } from 'react'
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { FiMenu, FiExternalLink, FiLogOut, FiUser } from 'react-icons/fi'
import { auth, signOut } from './services'
import Logo from './components/Logo'
import { PageLoader } from './components/PageLoader'
import LeaveConfirmDialog from './components/LeaveConfirmDialog'
import NavGuardProvider from './components/NavGuardProvider'
import { useNavGuardState } from './hooks/useNavGuard'
import { useGuardedNavigate, useGuardedAction } from './hooks/useGuardedNavigate'
import { NAV_ITEMS } from './nav.config'
import { useAdminData } from './hooks/useAdminData'
import { useBookingActions } from './hooks/useBookingActions'

import ReservationSection from './sections/Reservation'
import ReservationRoomsPage from './sections/Reservation/RoomsPage'
import UpcomingArrivalsPage from './sections/Reservation/UpcomingArrivalsPage'
import ReservationsReportPage from './sections/Reservation/ReservationsReportPage'
import RoomPanel from './sections/Reservation/RoomPanel'
import CalendarSection from './sections/CalendarSection'
import StatsSection from './sections/StatsSection'
import SettingsSection from './sections/SettingsSection'
import CategoriesPage from './sections/settings/CategoriesPage'
import SettingsRoomsPage from './sections/settings/RoomsPage'
import HikePage from './sections/settings/HikePage'

export default function AdminShell({ user }) {
  return (
    <NavGuardProvider>
      <AdminShellInner user={user} />
    </NavGuardProvider>
  )
}

function AdminShellInner({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { guarded } = useNavGuardState()
  const { go } = useGuardedNavigate()
  const { run } = useGuardedAction()

  const data = useAdminData()
  const bookingActions = useBookingActions()
  const { rooms, variants, bookings, hikeContent, hikeApps, loadingR, loadingV, loadingB } = data

  const allItems = NAV_ITEMS.flatMap(n => [n, ...(n.children || [])])
  const title = allItems.find(n => n.path === location.pathname)?.label
    || NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label
    || 'الحجوزات'

  // Sidebar links stay real <NavLink>s (for active-state styling and normal
  // middle-click/open-in-tab behavior) but hijack the click when something
  // unsaved is open, routing through the shared guarded-navigate instead.
  const guardedClick = (path) => (e) => {
    if (guarded) { e.preventDefault(); go(path) }
    setMobileOpen(false)
  }

  return (
    <div dir="rtl" className="adm-root">
      <div className="adm-shell">
        {mobileOpen && <div className="adm-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

        <aside className={`adm-sidebar ${mobileOpen ? 'is-open' : ''}`}>
          <div className="adm-sidebar-brand">
            <Logo size={38} />
            <div>
              <p className="adm-sidebar-brand-name">منتجع العلبي</p>
              <p className="adm-sidebar-brand-sub">لوحة التحكم</p>
            </div>
          </div>

          <nav className="adm-nav">
            {NAV_ITEMS.map(({ id, label, Icon, path, children }) => (
              <div key={id}>
                <NavLink
                  to={path}
                  onClick={guardedClick(path)}
                  className={({ isActive }) => `adm-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={17} style={{ flexShrink: 0 }} />
                  <span className="adm-nav-item__label">{label}</span>
                </NavLink>
                {children && (
                  <div className="adm-nav-sub">
                    {children.map(child => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        onClick={guardedClick(child.path)}
                        className={({ isActive }) => `adm-nav-item adm-nav-item--sub ${isActive ? 'is-active' : ''}`}
                      >
                        <child.Icon size={15} style={{ flexShrink: 0 }} />
                        <span className="adm-nav-item__label">{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="adm-sidebar-footer">
            <a href="/" target="_blank" rel="noreferrer" className="adm-sidebar-footer-link">
              <FiExternalLink size={14} /><span>عرض الموقع</span>
            </a>
            <button
              className="adm-sidebar-footer-link"
              onClick={() => run(() => signOut(auth))}
            >
              <FiLogOut size={14} /><span>تسجيل الخروج</span>
            </button>
            <div className="adm-sidebar-footer-user">
              <FiUser size={13} color="var(--muted)" />
              <span className="adm-sidebar-footer-email">{user.email}</span>
            </div>
          </div>
        </aside>

        <div className="adm-main">
          <header className="adm-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="adm-topbar-mobile-btn" onClick={() => setMobileOpen(s => !s)}><FiMenu size={20} /></button>
              <h1 className="adm-topbar-title">{title}</h1>
            </div>
          </header>

          <main className="adm-content">
            {loadingB || loadingR || loadingV ? (
              <PageLoader />
            ) : (
              <Routes>
                <Route index element={<Navigate to="reservation" replace />} />
                <Route path="reservation" element={<ReservationSection rooms={rooms} bookings={bookings} bookingActions={bookingActions} />} />
                <Route path="reservation/rooms" element={<ReservationRoomsPage rooms={rooms} bookings={bookings} variants={variants} />} />
                <Route path="reservation/upcoming" element={<UpcomingArrivalsPage bookings={bookings} bookingActions={bookingActions} />} />
                <Route path="reservation/report" element={<ReservationsReportPage bookings={bookings} bookingActions={bookingActions} />} />
                <Route path="reservation/:roomId" element={<RoomPanel rooms={rooms} bookings={bookings} bookingActions={bookingActions} variants={variants} />} />
                <Route path="calendar" element={<CalendarSection bookings={bookings} rooms={rooms} />} />
                <Route path="stats" element={<StatsSection rooms={rooms} bookings={bookings} />} />
                <Route path="settings" element={<SettingsSection hikeApps={hikeApps} />} />
                <Route path="settings/categories" element={<CategoriesPage variants={variants} rooms={rooms} />} />
                <Route path="settings/rooms" element={<SettingsRoomsPage rooms={rooms} variants={variants} bookings={bookings} />} />
                <Route path="settings/hike" element={<HikePage hikeContent={hikeContent} hikeApps={hikeApps} />} />
                <Route path="*" element={<Navigate to="reservation" replace />} />
              </Routes>
            )}
          </main>
        </div>
      </div>

      <LeaveConfirmDialog />
    </div>
  )
}
