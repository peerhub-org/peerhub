import { describe, it, expect } from 'vitest'
import profileService from './profileService'

describe('ProfileService', () => {
  it('getUser returns user data', async () => {
    const user = await profileService.getUser('johndoe')
    expect(user.username).toBe('johndoe')
    expect(user.name).toBe('Test User')
  })

  it('searchUsers returns matching users', async () => {
    const results = await profileService.searchUsers('test')
    expect(results).toHaveLength(2)
    expect(results[0].login).toBe('test_user1')
  })

  it('refreshUser returns updated user', async () => {
    const user = await profileService.refreshUser('johndoe')
    expect(user.username).toBe('johndoe')
    expect(user.name).toBe('Refreshed User')
  })
})
