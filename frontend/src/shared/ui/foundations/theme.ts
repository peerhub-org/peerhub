import { createTheme, Theme } from '@mui/material/styles'

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

const theme = createTheme({
  shape: {
    borderRadius: 6,
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#191919',
      paper: '#202020',
      highlight: '#303030',
      grey: '#3e3e3e',
    },
    divider: '#2f2f2f',
    error: {
      main: '#d32f2f',
    },
    primary: {
      main: '#2783de',
    },
    success: {
      main: '#388e3c',
    },
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
})

export default theme
