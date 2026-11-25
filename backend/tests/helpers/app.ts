import type { Express } from 'express'
import type { Db } from 'mongodb'
import { inject } from 'vitest'
import type { Email } from '../../src/infrastructure/email/email_service.ts'
import { loadSettings, type Settings } from '../../src/infrastructure/shared/config/config.ts'
import { createApp } from '../../src/presentation/api/app.ts'
import { createContainer, type ContainerOptions } from '../../src/presentation/api/container.ts'
import { createRoutes } from '../../src/presentation/api/routes.ts'
import { memoryLogger } from './logger.ts'
import { ALLOWED_ORIGIN } from './requests.ts'
import { SECRET_KEY } from './tokens.ts'

const testSettings: Settings = loadSettings(
  {
    ENVIRONMENT: 'test',
    PROJECT_NAME: 'peerhub',
    SECRET_KEY,
    BACKEND_CORS_ORIGINS: JSON.stringify([ALLOWED_ORIGIN]),
    GITHUB_CLIENT_ID: 'client-id',
    GITHUB_CLIENT_SECRET: 'client-secret',
    SSO_CALLBACK_HOSTNAME: ALLOWED_ORIGIN,
    MODERATOR_USERNAMES: '["moddy", "modtwo"]',
    RESEND_API_KEY: 're_key',
    SENDER_EMAIL: 'sender@example.test',
    ABUSE_CONTROL_EMAIL: 'abuse@example.test',
  },
  null,
)

export interface TestApp {
  app: Express
  emails: Email[]
  lines: Record<string, unknown>[]
}

/** The whole application over the given database, with emails kept in memory. */
export function createTestApp(
  db: Db,
  overrides: ContainerOptions['overrides'] = {},
  changes: Partial<Settings> = {},
): TestApp {
  const { logger, lines } = memoryLogger()
  const settings = { ...testSettings, MONGO_URI: inject('mongoUri'), ...changes }
  const emails: Email[] = []
  const container = createContainer({
    settings,
    db,
    logger,
    posthog: null,
    overrides: { sendEmail: async (email) => void emails.push(email), ...overrides },
  })
  const app = createApp({ settings, logger, routes: createRoutes(container) })
  return { app, emails, lines }
}
