import { useRef, useState } from 'react'
import {
  FiUpload, FiImage, FiPlus, FiStar, FiEye, FiTrash2,
  FiChevronUp, FiChevronDown, FiMenu, FiX,
} from 'react-icons/fi'
import { compressImage, ref, uploadBytes, getDownloadURL, storage } from '../services'
import { Card, CardBody } from './Card'
import Button from './Button'

// Drag-reorder, cover-selectable image uploader shared by CategoryForm,
// RoomForm and HikeContentEditor. Upload/compress/reorder logic is ported
// verbatim from the old AdminPage.jsx ImageManager — only the chrome around
// it (header, buttons, empty state) is rebuilt on the shared design system.
// `images`/`setImages` are plain local form state; nothing here talks to
// Firestore directly except Storage upload calls.
export default function ImageManager({
  images, setImages, docId, roomNumber, onError,
  pathPrefix = 'variants', title = 'الصور',
}) {
  const uploadKey = docId || roomNumber
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploadProg, setUploadProg] = useState({ done: 0, total: 0 })
  const [preview, setPreview] = useState(null)

  const handleUpload = async e => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (!uploadKey) { onError?.('أكمل الحقول الأساسية أولاً'); return }
    setUploading(true)
    setUploadProg({ done: 0, total: files.length })
    onError?.('')
    try {
      const uploaded = await Promise.all(files.map(async file => {
        const compressed = await compressImage(file)
        const safeName = compressed.name.replace(/[^\w.-]+/g, '_')
        const sRef = ref(storage, `${pathPrefix}/${uploadKey}/${Date.now()}_${safeName}`)
        await uploadBytes(sRef, compressed)
        const url = await getDownloadURL(sRef)
        setUploadProg(p => ({ ...p, done: p.done + 1 }))
        return url
      }))
      setImages(p => [...p, ...uploaded])
    } catch (err) { onError?.('فشل رفع الصورة: ' + err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  const makeCover = idx => setImages(p => { const a = [...p]; const [img] = a.splice(idx, 1); return [img, ...a] })
  const remove = idx => setImages(p => p.filter((_, i) => i !== idx))
  const moveUp = idx => setImages(p => {
    if (idx <= 0) return p
    const a = [...p]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a
  })
  const moveDown = idx => setImages(p => {
    if (idx >= p.length - 1) return p
    const a = [...p]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a
  })

  // Drag-and-drop reorder
  const dragFrom = useRef(null)
  const [dragOver, setDragOver] = useState(null)
  const onDragStart = idx => { dragFrom.current = idx }
  const onDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx) }
  const onDrop = (e, idx) => {
    e.preventDefault()
    const from = dragFrom.current
    if (from !== null && from !== idx) {
      setImages(p => {
        const a = [...p]
        const [moved] = a.splice(from, 1)
        a.splice(idx, 0, moved)
        return a
      })
    }
    dragFrom.current = null; setDragOver(null)
  }
  const onDragEnd = () => { dragFrom.current = null; setDragOver(null) }

  const pct = uploadProg.total ? Math.round(uploadProg.done / uploadProg.total * 100) : 0

  return (
    <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--sand)', background: 'var(--cream)' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--charcoal)' }}>{title}</span>
            {images.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 10 }}>
                {images.length} {images.length === 1 ? 'صورة' : 'صور'} · رتّب بالسحب أو الأسهم ↑↓ · ⭐ لتغيير الغلاف
              </span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
          <Button size="sm" icon={<FiUpload size={13} />} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? `${uploadProg.done}/${uploadProg.total} جارٍ الرفع` : 'رفع صور'}
          </Button>
        </div>

        {uploading && (
          <div style={{ padding: '10px 18px', background: 'var(--adm-tone-good-bg)', borderBottom: '1px solid var(--adm-tone-good-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 5, background: '#fff', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--olive)', borderRadius: 100, width: pct + '%', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--adm-tone-good-text)', fontWeight: 700, whiteSpace: 'nowrap' }}>{pct}%</span>
          </div>
        )}

        <CardBody>
          {images.length === 0 ? (
            <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed var(--sand)', borderRadius: 14, padding: '48px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--cream)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <FiImage size={24} color="var(--sand)" />
              </div>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 6 }}>لم تُضف صور بعد</p>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>JPG · PNG · WEBP — يمكن اختيار أكثر من صورة دفعة واحدة</p>
              <Button size="sm" icon={<FiUpload size={13} />}>اختر صوراً</Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {images.map((url, i) => (
                <ImageCard
                  key={url + i}
                  url={url}
                  index={i}
                  total={images.length}
                  isCover={i === 0}
                  isDragOver={dragOver === i}
                  onMakeCover={() => makeCover(i)}
                  onRemove={() => remove(i)}
                  onPreview={() => setPreview(url)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={e => onDrop(e, i)}
                  onDragEnd={onDragEnd}
                />
              ))}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, border: '2px dashed var(--sand)', background: 'var(--cream)', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-ar)', cursor: uploading ? 'not-allowed' : 'pointer' }}
              >
                <FiPlus size={20} />
                <span>إضافة صور</span>
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,20,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={preview} alt="" style={{ maxWidth: '88vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 10 }} onClick={e => e.stopPropagation()} />
          <button
            type="button"
            onClick={() => setPreview(null)}
            style={{ position: 'absolute', top: 18, insetInlineStart: 18, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FiX size={18} />
          </button>
        </div>
      )}
    </>
  )
}

// Single image card — drag-and-drop + always-visible reorder controls.
function ImageCard({
  url, index, total, isCover, isDragOver,
  onMakeCover, onRemove, onPreview, onMoveUp, onMoveDown,
  onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const isFirst = index === 0
  const isLast = index === total - 1

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden',
        border: isDragOver ? '2px dashed var(--terracotta)' : `2px solid ${isCover ? 'var(--adm-tone-good-border)' : 'var(--border)'}`,
        background: isDragOver ? 'var(--olive-light)' : 'var(--linen)',
        cursor: 'grab',
      }}
    >
      <img src={url} alt="" loading={index < 3 ? 'eager' : 'lazy'} decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 8, insetInlineStart: 8, display: 'flex', alignItems: 'center', gap: 4, background: isCover ? 'var(--terracotta-dark)' : 'rgba(28,28,20,0.6)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, pointerEvents: 'none' }}>
        {isCover ? <><FiStar size={10} /> غلاف</> : <>#{index + 1}</>}
      </div>

      <div style={{ position: 'absolute', top: 8, insetInlineEnd: 8, background: 'rgba(28,28,20,0.5)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <FiMenu size={12} color="#fff" />
      </div>

      <div style={{ position: 'absolute', bottom: 0, insetInline: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '8px', background: 'linear-gradient(to top, rgba(28,28,20,0.8) 35%, rgba(28,28,20,0))' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <ImgBtn onClick={onMoveUp} disabled={isFirst} title="نقل إلى الأمام"><FiChevronUp size={14} /></ImgBtn>
          <ImgBtn onClick={onMoveDown} disabled={isLast} title="نقل إلى الخلف"><FiChevronDown size={14} /></ImgBtn>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isCover && <ImgBtn onClick={onMakeCover} accent title="جعلها صورة الغلاف"><FiStar size={14} /></ImgBtn>}
          <ImgBtn onClick={onPreview} title="معاينة"><FiEye size={14} /></ImgBtn>
          <ImgBtn onClick={onRemove} danger title="حذف"><FiTrash2 size={14} /></ImgBtn>
        </div>
      </div>
    </div>
  )
}

// Small icon button used inside the image card's hover/action bar. There is
// no design-system equivalent for a button that floats over a photo with
// semi-transparent chrome, so this stays a narrow, self-contained piece.
function ImgBtn({ children, onClick, disabled, danger, accent, title }) {
  const bg = disabled ? 'rgba(255,255,255,0.15)' : danger ? 'var(--adm-danger)' : accent ? 'var(--terracotta)' : 'rgba(255,255,255,0.95)'
  const fg = disabled ? 'rgba(255,255,255,0.5)' : (danger || accent) ? '#fff' : 'var(--ink)'
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); if (!disabled) onClick() }}
      disabled={disabled}
      title={title}
      style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: bg, color: fg }}
    >
      {children}
    </button>
  )
}
