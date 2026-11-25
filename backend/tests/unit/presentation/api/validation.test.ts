import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { RequestValidationError } from '../../../../src/presentation/api/errors.ts'
import { bodyBoolean, queryInt, validate } from '../../../../src/presentation/api/validation.ts'

function issuesOf(schema: z.ZodType, value: unknown, location: 'body' | 'query' = 'body') {
  try {
    validate(schema, value, location)
  } catch (error) {
    if (error instanceof RequestValidationError) return error.issues
    throw error
  }
  return []
}

// Expected values checked against Pydantic
describe('queryInt', () => {
  const schema = z.object({ n: queryInt({ default: 16, min: 0, max: 100 }) })

  test.each([
    [{}, 16],
    [{ n: '0' }, 0],
    [{ n: '100' }, 100],
    [{ n: '+5' }, 5],
    [{ n: ' 5 ' }, 5],
    [{ n: '1_0' }, 10],
    [{ n: '1.0' }, 1],
    [{ n: '-0' }, 0],
  ])('%j is %d', (query, expected) => {
    expect(validate(schema, query, 'query').n + 0).toBe(expected)
  })

  test.each(['', ' ', 'abc', '1.5', '1e1', '0x1', '1__0', '_1', '1_', '--1'])(
    '%j is not an integer',
    (n) => {
      expect(issuesOf(schema, { n }, 'query')).toEqual([
        {
          type: 'int_parsing',
          loc: ['query', 'n'],
          msg: 'Input should be a valid integer, unable to parse string as an integer',
          input: n,
        },
      ])
    },
  )

  test.each([
    ['-1', 'greater_than_equal', 'greater than or equal to 0', { ge: 0 }],
    ['101', 'less_than_equal', 'less than or equal to 100', { le: 100 }],
  ])('%s is out of range', (n, type, msg, ctx) => {
    expect(issuesOf(schema, { n }, 'query')).toEqual([
      { type, loc: ['query', 'n'], msg: `Input should be ${msg}`, input: n, ctx },
    ])
  })
})

describe('bodyBoolean', () => {
  const schema = z.object({ b: bodyBoolean() })

  test.each([true, 1, '1', 'on', 'T', 'true', 'Y', 'YES'])('%j is true', (b) => {
    expect(validate(schema, { b }, 'body')).toEqual({ b: true })
  })

  test.each([false, 0, '0', 'off', 'F', 'false', 'N', 'NO'])('%j is false', (b) => {
    expect(validate(schema, { b }, 'body')).toEqual({ b: false })
  })

  test.each([
    [2, 'bool_parsing'],
    ['x', 'bool_parsing'],
    ['', 'bool_parsing'],
    [' true', 'bool_parsing'],
    [1.5, 'bool_type'],
    [null, 'bool_type'],
    [[], 'bool_type'],
    [{}, 'bool_type'],
  ])('%j is %s', (b, type) => {
    expect(issuesOf(schema, { b })).toMatchObject([{ type, loc: ['body', 'b'], input: b }])
  })

  test('is required', () => {
    expect(issuesOf(schema, {})).toEqual([
      { type: 'missing', loc: ['body', 'b'], msg: 'Field required', input: {} },
    ])
  })
})

test('issues come in the order of the fields', () => {
  const schema = z
    .object({ a: z.string(), b: z.string(), c: z.string() })
    .refine(() => false, { path: ['a'], when: () => true, message: 'late' })
  expect(issuesOf(schema, { a: 'x', c: 1 }).map((issue) => issue.loc[1])).toEqual(['a', 'b', 'c'])
})

test('checks without a Pydantic equivalent are reported too', () => {
  expect(issuesOf(z.object({ a: z.email() }), { a: 'x' })).toEqual([
    { type: 'value_error', loc: ['body', 'a'], msg: 'Invalid email address', input: 'x' },
  ])
})
