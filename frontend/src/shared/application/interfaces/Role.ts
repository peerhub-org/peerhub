export const Role = {
  USER: 'user',
  MODERATOR: 'moderator',
} as const

export type Role = (typeof Role)[keyof typeof Role]
