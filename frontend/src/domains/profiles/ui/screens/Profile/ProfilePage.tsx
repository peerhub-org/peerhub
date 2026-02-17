import { useEffect, useRef } from 'react'
import { LoaderFunctionArgs, redirect, useLoaderData } from 'react-router'
import { usePostHog } from '@posthog/react'
import { User as UserType } from '@domains/profiles/application/interfaces/User'
import { PaginatedReviews } from '@domains/reviews/application/interfaces/Review'
import profileService from '@domains/profiles/application/services/profileService'
import reviewService from '@domains/reviews/application/services/reviewService'
import accountService from '@domains/account/application/services/accountService'
import { isAxiosError } from '@shared/application/api/errors'
import ProfileContent from '@domains/profiles/ui/components/ProfileContent/ProfileContent'
import { PAGE_SIZE } from '@shared/application/config/appConstants'

export async function loader({ params }: LoaderFunctionArgs) {
  const { username } = params
  if (!username) {
    throw new Response('Username is required', { status: 400 })
  }

  try {
    const account = await accountService.getAccount()
    const isOwnProfile = account.username.toLowerCase() === username.toLowerCase()

    const user = await profileService.getUser(username)

    if (user.type !== 'User') {
      return redirect('/feed')
    }

    const paginatedReviews = await reviewService.getReviews(username, PAGE_SIZE, 0)
    return { user, paginatedReviews, currentUsername: account.username, isOwnProfile }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response?.status === 401) {
        return redirect('/')
      }
      if (error.response?.status === 404) {
        throw new Response('User not found', { status: 404 })
      }
    }
    if (import.meta.env.DEV) {
      console.error('[ProfilePage loader]', error)
    }
    throw new Response('Failed to load user', { status: 500 })
  }
}

export default function ProfilePage() {
  const { user, paginatedReviews, currentUsername, isOwnProfile } = useLoaderData<{
    user: UserType
    paginatedReviews: PaginatedReviews
    currentUsername: string
    isOwnProfile: boolean
  }>()
  const posthog = usePostHog()
  const hasTrackedView = useRef(false)

  useEffect(() => {
    document.title = `PeerHub - ${user.username}`

    // Track profile view only once per mount (top of conversion funnel)
    if (!hasTrackedView.current && !isOwnProfile) {
      posthog?.capture('profile_viewed', {
        viewed_username: user.username,
        reviews_count: paginatedReviews.items.length,
      })
      hasTrackedView.current = true
    }
  }, [user.username, isOwnProfile, paginatedReviews.items.length, posthog])

  return (
    <ProfileContent
      user={user}
      initialPaginatedReviews={paginatedReviews}
      showSubmitButton={!isOwnProfile}
      emptyMessage={
        isOwnProfile
          ? 'No reviews yet. Share your profile to receive peer reviews!'
          : 'No reviews yet. Be the first to leave a review!'
      }
      currentUsername={currentUsername}
    />
  )
}
