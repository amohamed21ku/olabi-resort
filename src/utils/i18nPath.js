// Single source of truth for the /en/ URL prefix, used by both App.jsx's
// routing/navigation helpers and Seo.jsx's canonical/hreflang URL building —
// kept in one place so the two can never drift apart.
export function withLangPrefix(path, lang) {
  if (lang !== 'en') return path
  return path === '/' ? '/en' : `/en${path}`
}

// Strip a leading /en (if present) to get back the language-neutral path —
// used when computing the "same page, other language" URL.
export function stripLangPrefix(path) {
  if (path === '/en') return '/'
  if (path.startsWith('/en/')) return path.slice(3)
  return path
}
