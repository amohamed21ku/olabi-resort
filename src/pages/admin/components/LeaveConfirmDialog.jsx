import ConfirmDialog from './ConfirmDialog'
import { useNavGuardState } from '../hooks/useNavGuard'

// Rendered exactly once (in AdminShell) — reads the shared pendingAction set
// by useGuardedNavigate's go() / useGuardedAction's run(), and either
// carries it out or drops it.
export default function LeaveConfirmDialog() {
  const { pendingAction, setPendingAction, setGuarded } = useNavGuardState()

  return (
    <ConfirmDialog
      open={pendingAction != null}
      title="مغادرة الصفحة"
      message="لديك تغييرات أو إجراء غير مكتمل هنا. إذا تابعت الآن فسيُفقد — هل تريد المتابعة؟"
      confirmLabel="متابعة والتخلي عنه"
      destructive
      onConfirm={() => {
        const fn = pendingAction
        setGuarded(false)
        setPendingAction(null)
        if (fn) fn()
      }}
      onCancel={() => setPendingAction(null)}
    />
  )
}
