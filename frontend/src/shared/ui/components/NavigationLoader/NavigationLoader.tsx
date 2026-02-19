import { Box } from '@mui/material'
import { Outlet, useNavigation } from 'react-router'
import FullScreenLoader from '@shared/ui/components/FullScreenLoader/FullScreenLoader'

export default function NavigationLoader() {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  return (
    <>
      {isLoading && <FullScreenLoader />}
      <Box sx={{ visibility: isLoading ? 'hidden' : 'visible' }}>
        <Outlet />
      </Box>
    </>
  )
}
