import { createContext, useContext, type ReactNode } from 'react'

type CurrentUserInfo = { username: string; avatarUrl: string | null } | null

interface ReviewContextValue {
  myReviewIds: Set<string>
  currentUserInfo: CurrentUserInfo
  isPageOwner: boolean
  profileUsername: string
  isDraft: boolean
}

const ReviewContext = createContext<ReviewContextValue | null>(null)

export function ReviewContextProvider({
  value,
  children,
}: {
  value: ReviewContextValue
  children: ReactNode
}) {
  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
}

export function useReviewContext() {
  const context = useContext(ReviewContext)
  if (!context) {
    throw new Error('useReviewContext must be used within ReviewContextProvider')
  }
  return context
}
