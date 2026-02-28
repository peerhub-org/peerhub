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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router/')
          ) {
            return 'react'
          }

          if (
            id.includes('/@mui/material/') ||
            id.includes('/@mui/icons-material/') ||
            id.includes('/@emotion/react/') ||
            id.includes('/@emotion/styled/')
          ) {
            return 'mui'
          }

          if (id.includes('/@tanstack/')) {
            return 'tanstack'
          }

          if (id.includes('/posthog-js/') || id.includes('/@posthog/')) {
            return 'posthog'
          }

          if (id.includes('/axios/')) {
            return 'axios'
          }

          if (id.includes('/zod/')) {
            return 'zod'
          }
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
