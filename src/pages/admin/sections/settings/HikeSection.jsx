import { useState } from 'react'
import Button from '../../components/Button'
import { CountBadge } from '../../components/StatusBadge'
import { PageLoader } from '../../components/PageLoader'
import HikeContentEditor from './HikeContentEditor'
import HikeApplications from './HikeApplications'

// Simple two-panel container for the hike event's admin area: the public
// page content, and the list of applications to join. Low-traffic area, kept
// deliberately simple — a plain toggle between two panels rather than a full
// nav pattern.
export default function HikeSection({ hikeContent, hikeApps }) {
  const [view, setView] = useState('content')
  if (!hikeContent) return <PageLoader />
  const pending = hikeApps.filter(a => a.status === 'pending').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant={view === 'content' ? 'primary' : 'outline'} onClick={() => setView('content')}>محتوى الصفحة</Button>
        <Button variant={view === 'applications' ? 'primary' : 'outline'} onClick={() => setView('applications')}>
          طلبات الانضمام
          <CountBadge count={pending} />
        </Button>
      </div>
      {view === 'content'
        ? <HikeContentEditor content={hikeContent} />
        : <HikeApplications applications={hikeApps} content={hikeContent} />}
    </div>
  )
}
