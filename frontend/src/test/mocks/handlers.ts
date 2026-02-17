import { http, HttpResponse } from 'msw'

const API_BASE = '/api/v1/'

export const handlers = [
  // Auth
  http.get(`${API_BASE}users/auth`, () => {
    return HttpResponse.json({ url: 'https://github.com/login/oauth/authorize?client_id=test' })
  }),

  http.post(`${API_BASE}users/exchange-token`, () => {
    return HttpResponse.json({ token: 'test-jwt-token' })
  }),

  // Account
  http.get(`${API_BASE}account`, () => {
    return HttpResponse.json({ uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', username: 'testuser' })
  }),

  http.delete(`${API_BASE}account`, () => {
    return HttpResponse.json({})
  }),

  // Account reviews
  http.get(`${API_BASE}account/reviews`, () => {
    return HttpResponse.json([])
  }),

  // Reviews — reviewers must come before :username to avoid matching "reviewers" as a path param
  http.get(`${API_BASE}reviews/:username/reviewers`, ({ params }) => {
    return HttpResponse.json([
      {
        id: 'review-1',
        reviewer_uuid: 'uuid-1',
        reviewer_username: 'reviewer1',
        reviewer_avatar_url: null,
        reviewed_username: params.username,
        status: 'approve',
        anonymous: false,
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'review-2',
        reviewer_uuid: 'uuid-2',
        reviewer_username: 'reviewer2',
        reviewer_avatar_url: 'https://example.com/avatar.png',
        reviewed_username: params.username,
        status: 'comment',
        anonymous: false,
        updated_at: '2025-01-02T00:00:00Z',
      },
    ])
  }),

  http.get(`${API_BASE}reviews/suggestions`, () => {
    return HttpResponse.json([{ username: 'reviewSuggestion1', avatar_url: null }])
  }),

  http.get(`${API_BASE}reviews/:username`, ({ params }) => {
    return HttpResponse.json({
      items: [
        {
          id: 'review-1',
          reviewer_uuid: 'uuid-1',
          reviewer_username: 'reviewer1',
          reviewer_avatar_url: null,
          reviewed_username: params.username,
          status: 'approve',
          comment: 'Great work!',
          anonymous: false,
          comment_hidden: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
      has_more: false,
      counts: { all: 1, approve: 1, comment: 0, request_change: 0 },
    })
  }),

  http.post(`${API_BASE}reviews`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: 'new-review-1',
      reviewer_uuid: 'uuid-1',
      reviewer_username: 'testuser',
      reviewer_avatar_url: null,
      reviewed_username: body.reviewed_username,
      status: body.status,
      comment: body.comment,
      anonymous: body.anonymous ?? false,
      comment_hidden: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    })
  }),

  http.delete(`${API_BASE}reviews/:username`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch(`${API_BASE}reviews/:reviewId/visibility`, async ({ request }) => {
    const body = (await request.json()) as { hidden: boolean }
    return HttpResponse.json({
      id: 'review-1',
      comment_hidden: body.hidden,
    })
  }),

  // Users — search must come before :username to avoid matching "search" as a username
  http.get(`${API_BASE}users/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    return HttpResponse.json({
      users: [
        { login: `${q}_user1`, avatar_url: 'https://example.com/1.png', type: 'User' },
        { login: `${q}_user2`, avatar_url: 'https://example.com/2.png', type: 'User' },
      ],
    })
  }),

  http.get(`${API_BASE}users/:username`, ({ params }) => {
    return HttpResponse.json({
      username: params.username,
      name: 'Test User',
      bio: 'A test user',
      avatar_url: 'https://example.com/avatar.png',
      type: 'User',
      created_at: '2025-01-01T00:00:00Z',
      deleted_at: null,
    })
  }),

  http.post(`${API_BASE}users/:username/refresh`, ({ params }) => {
    return HttpResponse.json({
      username: params.username,
      name: 'Refreshed User',
      bio: 'Updated bio',
      avatar_url: 'https://example.com/avatar.png',
      type: 'User',
      created_at: '2025-01-01T00:00:00Z',
      deleted_at: null,
    })
  }),

  // Watchlist
  http.post(`${API_BASE}watchlist`, () => {
    return new HttpResponse(null, { status: 201 })
  }),

  http.delete(`${API_BASE}watchlist/:username`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API_BASE}watchlist`, () => {
    return HttpResponse.json([
      {
        id: 'sub-1',
        watched_username: 'user1',
        watched_avatar_url: null,
        watched_name: 'User 1',
        created_at: '2025-01-01T00:00:00Z',
      },
    ])
  }),

  http.get(`${API_BASE}watchlist/check/:username`, () => {
    return HttpResponse.json({ is_watching: false })
  }),

  http.get(`${API_BASE}account/feed`, () => {
    return HttpResponse.json({ items: [], has_more: false })
  }),
]
