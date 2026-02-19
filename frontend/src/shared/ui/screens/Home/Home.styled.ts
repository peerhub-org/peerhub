import { Box, Button, Card, styled, keyframes } from '@mui/material'
import { HOME_UI_TOKENS } from '@shared/application/config/uiTokens'

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) translateX(-50%);
  }
  40% {
    transform: translateY(-12px) translateX(-50%);
  }
  60% {
    transform: translateY(-6px) translateX(-50%);
  }
`

export const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

export const LandingWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
}))

export const HeroSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8, 4, 0),
  paddingBottom: 420,
  minHeight: '100vh',
  overflow: 'hidden',
  [theme.breakpoints.down('lg')]: {
    paddingBottom: 380,
  },
  [theme.breakpoints.down('md')]: {
    justifyContent: 'flex-start',
    paddingTop: theme.spacing(8),
    paddingBottom: 220,
  },
  [theme.breakpoints.only('xs')]: {
    paddingTop: theme.spacing(12),
    paddingBottom: 180,
  },
  position: 'relative',
  zIndex: 0,
  background: `
    radial-gradient(ellipse at 10% 0%, rgba(168, 85, 247, 0.45) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 20%, rgba(99, 102, 241, 0.4) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 100%, rgba(52, 211, 153, 0.35) 0%, transparent 50%),
    linear-gradient(180deg, ${HOME_UI_TOKENS.heroGradientStart} 0%, ${HOME_UI_TOKENS.heroGradientEnd} 100%)
  `,
  '@media (prefers-reduced-motion: reduce)': {
    '& *': {
      animation: 'none !important',
    },
  },
}))

export const FeatureCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: 'transparent',
    background: `linear-gradient(${theme.palette.background.default}, ${theme.palette.background.default}) padding-box,
                 linear-gradient(135deg, ${HOME_UI_TOKENS.accentViolet}, ${HOME_UI_TOKENS.accentBlue}, ${HOME_UI_TOKENS.accentGreen}) border-box`,
    border: '1px solid transparent',
    boxShadow: `0 8px 30px ${HOME_UI_TOKENS.featureHoverShadow}`,
  },
}))

export const StepNumber = styled(Box)(() => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${HOME_UI_TOKENS.accentViolet} 0%, ${HOME_UI_TOKENS.accentBlue} 50%, ${HOME_UI_TOKENS.accentGreen} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: 16,
  boxShadow: `0 4px 15px ${HOME_UI_TOKENS.stepShadow}`,
}))

export const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 2),
}))

export const AnimatedBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'visible' && prop !== 'delay',
})<{ visible: boolean; delay?: number }>(({ visible, delay = 0 }) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(40px)',
  transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    transform: 'none',
    opacity: 1,
  },
}))

export const GithubButton = styled(Button)(({ theme }) => ({
  paddingLeft: 32,
  paddingRight: 32,
  paddingTop: 12,
  paddingBottom: 12,
  fontSize: '1.1rem',
  minWidth: 260,
  minHeight: 55,
  color: 'white',
  backgroundColor: HOME_UI_TOKENS.ctaButton,
  [theme.breakpoints.down('lg')]: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: '0.95rem',
    minWidth: 220,
    minHeight: 45,
  },
  '&:hover': {
    backgroundColor: HOME_UI_TOKENS.ctaButtonHover,
  },
}))

export const HeroLogoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
})

export const PreviewContainer = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  padding: '0 16px',
  pointerEvents: 'none',
})

export const FeaturesSection = styled(Section)({
  position: 'relative',
  zIndex: 1,
})

export const CtaSection = styled(Section)({
  textAlign: 'center',
})

export const FooterWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
  textAlign: 'center',
  backgroundColor: theme.palette.background.default,
  borderTop: `1px solid ${theme.palette.divider}`,
}))

export const PreviewImageWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 900,
  borderRadius: '16px 16px 0 0',
  padding: '1px 1px 0 1px',
  background: `linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(99, 102, 241, 0.3), rgba(52, 211, 153, 0.4))`,
  boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.15)`,
  [theme.breakpoints.down('lg')]: {
    maxWidth: 700,
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: 320,
  },
  [theme.breakpoints.only('xs')]: {
    maxWidth: 260,
  },
}))

export const PreviewImage = styled('img')(({ theme }) => ({
  width: '100%',
  display: 'block',
  borderRadius: '15px 15px 0 0',
  '&.desktop': {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  '&.mobile': {
    display: 'none',
    [theme.breakpoints.down('md')]: {
      display: 'block',
    },
  },
}))

export const ScrollIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'visible',
})<{ visible: boolean }>(() => ({
  position: 'absolute',
  bottom: 32,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  animation: `${bounce} 2s ease infinite`,
  transition: 'opacity 0.4s ease',
  cursor: 'pointer',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}))

export const HowItWorksSection = styled(Section)({
  background: `
    radial-gradient(ellipse at 80% 0%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 100%, rgba(99, 102, 241, 0.25) 0%, transparent 45%),
    radial-gradient(ellipse at 60% 50%, rgba(52, 211, 153, 0.2) 0%, transparent 50%),
    linear-gradient(180deg, ${HOME_UI_TOKENS.heroGradientStart} 0%, ${HOME_UI_TOKENS.heroGradientEnd} 100%)
  `,
  color: 'rgba(255, 255, 255)',
  '& .how-it-works-description': {
    color: 'rgba(255, 255, 255, 0.85)',
  },
})
