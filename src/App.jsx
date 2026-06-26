import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import RoomDetailPage from './pages/RoomDetailPage'
import BookingPage from './pages/BookingPage'
import ConfirmationPage from './pages/ConfirmationPage'
import AdminPage from './pages/AdminPage'
import HikePage from './pages/HikePage'

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

function AppLayout() {
  const location = useLocation()
  const isAdmin  = location.pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Header />}
      <main style={isAdmin ? {} : { minHeight: 'calc(100vh - var(--header-h))' }}>
        <Routes>
          <Route path="/"                        element={<HomePage />} />
          <Route path="/hike"                    element={<HikePage />} />
          <Route path="/rooms/:roomId"           element={<RoomDetailPage />} />
          <Route path="/booking/:roomId"         element={<BookingPage />} />
          <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
          <Route path="/admin"                   element={<AdminPage />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}

function App() {
  const [language, setLanguage] = useState('ar')
  const isRTL = language === 'ar'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
        <Router>
          <AppLayout />
        </Router>
      </div>
    </LanguageContext.Provider>
  )
}

export default App
