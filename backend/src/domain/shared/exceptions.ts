/** Base exception of the domain layer, rendered by the API as {"detail": message}. */
export abstract class DomainException extends Error {
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/** A stored entity already has the same unique key. Not shown to clients as such. */
export class DuplicateEntityError extends Error {
  constructor(cause: unknown) {
    super('Entity already exists', { cause })
    this.name = 'DuplicateEntityError'
  }
}

export class AccountNotFoundException extends DomainException {
  readonly statusCode = 404

  constructor(identifier: string) {
    super(`Account not found: ${identifier}`)
  }
}

/** A GitHub user was not found. */
export class UserNotFoundException extends DomainException {
  readonly statusCode = 404

  constructor(username: string) {
    super(`User not found: ${username}`)
  }
}

export class ReviewValidationException extends DomainException {
  readonly statusCode = 400

  constructor(message: string) {
    super(`Review validation error: ${message}`)
  }
}

export class SelfReviewException extends DomainException {
  readonly statusCode = 400

  constructor(username: string) {
    super(`Cannot review yourself: ${username}`)
  }
}

export class AnonymousFieldImmutableException extends DomainException {
  readonly statusCode = 400

  constructor() {
    super('Cannot change anonymous status after review creation')
  }
}

export class ReviewNotFoundException extends DomainException {
  readonly statusCode = 404

  constructor(reviewId: string) {
    super(`Review not found: ${reviewId}`)
  }
}

export class UnauthorizedActionException extends DomainException {
  readonly statusCode = 403

  constructor(message: string) {
    super(`Unauthorized: ${message}`)
  }
}

export class SelfWatchException extends DomainException {
  readonly statusCode = 400

  constructor(username: string) {
    super(`Cannot watch yourself: ${username}`)
  }
}

/** A GitHub API call failed. */
export class GitHubAPIException extends DomainException {
  readonly statusCode = 502

  constructor(message: string) {
    super(`GitHub API error: ${message}`)
  }
}

export class AccessTokenMissingException extends DomainException {
  readonly statusCode = 401

  constructor() {
    super('GitHub access token is missing')
  }
}

/** The target is not a regular user (e.g. an Organization or a Bot). */
export class NotUserTypeException extends DomainException {
  readonly statusCode = 400

  constructor(username: string) {
    super(`Action not allowed: ${username} is not a regular user`)
  }
}
