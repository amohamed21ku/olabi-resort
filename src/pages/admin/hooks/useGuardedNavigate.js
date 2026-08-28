import { useNavigate } from 'react-router-dom'
import { useNavGuardState } from './useNavGuard'

// Drop-in replacement for calling navigate(path) directly wherever the
// destination might abandon unsaved work — sidebar links, back buttons.
// When nothing is guarded it navigates immediately; when something is, it
// stores the navigation as the shared pending action for the single
// <LeaveConfirmDialog/> to run instead of moving right away.
export function useGuardedNavigate() {
  const navigate = useNavigate()
  const { guarded, setPendingAction } = useNavGuardState()

  const go = (path) => {
    if (guarded) setPendingAction(() => () => navigate(path))
    else navigate(path)
  }

  return { go }
}

// For non-navigation actions that should be guarded the same way (signing
// out mid-edit, etc.) — run(fn) executes fn immediately when nothing is
// guarded, or defers it behind the same leave-confirmation otherwise.
export function useGuardedAction() {
  const { guarded, setPendingAction } = useNavGuardState()
  const run = (fn) => {
    if (guarded) setPendingAction(() => fn)
    else fn()
  }
  return { run }
}
