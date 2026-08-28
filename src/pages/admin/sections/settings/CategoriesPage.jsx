import { useState } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import Button from '../../components/Button'
import { useGuardedNavigate } from '../../hooks/useGuardedNavigate'
import RoomCategoriesSection from './RoomCategoriesSection'
import CategoryForm from './CategoryForm'

// Own route (/admin/settings/categories) — owns the list↔form toggle that
// used to live in SettingsSection's switch, now scoped to this page.
export default function CategoriesPage({ variants, rooms }) {
  const { go } = useGuardedNavigate()
  const [editingVariant, setEditingVariant] = useState(undefined) // undefined = list, 'new' | variant = form

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={() => go('/admin/settings')}>
          رجوع إلى الإعدادات
        </Button>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>فئات الغرف</h2>
      </div>

      {editingVariant === undefined ? (
        <RoomCategoriesSection
          variants={variants}
          rooms={rooms}
          onAdd={() => setEditingVariant('new')}
          onEdit={v => setEditingVariant(v)}
        />
      ) : (
        <CategoryForm
          variant={editingVariant === 'new' ? null : editingVariant}
          onBack={() => setEditingVariant(undefined)}
        />
      )}
    </div>
  )
}
