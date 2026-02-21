import { createContext, ReactNode, useCallback, useContext, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePostHog } from '@posthog/react'
import accountService from '@domains/account/application/services/accountService'
import { Account } from '@domains/account/application/interfaces/Account'
import { queryKeys } from '@shared/application/queryKeys'

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
  const posthog = usePostHog()
  const queryClient = useQueryClient()
  const hasToken = Boolean(localStorage.getItem('token'))

  const {
    data: account,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.account.me(),
    queryFn: () => accountService.getAccount(),
    enabled: hasToken,
  })

  const setAccount = useCallback(
    (nextAccount: Account | undefined) => {
      if (nextAccount) {
        queryClient.setQueryData(queryKeys.account.me(), nextAccount)
        return
      }

      queryClient.removeQueries({ queryKey: queryKeys.account.me(), exact: true })
    },
    [queryClient],
  )

  useEffect(() => {
    if (!error) return

    localStorage.removeItem('token')
    queryClient.removeQueries({ queryKey: queryKeys.account.me(), exact: true })
  }, [error, queryClient])

  useEffect(() => {
    if (account) {
      posthog?.identify(account.uuid)
    }
  }, [account, posthog])

  const refetchAccount = useCallback(async () => {
    if (!hasToken) return

    const result = await refetch()
    if (result.error) {
      localStorage.removeItem('token')
      queryClient.removeQueries({ queryKey: queryKeys.account.me(), exact: true })
    }
  }, [hasToken, queryClient, refetch])

  const logout = () => {
    posthog?.capture('logout_clicked')
    posthog?.reset()
    localStorage.removeItem('token')
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        account,
        isLoading: hasToken ? isLoading : false,
        setAccount,
        refetchAccount,
        logout,
      }}
    >
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
