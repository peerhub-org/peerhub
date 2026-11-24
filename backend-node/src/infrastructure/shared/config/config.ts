import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { parseDotenv } from './dotenv.ts'

// Same depth from src/ and from dist/
const BACKEND_DIR = new URL('../../../../', import.meta.url)
const ENV_FILE_BY_ENV: Record<string, string> = {
  development: '.env.development',
  production: '.env.production',
}

const DEFAULT_SECRET_KEY_LENGTH = 43 // length of randomBytes(32) in base64url

const json = <T extends z.ZodType>(schema: T) =>
  z
    .string()
    .transform((value, ctx): unknown => {
      try {
        return JSON.parse(value)
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Expected a JSON value' })
        return z.NEVER
      }
    })
    .pipe(schema)

const origin = z.url({ protocol: /^https?$/ }).transform((value) => {
  return new URL(value).href.replace(/\/+$/, '')
})

const settingsSchema = z
  .object({
    API_V1_STR: z.string().default('/api/v1'),
    SECRET_KEY: z.string().default(() => randomBytes(32).toString('base64url')),
    ENVIRONMENT: z.enum(['test', 'development', 'production']).default('development'),
    // 60 minutes * 24 hours * 7 days = 7 days
    ACCESS_TOKEN_EXPIRE_MINUTES: z
      .string()
      .trim()
      .regex(/^[+-]?\d+$/, 'Expected an integer')
      .transform(Number)
      .default(60 * 24 * 7),
    BACKEND_CORS_ORIGINS: json(z.array(origin)).default([]),
    PROJECT_NAME: z.string().default('PeerHub'),
    MONGO_URI: z.string().default('mongodb://localhost:27017'),
    MONGO_DB: z.string().default('peerhub'),
    GITHUB_CLIENT_ID: z.string().nullable().default(null),
    GITHUB_CLIENT_SECRET: z.string().nullable().default(null),
    SSO_CALLBACK_HOSTNAME: z.string().nullable().default(null),
    MODERATOR_USERNAMES: json(z.array(z.string()))
      .default([])
      .transform((names): ReadonlySet<string> => new Set(names)),
    POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),
    POSTHOG_API_KEY: z.string().nullable().default(null),
    RESEND_API_KEY: z.string().nullable().default(null),
    SENDER_EMAIL: z.string().nullable().default(null),
    ABUSE_CONTROL_EMAIL: z.string().nullable().default(null),
  })
  .refine(
    (s) => s.ENVIRONMENT !== 'production' || [...s.SECRET_KEY].length !== DEFAULT_SECRET_KEY_LENGTH,
    {
      path: ['SECRET_KEY'],
      message:
        'SECRET_KEY must be explicitly set in production to prevent token invalidation on restart',
    },
  )

export type Settings = Readonly<z.output<typeof settingsSchema>>

type Env = Record<string, string | undefined>

export function resolveEnvFile(env: Env): string {
  const environment = (env.ENVIRONMENT ?? 'development').toLowerCase()
  const name = ENV_FILE_BY_ENV[environment] ?? '.env.development'
  return fileURLToPath(new URL(name, BACKEND_DIR))
}

/** Variable names are case-insensitive and empty values count as absent. */
function present(env: Env): Record<string, string> {
  const entries = Object.entries(env).filter((e): e is [string, string] => !!e[1])
  return Object.fromEntries(entries.map(([key, value]) => [key.toUpperCase(), value]))
}

/** Read settings from the environment, falling back to the env file (null = no file). */
export function loadSettings(
  env: Env = process.env,
  envFile: string | null = resolveEnvFile(env),
): Settings {
  const fileValues =
    envFile !== null && existsSync(envFile) ? parseDotenv(readFileSync(envFile, 'utf8')) : {}
  const result = settingsSchema.safeParse({ ...present(fileValues), ...present(env) })
  if (!result.success) {
    // Only names and reasons: values may be secrets.
    const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid configuration:\n  ${problems.join('\n  ')}`)
  }
  return result.data
}
