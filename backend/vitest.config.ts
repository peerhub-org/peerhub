import { defineConfig } from 'vitest/config'

const env = { ENVIRONMENT: 'test' }

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], env } },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          env,
          // Needs Docker. Fails, instead of skipping, when it is not available.
          globalSetup: ['tests/helpers/mongodb_container.ts'],
        },
      },
    ],
  },
})
