import { useState } from 'react'
import { FiCheck, FiChevronRight, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { db, doc, setDoc, Timestamp, CATEGORIES } from '../../services'
import { CATEGORY_LABEL_AR } from '../../constants'
import { FormCard, FormRow, Field, CheckboxChip } from '../../components/FormCard'
import Button from '../../components/Button'
import { useGuardWhile } from '../../hooks/useNavGuard'

// Add/edit form for a single physical room — inventory only (number, floor,
// category, capacity, active). All customer-facing copy (name, images,
// description) lives on the category instead, edited in CategoryForm.
// Ported field-for-field from the old RoomFormPage.
export default function RoomForm({ room, variants = [], onBack }) {
  const isNew = !room

  const [form, setForm] = useState({
    number: room?.number ?? '',
    type: room?.type ?? '',
    capacity: room?.capacity ?? '',
    floor: room?.floor ?? '',
    active: room?.active !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  useGuardWhile(touched)

  const set = (k, v) => { setTouched(true); setForm(p => ({ ...p, [k]: v })) }
  const roomId = room?.id ?? (form.number ? `room-${form.number}` : '')

  // Only allow (type, capacity) pairs that correspond to a real category.
  const variantOptions = variants.slice().sort((a, b) => {
    const idxA = CATEGORIES.indexOf(a.type), idxB = CATEGORIES.indexOf(b.type)
    if (idxA !== idxB) return idxA - idxB
    return (a.capacity || 0) - (b.capacity || 0)
  })
  const variantKey = form.type && form.capacity ? `${form.type}-${form.capacity}` : ''

  const handleVariantPick = e => {
    const v = variants.find(x => x.id === e.target.value)
    if (!v) return
    set('type', v.type)
    set('capacity', String(v.capacity))
  }

  const handleSave = async () => {
    if (!form.number || !form.type || !form.capacity) {
      setError('الحقول المطلوبة: رقم الغرفة، الفئة، السعة')
      return
    }
    setSaving(true); setError('')
    try {
      const floor = form.floor !== '' ? parseInt(form.floor) : (parseInt(form.number[0]) || 1)
      await setDoc(doc(db, 'rooms', roomId), {
        number: form.number.trim(),
        floor,
        type: form.type.trim(),
        capacity: parseInt(form.capacity) || 1,
        active: form.active,
        updatedAt: Timestamp.now(),
        ...(isNew ? { createdAt: Timestamp.now() } : {}),
      }, { merge: !isNew })
      setTouched(false)
      onBack()
    } catch (e) { setError('فشل الحفظ: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={onBack}>رجوع إلى الغرف</Button>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
            {isNew ? 'إضافة غرفة جديدة' : `تعديل غرفة ${room.number}`}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>الغرف وحدات مخزون فقط — الاسم والصور تُدار في «فئات الغرف».</p>
        </div>
        <Button icon={saving ? <FiRefreshCw size={14} /> : <FiCheck size={14} />} disabled={saving} onClick={handleSave}>
          {saving ? 'جارٍ الحفظ...' : isNew ? 'إضافة الغرفة' : 'حفظ التغييرات'}
        </Button>
      </div>

      {error && (
        <div style={{ background: 'var(--adm-danger-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '12px 16px' }}>
          <span className="adm-field-error"><FiAlertCircle size={14} /> {error}</span>
        </div>
      )}

      <FormCard title="بيانات الغرفة">
        <FormRow columns={3}>
          <Field label="رقم الغرفة *">
            <input className="adm-input" value={form.number} onChange={e => set('number', e.target.value)} placeholder="101" />
          </Field>
          <Field label="الفئة (نوع + سعة) *">
            <select className="adm-input" value={variantKey} onChange={handleVariantPick}>
              <option value="">— اختر فئة —</option>
              {variantOptions.map(v => (
                <option key={v.id} value={v.id}>{CATEGORY_LABEL_AR[v.type] || v.type} — {v.capacity} أشخاص</option>
              ))}
            </select>
          </Field>
          <Field label="الطابق">
            <input type="number" className="adm-input" value={form.floor} onChange={e => set('floor', e.target.value)} placeholder="(يُحسب من الرقم)" min={1} />
          </Field>
        </FormRow>
        <CheckboxChip checked={form.active} onChange={v => set('active', v)} label="غرفة نشطة (متاحة للحجز)" />
      </FormCard>
    </div>
  )
}
