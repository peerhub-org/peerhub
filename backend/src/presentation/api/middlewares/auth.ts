import type { Request } from 'express'
import type { AccountService } from '../../../domain/accounts/services/account_service.ts'
import { AccountNotFoundException } from '../../../domain/shared/exceptions.ts'
import type { Uuid } from '../../../domain/shared/uuid.ts'
import type { TokenService } from '../../../infrastructure/shared/security/token_service.ts'
import { HttpError } from '../errors.ts'

const unauthorized = (detail: string) =>
  new HttpError(401, detail, { 'WWW-Authenticate': 'Bearer' })

/** Get the account of the bearer token, which must exist and be active. */
export async function authenticate(
  req: Request,
  tokenService: Pick<TokenService, 'verify'>,
  accountService: Pick<AccountService, 'getActiveAccountByUuid'>,
): Promise<Uuid> {
  // Split by hand: a regular expression could take long on headers made to be slow.
  const header = req.headers.authorization ?? ''
  const space = header.indexOf(' ')
  const scheme = space === -1 ? header : header.slice(0, space)
  const token = space === -1 ? '' : header.slice(space + 1).trim()
  if (scheme.toLowerCase() !== 'bearer') throw unauthorized('Not authenticated')

  const accountUuid = await tokenService.verify(token)
  if (accountUuid === null) throw unauthorized('Could not validate credentials')
  try {
    await accountService.getActiveAccountByUuid(accountUuid)
  } catch (error) {
    if (error instanceof AccountNotFoundException)
      throw unauthorized('Could not validate credentials')
    throw error
  }
  return accountUuid
}
