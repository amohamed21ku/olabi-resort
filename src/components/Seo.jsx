import { useEffect } from 'react'

const SITE_URL = 'https://olabiresort.com'
const DEFAULT_IMAGE = `${SITE_URL}/static/images/assets/hero-bg2.png`

// Upsert a <meta> tag by name or property, creating it if missing.
function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Inject or replace a named JSON-LD block. Keyed by id so route changes
// swap the previous block instead of stacking duplicates.
function setJsonLd(id, data) {
  const existing = document.getElementById(id)
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = id
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * Per-route SEO. Updates the document title and social/canonical meta so each
 * page and shared link is described accurately for search engines and LLMs.
 *
 * Props: title, description, path (e.g. "/blog"), image, lang ("ar"|"en"),
 * jsonLd (optional object), noindex (bool).
 */
export default function Seo({ title, description, path = '/', image, lang = 'ar', jsonLd, noindex = false }) {
  useEffect(() => {
    const url = `${SITE_URL}${path === '/' ? '/' : path}`
    const img = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : DEFAULT_IMAGE

    if (title) document.title = title
    document.documentElement.lang = lang

    setMeta('name', 'description', description)
    setLink('canonical', url)
    setMeta('name', 'robots', noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')

    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)
    setMeta('property', 'og:locale', lang === 'ar' ? 'ar_SY' : 'en_US')

    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', img)

    setJsonLd('route-jsonld', jsonLd)

    return () => setJsonLd('route-jsonld', null)
  }, [title, description, path, image, lang, jsonLd, noindex])

  return null
}
