import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import { User } from '../../../domain/users/entities/user.ts'
import type { UserService } from '../../../domain/users/services/user_service.ts'
import type { GitHubClient } from '../../../infrastructure/github/external/github_client.ts'

/** Get a GitHub user from the local cache, or from GitHub when missing or expired. */
export class GetUserUseCase {
  readonly #accountService: AccountService
  readonly #userService: UserService
  readonly #github: Pick<GitHubClient, 'fetchUserByUsername'>

  constructor(
    accountService: AccountService,
    userService: UserService,
    github: Pick<GitHubClient, 'fetchUserByUsername'>,
  ) {
    this.#accountService = accountService
    this.#userService = userService
    this.#github = github
  }

  async execute(username: string, currentAccountUuid: Uuid, forceRefresh = false): Promise<User> {
    const cached = await this.#userService.getUserByUsername(username)
    if (cached !== null && !forceRefresh && !this.#userService.isCacheExpired(cached))
      return this.#withAccountDates(cached, username)

    const account = await this.#accountService.getAccountByUuid(currentAccountUuid)
    const profile = await this.#github.fetchUserByUsername(username, account.accessToken)
    const saved = await this.#userService.saveUser(
      new User({ ...profile, id: cached?.id, updatedAt: new Date() }),
    )
    return this.#withAccountDates(saved, username)
  }

  async #withAccountDates(user: User, username: string): Promise<User> {
    const account = await this.#accountService.getAccountByUsername(username)
    if (account !== null) {
      user.createdAt = account.createdAt
      user.deletedAt = account.deletedAt
    }
    return user
  }
}
