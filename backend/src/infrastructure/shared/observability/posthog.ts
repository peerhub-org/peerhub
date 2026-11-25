import { PostHog } from 'posthog-node'
import type { Settings } from '../config/config.ts'
import type { Logger } from './logging.ts'

/** What the application uses from PostHog. */
export type PostHogClient = Pick<PostHog, 'captureException' | 'getAllFlags' | 'shutdown'>

/** Create the PostHog client, or null when it is not configured. */
export function createPostHog(
  settings: Pick<Settings, 'ENVIRONMENT' | 'POSTHOG_API_KEY' | 'POSTHOG_HOST'>,
  logger: Logger,
): PostHogClient | null {
  if (settings.ENVIRONMENT === 'test' || !settings.POSTHOG_API_KEY) return null
  const client = new PostHog(settings.POSTHOG_API_KEY, {
    host: settings.POSTHOG_HOST,
    enableExceptionAutocapture: true,
  })
  logger.info('PostHog exception autocapture initialized')
  return client
}
