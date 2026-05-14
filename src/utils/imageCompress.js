// Downscale and re-encode an image File to JPEG before upload.
// Cuts typical phone photos from 3-5 MB to ~300-500 KB with no visible
// quality loss on screens up to 1920px wide.

const MAX_WIDTH = 1920
const QUALITY   = 0.82

export async function compressImage(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file
  // Skip formats we shouldn't recompress (gif = animation, svg = vector, heic = unsupported decode in browsers)
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file

  try {
    const dataUrl = await readAsDataURL(file)
    const img     = await loadImage(dataUrl)

    const scale = img.naturalWidth > MAX_WIDTH ? MAX_WIDTH / img.naturalWidth : 1
    const w = Math.round(img.naturalWidth  * scale)
    const h = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    // White background so JPEG re-encode of a PNG with transparency doesn't end up black
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', QUALITY))
    if (!blob || blob.size >= file.size) return file   // original was already smaller — keep it

    const base = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file   // if anything goes wrong, fall back to uploading the original
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
