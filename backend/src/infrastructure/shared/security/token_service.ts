import { errors, jwtVerify, SignJWT } from 'jose'
import { parseUuid, type Uuid } from '../../../domain/shared/uuid.ts'
import type { Settings } from '../config/config.ts'

const ALGORITHM = 'HS256'

/** Issues and verifies the access tokens of the API. */
export class TokenService {
  readonly #key: Uint8Array
  readonly #expiresInSeconds: number

  constructor(settings: Pick<Settings, 'SECRET_KEY' | 'ACCESS_TOKEN_EXPIRE_MINUTES'>) {
    this.#key = new TextEncoder().encode(settings.SECRET_KEY)
    this.#expiresInSeconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
  }

  async createAccessToken(accountUuid: Uuid): Promise<string> {
    return new SignJWT({ sub: accountUuid })
      .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
      .setExpirationTime(Math.floor(Date.now() / 1000) + this.#expiresInSeconds)
      .sign(this.#key)
  }

  /** Get the account of a token, or null when the token is not valid. */
  async verify(token: string): Promise<Uuid | null> {
    try {
      const { payload } = await jwtVerify(token, this.#key, { algorithms: [ALGORITHM] })
      return typeof payload.sub === 'string' ? parseUuid(payload.sub) : null
    } catch (error) {
      if (error instanceof errors.JOSEError) return null
      throw error
    }
  }
}
