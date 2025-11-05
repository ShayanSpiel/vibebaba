// @ts-nocheck
// lib/langgraph/nodes/ux-node.ts
// import 'server-only'; // Commented out for LangGraph Studio compatibility
import { generateWithFallback } from '@/lib/ai';
import { gatherBackgroundContext } from '@/lib/mcp-background-helper';
import { isMCPEnabled } from '@/lib/mcp-config';
import { selectDesignSystem } from '@/lib/design-systems/index';
import { getConversationContext, addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';
import type {
  StylingConfig,
  BrandConfig,
  SemanticColors,
  DarkModeOverrides,
  ShadowSystem,
  EnhancedColorTheme,
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
import type { AppGenState, DesignInspiration } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress } from '../events';
import { getMemoryService } from '@/lib/services/memory-service';
import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { extractAndParseJson } from '../utils/json-parser';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { analyzeDesignInspiration } from '@/lib/services/design-inspiration';
import { getRelevantImages } from '@/lib/unsplash-images';

// Enable accessibility plugin for contrast validation
extend([a11yPlugin]);

/**
 * Assign features to specific routes/files for proper placement
 * Prevents issues like "blog editor on home page"
 */
async function assignFeaturesToRoutes(
  features: any[],
  appType: string,
  userDescription: string
): Promise<Array<{featureId: string; route: string; file: string; purpose: string}>> {
  console.log('[UX] 🗺️  Assigning features to routes...');

  if (!features || features.length === 0) {
    console.log('[UX] No features to assign');
    return [];
  }

  // Simple rule-based assignment for common patterns
  const mapping: Array<{featureId: string; route: string; file: string; purpose: string}> = [];
  let homeAssigned = false;

  for (const feature of features) {
    const featureLower = feature.name.toLowerCase();
    const isHighPriority = feature.priority === 'high';
    const isMVP = feature.included_in_mvp;

    // Rule 1: Auth features → dedicated pages
    if (featureLower.includes('auth') || featureLower.includes('login') || featureLower.includes('register')) {
      if (featureLower.includes('login')) {
        mapping.push({
          featureId: feature.id,
          route: '/login',
          file: 'src/app/login/page.tsx',
          purpose: 'User login page'
        });
      }
      if (featureLower.includes('register') || featureLower.includes('sign up')) {
        mapping.push({
          featureId: feature.id,
          route: '/register',
          file: 'src/app/register/page.tsx',
          purpose: 'User registration page'
        });
      }
      continue;
    }

    // Rule 2: Admin/Dashboard features → /dashboard
    if (featureLower.includes('admin') || featureLower.includes('dashboard') || featureLower.includes('manage')) {
      mapping.push({
        featureId: feature.id,
        route: '/dashboard',
        file: 'src/app/dashboard/page.tsx',
        purpose: `Admin dashboard for ${feature.name.toLowerCase()}`
      });
      continue;
    }

    // Rule 3: Settings/Profile → dedicated pages
    if (featureLower.includes('settings')) {
      mapping.push({
        featureId: feature.id,
        route: '/settings',
        file: 'src/app/settings/page.tsx',
        purpose: 'Application settings'
      });
      continue;
    }

    if (featureLower.includes('profile')) {
      mapping.push({
        featureId: feature.id,
        route: '/profile',
        file: 'src/app/profile/page.tsx',
        purpose: 'User profile page'
      });
      continue;
    }

    // Rule 4: First high-priority, included-in-MVP feature → home page
    if (isHighPriority && isMVP && !homeAssigned) {
      mapping.push({
        featureId: feature.id,
        route: '/',
        file: 'src/app/page.tsx',
        purpose: `Main ${feature.name} page`
      });
      homeAssigned = true;
      continue;
    }

    // Rule 5: Other MVP features → /feature-slug
    if (isMVP) {
      const slug = feature.id;
      mapping.push({
        featureId: feature.id,
        route: `/${slug}`,
        file: `src/app/${slug}/page.tsx`,
        purpose: feature.description || feature.name
      });
    }
  }

  console.log(`[UX] ✅ Assigned ${mapping.length} features to routes`);
  mapping.forEach(m => {
    console.log(`[UX]   • ${m.route} ← ${features.find(f => f.id === m.featureId)?.name}`);
  });

  return mapping;
}

/**
 * Generate contextual styling defaults based on app type and user description
 */
function getContextualStylingDefaults(
  appContext: any,
  userDescription: string
): Partial<StylingConfig> {
  const defaults: Partial<StylingConfig> = {};

  // ========== LAYOUT DIRECTION ==========
  // Detect RTL languages (Arabic, Hebrew, Urdu, Farsi)
  const rtlPatterns = [
    /[\u0600-\u06FF]/,  // Arabic
    /[\u0590-\u05FF]/,  // Hebrew
    /[\u0750-\u077F]/,  // Arabic Supplement
  ];

  const isRTL = rtlPatterns.some(pattern => pattern.test(userDescription));

  if (isRTL) {
    defaults.layout = {
      direction: 'rtl',
      maxWidth: '1200px',
      spacing: 'normal'
    };
  }

  // ========== COLOR THEME ==========
  // Detect color preferences from keywords
  const colorKeywords: Record<string, string> = {
    'blue': '#1890ff',
    'green': '#52c41a',
    'red': '#f5222d',
    'orange': '#fa8c16',
    'purple': '#722ed1',
    'pink': '#eb2f96',
    'yellow': '#fadb14',
    'cyan': '#13c2c2',
    'geekblue': '#2f54eb',
    'lime': '#a0d911',
    'gold': '#faad14',
    'magenta': '#eb2f96'
  };

  for (const [keyword, color] of Object.entries(colorKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.colorTheme = {
        primary: color,
        mode: 'light'
      };
      break;
    }
  }

  // Dark mode detection
  const darkKeywords = ['dark', 'night', 'black', 'midnight'];
  const hasDarkKeyword = darkKeywords.some(kw => userDescription.toLowerCase().includes(kw));

  if (hasDarkKeyword || appContext?.visualTone === 'dark') {
    defaults.colorTheme = {
      ...defaults.colorTheme,
      primary: defaults.colorTheme?.primary || '#1890ff',
      mode: 'dark'
    };
  }

  // ========== TYPOGRAPHY ==========
  // Detect font preferences from keywords
  const fontKeywords: Record<string, any> = {
    'modern': 'Inter',
    'elegant': 'Montserrat',
    'playful': 'Poppins',
    'professional': 'Roboto',
    'clean': 'Inter',
    'corporate': 'Open Sans'
  };

  for (const [keyword, font] of Object.entries(fontKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.typography = {
        fontFamily: font as any,
        scale: 'normal',
        headingWeight: 700
      };
      break;
    }
  }

  // ========== ANIMATIONS ==========
  // Design style-based animation defaults (takes precedence)
  if (appContext?.designStyle) {
    switch (appContext.designStyle) {
      case 'minimalist':
      case 'corporate':
        defaults.animations = {
          enabled: true,
          intensity: 'none',
          transitions: true,
          pageTransitions: false,
          hoverEffects: false
        };
        break;
      case 'playful':
      case 'creative':
        defaults.animations = {
          enabled: true,
          intensity: 'heavy',
          transitions: true,
          pageTransitions: true,
          hoverEffects: true
        };
        break;
      case 'modern':
      case 'tech':
        defaults.animations = {
          enabled: true,
          intensity: 'moderate',
          transitions: true,
          pageTransitions: true,
          hoverEffects: true
        };
        break;
      case 'professional':
      case 'elegant':
        defaults.animations = {
          enabled: true,
          intensity: 'subtle',
          transitions: true,
          pageTransitions: false,
          hoverEffects: true
        };
        break;
    }
  }
  // Fallback: App type-based animation defaults (if no designStyle)
  else {
    const minimalAnimationTypes = ['dashboard', 'admin-panel', 'tool', 'saas-app'];
    const heavyAnimationTypes = ['portfolio', 'creative', 'agency', 'game'];

    if (minimalAnimationTypes.includes(appContext?.appType)) {
      defaults.animations = {
        enabled: true,
        intensity: 'none',
        transitions: true,
        pageTransitions: false,
        hoverEffects: false
      };
    } else if (heavyAnimationTypes.includes(appContext?.appType)) {
      defaults.animations = {
        enabled: true,
        intensity: 'heavy',
        transitions: true,
        pageTransitions: true,
        hoverEffects: true
      };
    }
  }

  // Detect animation preferences from keywords
  const animationKeywords: Record<string, any> = {
    'minimal': 'none',
    'no animation': 'none',
    'subtle': 'subtle',
    'smooth': 'moderate',
    'animated': 'moderate',
    'dynamic': 'heavy'
  };

  for (const [keyword, intensity] of Object.entries(animationKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.animations = {
        enabled: intensity !== 'none',
        intensity: intensity as any,
        transitions: true,
        pageTransitions: intensity === 'heavy',
        hoverEffects: intensity !== 'none'
      };
      break;
    }
  }

  // ========== ICONOGRAPHY ==========
  // App type-based icon style defaults
  if (appContext?.appType === 'dashboard' || appContext?.appType === 'tool') {
    defaults.iconography = {
      style: 'outlined',
      source: 'lucide',
      size: 'medium'
    };
  } else if (appContext?.appType === 'creative' || appContext?.appType === 'portfolio') {
    defaults.iconography = {
      style: 'filled',
      source: 'lucide',
      size: 'large'
    };
  }

  // ========== LAYOUT SPACING ==========
  // Compact for dashboards, spacious for marketing sites
  if (appContext?.appType === 'dashboard' || appContext?.appType === 'tool') {
    defaults.layout = {
      ...defaults.layout,
      direction: defaults.layout?.direction || 'ltr',
      maxWidth: (defaults.layout?.maxWidth || '1400px') as any,
      spacing: 'compact'
    };
  } else if (appContext?.appType === 'landing-page' || appContext?.appType === 'portfolio') {
    defaults.layout = {
      ...defaults.layout,
      direction: defaults.layout?.direction || 'ltr',
      maxWidth: (defaults.layout?.maxWidth || '1200px') as any,
      spacing: 'spacious'
    };
  }

  return defaults;
}

/**
 * Merge user preferences with contextual defaults
 */
function mergeWithDefaults(
  extracted: Partial<StylingConfig>,
  contextual: Partial<StylingConfig>
): StylingConfig {
  return {
    colorTheme: {
      primary: extracted.colorTheme?.primary || contextual.colorTheme?.primary || '#1890ff',
      secondary: extracted.colorTheme?.secondary || contextual.colorTheme?.secondary,
      accent: extracted.colorTheme?.accent || contextual.colorTheme?.accent,
      mode: extracted.colorTheme?.mode || contextual.colorTheme?.mode || 'light'
    },
    layout: {
      direction: extracted.layout?.direction || contextual.layout?.direction || 'ltr',
      maxWidth: (extracted.layout?.maxWidth || contextual.layout?.maxWidth || '1200px') as any,
      spacing: extracted.layout?.spacing || contextual.layout?.spacing || 'normal'
    },
    typography: {
      fontFamily: (extracted.typography?.fontFamily || contextual.typography?.fontFamily || 'Inter') as any,
      customFont: extracted.typography?.customFont || contextual.typography?.customFont,
      scale: extracted.typography?.scale || contextual.typography?.scale || 'normal',
      headingWeight: extracted.typography?.headingWeight || contextual.typography?.headingWeight || 700
    },
    iconography: {
      style: extracted.iconography?.style || contextual.iconography?.style || 'outlined',
      source: extracted.iconography?.source || contextual.iconography?.source || 'lucide',
      size: extracted.iconography?.size || contextual.iconography?.size || 'medium'
    },
    animations: {
      enabled: extracted.animations?.enabled ?? contextual.animations?.enabled ?? true,
      intensity: extracted.animations?.intensity || contextual.animations?.intensity || 'subtle',
      transitions: extracted.animations?.transitions ?? contextual.animations?.transitions ?? true,
      pageTransitions: extracted.animations?.pageTransitions ?? contextual.animations?.pageTransitions ?? false,
      hoverEffects: extracted.animations?.hoverEffects ?? contextual.animations?.hoverEffects ?? true
    }
  };
}

/**
 * Merge design inspiration from screenshot with AI-generated styling config
 * User-specified colors take precedence over inspiration
 */
function mergeDesignInspiration(
  stylingConfig: Partial<StylingConfig>,
  inspiration: DesignInspiration
): Partial<StylingConfig> {
  console.log('[UX] 🎨 Merging design inspiration with styling config...');

  // Determine mode from inspiration background
  const inspirationMode = inspiration.colors.background === '#FFFFFF' ||
    colord(inspiration.colors.background).isLight() ? 'light' : 'dark';

  return {
    ...stylingConfig,
    colorTheme: {
      // User-specified colors take precedence
      primary: stylingConfig.colorTheme?.primary || inspiration.colors.primary,
      secondary: stylingConfig.colorTheme?.secondary || inspiration.colors.secondary,
      accent: stylingConfig.colorTheme?.accent || inspiration.colors.accent,
      background: stylingConfig.colorTheme?.background || inspiration.colors.background,
      backgroundSecondary: stylingConfig.colorTheme?.backgroundSecondary ||
        (inspirationMode === 'light' ? '#F9FAFB' : '#1A1A1A'),
      backgroundTertiary: stylingConfig.colorTheme?.backgroundTertiary ||
        (inspirationMode === 'light' ? '#F3F4F6' : '#2A2A2A'),
      // Keep existing semantic colors (not in inspiration)
      border: stylingConfig.colorTheme?.border,
      muted: stylingConfig.colorTheme?.muted,
      destructive: stylingConfig.colorTheme?.destructive,
      success: stylingConfig.colorTheme?.success,
      warning: stylingConfig.colorTheme?.warning,
      info: stylingConfig.colorTheme?.info,
      mode: stylingConfig.colorTheme?.mode || inspirationMode
    },
    typography: {
      fontFamily: (stylingConfig.typography?.fontFamily || inspiration.typography.headingFont) as any,
      customFont: stylingConfig.typography?.customFont,
      scale: stylingConfig.typography?.scale || 'normal',
      headingWeight: stylingConfig.typography?.headingWeight || 700,
      bodyWeight: stylingConfig.typography?.bodyWeight || 400,
      weights: stylingConfig.typography?.weights
    },
    layout: {
      direction: stylingConfig.layout?.direction || 'ltr',
      maxWidth: stylingConfig.layout?.maxWidth || '1200px' as any,
      spacing: stylingConfig.layout?.spacing || 'normal',
      borderRadius: (stylingConfig.layout?.borderRadius ||
        (inspiration.borderRadius === '0px' ? 'none' :
         inspiration.borderRadius === '4px' ? 'small' :
         inspiration.borderRadius === '8px' ? 'medium' :
         inspiration.borderRadius === '12px' ? 'large' : 'medium')) as any
    },
    iconography: stylingConfig.iconography,
    animations: stylingConfig.animations
  };
}

/**
 * Helper: Adjust color brightness (lightness)
 * @param hex Hex color string
 * @param amount -1 to 1 (negative = darker, positive = lighter)
 */
function adjustColorBrightness(hex: string, amount: number): string {
  try {
    const color = colord(hex);
    if (amount > 0) {
      return color.lighten(amount).toHex();
    } else if (amount < 0) {
      return color.darken(Math.abs(amount)).toHex();
    }
    return hex;
  } catch {
    return hex;
  }
}

/**
 * Generate enriched design tokens from base styling config
 * Expands basic config into comprehensive design system
 */
function generateEnrichedTokens(
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
    textDisabled: adjustColorBrightness(colors.muted || '#6b7280', 0.5),
    textOnColor: '#ffffff',

    bgDefault: colors.background || '#ffffff',
    bgSurface: colors.backgroundSecondary || '#f9fafb',
    bgElevated: colors.backgroundTertiary || '#f3f4f6',
    bgOverlay: 'rgba(0, 0, 0, 0.5)',

    borderDefault: colors.border || '#e5e7eb',
    borderSubtle: adjustColorBrightness(colors.border || '#e5e7eb', 0.3),
    borderStrong: adjustColorBrightness(colors.border || '#e5e7eb', -0.3),

    interactive: colors.primary,
    interactiveHover: adjustColorBrightness(colors.primary, -0.1),
    interactiveActive: adjustColorBrightness(colors.primary, -0.2),
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
      hoverBg: adjustColorBrightness(colors.primary, -0.1),
      activeBg: adjustColorBrightness(colors.primary, -0.2),
    },
    secondary: {
      bg: colors.secondary || '#64748b',
      text: '#ffffff',
      border: colors.secondary || '#64748b',
      hoverBg: adjustColorBrightness(colors.secondary || '#64748b', -0.1),
      activeBg: adjustColorBrightness(colors.secondary || '#64748b', -0.2),
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
      hoverBg: adjustColorBrightness(colors.destructive || '#ef4444', -0.1),
      activeBg: adjustColorBrightness(colors.destructive || '#ef4444', -0.2),
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
    focusRing: `0 0 0 2px ${adjustColorBrightness(colors.primary, 0.7)}`,
    disabledBg: colors.muted || '#f3f4f6',
    disabledText: adjustColorBrightness(colors.muted || '#6b7280', -0.3),
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
    hoverBorder: adjustColorBrightness(colors.border || '#e5e7eb', -0.2),
    padding: layout.spacing === 'compact' ? '1rem' : layout.spacing === 'spacious' ? '2rem' : '1.5rem',
    borderRadius: borderRadiusMap[layout.borderRadius || 'medium'].lg,
    shadow: shadows.md,
    hoverShadow: shadows.lg,
  };

  // Alert Config
  const alertConfig: AlertConfig = {
    info: {
      bg: adjustColorBrightness(colors.info || '#3b82f6', 0.9),
      border: colors.info || '#3b82f6',
      text: adjustColorBrightness(colors.info || '#3b82f6', -0.5),
      icon: colors.info || '#3b82f6',
    },
    success: {
      bg: adjustColorBrightness(colors.success || '#10b981', 0.9),
      border: colors.success || '#10b981',
      text: adjustColorBrightness(colors.success || '#10b981', -0.5),
      icon: colors.success || '#10b981',
    },
    warning: {
      bg: adjustColorBrightness(colors.warning || '#f59e0b', 0.9),
      border: colors.warning || '#f59e0b',
      text: adjustColorBrightness(colors.warning || '#f59e0b', -0.5),
      icon: colors.warning || '#f59e0b',
    },
    error: {
      bg: adjustColorBrightness(colors.destructive || '#ef4444', 0.9),
      border: colors.destructive || '#ef4444',
      text: adjustColorBrightness(colors.destructive || '#ef4444', -0.5),
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

/**
 * Validate and fix color contrast to meet WCAG AA standards
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param minContrast - Minimum contrast ratio (4.5 for normal text, 3.0 for large text)
 * @returns Adjusted foreground color if needed
 */
function ensureContrast(
  foreground: string,
  background: string,
  minContrast: number = 4.5
): string {
  const fg = colord(foreground);
  const bg = colord(background);

  let currentContrast = fg.contrast(bg);

  console.log(`[UX] 🎨 Checking contrast: ${foreground} on ${background} = ${currentContrast.toFixed(2)}:1`);

  if (currentContrast >= minContrast) {
    console.log(`[UX] ✓ Contrast OK (${currentContrast.toFixed(2)}:1 >= ${minContrast}:1)`);
    return foreground;
  }

  // Try adjusting lightness
  let adjustedFg = fg;
  const isDark = bg.isDark();

  // If background is dark, lighten foreground; if light, darken foreground
  for (let step = 0; step < 20; step++) {
    adjustedFg = isDark
      ? adjustedFg.lighten(0.05)
      : adjustedFg.darken(0.05);

    currentContrast = adjustedFg.contrast(bg);

    if (currentContrast >= minContrast) {
      const adjusted = adjustedFg.toHex();
      console.log(`[UX] ✓ Adjusted ${foreground} → ${adjusted} (contrast: ${currentContrast.toFixed(2)}:1)`);
      return adjusted;
    }
  }

  // Fallback: use pure white or black
  const fallback = isDark ? '#ffffff' : '#000000';
  console.log(`[UX] ⚠️ Using fallback color: ${fallback} (original ${foreground} failed validation)`);
  return fallback;
}

export async function uxNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('[UX] 🚀 Starting UX node (Design System)');
    console.log(`[UX] 🎨 App Type: ${state.context?.appType}, Style: ${state.context?.designStyle}`);

    // CONVERSATION MEMORY: Get conversation context for multi-turn editing
    console.log('[UX] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[UX] 💬 Conversation context loaded - enabling multi-turn editing');
    }

    // Emit thinking process before starting
    emitNodeStart('ux', state, {
      userInput: state.plan || state.userDescription,
      interpretation: 'Analyzing the product plan to select the best design system and extract styling preferences.',
      plan: 'I will select the appropriate design system, extract user styling preferences, and gather any relevant background context. Frontend AI will decide which components to use.'
    });

    // Step 1: Design System Selection
    console.log('[UX] 🎨 Selecting design system...');
    const selectedDesignSystem = selectDesignSystem({
      appType: state.context?.appType,
      userDescription: state.userDescription,
      designStyle: state.context?.designStyle
    });
    console.log(`[UX] ✅ Selected design system: ${selectedDesignSystem}`);

    // Step 2: Styling Extraction + Memory Fetch (PARALLEL OPTIMIZATION)
    console.log('[UX] 📝 Extracting styling preferences...');
    emitProgress('ux', state.projectId, 'Extracting styling preferences...');

    // OPTIMIZATION: Parallel execution of styling extraction AND memory fetch
    const memoryService = getMemoryService();
    const [stylingResult, userPreferences] = await Promise.all([
      generateWithLogging({
        prompt: `${conversationContext}

Create STUNNING UI styling from: "${state.userDescription}"

Visual Tone: ${state.context?.visualTone || 'auto'}

Extract and design COMPLETE styling config:
{
  "colorTheme": {
    "mode": "light|dark",
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "backgroundSecondary": "#hex",
    "backgroundTertiary": "#hex",
    "border": "#hex",
    "muted": "#hex",
    "destructive": "#hex",
    "success": "#hex",
    "warning": "#hex",
    "info": "#hex"
  },
  "typography": {
    "fontFamily": "Inter|Roboto|Poppins|Montserrat|Open Sans|Lato|Playfair Display|Space Grotesk",
    "scale": "small|normal|large",
    "headingWeight": 400|500|600|700|800|900,
    "bodyWeight": 300|400|500,
    "weights": [300, 400, 500, 600, 700, 800, 900]
  },
  "iconography": {
    "style": "outlined|filled|rounded",
    "source": "lucide|heroicons|material-icons",
    "size": "small|medium|large"
  },
  "animations": {
    "enabled": true,
    "intensity": "none|subtle|moderate|heavy",
    "transitions": true|false,
    "pageTransitions": true|false,
    "hoverEffects": true|false
  },
  "layout": {
    "direction": "ltr",
    "maxWidth": "1200px|1400px|1600px",
    "spacing": "compact|normal|spacious",
    "borderRadius": "none|small|medium|large|full"
  }
}

🚨 CRITICAL - COLOR EXTRACTION RULES:

1. MODE DETECTION (REQUIRED):
   "dark" keyword → mode: "dark"
   "light" keyword → mode: "light"
   No keyword → mode: "light"

2. PRIMARY COLOR (REQUIRED - First color mentioned):
   "teal" → primary: "#14B8A6" (teal-500)
   "blue" → primary: "#3B82F6" (blue-500)
   "green" → primary: "#22C55E" (green-500)
   "red" → primary: "#EF4444" (red-500)
   "purple" → primary: "#A855F7" (purple-500)
   "amber" → primary: "#F59E0B" (amber-500)
   "orange" → primary: "#F97316" (orange-500)

3. SECONDARY COLOR (REQUIRED - Second color OR neutral):
   If user mentions 2 colors: "blue and grey" → primary: blue, secondary: grey
   If only 1 color mentioned: Use neutral grey for secondary
   "grey/gray" → "#64748B" (slate-500)
   "dark grey" → "#374151" (gray-700)

4. ACCENT COLOR (REQUIRED - Third color OR complement):
   If user mentions 3 colors: use the third
   If only 1-2 colors: Choose complementary color
   Example: primary=teal → accent=amber (warm complement)

5. BACKGROUND LAYERS (ALWAYS NEUTRAL):
   Light mode: background="#FFFFFF", backgroundSecondary="#F9FAFB", backgroundTertiary="#F3F4F6"
   Dark mode: background="#0A0A0A", backgroundSecondary="#1A1A1A", backgroundTertiary="#2A2A2A"
   ⚠️ NEVER use saturated colors for backgrounds (no blue/purple backgrounds!)

REQUIREMENTS:
- Colors: Ensure WCAG AA contrast (4.5:1 ratio), choose saturated distinct colors
- Colors: Border should be subtle (low saturation), muted should be gray-toned
- Colors: Semantic colors - destructive (red), success (green), warning (yellow/orange), info (blue)
- Typography: Match font to app vibe, include weights array for all needed weights (e.g., [400, 600, 700] for body + headings)
- Typography: bodyWeight for regular text (300-500), headingWeight for titles (400-900)
- Iconography: lucide (default), heroicons (Apple-style), material-icons (Google Material Design)
- Animations: Subtle (professional), Moderate (landing pages), Heavy (creative/playful)
- Layout: borderRadius - none (sharp/modern), small (subtle), medium (balanced), large (friendly), full (pills/circles)

Return ONLY valid JSON.`,
        projectId: state.projectId,
        nodeName: 'ux',
        callType: 'analysis',
        estimatedTokens: estimateTokens(`Extract styling from...`),
        attempt: 1
      }),
      state.userId ? memoryService.getUserPreferences(state.userId) : Promise.resolve(null)
    ]);

    // Parse and merge styling config
    let stylingConfig: Partial<StylingConfig> | null = null;
    try {
      const extractedStyling = extractAndParseJson(stylingResult, {});
      const contextualDefaults = getContextualStylingDefaults(state.context, state.userDescription);
      stylingConfig = mergeWithDefaults(extractedStyling, contextualDefaults);
      console.log('[UX] Styling config extracted:', JSON.stringify(stylingConfig, null, 2));
    } catch (error) {
      console.warn('[UX] Failed to extract styling config, using contextual defaults:', error);
      stylingConfig = getContextualStylingDefaults(state.context, state.userDescription) as StylingConfig;
    }

    // Step 2.5: Design Inspiration Analysis (if design reference uploaded)
    const { uploadedFiles } = state;
    const designRefFiles = uploadedFiles?.filter(
      f => f.purpose === 'design-reference' || f.purpose === 'both'
    ) || [];

    let designInspiration: DesignInspiration | null = null;

    if (designRefFiles.length > 0) {
      console.log('[UX] 🎨 Analyzing design inspiration from uploaded screenshot...');
      emitProgress('ux', state.projectId, 'Analyzing design inspiration from screenshot...');

      designInspiration = await analyzeDesignInspiration({
        imageUrl: designRefFiles[0].fileUrl,
        context: {
          appType: state.context?.appType || 'web-app',
          designStyle: state.context?.designStyle,
          visualTone: state.context?.visualTone
        }
      });

      if (designInspiration) {
        console.log('[UX] ✅ Design inspiration extracted successfully');
        console.log(`[UX]   - Quality: ${designInspiration.quality}/100`);
        console.log(`[UX]   - Primary color: ${designInspiration.colors.primary}`);
        console.log(`[UX]   - Font: ${designInspiration.typography.headingFont}`);

        // Merge with styling config (user preferences take precedence)
        stylingConfig = mergeDesignInspiration(stylingConfig!, designInspiration);
        console.log('[UX] ✅ Design inspiration merged with styling config');
      } else {
        console.log('[UX] ⚠️  Design inspiration analysis failed or quality too low, using AI-generated styles');
      }
    }

    // ✅ FIX: Validate color hierarchy (dark mode, primary vibrancy)
    if (stylingConfig?.colorTheme) {
      const userDesc = state.userDescription.toLowerCase();

      // Check if user requested dark mode
      if (userDesc.includes('dark') && stylingConfig.colorTheme.mode !== 'dark') {
        console.log('[UX] ⚠️ User requested "dark" but mode was light - fixing to dark');
        stylingConfig.colorTheme.mode = 'dark';
      }

      // Ensure primary color is vibrant (not gray/desaturated)
      if (stylingConfig.colorTheme.primary) {
        const { colord } = await import('colord');
        const primaryColor = colord(stylingConfig.colorTheme.primary);
        const hsl = primaryColor.toHsl();
        if (hsl.s < 30) {
          console.log('[UX] ⚠️ Primary color too desaturated (s=${hsl.s}) - using vibrant fallback');
          stylingConfig.colorTheme.primary = '#3b82f6'; // Vibrant blue fallback
        }
      }
    }

    // Validate and fix contrast for WCAG AA compliance
    if (stylingConfig?.colorTheme) {
      const mode = stylingConfig.colorTheme.mode || 'light';
      const background = mode === 'dark' ? '#0a0a0a' : '#ffffff';
      const colorTheme = stylingConfig.colorTheme;

      // ✅ FIX 34: Ensure ALL colors are present with defaults
      if (!colorTheme.primary) {
        colorTheme.primary = '#2563eb'; // Default blue
        console.log('[UX] ⚠️ Missing primary color - using default blue');
      }
      if (!colorTheme.secondary) {
        colorTheme.secondary = '#64748b'; // Default slate gray
        console.log('[UX] ⚠️ Missing secondary color - using default slate gray');
      }
      if (!colorTheme.accent) {
        colorTheme.accent = '#f59e0b'; // Default amber (complementary to blue)
        console.log('[UX] ⚠️ Missing accent color - using default amber');
      }

      // Background layers for proper visual hierarchy
      if (!colorTheme.background) {
        colorTheme.background = mode === 'dark' ? '#0a0a0a' : '#ffffff';
        console.log('[UX] ⚠️ Missing background color - using default');
      }
      if (!colorTheme.backgroundSecondary) {
        colorTheme.backgroundSecondary = mode === 'dark' ? '#1a1a1a' : '#f9fafb';
        console.log('[UX] ⚠️ Missing backgroundSecondary color - using default');
      }
      if (!colorTheme.backgroundTertiary) {
        colorTheme.backgroundTertiary = mode === 'dark' ? '#2a2a2a' : '#f3f4f6';
        console.log('[UX] ⚠️ Missing backgroundTertiary color - using default');
      }

      if (!colorTheme.border) {
        colorTheme.border = mode === 'dark' ? '#27272a' : '#e4e4e7'; // Subtle gray
        console.log('[UX] ⚠️ Missing border color - using default gray');
      }
      if (!colorTheme.muted) {
        colorTheme.muted = mode === 'dark' ? '#18181b' : '#f4f4f5'; // Background gray
        console.log('[UX] ⚠️ Missing muted color - using default gray');
      }
      if (!colorTheme.destructive) {
        colorTheme.destructive = '#ef4444'; // Default red
        console.log('[UX] ⚠️ Missing destructive color - using default red');
      }
      if (!colorTheme.success) {
        colorTheme.success = '#22c55e'; // Default green
        console.log('[UX] ⚠️ Missing success color - using default green');
      }
      if (!colorTheme.warning) {
        colorTheme.warning = '#f59e0b'; // Default amber/orange
        console.log('[UX] ⚠️ Missing warning color - using default amber');
      }
      if (!colorTheme.info) {
        colorTheme.info = '#3b82f6'; // Default blue
        console.log('[UX] ⚠️ Missing info color - using default blue');
      }

      console.log('[UX] 🔍 Validating color contrast for WCAG AA compliance (4.5:1 ratio)...');
      console.log('[UX] 🔍 Validating against all background layers: background, backgroundSecondary, backgroundTertiary');

      // Validate primary color against ALL background layers
      if (colorTheme.primary) {
        const originalPrimary = colorTheme.primary;
        // Validate against all background layers
        colorTheme.primary = ensureContrast(colorTheme.primary, colorTheme.background);
        colorTheme.primary = ensureContrast(colorTheme.primary, colorTheme.backgroundSecondary);
        colorTheme.primary = ensureContrast(colorTheme.primary, colorTheme.backgroundTertiary);
        if (originalPrimary !== colorTheme.primary) {
          console.log(`[UX] 🎨 Primary color adjusted for accessibility`);
        }
      }

      // Validate secondary color against ALL background layers
      if (colorTheme.secondary) {
        const originalSecondary = colorTheme.secondary;
        colorTheme.secondary = ensureContrast(colorTheme.secondary, colorTheme.background);
        colorTheme.secondary = ensureContrast(colorTheme.secondary, colorTheme.backgroundSecondary);
        colorTheme.secondary = ensureContrast(colorTheme.secondary, colorTheme.backgroundTertiary);
        if (originalSecondary !== colorTheme.secondary) {
          console.log(`[UX] 🎨 Secondary color adjusted for accessibility`);
        }
      }

      // Validate accent color against ALL background layers
      if (colorTheme.accent) {
        const originalAccent = colorTheme.accent;
        colorTheme.accent = ensureContrast(colorTheme.accent, colorTheme.background);
        colorTheme.accent = ensureContrast(colorTheme.accent, colorTheme.backgroundSecondary);
        colorTheme.accent = ensureContrast(colorTheme.accent, colorTheme.backgroundTertiary);
        if (originalAccent !== colorTheme.accent) {
          console.log(`[UX] 🎨 Accent color adjusted for accessibility`);
        }
      }

      // Validate destructive color (needs good contrast for error messages)
      if (colorTheme.destructive) {
        const originalDestructive = colorTheme.destructive;
        colorTheme.destructive = ensureContrast(colorTheme.destructive, background);
        if (originalDestructive !== colorTheme.destructive) {
          console.log(`[UX] 🎨 Destructive color adjusted for accessibility`);
        }
      }

      // Validate success color
      if (colorTheme.success) {
        const originalSuccess = colorTheme.success;
        colorTheme.success = ensureContrast(colorTheme.success, background);
        if (originalSuccess !== colorTheme.success) {
          console.log(`[UX] 🎨 Success color adjusted for accessibility`);
        }
      }

      // Validate warning color
      if (colorTheme.warning) {
        const originalWarning = colorTheme.warning;
        colorTheme.warning = ensureContrast(colorTheme.warning, background);
        if (originalWarning !== colorTheme.warning) {
          console.log(`[UX] 🎨 Warning color adjusted for accessibility`);
        }
      }

      // Validate info color
      if (colorTheme.info) {
        const originalInfo = colorTheme.info;
        colorTheme.info = ensureContrast(colorTheme.info, background);
        if (originalInfo !== colorTheme.info) {
          console.log(`[UX] 🎨 Info color adjusted for accessibility`);
        }
      }

      console.log('[UX] ✓ All colors validated and comply with WCAG AA standards');
      console.log('[UX] 🎨 Final palette:', {
        primary: colorTheme.primary,
        secondary: colorTheme.secondary,
        accent: colorTheme.accent,
        background: colorTheme.background,
        backgroundSecondary: colorTheme.backgroundSecondary,
        backgroundTertiary: colorTheme.backgroundTertiary,
        border: colorTheme.border,
        muted: colorTheme.muted,
        destructive: colorTheme.destructive,
        success: colorTheme.success,
        warning: colorTheme.warning,
        info: colorTheme.info,
        mode
      });
    }

    // #done Step 3: Use Background Context from State (already fetched by unified search)
    let backgroundContext = state.backgroundContext || null;
    if (backgroundContext) {
      console.log('[UX] ✅ Using background context from unified search');
    } else {
      console.log('[UX] ℹ️  No background context available');
    }

    // Step 4: Generate Design System Prompt (with styling config)
    const isDarkMode = state.context?.visualTone === 'dark' ||
                       state.userDescription.toLowerCase().includes('ai') ||
                       state.userDescription.toLowerCase().includes('dark');

    const duration = Date.now() - startTime;

    console.log(`[UX] ✅ Completed in ${duration}ms`);
    console.log(`[UX] 🎨 Design System: ${selectedDesignSystem}`);

    // Emit completion with detailed task information
    emitNodeComplete('ux', state, duration, {
      taskDescription: 'Selected design system and extracted styling preferences',
      success: true,
      output: {
        designSystem: selectedDesignSystem,
        designStyle: state.context?.designStyle,
        hasMCPContext: !!backgroundContext,
        hasStylingConfig: !!stylingConfig
      },
      summary: `Design system: ${selectedDesignSystem}. Style: ${state.context?.designStyle} with ${state.context?.visualTone} theme${backgroundContext ? '. Enhanced with MCP research.' : ''}. Frontend AI will decide components.`
    });

    // MEMORY: Store styling preferences for future use
    if (state.userId && stylingConfig) {
      // Store extracted styling preferences
      if (stylingConfig.colorTheme?.mode) {
        await memoryService.storeUserPreference(
          state.userId,
          'prefersDarkMode',
          stylingConfig.colorTheme.mode === 'dark'
        );
      }
      if (stylingConfig.typography?.fontFamily) {
        await memoryService.storeUserPreference(
          state.userId,
          'learningNotes',
          `Used font: ${stylingConfig.typography.fontFamily} on ${new Date().toISOString()}`
        );
      }
      console.log('[UX Node] Stored styling preferences in memory');
    }

    // MEMORY: Store design system selection for project
    if (state.projectId) {
      await memoryService.addObservation(
        `project_${state.projectId}`,
        `design_system: ${selectedDesignSystem}`
      );
    }

    // NEW: Feature-to-Route Mapping for proper feature placement
    let featureRouteMapping: Array<{featureId: string; route: string; file: string; purpose: string}> = [];

    if (state.allRequestedFeatures && state.allRequestedFeatures.length > 0) {
      console.log('[UX] 🗺️  Creating feature-to-route mapping...');
      featureRouteMapping = await assignFeaturesToRoutes(
        state.allRequestedFeatures,
        state.context?.appType || 'other',
        state.userDescription
      );

      // Store in memory for project
      if (state.projectId && featureRouteMapping.length > 0) {
        await memoryService.addObservation(
          `project_${state.projectId}`,
          `feature_routes: ${featureRouteMapping.map(m => `${m.featureId}→${m.route}`).join(', ')}`
        );
      }
    } else {
      console.log('[UX] ℹ️  No features to map (single feature or no features)');
    }

    // Fetch curated images based on app description
    const images = getRelevantImages(state.userDescription);
    console.log('[UX] 🖼️  Selected images for category');

    // ========== ENRICH STYLING CONFIG WITH DESIGN TOKENS ==========
    console.log('[UX] 🎨 Enriching styling config with comprehensive design tokens...');
    const projectName = state.requirements?.projectName || state.userDescription?.split(' ').slice(0, 3).join(' ');
    let finalStylingConfig = stylingConfig as StylingConfig;

    if (stylingConfig) {
      finalStylingConfig = generateEnrichedTokens(
        stylingConfig as StylingConfig,
        state.userDescription || '',
        projectName
      ) as StylingConfig;

      // If brand name was extracted from description, update it
      if (state.userDescription && finalStylingConfig.brand) {
        const brandNameMatch = state.userDescription.match(/(?:called|named|for)\s+["']?([A-Z][a-zA-Z0-9\s]+)["']?/i);
        if (brandNameMatch) {
          finalStylingConfig.brand.brandName = brandNameMatch[1].trim();
          console.log(`[UX] 📛 Brand name extracted: "${finalStylingConfig.brand.brandName}"`);
        }
      }

      console.log('[UX] ✅ Styling config enriched with 80+ design tokens');
      console.log(`[UX]   - Brand: ${finalStylingConfig.brand?.brandName}`);
      console.log(`[UX]   - Semantic colors: ${Object.keys(finalStylingConfig.enhancedColors?.semantic || {}).length}`);
      console.log(`[UX]   - Font sizes: ${Object.keys(finalStylingConfig.enhancedTypography?.fontSizes || {}).length}`);
      console.log(`[UX]   - Component styles: ${Object.keys(finalStylingConfig.components || {}).length}`);
    }

    // CONVERSATION MEMORY: Track UX's response with full branding details
    const brandInfo = finalStylingConfig?.brand?.brandName ? `Brand: ${finalStylingConfig.brand.brandName}. ` : '';
    const colorMode = stylingConfig?.colorTheme?.mode || 'light';
    const primaryColor = finalStylingConfig?.colorTheme?.primary || stylingConfig?.colorTheme?.primary || 'default';
    const bodyFont = finalStylingConfig?.typography?.bodyFont || stylingConfig?.typography?.bodyFont || 'system';
    const headingFont = finalStylingConfig?.typography?.headingFont || stylingConfig?.typography?.headingFont || 'system';

    const uxResponse = `${brandInfo}Selected ${selectedDesignSystem} design system with ${colorMode} mode. Colors: primary=${primaryColor}. Fonts: body=${bodyFont}, heading=${headingFont}. Generated 80+ design tokens for consistent branding.`;
    addAssistantMessage(state.projectId, uxResponse, 'ux');
    console.log('[UX] 💬 Tracked full branding & styling details in conversation memory');

    // 💾 Save memory checkpoint after styling config generation
    await conversationMemoryStore.saveMemory(state.projectId);
    console.log('[UX] 💾 Checkpoint saved after styling config generation');

    return {
      designSystem: selectedDesignSystem,  // ✅ Selected design system
      stylingConfig: finalStylingConfig,   // ✅ ENRICHED User styling with 80+ tokens
      backgroundContext,                    // ✅ MCP research (optional)
      designInspiration,                    // ✅ Design tokens from screenshot (optional)
      featureRouteMapping,                  // ✅ NEW: Feature-to-route assignments
      images,                               // ✅ NEW: Curated Unsplash images
      stage: 'building',
      completedNodes: ['ux'] // Reducer auto-appends
    };
  } catch (error) {
    emitNodeError('ux', error as Error, state);
    console.error('[UX] Error:', error);

    // Fallback
    const isDarkMode = state.context?.visualTone === 'dark';
    const fallbackStyling = getContextualStylingDefaults(state.context, state.userDescription) as StylingConfig;
    const fallbackDesignSystem = selectDesignSystem({
      appType: state.context?.appType,
      userDescription: state.userDescription,
      designStyle: state.context?.designStyle
    });

    return {
      designSystem: fallbackDesignSystem,  // ✅ Fallback design system
      stylingConfig: fallbackStyling,      // ✅ Fallback styling
      backgroundContext: null,
      designInspiration: null,              // ✅ No design inspiration on error
      featureRouteMapping: [],              // ✅ Empty mapping on error
      stage: 'building',
      completedNodes: ['ux'], // Reducer auto-appends
      errors: [{ node: 'ux', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}
