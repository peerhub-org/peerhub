import { Box, CircularProgress, styled } from '@mui/material'
import { Outlet, useNavigation } from 'react-router'

const LoaderContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: theme.zIndex.modal + 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

export default function NavigationLoader() {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  return (
    <>
      {isLoading && (
        <LoaderContainer role='status' aria-label='Loading'>
          <CircularProgress sx={{ color: 'grey.500' }} />
        </LoaderContainer>
      )}
      <Box sx={{ visibility: isLoading ? 'hidden' : 'visible' }}>
        <Outlet />
      </Box>
    </>
  )
}
