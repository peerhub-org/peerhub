import { ReactNode, useMemo } from 'react'
import { Container } from '@mui/material'
import { PaginatedReviews } from '@domains/reviews/application/interfaces/Review'
import { User } from '@domains/profiles/application/interfaces/User'
import ReviewTimeline from '@domains/reviews/ui/components/ReviewTimeline/ReviewTimeline'
import ReviewersSidebar from '@domains/reviews/ui/components/ReviewersSidebar/ReviewersSidebar'
import { useInfiniteReviews } from '@domains/reviews/application/hooks/useInfiniteReviews'
import { useMyReviews } from '@domains/reviews/application/hooks/useMyReviews'
import { useProfileStatus } from '@domains/profiles/application/hooks/useProfileStatus'
import { useProfileReviewers } from '@domains/profiles/application/hooks/useProfileReviewers'
import { useInitialProfileLoading } from '@domains/profiles/application/hooks/useInitialProfileLoading'
import { ReviewContextProvider } from '@domains/reviews/ui/context/ReviewContext'
import { getReviewerCounts } from '@domains/reviews/application/utils/reviewerCounts'
import InlineError from '@shared/ui/components/InlineError/InlineError'
import ProfileHeader from './ProfileHeader'
import ProfileTabs from './ProfileTabs'
import ClosedUserNotice from './ClosedUserNotice'
import { ProfileMainSkeleton, ProfileTabsSkeleton } from './ProfileLoadingSkeleton'
import { MainContent, TimelinePanel, SidebarPanel } from './ProfileContent.styled'

interface ProfileContentProps {
  user: User
  initialPaginatedReviews: PaginatedReviews
  emptyMessage?: string
  showSubmitButton?: boolean
  headerContent?: ReactNode
  currentUsername?: string
  myReviewIds?: Set<string>
}

type FilterTab = 'all' | 'approve' | 'comment' | 'request_change'

export default function ProfileContent({
  user: initialUser,
  initialPaginatedReviews,
  emptyMessage,
  showSubmitButton = false,
  headerContent,
  currentUsername,
  myReviewIds: initialMyReviewIds,
}: ProfileContentProps) {
  const profileUsername = initialUser.username

  const { user, isPageOwner, isDraft, isClosed, statusInfo, handleRefreshUser } = useProfileStatus(
    initialUser,
    currentUsername,
  )

  const {
    activeTab,
    reviews,
    loading: refreshingReviews,
    loadingMore,
    hasMore,
    sentinelRef,
    handleTabChange,
    handleToggleHidden,
    refresh: refreshReviews,
  } = useInfiniteReviews(profileUsername, initialPaginatedReviews)

  const { myReviewIds, myReviewsLoading, currentUserInfo, existingReview, refetchMyReviews } =
    useMyReviews(currentUsername, initialMyReviewIds, profileUsername)

  const {
    reviewers,
    loading: reviewersLoading,
    error: reviewersError,
    refetch: refetchReviewers,
  } = useProfileReviewers(profileUsername)

  const hasExistingReview = useMemo(
    () => reviewers.some((r) => myReviewIds.has(r.id)),
    [reviewers, myReviewIds],
  )
  const shouldLoadMyReviews = Boolean(currentUsername && !initialMyReviewIds)
  const { isInitialProfileLoading } = useInitialProfileLoading({
    profileUsername,
    reviewersLoading,
    myReviewsLoading,
    shouldLoadMyReviews,
  })

  const counts = getReviewerCounts(reviewers)
  const tabCounts: Record<FilterTab, number> = {
    all: counts.total,
    approve: counts.approve,
    request_change: counts.requestChange,
    comment: counts.comment,
  }

  const handleRefreshData = () => {
    refreshReviews()
    refetchReviewers()
    refetchMyReviews()
  }

  return (
    <Container maxWidth='lg' sx={{ mt: 3, mb: 4 }}>
      <ProfileHeader
        username={user.username}
        createdAt={user.created_at}
        statusInfo={statusInfo}
        showSubmitButton={showSubmitButton}
        isClosed={isClosed}
        hasExistingReview={hasExistingReview}
        existingReview={existingReview}
        isLoading={isInitialProfileLoading}
        onSuccess={handleRefreshData}
      />

      {isInitialProfileLoading ? (
        <ProfileTabsSkeleton />
      ) : (
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabCounts={tabCounts}
          isDraft={isDraft}
          isClosed={isClosed}
        />
      )}

      {isClosed && <ClosedUserNotice />}

      {!isClosed && (
        <>
          {headerContent}

          {isInitialProfileLoading ? (
            <ProfileMainSkeleton />
          ) : (
            <ReviewContextProvider
              value={{
                myReviewIds,
                currentUserInfo,
                isPageOwner,
                profileUsername,
                isDraft,
              }}
            >
              <MainContent>
                <TimelinePanel>
                  <ReviewTimeline
                    user={user}
                    reviews={reviews}
                    refreshing={refreshingReviews}
                    emptyMessage={emptyMessage}
                    onToggleHidden={handleToggleHidden}
                    onRefreshUser={handleRefreshUser}
                    sentinelRef={sentinelRef}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                  />
                </TimelinePanel>

                <SidebarPanel>
                  {!reviewersError ? (
                    <ReviewersSidebar
                      reviewers={reviewers}
                      loading={false}
                      onDeleteSuccess={handleRefreshData}
                    />
                  ) : (
                    <InlineError message='Unable to load reviewers right now.' />
                  )}
                </SidebarPanel>
              </MainContent>
            </ReviewContextProvider>
          )}
        </>
      )}
    </Container>
  )
}
