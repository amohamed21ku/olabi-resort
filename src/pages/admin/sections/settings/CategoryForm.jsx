import { useState } from 'react'
import { FiCheck, FiChevronRight, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { db, doc, setDoc, Timestamp } from '../../services'
import { CATEGORY_OPTIONS } from '../../constants'
import { FormCard, FormRow, Field, CheckboxChip } from '../../components/FormCard'
import Button from '../../components/Button'
import ImageManager from '../../components/ImageManager'
import { useGuardWhile } from '../../hooks/useNavGuard'

// Add/edit form for a "room category" (Firestore collection: variants) — the
// customer-facing card shown on the public site: name, description, images,
// amenities, beds, price, featured flag. Physical room inventory (numbers,
// floors) lives on RoomForm instead. Ported field-for-field from the old
// VariantFormPage; saving here is never destructive, so no ConfirmDialog.
export default function CategoryForm({ variant, onBack }) {
  const isNew = !variant
  const [form, setForm] = useState({
    type: variant?.type ?? '',
    capacity: variant?.capacity ?? '',
    nameAr: variant?.nameAr ?? '',
    nameEn: variant?.nameEn ?? '',
    descAr: variant?.descAr ?? '',
    descEn: variant?.descEn ?? '',
    bedsAr: variant?.bedsAr ?? '',
    beds: variant?.beds ?? '',
    price: variant?.price ?? '',
    amenitiesAr: variant?.amenitiesAr?.join('، ') ?? '',
    amenities: variant?.amenities?.join(', ') ?? '',
    featured: variant?.featured ?? false,
    active: variant?.active !== false,
  })
  const [images, setImages] = useState(variant?.images ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  useGuardWhile(touched)

  const set = (k, v) => { setTouched(true); setForm(p => ({ ...p, [k]: v })) }
  const variantId = variant?.id ?? (form.type && form.capacity ? `${form.type}-${form.capacity}` : '')

  const handleSave = async () => {
    if (!form.type || !form.capacity || !form.nameAr) {
      setError('الحقول المطلوبة: الفئة، السعة، الاسم بالعربي')
      return
    }
    setSaving(true); setError('')
    try {
      await setDoc(doc(db, 'variants', variantId), {
        type: form.type.trim(),
        capacity: parseInt(form.capacity) || 1,
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || form.nameAr.trim(),
        descAr: form.descAr.trim(),
        descEn: form.descEn.trim(),
        bedsAr: form.bedsAr.trim(),
        beds: form.beds.trim() || form.bedsAr.trim(),
        price: form.price !== '' ? parseFloat(form.price) : null,
        currency: 'USD',
        amenitiesAr: form.amenitiesAr.split(/[،,]/).map(s => s.trim()).filter(Boolean),
        amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images,
        featured: form.featured,
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
        <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={onBack}>رجوع إلى فئات الغرف</Button>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
            {isNew ? 'إضافة فئة جديدة' : `تعديل: ${variant.nameAr || variant.id}`}
          </h2>
        </div>
        <Button
          icon={saving ? <FiRefreshCw size={14} /> : <FiCheck size={14} />}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'جارٍ الحفظ...' : isNew ? 'إضافة الفئة' : 'حفظ التغييرات'}
        </Button>
      </div>

      {error && (
        <div style={{ background: 'var(--adm-danger-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '12px 16px' }}>
          <span className="adm-field-error"><FiAlertCircle size={14} /> {error}</span>
        </div>
      )}

      <FormCard title="المعلومات الأساسية">
        <FormRow columns={3}>
          <Field label="الفئة *">
            <select className="adm-input" value={form.type} onChange={e => set('type', e.target.value)} disabled={!isNew}>
              <option value="">— اختر —</option>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.labelAr}</option>)}
            </select>
          </Field>
          <Field label="عدد الأشخاص *">
            <input type="number" className="adm-input" value={form.capacity} onChange={e => set('capacity', e.target.value)} disabled={!isNew} min={1} max={20} />
          </Field>
          <Field label="السعر الليلي $">
            <input type="number" className="adm-input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="فارغ = عند الطلب" min={0} />
          </Field>
        </FormRow>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <CheckboxChip checked={form.featured} onChange={v => set('featured', v)} label="فئة مميزة" />
          <CheckboxChip checked={form.active} onChange={v => set('active', v)} label="فئة نشطة (ظاهرة للزوار)" />
        </div>
      </FormCard>

      <FormCard title="المحتوى بالعربي">
        <Field label="اسم الفئة *">
          <input className="adm-input" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="شقة سوبر — لـ 5 أشخاص" />
        </Field>
        <Field label="الوصف">
          <textarea className="adm-input" value={form.descAr} onChange={e => set('descAr', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} placeholder="وصف قصير يراه العميل في بطاقة الفئة." />
        </Field>
        <FormRow columns={2}>
          <Field label="تفاصيل الأسرة">
            <input className="adm-input" value={form.bedsAr} onChange={e => set('bedsAr', e.target.value)} placeholder="سرير مزدوج + ٣ أسرة" />
          </Field>
          <Field label="المرافق">
            <input className="adm-input" value={form.amenitiesAr} onChange={e => set('amenitiesAr', e.target.value)} placeholder="واي فاي، تكييف، تلفاز" />
          </Field>
        </FormRow>
      </FormCard>

      <FormCard title="المحتوى بالإنجليزي (اختياري)">
        <FormRow columns={2}>
          <Field label="Name">
            <input className="adm-input" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="Superub Apartment — for 5" />
          </Field>
          <Field label="Bed Details">
            <input className="adm-input" value={form.beds} onChange={e => set('beds', e.target.value)} placeholder="1 Double + 3 Singles" />
          </Field>
        </FormRow>
        <Field label="Description">
          <textarea className="adm-input" value={form.descEn} onChange={e => set('descEn', e.target.value)} rows={2} style={{ resize: 'vertical', lineHeight: 1.7 }} placeholder="Short customer-facing description." />
        </Field>
        <Field label="Amenities">
          <input className="adm-input" value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="WiFi, AC, TV" />
        </Field>
      </FormCard>

      <ImageManager images={images} setImages={v => { setTouched(true); setImages(v) }} docId={variantId} onError={setError} title="صور الفئة" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 16 }}>
        <Button variant="ghost" onClick={onBack}>إلغاء</Button>
        <Button icon={saving ? <FiRefreshCw size={14} /> : <FiCheck size={14} />} disabled={saving} onClick={handleSave}>
          {saving ? 'جارٍ الحفظ...' : isNew ? 'إضافة الفئة' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  )
}
