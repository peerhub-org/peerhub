import { Divider, Typography } from '@mui/material'
import { UI_COPY } from '@shared/application/config/uiCopy'

export default function EndOfList() {
  return (
    <Divider sx={{ my: 3 }}>
      <Typography variant='caption' color='text.secondary'>
        {UI_COPY.endOfList}
      </Typography>
    </Divider>
  )
}
