import '@shared/application/api/client/apiClient'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from '@shared/ui/routes/router'
import { SnackBarProvider } from '@shared/ui/hooks/useSnackbar.tsx'
import { ThemeModeProvider } from '@shared/ui/hooks/useThemeMode.tsx'
import { AuthProvider } from '@domains/authentication/application/hooks/useAuthentication.tsx'
import { POSTHOG_KEY, POSTHOG_HOST } from '@shared/application/config/env'
import { queryClient } from '@shared/application/queryClient'
import ErrorBoundary from '@shared/ui/components/ErrorBoundary/ErrorBoundary'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_exceptions: true,
  })
  posthog.register({ environment: import.meta.env.MODE })
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <ThemeModeProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AuthProvider>
              <SnackBarProvider>
                <RouterProvider router={router} />
              </SnackBarProvider>
            </AuthProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </ThemeModeProvider>
    </PostHogProvider>
  </React.StrictMode>,
)
