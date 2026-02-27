import { Box, Button, Card, styled, keyframes } from '@mui/material'
import { HOME_UI_TOKENS as t } from '@shared/application/config/uiTokens'

const MONO_FONT = '"DM Mono", "Fira Code", monospace'
const PAGE_MAX_WIDTH = 1120
const REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: reduce)'

/* Motion */
export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

export const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`

const borderSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const pulseDot = keyframes`
  0%   { left: 0;    opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { left: 100%; opacity: 0; }
`

/* Layout */

const gridPulse = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.55; }
`

export const LandingWrapper = styled(Box)({
  backgroundColor: t.bgPrimary,
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  '& > *': { position: 'relative', zIndex: 1 },
  /* dot grid — fixed position creates parallax against scrolling content */
  '&::before': {
    content: '""',
    position: 'fixed',
    inset: 0,
    backgroundImage: 'radial-gradient(rgba(140,160,255,0.045) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
    pointerEvents: 'none',
    zIndex: 0,
    animation: `${gridPulse} 8s ease-in-out infinite`,
    [REDUCED_MOTION_QUERY]: {
      animation: 'none',
    },
  },
  /* color wash — also fixed for layered parallax depth */
  '&::after': {
    content: '""',
    position: 'fixed',
    inset: 0,
    background: `
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(60,80,200,0.1), transparent),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(50,70,190,0.08), transparent),
      radial-gradient(ellipse 70% 50% at 50% 90%, rgba(40,60,180,0.07), transparent)
    `,
    pointerEvents: 'none',
    zIndex: 0,
  },
})

const driftA = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -20px); }
  50% { transform: translate(-15px, 25px); }
  75% { transform: translate(20px, 10px); }
`

const driftB = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-25px, 15px); }
  50% { transform: translate(20px, -30px); }
  75% { transform: translate(-10px, -15px); }
`

const driftC = keyframes`
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(25px, 20px); }
  66% { transform: translate(-20px, -10px); }
`

export const ParallaxLayer = styled(Box)({
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 0,
  '& .shadow': {
    position: 'absolute',
    borderRadius: '50%',
  },
  '& .shadow-1': {
    width: 600,
    height: 600,
    top: '-5%',
    left: '-10%',
    background: 'radial-gradient(circle, rgba(60,90,220,0.18), transparent 65%)',
    animation: `${driftA} 20s ease-in-out infinite`,
  },
  '& .shadow-2': {
    width: 500,
    height: 500,
    top: '35%',
    right: '-8%',
    background: 'radial-gradient(circle, rgba(90,70,200,0.14), transparent 65%)',
    animation: `${driftB} 25s ease-in-out infinite`,
  },
  '& .shadow-3': {
    width: 450,
    height: 450,
    bottom: '0%',
    left: '25%',
    background: 'radial-gradient(circle, rgba(50,80,200,0.12), transparent 65%)',
    animation: `${driftC} 22s ease-in-out infinite`,
  },
  [REDUCED_MOTION_QUERY]: {
    '& .shadow': { animation: 'none !important' },
  },
})

/* Header */

export const HeaderLogo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
})

export const VersionBadge = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 8,
  backgroundColor: 'rgba(200,210,230,0.08)',
  border: `1px solid rgba(200,210,230,0.2)`,
  fontFamily: MONO_FONT,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#D0D5E0',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
})

export const BadgeDot = styled(Box)({
  width: 5,
  height: 5,
  borderRadius: '50%',
  backgroundColor: t.accentGreen,
  animation: 'pulse 2.5s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.4 },
  },
})

/* Hero */

export const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  maxWidth: PAGE_MAX_WIDTH,
  margin: '0 auto',
  padding: theme.spacing(10, 3, 4),
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  alignItems: 'center',
  gap: theme.spacing(6),
  /* gradient mesh — viewport-wide so edges never show on wide screens */
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-30%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100vw',
    height: '100%',
    background: `
      radial-gradient(ellipse at 30% 30%, rgba(99,120,240,0.14), transparent 55%),
      radial-gradient(ellipse at 70% 50%, rgba(80,100,220,0.08), transparent 55%),
      radial-gradient(ellipse at 50% 80%, rgba(60,90,200,0.06), transparent 50%)
    `,
    pointerEvents: 'none',
    zIndex: 0,
  },
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
    padding: theme.spacing(6, 3, 2),
    textAlign: 'center',
  },
  [REDUCED_MOTION_QUERY]: {
    '& *': { animation: 'none !important' },
  },
}))

