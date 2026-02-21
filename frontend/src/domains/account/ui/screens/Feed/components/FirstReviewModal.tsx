import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { Link } from 'react-router'
import { ReviewSuggestion } from '@domains/reviews/application/interfaces/Review'
import { UI_COPY } from '@shared/application/config/uiCopy'
import { SmallAvatar } from '../Feed.styled'

interface FirstReviewModalProps {
  open: boolean
  suggestions: ReviewSuggestion[]
  loading: boolean
  onClose: () => void
}

export function FirstReviewModal({ open, suggestions, loading, onClose }: FirstReviewModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}
      >
        <Box>
          <Typography variant='body1' fontWeight={600}>
            {UI_COPY.feedFirstReviewModalTitle}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {UI_COPY.feedFirstReviewModalSubtitle}
          </Typography>
        </Box>
        <IconButton size='small' onClick={onClose} sx={{ alignSelf: 'flex-start' }}>
          <Close fontSize='small' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 9, mb: 3, mt: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            columnGap: 0,
            rowGap: 1.5,
            mt: 1,
          }}
        >
          {loading
            ? Array.from({ length: 16 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Skeleton variant='circular' width={24} height={24} />
                  <Skeleton variant='text' width={80} />
                </Box>
              ))
            : suggestions.map((suggestion) => (
                <Box
                  key={suggestion.username}
                  component={Link}
                  to={`/${suggestion.username}`}
                  onClick={onClose}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    px: 0.5,
                    borderRadius: 1,
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <SmallAvatar
                    src={suggestion.avatar_url || undefined}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {suggestion.username.charAt(0).toUpperCase()}
                  </SmallAvatar>
                  <Typography variant='body2' noWrap>
                    {suggestion.username}
                  </Typography>
                </Box>
              ))}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
