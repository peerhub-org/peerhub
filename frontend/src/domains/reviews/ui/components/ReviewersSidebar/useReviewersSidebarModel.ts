import { useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import reviewService from '@domains/reviews/application/services/reviewService'
import { ReviewerSummary } from '@domains/reviews/application/interfaces/Review'
import { getReviewerCounts } from '@domains/reviews/application/utils/reviewerCounts'
import { MAX_VISIBLE_REVIEWERS, STATUS_DOT_COUNT } from '@shared/application/config/appConstants'

interface UseReviewersSidebarModelParams {
  reviewers: ReviewerSummary[]
  myReviewIds: Set<string>
  onDeleteSuccess?: () => void
}

export function useReviewersSidebarModel({
  reviewers,
  myReviewIds,
  onDeleteSuccess,
}: UseReviewersSidebarModelParams) {
  const theme = useTheme()
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [seeAllOpen, setSeeAllOpen] = useState(false)

  const handleDeleteClick = (reviewedUsername: string) => {
    setDeleteTarget(reviewedUsername)
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await reviewService.deleteReview(deleteTarget)
      onDeleteSuccess?.()
    } catch {
      // Error handling
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const sortedReviews = useMemo(() => {
    return [...reviewers].sort((a, b) => {
      const aIsCurrentUser = myReviewIds.has(a.id)
      const bIsCurrentUser = myReviewIds.has(b.id)
      if (aIsCurrentUser && !bIsCurrentUser) return -1
      if (!aIsCurrentUser && bIsCurrentUser) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [reviewers, myReviewIds])

  const {
    approve: approveCount,
    requestChange: changeCount,
    comment: commentCount,
    total: totalCount,
  } = getReviewerCounts(reviewers)

  const circleColors = useMemo(() => {
    if (totalCount === 0) return []

    const changeCircles = Math.floor((changeCount / totalCount) * STATUS_DOT_COUNT)
    let approveCircles = 0
    let commentCircles = 0

    if (approveCount > 0) {
      commentCircles = Math.floor((commentCount / totalCount) * STATUS_DOT_COUNT)
      approveCircles = STATUS_DOT_COUNT - changeCircles - commentCircles
    } else {
      approveCircles = 0
      commentCircles = STATUS_DOT_COUNT - changeCircles
    }

    const colors: string[] = []
    for (let i = 0; i < approveCircles; i++) colors.push(theme.palette.success.main)
    for (let i = 0; i < changeCircles; i++) colors.push(theme.palette.error.main)
    for (let i = 0; i < commentCircles; i++) colors.push(theme.palette.grey[600])

    return colors
  }, [approveCount, changeCount, commentCount, totalCount, theme])

  const visibleReviews = sortedReviews.slice(0, MAX_VISIBLE_REVIEWERS)
  const hasMoreReviewers = sortedReviews.length > MAX_VISIBLE_REVIEWERS

  return {
    deleting,
    deleteTarget,
    seeAllOpen,
    setSeeAllOpen,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    sortedReviews,
    approveCount,
    changeCount,
    commentCount,
    totalCount,
    circleColors,
    visibleReviews,
    hasMoreReviewers,
  }
}
