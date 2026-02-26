import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router'
import { GitHub, RateReview, Verified, KeyboardArrowDown } from '@mui/icons-material'
import {
  Box,
  CardContent,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { createAppTheme } from '@shared/ui/foundations/theme'
import { usePostHog } from '@posthog/react'
import authService from '@domains/authentication/application/services/authenticationService'
import { useSnackBar } from '@shared/ui/hooks/useSnackbar'
const logo = '/logo.png'
const previewImage = '/preview.png'
const previewMobileImage = '/previewMobile.png'
import { UI_COPY, HOME_FEATURES, HOME_STEPS } from '@shared/application/config/uiCopy'
import { HOME_UI_TOKENS } from '@shared/application/config/uiTokens'
import { useInView } from '@shared/application/hooks/useInView'
import Incognito from '@shared/ui/components/icons/Incognito'
import OpenSourceFooter from '@shared/ui/components/OpenSourceFooter/OpenSourceFooter'
import {
  fadeInUp,
  LandingWrapper,
  HeroSection,
  HeroLogoRow,
  PreviewContainer,
  FeatureCard,
  StepNumber,
  FeaturesSection,
  AnimatedBox,
  GithubButton,
  PreviewImageWrapper,
  PreviewImage,
  ScrollIndicator,
  HowItWorksSection,
  CtaSection,
  FooterWrapper,
} from './Home.styled'

const featureIcons = [
  <RateReview key='review' sx={{ fontSize: 48, color: HOME_UI_TOKENS.accentGreen, mb: 2 }} />,
  <Incognito key='anonymous' sx={{ fontSize: 48, color: HOME_UI_TOKENS.accentGray, mb: 2 }} />,
  <Verified key='peers' sx={{ fontSize: 48, color: HOME_UI_TOKENS.accentBlue, mb: 2 }} />,
]

const features = HOME_FEATURES.map((feature, index) => ({
  ...feature,
  icon: featureIcons[index],
}))

export default function Home() {
  const token = localStorage.getItem('token')
  const [loginLoading, setLoginLoading] = useState(false)
  const location = useLocation()
  const { showSnackBar } = useSnackBar()
  const posthog = usePostHog()
  const [featuresRef, featuresVisible] = useInView(0.2)
  const [stepsRef, stepsVisible] = useInView(0.2)
  const [ctaRef, ctaVisible] = useInView(0.2)
  const [scrollY, setScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Show error snackbar if redirected from failed OAuth
  useEffect(() => {
    if (location.state?.authError) {
      showSnackBar(UI_COPY.homeAuthFailed, 'error')
      // Clear the state to prevent showing the error again on refresh
      window.history.replaceState({}, '')
    }
  }, [location.state, showSnackBar])

  const handleGithubLogin = async () => {
    posthog?.capture('login_clicked', { provider: 'github' })
    setLoginLoading(true)
    try {
      const oauthUrl = await authService.getGithubOAuthUrl()
      window.location.href = oauthUrl
    } catch {
      setLoginLoading(false)
      showSnackBar(UI_COPY.homeLoginFailed, 'error')
    }
  }

  const darkTheme = useMemo(() => createAppTheme('dark'), [])

  if (token) {
    return <Navigate to='/feed' replace />
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline enableColorScheme />
      <LandingWrapper>
        {/* Hero Section */}
        <HeroSection>
          <HeroLogoRow sx={{ mb: 1.5, animation: `${fadeInUp} 0.8s ease-out 0.2s both` }}>
            <img src={logo} alt='PeerHub Logo' style={{ height: '3em' }} />
            <Typography variant='h3' fontWeight={400} sx={{ color: 'white' }}>
              PeerHub
            </Typography>
          </HeroLogoRow>
          <Typography
            variant='h6'
            fontWeight={400}
            sx={{
              fontStyle: 'italic',
              color: 'white',
              mb: 3,
              maxWidth: 500,
              animation: `${fadeInUp} 0.8s ease-out 0.4s both`,
              typography: { lg: 'h5' },
            }}
          >
            Open-sourcing developer reputation
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: 'white',
              mb: 3,
              maxWidth: 600,
              animation: `${fadeInUp} 0.8s ease-out 0.6s both`,
              typography: { lg: 'body1' },
            }}
          >
            Uncover how your peers rate you, and review them in return, anonymously if you choose.
            <br />
            Use the workflow you already know: approvals, comments, and change requests.
            <br />
            Think Glassdoor meets GitHub.
          </Typography>
          <Box sx={{ animation: `${fadeInUp} 0.8s ease-out 0.8s both` }}>
            <GithubButton
              variant='contained'
              size='large'
              startIcon={loginLoading ? undefined : <GitHub />}
              onClick={handleGithubLogin}
              disabled={loginLoading}
            >
              {loginLoading ? <CircularProgress size={26} color='inherit' /> : UI_COPY.homeLoginCta}
            </GithubButton>
          </Box>
          <PreviewContainer sx={{ animation: `${fadeInUp} 0.8s ease-out 1s both` }}>
            <PreviewImageWrapper
              sx={{
                transform: `translateY(${Math.max(0, 22 - scrollY * 0.08)}%)`,
                willChange: 'transform',
                transition: 'transform 0.05s linear',
                '@media (prefers-reduced-motion: reduce)': {
                  transform: 'none',
                },
                '@media (max-width: 1199px)': {
                  transform: `translateY(${Math.max(0, 8 - scrollY * 0.06)}%)`,
                },
                '@media (max-width: 899px)': {
                  transform: `translateY(${Math.max(0, 15 - scrollY * 0.08)}%)`,
                },
              }}
            >
              <PreviewImage className='desktop' src={previewImage} alt='PeerHub product preview' />
              <PreviewImage
                className='mobile'
                src={previewMobileImage}
                alt='PeerHub product preview'
              />
            </PreviewImageWrapper>
          </PreviewContainer>
          <ScrollIndicator
            visible={scrollY < 50}
            sx={{ opacity: scrollY < 50 ? 1 : 0, pointerEvents: scrollY < 50 ? 'auto' : 'none' }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <KeyboardArrowDown sx={{ fontSize: 36, color: 'rgba(255,255,255,0.7)' }} />
          </ScrollIndicator>
        </HeroSection>

        {/* Features Section */}
        <FeaturesSection ref={featuresRef} sx={{ bgcolor: 'background.default' }}>
          <Container maxWidth='lg'>
            <AnimatedBox visible={featuresVisible}>
              <Typography variant='h4' fontWeight={600} textAlign='center' sx={{ mb: 6 }}>
                {UI_COPY.homeWhyTitle}
              </Typography>
            </AnimatedBox>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
                  <AnimatedBox visible={featuresVisible} delay={index * 150}>
                    <FeatureCard elevation={0}>
                      <CardContent>
                        {feature.icon}
                        <Typography variant='h6' fontWeight={600} sx={{ mb: 1 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </FeatureCard>
                  </AnimatedBox>
                </Grid>
              ))}
            </Grid>
          </Container>
        </FeaturesSection>

        {/* How It Works Section */}
        <HowItWorksSection ref={stepsRef}>
          <Container maxWidth='md'>
            <AnimatedBox visible={stepsVisible}>
              <Typography variant='h4' fontWeight={600} textAlign='center' sx={{ mb: 6 }}>
                {UI_COPY.homeHowTitle}
              </Typography>
            </AnimatedBox>
            <Grid container spacing={4} justifyContent='center'>
              {HOME_STEPS.map((step, index) => (
                <Grid size={{ xs: 12, sm: 4 }} key={step.number}>
                  <AnimatedBox visible={stepsVisible} delay={index * 150}>
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      textAlign='center'
                    >
                      <StepNumber>{step.number}</StepNumber>
                      <Typography variant='h6' fontWeight={600} sx={{ mb: 1 }}>
                        {step.title}
                      </Typography>
                      <Typography variant='body2' className='how-it-works-description'>
                        {step.description}
                      </Typography>
                    </Box>
                  </AnimatedBox>
                </Grid>
              ))}
            </Grid>
          </Container>
        </HowItWorksSection>

        {/* Footer CTA Section */}
        <CtaSection ref={ctaRef} sx={{ bgcolor: 'background.default' }}>
          <Container maxWidth='sm'>
            <AnimatedBox visible={ctaVisible}>
              <Typography variant='h5' fontWeight={600} sx={{ mb: 2 }}>
                {UI_COPY.homeReadyTitle}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
                {UI_COPY.homeReadyDescription}
              </Typography>
              <GithubButton
                variant='contained'
                size='large'
                startIcon={loginLoading ? undefined : <GitHub />}
                onClick={handleGithubLogin}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <CircularProgress size={26} color='inherit' />
                ) : (
                  UI_COPY.homeLoginCta
                )}
              </GithubButton>
            </AnimatedBox>
          </Container>
        </CtaSection>
        {/* Open Source Footer */}
        <FooterWrapper>
          <OpenSourceFooter />
        </FooterWrapper>
      </LandingWrapper>
    </ThemeProvider>
  )
}
