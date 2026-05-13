import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, createContext, useContext } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import RoomsPage from './pages/RoomsPage'
import RoomDetailPage from './pages/RoomDetailPage'
import BookingPage from './pages/BookingPage'
import ConfirmationPage from './pages/ConfirmationPage'

export const LanguageContext = createContext()

export function useLanguage() {
  return useContext(LanguageContext)
}

function App() {
  const [language, setLanguage] = useState('ar')
  const isRTL = language === 'ar'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      <div
        className={isRTL ? 'rtl' : 'ltr'}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Router>
          <Header />
          <main style={{ minHeight: 'calc(100vh - var(--header-h))' }}>
            <Routes>
              <Route path="/"                         element={<HomePage />} />
              <Route path="/rooms"                    element={<RoomsPage />} />
              <Route path="/rooms/:roomId"            element={<RoomDetailPage />} />
              <Route path="/booking/:roomId"          element={<BookingPage />} />
              <Route path="/confirmation/:bookingId"  element={<ConfirmationPage />} />
            </Routes>
          </main>
          <Footer />
        </Router>
      </div>
    </LanguageContext.Provider>
  )
}

export default App
