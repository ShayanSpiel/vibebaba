/**
 * DESIGN TOKENS GENERATOR
 *
 * Extracted from ux/index.ts (358 lines)
 * Generates comprehensive design tokens from base styling config
 * Expands basic config into complete design system with:
 * - Brand configuration
 * - Semantic colors
 * - Typography scales
 * - Spacing systems
 * - Component styles
 */

import { adjustColorBrightness } from '@/lib/utils/colors';

// Alias for backward compatibility in this file
const adjustColor = adjustColorBrightness;
import type {
  StylingConfig,
  BrandConfig,
  SemanticColors,
  DarkModeOverrides,
  ShadowSystem,
  FontSizes,
  LineHeights,
  FontWeights,
  EnhancedTypographyConfig,
  SpacingScale,
  LayoutSpacing,
  SpacingConfig,
  BorderRadiusScale,
  BorderWidths,
  BorderingConfig,
  TransitionDurations,
  EasingFunctions,
  ZIndices,
  TransitionConfig,
  ButtonVariants,
  ButtonSizes,
  ButtonConfig,
  InputConfig,
  CardConfig,
  AlertConfig,
  ComponentStyleConfig,
} from '@/lib/types/styling-config';

// Re-export for backward compatibility
export { adjustColorBrightness } from '@/lib/utils/colors';

/**
 * Generate enriched design tokens from base styling config
 * Expands basic config into comprehensive design system
 */
