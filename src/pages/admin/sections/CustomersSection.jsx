import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiUsers, FiRepeat, FiChevronDown, FiChevronUp, FiPhone, FiMail, FiCalendar } from 'react-icons/fi'
import { computeBookingFinance, normalizeCustomerPhone, getBookingRooms, formatBookingNumber, netRoomTotal } from '../services'
import { roomsLabel, fmtDateShort, fmtDateFull } from '../utils/bookingHelpers'
import { StatusBadge } from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import BookingDetailsModal from './Reservation/BookingDetailsModal'

function ms(v) {
  if (!v) return 0
  const d = v?.toDate ? v.toDate() : new Date(v)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}
const stayMs = b => ms(b.checkIn) || ms(b.createdAt)

// Every customer who has ever booked, derived from the bookings themselves
// (there's no separate customers collection). The same person is matched by
// phone number, normalized so "0933…" and "+963 933…" count as one; a
// booking with no phone falls back to matching by name. Name and email shown
// are the ones from their most recent booking, since that's what they last
// gave. Cancelled bookings stay in their history but don't count as a stay.
function buildCustomers(bookings) {
  const groups = new Map()
  for (const b of bookings) {
    const phone = normalizeCustomerPhone(b.guestPhone)
    const name = (b.guestName || '').trim()
    const key = phone ? `p:${phone}` : name ? `n:${name.toLowerCase()}` : null
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(b)
  }
  return [...groups.entries()].map(([key, list]) => {
    const all = list.slice().sort((a, b) => stayMs(b) - stayMs(a))
    const stays = all.filter(b => b.status !== 'cancelled')
    const latest = all[0]
    return {
      key,
      name: latest.guestName || '—',
      phone: all.find(b => b.guestPhone)?.guestPhone || '',
      email: all.find(b => b.guestEmail)?.guestEmail || '',
      bookings: all,
      stays: stays.length,
      recurring: stays.length >= 2,
      total: stays.reduce((s, b) => s + computeBookingFinance(b).grandTotal, 0),
      lastStay: (stays[0] || latest).checkIn,
      firstStay: all[all.length - 1].checkIn,
    }
  }).sort((a, b) => ms(b.lastStay) - ms(a.lastStay))
}

// "العملاء" — a plain, searchable list of everyone who has booked, returning
// customers highlighted. Click a customer to open their contact info and
// full booking history inline; click any booking there to open it.
export default function CustomersSection({ bookings, bookingActions }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [recurringOnly, setRecurringOnly] = useState(false)
  const [openKey, setOpenKey] = useState(null)
  const [detailsBooking, setDetailsBooking] = useState(null)

  const customers = useMemo(() => buildCustomers(bookings), [bookings])
  const recurringCount = customers.filter(c => c.recurring).length

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const qDigits = q.replace(/[^\d]/g, '')
    return customers.filter(c => {
      if (recurringOnly && !c.recurring) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q)
        || (qDigits && (c.phone.replace(/[^\d]/g, '').includes(qDigits) || c.key.includes(qDigits)))
    })
  }, [customers, search, recurringOnly])

  // Same destination the reservations report uses: the booking's own room
  // page (back-button returns here), or the details popup if it has no room.
  const openBooking = (b) => {
    const roomId = getBookingRooms(b).find(l => l.roomId)?.roomId
    if (roomId) navigate(`/admin/reservation/${roomId}?bookingId=${b.id}`, { state: { from: '/admin/customers' } })
    else setDetailsBooking(b)
  }

  return (
    <div>
      <div className="adm-section-header">
        <div>
          <h2>العملاء</h2>
          <p>كل من حجز لدى المنتجع — الجدد والسابقين. العملاء المتكررون مميّزون.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <FiSearch size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input className="adm-input adm-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، الهاتف، أو البريد..." />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant={recurringOnly ? 'outline' : 'primary'} onClick={() => setRecurringOnly(false)}>الكل ({customers.length})</Button>
          <Button size="sm" variant={recurringOnly ? 'primary' : 'outline'} icon={<FiRepeat size={13} />} onClick={() => setRecurringOnly(true)}>
            المتكررون ({recurringCount})
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<FiUsers size={26} />} text={search || recurringOnly ? 'لا يوجد عملاء مطابقون' : 'لا يوجد عملاء بعد'} />
      ) : (
        <div className="adm-card" style={{ overflow: 'hidden' }}>
          {visible.map((c, i) => (
            <CustomerRow
              key={c.key}
              customer={c}
              first={i === 0}
              open={openKey === c.key}
              onToggle={() => setOpenKey(k => (k === c.key ? null : c.key))}
              onOpenBooking={openBooking}
            />
          ))}
        </div>
      )}

      {detailsBooking && (
        <BookingDetailsModal booking={detailsBooking} bookingActions={bookingActions} onClose={() => setDetailsBooking(null)} />
      )}
    </div>
  )
}

function CustomerRow({ customer: c, first, open, onToggle, onOpenBooking }) {
  return (
    <div style={{
      borderTop: first ? 'none' : '1px solid var(--sand)',
      background: c.recurring ? 'var(--adm-tone-good-bg)' : '#fff',
      borderInlineStart: `4px solid ${c.recurring ? 'var(--adm-tone-good-border)' : 'transparent'}`,
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'inherit', fontFamily: 'inherit' }}
      >
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{c.name}</span>
            {c.recurring && <span className="adm-badge adm-badge--good"><FiRepeat size={10} /> عميل متكرر</span>}
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.phone || 'بلا رقم هاتف'}</span>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--charcoal)', flexWrap: 'wrap' }}>
          <span><strong>{c.stays}</strong> {c.stays === 1 ? 'إقامة' : 'إقامات'}</span>
          <span>آخر إقامة: <strong>{c.lastStay ? fmtDateShort(c.lastStay) : '—'}</strong></span>
          <span>الإجمالي: <strong>${c.total}</strong></span>
        </div>
        {open ? <FiChevronUp size={16} color="var(--muted)" /> : <FiChevronDown size={16} color="var(--muted)" />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--charcoal)', marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiPhone size={12} /> {c.phone || '—'}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiMail size={12} /> {c.email || '—'}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiCalendar size={12} /> أول حجز: {c.firstStay ? fmtDateFull(c.firstStay) : '—'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.bookings.map(b => {
              const ref = b.bookingNumber != null ? formatBookingNumber(b.bookingNumber) : b.id.slice(0, 6).toUpperCase()
              const net = netRoomTotal(b)
              const pct = Number(b.discountPercent) || 0
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onOpenBooking(b)}
                  className="adm-report-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--sand)', background: '#fff', cursor: 'pointer', textAlign: 'inherit', fontFamily: 'inherit', fontSize: 12.5 }}
                >
                  <code style={{ fontSize: 11, color: 'var(--muted)' }}>#{ref}</code>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{fmtDateShort(b.checkIn)} ← {fmtDateShort(b.checkOut)}</span>
                  <span style={{ color: 'var(--muted)', flex: 1, minWidth: 100 }}>{roomsLabel(b)}</span>
                  <StatusBadge status={b.status} />
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    {net != null ? `$${net}` : 'بلا سعر'}
                    {net != null && pct > 0 && <span style={{ color: 'var(--adm-tone-good-text)', fontWeight: 600 }}> · خصم {pct}%</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
