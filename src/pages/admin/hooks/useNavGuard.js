import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Shared "is something unsaved right now" flag, plus the one action (navigate
// somewhere, sign out, ...) a blocked attempt wants to run once confirmed.
// The actual <NavGuardContext.Provider> component lives in
// components/NavGuardProvider.jsx (kept separate so this file only exports
// hooks/values, not a component, for Fast Refresh).
export const NavGuardContext = createContext(null)

export function useNavGuardProviderValue() {
  const [guarded, setGuardedState] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // a () => void, or null
  const setGuarded = useCallback((v) => setGuardedState(!!v), [])
  return { guarded, setGuarded, pendingAction, setPendingAction }
}

export function useNavGuardState() {
  return useContext(NavGuardContext)
}

// One-line opt-in for any component with an open modal or a touched form:
// useGuardWhile(addOpen || !!chooseFor). Resets the guard on unmount so
// leaving the guarded component through a normal in-app action (closing a
// modal, finishing a form) never leaves a stale block behind.
export function useGuardWhile(condition) {
  const { setGuarded } = useNavGuardState()
  useEffect(() => { setGuarded(!!condition) }, [condition, setGuarded])
  useEffect(() => () => setGuarded(false), [setGuarded])
}
