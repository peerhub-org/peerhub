import { Fragment, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { GitHub, People, RateReview, Verified, Visibility } from '@mui/icons-material'
import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material'
import { usePostHog } from '@posthog/react'
import authService from '@domains/authentication/application/services/authenticationService'
import { GITHUB_REPO_URL } from '@shared/application/config/appConstants'
import { useSnackBar } from '@shared/ui/hooks/useSnackbar'
import { UI_COPY, HOME_FEATURES, HOME_STEPS } from '@shared/application/config/uiCopy'
import { HOME_UI_TOKENS } from '@shared/application/config/uiTokens'
import { useInView } from '@shared/application/hooks/useInView'
import { useVersion } from '@shared/application/hooks/useVersion'
import { createAppTheme } from '@shared/ui/foundations/theme'
import Incognito from '@shared/ui/components/icons/Incognito'
import {
  AnimatedBox,
  BadgeDot,
  BentoCard,
  BentoGrid,
  BrowserChrome,
  BrowserDot,
  BrowserUrlBar,
  CtaSection,
  fadeInUp,
  FeatureIconBox,
  FeaturesSection,
  FooterInner,
  FooterLink,
  FooterWrapper,
  float,
  GithubButton,
  GradientText,
  HeaderLogo,
  HeroButtonsRow,
  HeroContent,
  HeroSection,
  HeroTagline,
  HeroTitle,
  HowItWorksSection,
  LandingWrapper,
  ParallaxLayer,
  PreviewShowcase,
  PreviewBorderWrap,
  PreviewFrame,
  PreviewGlow,
  PreviewImg,
  StepConnector,
  StepLabel,
  StepNode,
  StepStation,
  StepsTrack,
  VersionBadge,
} from './Home.styled'

const logo = '/logo.png'
const previewHomeImage = '/previewHome.png'

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap'

const HOME_FONTS = {
  display: '"Bricolage Grotesque", Georgia, serif',
  body: '"Instrument Sans", -apple-system, sans-serif',
  mono: '"DM Mono", "Fira Code", monospace',
}

const SECTION_EYEBROW_SX = {
  fontFamily: HOME_FONTS.mono,
  fontSize: '0.7rem',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: HOME_UI_TOKENS.accentIndigo,
  mb: 1.5,
}

const SECTION_TITLE_SX = {
  fontFamily: HOME_FONTS.display,
  fontWeight: 800,
  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
  color: HOME_UI_TOKENS.textPrimary,
  letterSpacing: '-0.03em',
}

const ORDERED_FEATURES = HOME_FEATURES.slice(0, 3)

const FEATURE_VISUALS = [
  {
    icon: <Verified sx={{ fontSize: 22, color: HOME_UI_TOKENS.accentGold }} />,
    accent: HOME_UI_TOKENS.accentGold,
    iconBg: 'rgba(245, 158, 11, 0.08)',
  },
  {
    icon: <Incognito sx={{ fontSize: 22, color: HOME_UI_TOKENS.textTertiary }} />,
    accent: HOME_UI_TOKENS.textTertiary,
    iconBg: 'rgba(113, 113, 122, 0.08)',
  },
  {
    icon: <People sx={{ fontSize: 22, color: HOME_UI_TOKENS.accentGreen }} />,
    accent: HOME_UI_TOKENS.accentGreen,
    iconBg: 'rgba(52, 211, 153, 0.08)',
  },
]

const features = ORDERED_FEATURES.map((feature, index) => {
  const visual = FEATURE_VISUALS[index] ?? FEATURE_VISUALS[0]
  return {
    ...feature,
    ...visual,
  }
})

const STEP_VISUALS = [
  {
    color: HOME_UI_TOKENS.accentIndigo,
    icon: <GitHub sx={{ fontSize: 26, color: HOME_UI_TOKENS.accentIndigo }} />,
  },
  {
    color: HOME_UI_TOKENS.accentPink,
    icon: <Visibility sx={{ fontSize: 26, color: HOME_UI_TOKENS.accentPink }} />,
  },
  {
    color: HOME_UI_TOKENS.accentPurple,
    icon: <RateReview sx={{ fontSize: 26, color: HOME_UI_TOKENS.accentPurple }} />,
  },
]

export default function Home() {
  const token = localStorage.getItem('token')
  const [loginLoading, setLoginLoading] = useState(false)
  const location = useLocation()
  const { showSnackBar } = useSnackBar()
  const posthog = usePostHog()
  const version = useVersion()
  const [stepsRef, stepsVisible] = useInView(0.2)
  const [featuresRef, featuresVisible] = useInView(0.2)
  const [ctaRef, ctaVisible] = useInView(0.2)

  useEffect(() => {
    if (!document.querySelector('[data-peerhub-fonts]')) {
      const link = document.createElement('link')
      link.setAttribute('data-peerhub-fonts', '')
      link.rel = 'stylesheet'
      link.href = FONT_URL
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    if (location.state?.authError) {
      showSnackBar(UI_COPY.homeAuthFailed, 'error')
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
  const loginButtonContent = loginLoading ? (
    <CircularProgress size={22} sx={{ color: '#06080F' }} />
  ) : (
    UI_COPY.homeLoginCta
  )

  if (token) {
    return <Navigate to='/feed' replace />
  }

  const renderGithubButton = () => (
    <GithubButton
      variant='contained'
      size='large'
      startIcon={loginLoading ? undefined : <GitHub />}
      onClick={handleGithubLogin}
      disabled={loginLoading}
    >
      {loginButtonContent}
    </GithubButton>
  )

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline enableColorScheme />
      <LandingWrapper>
        <ParallaxLayer>
          <div className='shadow shadow-1' />
          <div className='shadow shadow-2' />
          <div className='shadow shadow-3' />
        </ParallaxLayer>

        {/* Hero */}
        <HeroSection>
          <HeroContent>
            <HeaderLogo sx={{ animation: `${fadeInUp} 0.5s ease-out both` }}>
              <img
                src={logo}
                alt='PeerHub'
                width={48}
                style={{ borderRadius: 5, objectFit: 'contain' }}
              />
              <Typography
                sx={{
                  color: HOME_UI_TOKENS.textPrimary,
                  fontWeight: 600,
                  fontFamily: HOME_FONTS.display,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.02em',
                }}
              >
                PeerHub
              </Typography>
            </HeaderLogo>

            <Box sx={{ mt: -1.5, mb: -1.25, animation: `${fadeInUp} 0.6s ease-out 0.1s both` }}>
              <HeroTagline sx={{ fontFamily: HOME_FONTS.body }}>
                Think Glassdoor meets GitHub.
              </HeroTagline>
            </Box>

            <HeroTitle
              sx={{
                animation: `${fadeInUp} 0.6s ease-out 0.2s both`,
                fontFamily: HOME_FONTS.display,
              }}
            >
              Open-sourcing <br />
              <GradientText>developer reputation</GradientText>
            </HeroTitle>

            <Typography
              sx={{
                animation: `${fadeInUp} 0.6s ease-out 0.3s both`,
                color: HOME_UI_TOKENS.textSecondary,
                lineHeight: 1.65,
                maxWidth: 480,
                fontSize: '0.9rem',
                fontFamily: HOME_FONTS.body,
              }}
            >
              See how your peers really rate you, and review them in return. Stay
              <strong> anonymous when it matters</strong>. Use the trusted PR-style flow: approvals,
              comments, and change requests.
            </Typography>

            <HeroButtonsRow sx={{ animation: `${fadeInUp} 0.6s ease-out 0.4s both` }}>
              {renderGithubButton()}
            </HeroButtonsRow>
          </HeroContent>

          {/* Preview */}
          <PreviewShowcase
            sx={{
              animation: `${fadeInUp} 0.7s ease-out 0.5s both, ${float} 6s ease-in-out 1.2s infinite`,
            }}
          >
            <PreviewBorderWrap>
              <PreviewFrame>
                <BrowserChrome>
                  <BrowserDot sx={{ backgroundColor: '#FF5F57' }} />
                  <BrowserDot sx={{ backgroundColor: '#FEBC2E' }} />
                  <BrowserDot sx={{ backgroundColor: '#28C840' }} />
                  <BrowserUrlBar>
                    <Typography
                      sx={{
                        color: HOME_UI_TOKENS.textSecondary,
                        fontFamily: HOME_FONTS.mono,
                        fontSize: '0.6rem',
                        letterSpacing: '0.03em',
                        userSelect: 'none',
                      }}
                    >
                      peerhub.dev/
                      <span style={{ color: HOME_UI_TOKENS.accentIndigo }}>
                        {'{github_username}'}
                      </span>
                    </Typography>
                  </BrowserUrlBar>
                </BrowserChrome>
                <PreviewImg src={previewHomeImage} alt='PeerHub product preview' />
              </PreviewFrame>
            </PreviewBorderWrap>
            <PreviewGlow />
          </PreviewShowcase>
        </HeroSection>

        {/* How it works */}
        <HowItWorksSection ref={stepsRef}>
          <AnimatedBox visible={stepsVisible}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography sx={SECTION_EYEBROW_SX}>Quick steps</Typography>
              <Typography sx={SECTION_TITLE_SX}>{UI_COPY.homeHowTitle}</Typography>
            </Box>
          </AnimatedBox>

          <AnimatedBox visible={stepsVisible} delay={200}>
            <StepsTrack>
              {HOME_STEPS.map((step, index) => (
                <Fragment key={step.number}>
                  <StepStation>
                    <StepNode glowColor={STEP_VISUALS[index]?.color ?? HOME_UI_TOKENS.accentIndigo}>
                      {STEP_VISUALS[index]?.icon}
                    </StepNode>
                    <StepLabel>Step {step.number}</StepLabel>
                    <Typography
                      sx={{
                        mb: 1,
                        color: HOME_UI_TOKENS.textPrimary,
                        fontWeight: 700,
                        fontFamily: HOME_FONTS.display,
                        fontSize: '1.05rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: HOME_UI_TOKENS.textSecondary,
                        maxWidth: 220,
                        lineHeight: 1.6,
                        fontFamily: HOME_FONTS.body,
                        fontSize: '0.85rem',
                      }}
                    >
                      {step.description}
                    </Typography>
                  </StepStation>
                  {index < HOME_STEPS.length - 1 && <StepConnector />}
                </Fragment>
              ))}
            </StepsTrack>
          </AnimatedBox>
        </HowItWorksSection>

        {/* Features */}
        <FeaturesSection ref={featuresRef} sx={{ pt: 7 }}>
          <AnimatedBox visible={featuresVisible}>
            <Box sx={{ mb: 5 }}>
              <Typography sx={SECTION_EYEBROW_SX}>What you get</Typography>
              <Typography
                sx={{
                  ...SECTION_TITLE_SX,
                  mb: 1,
                }}
              >
                {UI_COPY.homeWhyTitle}
              </Typography>
              <Typography
                sx={{
                  color: HOME_UI_TOKENS.textSecondary,
                  fontFamily: HOME_FONTS.body,
                  maxWidth: 520,
                  lineHeight: 1.6,
                  fontSize: '0.92rem',
                }}
              >
                A practical, peer-driven way to build trust in your engineering work.
              </Typography>
            </Box>
          </AnimatedBox>

          <BentoGrid>
            {features.map((feature, index) => (
              <AnimatedBox key={feature.title} visible={featuresVisible} delay={index * 100}>
                <BentoCard elevation={0} accentColor={feature.accent} sx={{ height: '100%' }}>
                  <FeatureIconBox
                    sx={{
                      backgroundColor: feature.iconBg,
                      border: `1px solid ${feature.accent}22`,
                    }}
                  >
                    {feature.icon}
                  </FeatureIconBox>
                  <Typography
                    sx={{
                      fontFamily: HOME_FONTS.display,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: HOME_UI_TOKENS.textPrimary,
                      mb: 1,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: HOME_UI_TOKENS.textSecondary,
                      lineHeight: 1.6,
                      fontFamily: HOME_FONTS.body,
                      fontSize: '0.88rem',
                    }}
                  >
                    {feature.description}
                  </Typography>
                </BentoCard>
              </AnimatedBox>
            ))}
          </BentoGrid>
        </FeaturesSection>

        {/* CTA */}
        <CtaSection ref={ctaRef}>
          <AnimatedBox visible={ctaVisible}>
            <Typography
              sx={{
                fontFamily: HOME_FONTS.display,
                fontWeight: 800,
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: HOME_UI_TOKENS.textPrimary,
                letterSpacing: '-0.03em',
                mb: 1.5,
              }}
            >
              {UI_COPY.homeReadyTitle}
            </Typography>
            <Typography
              sx={{
                color: HOME_UI_TOKENS.textSecondary,
                fontFamily: HOME_FONTS.body,
                lineHeight: 1.7,
                mb: 4,
                fontSize: '0.95rem',
              }}
            >
              {UI_COPY.homeReadyDescription}
            </Typography>
            {renderGithubButton()}
          </AnimatedBox>
        </CtaSection>

        {/* Footer */}
        <FooterWrapper>
          <FooterInner>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src={logo}
                alt='PeerHub'
                width={36}
                height={25}
                style={{ borderRadius: 4, opacity: 0.7, objectFit: 'contain' }}
              />
              <Typography
                sx={{
                  color: HOME_UI_TOKENS.textSecondary,
                  fontFamily: HOME_FONTS.body,
                  fontSize: '0.9rem',
                }}
              >
                &copy; {new Date().getFullYear()} PeerHub
              </Typography>
            </Box>
            <FooterLink
              href={GITHUB_REPO_URL}
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <VersionBadge>
                <BadgeDot />
                {version ? `v${version}` : ''}
              </VersionBadge>
            </FooterLink>
          </FooterInner>
        </FooterWrapper>
      </LandingWrapper>
    </ThemeProvider>
  )
}
