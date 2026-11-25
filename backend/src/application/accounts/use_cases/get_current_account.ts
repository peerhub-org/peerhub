import type { Account } from '../../../domain/accounts/entities/account.ts'
import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'

export class GetCurrentAccountUseCase {
  readonly #accountService: AccountService

  constructor(accountService: AccountService) {
    this.#accountService = accountService
  }

  async execute(accountUuid: Uuid): Promise<Account> {
    return this.#accountService.getActiveAccountByUuid(accountUuid)
  }
}
