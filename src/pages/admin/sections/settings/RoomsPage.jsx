import { useState } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import Button from '../../components/Button'
import { useGuardedNavigate } from '../../hooks/useGuardedNavigate'
import RoomsSection from './RoomsSection'
import RoomForm from './RoomForm'

// Own route (/admin/settings/rooms) — owns the list↔form toggle that used
// to live in SettingsSection's switch, now scoped to this page.
export default function RoomsPage({ rooms, variants, bookings }) {
  const { go } = useGuardedNavigate()
  const [editingRoom, setEditingRoom] = useState(undefined) // undefined = list, 'new' | room = form

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={() => go('/admin/settings')}>
          رجوع إلى الإعدادات
        </Button>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>الغرف</h2>
      </div>

      {editingRoom === undefined ? (
        <RoomsSection
          rooms={rooms}
          variants={variants}
          bookings={bookings}
          onAdd={() => setEditingRoom('new')}
          onEdit={r => setEditingRoom(r)}
        />
      ) : (
        <RoomForm
          room={editingRoom === 'new' ? null : editingRoom}
          variants={variants}
          onBack={() => setEditingRoom(undefined)}
        />
      )}
    </div>
  )
}