export const HeroContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(2.5),
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('md')]: {
    alignItems: 'center',
  },
}))

const taglinePulse = keyframes`
  0%, 100% { border-color: rgba(129,140,248,0.25); box-shadow: 0 0 0 0 rgba(129,140,248,0); }
  50% { border-color: rgba(129,140,248,0.45); box-shadow: 0 0 12px rgba(129,140,248,0.1); }
`

export const HeroTagline = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 14px',
  borderRadius: 16,
  border: `1px solid rgba(129,140,248,0.25)`,
  backgroundColor: 'rgba(129,140,248,0.08)',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: '#E0E4FF',
  letterSpacing: '0.01em',
  animation: `${taglinePulse} 4s ease-in-out infinite`,
  [REDUCED_MOTION_QUERY]: {
    animation: 'none',
  },
})

export const HeroTitle = styled(Box)(({ theme }) => ({
  fontSize: 'clamp(1.75rem, 4.2vw, 2.6rem)',
  fontWeight: 800,
  lineHeight: 1.08,
  letterSpacing: '-0.04em',
  color: t.textPrimary,
  [theme.breakpoints.down('sm')]: {
    fontSize: 'clamp(1.55rem, 7vw, 1.9rem)',
  },
}))

export const GradientText = styled('span')({
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  backgroundImage: `linear-gradient(135deg, ${t.accentIndigo} 0%, ${t.accentPink} 50%, ${t.accentIndigo} 100%)`,
  backgroundSize: '200% auto',
  animation: `${shimmer} 6s linear infinite`,
  [REDUCED_MOTION_QUERY]: {
    animation: 'none',
    backgroundPosition: '50% center',
  },
})

export const HeroButtonsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
  },
}))

/* Preview */

export const PreviewShowcase = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  animation: `${float} 6s ease-in-out infinite`,
  transition: 'transform 0.4s ease',
  [REDUCED_MOTION_QUERY]: {
    animation: 'none',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: 480,
    margin: '0 auto',
  },
}))

