import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@domains/authentication/application/hooks/useAuthentication'
import { Account } from '@domains/account/application/interfaces/Account'
import accountService from '@domains/account/application/services/accountService'
import profileService from '@domains/profiles/application/services/profileService'
import { SecondaryButton, DeleteButton } from '@shared/ui/styled'
import { AccountContainer, ProfileAvatar } from './AccountDetails.styled'

interface AccountDetailsProps {
  account: Account
}

export default function AccountDetails({ account }: AccountDetailsProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    profileService.getUser(account.username).then((user) => {
      setAvatarUrl(user.avatar_url)
    })
  }, [account.username])

  const handleDeleteAccount = () => {
    setOpen(true)
  }

  const handleCancel = () => setOpen(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await accountService.deleteAccount()
      logout()
      navigate('/')
    } finally {
      setDeleting(false)
      setOpen(false)
    }
  }

  return (
    <AccountContainer>
      <ProfileAvatar src={avatarUrl || undefined}>
        {account.username[0].toUpperCase()}
      </ProfileAvatar>
      <Typography variant='h5' component='h1' gutterBottom>
        @{account.username}
      </Typography>

      <Button variant='outlined' sx={{ mt: 3 }} color='error' onClick={handleDeleteAccount}>
        Delete account
      </Button>

      <Dialog
        open={open}
        onClose={handleCancel}
        aria-describedby='alert-account-dialog-description'
        slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
      >
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-account-dialog-description'>
            Are you sure you want to delete your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SecondaryButton onClick={handleCancel} disabled={deleting}>
            Cancel
          </SecondaryButton>
          <DeleteButton
            onClick={handleConfirm}
            variant='contained'
            color='primary'
            disabled={deleting}
            sx={{ minWidth: 90 }}
          >
            {deleting ? <CircularProgress size={24} color='inherit' /> : 'Delete'}
          </DeleteButton>
        </DialogActions>
      </Dialog>
    </AccountContainer>
  )
}
