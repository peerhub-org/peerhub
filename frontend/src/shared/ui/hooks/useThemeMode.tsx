import { createContext, useState, ReactNode, useContext, useMemo } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from '@shared/ui/foundations/theme'

type ThemeMode = 'dark' | 'light'

type ThemeModeContextValue = {
  mode: ThemeMode
  toggleTheme: () => void
}

const STORAGE_KEY = 'theme-mode'

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

const useThemeMode = (): ThemeModeContextValue => {
  const context = useContext(ThemeModeContext)

  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }

  return context
}

export { ThemeModeProvider, useThemeMode }
