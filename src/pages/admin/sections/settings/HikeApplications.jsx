import { useState } from 'react'
import {
  FiCalendar, FiCheck, FiCompass, FiMail, FiMessageCircle, FiMessageSquare,
  FiPhone, FiTrash2, FiUser, FiUsers,
} from 'react-icons/fi'
import { db, doc, updateDoc, deleteDoc, buildHikeCustomerWhatsAppUrl } from '../../services'
import { StatusBadge } from '../../components/StatusBadge'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import InfoItem from '../../components/InfoItem'
import ConfirmDialog from '../../components/ConfirmDialog'

const FILTERS = [
  { k: 'all', label: 'الكل' },
  { k: 'pending', label: 'معلق' },
  { k: 'confirmed', label: 'مؤكد' },
  { k: 'cancelled', label: 'ملغى' },
]

// Applications to join the hike event: filter by status, change status,
// message the applicant on WhatsApp, or delete the application. Ported from
// the old HikeApplications; only status changes are a plain direct action
// (not destructive) — deleting an application now goes through ConfirmDialog
// instead of the old window.confirm()/alert().
export default function HikeApplications({ applications, content }) {
  const [filter, setFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const setStatus = async (id, status) => {
    try { await updateDoc(doc(db, 'hikeApplications', id), { status }) }
    catch (e) { setError('تعذّر تحديث الحالة: ' + e.message) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setError('')
    try {
      await deleteDoc(doc(db, 'hikeApplications', deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) { setError('تعذّر الحذف: ' + e.message) }
    finally { setDeleting(false) }
  }

  const list = applications.filter(a => filter === 'all' || a.status === filter)

  const fmt = d => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const fmtCreated = ts => {
    if (!ts?.seconds) return ''
    return new Date(ts.seconds * 1000).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map(({ k, label }) => {
          const count = k === 'all' ? applications.length : applications.filter(a => a.status === k).length
          return (
            <Button key={k} variant={filter === k ? 'primary' : 'outline'} size="sm" onClick={() => setFilter(k)}>
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {error && (
        <div style={{ background: 'var(--adm-danger-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '12px 16px' }}>
          <span className="adm-field-error">{error}</span>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon={<FiCompass size={26} />} text="لا توجد طلبات في هذه الحالة." />
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {list.map(a => (
            <div key={a.id} className="adm-list-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{a.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>#{a.id.slice(0, 6).toUpperCase()} · {fmtCreated(a.createdAt)}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--charcoal)' }}>
                <InfoItem icon={<FiPhone size={12} />} label="الهاتف" value={a.phone} />
                {a.email && <InfoItem icon={<FiMail size={12} />} label="البريد" value={a.email} />}
                <InfoItem icon={<FiUsers size={12} />} label="عدد الأشخاص" value={a.partySize} />
                <InfoItem icon={<FiCalendar size={12} />} label="الموعد" value={fmt(a.eventDate)} />
                <InfoItem icon={a.isResident ? <FiCheck size={12} /> : <FiUser size={12} />} label="الحالة" value={a.isResident ? 'نزيل في المنتجع' : 'من خارج الفندق'} />
                {a.notes && <InfoItem icon={<FiMessageSquare size={12} />} label="ملاحظات" value={a.notes} />}
              </div>

              <select className="adm-input" value={a.status} onChange={e => setStatus(a.id, e.target.value)}>
                <option value="pending">معلق</option>
                <option value="confirmed">مؤكد</option>
                <option value="cancelled">ملغى</option>
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={buildHikeCustomerWhatsAppUrl(a, content, 'ar')}
                  target="_blank" rel="noreferrer"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <FiMessageCircle size={13} /> تواصل مع المتقدّم
                </a>
                <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={13} />} title="حذف الطلب" onClick={() => setDeleteTarget(a)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف طلب الانضمام"
        message={deleteTarget ? `سيتم حذف طلب ${deleteTarget.name} نهائياً — هل أنت متأكد؟` : ''}
        confirmLabel="حذف الطلب"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
