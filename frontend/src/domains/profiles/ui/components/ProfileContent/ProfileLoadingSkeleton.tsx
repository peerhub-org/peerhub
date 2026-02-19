import { Box, Skeleton } from '@mui/material'
import {
  Card,
  CardBody,
  CardHeader,
  TimelineItemContainer,
  TimelineContent,
} from '@shared/ui/styled'
import { MainContent, SidebarPanel, TabsRow, TimelinePanel } from './ProfileContent.styled'

function ReviewItemSkeleton({ withComment = false }: { withComment?: boolean }) {
  return (
    <TimelineItemContainer>
      <Skeleton variant='circular' width={40} height={40} />
      <TimelineContent>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: withComment ? 1.5 : 0, mt: 0.5 }}
        >
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='text' width={withComment ? '30%' : '40%'} height={20} />
        </Box>
        {withComment && (
          <Card>
            <CardHeader>
              <Skeleton variant='text' width='25%' height={20} />
            </CardHeader>
            <CardBody>
              <Skeleton variant='text' width='100%' height={20} />
              <Skeleton variant='text' width='50%' height={20} />
            </CardBody>
          </Card>
        )}
      </TimelineContent>
    </TimelineItemContainer>
  )
}

export function ProfileTabsSkeleton() {
  return (
    <TabsRow>
      <Box sx={{ display: 'flex', gap: 2, py: 1.5 }}>
        <Skeleton variant='rounded' width={130} height={40} />
        <Skeleton variant='rounded' width={130} height={40} />
        <Skeleton variant='rounded' width={180} height={40} />
        <Skeleton variant='rounded' width={130} height={40} />
      </Box>
    </TabsRow>
  )
}

export function ProfileMainSkeleton() {
  return (
    <MainContent>
      <TimelinePanel>
        <TimelineItemContainer>
          <Skeleton variant='circular' width={40} height={40} />
          <TimelineContent>
            <Card>
              <CardHeader>
                <Skeleton variant='text' width={120} height={20} />
              </CardHeader>
              <CardBody>
                <Skeleton variant='text' width='60%' height={20} />
              </CardBody>
            </Card>
          </TimelineContent>
        </TimelineItemContainer>
        <ReviewItemSkeleton />
        <ReviewItemSkeleton withComment />
        <ReviewItemSkeleton />
      </TimelinePanel>

      <SidebarPanel>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Skeleton variant='text' width={80} />
          <Skeleton variant='text' width={40} />
        </Box>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='text' width={80} height={16} />
            </Box>
            <Skeleton variant='circular' width={16} height={16} />
          </Box>
        ))}
        <Skeleton variant='rounded' width='100%' height={24} sx={{ mt: 2 }} />
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Skeleton variant='rounded' width='100%' height={32} />
          <Skeleton variant='text' width='100%' height={16} sx={{ mx: 'auto', mt: 2 }} />
        </Box>
      </SidebarPanel>
    </MainContent>
  )
}
