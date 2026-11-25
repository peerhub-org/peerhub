import { CACHE_EXPIRY_DAYS } from '../../shared/constants.ts'
import type { User } from '../entities/user.ts'
import type { IUserRepository } from '../repositories/user_repository.ts'

const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000

export class UserService {
  readonly #users: IUserRepository

  constructor(userRepository: IUserRepository) {
    this.#users = userRepository
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.#users.getByUsername(username)
  }

  /** Get users keyed by lowercase username. */
  async getUsersByUsernames(usernames: string[]): Promise<Map<string, User>> {
    const users = await this.#users.getByUsernames(usernames)
    return new Map(users.map((user) => [user.username.toLowerCase(), user]))
  }

  async saveUser(user: User): Promise<User> {
    return this.#users.save(user)
  }

  isCacheExpired(user: User): boolean {
    if (user.updatedAt === null) return true
    return Date.now() > user.updatedAt.getTime() + CACHE_EXPIRY_MS
  }
}
