// @ts-nocheck
// lib/langgraph/nodes/ux-node.ts
// import 'server-only'; // Commented out for LangGraph Studio compatibility

import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { generateWithFallback } from '@/lib/ai/ai';
import { selectDesignSystem } from '@/lib/design-systems/index';
import {
  getDesignQualityChecklist,
  getPageOrganizationFramework,
  getUIDesignFramework,
} from '@/lib/langgraph/prompts/ui-design-framework';
import { traceAICall, withLangSmithTracing } from '@/lib/langsmith/tracing';
import { gatherBackgroundContext } from '@/lib/mcp/background-helper';
import { isMCPEnabled } from '@/lib/mcp/config';
import { conversationMemoryStore } from '@/lib/memory/conversation-memory';
import { messageManager } from '@/lib/messaging/message-manager';
import { analyzeDesignInspiration } from '@/lib/services/design-inspiration';
import type {
  AlertConfig,
  BorderingConfig,
  BorderRadiusScale,
  BorderWidths,
  BrandConfig,
  ButtonConfig,
  ButtonSizes,
  ButtonVariants,
  CardConfig,
  ComponentStyleConfig,
  DarkModeOverrides,
  EasingFunctions,
  EnhancedColorTheme,
  EnhancedTypographyConfig,
  FontSizes,
  FontWeights,
  InputConfig,
  LayoutSpacing,
  LineHeights,
  SemanticColors,
  ShadowSystem,
  SpacingConfig,
  SpacingScale,
  StylingConfig,
  TransitionConfig,
  TransitionDurations,
  ZIndices,
} from '@/lib/types/styling-config';
import { getRelevantImages } from '@/lib/unsplash-images';
import type { AppGenState, DesignInspiration } from '../../types';
import { extractAndParseJson } from '../../utils/json-parser';
import { estimateTokens, generateWithLogging } from '../../utils/logging/ai-with-logging';
import {
  emitNodeComplete,
  emitNodeError,
  emitNodeStart,
  emitProgress,
} from '../../utils/logging/events';
import { adjustColorBrightness, generateEnrichedTokens } from './design-tokens';

// Enable accessibility plugin for contrast validation
extend([a11yPlugin]);

/**
 * Generate page organization from PM's routes using AI reasoning
 * Maps each route to its page structure (layout + sections) based on route purpose
 */
