import { FiChevronRight } from 'react-icons/fi'
import Button from '../../components/Button'
import { useGuardedNavigate } from '../../hooks/useGuardedNavigate'
import HikeSection from './HikeSection'

// Own route (/admin/settings/hike) — HikeSection already manages its own
// content/applications toggle internally, so this is just the back link.
export default function HikePage({ hikeContent, hikeApps }) {
  const { go } = useGuardedNavigate()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={() => go('/admin/settings')}>
          رجوع إلى الإعدادات
        </Button>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>فعالية العم سيفاك</h2>
      </div>

      <HikeSection hikeContent={hikeContent} hikeApps={hikeApps} />
    </div>
  )
}
