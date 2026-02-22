import { ReactElement } from 'react'
import { act, render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { SnackBarProvider } from '@shared/ui/hooks/useSnackbar'
import { ThemeModeProvider } from '@shared/ui/hooks/useThemeMode'
import { AuthProvider } from '@domains/authentication/application/hooks/useAuthentication'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

function AllProviders({
  children,
  initialEntries = ['/'],
  queryClient,
}: {
  children: React.ReactNode
  initialEntries?: string[]
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeModeProvider>
          <SnackBarProvider>
            <AuthProvider>{children}</AuthProvider>
          </SnackBarProvider>
        </ThemeModeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { initialEntries, ...renderOptions } = options ?? {}
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(ui, {
      wrapper: ({ children }) => (
        <AllProviders initialEntries={initialEntries} queryClient={queryClient}>
          {children}
        </AllProviders>
      ),
      ...renderOptions,
    })
  })
  return result
}

export { customRender as render }
