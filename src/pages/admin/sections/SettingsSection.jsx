import { Link } from 'react-router-dom'
import { SETTINGS_TILES } from '../nav.config'
import { CountBadge } from '../components/StatusBadge'
import { useNavGuardState } from '../hooks/useNavGuard'
import { useGuardedNavigate } from '../hooks/useGuardedNavigate'

// The Settings hub: a grid of rarely-touched setup areas (room categories,
// room inventory, the hike event) kept out of the main daily-use nav. Each
// tile is now its own route (CategoriesPage/RoomsPage/HikePage) instead of
// swapping in place here, matching the top-level sidebar's routing.
export default function SettingsSection({ hikeApps }) {
  const { guarded } = useNavGuardState()
  const { go } = useGuardedNavigate()
  const pendingHikeCount = hikeApps.filter(a => a.status === 'pending').length

  const openTile = (path) => (e) => {
    if (guarded) { e.preventDefault(); go(path) }
  }

  return (
    <div>
      <div className="adm-section-header">
        <div>
          <h2>الإعدادات</h2>
          <p>أقسام تُستخدم بشكل غير متكرر لإعداد المنتجع — فئات الغرف، الغرف، وفعالية العم سيفاك.</p>
        </div>
      </div>
      <div className="adm-advanced-grid">
        {SETTINGS_TILES.map(tile => (
          <Link key={tile.id} to={tile.path} onClick={openTile(tile.path)} className="adm-advanced-tile">
            <div className="adm-advanced-tile__icon"><tile.Icon size={20} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p className="adm-advanced-tile__title">{tile.label}</p>
              {tile.id === 'hike' && <CountBadge count={pendingHikeCount} />}
            </div>
            <p className="adm-advanced-tile__desc">{tile.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
