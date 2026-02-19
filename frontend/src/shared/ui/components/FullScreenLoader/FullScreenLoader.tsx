import { CircularProgress } from '@mui/material'
import { LoaderContainer } from './FullScreenLoader.styled'

export default function FullScreenLoader() {
  return (
    <LoaderContainer role='status' aria-label='Loading'>
      <CircularProgress sx={{ color: 'grey.500' }} />
    </LoaderContainer>
  )
}
