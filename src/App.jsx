import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, createContext } from 'react'
import HomePage from './Home Page/homePage'
import RoomPage from './Room/RoomPage'

export const LanguageContext = createContext()

function App() {
  const [language, setLanguage] = useState('en')

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className={`app ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </Router>
      </div>
    </LanguageContext.Provider>
  )
}

export default App
