import { readFileSync } from 'node:fs'
import { decodeJwt, decodeProtectedHeader } from 'jose'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { TokenService } from '../../../../../src/infrastructure/shared/security/token_service.ts'

const contract = JSON.parse(
  readFileSync(new URL('../../../../../contract/reference/tokens.json', import.meta.url), 'utf8'),
) as { secret_key: string; tokens: Record<string, string> }

const service = new TokenService({
  SECRET_KEY: contract.secret_key,
  ACCESS_TOKEN_EXPIRE_MINUTES: 10080,
})
const ALICE = 'a0000000-0000-4000-8000-000000000001'

afterEach(() => void vi.useRealTimers())

describe('tokens issued by the Python backend', () => {
  test.each(['alice', 'no_exp', 'sub_uppercase', 'sub_no_dashes'])('%s is valid', async (name) => {
    expect(await service.verify(contract.tokens[name]!)).toBe(ALICE)
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
    expect(contract.tokens[name]).toBeDefined()
    expect(await service.verify(contract.tokens[name]!)).toBeNull()
  })
})

test.each(['', 'not-a-jwt', 'a.b.c', 'a.b'])('%j is not valid', async (token) => {
  expect(await service.verify(token)).toBeNull()
})

describe('issued tokens', () => {
  test('have the format of the Python backend', async () => {
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
