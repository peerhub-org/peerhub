import { Outlet } from 'react-router'
import TopMenuBar from '@shared/ui/components/TopMenuBar/TopMenuBar'
import { RootContainer, SkipLink, MainContent } from './RootLayout.styled'

export default function Root() {
  return (
    <RootContainer>
      <SkipLink href='#main-content'>Skip to main content</SkipLink>
      <TopMenuBar />
      <MainContent component='main' id='main-content'>
        <Outlet />
      </MainContent>
    </RootContainer>
  )
}
