/**
 * Vibebaba Design System v4.0
 * Golden Gradient Theme
 *
 * Philosophy:
 * - Luxurious golden gradient aesthetic
 * - Warm, inviting color palette
 * - Premium feel with amber and yellow tones
 * - Modern, polished UI with smooth transitions
 * - Sophisticated shadows and depth
 */

export const colors = {
  // Primary Brand Colors - Golden Gradient
  brand: {
    primary: {
      DEFAULT: '#F59E0B', // Amber-500
      light: '#FCD34D', // Amber-300
      dark: '#D97706', // Amber-600
      pale: '#FEF3C7', // Amber-100
    },
    secondary: {
      DEFAULT: '#EAB308', // Yellow-500
      light: '#FDE047', // Yellow-300
      dark: '#CA8A04', // Yellow-600
      pale: '#FEF9C3', // Yellow-100
    },
  },

  // Golden Gradients
  gradients: {
    primary: {
      from: '#FBBF24', // Amber-400
      to: '#EAB308', // Yellow-600
      css: 'linear-gradient(to right, #FBBF24, #EAB308)',
    },
    hover: {
      from: '#F59E0B', // Amber-500
      to: '#CA8A04', // Yellow-700
      css: 'linear-gradient(to right, #F59E0B, #CA8A04)',
    },
    light: {
      from: '#FDE68A', // Amber-200
      to: '#FEF08A', // Yellow-200
      css: 'linear-gradient(to right, #FDE68A, #FEF08A)',
    },
    radial: {
      from: '#FBBF24', // Amber-400
      to: '#EAB308', // Yellow-600
      css: 'radial-gradient(circle, #FBBF24, #EAB308)',
    },
  },

  // Background Colors
  background: {
    base: '#0A0A0A', // Almost black
    raised: '#1A1A1A', // Slightly lighter
    subtle: '#171717', // Neutral-900
    overlay: '#262626', // Neutral-800
    sunken: '#0F0F0F', // Darker
    card: '#1F1F1F', // Card background
  },

  // Text Colors
  text: {
    primary: '#FAFAFA', // Almost white
    secondary: '#D4D4D4', // Neutral-300
    tertiary: '#A3A3A3', // Neutral-400
    inverse: '#0A0A0A', // Dark text on light backgrounds
    muted: '#737373', // Neutral-500
    disabled: '#525252', // Neutral-600
  },

  // Border Colors
  border: {
    subtle: '#262626', // Very subtle
    light: '#404040', // Light border
    DEFAULT: '#525252', // Default border
    strong: '#737373', // Strong border
    focus: '#FBBF24', // Golden focus
    brand: '#F59E0B', // Brand border
  },

  // Semantic Colors
  semantic: {
    success: {
      DEFAULT: '#22C55E', // Green-500
      light: '#86EFAC', // Green-300
      dark: '#16A34A', // Green-600
      bg: '#14532D', // Green-900
    },
    error: {
      DEFAULT: '#EF4444', // Red-500
      light: '#FCA5A5', // Red-300
      dark: '#DC2626', // Red-600
      bg: '#7F1D1D', // Red-900
    },
    warning: {
      DEFAULT: '#F59E0B', // Amber-500 (golden)
      light: '#FCD34D', // Amber-300
      dark: '#D97706', // Amber-600
      bg: '#78350F', // Amber-900
    },
    info: {
      DEFAULT: '#3B82F6', // Blue-500
      light: '#93C5FD', // Blue-300
      dark: '#2563EB', // Blue-600
      bg: '#1E3A8A', // Blue-900
    },
  },

  // Accent Colors
  accents: {
    gold: '#FFD700', // Pure gold
    bronze: '#CD7F32', // Bronze
    copper: '#B87333', // Copper
    rose: '#F43F5E', // Rose-500
  },

  // Overlay & Modal Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    medium: 'rgba(0, 0, 0, 0.7)',
    heavy: 'rgba(0, 0, 0, 0.85)',
  },
};

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['Monaco', 'Menlo', 'Courier New', 'monospace'],
    display: ['Poppins', 'system-ui', 'sans-serif'],
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem', // 72px
    '8xl': '6rem', // 96px
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing Scale (based on 4px)
export const spacing = {
  '0': '0',
  px: '1px',
  '0.5': '0.125rem', // 2px
  '1': '0.25rem', // 4px
  '1.5': '0.375rem', // 6px
  '2': '0.5rem', // 8px
  '2.5': '0.625rem', // 10px
  '3': '0.75rem', // 12px
  '3.5': '0.875rem', // 14px
  '4': '1rem', // 16px
  '5': '1.25rem', // 20px
  '6': '1.5rem', // 24px
  '7': '1.75rem', // 28px
  '8': '2rem', // 32px
  '9': '2.25rem', // 36px
  '10': '2.5rem', // 40px
  '12': '3rem', // 48px
  '14': '3.5rem', // 56px
  '16': '4rem', // 64px
  '20': '5rem', // 80px
  '24': '6rem', // 96px
  '32': '8rem', // 128px
};

