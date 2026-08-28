import { useState, useEffect } from 'react'
import '../../styles/admin.css'
import { auth, onAuthStateChanged } from './services'
import { FullLoader } from './components/PageLoader'
import LoginScreen from './LoginScreen'
import AdminShell from './AdminShell'

export default function AdminPage() {
  const [user, setUser]   = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setReady(true) }), [])

  if (!ready) return <FullLoader />
  if (!user)  return <LoginScreen />
  return <AdminShell user={user} />
}
