import { Theme } from '@mui/material'

const baseStyles = {
  color: 'text.primary',
  fontSize: '0.75rem',
  lineHeight: 1,
  minHeight: 32,
  boxShadow: 'none',
  '& .MuiButton-startIcon': {
    marginRight: '6px',
    marginTop: '-1px',
    '& > *:nth-of-type(1)': {
      fontSize: 16,
    },
  },
}

export const getWatchedStyles = (theme: Theme) => ({
  ...baseStyles,
  bgcolor: theme.palette.background.default,
  borderColor: theme.palette.divider,
  '&:hover': {
    bgcolor: theme.palette.action.hover,
    boxShadow: 'none',
  },
})

export const getUnwatchedStyles = (theme: Theme) => ({
  ...baseStyles,
  bgcolor: theme.palette.background.highlight,
  '&:hover': {
    bgcolor: theme.palette.background.grey,
    boxShadow: 'none',
  },
})
