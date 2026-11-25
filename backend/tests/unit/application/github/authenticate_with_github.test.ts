import { expect, test, vi } from 'vitest'
import { AuthenticateWithGitHubUseCase } from '../../../../src/application/github/use_cases/authenticate_with_github.ts'
import { GitHubAPIException } from '../../../../src/domain/shared/exceptions.ts'
import { User } from '../../../../src/domain/users/entities/user.ts'
import { createDomain, makeAccount, PAST } from '../../../helpers/domain.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const profile = {
  username: 'alice',
  name: 'Alice',
  bio: 'dev',
  avatarUrl: 'https://example.com/alice.png',
  type: 'User',
}

function setup() {
  const domain = createDomain()
  const fetchGitHubUserData = vi.fn(async () => ({
    profile,
    email: 'alice@example.test' as string | null,
    accessToken: 'gho_new',
  }))
  const sendNewAccountNotification = vi.fn(async () => {})
  const { logger, lines } = memoryLogger()
  const useCase = new AuthenticateWithGitHubUseCase(
    domain.accountService,
    domain.userService,
    { fetchGitHubUserData },
    { sendNewAccountNotification },
    logger,
  )
  return { ...domain, useCase, fetchGitHubUserData, sendNewAccountNotification, lines }
}

test('creates account and profile, and notifies', async () => {
  const { useCase, repositories, fetchGitHubUserData, sendNewAccountNotification } = setup()
  const account = await useCase.execute('code123')
  expect(fetchGitHubUserData).toHaveBeenCalledExactlyOnceWith('code123')
  expect(account).toMatchObject({
    username: 'alice',
    accessToken: 'gho_new',
    email: 'alice@example.test',
  })
  expect(repositories.users.save).toHaveBeenCalledExactlyOnceWith(new User(profile))
  expect(sendNewAccountNotification).toHaveBeenCalledExactlyOnceWith('alice')
})

test('refreshes an existing account and profile without notifying', async () => {
  const { useCase, repositories, sendNewAccountNotification } = setup()
  const existing = makeAccount({ username: 'alice', deletedAt: PAST })
  repositories.accounts.getByUsername.mockResolvedValue(existing)
  repositories.users.getByUsername.mockResolvedValue(
    new User({ id: 'u1', username: 'alice', updatedAt: PAST }),
  )
  expect(await useCase.execute('code123')).toBe(existing)
  expect(existing).toMatchObject({ accessToken: 'gho_new', deletedAt: null })
  // Same document, and no new date: the cache keeps its age.
  expect(repositories.users.save).toHaveBeenCalledExactlyOnceWith(
    new User({ ...profile, id: 'u1', updatedAt: null }),
  )
  expect(sendNewAccountNotification).not.toHaveBeenCalled()
})

test('signs in even if the notification fails', async () => {
  const { useCase, repositories, sendNewAccountNotification, lines } = setup()
  sendNewAccountNotification.mockRejectedValue(new Error('provider down'))
  expect((await useCase.execute('code123')).username).toBe('alice')
  expect(repositories.users.save).toHaveBeenCalledOnce()
  expect(lines).toMatchObject([
    {
      level: 'ERROR',
      message: 'Failed to send new account notification email',
      error: { message: 'provider down' },
    },
  ])
})

test('writes nothing when GitHub fails', async () => {
  const { useCase, repositories, fetchGitHubUserData } = setup()
  fetchGitHubUserData.mockRejectedValue(new GitHubAPIException('x'))
  await expect(useCase.execute('code123')).rejects.toThrow(GitHubAPIException)
  expect(repositories.accounts.create).not.toHaveBeenCalled()
  expect(repositories.users.save).not.toHaveBeenCalled()
})
