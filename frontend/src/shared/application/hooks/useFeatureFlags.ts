import { useFeatureFlagEnabled } from 'posthog-js/react'

const FEATURE_FLAG_DEFAULTS = {
  'open-draft-profiles': false,
} as const satisfies Record<string, boolean>

type FeatureFlagKey = keyof typeof FEATURE_FLAG_DEFAULTS

function useFlag(key: FeatureFlagKey): boolean {
  return useFeatureFlagEnabled(key) ?? FEATURE_FLAG_DEFAULTS[key]
}

export function useFeatureFlags() {
  return {
    openDraftProfiles: useFlag('open-draft-profiles'),
  }
}
