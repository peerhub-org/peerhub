import { ReactElement } from 'react'
import { act, render, RenderOptions } from '@testing-library/react'
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
}: {
  children: React.ReactNode
  initialEntries?: string[]
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeModeProvider>
        <SnackBarProvider>
          <AuthProvider>{children}</AuthProvider>
        </SnackBarProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  )
}

async function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { initialEntries, ...renderOptions } = options ?? {}
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(ui, {
      wrapper: ({ children }) => (
        <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
      ),
      ...renderOptions,
    })
  })
  return result
}

export { customRender as render }
