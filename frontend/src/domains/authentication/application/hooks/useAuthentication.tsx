import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { usePostHog } from '@posthog/react'
import accountService from '@domains/account/application/services/accountService'
import { Account } from '@domains/account/application/interfaces/Account'

type AuthContextType = {
  account: Account | undefined
  isLoading: boolean
  setAccount: (account: Account | undefined) => void
  refetchAccount: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthContextProviderProps {
  children: ReactNode
}

const AuthProvider = ({ children }: AuthContextProviderProps) => {
  const [account, setAccount] = useState<Account>()
  const [isLoading, setIsLoading] = useState(true)
  const isFetching = useRef(false)
  const posthog = usePostHog()

  const refetchAccount = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetching.current) return
    isFetching.current = true

    try {
      const fetchedAccount = await accountService.getAccount()
      setAccount(fetchedAccount)
      posthog?.identify(fetchedAccount.uuid)
    } catch {
      localStorage.removeItem('token')
      setAccount(undefined)
    } finally {
      setIsLoading(false)
      isFetching.current = false
    }
  }, [posthog])

  // Check if there is a currently active session
  // when the provider is mounted for the first time.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      refetchAccount()
    } else {
      setIsLoading(false)
    }
  }, [refetchAccount])

  const logout = () => {
    posthog?.capture('logout_clicked')
    posthog?.reset()
    localStorage.removeItem('token')
    setAccount(undefined)
  }

  return (
    <AuthContext.Provider value={{ account, isLoading, setAccount, refetchAccount, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthProvider, useAuth }
