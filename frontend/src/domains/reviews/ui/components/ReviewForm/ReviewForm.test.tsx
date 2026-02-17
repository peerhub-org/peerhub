import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewForm from './ReviewForm'
import { render } from '@test/utils'

describe('ReviewForm', () => {
  it('renders all form fields', async () => {
    await render(<ReviewForm username='johndoe' />)

    expect(screen.getByPlaceholderText('Leave a comment')).toBeInTheDocument()
    expect(screen.getByText('Comment')).toBeInTheDocument()
    expect(screen.getByText('Approve')).toBeInTheDocument()
    expect(screen.getByText('Request changes')).toBeInTheDocument()
    expect(screen.getByText('Submit anonymously')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit review' })).toBeInTheDocument()
  })

  it('allows selecting status radio options', async () => {
    const user = userEvent.setup()
    await render(<ReviewForm username='johndoe' />)

    const approveRadio = screen.getByRole('radio', { name: /Approve/i })
    await user.click(approveRadio)
    expect(approveRadio).toBeChecked()
  })

  it('shows character count for comment', async () => {
    const user = userEvent.setup()
    await render(<ReviewForm username='johndoe' />)

    const textarea = screen.getByPlaceholderText('Leave a comment')
    await user.type(textarea, 'Hello')
    expect(screen.getByText('5 / 1024')).toBeInTheDocument()
  })

  it('toggles anonymous switch', async () => {
    const user = userEvent.setup()
    await render(<ReviewForm username='johndoe' />)

    const toggle = screen.getByRole('checkbox', { name: /Submit anonymously/i })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('shows validation error when comment status has no comment', async () => {
    await render(<ReviewForm username='johndoe' />)

    // Use fireEvent.submit to bypass native HTML required validation
    const form = screen.getByRole('button', { name: 'Submit review' }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText("Comment is required for 'comment' status")).toBeInTheDocument()
    })
  })

  it('calls onSuccess and onClose on successful submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    await render(<ReviewForm username='johndoe' onSuccess={onSuccess} onClose={onClose} />)

    const textarea = screen.getByPlaceholderText('Leave a comment')
    await user.type(textarea, 'Great developer!')

    const submitBtn = screen.getByRole('button', { name: 'Submit review' })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows "Edit your review" title when editing', async () => {
    const existingReview = {
      id: 'review-1',
      reviewer_uuid: 'uuid-1',
      reviewer_username: 'testuser',
      reviewer_avatar_url: null,
      reviewed_username: 'johndoe',
      status: 'approve' as const,
      comment: 'Nice!',
      anonymous: false,
      comment_hidden: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }
    await render(<ReviewForm username='johndoe' existingReview={existingReview} />)

    expect(screen.getByText('Edit your review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update review' })).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    await render(<ReviewForm username='johndoe' onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })
})
