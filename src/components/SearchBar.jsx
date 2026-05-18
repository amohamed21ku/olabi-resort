import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { FiSearch, FiCalendar, FiUsers } from 'react-icons/fi'

export default function SearchBar({ onDark = false, initialValues = {} }) {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const tr = (key) => t(language, key)
  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [checkIn,  setCheckIn]  = useState(initialValues.checkIn  || today)
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || tomorrow)
  const [guests,   setGuests]   = useState(initialValues.guests   || '2')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams({ checkIn, checkOut, guests })
    navigate(`/?${params}#rooms`)
  }

  const inputStyle = {
    padding: '13px 16px',
    border: '1.5px solid #e5e5e0',
    borderRadius: 'var(--radius-md)',
    fontSize: '15px',
    color: 'var(--ink)',
    background: '#f9f8f6',
    outline: 'none',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--charcoal)',
    marginBottom: '7px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }

  return (
    <form onSubmit={handleSearch} className="search-bar-form" style={{
      background: '#ffffff',
      border: 'none',
      borderRadius: '16px',
      padding: onDark ? '20px 24px' : '16px 20px',
      boxShadow: onDark
        ? '0 24px 80px rgba(0,0,0,0.30), 0 4px 16px rgba(0,0,0,0.12)'
        : 'var(--shadow-md)',
      display: 'flex',
      gap: onDark ? '16px' : '14px',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Check-in */}
      <div className="search-bar-field" style={fieldStyle}>
        <label style={labelStyle}>
          <FiCalendar size={11} />
          {tr('search_checkIn')}
        </label>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={e => {
            setCheckIn(e.target.value)
            if (e.target.value >= checkOut) {
              const nextDay = new Date(new Date(e.target.value).getTime() + 86400000)
              setCheckOut(nextDay.toISOString().split('T')[0])
            }
          }}
          style={inputStyle}
          required
        />
      </div>

      {/* Check-out */}
      <div className="search-bar-field" style={fieldStyle}>
        <label style={labelStyle}>
          <FiCalendar size={11} />
          {tr('search_checkOut')}
        </label>
        <input
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={e => setCheckOut(e.target.value)}
          style={inputStyle}
          required
        />
      </div>

      {/* Guests */}
      <div className="search-bar-field" style={fieldStyle}>
        <label style={labelStyle}>
          <FiUsers size={11} />
          {tr('search_guests')}
        </label>
        <select
          value={guests}
          onChange={e => setGuests(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {[1,2,3,4,5].map(n => (
            <option key={n} value={n} style={{ background: '#fff', color: '#1c1c14' }}>
              {tr(`search_guest${n === 5 ? '5' : n}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Search button */}
      <button type="submit" className="btn btn-primary search-bar-submit" style={{
        gap: '8px',
        justifyContent: 'center',
        background: 'var(--terracotta)',
        boxShadow: '0 4px 16px rgba(184,87,66,0.35)',
        padding: onDark ? '14px 24px' : undefined,
        fontSize: onDark ? '15px' : undefined,
        fontWeight: 700,
        letterSpacing: '0.3px',
        transition: 'transform 0.15s, box-shadow 0.2s, background 0.2s',
        minHeight: '52px',
      }}>
        <FiSearch size={16} />
        {tr('search_btn')}
      </button>
    </form>
  )
}
