import type { Logger } from './logging.ts'
import type { PostHogClient } from './posthog.ts'

export interface FeatureFlags {
  openDraftProfiles: boolean
}

const DEFAULTS: FeatureFlags = { openDraftProfiles: true }

/** Resolves feature flags from PostHog, falling back to the defaults. */
export class FeatureFlagService {
  readonly #posthog: Pick<PostHogClient, 'getAllFlags'> | null
  readonly #logger: Logger

  constructor(posthog: Pick<PostHogClient, 'getAllFlags'> | null, logger: Logger) {
    this.#posthog = posthog
    this.#logger = logger
  }

  async getFeatureFlags(): Promise<FeatureFlags> {
    const flags = await this.#fetchFlags()
    const openDraftProfiles = flags['open-draft-profiles']
    return {
      openDraftProfiles:
        openDraftProfiles === undefined ? DEFAULTS.openDraftProfiles : Boolean(openDraftProfiles),
    }
  }

  async #fetchFlags(): Promise<Record<string, unknown>> {
    if (this.#posthog === null) return {}
    try {
      return (await this.#posthog.getAllFlags('server')) ?? {}
    } catch (error) {
      this.#logger.error({ error }, 'Failed to fetch feature flags')
      return {}
    }
  }
}
