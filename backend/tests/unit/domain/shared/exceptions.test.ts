import { expect, test } from 'vitest'
import * as exceptions from '../../../../src/domain/shared/exceptions.ts'

// Messages and statuses are part of the API contract.
test.each([
  [new exceptions.AccountNotFoundException('x'), 404, 'Account not found: x'],
  [new exceptions.UserNotFoundException('x'), 404, 'User not found: x'],
  [new exceptions.ReviewValidationException('x'), 400, 'Review validation error: x'],
  [new exceptions.SelfReviewException('x'), 400, 'Cannot review yourself: x'],
  [
    new exceptions.AnonymousFieldImmutableException(),
    400,
    'Cannot change anonymous status after review creation',
  ],
  [new exceptions.ReviewNotFoundException('x'), 404, 'Review not found: x'],
  [new exceptions.UnauthorizedActionException('x'), 403, 'Unauthorized: x'],
  [new exceptions.SelfWatchException('x'), 400, 'Cannot watch yourself: x'],
  [new exceptions.GitHubAPIException('x'), 502, 'GitHub API error: x'],
  [new exceptions.AccessTokenMissingException(), 401, 'GitHub access token is missing'],
  [new exceptions.NotUserTypeException('x'), 400, 'Action not allowed: x is not a regular user'],
])('%s', (error, status, message) => {
  expect(error).toBeInstanceOf(exceptions.DomainException)
  expect(error.statusCode).toBe(status)
  expect(error.message).toBe(message)
  expect(error.name).toBe(error.constructor.name)
})
