import { Box, Container, Skeleton, styled } from '@mui/material'
import { CardBody, CardHeader } from '../styled'

const PageWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
}))

const HeaderRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 36,
})

const HeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
})

const TabsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: 24,
  paddingBottom: 12,
}))

const MainContent = styled(Box)({
  display: 'flex',
  gap: 32,
})

const TimelinePanel = styled(Box)({
  flex: 1,
  minWidth: 0,
})

const SidebarPanel = styled(Box)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

const BioCardSkeleton = styled(Box)({
  display: 'flex',
  gap: 16,
  marginBottom: 24,
})

const BioCardContent = styled(Box)(({ theme }) => ({
  flex: 1,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  overflow: 'hidden',
}))

const ReviewItemSkeleton = styled(Box)({
  display: 'flex',
  gap: 16,
  marginBottom: 24,
})

const ReviewItemContent = styled(Box)({
  flex: 1,
})

const ReviewItemHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
})

const CommentCardSkeleton = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  overflow: 'hidden',
}))

const CommentCardHeader = styled(Box)(({ theme }) => ({
  padding: '8px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
}))

const CommentCardBody = styled(Box)({
  padding: 16,
})

const SidebarHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
})

const ReviewerRowSkeleton = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
})

const ReviewerInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

export function HydrateFallback() {
  return (
    <PageWrapper>
      <Container maxWidth='lg' sx={{ pt: 3, pb: 4 }}>
        {/* Header skeleton */}
        <HeaderRow>
          <HeaderLeft>
            <Skeleton variant='rounded' width={60} height={28} />
            <Skeleton variant='text' width={200} />
          </HeaderLeft>
          <Skeleton variant='rounded' width={120} height={28} />
        </HeaderRow>

        {/* Tabs skeleton */}
        <TabsRow>
          <Skeleton variant='rounded' width={130} height={40} />
          <Skeleton variant='rounded' width={130} height={40} />
          <Skeleton variant='rounded' width={180} height={40} />
          <Skeleton variant='rounded' width={130} height={40} />
        </TabsRow>

        {/* Main content skeleton */}
        <MainContent>
          {/* Timeline panel */}
          <TimelinePanel>
            {/* Author bio card skeleton */}
            <BioCardSkeleton>
              <Skeleton variant='circular' width={40} height={40} />
              <BioCardContent>
                <CardHeader>
                  <Skeleton variant='text' width={120} height={20} />
                </CardHeader>
                <CardBody>
                  <Skeleton variant='text' width='60%' height={20} />
                </CardBody>
              </BioCardContent>
            </BioCardSkeleton>

            {/* Review items skeleton */}
            <ReviewItemSkeleton>
              <Skeleton variant='circular' width={40} height={40} />
              <ReviewItemContent>
                <ReviewItemHeader sx={{ marginTop: '4px' }}>
                  <Skeleton variant='circular' width={32} height={32} />
                  <Skeleton variant='text' width='40%' height={20} />
                </ReviewItemHeader>
              </ReviewItemContent>
            </ReviewItemSkeleton>
            <ReviewItemSkeleton>
              <Skeleton variant='circular' width={40} height={40} />
              <ReviewItemContent>
                <ReviewItemHeader sx={{ marginTop: '4px' }}>
                  <Skeleton variant='circular' width={32} height={32} />
                  <Skeleton variant='text' width='30%' height={20} />
                </ReviewItemHeader>
                <CommentCardSkeleton>
                  <CommentCardHeader>
                    <Skeleton variant='text' width='25%' height={20} />
                  </CommentCardHeader>
                  <CommentCardBody>
                    <Skeleton variant='text' width='100%' height={20} />
                    <Skeleton variant='text' width='50%' height={20} />
                  </CommentCardBody>
                </CommentCardSkeleton>
              </ReviewItemContent>
            </ReviewItemSkeleton>
            <ReviewItemSkeleton>
              <Skeleton variant='circular' width={40} height={40} />
              <ReviewItemContent>
                <ReviewItemHeader sx={{ marginTop: '4px' }}>
                  <Skeleton variant='circular' width={32} height={32} />
                  <Skeleton variant='text' width='40%' height={20} />
                </ReviewItemHeader>
              </ReviewItemContent>
            </ReviewItemSkeleton>
          </TimelinePanel>

          {/* Sidebar panel */}
          <SidebarPanel>
            <SidebarHeader>
              <Skeleton variant='text' width={80} />
              <Skeleton variant='text' width={40} />
            </SidebarHeader>

            {/* Reviewer rows skeleton */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ReviewerRowSkeleton key={i}>
                <ReviewerInfo>
                  <Skeleton variant='circular' width={20} height={20} />
                  <Skeleton variant='text' width={80} height={16} />
                </ReviewerInfo>
                <Skeleton variant='circular' width={16} height={16} />
              </ReviewerRowSkeleton>
            ))}
            <Skeleton variant='rounded' width='100%' height={24} sx={{ mt: 2 }} />

            {/* Watch button and footer skeleton */}
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Skeleton variant='rounded' width='100%' height={32} />
              <Skeleton variant='text' width='100%' height={16} sx={{ mx: 'auto', mt: 2 }} />
            </Box>
          </SidebarPanel>
        </MainContent>
      </Container>
    </PageWrapper>
  )
}
