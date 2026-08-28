import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { createContext, useContext, useEffect } from 'react'
import './App.css'
import { withLangPrefix, stripLangPrefix } from './utils/i18nPath'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import RoomDetailPage from './pages/RoomDetailPage'
import BookingPage from './pages/BookingPage'
import ConfirmationPage from './pages/ConfirmationPage'
import AdminPage from './pages/admin'
import HikePage from './pages/HikePage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'

export const LanguageContext = createContext()

export function useLanguage() {
  return useContext(LanguageContext)
}

// Reset scroll on every PUSH/REPLACE navigation. POP (browser back/forward)
// keeps the browser-restored position, and hash links handle their own scroll.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'POP') return
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash, navType])

  return null
}

// The real page-route table, mounted twice below (once at the root for
// Arabic, once under /en/* for English) so every page gets a working English
// URL for free — React Router resolves these paths relative to wherever the
// parent route mounted this component, so nothing here needs to know about
// the /en prefix at all.
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/"                        element={<HomePage />} />
      <Route path="/hike"                    element={<HikePage />} />
      <Route path="/blog"                    element={<BlogPage />} />
      <Route path="/blog/:slug"              element={<BlogPostPage />} />
      <Route path="/rooms/:roomId"           element={<RoomDetailPage />} />
      <Route path="/booking/:roomId"         element={<BookingPage />} />
      <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
    </Routes>
  )
}

function AppLayout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Header />}
      <main style={isAdmin ? {} : { minHeight: 'calc(100vh - var(--header-h))' }}>
        <Routes>
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/en/*"    element={<PublicRoutes />} />
          <Route path="/*"       element={<PublicRoutes />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}

// Language is derived from the URL, not independent state — a page reached
// at /en/... is English, everything else is Arabic (the default/root
// language). This is the single source of truth the /en/ prefix relies on:
// it can never desync from what's actually in the address bar.
function LanguageProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isEn = location.pathname === '/en' || location.pathname.startsWith('/en/')
  const language = isEn ? 'en' : 'ar'
  const isRTL = !isEn

  const withLang = (path) => withLangPrefix(path, language)
  const toggleLanguage = () => {
    const bare = stripLangPrefix(location.pathname)
    const target = withLangPrefix(bare, language === 'ar' ? 'en' : 'ar')
    navigate(`${target}${location.search}`)
  }

  return (
    <LanguageContext.Provider value={{ language, isRTL, withLang, toggleLanguage }}>
      <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AppLayout />
      </LanguageProvider>
    </Router>
  )
}

export default App
