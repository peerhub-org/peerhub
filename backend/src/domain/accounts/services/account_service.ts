import { randomUUID } from 'node:crypto'
import { AccountNotFoundException } from '../../shared/exceptions.ts'
import type { Uuid } from '../../shared/uuid.ts'
import { Account } from '../entities/account.ts'
import type { IAccountRepository } from '../repositories/account_repository.ts'

export class AccountService {
  readonly #accounts: IAccountRepository

  constructor(accountRepository: IAccountRepository) {
    this.#accounts = accountRepository
  }

  /** Get an account, deleted or not. */
  async getAccountByUuid(uuid: Uuid): Promise<Account> {
    const account = await this.#accounts.getByUuid(uuid)
    if (account === null) throw new AccountNotFoundException(uuid)
    return account
  }

  async getActiveAccountByUuid(uuid: Uuid): Promise<Account> {
    const account = await this.getAccountByUuid(uuid)
    if (account.deletedAt !== null) throw new AccountNotFoundException(uuid)
    return account
  }

  async getAccountByUsername(username: string): Promise<Account | null> {
    return this.#accounts.getByUsername(username)
  }

  async getAccountsByUuids(uuids: Uuid[]): Promise<Map<Uuid, Account>> {
    const accounts = await this.#accounts.getByUuids(uuids)
    return new Map(accounts.map((account) => [account.uuid, account]))
  }

  /** Get accounts keyed by lowercase username. */
  async getAccountsByUsernames(usernames: string[]): Promise<Map<string, Account>> {
    const accounts = await this.#accounts.getByUsernames(usernames)
    return new Map(accounts.map((account) => [account.username.toLowerCase(), account]))
  }

  async deleteAccount(account: Account): Promise<Account> {
    account.delete()
    return this.#accounts.update(account)
  }

  /** Get the account of a username, reactivating and refreshing it, or create a new one. */
  async getOrCreateAccount(
    username: string,
    accessToken: string,
    email: string | null = null,
  ): Promise<{ account: Account; isNew: boolean }> {
    const existing = await this.getAccountByUsername(username)
    if (existing === null) {
      const account = new Account({ id: null, uuid: randomUUID(), username, accessToken, email })
      return { account: await this.#accounts.create(account), isNew: true }
    }

    let needsUpdate = false
    if (existing.deletedAt !== null) {
      existing.activate()
      needsUpdate = true
    }
    if (accessToken) {
      existing.accessToken = accessToken
      needsUpdate = true
    }
    if (email && existing.email !== email) {
      existing.email = email
      needsUpdate = true
    }
    const account = needsUpdate ? await this.#accounts.update(existing) : existing
    return { account, isNew: false }
  }
}
