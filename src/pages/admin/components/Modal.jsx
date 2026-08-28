import { FiX } from 'react-icons/fi'

export default function Modal({ open, title, onClose, children, footer, wide = false }) {
  if (!open) return null
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className={`adm-modal ${wide ? 'adm-modal--wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h3>{title}</h3>
          <button className="adm-modal-close" onClick={onClose} aria-label="إغلاق"><FiX size={18} /></button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
