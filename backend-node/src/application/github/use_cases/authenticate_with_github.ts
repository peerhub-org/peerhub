import type { Account } from '../../../domain/accounts/entities/account.ts'
import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import { User } from '../../../domain/users/entities/user.ts'
import type { UserService } from '../../../domain/users/services/user_service.ts'
import type { EmailService } from '../../../infrastructure/email/email_service.ts'
import type { GitHubClient } from '../../../infrastructure/github/external/github_client.ts'
import type { Logger } from '../../../infrastructure/shared/observability/logging.ts'

/** Sign in with a GitHub OAuth code, creating the account if needed. */
export class AuthenticateWithGitHubUseCase {
  readonly #accountService: AccountService
  readonly #userService: UserService
  readonly #github: Pick<GitHubClient, 'fetchGitHubUserData'>
  readonly #emailService: Pick<EmailService, 'sendNewAccountNotification'>
  readonly #logger: Logger

  constructor(
    accountService: AccountService,
    userService: UserService,
    github: Pick<GitHubClient, 'fetchGitHubUserData'>,
    emailService: Pick<EmailService, 'sendNewAccountNotification'>,
    logger: Logger,
  ) {
    this.#accountService = accountService
    this.#userService = userService
    this.#github = github
    this.#emailService = emailService
    this.#logger = logger
  }

  async execute(code: string): Promise<Account> {
    const { profile, email, accessToken } = await this.#github.fetchGitHubUserData(code)

    const { account, isNew } = await this.#accountService.getOrCreateAccount(
      profile.username,
      accessToken,
      email,
    )
    if (isNew) await this.#notify(profile.username)

    const existing = await this.#userService.getUserByUsername(profile.username)
    // Without a date: signing in does not renew the profile cache.
    await this.#userService.saveUser(new User({ ...profile, id: existing?.id }))

    return account
  }

  async #notify(username: string): Promise<void> {
    try {
      await this.#emailService.sendNewAccountNotification(username)
    } catch (error) {
      this.#logger.error({ error }, 'Failed to send new account notification email')
    }
  }
}