// Border Radius - Modern, smooth curves
export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px', // Fully rounded
};

// Border Width
export const borderWidth = {
  none: '0',
  DEFAULT: '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
};

// Shadows - Layered depth with golden hints
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Golden shadows for special elements
  golden: {
    sm: '0 1px 2px 0 rgba(251, 191, 36, 0.1)',
    md: '0 4px 6px -1px rgba(251, 191, 36, 0.2), 0 2px 4px -1px rgba(234, 179, 8, 0.1)',
    lg: '0 10px 15px -3px rgba(251, 191, 36, 0.3), 0 4px 6px -2px rgba(234, 179, 8, 0.2)',
    xl: '0 20px 25px -5px rgba(251, 191, 36, 0.4), 0 10px 10px -5px rgba(234, 179, 8, 0.3)',
  },
};

// Animation & Transitions
export const animation = {
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Component-Specific Styles
export const components = {
  button: {
    primary: {
      bg: 'linear-gradient(to right, #FBBF24, #EAB308)',
      hoverBg: 'linear-gradient(to right, #F59E0B, #CA8A04)',
      text: '#FFFFFF',
      shadow: shadows.md,
      hoverShadow: shadows.lg,
    },
    secondary: {
      bg: colors.background.raised,
      hoverBg: colors.background.subtle,
      text: colors.text.primary,
      border: colors.border.light,
      shadow: shadows.sm,
    },
    outline: {
      bg: 'transparent',
      hoverBg: colors.background.subtle,
      text: colors.text.primary,
      border: colors.border.DEFAULT,
    },
    ghost: {
      bg: 'transparent',
      hoverBg: colors.background.subtle,
      text: colors.text.primary,
    },
    danger: {
      bg: colors.semantic.error.DEFAULT,
      hoverBg: colors.semantic.error.dark,
      text: '#FFFFFF',
    },
  },

  input: {
    bg: colors.background.raised,
    border: colors.border.light,
    focusBorder: colors.brand.primary.DEFAULT,
    text: colors.text.primary,
    placeholder: colors.text.tertiary,
    shadow: shadows.sm,
    focusShadow: shadows.md,
  },

  card: {
    bg: colors.background.raised,
    border: colors.border.light,
    shadow: shadows.lg,
    hoverShadow: shadows.xl,
  },

  header: {
    bg: 'rgba(10, 10, 10, 0.8)',
    backdropBlur: 'blur(12px)',
    border: colors.border.subtle,
    text: colors.text.primary,
  },

  sidebar: {
    bg: colors.background.base,
    border: colors.border.light,
    itemHover: colors.background.subtle,
    itemActive: 'linear-gradient(to right, rgba(251, 191, 36, 0.1), rgba(234, 179, 8, 0.1))',
  },

  chat: {
    userBubble: {
      bg: 'linear-gradient(to bottom right, #FBBF24, #EAB308)',
      text: '#FFFFFF',
      shadow: shadows.lg,
    },
    assistantBubble: {
      bg: colors.background.raised,
      text: colors.text.primary,
      border: colors.border.light,
      shadow: shadows.md,
    },
    planBubble: {
      bg: 'linear-gradient(to bottom right, rgba(251, 191, 36, 0.05), rgba(234, 179, 8, 0.05))',
      border: colors.brand.primary.light,
      text: colors.text.primary,
      accent: colors.brand.primary.DEFAULT,
    },
  },

  modal: {
    bg: colors.background.raised,
    overlay: colors.overlay.heavy,
    border: colors.border.light,
    shadow: shadows['2xl'],
  },

  badge: {
    golden: {
      bg: 'rgba(251, 191, 36, 0.1)',
      text: '#FBBF24',
      border: 'rgba(251, 191, 36, 0.2)',
    },
    success: {
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22C55E',
      border: 'rgba(34, 197, 94, 0.2)',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      text: '#EF4444',
      border: 'rgba(239, 68, 68, 0.2)',
    },
  },

  tooltip: {
    bg: colors.background.overlay,
    text: colors.text.primary,
    border: colors.border.light,
    shadow: shadows.lg,
  },

  dropdown: {
    bg: colors.background.raised,
    border: colors.border.light,
    shadow: shadows.xl,
    itemHover: colors.background.subtle,
  },
};

// Utility Classes for Tailwind
export const tailwindTokens = {
  colors: {
    'brand-primary': colors.brand.primary.DEFAULT,
    'brand-secondary': colors.brand.secondary.DEFAULT,
    'background-base': colors.background.base,
    'background-raised': colors.background.raised,
    'background-subtle': colors.background.subtle,
    'background-overlay': colors.background.overlay,
    'text-primary': colors.text.primary,
    'text-secondary': colors.text.secondary,
    'text-tertiary': colors.text.tertiary,
    'border-light': colors.border.light,
    'border-default': colors.border.DEFAULT,
  },
};

// Design Guidelines
export const guidelines = {
  spacing: {
    description: 'Use 4px base spacing scale for consistent rhythm',
    usage: 'Prefer multiples of 4 (4, 8, 12, 16, 24, 32, 48, 64)',
  },

  typography: {
    description: 'Use Poppins for UI, maintain clear hierarchy',
    headings: 'Bold weight (600-700) with tight line-height',
    body: 'Regular weight (400) with normal line-height (1.5)',
    labels: 'Medium weight (500) for emphasis',
  },

  colors: {
    description: 'Golden gradient theme with dark backgrounds',
    primary: 'Use golden gradients for CTAs and important actions',
    secondary: 'Use subtle grays for supporting UI elements',
    semantic: 'Reserve for specific states (success, error, warning)',
  },

  shadows: {
    description: 'Use shadows to create depth and hierarchy',
    elevation: 'sm for subtle lift, md for cards, lg for modals, xl for special emphasis',
    golden: 'Use golden shadows sparingly for premium features',
  },

  borderRadius: {
    description: 'Modern, smooth corners throughout',
    standard: 'Use lg (12px) for most interactive elements',
    cards: 'Use xl (16px) or 2xl (24px) for larger containers',
  },

  transitions: {
    description: 'Smooth, polished interactions',
    default: 'Use base (200ms) for most interactions',
    emphasis: 'Use slow (300ms) for important state changes',
  },
};

// Utility function to get gradient CSS
export const getGradient = (type: 'primary' | 'hover' | 'light' | 'radial' = 'primary') => {
  return colors.gradients[type].css;
};

// Utility function to get shadow CSS
export const getShadow = (
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md',
  golden: boolean = false
) => {
  if (golden) {
    return shadows.golden[size as 'sm' | 'md' | 'lg' | 'xl'];
  }
  return shadows[size];
};

// Export default for easy import
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  animation,
  components,
  tailwindTokens,
  guidelines,
  getGradient,
  getShadow,
};
