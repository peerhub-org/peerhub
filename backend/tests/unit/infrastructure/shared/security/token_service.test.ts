import { decodeJwt, decodeProtectedHeader } from 'jose'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { TokenService } from '../../../../../src/infrastructure/shared/security/token_service.ts'
import { ALICE, SECRET_KEY, tokens } from '../../../../helpers/tokens.ts'

const service = new TokenService({
  SECRET_KEY: SECRET_KEY,
  ACCESS_TOKEN_EXPIRE_MINUTES: 10080,
})

afterEach(() => void vi.useRealTimers())

describe('tokens issued elsewhere with the same key', () => {
  test.each(['alice', 'no_exp', 'sub_uppercase', 'sub_no_dashes'])('%s is valid', async (name) => {
    expect(await service.verify(tokens[name]!)).toBe(ALICE)
  })

  test.each([
    'expired',
    'wrong_key',
    'alg_none',
    'alg_hs512',
    'no_sub',
    'sub_not_uuid',
    'future_nbf',
  ])('%s is not valid', async (name) => {
    expect(tokens[name]).toBeDefined()
    expect(await service.verify(tokens[name]!)).toBeNull()
  })
})

test.each(['', 'not-a-jwt', 'a.b.c', 'a.b'])('%j is not valid', async (token) => {
  expect(await service.verify(token)).toBeNull()
})

describe('issued tokens', () => {
  test('carry account and expiration only', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00.900Z'), toFake: ['Date'] })
    const token = await service.createAccessToken(ALICE)
    expect(decodeProtectedHeader(token)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decodeJwt(token)).toEqual({
      sub: ALICE,
      exp: Date.parse('2026-01-08T00:00:00Z') / 1000,
    })
  })

  test('are valid until they expire', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z'), toFake: ['Date'] })
    const token = await service.createAccessToken(ALICE)
    vi.setSystemTime(new Date('2026-01-07T23:59:59Z'))
    expect(await service.verify(token)).toBe(ALICE)
    vi.setSystemTime(new Date('2026-01-08T00:00:00Z'))
    expect(await service.verify(token)).toBeNull()
  })
})
