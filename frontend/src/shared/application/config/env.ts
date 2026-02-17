export const API_BASE_URL: string = import.meta.env.VITE_BACKEND_API_URL || '/api/v1/'
export const PWD_SIGNUP_ENABLED: boolean = import.meta.env.VITE_PWD_SIGNUP_ENABLED === 'true'
export const POSTHOG_KEY: string = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || ''
export const POSTHOG_HOST: string = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || ''

if (!import.meta.env.VITE_BACKEND_API_URL) {
  console.warn('[env] VITE_BACKEND_API_URL is not set, falling back to /api/v1/')
}
