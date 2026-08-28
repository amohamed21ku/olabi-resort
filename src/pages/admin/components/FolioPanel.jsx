import { useState, useEffect } from 'react'
import {
  FiCreditCard, FiHome, FiCoffee, FiPlus, FiX, FiAlertCircle,
} from 'react-icons/fi'
import Button from './Button'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import { PaymentStatusBadge } from './StatusBadge'
import {
  CHARGE_CATEGORIES, CHARGE_CATEGORY_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL,
} from '../constants'
import {
  computeBookingFinance, addBookingCharge, removeBookingCharge,
  addBookingPayment, removeBookingPayment,
} from '../services'
import { useGuardWhile } from '../hooks/useNavGuard'

// Shared "Guest Bill" (فاتورة الضيف) panel — shows the room ledger and the
// extras (restaurant/café) ledger for one booking, with charges/payments on
// each. Embedded directly in the occupied-room panel (RoomPanel.jsx).
// Every add-charge / add-payment action opens a small Modal with a simple
// form instead of an always-visible inline mini-form row, and every removal
// goes through a ConfirmDialog instead of a bare "×" delete.
export default function FolioPanel({ booking }) {
  const fin = computeBookingFinance(booking)
  const charges  = Array.isArray(booking.charges)  ? booking.charges  : []
  const payments = Array.isArray(booking.payments) ? booking.payments : []
  const roomPayments   = payments.filter(p => (p.ledger || 'room') === 'room')
  const extrasPayments = payments.filter(p => p.ledger === 'extras')

  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  const [chargeModalOpen, setChargeModalOpen] = useState(false)
  const [paymentModal, setPaymentModal]       = useState(null) // 'room' | 'extras' | null
  const [removeTarget, setRemoveTarget]       = useState(null) // { kind: 'charge'|'payment', id }
  useGuardWhile(chargeModalOpen || !!paymentModal || !!removeTarget)

  const run = async (fn) => {
    setBusy(true); setError('')
    try { await fn(); return true }
    catch (e) {
      setError(e?.message === 'INVALID_AMOUNT' ? 'المبلغ غير صالح' : 'فشل الحفظ: ' + (e?.message || ''))
      return false
    }
    finally { setBusy(false) }
  }

  const submitCharge = async ({ label, amount, category }) => {
    if (!(parseFloat(amount) > 0)) { setError('أدخل مبلغاً صحيحاً للرسم'); return }
    const ok = await run(() => addBookingCharge(booking.id, { label, amount: parseFloat(amount), category }))
    if (ok) setChargeModalOpen(false)
  }

  const submitPayment = async ({ amount, method }) => {
    if (!(parseFloat(amount) > 0)) { setError('أدخل مبلغاً صحيحاً للدفعة'); return }
    const ok = await run(() => addBookingPayment(booking.id, { amount: parseFloat(amount), method, ledger: paymentModal }))
    if (ok) setPaymentModal(null)
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    const ok = await run(() => removeTarget.kind === 'charge'
      ? removeBookingCharge(booking.id, removeTarget.id)
      : removeBookingPayment(booking.id, removeTarget.id))
    if (ok) setRemoveTarget(null)
  }

  const fmtAt = (at) => {
    const d = at?.toDate ? at.toDate() : (at ? new Date(at) : null)
    if (!d || isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="adm-card" style={{ padding: '14px 16px' }}>
      {/* Header + grand remaining */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCreditCard size={15} color="var(--muted)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)' }}>فاتورة الضيف</span>
          <PaymentStatusBadge status={fin.paymentStatus} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>الإجمالي المتبقّي</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: fin.balance > 0 ? 'var(--adm-tone-warn-text)' : 'var(--adm-tone-good-text)' }}>{fin.balance}</span>
        </div>
      </div>

      {/* Grand summary */}
      <div className="adm-folio-summary">
        {[
          ['الإجمالي', fin.grandTotal, 'var(--ink)'],
          ['المدفوع', fin.paidTotal, 'var(--adm-tone-good-text)'],
          ['المتبقّي', fin.balance, fin.balance > 0 ? 'var(--adm-tone-warn-text)' : 'var(--adm-tone-good-text)'],
        ].map(([l, v, c]) => (
          <div key={l} className="adm-folio-summary__cell">
            <p className="adm-folio-summary__value" style={{ color: c }}>{v}</p>
            <p className="adm-folio-summary__label">{l}</p>
          </div>
        ))}
      </div>

      <div className="adm-ledger-grid">
        {/* ── Room ledger ── */}
        <div className="adm-ledger-box">
          <div className="adm-ledger-box__head"><FiHome size={13} color="var(--terracotta)" /><span>حساب الغرفة</span></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>قيمة الغرف</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: booking.totalPrice != null ? 'var(--ink)' : 'var(--muted)' }}>
              {booking.totalPrice != null ? fin.roomTotal : 'غير محدد'}
            </span>
          </div>

          <div className="adm-ledger-stats">
            <span style={{ color: 'var(--adm-tone-good-text)' }}>مدفوع: <strong>{fin.roomPaid}</strong></span>
            <span style={{ color: fin.roomBalance > 0 ? 'var(--adm-tone-warn-text)' : 'var(--adm-tone-good-text)' }}>المتبقّي: <strong>{Math.max(0, fin.roomBalance)}</strong></span>
          </div>

          {roomPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {roomPayments.map(p => (
                <FolioLineRow key={p.id} tone="pay" badge={PAYMENT_METHOD_LABEL[p.method] || p.method}
                  text={p.note || 'دفعة غرفة'} at={fmtAt(p.at)} amount={p.amount}
                  onRemove={() => { setError(''); setRemoveTarget({ kind: 'payment', id: p.id }) }} />
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" icon={<FiPlus size={14} />} onClick={() => { setError(''); setPaymentModal('room') }}>
            إضافة دفعة غرفة
          </Button>
        </div>

        {/* ── Extras ledger ── */}
        <div className="adm-ledger-box">
          <div className="adm-ledger-box__head"><FiCoffee size={13} color="var(--adm-tone-warn-text)" /><span>الرسوم الإضافية (مطعم، كافيه…)</span></div>

          {charges.length === 0
            ? <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>لا توجد رسوم بعد.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {charges.map(c => (
                  <FolioLineRow key={c.id} tone="charge" badge={CHARGE_CATEGORY_LABEL[c.category] || c.category}
                    text={c.label} at={fmtAt(c.at)} amount={c.amount}
                    onRemove={() => { setError(''); setRemoveTarget({ kind: 'charge', id: c.id }) }} />
                ))}
              </div>
            )}

          <div style={{ marginBottom: 10 }}>
            <Button variant="outline" size="sm" icon={<FiPlus size={14} />} onClick={() => { setError(''); setChargeModalOpen(true) }}>
              إضافة رسم
            </Button>
          </div>

          <div className="adm-ledger-stats" style={{ paddingTop: 8, borderTop: '1px dashed var(--sand)' }}>
            <span style={{ color: 'var(--charcoal)' }}>المجموع: <strong>{fin.chargesTotal}</strong></span>
            <span style={{ color: 'var(--adm-tone-good-text)' }}>مدفوع: <strong>{fin.extrasPaid}</strong></span>
            <span style={{ color: fin.extrasBalance > 0 ? 'var(--adm-tone-warn-text)' : 'var(--adm-tone-good-text)' }}>المتبقّي: <strong>{Math.max(0, fin.extrasBalance)}</strong></span>
          </div>

          {extrasPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {extrasPayments.map(p => (
                <FolioLineRow key={p.id} tone="pay" badge={PAYMENT_METHOD_LABEL[p.method] || p.method}
                  text={p.note || 'دفعة رسوم'} at={fmtAt(p.at)} amount={p.amount}
                  onRemove={() => { setError(''); setRemoveTarget({ kind: 'payment', id: p.id }) }} />
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" icon={<FiPlus size={14} />} onClick={() => { setError(''); setPaymentModal('extras') }}>
            إضافة دفعة رسوم
          </Button>
        </div>
      </div>

      <AddChargeModal open={chargeModalOpen} busy={busy} error={chargeModalOpen ? error : ''} onClose={() => setChargeModalOpen(false)} onSubmit={submitCharge} />

      <AddPaymentModal
        open={!!paymentModal}
        ledgerLabel={paymentModal === 'room' ? 'دفعة غرفة' : 'دفعة رسوم'}
        balance={paymentModal === 'room' ? Math.max(0, fin.roomBalance) : Math.max(0, fin.extrasBalance)}
        busy={busy}
        error={paymentModal ? error : ''}
        onClose={() => setPaymentModal(null)}
        onSubmit={submitPayment}
      />

      <ConfirmDialog
        open={!!removeTarget}
        title={removeTarget?.kind === 'charge' ? 'حذف رسم' : 'حذف دفعة'}
        message={removeTarget?.kind === 'charge'
          ? 'سيتم حذف هذا الرسم — هل أنت متأكد؟'
          : 'سيتم حذف هذه الدفعة — هل أنت متأكد؟'}
        confirmLabel="حذف"
        busy={busy}
        error={removeTarget ? error : ''}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

/* One line in a ledger — a charge (tone="charge") or a payment (tone="pay").
   The remove trigger is an icon-only button (title gives it an accessible
   name, matching Modal's own close button) — the actual removal always goes
   through the ConfirmDialog above, never straight from this click. */
function FolioLineRow({ tone, badge, text, at, amount, onRemove }) {
  const pay = tone === 'pay'
  return (
    <div className="adm-ledger-line" style={{ background: pay ? 'var(--adm-tone-good-bg)' : 'var(--cream)' }}>
      {badge && <span className={`adm-badge adm-badge--${pay ? 'good' : 'warn'}`} style={{ padding: '1px 7px', fontSize: 10 }}>{badge}</span>}
      <span style={{ flex: 1, color: 'var(--charcoal)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text} <span style={{ color: 'var(--muted)', fontSize: 10 }}>{at}</span>
      </span>
      <span style={{ fontWeight: 700, color: pay ? 'var(--adm-tone-good-text)' : 'var(--ink)', flexShrink: 0 }}>{pay ? '−' : ''}{amount}</span>
      {onRemove && (
        <button onClick={onRemove} title="حذف" aria-label="حذف"
          style={{ padding: 3, borderRadius: 5, border: 'none', background: 'none', color: 'var(--adm-danger)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
          <FiX size={13} />
        </button>
      )}
    </div>
  )
}

function AddChargeModal({ open, busy, error, onClose, onSubmit }) {
  const [label, setLabel]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState('restaurant')

  useEffect(() => { if (open) { setLabel(''); setAmount(''); setCategory('restaurant') } }, [open])

  return (
    <Modal open={open} title="إضافة رسم على الغرفة" onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" icon={<FiPlus size={15} />} disabled={busy} onClick={() => onSubmit({ label, amount, category })}>
          {busy ? 'جارٍ...' : 'إضافة الرسم'}
        </Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="adm-field">
          <label className="form-lbl">الوصف</label>
          <input className="adm-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="مثال: غداء" />
        </div>
        <div className="adm-field">
          <label className="form-lbl">المبلغ</label>
          <input type="number" min={0} className="adm-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
        </div>
        <div className="adm-field">
          <label className="form-lbl">الفئة</label>
          <select className="adm-input" value={category} onChange={e => setCategory(e.target.value)}>
            {CHARGE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {error && <div className="adm-field-error"><FiAlertCircle size={13} /> {error}</div>}
      </div>
    </Modal>
  )
}

function AddPaymentModal({ open, ledgerLabel, balance, busy, error, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  useEffect(() => { if (open) { setAmount(''); setMethod('cash') } }, [open])

  return (
    <Modal open={open} title={`إضافة ${ledgerLabel}`} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" icon={<FiPlus size={15} />} disabled={busy} onClick={() => onSubmit({ amount, method })}>
          {busy ? 'جارٍ...' : 'إضافة الدفعة'}
        </Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="adm-field">
          <label className="form-lbl">المبلغ</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min={0} className="adm-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            {balance > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setAmount(String(balance))}>
                دفع المتبقّي ({balance})
              </Button>
            )}
          </div>
        </div>
        <div className="adm-field">
          <label className="form-lbl">طريقة الدفع</label>
          <select className="adm-input" value={method} onChange={e => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {error && <div className="adm-field-error"><FiAlertCircle size={13} /> {error}</div>}
      </div>
    </Modal>
  )
}
