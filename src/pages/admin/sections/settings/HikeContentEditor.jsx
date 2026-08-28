import { useRef, useState } from 'react'
import { FiAlertCircle, FiExternalLink, FiImage, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import { compressImage, ref, uploadBytes, getDownloadURL, storage, saveHikeContent } from '../../services'
import { FormCard, FormRow, Field, CheckboxChip } from '../../components/FormCard'
import Button from '../../components/Button'
import ImageManager from '../../components/ImageManager'
import { useGuardWhile } from '../../hooks/useNavGuard'

const TEXT_FIELDS = [
  'titleAr', 'titleEn', 'taglineAr', 'taglineEn', 'introAr', 'introEn',
  'routeAr', 'routeEn', 'morningAr', 'morningEn', 'eveningAr', 'eveningEn',
  'priceNoteAr', 'priceNoteEn',
]

// Editor for the public "Uncle Sevak's Trail" hike page content (Firestore
// doc: siteContent/hike) — visibility toggle, logo, bilingual copy,
// highlights, pricing, upcoming dates and a gallery. Ported field-for-field
// from the old HikeContentEditor; saving is never destructive.
export default function HikeContentEditor({ content }) {
  const [form, setForm] = useState(() => {
    const init = {}
    TEXT_FIELDS.forEach(k => { init[k] = content[k] ?? '' })
    init.priceExternal = content.priceExternal ?? ''
    init.residentsFree = content.residentsFree !== false
    init.active = content.active !== false
    return init
  })
  const [images, setImages] = useState(content.images ?? [])
  const [logoUrl, setLogoUrl] = useState(content.logoUrl ?? '')
  const [highlights, setHighlights] = useState(content.highlights ?? [])
  const [upcoming, setUpcoming] = useState(content.upcoming ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logoBusy, setLogoBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const logoRef = useRef()
  useGuardWhile(touched)

  const set = (k, v) => { setTouched(true); setForm(p => ({ ...p, [k]: v })) }

  const handleLogo = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setLogoBusy(true); setError('')
    try {
      const compressed = await compressImage(file)
      const safeName = compressed.name.replace(/[^\w.-]+/g, '_')
      const sRef = ref(storage, `hike/logo/${Date.now()}_${safeName}`)
      await uploadBytes(sRef, compressed)
      setTouched(true)
      setLogoUrl(await getDownloadURL(sRef))
    } catch (err) { setError('فشل رفع الشعار: ' + err.message) }
    finally { setLogoBusy(false); e.target.value = '' }
  }
  const removeLogo = () => { setTouched(true); setLogoUrl('') }

  const addHighlight = () => { setTouched(true); setHighlights(p => [...p, { ar: '', en: '' }]) }
  const setHighlight = (i, k, v) => { setTouched(true); setHighlights(p => p.map((h, idx) => idx === i ? { ...h, [k]: v } : h)) }
  const delHighlight = i => { setTouched(true); setHighlights(p => p.filter((_, idx) => idx !== i)) }

  const addDate = () => { setTouched(true); setUpcoming(p => [...p, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: '', timeAr: '', timeEn: '' }]) }
  const setDate = (i, k, v) => { setTouched(true); setUpcoming(p => p.map((d, idx) => idx === i ? { ...d, [k]: v } : d)) }
  const delDate = i => { setTouched(true); setUpcoming(p => p.filter((_, idx) => idx !== i)) }

  const handleSave = async () => {
    if (!form.titleAr.trim()) { setError('العنوان بالعربي مطلوب'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { ...form }
      payload.priceExternal = form.priceExternal === '' ? null : parseFloat(form.priceExternal)
      payload.priceCurrency = 'USD'
      payload.logoUrl = logoUrl
      payload.images = images
      payload.highlights = highlights.filter(h => (h.ar || '').trim() || (h.en || '').trim())
      payload.upcoming = upcoming.filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date))
      await saveHikeContent(payload)
      setTouched(false)
      setSuccess('تم حفظ التغييرات بنجاح')
      setTimeout(() => setSuccess(''), 3500)
    } catch (e) { setError('فشل الحفظ: ' + e.message) }
    finally { setSaving(false) }
  }

  const SaveBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <a href="/hike" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--terracotta)', fontWeight: 600, textDecoration: 'none' }}>
        <FiExternalLink size={13} /> معاينة الصفحة
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {success && <span className="adm-badge adm-badge--good">{success}</span>}
        <Button icon={saving ? <FiRefreshCw size={14} /> : <FiSave size={14} />} disabled={saving} onClick={handleSave}>
          {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SaveBar />

      {error && (
        <div style={{ background: 'var(--adm-danger-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '12px 16px' }}>
          <span className="adm-field-error"><FiAlertCircle size={14} /> {error}</span>
        </div>
      )}

      <FormCard title="الإعدادات العامة والشعار">
        <CheckboxChip checked={form.active} onChange={v => set('active', v)} label="الفعالية نشطة (ظاهرة للزوار)" />
        <Field label="شعار الفعالية">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--linen)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiImage size={22} color="var(--sand)" />}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
              <Button size="sm" icon={<FiUpload size={13} />} disabled={logoBusy} onClick={() => logoRef.current?.click()}>
                {logoBusy ? 'جارٍ الرفع...' : 'رفع شعار'}
              </Button>
              {logoUrl && (
                <Button size="sm" variant="destructive-outline" icon={<FiX size={13} />} onClick={removeLogo}>إزالة</Button>
              )}
            </div>
          </div>
        </Field>
      </FormCard>

      <FormCard title="المحتوى بالعربي">
        <FormRow columns={2}>
          <Field label="العنوان *"><input className="adm-input" value={form.titleAr} onChange={e => set('titleAr', e.target.value)} /></Field>
          <Field label="العبارة التعريفية"><input className="adm-input" value={form.taglineAr} onChange={e => set('taglineAr', e.target.value)} /></Field>
        </FormRow>
        <Field label="الفكرة / المقدمة"><textarea className="adm-input" value={form.introAr} onChange={e => set('introAr', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        <Field label="خط السير"><textarea className="adm-input" value={form.routeAr} onChange={e => set('routeAr', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        <FormRow columns={2}>
          <Field label="الرحلة الصباحية"><textarea className="adm-input" value={form.morningAr} onChange={e => set('morningAr', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
          <Field label="الرحلة المسائية"><textarea className="adm-input" value={form.eveningAr} onChange={e => set('eveningAr', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        </FormRow>
      </FormCard>

      <FormCard title="المحتوى بالإنجليزي (اختياري)">
        <FormRow columns={2}>
          <Field label="Title"><input className="adm-input" value={form.titleEn} onChange={e => set('titleEn', e.target.value)} /></Field>
          <Field label="Tagline"><input className="adm-input" value={form.taglineEn} onChange={e => set('taglineEn', e.target.value)} /></Field>
        </FormRow>
        <Field label="Intro"><textarea className="adm-input" value={form.introEn} onChange={e => set('introEn', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        <Field label="Route"><textarea className="adm-input" value={form.routeEn} onChange={e => set('routeEn', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        <FormRow columns={2}>
          <Field label="Morning trip"><textarea className="adm-input" value={form.morningEn} onChange={e => set('morningEn', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
          <Field label="Evening trip"><textarea className="adm-input" value={form.eveningEn} onChange={e => set('eveningEn', e.target.value)} rows={3} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        </FormRow>
      </FormCard>

      <FormCard title="أبرز المعالم (تظهر كوسوم على الصفحة) — اختياري">
        {highlights.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>لا توجد معالم بعد.</p>}
        {highlights.map((h, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
            <input className="adm-input" value={h.ar} onChange={e => setHighlight(i, 'ar', e.target.value)} placeholder="بالعربي (مثال: جبل الأقرع)" />
            <input className="adm-input" value={h.en} onChange={e => setHighlight(i, 'en', e.target.value)} placeholder="English (e.g. Mount Aqra)" />
            <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={14} />} title="حذف المعلم" onClick={() => delHighlight(i)} />
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<FiPlus size={14} />} onClick={addHighlight} style={{ width: 'fit-content' }}>إضافة معلم</Button>
      </FormCard>

      <FormCard title="الأسعار والمشاركة">
        <CheckboxChip checked={form.residentsFree} onChange={v => set('residentsFree', v)} label="دخول النزلاء مجاني وتلقائي" />
        <Field label="رسوم المشاركة لغير النزلاء ($ للشخص)">
          <input type="number" min={0} className="adm-input" value={form.priceExternal} onChange={e => set('priceExternal', e.target.value)} placeholder="فارغ = حسب الطلب / لا يُعرض" style={{ maxWidth: 260 }} />
        </Field>
        <FormRow columns={2}>
          <Field label="ملاحظة الأسعار (عربي)"><textarea className="adm-input" value={form.priceNoteAr} onChange={e => set('priceNoteAr', e.target.value)} rows={2} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
          <Field label="Pricing note (English)"><textarea className="adm-input" value={form.priceNoteEn} onChange={e => set('priceNoteEn', e.target.value)} rows={2} style={{ resize: 'vertical', lineHeight: 1.7 }} /></Field>
        </FormRow>
      </FormCard>

      <FormCard title="مواعيد الرحلات القادمة">
        <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>المواعيد التي مرّ تاريخها لا تظهر للزوار تلقائياً. أقرب موعد قادم يظهر في أعلى الصفحة.</p>
        {upcoming.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>لا توجد مواعيد مجدولة بعد.</p>}
        {upcoming.map((d, i) => (
          <div key={d.id || i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
            <input type="date" className="adm-input" value={d.date} onChange={e => setDate(i, 'date', e.target.value)} />
            <input className="adm-input" value={d.timeAr} onChange={e => setDate(i, 'timeAr', e.target.value)} placeholder="الوقت/تفاصيل (عربي) — مثال: 8 صباحاً" />
            <input className="adm-input" value={d.timeEn} onChange={e => setDate(i, 'timeEn', e.target.value)} placeholder="Time/details (English) — e.g. 8 AM" />
            <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={14} />} title="حذف الموعد" onClick={() => delDate(i)} />
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<FiPlus size={14} />} onClick={addDate} style={{ width: 'fit-content' }}>إضافة موعد</Button>
      </FormCard>

      <ImageManager images={images} setImages={v => { setTouched(true); setImages(v) }} docId="gallery" pathPrefix="hike" title="صور الفعالية" onError={setError} />

      <div style={{ paddingBottom: 16 }}><SaveBar /></div>
    </div>
  )
}
