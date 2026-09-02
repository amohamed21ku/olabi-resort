import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiPlusCircle, FiSliders, FiX, FiEdit2 } from 'react-icons/fi'
import { bookingMatchesRoomSearch, fmtDateShort, isRoomFreeForRange } from '../../utils/bookingHelpers'
import { computeRoomStatus, getRoomFocusBooking } from '../../utils/roomStatus'
import { CATEGORY_OPTIONS, CATEGORY_LABEL_AR } from '../../constants'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Picker from '../../components/Picker'
import { Field } from '../../components/FormCard'
import BackToReservationsButton from './BackToReservationsButton'
import CreateReservationModal from './CreateReservationModal'

function todayStr() { return new Date().toISOString().split('T')[0] }
function tomorrowStr() { return new Date(Date.now() + 86400000).toISOString().split('T')[0] }

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
  const [customSearchOpen, setCustomSearchOpen] = useState(false)
  const [customSearch, setCustomSearch] = useState(null) // { checkIn, checkOut, roomType } | null
  const today = new Date().toISOString().split('T')[0]

  const visibleRooms = useMemo(() => {
    let out = rooms
    if (search) {
      out = out.filter(room => {
        if (String(room.number || '').includes(search)) return true
        const { booking } = getRoomFocusBooking(room, bookings, today)
        return booking ? bookingMatchesRoomSearch(booking, search) : false
      })
    }
    if (customSearch) {
      out = out.filter(room =>
        (!customSearch.roomType || room.type === customSearch.roomType)
        && isRoomFreeForRange(room, bookings, customSearch.checkIn, customSearch.checkOut)
      )
    }
    return out
  }, [rooms, bookings, search, customSearch, today])

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
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" icon={<FiSliders size={14} />} onClick={() => setCustomSearchOpen(true)}>
            بحث مخصص
          </Button>
          <Button variant="primary" icon={<FiPlusCircle size={15} />} onClick={() => setCreateOpen(true)}>
            إنشاء حجز جديد
          </Button>
        </div>
      </div>

      {createOpen && (
        <CreateReservationModal
          rooms={rooms}
          bookings={bookings}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      )}

      {customSearchOpen && (
        <CustomSearchModal
          initial={customSearch}
          onClose={() => setCustomSearchOpen(false)}
          onSearch={(v) => { setCustomSearch(v); setCustomSearchOpen(false) }}
        />
      )}

      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 20 }}>
        <FiSearch size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input className="adm-input adm-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، الهاتف، أو رقم الغرفة..." />
      </div>

      {customSearch && (
        <div className="adm-notice-banner adm-notice-banner--info" style={{ marginBottom: 20, cursor: 'default' }}>
          <button
            type="button"
            onClick={() => setCustomSearchOpen(true)}
            title="تعديل البحث"
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'inherit' }}
          >
            <FiSliders size={14} />
            <span>
              نتائج بحث مخصص: {customSearch.roomType ? CATEGORY_LABEL_AR[customSearch.roomType] || customSearch.roomType : 'كل الأنواع'}
              {' · '}{fmtDateShort(customSearch.checkIn)} ← {fmtDateShort(customSearch.checkOut)}
              {' · '}{visibleRooms.length} غرفة متاحة
            </span>
            <FiEdit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => setCustomSearch(null)}
            title="مسح البحث"
            style={{ background: 'none', border: 'none', padding: 4, color: 'inherit', cursor: 'pointer', display: 'flex' }}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

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
                  const { status, booking, line } = computeRoomStatus(room, bookings, today)
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
                    const upcoming = getRoomFocusBooking(room, bookings, today)
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

// Date range + optional room type, handed back up to filter the directory to
// only rooms genuinely free for that window (isRoomFreeForRange) — leaving
// the type blank means "any type," not "no rooms." `initial`, when given
// (editing an already-active search from its results banner), seeds the
// fields instead of defaulting to today/tomorrow/any-type, so refining a
// search doesn't mean starting it over from scratch.
function CustomSearchModal({ initial, onClose, onSearch }) {
  const [ci, setCi] = useState(initial?.checkIn || todayStr())
  const [co, setCo] = useState(initial?.checkOut || tomorrowStr())
  const [roomType, setRoomType] = useState(initial?.roomType ?? '')

  const typeOptions = [
    { value: '', label: 'أي نوع (غير محدد)' },
    ...CATEGORY_OPTIONS.map(o => ({ value: o.value, label: o.labelAr })),
  ]

  return (
    <Modal open title={initial ? 'تعديل البحث المخصص' : 'بحث مخصص عن غرف متاحة'} onClose={onClose} footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="primary" disabled={!(ci < co)} onClick={() => onSearch({ checkIn: ci, checkOut: co, roomType })}>
          بحث
        </Button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="الوصول"><input type="date" className="adm-input" value={ci} onChange={e => setCi(e.target.value)} style={{ width: 160 }} /></Field>
          <Field label="المغادرة"><input type="date" className="adm-input" value={co} min={ci} onChange={e => setCo(e.target.value)} style={{ width: 160 }} /></Field>
        </div>
        <Field label="نوع الغرفة">
          <Picker options={typeOptions} value={roomType} onChange={setRoomType} />
        </Field>
      </div>
    </Modal>
  )
}
