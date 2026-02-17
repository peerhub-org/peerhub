import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { Link } from 'react-router'
import { Watch } from '@domains/watchlist/application/interfaces/Watch'
import { UI_COPY } from '@shared/application/config/uiCopy'
import { SmallAvatar, WatchListItem } from '../Feed.styled'

interface FeedWatchlistModalProps {
  open: boolean
  watchlist: Watch[]
  onClose: () => void
}

export function FeedWatchlistModal({ open, watchlist, onClose }: FeedWatchlistModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
      >
        <Typography variant='body1' fontWeight={600}>
          {UI_COPY.feedWatchlistTitle}
        </Typography>
        <IconButton size='small' onClick={onClose}>
          <Close fontSize='small' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 1, pb: 2 }}>
        <List disablePadding>
          {watchlist.map((watch) => (
            <WatchListItem
              key={watch.id}
              component={Link}
              to={`/${watch.watched_username}`}
              onClick={onClose}
            >
              <ListItemAvatar sx={{ minWidth: 36 }}>
                <SmallAvatar
                  src={watch.watched_avatar_url || undefined}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {watch.watched_username.charAt(0).toUpperCase()}
                </SmallAvatar>
              </ListItemAvatar>
              <ListItemText
                primary={watch.watched_name || watch.watched_username}
                slotProps={{ primary: { noWrap: true, fontSize: '0.85rem' } }}
              />
            </WatchListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
