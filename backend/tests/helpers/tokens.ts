import { SignJWT, UnsecuredJWT } from 'jose'

export const SECRET_KEY = 'test-secret-key-that-is-long-enough-for-hs512-signatures-0000000000000'

const FAR_FUTURE = new Date('2099-01-01T00:00:00Z')
const LONG_AGO = new Date('2020-01-01T00:00:00Z')
export const ALICE = 'a0000000-0000-4000-8000-000000000001'

/** Accounts of tests/fixtures/database.json */
const ACCOUNTS = ['alice', 'bob', 'carol', 'moddy', 'modtwo', 'ghost', 'notoken', 'legacy']

const sign = (claims: Record<string, unknown>, key = SECRET_KEY, alg = 'HS256') =>
  new SignJWT(claims).setProtectedHeader({ alg, typ: 'JWT' }).sign(new TextEncoder().encode(key))

const exp = FAR_FUTURE.getTime() / 1000

/** Tokens by name: one for each account, and malformed ones. */
export const tokens: Record<string, string> = {
  ...Object.fromEntries(
    await Promise.all(
      ACCOUNTS.map(async (name, i) => {
        const sub = `a0000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`
        return [name, await sign({ sub, exp })] as const
      }),
    ),
  ),
  unknown: await sign({ sub: 'a0000000-0000-4000-8000-000000000999', exp }),
  expired: await sign({ sub: ALICE, exp: LONG_AGO.getTime() / 1000 }),
  wrong_key: await sign({ sub: ALICE, exp }, `another-${SECRET_KEY}`),
  alg_none: new UnsecuredJWT({ sub: ALICE, exp }).encode(),
  alg_hs512: await sign({ sub: ALICE, exp }, SECRET_KEY, 'HS512'),
  no_sub: await sign({ exp }),
  sub_not_uuid: await sign({ sub: 'nope', exp }),
  future_nbf: await sign({ sub: ALICE, exp, nbf: exp }),
  no_exp: await sign({ sub: ALICE }),
  sub_uppercase: await sign({ sub: ALICE.toUpperCase(), exp }),
  sub_no_dashes: await sign({ sub: ALICE.replaceAll('-', ''), exp }),
}
