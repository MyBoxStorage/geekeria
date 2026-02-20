/**
 * GEEKSTORE - Design System Tokens
 * =================================
 * Sistema completo de design tokens para o e-commerce GEEKSTORE
 * Baseado em: Base clara, gradiente azul-roxo, acentos laranja
 */

// ============================================
// TOKENS DE COR
// ============================================

export const colors = {
  // Cores Primárias
  primary: {
    50: '#E8F1FF',
    100: '#D1E3FF',
    200: '#A3C7FF',
    300: '#75ABFF',
    400: '#478FFF',
    500: '#1E6CFF', // Azul primário
    600: '#1957CC',
    700: '#134299',
    800: '#0E2C66',
    900: '#071633',
  },

  // Cores Secundárias (Roxo)
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Cores de Acento (Laranja CTA)
  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#FF6A00', // Laranja CTA principal
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Cores Neutras
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Cores de Fundo Especiais
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    dark: '#0F1C3F', // Azul profundo
    gradient: 'linear-gradient(135deg, #1E6CFF 0%, #8B5CF6 100%)',
    gradientReverse: 'linear-gradient(135deg, #8B5CF6 0%, #1E6CFF 100%)',
  },

  // Cores de Texto
  text: {
    primary: '#111111',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    muted: '#64748B',
  },

  // Cores Semânticas
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Cores de Estado
  state: {
    hover: 'rgba(30, 108, 255, 0.08)',
    focus: 'rgba(30, 108, 255, 0.12)',
    active: 'rgba(30, 108, 255, 0.16)',
    disabled: 'rgba(148, 163, 184, 0.4)',
  },
} as const;

// ============================================
// TOKENS DE ESPAÇAMENTO
// ============================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const;

// ============================================
// TOKENS DE TIPOGRAFIA
// ============================================

export const typography = {
  // Famílias de Fonte
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },

  // Tamanhos de Fonte
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem',      // 128px
  },

  // Pesos de Fonte
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Altura de Linha
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Espaçamento entre Letras
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================
// TOKENS DE BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

// ============================================
// TOKENS DE SOMBRA
// ============================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
  // Sombras especiais
  glow: '0 0 20px rgba(30, 108, 255, 0.3)',
  'glow-lg': '0 0 40px rgba(30, 108, 255, 0.4)',
  card: '0 4px 20px rgba(0, 0, 0, 0.08)',
  'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
} as const;

// ============================================
// TOKENS DE TRANSIÇÃO
// ============================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    linear: 'linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================
// TOKENS DE Z-INDEX
// ============================================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============================================
// TOKENS DE BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// TOKENS DE CONTAINER
// ============================================

export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

// ============================================
// ESTADOS DE COMPONENTES
// ============================================

export const buttonStates = {
  primary: {
    default: {
      background: colors.primary[500],
      color: colors.neutral[0],
      border: 'transparent',
    },
    hover: {
      background: colors.primary[600],
      color: colors.neutral[0],
      border: 'transparent',
    },
    focus: {
      background: colors.primary[600],
      color: colors.neutral[0],
      border: 'transparent',
      ring: colors.primary[200],
    },
    active: {
      background: colors.primary[700],
      color: colors.neutral[0],
      border: 'transparent',
    },
    disabled: {
      background: colors.neutral[200],
      color: colors.neutral[400],
      border: 'transparent',
    },
    loading: {
      background: colors.primary[600],
      color: colors.neutral[0],
      border: 'transparent',
    },
  },
  secondary: {
    default: {
      background: 'transparent',
      color: colors.primary[500],
      border: colors.primary[500],
    },
    hover: {
      background: colors.primary[50],
      color: colors.primary[600],
      border: colors.primary[600],
    },
    focus: {
      background: colors.primary[50],
      color: colors.primary[600],
      border: colors.primary[600],
      ring: colors.primary[200],
    },
    active: {
      background: colors.primary[100],
      color: colors.primary[700],
      border: colors.primary[700],
    },
    disabled: {
      background: 'transparent',
      color: colors.neutral[300],
      border: colors.neutral[200],
    },
  },
  accent: {
    default: {
      background: colors.accent[500],
      color: colors.neutral[0],
      border: 'transparent',
    },
    hover: {
      background: colors.accent[600],
      color: colors.neutral[0],
      border: 'transparent',
    },
    focus: {
      background: colors.accent[600],
      color: colors.neutral[0],
      border: 'transparent',
      ring: colors.accent[200],
    },
    active: {
      background: colors.accent[700],
      color: colors.neutral[0],
      border: 'transparent',
    },
    disabled: {
      background: colors.neutral[200],
      color: colors.neutral[400],
      border: 'transparent',
    },
  },
} as const;

export const cardStates = {
  default: {
    background: colors.neutral[0],
    border: colors.neutral[200],
    shadow: shadows.card,
  },
  hover: {
    background: colors.neutral[0],
    border: colors.neutral[300],
    shadow: shadows['card-hover'],
  },
  focus: {
    background: colors.neutral[0],
    border: colors.primary[300],
    shadow: shadows.glow,
  },
  disabled: {
    background: colors.neutral[100],
    border: colors.neutral[200],
    shadow: shadows.none,
  },
} as const;

export const inputStates = {
  default: {
    background: colors.neutral[0],
    border: colors.neutral[300],
    color: colors.text.primary,
  },
  hover: {
    background: colors.neutral[0],
    border: colors.neutral[400],
    color: colors.text.primary,
  },
  focus: {
    background: colors.neutral[0],
    border: colors.primary[500],
    color: colors.text.primary,
    ring: colors.primary[200],
  },
  error: {
    background: colors.neutral[0],
    border: colors.semantic.error,
    color: colors.text.primary,
    ring: 'rgba(239, 68, 68, 0.2)',
  },
  disabled: {
    background: colors.neutral[100],
    border: colors.neutral[200],
    color: colors.text.tertiary,
  },
} as const;

// ============================================
// SISTEMA DE GRID
// ============================================

export const grid = {
  columns: 12,
  gutter: spacing[6],
  margin: {
    sm: spacing[4],
    md: spacing[6],
    lg: spacing[8],
    xl: spacing[12],
  },
} as const;

// ============================================
// GLASSMORPHISM
// ============================================

export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  dark: {
    background: 'rgba(15, 28, 63, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  subtle: {
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
} as const;

// ============================================
// ANIMAÇÕES
// ============================================

export const animations = {
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeInUp: {
    from: { opacity: '0', transform: 'translateY(20px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  fadeInDown: {
    from: { opacity: '0', transform: 'translateY(-20px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  scaleIn: {
    from: { opacity: '0', transform: 'scale(0.95)' },
    to: { opacity: '1', transform: 'scale(1)' },
  },
  slideInLeft: {
    from: { opacity: '0', transform: 'translateX(-20px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
  slideInRight: {
    from: { opacity: '0', transform: 'translateX(20px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
} as const;

// ============================================
// EXPORTAÇÃO ÚNICA
// ============================================

export const designTokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  containers,
  buttonStates,
  cardStates,
  inputStates,
  grid,
  glassmorphism,
  animations,
} as const;

export default designTokens;
