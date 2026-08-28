import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { bookingMatchesRoomSearch } from '../../utils/bookingHelpers'
import { computeRoomStatus, getRoomFocusBooking } from '../../utils/roomStatus'
import EmptyState from '../../components/EmptyState'

const STATUS_LABEL = {
  vacant: 'شاغرة',
  occupied: 'مشغولة',
  'arriving-today': 'وصول اليوم',
  blocked: 'محظورة',
}
const STATUS_TONE = {
  vacant: 'muted',
  occupied: 'good',
  'arriving-today': 'warn',
  blocked: 'bad',
}

// The permanent room directory — its own page, reached from "الغرف" nested
// under "الحجوزات" in the main sidebar. Every room, grouped by floor, always
// fully expanded (no collapsing). Same status/tone logic every other
// room-status surface in the admin uses, just laid out across the full page
// now instead of squeezed into a narrow aside.
export default function RoomsPage({ rooms, bookings }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const todayStr = new Date().toISOString().split('T')[0]

  const visibleRooms = useMemo(() => {
    if (!search) return rooms
    return rooms.filter(room => {
      if (String(room.number || '').includes(search)) return true
      const { booking } = getRoomFocusBooking(room, bookings, todayStr)
      return booking ? bookingMatchesRoomSearch(booking, search) : false
    })
  }, [rooms, bookings, search, todayStr])

  const floors = useMemo(() => {
    const set = new Set(visibleRooms.map(r => r.floor).filter(f => f != null))
    return Array.from(set).sort((a, b) => (+a) - (+b))
  }, [visibleRooms])

  return (
    <div>
      <div className="adm-section-header">
        <div>
          <h2>الغرف</h2>
          <p>دليل كل غرف المنتجع مصنّفة حسب الطابق.</p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 20 }}>
        <FiSearch size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input className="adm-input adm-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، الهاتف، أو رقم الغرفة..." />
      </div>

      {visibleRooms.length === 0 ? (
        <EmptyState icon={<FiSearch size={26} />} text="لا توجد غرف مطابقة" />
      ) : (
        <div className="adm-rooms-page__grid">
          {floors.map(floor => (
            <div key={floor} className="adm-rooms-page__floor">
              <p className="adm-rooms-page__floor-label">الطابق {floor}</p>
              {visibleRooms
                .filter(r => r.floor === floor)
                .sort((a, b) => (+a.number || 0) - (+b.number || 0))
                .map(room => {
                  const { status, booking } = computeRoomStatus(room, bookings, todayStr)
                  const tone = STATUS_TONE[status]
                  const firstName = booking?.guestName ? booking.guestName.split(' ')[0] : null
                  return (
                    <button
                      key={room.id}
                      type="button"
                      className="adm-rooms-page__row"
                      onClick={() => navigate(`/admin/reservation/${room.id}`)}
                    >
                      <span className="adm-rooms-page__row-number">{room.number}</span>
                      <span className={`adm-badge adm-badge--${tone} adm-rooms-page__row-status`}>{STATUS_LABEL[status]}</span>
                      {firstName && <span className="adm-rooms-page__row-guest">{firstName}</span>}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
