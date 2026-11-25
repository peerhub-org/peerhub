import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  loadSettings,
  resolveEnvFile,
} from '../../../../../src/infrastructure/shared/config/config.ts'

const load = (env: Record<string, string> = {}) => loadSettings(env, null)

describe('loadSettings', () => {
  test('uses the defaults', () => {
    const { SECRET_KEY, ...settings } = load()
    expect(SECRET_KEY).toHaveLength(43)
    expect(settings).toEqual({
      API_V1_STR: '/api/v1',
      ENVIRONMENT: 'development',
      ACCESS_TOKEN_EXPIRE_MINUTES: 10080,
      PORT: 8000,
      CLIENT_IP_HEADER: null,
      BACKEND_CORS_ORIGINS: [],
      PROJECT_NAME: 'PeerHub',
      MONGO_URI: 'mongodb://localhost:27017',
      MONGO_DB: 'peerhub',
      GITHUB_CLIENT_ID: null,
      GITHUB_CLIENT_SECRET: null,
      SSO_CALLBACK_HOSTNAME: null,
      MODERATOR_USERNAMES: new Set(),
      POSTHOG_HOST: 'https://us.i.posthog.com',
      POSTHOG_API_KEY: null,
      RESEND_API_KEY: null,
      SENDER_EMAIL: null,
      ABUSE_CONTROL_EMAIL: null,
    })
  })

  test('generates a new secret key on each load', () => {
    expect(load().SECRET_KEY).not.toBe(load().SECRET_KEY)
  })

  test('parses lists and numbers', () => {
    const settings = load({
      BACKEND_CORS_ORIGINS: '["http://localhost:5173", "https://PeerHub.dev/"]',
      MODERATOR_USERNAMES: '["alice", "bob", "alice"]',
      ACCESS_TOKEN_EXPIRE_MINUTES: '30',
    })
    expect(settings.BACKEND_CORS_ORIGINS).toEqual(['http://localhost:5173', 'https://peerhub.dev'])
    expect(settings.MODERATOR_USERNAMES).toEqual(new Set(['alice', 'bob']))
    expect(settings.ACCESS_TOKEN_EXPIRE_MINUTES).toBe(30)
  })

  test('treats empty values as absent and ignores unknown ones', () => {
    const settings = load({ MONGO_DB: '', BACKEND_CORS_ORIGINS: '', ALLOWED_USERNAMES: '[]' })
    expect(settings.MONGO_DB).toBe('peerhub')
    expect(settings.BACKEND_CORS_ORIGINS).toEqual([])
    expect(settings).not.toHaveProperty('ALLOWED_USERNAMES')
  })

  test('reads port and client address header', () => {
    expect(load({ PORT: '10000', CLIENT_IP_HEADER: 'CF-Connecting-IP' })).toMatchObject({
      PORT: 10000,
      CLIENT_IP_HEADER: 'cf-connecting-ip',
    })
  })

  test('accepts names in any case', () => {
    expect(load({ mongo_db: 'other' }).MONGO_DB).toBe('other')
  })

  test.each([
    ['ENVIRONMENT', 'staging'],
    ['ACCESS_TOKEN_EXPIRE_MINUTES', 'soon'],
    ['PORT', 'http'],
    ['PORT', '70000'],
    ['CLIENT_IP_HEADER', 'not a header'],
    ['BACKEND_CORS_ORIGINS', 'http://localhost'],
    ['BACKEND_CORS_ORIGINS', '["ftp://localhost"]'],
    ['MODERATOR_USERNAMES', '"alice"'],
  ])('rejects %s=%s without printing the value', (name, value) => {
    expect(() => load({ [name]: value })).toThrow(name)
    expect(() => load({ [name]: value })).not.toThrow(value)
  })

  test('requires an explicit secret key in production', () => {
    expect(() => load({ ENVIRONMENT: 'production' })).toThrow('SECRET_KEY must be explicitly set')
    expect(load({ ENVIRONMENT: 'production', SECRET_KEY: 'x'.repeat(64) }).SECRET_KEY).toHaveLength(
      64,
    )
  })
})

describe('env file', () => {
  let dir: string
  beforeEach(() => void (dir = mkdtempSync(join(tmpdir(), 'peerhub-'))))
  afterEach(() => rmSync(dir, { recursive: true }))

  test('is overridden by non-empty environment variables', () => {
    const file = join(dir, '.env')
    writeFileSync(file, 'MONGO_DB=file\nPROJECT_NAME=file\nSECRET_KEY=a#b\n')
    const settings = loadSettings({ MONGO_DB: 'env', PROJECT_NAME: '' }, file)
    expect(settings).toMatchObject({ MONGO_DB: 'env', PROJECT_NAME: 'file', SECRET_KEY: 'a#b' })
  })

  test('may be missing', () => {
    expect(loadSettings({}, join(dir, 'missing')).MONGO_DB).toBe('peerhub')
  })

  test.each([
    [undefined, '.env.development'],
    ['development', '.env.development'],
    ['PRODUCTION', '.env.production'],
    ['test', '.env.development'],
  ])('for ENVIRONMENT=%s is %s', (environment, name) => {
    const env = environment === undefined ? {} : { ENVIRONMENT: environment }
    expect(resolveEnvFile(env)).toBe(resolve(import.meta.dirname, '../../../../..', name))
  })
})
