import { Box, List, Paper, TextField, Typography, styled } from '@mui/material'

const RESULT_HEIGHT = 41
const VISIBLE_RESULTS = 5

export const SearchContainer = styled(Box)({
  position: 'relative',
})

export const SearchTrigger = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  height: 32,
  width: 200,
  '&:hover': {
    borderColor: theme.palette.text.disabled,
  },
  [theme.breakpoints.down('sm')]: {
    width: 32,
    padding: '4px',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    '& .MuiSvgIcon-root': {
      fontSize: 22,
    },
  },
}))

export const SearchTriggerText = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  color: theme.palette.text.secondary,
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}))

export const SearchCard = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: -1,
  right: 0,
  width: 320,
  [theme.breakpoints.down('sm')]: {
    position: 'fixed',
    top: 8,
    left: 16,
    right: 16,
    width: 'auto',
  },
  backgroundColor: theme.palette.background.paper,
  backgroundImage: 'none',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  overflow: 'hidden',
  zIndex: theme.zIndex.modal,
}))

export const SearchInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0,
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputBase-input': {
    padding: '10px 12px',
    fontSize: '0.875rem',
  },
}))

export const ResultsArea = styled(Box)(({ theme }) => ({
  height: RESULT_HEIGHT * VISIBLE_RESULTS,
  overflowY: 'auto',
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}))

export const ResultsList = styled(List)({
  padding: '4px',
})

export const StatusText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  textAlign: 'center',
  padding: '12px 16px',
}))
