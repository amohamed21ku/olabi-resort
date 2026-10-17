import { useState } from 'react'
import { FiCheck, FiAlertCircle, FiUser } from 'react-icons/fi'
import { updateBookingGuestInfo } from '../../services'
import { Card, CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import { Field } from '../../components/FormCard'

// Editable guest details for one booking — the name staff type here simply
// replaces whatever the customer entered, everywhere it's shown (calendar,
// lists, the WhatsApp message). Shared by BookingDetailsModal and the room
// page's "تعديل" popup so both edit the exact same fields the same way.
export default function GuestInfoCard({ booking: b, onSaved }) {
  const [guestName, setGuestName]   = useState(b.guestName || '')
  const [guestPhone, setGuestPhone] = useState(b.guestPhone || '')
  const [guestEmail, setGuestEmail] = useState(b.guestEmail || '')
  const [guestRegion, setGuestRegion]     = useState(b.guestRegion || '')
  const [guestIdNumber, setGuestIdNumber] = useState(b.guestIdNumber || '')
  const [guests, setGuests]         = useState(String(b.guests || 1))
  const [notes, setNotes]           = useState(b.notes || '')
  const [dirty, setDirty]           = useState(false)
  const [busy, setBusy]             = useState(false)
  const [err, setErr]               = useState('')

  const set = (setter) => (v) => { setter(v); setDirty(true) }

  const save = async () => {
    if (!guestName.trim()) { setErr('اسم الضيف لا يمكن أن يكون فارغاً'); return }
    setBusy(true); setErr('')
    try {
      await updateBookingGuestInfo(b.id, { guestName, guestPhone, guestEmail, guestRegion, guestIdNumber, guests, notes })
      setDirty(false)
      onSaved?.()
    } catch {
      setErr('فشل حفظ معلومات الضيف')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader icon={<FiUser size={14} color="var(--muted)" />}>معلومات الضيف</CardHeader>
      <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="الاسم"><input className="adm-input" value={guestName} onChange={e => set(setGuestName)(e.target.value)} /></Field>
          <Field label="الهاتف"><input className="adm-input" value={guestPhone} onChange={e => set(setGuestPhone)(e.target.value)} /></Field>
          <Field label="البلد / المحافظة"><input className="adm-input" value={guestRegion} onChange={e => set(setGuestRegion)(e.target.value)} /></Field>
          <Field label="رقم الهوية"><input className="adm-input" value={guestIdNumber} onChange={e => set(setGuestIdNumber)(e.target.value)} /></Field>
          <Field label="البريد الإلكتروني"><input className="adm-input" value={guestEmail} onChange={e => set(setGuestEmail)(e.target.value)} /></Field>
          <Field label="عدد الأشخاص"><input type="number" min={1} className="adm-input" value={guests} onChange={e => set(setGuests)(e.target.value)} /></Field>
        </div>
        <Field label="ملاحظات">
          <textarea className="adm-input" rows={2} value={notes} onChange={e => set(setNotes)(e.target.value)} style={{ resize: 'vertical' }} />
        </Field>
        {err && <div className="adm-field-error"><FiAlertCircle size={13} /> {err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="sm" icon={<FiCheck size={13} />} disabled={!dirty || busy} onClick={save}>
            {busy ? 'جارٍ الحفظ...' : 'حفظ معلومات الضيف'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
