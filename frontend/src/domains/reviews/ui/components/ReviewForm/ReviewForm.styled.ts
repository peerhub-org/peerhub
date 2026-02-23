import { Box, Button, Radio, TextField, styled } from '@mui/material'
import { isLight } from '@shared/ui/foundations/theme'

export const FormContainer = styled(Box)<{ component?: React.ElementType }>(({ theme }) => ({
  width: 640,
  maxWidth: 'calc(100vw - 32px)',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}))

export const FormHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

export const FormContent = styled(Box)({
  padding: 16,
})

export const FormFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderTop: `1px solid ${theme.palette.divider}`,
}))

export const CommentTextField = styled(TextField)(({ theme }) => ({
  marginBottom: 16,
  '& .MuiOutlinedInput-root': {
    backgroundColor: isLight(theme)
      ? theme.palette.background.default
      : theme.palette.background.highlight,
  },
  '& .MuiInputBase-input': {
    fontSize: '0.875rem',
  },
}))

export const StatusRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.divider,
  '&.Mui-checked': {
    color: theme.palette.primary.main,
  },
  padding: 4,
}))

export const AnonymousSection = styled(Box)(({ theme }) => ({
  marginTop: 16,
  paddingTop: 16,
  borderTop: `1px solid ${theme.palette.divider}`,
}))

export const CancelButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  fontWeight: 600,
  fontSize: '0.75rem',
  padding: '3px 12px',
  minHeight: 'unset',
  lineHeight: 2,
}))

export const SubmitButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.success.main),
  backgroundColor: theme.palette.success.main,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: theme.palette.success.light,
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    backgroundColor: theme.palette.success.dark,
    opacity: 0.5,
  },
  fontWeight: 600,
  fontSize: '0.75rem',
  padding: '3px 12px',
  minHeight: 'unset',
  lineHeight: 2,
}))

export const OptionLabelBox = styled(Box)({
  marginLeft: 4,
})

export const ButtonGroup = styled(Box)({
  display: 'flex',
  gap: 8,
})

export const AnonymousLabelWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})
