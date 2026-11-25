import { expect, test } from 'vitest'
import { FeatureFlagService } from '../../../../../src/infrastructure/shared/observability/feature_flags.ts'
import { memoryLogger } from '../../../../helpers/logger.ts'

const { logger, lines } = memoryLogger()

test.each([
  [{}, true],
  [{ 'another-flag': false }, true],
  [{ 'open-draft-profiles': true }, true],
  [{ 'open-draft-profiles': false }, false],
  [{ 'open-draft-profiles': 'variant' }, true],
])('%j', async (flags, openDraftProfiles) => {
  const posthog = { getAllFlags: async () => flags }
  expect(await new FeatureFlagService(posthog, logger).getFeatureFlags()).toEqual({
    openDraftProfiles,
  })
})

test('defaults without PostHog', async () => {
  expect(await new FeatureFlagService(null, logger).getFeatureFlags()).toEqual({
    openDraftProfiles: true,
  })
})

test('defaults when PostHog fails', async () => {
  const posthog = { getAllFlags: () => Promise.reject(new Error('down')) }
  expect(await new FeatureFlagService(posthog, logger).getFeatureFlags()).toEqual({
    openDraftProfiles: true,
  })
  expect(lines).toContainEqual(
    expect.objectContaining({ level: 'ERROR', message: 'Failed to fetch feature flags' }),
  )
})
