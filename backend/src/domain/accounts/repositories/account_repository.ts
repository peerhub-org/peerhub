import type { Uuid } from '../../shared/uuid.ts'
import type { Account } from '../entities/account.ts'

/** Username lookups are case-insensitive. */
export interface IAccountRepository {
  getByUsername(username: string): Promise<Account | null>
  getByUuid(uuid: Uuid): Promise<Account | null>
  getByUuids(uuids: Uuid[]): Promise<Account[]>
  getByUsernames(usernames: string[]): Promise<Account[]>
  create(account: Account): Promise<Account>
  update(account: Account): Promise<Account>
}
