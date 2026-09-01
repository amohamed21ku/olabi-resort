import { useState } from 'react'
import { FiEdit2, FiImage, FiStar, FiPlus, FiTrash2 } from 'react-icons/fi'
import { CATEGORIES, db, doc, deleteDoc } from '../../services'
import { CATEGORY_LABEL_AR } from '../../constants'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

// List of customer-facing room categories ("variants" in Firestore). Renamed
// to "فئات الغرف" (Room Categories) in the UI only — collection name and
// field names are untouched. Physical room numbers live in RoomsSection;
// the "إعادة التهيئة" reseed action lives there too (it seeds both
// collections at once), so this screen only offers add/edit/delete.
export default function RoomCategoriesSection({ variants, rooms, onAdd, onEdit }) {
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const sorted = variants.slice().sort((a, b) => {
    const idxA = CATEGORIES.indexOf(a.type), idxB = CATEGORIES.indexOf(b.type)
    if (idxA !== idxB) return idxA - idxB
    return (a.capacity || 0) - (b.capacity || 0)
  })

  const unitsOf = v => rooms.filter(r => r.type === v.type && Number(r.capacity) === Number(v.capacity))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setError('')
    try {
      await deleteDoc(doc(db, 'variants', deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) { setError('فشل الحذف: ' + e.message) }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--adm-tone-warn-bg)', border: '1px solid var(--adm-tone-warn-border)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--adm-tone-warn-text)', lineHeight: 1.6 }}>
        كل فئة (سوبر/بريميوم/ديلوكس × عدد الأشخاص) هي بطاقة منفصلة يراها العميل. الاسم والوصف والصور تُدار هنا — أرقام الغرف الفعلية تُدار في «الغرف».
      </div>

      {error && (
        <div style={{ background: 'var(--adm-danger-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '12px 16px' }}>
          <span className="adm-field-error">{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<FiPlus size={15} />} onClick={onAdd}>إضافة فئة جديدة</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<FiStar size={28} />} text="لا توجد فئات بعد. اضغط «إضافة فئة جديدة» للبدء." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {sorted.map(v => {
            const units = rooms.filter(r => r.type === v.type && Number(r.capacity) === Number(v.capacity))
            const activeUnits = units.filter(r => r.active !== false).length
            return (
              <div key={v.id} className="adm-card" style={{ opacity: v.active === false ? 0.65 : 1 }}>
                <div style={{ height: 150, background: 'var(--linen)', position: 'relative' }}>
                  {v.images?.[0]
                    ? <img src={v.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={28} color="var(--sand)" /></div>}
                  <div style={{ position: 'absolute', top: 10, insetInlineStart: 10, display: 'flex', gap: 4 }}>
                    <span className={`adm-badge ${v.active !== false ? 'adm-badge--good' : 'adm-badge--muted'}`}>
                      {v.active !== false ? 'ظاهرة' : 'مخفية'}
                    </span>
                    {v.featured && <span className="adm-badge adm-badge--warn"><FiStar size={9} /> مميزة</span>}
                  </div>
                </div>
                <div className="adm-card-body">
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-tone-warn-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {CATEGORY_LABEL_AR[v.type] || v.type} · {v.capacity} أشخاص
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{v.nameAr || '(بدون اسم)'}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                    {activeUnits} غرفة نشطة من أصل {units.length}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: 12, minHeight: 36, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {v.descAr || '—'}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="secondary" style={{ flex: 1 }} icon={<FiEdit2 size={13} />} onClick={() => onEdit(v)}>
                      تعديل الفئة
                    </Button>
                    <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={13} />} title="حذف الفئة" onClick={() => setDeleteTarget(v)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الفئة"
        message={deleteTarget
          ? `سيتم حذف فئة «${deleteTarget.nameAr || CATEGORY_LABEL_AR[deleteTarget.type] || deleteTarget.type}» نهائياً — هل أنت متأكد؟${unitsOf(deleteTarget).length ? ` لدى هذه الفئة ${unitsOf(deleteTarget).length} غرفة فعلية لن تُحذف، لكنها ستبقى بلا فئة ظاهرة للزوار.` : ''}`
          : ''}
        confirmLabel="حذف الفئة"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
