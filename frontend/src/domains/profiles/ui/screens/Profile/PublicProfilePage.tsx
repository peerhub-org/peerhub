import { useEffect } from 'react'
import { LoaderFunctionArgs, redirect, useLoaderData } from 'react-router'
import { User as UserType } from '@domains/profiles/application/interfaces/User'
import { PaginatedReviews } from '@domains/reviews/application/interfaces/Review'
import profileService from '@domains/profiles/application/services/profileService'
import reviewService from '@domains/reviews/application/services/reviewService'
import accountService from '@domains/account/application/services/accountService'
import authService from '@domains/authentication/application/services/authenticationService'
import { isAxiosError } from '@shared/application/api/errors'
import ProfileContent from '@domains/profiles/ui/components/ProfileContent/ProfileContent'
import PublicLayout from '@shared/ui/containers/PublicLayout/PublicLayout'
import { PAGE_SIZE } from '@shared/application/config/appConstants'

interface GithubApiUser {
  login: string
  name: string | null
  bio: string | null
  avatar_url: string
  type: string
}

interface PublicProfileLoaderData {
  user: UserType
  paginatedReviews: PaginatedReviews
  currentUsername?: string
  isGuest: boolean
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { username } = params
  if (!username) {
    throw new Response('Username is required', { status: 400 })
  }

  const token = authService.getToken()

  // Authenticated user: load from backend (same as existing ProfilePage)
  if (token) {
    try {
      const account = await accountService.getAccount()
      const user = await profileService.getUser(username)

      if (user.type !== 'User') {
        return redirect('/feed')
      }

      const paginatedReviews = await reviewService.getReviews(username, PAGE_SIZE, 0)
      return {
        user,
        paginatedReviews,
        currentUsername: account.username,
        isGuest: false,
      } satisfies PublicProfileLoaderData
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token is invalid, fall through to guest mode
          authService.removeToken()
        } else if (error.response?.status === 404) {
          throw new Response('User not found', { status: 404 })
        } else {
          throw new Response('Failed to load user', { status: 500 })
        }
      } else {
        throw new Response('Failed to load user', { status: 500 })
      }
    }
  }

  // Guest mode: fetch from GitHub public API
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`)

    if (response.status === 404) {
      throw new Response('User not found', { status: 404 })
    }

    if (!response.ok) {
      throw new Response('Failed to load user', { status: 500 })
    }

    const ghUser: GithubApiUser = await response.json()

    const user: UserType = {
      username: ghUser.login,
      name: ghUser.name,
      bio: ghUser.bio,
      avatar_url: ghUser.avatar_url,
      type: ghUser.type,
      created_at: null,
      deleted_at: null,
    }

    return {
      user,
      paginatedReviews: { items: [], has_more: false },
      currentUsername: undefined,
      isGuest: true,
    } satisfies PublicProfileLoaderData
  } catch (error) {
    if (error instanceof Response) throw error
    throw new Response('Failed to load user', { status: 500 })
  }
}

export default function PublicProfilePage() {
  const { user, paginatedReviews, currentUsername, isGuest } =
    useLoaderData<PublicProfileLoaderData>()

  useEffect(() => {
    document.title = `PeerHub - ${user.username}`
  }, [user.username])

  return (
    <PublicLayout>
      <ProfileContent
        user={user}
        initialPaginatedReviews={paginatedReviews}
        showSubmitButton={!isGuest && currentUsername !== user.username}
        currentUsername={currentUsername}
        isGuest={isGuest}
      />
    </PublicLayout>
  )
}
