import { createTheme, Theme, ThemeOptions } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface TypeBackground {
    highlight: string
    grey: string
  }
}

export const getMenuSlotProps = (theme: Theme) => ({
  paper: {
    sx: {
      backgroundColor: theme.palette.background.paper,
      backgroundImage: 'none',
      border: `1px solid ${theme.palette.divider}`,
      minWidth: 140,
      '& .MuiList-root': {
        padding: '4px',
      },
      '& .MuiMenuItem-root': {
        fontSize: '0.75rem',
        padding: '8px',
        borderRadius: 1,
        justifyContent: 'flex-start',
        '& .MuiListItemIcon-root': {
          minWidth: 24,
        },
      },
    },
  },
})

const darkPalette: ThemeOptions['palette'] = {
  mode: 'dark',
  background: {
    default: 'rgb(25, 25, 25)',
    paper: 'rgb(32, 32, 32)',
    highlight: 'rgb(48, 48, 48)',
    grey: 'rgb(62, 62, 62)',
  },
  divider: 'rgb(47, 47, 47)',
  error: { main: '#d32f2f' },
  primary: { main: '#2783de' },
  success: { main: '#388e3c' },
}

const lightPalette: ThemeOptions['palette'] = {
  mode: 'light',
  background: {
    default: 'rgb(255, 255, 255)',
    paper: 'rgb(248, 248, 248)',
    highlight: 'rgb(232, 232, 232)',
    grey: 'rgb(218, 218, 218)',
  },
  divider: 'rgb(234, 234, 234)',
}

const baseThemeOptions: Omit<ThemeOptions, 'palette'> = {
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          userSelect: 'none',
        },
        'input, textarea, [contenteditable="true"], pre, code': {
          userSelect: 'text',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          textTransform: 'none',
          color: t.palette.text.primary,
          '&.Mui-selected': {
            color: t.palette.text.primary,
          },
          '&:focus-visible': {
            outline: `2px solid ${t.palette.primary.main}`,
            outlineOffset: -2,
          },
        }),
      },
    },
  },
}

export function createAppTheme(mode: 'dark' | 'light') {
  return createTheme({
    ...baseThemeOptions,
    palette: mode === 'dark' ? darkPalette : lightPalette,
  })
}
