import {
  FiLayers, FiUsers, FiHome, FiClock, FiCreditCard, FiTrendingDown,
} from 'react-icons/fi'
import { computeBookingFinance } from '../services'
import { bookingRoomsInfo } from '../utils/bookingHelpers'
import { monthlyRevenue, statusBreakdown, revenueByCategory } from '../utils/statsHelpers'
import StatCard from '../components/StatCard'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'

// The aggregate numbers a manager checks periodically (revenue, pending
// confirmations, unassigned bookings, occupancy) — kept in their own section
// instead of on the daily room board, so front-desk work stays uncluttered
// but these are still one click away.
export default function StatsSection({ rooms, bookings }) {
  const active     = rooms.filter(r => r.active !== false).length
  const occupied   = bookings.filter(b => ['confirmed', 'checked-in'].includes(b.status)).length
  const pending    = bookings.filter(b => b.status === 'pending').length
  const unassigned = bookings.filter(b => bookingRoomsInfo(b).anyUnassigned && !['cancelled', 'checked-out'].includes(b.status)).length
  const revenue    = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.totalPrice || 0), 0)
  const outstanding = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + Math.max(0, computeBookingFinance(b).balance), 0)

  const kpis = [
    { label: 'إجمالي الغرف',       value: rooms.length, sub: `${active} نشطة`, icon: FiLayers },
    { label: 'حجوزات نشطة',        value: occupied,     sub: 'ضيف داخل المنتجع', icon: FiUsers },
    { label: 'غير معيّنة',         value: unassigned,   sub: unassigned ? 'تحتاج تعيين غرفة' : 'الكل معيّن', icon: FiHome },
    { label: 'بانتظار التأكيد',    value: pending,      sub: pending ? 'تحتاج مراجعة' : 'لا يوجد معلّق', icon: FiClock },
    { label: 'إجمالي الإيرادات',   value: revenue.toLocaleString(),     sub: 'كل الحجوزات غير الملغاة', icon: FiCreditCard },
    { label: 'مستحقات (المتبقّي)', value: outstanding.toLocaleString(), sub: outstanding ? 'مبالغ غير محصّلة' : 'لا مستحقات', icon: FiTrendingDown },
  ]

  const revenueTrend = monthlyRevenue(bookings)
  const statusData   = statusBreakdown(bookings)
  const categoryData = revenueByCategory(bookings)
  const money = (v) => `$${v.toLocaleString()}`

  return (
    <div>
      <div className="adm-section-header">
        <div>
          <h2>الإحصائيات</h2>
          <p>نظرة عامة على أرقام المنتجع الحالية.</p>
        </div>
      </div>
      <div className="adm-stat-grid">
        {kpis.map(k => <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} sub={k.sub} />)}
      </div>

      <div className="adm-section-header" style={{ marginTop: 36 }}>
        <div>
          <h2>الاتجاهات</h2>
          <p>الإيرادات وتوزيع الحجوزات عبر الوقت والفئات.</p>
        </div>
      </div>
      <div className="adm-chart-card" style={{ marginBottom: 16 }}>
        <p className="adm-chart-title">الإيرادات الشهرية</p>
        <BarChart data={revenueTrend} formatValue={money} />
      </div>
      <div className="adm-chart-grid">
        <div className="adm-chart-card">
          <p className="adm-chart-title">الحجوزات حسب الحالة</p>
          <DonutChart data={statusData} />
        </div>
        <div className="adm-chart-card">
          <p className="adm-chart-title">الإيرادات حسب الفئة</p>
          <BarChart data={categoryData} formatValue={money} barColor="var(--terracotta)" />
        </div>
      </div>
    </div>
  )
}