export const PreviewBorderWrap = styled(Box)({
  position: 'relative',
  borderRadius: 14,
  padding: 1.5,
  overflow: 'hidden',
  boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,120,240,0.08)`,
  transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
  '&:hover': {
    boxShadow: `0 30px 70px rgba(0,0,0,0.5), 0 0 60px rgba(99,120,240,0.12)`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `conic-gradient(
      from 0deg,
      ${t.accentIndigo}99,
      ${t.accentPink}99,
      ${t.accentGreen}99,
      transparent 40%,
      transparent 60%,
      ${t.accentIndigo}99
    )`,
    animation: `${borderSpin} 4s linear infinite`,
    [REDUCED_MOTION_QUERY]: {
      animation: 'none',
      background: `conic-gradient(from 0deg, ${t.accentIndigo}66, ${t.accentPink}66, ${t.accentGreen}66, ${t.accentIndigo}66)`,
    },
  },
})

export const PreviewFrame = styled(Box)({
  position: 'relative',
  borderRadius: 12,
  backgroundColor: t.bgSurface,
  overflow: 'hidden',
  width: '100%',
  zIndex: 1,
})

export const PreviewImg = styled('img')({
  width: '100%',
  display: 'block',
})

export const PreviewGlow = styled(Box)({
  position: 'absolute',
  top: '30%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '80%',
  height: '60%',
  background: `radial-gradient(ellipse, rgba(129,140,248,0.1), transparent 60%)`,
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: -1,
})

export const BrowserChrome = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  backgroundColor: '#202020',
  borderBottom: '1px solid #2a2a2a',
})

export const BrowserDot = styled(Box)({
  width: 8,
  height: 8,
  borderRadius: '50%',
})

export const BrowserUrlBar = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.4)',
  borderRadius: 5,
  padding: '3px 10px',
  marginLeft: 6,
})

/* Shared */

const buttonShimmer = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`

export const GithubButton = styled(Button)({
  padding: '9px 22px',
  fontSize: '0.82rem',
  minWidth: 170,
  minHeight: 40,
  color: t.bgPrimary,
  fontWeight: 700,
  backgroundColor: t.textPrimary,
  backgroundImage: 'none',
  backgroundSize: '200% auto',
  borderRadius: 12,
  border: 'none',
  textTransform: 'none' as const,
  letterSpacing: '-0.01em',
  transition: 'all 0.35s ease',
  '&:hover': {
    backgroundColor: 'transparent',
    backgroundImage: `linear-gradient(135deg, ${t.accentIndigo}, ${t.accentPink}, ${t.accentGreen}, ${t.accentIndigo})`,
    backgroundSize: '300% auto',
    animation: `${buttonShimmer} 3s linear infinite`,
    color: t.textPrimary,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 24px rgba(129,140,248,0.25), 0 0 40px rgba(244,114,182,0.1)`,
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },
  '&.Mui-disabled': {
    backgroundColor: t.textPrimary,
    opacity: 0.5,
    color: t.bgPrimary,
  },
})

export const AnimatedBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'visible' && prop !== 'delay',
})<{ visible: boolean; delay?: number }>(({ visible, delay = 0 }) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(32px)',
  transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  [REDUCED_MOTION_QUERY]: {
    transition: 'none',
    transform: 'none',
    opacity: 1,
  },
}))

const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 3),
  maxWidth: PAGE_MAX_WIDTH,
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(7, 2),
  },
}))

/* Features */

export const FeaturesSection = styled(Section)({
  position: 'relative',
})

export const BentoGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}))

export const BentoCard = styled(Card, {
  shouldForwardProp: (p) => p !== 'accentColor',
})<{ accentColor?: string }>(({ accentColor }) => ({
  backgroundColor: t.bgSurface,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: 32,
  border: `1px solid ${t.borderSubtle}`,
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: accentColor || t.accentIndigo,
    opacity: 0.6,
  },
  '&:hover': {
    borderColor: t.borderMedium,
    transform: 'translateY(-4px)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
  },
}))

export const FeatureIconBox = styled(Box)({
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginBottom: 16,
})

/* How It Works */

export const HowItWorksSection = styled(Section)({
  position: 'relative',
})

export const StepsTrack = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 0,
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 48,
  },
}))

export const StepStation = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  flex: '0 0 240px',
  position: 'relative',
})

export const StepNode = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'glowColor',
})<{ glowColor: string }>(({ glowColor }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  border: `2px solid ${glowColor}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(7, 11, 24, 0.9)',
  boxShadow: `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20`,
  marginBottom: 20,
  position: 'relative',
  zIndex: 2,
}))

export const StepConnector = styled(Box)(({ theme }) => ({
  flex: 1,
  height: 2,
  marginTop: 32,
  position: 'relative',
  borderTop: `2px dashed ${t.borderMedium}`,
  minWidth: 60,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -4,
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    animation: `${pulseDot} 2.5s ease-in-out infinite`,
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}))

export const StepLabel = styled(Box)({
  fontFamily: MONO_FONT,
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  marginBottom: 8,
  color: t.textTertiary,
})

/* CTA */

export const CtaSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(10, 3),
  maxWidth: 640,
  margin: '0 auto',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '20%',
    width: '60%',
    height: 1,
    background: `linear-gradient(90deg, transparent, ${t.borderMedium}, transparent)`,
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(7, 3),
  },
}))

/* Footer */

export const FooterWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: 'transparent',
  borderTop: `1px solid ${t.borderSubtle}`,
  padding: '40px 24px 40px',
  [theme.breakpoints.down('sm')]: {
    padding: '32px 20px 32px',
  },
}))

export const FooterInner = styled(Box)(({ theme }) => ({
  maxWidth: PAGE_MAX_WIDTH,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: 16,
    textAlign: 'center',
  },
}))

export const FooterLink = styled('a')({
  color: t.textTertiary,
  fontSize: '0.9rem',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: t.textPrimary,
  },
})
