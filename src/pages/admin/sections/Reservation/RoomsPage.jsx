import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiPlusCircle } from 'react-icons/fi'
import { bookingMatchesRoomSearch, fmtDateShort } from '../../utils/bookingHelpers'
import { computeRoomStatus, getRoomFocusBooking } from '../../utils/roomStatus'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import BackToReservationsButton from './BackToReservationsButton'
import CreateReservationModal from './CreateReservationModal'

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
  const [createOpen, setCreateOpen] = useState(false)
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
      <BackToReservationsButton />
      <div className="adm-section-header">
        <div>
          <h2>الغرف</h2>
          <p>دليل كل غرف المنتجع مصنّفة حسب الطابق.</p>
        </div>
        <Button variant="primary" icon={<FiPlusCircle size={15} />} onClick={() => setCreateOpen(true)}>
          إنشاء حجز جديد
        </Button>
      </div>

      {createOpen && (
        <CreateReservationModal
          rooms={rooms}
          bookings={bookings}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      )}

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
                  const { status, booking, line } = computeRoomStatus(room, bookings, todayStr)
                  const tone = STATUS_TONE[status]
                  const firstName = booking?.guestName ? booking.guestName.split(' ')[0] : null

                  // Today's snapshot alone hides the fact that a "vacant"
                  // room can still have an upcoming booking a couple of days
                  // out, or that an "occupied" one frees up on a known date —
                  // both matter for deciding whether a new stay fits before
                  // clicking in, so surface whichever applies as a small note.
                  let dateNote = null
                  if (line && (status === 'occupied' || status === 'arriving-today')) {
                    dateNote = `حتى ${fmtDateShort(line.checkOut)}`
                  } else if (status === 'vacant') {
                    const upcoming = getRoomFocusBooking(room, bookings, todayStr)
                    if (upcoming.kind === 'upcoming') dateNote = `متاحة حتى ${fmtDateShort(upcoming.line.checkIn)}`
                  }

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
                      {dateNote && <span className="adm-rooms-page__row-date">{dateNote}</span>}
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
