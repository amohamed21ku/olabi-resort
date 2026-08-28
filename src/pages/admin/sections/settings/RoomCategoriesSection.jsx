import { FiEdit2, FiImage, FiStar, FiPlus } from 'react-icons/fi'
import { CATEGORIES } from '../../services'
import { CATEGORY_LABEL_AR } from '../../constants'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'

// List of customer-facing room categories ("variants" in Firestore). Renamed
// to "فئات الغرف" (Room Categories) in the UI only — collection name and
// field names are untouched. Physical room numbers live in RoomsSection;
// the "إعادة التهيئة" reseed action lives there too (it seeds both
// collections at once), so this screen only offers add/edit.
export default function RoomCategoriesSection({ variants, rooms, onAdd, onEdit }) {
  const sorted = variants.slice().sort((a, b) => {
    const idxA = CATEGORIES.indexOf(a.type), idxB = CATEGORIES.indexOf(b.type)
    if (idxA !== idxB) return idxA - idxB
    return (a.capacity || 0) - (b.capacity || 0)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--adm-tone-warn-bg)', border: '1px solid var(--adm-tone-warn-border)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--adm-tone-warn-text)', lineHeight: 1.6 }}>
        كل فئة (سوبر/بريميوم/ديلوكس × عدد الأشخاص) هي بطاقة منفصلة يراها العميل. الاسم والوصف والصور تُدار هنا — أرقام الغرف الفعلية تُدار في «الغرف».
      </div>

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
                  <Button variant="secondary" style={{ width: '100%' }} icon={<FiEdit2 size={13} />} onClick={() => onEdit(v)}>
                    تعديل الفئة
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
