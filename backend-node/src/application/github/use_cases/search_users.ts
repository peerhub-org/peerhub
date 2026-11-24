import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type {
  GitHubClient,
  GitHubSearchedUser,
} from '../../../infrastructure/github/external/github_client.ts'

/** Search GitHub users on behalf of the current account. */
export class SearchUsersUseCase {
  readonly #accountService: AccountService
  readonly #github: Pick<GitHubClient, 'searchUsers'>

  constructor(accountService: AccountService, github: Pick<GitHubClient, 'searchUsers'>) {
    this.#accountService = accountService
    this.#github = github
  }

  async execute(query: string, currentAccountUuid: Uuid): Promise<GitHubSearchedUser[]> {
    const account = await this.#accountService.getAccountByUuid(currentAccountUuid)
    return this.#github.searchUsers(query, account.accessToken)
  }
}
