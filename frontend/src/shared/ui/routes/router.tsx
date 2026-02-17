import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import ErrorPage from '@shared/ui/screens/ErrorPage'
import { HydrateFallback } from '@shared/ui/screens/Fallback'
import Root from '@shared/ui/containers/RootLayout/RootLayout'
import NavigationLoader from '@shared/ui/components/NavigationLoader/NavigationLoader'
import { requireAuth } from '@shared/ui/routes/authLoader'
import { CircularProgress, Box } from '@mui/material'

const Home = lazy(() => import('@shared/ui/screens/Home/Home'))
const SSOLogin = lazy(() => import('@domains/authentication/ui/screens/SSOLogin/SSOLogin'))

function RouteFallback() {
  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
    >
      <CircularProgress sx={{ color: 'grey.500' }} />
    </Box>
  )
}

const routes = [
  {
    path: '/',
    Component: NavigationLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteFallback />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'oauth/callback',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <SSOLogin />
          </Suspense>
        ),
      },
      {
        Component: Root,
        loader: requireAuth,
        children: [
          {
            path: 'settings/account',
            lazy: () =>
              import('@domains/account/ui/screens/Account/Account').then((m) => ({
                Component: m.AccountScreen,
              })),
          },
          {
            path: 'feed',
            lazy: () =>
              import('@domains/account/ui/screens/Feed/Feed').then((m) => ({
                Component: m.default,
                loader: m.loader,
              })),
          },
          {
            path: ':username',
            HydrateFallback: HydrateFallback,
            lazy: () =>
              import('@domains/profiles/ui/screens/Profile/ProfilePage').then((m) => ({
                Component: m.default,
                loader: m.loader,
              })),
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
