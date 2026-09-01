import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import Button from '../../components/Button'

// Every nested page under "الحجوزات" (الغرف، الوصول القادم، تقرير الحجوزات)
// gets the same one-click way back to the landing page — none of them hold
// unsaved state of their own (unlike RoomPanel's forms), so a plain
// navigate is enough; no guarded-navigate confirmation needed.
export default function BackToReservationsButton() {
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost" size="sm" icon={<FiChevronRight size={14} />}
      onClick={() => navigate('/admin/reservation')}
      style={{ marginBottom: 12 }}
    >
      رجوع إلى لوحة الحجوزات
    </Button>
  )
}