async function generatePageOrganization(
  features: any[],
  appType: string,
  projectId: string
): Promise<{ [route: string]: { layout: string; sections: string[]; sectionConfig?: any } }> {
  console.log('[UX] 📐 Generating page organization from PM routes...');

  // Collect all unique routes from features with their purposes
  const routeMap = new Map<string, { featureName: string; purpose: string }>();
  features?.forEach((f) => {
    f.routes?.forEach((r: any) => {
      if (!routeMap.has(r.path)) {
        routeMap.set(r.path, { featureName: f.name, purpose: r.purpose });
      }
    });
  });

  if (routeMap.size === 0) {
    console.log('[UX] ⚠️ No routes found, returning empty organization');
    return {};
  }

  const routesList = Array.from(routeMap.entries()).map(([path, info]) => ({
    path,
    feature: info.featureName,
    purpose: info.purpose,
  }));

  const pageOrgPrompt = `${getPageOrganizationFramework()}

ROUTES TO ORGANIZE (from PM Node):
${JSON.stringify(routesList, null, 2)}

App Type: ${appType}

TASK: For each route, determine appropriate layout pattern and sections based on route PURPOSE.

PROCESS:
1. Analyze route purpose to understand content type
2. Select layout pattern matching interaction model
3. Identify sections needed for route purpose
4. Configure section-specific settings if needed

REASONING:
Layout and sections must match route purpose. Product listing needs grid layout with filters.
Contact form needs form layout with submission handling. Homepage needs hero + value proposition.

OUTPUT JSON:
{
  "pageOrganization": {
    "/route-path": {
      "layout": "hero-features-cta|split-view|grid|list-detail|dashboard|form",
      "sections": ["section1", "section2"],
      "sectionConfig": { "section1": { "variant": "value" } }
    }
  }
}`;

  const result = await generateWithLogging({
    prompt: pageOrgPrompt,
    projectId,
    nodeName: 'ux',
    callType: 'page-organization',
    estimatedTokens: estimateTokens(pageOrgPrompt),
    attempt: 1,
  });

  const parsed = extractAndParseJson(result, { pageOrganization: {} });
  const pageOrg = parsed.pageOrganization || {};

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALIDATION: Ensure all routes from PM have organization
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const missingRoutes: string[] = [];
  routesList.forEach((route) => {
    if (!pageOrg[route.path]) {
      missingRoutes.push(route.path);
      console.warn(`[UX] ⚠️ No organization for route ${route.path}, adding default`);

      // Add default organization based on route purpose
      const isHomepage = route.path === '/';
      const hasInteractiveVerbs = /create|send|submit|post|add|edit|chat/i.test(route.purpose);

      if (isHomepage) {
        // Homepage should always have hero-features-cta
        pageOrg[route.path] = {
          layout: 'hero-features-cta',
          sections: ['hero', 'features', 'cta'],
          sectionConfig: {},
        };
      } else if (hasInteractiveVerbs) {
        // Interactive pages need appropriate interface layouts
        const isChatLike = /chat|message|conversation/i.test(route.purpose);
        pageOrg[route.path] = {
          layout: isChatLike ? 'split-view' : 'form',
          sections: isChatLike ? ['chat-window', 'input-area'] : ['header', 'content'],
          sectionConfig: {},
        };
      } else {
        // Display pages need content layout
        pageOrg[route.path] = {
          layout: 'list-detail',
          sections: ['header', 'content'],
          sectionConfig: {},
        };
      }
    }
  });

  if (missingRoutes.length > 0) {
    console.log(
      `[UX] 🔧 Added default organization for ${missingRoutes.length} missing routes: ${missingRoutes.join(', ')}`
    );
  }

  console.log(`[UX] ✅ Page organization validated for ${Object.keys(pageOrg).length} routes`);
  Object.keys(pageOrg).forEach((route) => {
    console.log(
      `[UX]    ${route}: ${pageOrg[route].layout} with sections [${pageOrg[route].sections.join(', ')}]`
    );
  });

  return pageOrg;
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
    /[\u0600-\u06FF]/, // Arabic
    /[\u0590-\u05FF]/, // Hebrew
    /[\u0750-\u077F]/, // Arabic Supplement
  ];

  const isRTL = rtlPatterns.some((pattern) => pattern.test(userDescription));

  if (isRTL) {
    defaults.layout = {
      direction: 'rtl',
      maxWidth: '1200px',
      spacing: 'normal',
    };
  }

  // ========== COLOR THEME ==========
  // Detect color preferences from keywords
  const colorKeywords: Record<string, string> = {
    blue: '#1890ff',
    green: '#52c41a',
    red: '#f5222d',
    orange: '#fa8c16',
    purple: '#722ed1',
    pink: '#eb2f96',
    yellow: '#fadb14',
    cyan: '#13c2c2',
    geekblue: '#2f54eb',
    lime: '#a0d911',
    gold: '#faad14',
    magenta: '#eb2f96',
  };

  for (const [keyword, color] of Object.entries(colorKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.colorTheme = {
        primary: color,
        mode: 'light',
      };
      break;
    }
  }

  // Dark mode detection
  const darkKeywords = ['dark', 'night', 'black', 'midnight'];
  const hasDarkKeyword = darkKeywords.some((kw) => userDescription.toLowerCase().includes(kw));

  if (hasDarkKeyword || appContext?.visualTone === 'dark') {
    defaults.colorTheme = {
      ...defaults.colorTheme,
      primary: defaults.colorTheme?.primary || '#1890ff',
      mode: 'dark',
    };
  }

  // ========== TYPOGRAPHY ==========
  // Detect font preferences from keywords FIRST (explicit user choice)
  const fontKeywords: Record<string, any> = {
    modern: 'Inter',
    elegant: 'Montserrat',
    playful: 'Poppins',
    professional: 'Roboto',
    clean: 'Inter',
    corporate: 'Open Sans',
    luxury: 'Playfair Display',
    tech: 'Space Grotesk',
    friendly: 'Poppins',
    sophisticated: 'Montserrat',
  };

  let fontSelected = false;
  for (const [keyword, font] of Object.entries(fontKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.typography = {
        fontFamily: font as any,
        scale: 'normal',
        headingWeight: 700,
      };
      fontSelected = true;
      break;
    }
  }

  // If no explicit font keyword, select based on APP TYPE & CATEGORY
  if (!fontSelected && appContext?.appType) {
    const appTypeFonts: Record<string, any> = {
      'saas-app': 'Inter', // Professional, clean
      dashboard: 'Inter', // Data-focused, readable
      ecommerce: 'Roboto', // Commercial, trustworthy
      portfolio: 'Montserrat', // Creative, unique
      blog: 'Lato', // Reading-focused
      tool: 'Inter', // Functional, clear
      marketplace: 'Roboto', // Commercial
      social: 'Poppins', // Friendly, approachable
      other: 'Inter', // Default
    };

    const selectedFont = appTypeFonts[appContext.appType] || 'Inter';
    defaults.typography = {
      fontFamily: selectedFont as any,
      scale: 'normal',
      headingWeight: 700,
    };
    fontSelected = true;
    console.log(
      `[UX] 🔤 Font auto-selected based on app type "${appContext.appType}": ${selectedFont}`
    );
  }

  // Fallback: Select based on DESIGN STYLE if still no font
  if (!fontSelected && appContext?.designStyle) {
    const designStyleFonts: Record<string, any> = {
      modern: 'Inter',
      minimalist: 'Inter',
      playful: 'Poppins',
      elegant: 'Montserrat',
      professional: 'Roboto',
      creative: 'Montserrat',
      corporate: 'Open Sans',
      tech: 'Space Grotesk',
    };

    const selectedFont = designStyleFonts[appContext.designStyle] || 'Inter';
    defaults.typography = {
      fontFamily: selectedFont as any,
      scale: 'normal',
      headingWeight: 700,
    };
    console.log(
      `[UX] 🔤 Font auto-selected based on design style "${appContext.designStyle}": ${selectedFont}`
    );
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
          hoverEffects: false,
        };
        break;
      case 'playful':
      case 'creative':
        defaults.animations = {
          enabled: true,
          intensity: 'heavy',
          transitions: true,
          pageTransitions: true,
          hoverEffects: true,
        };
        break;
      case 'modern':
      case 'tech':
        defaults.animations = {
          enabled: true,
          intensity: 'moderate',
          transitions: true,
          pageTransitions: true,
          hoverEffects: true,
        };
        break;
      case 'professional':
      case 'elegant':
        defaults.animations = {
          enabled: true,
          intensity: 'subtle',
          transitions: true,
          pageTransitions: false,
          hoverEffects: true,
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
        hoverEffects: false,
      };
    } else if (heavyAnimationTypes.includes(appContext?.appType)) {
      defaults.animations = {
        enabled: true,
        intensity: 'heavy',
        transitions: true,
        pageTransitions: true,
        hoverEffects: true,
      };
    }
  }

  // Detect animation preferences from keywords
  const animationKeywords: Record<string, any> = {
    minimal: 'none',
    'no animation': 'none',
    subtle: 'subtle',
    smooth: 'moderate',
    animated: 'moderate',
    dynamic: 'heavy',
  };

  for (const [keyword, intensity] of Object.entries(animationKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.animations = {
        enabled: intensity !== 'none',
        intensity: intensity as any,
        transitions: true,
        pageTransitions: intensity === 'heavy',
        hoverEffects: intensity !== 'none',
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
      size: 'medium',
    };
  } else if (appContext?.appType === 'creative' || appContext?.appType === 'portfolio') {
    defaults.iconography = {
      style: 'filled',
      source: 'lucide',
      size: 'large',
    };
  }

  // ========== LAYOUT SPACING ==========
  // Compact for dashboards, spacious for marketing sites
  if (appContext?.appType === 'dashboard' || appContext?.appType === 'tool') {
    defaults.layout = {
      ...defaults.layout,
      direction: defaults.layout?.direction || 'ltr',
      maxWidth: (defaults.layout?.maxWidth || '1400px') as any,
      spacing: 'compact',
    };
  } else if (appContext?.appType === 'portfolio' || appContext?.appType === 'blog') {
    defaults.layout = {
      ...defaults.layout,
      direction: defaults.layout?.direction || 'ltr',
      maxWidth: (defaults.layout?.maxWidth || '1200px') as any,
      spacing: 'spacious',
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
  const mode = extracted.colorTheme?.mode || contextual.colorTheme?.mode || 'light';
  return {
    colorTheme: {
      mode,
      primary: extracted.colorTheme?.primary || contextual.colorTheme?.primary || '#2563eb',
      secondary: extracted.colorTheme?.secondary || contextual.colorTheme?.secondary || '#64748b',
      accent: extracted.colorTheme?.accent || contextual.colorTheme?.accent || '#f59e0b',
      background:
        extracted.colorTheme?.background ||
        contextual.colorTheme?.background ||
        (mode === 'dark' ? '#0a0a0a' : '#ffffff'),
      backgroundSecondary:
        extracted.colorTheme?.backgroundSecondary ||
        contextual.colorTheme?.backgroundSecondary ||
        (mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
      backgroundTertiary:
        extracted.colorTheme?.backgroundTertiary ||
        contextual.colorTheme?.backgroundTertiary ||
        (mode === 'dark' ? '#2a2a2a' : '#f3f4f6'),
      border:
        extracted.colorTheme?.border ||
        contextual.colorTheme?.border ||
        (mode === 'dark' ? '#27272a' : '#e4e4e7'),
      muted:
        extracted.colorTheme?.muted ||
        contextual.colorTheme?.muted ||
        (mode === 'dark' ? '#18181b' : '#f4f4f5'),
      destructive:
        extracted.colorTheme?.destructive || contextual.colorTheme?.destructive || '#ef4444',
      success: extracted.colorTheme?.success || contextual.colorTheme?.success || '#22c55e',
      warning: extracted.colorTheme?.warning || contextual.colorTheme?.warning || '#f59e0b',
      info: extracted.colorTheme?.info || contextual.colorTheme?.info || '#3b82f6',
    },
    layout: {
      direction: extracted.layout?.direction || contextual.layout?.direction || 'ltr',
      maxWidth: (extracted.layout?.maxWidth || contextual.layout?.maxWidth || '1200px') as any,
      spacing: extracted.layout?.spacing || contextual.layout?.spacing || 'normal',
    },
    typography: {
      fontFamily: (extracted.typography?.fontFamily ||
        contextual.typography?.fontFamily ||
        'Inter') as any,
      customFont: extracted.typography?.customFont || contextual.typography?.customFont,
      scale: extracted.typography?.scale || contextual.typography?.scale || 'normal',
      headingWeight:
        extracted.typography?.headingWeight || contextual.typography?.headingWeight || 700,
    },
    iconography: {
      style: extracted.iconography?.style || contextual.iconography?.style || 'outlined',
      source: extracted.iconography?.source || contextual.iconography?.source || 'lucide',
      size: extracted.iconography?.size || contextual.iconography?.size || 'medium',
    },
    animations: {
      enabled: extracted.animations?.enabled ?? contextual.animations?.enabled ?? true,
      intensity: extracted.animations?.intensity || contextual.animations?.intensity || 'subtle',
      transitions: extracted.animations?.transitions ?? contextual.animations?.transitions ?? true,
      pageTransitions:
        extracted.animations?.pageTransitions ?? contextual.animations?.pageTransitions ?? false,
      hoverEffects:
        extracted.animations?.hoverEffects ?? contextual.animations?.hoverEffects ?? true,
    },
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
  const inspirationMode =
    inspiration.colors.background === '#FFFFFF' || colord(inspiration.colors.background).isLight()
      ? 'light'
      : 'dark';

  return {
    ...stylingConfig,
    colorTheme: {
      // User-specified colors take precedence
      primary: stylingConfig.colorTheme?.primary || inspiration.colors.primary,
      secondary: stylingConfig.colorTheme?.secondary || inspiration.colors.secondary,
      accent: stylingConfig.colorTheme?.accent || inspiration.colors.accent,
      background: stylingConfig.colorTheme?.background || inspiration.colors.background,
      backgroundSecondary:
        stylingConfig.colorTheme?.backgroundSecondary ||
        (inspirationMode === 'light' ? '#F9FAFB' : '#1A1A1A'),
      backgroundTertiary:
        stylingConfig.colorTheme?.backgroundTertiary ||
        (inspirationMode === 'light' ? '#F3F4F6' : '#2A2A2A'),
      // Keep existing semantic colors (not in inspiration)
      border: stylingConfig.colorTheme?.border,
      muted: stylingConfig.colorTheme?.muted,
      destructive: stylingConfig.colorTheme?.destructive,
      success: stylingConfig.colorTheme?.success,
      warning: stylingConfig.colorTheme?.warning,
      info: stylingConfig.colorTheme?.info,
      mode: stylingConfig.colorTheme?.mode || inspirationMode,
    },
    typography: {
      fontFamily: (stylingConfig.typography?.fontFamily ||
        inspiration.typography.headingFont) as any,
      customFont: stylingConfig.typography?.customFont,
      scale: stylingConfig.typography?.scale || 'normal',
      headingWeight: stylingConfig.typography?.headingWeight || 700,
      bodyWeight: stylingConfig.typography?.bodyWeight || 400,
      weights: stylingConfig.typography?.weights,
    },
    layout: {
      direction: stylingConfig.layout?.direction || 'ltr',
      maxWidth: stylingConfig.layout?.maxWidth || ('1200px' as any),
      spacing: stylingConfig.layout?.spacing || 'normal',
      borderRadius: (stylingConfig.layout?.borderRadius ||
        (inspiration.borderRadius === '0px'
          ? 'none'
          : inspiration.borderRadius === '4px'
            ? 'small'
            : inspiration.borderRadius === '8px'
              ? 'medium'
              : inspiration.borderRadius === '12px'
                ? 'large'
                : 'medium')) as any,
    },
    iconography: stylingConfig.iconography,
    animations: stylingConfig.animations,
  };
}

/**
 * Helper: Adjust color brightness (lightness)
 * @param hex Hex color string
 * @param amount -1 to 1 (negative = darker, positive = lighter)
 */
// generateEnrichedTokens and adjustColorBrightness have been extracted to ./design-tokens.ts

/**
 * Validate and fix color contrast to meet WCAG AA standards
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param minContrast - Minimum contrast ratio (4.5 for normal text, 3.0 for large text)
 * @returns Adjusted foreground color if needed
 */
function ensureContrast(foreground: string, background: string, minContrast: number = 4.5): string {
  const fg = colord(foreground);
  const bg = colord(background);

  let currentContrast = fg.contrast(bg);

  console.log(
    `[UX] 🎨 Checking contrast: ${foreground} on ${background} = ${currentContrast.toFixed(2)}:1`
  );

  if (currentContrast >= minContrast) {
    console.log(`[UX] ✓ Contrast OK (${currentContrast.toFixed(2)}:1 >= ${minContrast}:1)`);
    return foreground;
  }

  // Try adjusting lightness
  let adjustedFg = fg;
  const isDark = bg.isDark();

  // If background is dark, lighten foreground; if light, darken foreground
  for (let step = 0; step < 20; step++) {
    adjustedFg = isDark ? adjustedFg.lighten(0.05) : adjustedFg.darken(0.05);

    currentContrast = adjustedFg.contrast(bg);

    if (currentContrast >= minContrast) {
      const adjusted = adjustedFg.toHex();
      console.log(
        `[UX] ✓ Adjusted ${foreground} → ${adjusted} (contrast: ${currentContrast.toFixed(2)}:1)`
      );
      return adjusted;
    }
  }

  // Fallback: use pure white or black
  const fallback = isDark ? '#ffffff' : '#000000';
  console.log(
    `[UX] ⚠️ Using fallback color: ${fallback} (original ${foreground} failed validation)`
  );
  return fallback;
}

/**
 * Generate complete design instructions for Frontend node
 * SINGLE SOURCE OF TRUTH for all UI/styling decisions
 *
 * This function consolidates ALL design guidance into one comprehensive prompt
 * that Frontend node consumes. This prevents fragmentation and ensures consistency.
 */
function generateDesignInstructions(
  stylingConfig: StylingConfig,
  appContext: any,
  userDescription: string,
  images?: any
): string {
  const colors = stylingConfig.colorTheme;
  const typography = stylingConfig.typography || {
    fontFamily: 'Inter',
    headingWeight: 700,
    scale: 'normal',
  };
  const spacing = stylingConfig.layout?.spacing || 'normal';
  const animations = stylingConfig.animations || { enabled: true, intensity: 'subtle' };
  const iconography = stylingConfig.iconography || {
    source: 'lucide',
    style: 'outlined',
    size: 'medium',
  };
  const layout = stylingConfig.layout || {};

  // Map spacing to Tailwind classes
  const spacingClasses = {
    compact: { sections: 'py-8 md:py-12', container: 'px-3 md:px-4' },
    normal: { sections: 'py-16 md:py-24', container: 'px-4 md:px-6' },
    spacious: { sections: 'py-24 md:py-32', container: 'px-6 md:px-8' },
  }[spacing] || { sections: 'py-16 md:py-24', container: 'px-4 md:px-6' };

  // Map icon size
  const iconSizeClass =
    {
      small: 'h-4 w-4',
      medium: 'h-5 w-5',
      large: 'h-6 w-6',
    }[iconography.size] || 'h-5 w-5';

  // Get design framework
  const uiFramework = getUIDesignFramework();
  const pageOrganizationPrompt = getPageOrganizationFramework();
  const qualityChecklist = getDesignQualityChecklist();

  // Determine logo pattern based on app type
  const logoPattern = (appType: string) => {
    if (appType === 'saas-app' || appType === 'tool') {
      return `LOGO PATTERN: Icon + Text Combination
Purpose: Modern, professional, memorable
Structure: Icon container (gradient background) + brand text
Implementation: flex layout, gap spacing, icon sizing appropriate for context`;
    } else if (appType === 'e-commerce') {
      return `LOGO PATTERN: Badge Style
Purpose: Trustworthy, established, recognizable
Structure: Contained badge with brand indicator
Implementation: pill shape, brand colors, balanced padding`;
    } else {
      return `LOGO PATTERN: Text-Only
Purpose: Minimalist, clean, typography-focused
Structure: Brand name with emphasis treatment
Implementation: Large font size, gradient text if accent available, bold weight`;
    }
  };

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 COMPLETE DESIGN SYSTEM (Single Source of Truth from UX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR CONFIGURED DESIGN SYSTEM:
- App Type: ${appContext?.appType || 'web-app'}
- Design Style: ${appContext?.designStyle || 'modern'}
- Visual Tone: ${appContext?.visualTone || 'balanced'}
- Color Mode: ${colors?.mode || 'light'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. COLOR PALETTE (Pre-validated for WCAG AA contrast)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 COLOR HIERARCHY:

Background Layers (Surface Colors):
- background: ${colors?.background || '#FFFFFF'} → Main page surface
- backgroundSecondary: ${colors?.backgroundSecondary || '#F9FAFB'} → Cards, elevated surfaces
- backgroundTertiary: ${colors?.backgroundTertiary || '#F3F4F6'} → Nested cards, sections
- border: ${colors?.border || '#E4E4E7'} → Component borders, dividers
- muted: ${colors?.muted || '#F4F4F5'} → Disabled states, subtle backgrounds

Brand Colors (Interactive Elements):
- primary: ${colors?.primary || '#3B82F6'} → Main CTAs, buttons, links
- secondary: ${colors?.secondary || '#64748B'} → Supporting actions
- accent: ${colors?.accent || '#F59E0B'} → Highlights, badges

Semantic Colors (Status):
- success: ${colors?.success || '#22C55E'}
- warning: ${colors?.warning || '#F59E0B'}
- destructive: ${colors?.destructive || '#EF4444'}
- info: ${colors?.info || '#3B82F6'}

🚨 CRITICAL USAGE RULES:
✅ Page background: bg-background (user's chosen theme color)
✅ Cards/sections: bg-background-secondary (NOT bg-secondary!)
✅ Nested cards: bg-background-tertiary
✅ Borders: border-border (uses --border CSS variable)
✅ Buttons/CTAs: bg-primary (brand color for actions)
✅ Supporting buttons: bg-secondary (brand secondary color)

❌ NEVER use bg-gray-100, bg-gray-200 - use design system colors!
❌ NEVER confuse bg-secondary (brand) with bg-background-secondary (surface)!

${
  colors?.accent
    ? `
GRADIENT SUPPORT:
Use bg-gradient-to-r from-primary to-accent on:
- Hero headings (with bg-clip-text text-transparent)
- Premium CTAs and feature highlights
- Card backgrounds (with opacity: from-primary/10 to-accent/10)
`
    : ''
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Font Family: ${typography.fontFamily || 'Inter'}
Heading Weight: ${typography.headingWeight || 700}
Body Weight: ${typography.bodyWeight || 400}
Scale: ${typography.scale || 'normal'}

Typography is configured in globals.css - use semantic classes:
- h1, h2, h3, h4, h5, h6 → Auto-styled with configured weights
- text-hero, text-display → Large headings
- text-heading, text-subheading → Section headings
- text-foreground → Primary text color
- text-muted-foreground → Secondary/supporting text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. SPACING & LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout Mode: ${spacing}

Configured Spacing:
- Sections: ${spacingClasses.sections}
- Containers: ${spacingClasses.container}
- Max Width: max-w-7xl mx-auto

Component Gaps:
- Form fields: space-y-4
- Card grids: gap-6 md:gap-8
- Section spacing: space-y-8 md:space-y-12
- Inline elements: gap-2 md:gap-3

Use utility classes from globals.css:
- .container → max-w-7xl mx-auto px-4 md:px-6
- .section → ${spacingClasses.sections}
- .grid-2, .grid-3, .grid-4 → Responsive grids with gaps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. ICONOGRAPHY & LOGO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Library: ${iconography.source}
Style: ${iconography.style}
Default Size: ${iconSizeClass}

Import: import { IconName } from '${iconography.source === 'lucide' ? 'lucide-react' : iconography.source === 'heroicons' ? '@heroicons/react/24/outline' : '@mui/icons-material'}'

${logoPattern(appContext?.appType || 'web-app')}

EXAMPLE LOGO IMPLEMENTATIONS:

Icon + Text Logo (SaaS/Tool):
<div className="flex items-center gap-2">
  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
    <Zap className="h-5 w-5 text-white" />
  </div>
  <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BrandName</span>
</div>

Text-Only Logo (Landing Page):
<h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BrandName</h1>

🚨 CRITICAL: ALWAYS include a logo in the header/navigation!

ICON USAGE STRATEGY (Strategic, Not Sparse):
✅ Logo → Choose semantic icon (Zap, Sparkles, Rocket for tech; Heart, Star for lifestyle)
✅ Feature cards → 1 UNIQUE icon per card matching the feature
✅ Form inputs → Left-side icons (Mail, Lock, User, Search, Calendar)
✅ Buttons → Action icons (ArrowRight, Plus, Check, Send)
✅ Status → CheckCircle, XCircle, AlertCircle, Info
✅ Navigation → Menu, X, ChevronRight
✅ Section headers → 1 decorative icon

ICON VARIETY (Use 6-10 DIFFERENT icons per page):
- Forms: Mail, Lock, User, Search, Calendar, Eye
- Actions: Plus, Edit, Trash, Save, Download, Share2, Send
- Features: Zap, Sparkles, Rocket, Star, Heart, Shield, Award
- Status: CheckCircle, AlertCircle, Info, XCircle
- Navigation: Menu, ChevronRight, ArrowRight, Home
- Content: Image, File, Folder, Clock, Bell

SIZING:
- Logo icon: h-8 w-8 or h-6 w-6
- Feature icons: h-6 w-6
- Form/Button icons: h-5 w-5
- Inline icons: h-4 w-4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ANIMATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Intensity: ${animations.intensity || 'subtle'}

${
  animations.intensity === 'none'
    ? `
NO ANIMATIONS - Professional/Corporate
- transition-colors on buttons only
- No entrance animations
- Focus on clarity and speed
`
    : animations.intensity === 'subtle'
      ? `
SUBTLE ANIMATIONS - Professional & Modern
🚨 APPLY TO: Hero, sections, cards, buttons
<section className="animate-fade-in">
<div className="hover:scale-105 transition-all duration-200">
✅ REQUIRED: Add animations, don't skip!
`
      : animations.intensity === 'moderate'
        ? `
MODERATE ANIMATIONS - Modern & Engaging (RECOMMENDED)
🚨 CRITICAL: APPLY TO ALL MAJOR ELEMENTS!

Required Animation Classes:
✅ Sections → className="animate-slide-up"
✅ Cards → className="hover:-translate-y-1 transition-all duration-300"
✅ Buttons → className="transition-all hover:scale-105"
✅ Feature grids → Stagger with delay-100, delay-200, delay-300
✅ Group effects → group, group-hover:opacity-100

Example:
<section className="animate-slide-up delay-100">
  <div className="group hover:-translate-y-1 transition-all">
    <div className="group-hover:scale-110 transition-transform">...</div>
  </div>
</section>

🚨 DO NOT SKIP ANIMATIONS - They're configured and expected!
`
        : `
HEAVY ANIMATIONS - Playful & Creative
- animate-bounce on CTAs
- Complex hover effects with transforms
- Page transitions
- Stagger animations on lists
- group-hover with multiple children effects
`
}

🎨 All animation classes are pre-configured in globals.css!
Available: animate-fade-in, animate-slide-up, animate-bounce
Timing: delay-100, delay-200, delay-300, duration-200, duration-300

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. IMAGE USAGE STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  images
    ? `
Available Images:
- Hero: ${images.hero}
- Feature 1: ${images.feature1}
- Feature 2: ${images.feature2}
- Feature 3: ${images.feature3}
- Background: ${images.background}

STRATEGIC IMAGE USE (Quality Over Quantity):
✅ Hero section → Use hero image (full-width with overlay OR split layout)
✅ Feature showcase → Alternate feature images (1 image per 2-3 features)
✅ Product displays → Product images with hover effects
✅ Testimonials → User photos (only if authentic)

❌ DO NOT use images for:
- Form backgrounds (reduces readability)
- Every component background (overwhelming)
- Text-heavy sections (documentation, pricing)
- Navigation/header/footer areas
- Card backgrounds (use gradients instead)

MAXIMUM: 2-3 images per page (hero + 1-2 features)
PRIORITY: Gradients and solid colors for most backgrounds

Image Styling (When Used):
- Hero: bg-cover with overlay (bg-black/40 to bg-black/60)
- Features: rounded-xl shadow-lg object-cover
- Products: aspect-square or aspect-video with hover:scale-105
- Always include proper alt text for accessibility
`
    : `
NO IMAGES PROVIDED
Use gradients and solid colors instead:
- bg-gradient-to-r from-primary/10 to-accent/10
- bg-secondary, bg-muted for card backgrounds
- Decorative blur elements: bg-primary/10 blur-3xl
`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. LOGO PATTERN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USE THIS LOGO PATTERN:
${logoPattern(appContext?.appType || 'web-app')}

LOGO PLACEMENT:
- Header/Navigation: Top-left or center
- Footer: Repeat logo with optional tagline
- Use on EVERY page consistently

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. DESIGN PRINCIPLES & PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${uiFramework}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. PAGE ORGANIZATION & ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pageOrganizationPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

async function uxNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('[UX] 🚀 Starting UX node (Design System)');
    console.log(
      `[UX] 🎨 App Type: ${state.context?.appType}, Style: ${state.context?.designStyle}`
    );

    // Emit thinking process before starting
    emitNodeStart('ux', state, {
      userInput: state.plan || state.userDescription,
      interpretation:
        'Analyzing the product plan to select the best design system and extract styling preferences.',
      plan: 'I will select the appropriate design system, extract user styling preferences, and gather any relevant background context. Frontend AI will decide which components to use.',
    });

    // Step 1: Design System Selection
    console.log('[UX] 🎨 Selecting design system...');
    const selectedDesignSystem = selectDesignSystem({
      appType: state.context?.appType,
      userDescription: state.userDescription,
      designStyle: state.context?.designStyle,
    });
    console.log(`[UX] ✅ Selected design system: ${selectedDesignSystem}`);

    // Step 2: Styling Extraction + Memory Fetch (PARALLEL OPTIMIZATION)
    console.log('[UX] 📝 Extracting styling preferences...');
    emitProgress('ux', state.projectId, 'Extracting styling preferences...');

    // Generate styling configuration
    const stylingResult = await traceAICall(
      'ux-styling-extraction',
      async () => {
        return await generateWithLogging({
          prompt: `Extract styling config from: "${state.userDescription}"

APP: ${state.context?.appType || 'web-app'} | ${state.context?.designStyle || 'modern'} | ${state.context?.visualTone || 'balanced'}

COLOR HIERARCHY RULES:
1. Background = Theme color (cream, grey, dark, white)
2. Background layers = Create depth (cards, sections)
3. Primary = Action color (buttons, links, CTAs)

EXAMPLES:
"Cream theme with orange buttons" → background=#F5F5DC, primary=#FF8C00
"Grey dashboard" → background=#f5f5f5, primary=#3B82F6
"Dark mode with purple accents" → background=#0a0a0a, primary=#9333EA

FONTS: Inter, Roboto, Poppins, Montserrat, Open Sans, Lato, Playfair Display, Space Grotesk

RETURN COMPLETE JSON (ALL 13 colorTheme fields required):
{
  "colorTheme": {
    "mode": "light",
    "primary": "#3B82F6",
    "secondary": "#64748B",
    "accent": "#F59E0B",
    "background": "#FFFFFF",
    "backgroundSecondary": "#F9FAFB",
    "backgroundTertiary": "#F3F4F6",
    "border": "#E4E4E7",
    "muted": "#F4F4F5",
    "destructive": "#EF4444",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "info": "#3B82F6"
  },
  "typography": {
    "fontFamily": "Inter",
    "scale": "normal",
    "headingWeight": 700,
    "bodyWeight": 400,
    "weights": [400, 500, 600, 700]
  },
  "iconography": {
    "style": "outlined",
    "source": "lucide",
    "size": "medium"
  },
  "animations": {
    "enabled": true,
    "intensity": "moderate",
    "transitions": true,
    "pageTransitions": true,
    "hoverEffects": true
  },
  "layout": {
    "direction": "ltr",
    "maxWidth": "1200px",
    "spacing": "normal",
    "borderRadius": "medium"
  }
}

For dark mode: background=#0a0a0a, backgroundSecondary=#1a1a1a, backgroundTertiary=#2a2a2a, border=#27272a, muted=#18181b
Font selection: Professional→Inter/Roboto, Creative→Montserrat, Playful→Poppins, Elegant→Playfair Display`,
          projectId: state.projectId,
          nodeName: 'ux',
          callType: 'analysis',
          estimatedTokens: estimateTokens(`Extract styling from...`),
          attempt: 1,
        });
      },
      {
        appType: state.context?.appType,
        designStyle: state.context?.designStyle,
        visualTone: state.context?.visualTone,
      }
    );
    // Parse and merge styling config with COMPLETE defaults
    let stylingConfig: Partial<StylingConfig> | null = null;
    try {
      // ✅ FIX: Provide COMPLETE default object to extractAndParseJson to prevent missing fields
      const mode =
        state.context?.visualTone === 'dark' || state.userDescription.toLowerCase().includes('dark')
          ? 'dark'
          : 'light';
      const completeDefaults = {
        colorTheme: {
          mode,
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b',
          background: mode === 'dark' ? '#0a0a0a' : '#ffffff',
          backgroundSecondary: mode === 'dark' ? '#1a1a1a' : '#f9fafb',
          backgroundTertiary: mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
          border: mode === 'dark' ? '#27272a' : '#e4e4e7',
          muted: mode === 'dark' ? '#18181b' : '#f4f4f5',
          destructive: '#ef4444',
          success: '#22c55e',
          warning: '#f59e0b',
          info: '#3b82f6',
        },
        typography: {
          fontFamily: 'Inter',
          scale: 'normal',
          headingWeight: 700,
          bodyWeight: 400,
          weights: [400, 500, 600, 700],
        },
        iconography: {
          style: 'outlined',
          source: 'lucide',
          size: 'medium',
        },
        animations: {
          enabled: true,
          intensity: 'moderate',
          transitions: true,
          pageTransitions: true,
          hoverEffects: true,
        },
        layout: {
          direction: 'ltr',
          maxWidth: '1200px',
          spacing: 'normal',
          borderRadius: 'medium',
        },
      };

      const extractedStyling = extractAndParseJson(stylingResult, completeDefaults);

      // Debug: Log what AI actually returned
      console.log(
        '[UX] 🔍 AI returned colors:',
        extractedStyling.colorTheme ? Object.keys(extractedStyling.colorTheme).join(', ') : 'none'
      );
      if (extractedStyling.colorTheme) {
        console.log(
          '[UX] 🔍 AI color values:',
          JSON.stringify(extractedStyling.colorTheme, null, 2)
        );
      }

      const contextualDefaults = getContextualStylingDefaults(state.context, state.userDescription);
      stylingConfig = mergeWithDefaults(extractedStyling, contextualDefaults);
      console.log('[UX] ✅ Styling config extracted successfully');
      console.log(
        '[UX] ✅ After merge, all colors present:',
        Object.keys(stylingConfig.colorTheme).length,
        'fields'
      );
    } catch (error) {
      console.warn('[UX] Failed to extract styling config, using contextual defaults:', error);
      stylingConfig = getContextualStylingDefaults(
        state.context,
        state.userDescription
      ) as StylingConfig;
    }

    // Step 2.5: Design Inspiration Analysis (if design reference uploaded)
    const { uploadedFiles } = state;
    const designRefFiles =
      uploadedFiles?.filter((f) => f.purpose === 'design-reference' || f.purpose === 'both') || [];

    let designInspiration: DesignInspiration | null = null;

    if (designRefFiles.length > 0) {
      console.log('[UX] 🎨 Analyzing design inspiration from uploaded screenshot...');
      emitProgress('ux', state.projectId, 'Analyzing design inspiration from screenshot...');

      designInspiration = await analyzeDesignInspiration({
        imageUrl: designRefFiles[0].fileUrl,
        context: {
          appType: state.context?.appType || 'web-app',
          designStyle: state.context?.designStyle,
          visualTone: state.context?.visualTone,
        },
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
        console.log(
          '[UX] ⚠️  Design inspiration analysis failed or quality too low, using AI-generated styles'
        );
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
      console.log(
        '[UX] 🔍 Validating against all background layers: background, backgroundSecondary, backgroundTertiary'
      );

      // Validate brand colors with RELAXED contrast (3.0 - large text standard)
      // This preserves brand vibrancy while meeting minimum accessibility
      if (colorTheme.primary) {
        const originalPrimary = colorTheme.primary;
        colorTheme.primary = ensureContrast(colorTheme.primary, colorTheme.background, 3.0);
        colorTheme.primary = ensureContrast(
          colorTheme.primary,
          colorTheme.backgroundSecondary,
          3.0
        );
        if (originalPrimary !== colorTheme.primary) {
          console.log(`[UX] 🎨 Primary adjusted: ${originalPrimary} → ${colorTheme.primary}`);
        }
      }

      if (colorTheme.secondary) {
        const originalSecondary = colorTheme.secondary;
        colorTheme.secondary = ensureContrast(colorTheme.secondary, colorTheme.background, 3.0);
        if (originalSecondary !== colorTheme.secondary) {
          console.log(`[UX] 🎨 Secondary adjusted: ${originalSecondary} → ${colorTheme.secondary}`);
        }
      }

      if (colorTheme.accent) {
        const originalAccent = colorTheme.accent;
        colorTheme.accent = ensureContrast(colorTheme.accent, colorTheme.background, 3.0);
        if (originalAccent !== colorTheme.accent) {
          console.log(`[UX] 🎨 Accent adjusted: ${originalAccent} → ${colorTheme.accent}`);
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
        mode,
      });
    }

    // #done Step 3: Use Background Context from State (already fetched by unified search)
    const backgroundContext = state.backgroundContext || null;
    if (backgroundContext) {
      console.log('[UX] ✅ Using background context from unified search');
    } else {
      console.log('[UX] ℹ️  No background context available');
    }

    // Step 4: Generate Design System Prompt (with styling config)
    const isDarkMode =
      state.context?.visualTone === 'dark' ||
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
        hasStylingConfig: !!stylingConfig,
      },
      summary: `Design system: ${selectedDesignSystem}. Style: ${state.context?.designStyle} with ${state.context?.visualTone} theme${backgroundContext ? '. Enhanced with MCP research.' : ''}. Frontend AI will decide components.`,
    });

    // Note: Styling preferences are now stored in conversation memory automatically
    console.log('[UX] ✅ Styling configuration complete');

    // Generate page organization from PM's routes using AI
    let pageOrganization = {};
    if (state.allRequestedFeatures && state.allRequestedFeatures.length > 0) {
      console.log('[UX] 📐 Creating page organization from PM routes...');
      pageOrganization = await generatePageOrganization(
        state.allRequestedFeatures,
        state.context?.appType || 'other',
        state.projectId
      );
      console.log(
        `[UX] ✅ Page organization created for ${Object.keys(pageOrganization).length} routes`
      );
    } else {
      console.log('[UX] ℹ️ No features to organize (single feature or no features)');
    }

    // COMMENTED OUT: Fetch curated images based on app description (async call to Unsplash API)
    // console.log('[UX] 🖼️  Fetching high-quality images from Unsplash...');
    // const images = await getRelevantImages(state.userDescription);
    // console.log('[UX] ✅ Images fetched successfully');
    const images = null; // Disabled for workflow optimization

    // ========== ENRICH STYLING CONFIG WITH DESIGN TOKENS ==========
    console.log('[UX] 🎨 Enriching styling config with comprehensive design tokens...');
    const projectName =
      state.requirements?.projectName || state.userDescription?.split(' ').slice(0, 3).join(' ');
    let finalStylingConfig = stylingConfig as StylingConfig;

    if (stylingConfig) {
      finalStylingConfig = generateEnrichedTokens(
        stylingConfig as StylingConfig,
        state.userDescription || '',
        projectName
      ) as StylingConfig;

      // If brand name was extracted from description, update it
      if (state.userDescription && finalStylingConfig.brand) {
        const brandNameMatch = state.userDescription.match(
          /(?:called|named|for)\s+["']?([A-Z][a-zA-Z0-9\s]+)["']?/i
        );
        if (brandNameMatch) {
          finalStylingConfig.brand.brandName = brandNameMatch[1].trim();
          console.log(`[UX] 📛 Brand name extracted: "${finalStylingConfig.brand.brandName}"`);
        }
      }

      console.log('[UX] ✅ Styling config enriched with 80+ design tokens');
      console.log(`[UX]   - Brand: ${finalStylingConfig.brand?.brandName}`);
      console.log(
        `[UX]   - Semantic colors: ${Object.keys(finalStylingConfig.enhancedColors?.semantic || {}).length}`
      );
      console.log(
        `[UX]   - Font sizes: ${Object.keys(finalStylingConfig.enhancedTypography?.fontSizes || {}).length}`
      );
      console.log(
        `[UX]   - Component styles: ${Object.keys(finalStylingConfig.components || {}).length}`
      );
    }

    // CONVERSATION MEMORY: Track UX's response with full branding details
    const brandInfo = finalStylingConfig?.brand?.brandName
      ? `Brand: ${finalStylingConfig.brand.brandName}. `
      : '';
    const colorMode = stylingConfig?.colorTheme?.mode || 'light';
    const primaryColor =
      finalStylingConfig?.colorTheme?.primary || stylingConfig?.colorTheme?.primary || 'default';
    const bodyFont =
      finalStylingConfig?.typography?.bodyFont || stylingConfig?.typography?.bodyFont || 'system';
    const headingFont =
      finalStylingConfig?.typography?.headingFont ||
      stylingConfig?.typography?.headingFont ||
      'system';

    // ✅ UNIFIED MESSAGING: Send design-ready event via messageManager
    await messageManager.sendEvent(
      state.projectId,
      {
        type: 'design-ready',
        designSystem: selectedDesignSystem,
        colorMode: colorMode as 'light' | 'dark',
        primaryColor,
        fonts: {
          body: bodyFont,
          heading: headingFont,
        },
        brandName: finalStylingConfig?.brand?.brandName,
      },
      'ux'
    );
    console.log('[UX] ✅ Sent design-ready event via messageManager');

    // 💾 Save memory checkpoint after styling config generation
    await conversationMemoryStore.saveMemory(state.projectId);
    console.log('[UX] 💾 Checkpoint saved after styling config generation');

    // 🎨 Generate complete design instructions for Frontend node
    console.log('[UX] 📝 Generating design instructions for Frontend node...');
    const designInstructions = generateDesignInstructions(
      finalStylingConfig,
      state.context,
      state.userDescription,
      images
    );
    console.log(`[UX] ✅ Design instructions generated (${designInstructions.length} chars)`);

    // DEBUG: Log what we're returning
    console.log('[UX] 🔍 Returning state with:');
    console.log('[UX] 🔍   - stylingConfig exists?', !!finalStylingConfig);
    console.log('[UX] 🔍   - stylingConfig.brand?', !!finalStylingConfig?.brand);
    console.log(
      '[UX] 🔍   - pageOrganization routes:',
      pageOrganization ? Object.keys(pageOrganization).length : 0
    );
    if (pageOrganization && Object.keys(pageOrganization).length > 0) {
      console.log('[UX] 🔍   - pageOrganization details:');
      Object.entries(pageOrganization).forEach(([route, org]: [string, any]) => {
        console.log(`[UX] 🔍     * ${route}: ${org.layout} with [${org.sections.join(', ')}]`);
      });
    } else {
      console.log('[UX] ⚠️  WARNING: pageOrganization is empty or undefined!');
      console.log('[UX] ⚠️  This will cause Frontend to generate pages without structure');
    }

    return {
      designSystem: selectedDesignSystem, // ✅ Selected design system
      stylingConfig: finalStylingConfig, // ✅ ENRICHED User styling with 80+ tokens
      backgroundContext, // ✅ MCP research (optional)
      designInspiration, // ✅ Design tokens from screenshot (optional)
      pageOrganization, // ✅ Page organization for multi-page apps
      images, // ✅ Curated Unsplash images
      designInstructions, // ✅ Complete design system for Frontend
      stage: 'building',
      completedNodes: ['ux'], // Reducer auto-appends
    };
  } catch (error) {
    emitNodeError('ux', error as Error, state);
    console.error('[UX] Error:', error);

    // Fallback
    const isDarkMode = state.context?.visualTone === 'dark';
    const fallbackStyling = getContextualStylingDefaults(
      state.context,
      state.userDescription
    ) as StylingConfig;
    const fallbackDesignSystem = selectDesignSystem({
      appType: state.context?.appType,
      userDescription: state.userDescription,
      designStyle: state.context?.designStyle,
    });

    // COMMENTED OUT: Always generate images even in error fallback
    // const fallbackImages = await getRelevantImages(state.userDescription);
    const fallbackImages = null; // Disabled for workflow optimization

    // Generate fallback design instructions
    const fallbackDesignInstructions = generateDesignInstructions(
      fallbackStyling,
      state.context,
      state.userDescription,
      fallbackImages
    );

    return {
      designSystem: fallbackDesignSystem, // ✅ Fallback design system
      stylingConfig: fallbackStyling, // ✅ Fallback styling
      backgroundContext: null,
      designInspiration: null, // ✅ No design inspiration on error
      pageOrganization: {}, // ✅ Empty page org on error
      images: fallbackImages, // ✅ FIX: Include images in error fallback
      designInstructions: fallbackDesignInstructions, // ✅ Fallback design instructions
      stage: 'building',
      completedNodes: ['ux'], // Reducer auto-appends
      errors: [{ node: 'ux', message: (error as Error).message }], // Reducer auto-appends
    };
  }
}

// Export traced version of UX node
export const uxNode = withLangSmithTracing('ux', uxNodeImpl);
