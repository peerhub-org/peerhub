/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        // Without this, Rolldown places its runtime helpers inside an app chunk
        // (authenticationService) that the axios vendor chunk imports from,
        // while that app chunk imports axios back. The circular import makes
        // axios evaluate before the helpers exist and the app crashes on load
        // ("e is not a function"). This option emits a dedicated runtime chunk
        // and keeps module execution order intact across chunks.
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router)[\\/]/,
            },
            {
              name: 'mui',
              test: /node_modules[\\/](@mui[\\/](material|icons-material)|@emotion[\\/](react|styled))[\\/]/,
            },
            { name: 'tanstack', test: /node_modules[\\/]@tanstack[\\/]/ },
            {
              name: 'posthog',
              test: /node_modules[\\/](posthog-js|@posthog)[\\/]/,
            },
            { name: 'axios', test: /node_modules[\\/]axios[\\/]/ },
            { name: 'zod', test: /node_modules[\\/]zod[\\/]/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@domains': '/src/domains',
      '@shared': '/src/shared',
      '@assets': '/src/assets',
      '@test': '/src/test',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_BACKEND_API_URL: '/api/v1/',
    },
  },
})
