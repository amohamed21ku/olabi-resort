import { NavGuardContext, useNavGuardProviderValue } from '../hooks/useNavGuard'

export default function NavGuardProvider({ children }) {
  const value = useNavGuardProviderValue()
  return <NavGuardContext.Provider value={value}>{children}</NavGuardContext.Provider>
}
