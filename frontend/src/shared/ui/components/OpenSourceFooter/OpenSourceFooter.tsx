import { Typography, type SxProps, type Theme } from '@mui/material'
import { GITHUB_REPO_URL } from '@shared/application/config/appConstants'
import {
  OPEN_SOURCE_FOOTER_LINK_TEXT,
  OPEN_SOURCE_FOOTER_PREFIX,
  OPEN_SOURCE_FOOTER_SUFFIX,
} from '@shared/application/config/uiCopy'

interface OpenSourceFooterProps {
  variant?: 'body2' | 'caption'
  sx?: SxProps<Theme>
}

export default function OpenSourceFooter({ variant = 'body2', sx }: OpenSourceFooterProps) {
  return (
    <Typography variant={variant} color='text.secondary' sx={sx}>
      {OPEN_SOURCE_FOOTER_PREFIX}
      <a
        href={GITHUB_REPO_URL}
        target='_blank'
        rel='noopener noreferrer'
        style={{ color: 'inherit' }}
      >
        {OPEN_SOURCE_FOOTER_LINK_TEXT}
      </a>
      {OPEN_SOURCE_FOOTER_SUFFIX}
    </Typography>
  )
}
