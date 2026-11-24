import type { User } from '../entities/user.ts'

/** Username lookups are case-insensitive. */
export interface IUserRepository {
  getByUsername(username: string): Promise<User | null>
  getByUsernames(usernames: string[]): Promise<User[]>
  /** Create the user, or update it when it has an id. */
  save(user: User): Promise<User>
}
