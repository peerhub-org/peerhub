import { z } from 'zod'
import { RequestValidationError, type ValidationIssue } from './errors.ts'

type Location = 'body' | 'query'

/** Validate part of a request. Zod issues are translated to the format of Pydantic. */
export function validate<T extends z.ZodType>(
  schema: T,
  value: unknown,
  location: Location,
): z.output<T> {
  if (value === null)
    throw new RequestValidationError([
      { type: 'missing', loc: [location], msg: 'Field required', input: null },
    ])
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw new RequestValidationError(
    inFieldOrder(schema, result.error.issues).map((issue) => toIssue(issue, value, location)),
  )
}

/** Refinements run last, but their issues belong with the field they are about. */
function inFieldOrder(schema: z.ZodType, issues: z.core.$ZodIssue[]): z.core.$ZodIssue[] {
  const fields = schema instanceof z.ZodObject ? Object.keys(schema.shape) : []
  return issues.toSorted(
    (a, b) => fields.indexOf(String(a.path[0])) - fields.indexOf(String(b.path[0])),
  )
}

/** Issue of a custom check, already described in the terms of Pydantic. */
export interface PydanticParams {
  type: string
  ctx?: Record<string, unknown>
}

function toIssue(issue: z.core.$ZodIssue, root: unknown, location: Location): ValidationIssue {
  const loc = [location, ...issue.path.map((key) => (typeof key === 'symbol' ? '' : key))]
  const input = valueAt(root, issue.path)
  const parent = valueAt(root, issue.path.slice(0, -1))

  if (input === undefined && issue.path.length > 0)
    return {
      type: 'missing',
      loc,
      msg: 'Field required',
      input: location === 'query' ? null : parent,
    }
  const described = describe(issue, location)
  return { type: described.type, loc, msg: described.msg, input, ...described.extra }
}

const TYPES: Record<string, [type: string, msg: string]> = {
  string: ['string_type', 'Input should be a valid string'],
  boolean: ['bool_type', 'Input should be a valid boolean'],
  object: [
    'model_attributes_type',
    'Input should be a valid dictionary or object to extract fields from',
  ],
}

function describe(
  issue: z.core.$ZodIssue,
  location: Location,
): { type: string; msg: string; extra?: { ctx: Record<string, unknown> } } {
  switch (issue.code) {
    case 'invalid_type': {
      const known = TYPES[issue.expected]
      if (known) return { type: known[0], msg: known[1] }
      break
    }
    case 'invalid_value': {
      const expected = listOf(issue.values.map((value) => `'${String(value)}'`))
      return {
        type: location === 'query' ? 'literal_error' : 'enum',
        msg: `Input should be ${expected}`,
        extra: { ctx: { expected } },
      }
    }
    case 'too_small':
      return {
        type: 'greater_than_equal',
        msg: `Input should be greater than or equal to ${issue.minimum}`,
        extra: { ctx: { ge: issue.minimum } },
      }
    case 'too_big':
      return {
        type: 'less_than_equal',
        msg: `Input should be less than or equal to ${issue.maximum}`,
        extra: { ctx: { le: issue.maximum } },
      }
    case 'custom': {
      const params = issue.params as PydanticParams | undefined
      if (params) {
        const extra = params.ctx && { ctx: params.ctx }
        return { type: params.type, msg: issue.message, ...(extra && { extra }) }
      }
    }
  }
  return { type: 'value_error', msg: issue.message }
}

function listOf(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`
}

function valueAt(root: unknown, path: PropertyKey[]): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      typeof value === 'object' && value !== null
        ? (value as Record<PropertyKey, unknown>)[key]
        : undefined,
    root,
  )
}

/** Integer in a query string, with the spellings Pydantic accepts ("1", "+1", "1_0", "1.0"). */
export function queryInt(options: { default: number; min: number; max?: number }) {
  let range = z.number().min(options.min)
  if (options.max !== undefined) range = range.max(options.max)
  return z
    .string()
    .transform((text, ctx) => {
      if (/^\s*[+-]?\d+(_\d+)*(\.0+)?\s*$/.test(text)) return Number(text.replaceAll('_', ''))
      ctx.addIssue({
        code: 'custom',
        message: 'Input should be a valid integer, unable to parse string as an integer',
        params: { type: 'int_parsing' } satisfies PydanticParams,
      })
      return z.NEVER
    })
    .pipe(range)
    .default(options.default)
    .meta({
      type: 'integer',
      minimum: options.min,
      ...(options.max !== undefined && { maximum: options.max }),
    })
}

const TRUE = new Set<unknown>([true, 1, '1', 'on', 't', 'true', 'y', 'yes'])
const FALSE = new Set<unknown>([false, 0, '0', 'off', 'f', 'false', 'n', 'no'])

/** Boolean in a JSON body, with the spellings Pydantic accepts (true, 1, "yes"...). */
export function bodyBoolean() {
  return z.unknown().transform(toBoolean)
}

function toBoolean(value: unknown, ctx: z.RefinementCtx): boolean {
  const spelling = typeof value === 'string' ? value.toLowerCase() : value
  if (TRUE.has(spelling)) return true
  if (FALSE.has(spelling)) return false
  const parsable = typeof value === 'string' || Number.isInteger(value)
  ctx.addIssue(
    value === undefined
      ? { code: 'invalid_type', expected: 'boolean' }
      : {
          code: 'custom',
          message: parsable
            ? 'Input should be a valid boolean, unable to interpret input'
            : 'Input should be a valid boolean',
          params: { type: parsable ? 'bool_parsing' : 'bool_type' } satisfies PydanticParams,
        },
  )
  return z.NEVER
}

/** Limit the length in Unicode code points, as Python counts them. */
export function maxCodePoints(max: number) {
  return (value: string, ctx: z.RefinementCtx): void => {
    if ([...value].length > max)
      ctx.addIssue({
        code: 'custom',
        message: `String should have at most ${max} characters`,
        params: { type: 'string_too_long', ctx: { max_length: max } } satisfies PydanticParams,
      })
  }
}
