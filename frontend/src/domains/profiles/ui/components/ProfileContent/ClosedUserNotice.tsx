import { Box, Typography } from '@mui/material'
import { SentimentVeryDissatisfied } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

export default function ClosedUserNotice() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: theme.palette.text.secondary,
      }}
    >
      <SentimentVeryDissatisfied sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
      <Typography variant='body1' sx={{ textAlign: 'center' }}>
        This user has decided to no longer receive reviews.
      </Typography>
    </Box>
  )
}