export function generateEnrichedTokens(
  baseStyling: StylingConfig,
  userDescription: string,
  projectName?: string
): Partial<StylingConfig> {
  const colors = baseStyling.colorTheme;
  const typography = baseStyling.typography;
  const layout = baseStyling.layout;

  // ========== BRAND CONFIG ==========
  const brandConfig: BrandConfig = {
    designSystem: 'Shadcn/Tailwind',
    stylingFramework: 'Tailwind CSS',
    brandName: projectName || 'Your App',
    logoAssets: {
      primary: '/logo.svg',
      favicon: '/favicon.ico',
      dark: '/logo-dark.svg',
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  };

  // ========== SEMANTIC COLORS ==========
  const semanticColors: SemanticColors = {
    textDefault: colors.mode === 'dark' ? '#ffffff' : '#0a0a0a',
    textSecondary: colors.muted || '#6b7280',
    textDisabled: adjustColor(colors.muted || '#6b7280', 0.5),
    textOnColor: '#ffffff',

    bgDefault: colors.background || '#ffffff',
    bgSurface: colors.backgroundSecondary || '#f9fafb',
    bgElevated: colors.backgroundTertiary || '#f3f4f6',
    bgOverlay: 'rgba(0, 0, 0, 0.5)',

    borderDefault: colors.border || '#e5e7eb',
    borderSubtle: adjustColor(colors.border || '#e5e7eb', 0.3),
    borderStrong: adjustColor(colors.border || '#e5e7eb', -0.3),

    interactive: colors.primary,
    interactiveHover: adjustColor(colors.primary, -0.1),
    interactiveActive: adjustColor(colors.primary, -0.2),
  };

  // ========== DARK MODE OVERRIDES ==========
  const darkModeOverrides: DarkModeOverrides | undefined = colors.mode === 'dark' ? {
    bgDefault: 'hsl(222.2 84% 4.9%)',
    bgSurface: 'hsl(217.2 32.6% 17.5%)',
    textDefault: 'hsl(210 40% 98%)',
    borderDefault: 'hsl(217.2 32.6% 17.5%)',
  } : undefined;

  // ========== SHADOW SYSTEM ==========
  const shadows: ShadowSystem = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  };

  // ========== ENHANCED TYPOGRAPHY ==========
  const fontSizes: FontSizes = {
    xs: '0.75rem',
    sm: '0.875rem',
    base: typography.scale === 'small' ? '0.875rem' : typography.scale === 'large' ? '1.125rem' : '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    h1: typography.scale === 'small' ? '2rem' : typography.scale === 'large' ? '3.5rem' : '3rem',
    h2: typography.scale === 'small' ? '1.5rem' : typography.scale === 'large' ? '2.5rem' : '2rem',
    h3: typography.scale === 'small' ? '1.25rem' : typography.scale === 'large' ? '2rem' : '1.5rem',
    h4: '1.25rem',
    h5: '1.125rem',
    h6: '1rem',
  };

  const lineHeights: LineHeights = {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  };

  const fontWeights: FontWeights = {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: typography.headingWeight || 700,
    extrabold: 800,
    black: 900,
  };

  const enhancedTypography: EnhancedTypographyConfig = {
    ...typography,
    fontSizes,
    lineHeights,
    fontWeights,
    fontFamilyPrimary: typography.fontFamily === 'custom' && typography.customFont
      ? `'${typography.customFont}', sans-serif`
      : `'${typography.fontFamily}', sans-serif`,
    fontFamilyHeading: `'${typography.fontFamily}', sans-serif`,
  };

  // ========== SPACING CONFIG ==========
  const spacingScale: SpacingScale = {
    '0': '0',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '32': '8rem',
  };

  const layoutSpacing: LayoutSpacing = {
    containerMax: layout.maxWidth === 'full' ? '100%' : layout.maxWidth,
    sectionPadding: layout.spacing === 'compact' ? '2rem' : layout.spacing === 'spacious' ? '6rem' : '4rem',
    componentGap: layout.spacing === 'compact' ? '0.5rem' : layout.spacing === 'spacious' ? '1.5rem' : '1rem',
    gridGutter: layout.spacing === 'compact' ? '1rem' : layout.spacing === 'spacious' ? '2rem' : '1.5rem',
  };

  const spacingConfig: SpacingConfig = {
    scale: spacingScale,
    layout: layoutSpacing,
  };

  // ========== BORDERING CONFIG ==========
  const borderRadiusMap: Record<string, BorderRadiusScale> = {
    none: {
      none: '0', sm: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0', full: '0',
    },
    small: {
      none: '0', sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', '2xl': '0.75rem', '3xl': '1rem', full: '9999px',
    },
    medium: {
      none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', full: '9999px',
    },
    large: {
      none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem', '3xl': '2rem', full: '9999px',
    },
    full: {
      none: '0', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem', full: '9999px',
    },
  };

  const borderWidths: BorderWidths = {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '4px',
  };

  const borderingConfig: BorderingConfig = {
    radiusScale: borderRadiusMap[layout.borderRadius || 'medium'],
    borderWidths,
  };

  // ========== TRANSITION CONFIG ==========
  const durations: TransitionDurations = {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  };

  const easings: EasingFunctions = {
    default: 'ease-in-out',
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  const zIndices: ZIndices = {
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    overlay: 400,
    modal: 500,
    popover: 600,
    toast: 1000,
  };

  const transitionConfig: TransitionConfig = {
    durations,
    easings,
    zIndices,
  };

  // ========== COMPONENT CONFIGS ==========

  // Button Config
  const buttonVariants: ButtonVariants = {
    primary: {
      bg: colors.primary,
      text: '#ffffff',
      border: colors.primary,
      hoverBg: adjustColor(colors.primary, -0.1),
      activeBg: adjustColor(colors.primary, -0.2),
    },
    secondary: {
      bg: colors.secondary || '#64748b',
      text: '#ffffff',
      border: colors.secondary || '#64748b',
      hoverBg: adjustColor(colors.secondary || '#64748b', -0.1),
      activeBg: adjustColor(colors.secondary || '#64748b', -0.2),
    },
    outline: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.border || '#e5e7eb',
      hoverBg: colors.backgroundSecondary || '#f9fafb',
      activeBg: colors.backgroundTertiary || '#f3f4f6',
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: 'transparent',
      hoverBg: colors.backgroundSecondary || '#f9fafb',
      activeBg: colors.backgroundTertiary || '#f3f4f6',
    },
    destructive: {
      bg: colors.destructive || '#ef4444',
      text: '#ffffff',
      border: colors.destructive || '#ef4444',
      hoverBg: adjustColor(colors.destructive || '#ef4444', -0.1),
      activeBg: adjustColor(colors.destructive || '#ef4444', -0.2),
    },
  };

  const buttonSizes: ButtonSizes = {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: fontSizes.sm,
      height: '2rem',
    },
    md: {
      padding: '0.625rem 1.25rem',
      fontSize: fontSizes.base,
      height: '2.5rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: fontSizes.lg,
      height: '3rem',
    },
  };

  const buttonConfig: ButtonConfig = {
    variants: buttonVariants,
    sizes: buttonSizes,
    defaultVariant: 'primary',
    defaultSize: 'md',
  };

  // Input Config
  const inputConfig: InputConfig = {
    defaultBg: colors.background || '#ffffff',
    defaultBorder: colors.border || '#e5e7eb',
    focusBorder: colors.primary,
    focusRing: `0 0 0 2px ${adjustColor(colors.primary, 0.7)}`,
    disabledBg: colors.muted || '#f3f4f6',
    disabledText: adjustColor(colors.muted || '#6b7280', -0.3),
    errorBorder: colors.destructive || '#ef4444',
    successBorder: colors.success || '#10b981',
    padding: '0.5rem 0.75rem',
    fontSize: fontSizes.base,
    height: '2.5rem',
    borderRadius: borderRadiusMap[layout.borderRadius || 'medium'].md,
  };

  // Card Config
  const cardConfig: CardConfig = {
    defaultBg: colors.backgroundSecondary || '#f9fafb',
    defaultBorder: colors.border || '#e5e7eb',
    hoverBg: colors.backgroundTertiary || '#f3f4f6',
    hoverBorder: adjustColor(colors.border || '#e5e7eb', -0.2),
    padding: layout.spacing === 'compact' ? '1rem' : layout.spacing === 'spacious' ? '2rem' : '1.5rem',
    borderRadius: borderRadiusMap[layout.borderRadius || 'medium'].lg,
    shadow: shadows.md,
    hoverShadow: shadows.lg,
  };

  // Alert Config
  const alertConfig: AlertConfig = {
    info: {
      bg: adjustColor(colors.info || '#3b82f6', 0.9),
      border: colors.info || '#3b82f6',
      text: adjustColor(colors.info || '#3b82f6', -0.5),
      icon: colors.info || '#3b82f6',
    },
    success: {
      bg: adjustColor(colors.success || '#10b981', 0.9),
      border: colors.success || '#10b981',
      text: adjustColor(colors.success || '#10b981', -0.5),
      icon: colors.success || '#10b981',
    },
    warning: {
      bg: adjustColor(colors.warning || '#f59e0b', 0.9),
      border: colors.warning || '#f59e0b',
      text: adjustColor(colors.warning || '#f59e0b', -0.5),
      icon: colors.warning || '#f59e0b',
    },
    error: {
      bg: adjustColor(colors.destructive || '#ef4444', 0.9),
      border: colors.destructive || '#ef4444',
      text: adjustColor(colors.destructive || '#ef4444', -0.5),
      icon: colors.destructive || '#ef4444',
    },
    padding: '1rem',
    borderRadius: borderRadiusMap[layout.borderRadius || 'medium'].md,
    borderWidth: '1px',
  };

  const componentStyleConfig: ComponentStyleConfig = {
    button: buttonConfig,
    input: inputConfig,
    card: cardConfig,
    alert: alertConfig,
  };

  // ========== RETURN ENRICHED CONFIG ==========
  return {
    ...baseStyling,
    brand: brandConfig,
    enhancedColors: {
      ...colors,
      semantic: semanticColors,
      darkMode: darkModeOverrides,
      shadows,
    },
    enhancedTypography,
    spacing: spacingConfig,
    bordering: borderingConfig,
    transitions: transitionConfig,
    components: componentStyleConfig,
  };
}
