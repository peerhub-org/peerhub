import type { IAccountRepository } from '../../accounts/repositories/account_repository.ts'
import type { IUserRepository } from '../../users/repositories/user_repository.ts'
import { NotUserTypeException, type DomainException } from '../exceptions.ts'
import type { Uuid } from '../uuid.ts'

/** Check that nobody performs an action on themselves (case-insensitive). */
export async function checkNotSelfAction(
  accountRepository: IAccountRepository,
  actorUuid: Uuid,
  targetUsername: string,
  Exception: new (username: string) => DomainException,
): Promise<void> {
  const account = await accountRepository.getByUuid(actorUuid)
  if (account && account.username.toLowerCase() === targetUsername.toLowerCase())
    throw new Exception(targetUsername)
}

/** Check that the target, when known, is a regular user (not an Organization or Bot). */
export async function checkTargetIsUserType(
  userRepository: IUserRepository,
  targetUsername: string,
): Promise<void> {
  const user = await userRepository.getByUsername(targetUsername)
  if (user !== null && !user.isUserType) throw new NotUserTypeException(targetUsername)
}
