// @ts-nocheck
/**
 * THEME CONFIGURATION
 *
 * This file defines all color palettes for the app.
 * To change the entire theme, simply update the colors in the active palette below.
 *
 * BORDER USAGE RULES:
 * - Colored buttons (primary, danger): NO BORDERS
 * - Neutral buttons (secondary, outline, ghost with bg): BORDERS REQUIRED
 * - All borders: 0.75px by default (consistent everywhere)
 * - Border colors: Grey tones - ONLY use border-border-* tokens
 * - Never hardcode border colors (e.g., no border-blue-200)
 *
 * BACKGROUND USAGE RULES:
 * - Use bg-background-* tokens for neutral backgrounds
 * - Use semantic tokens (bg-success, bg-error, etc.) for colored backgrounds
 * - Light backgrounds: bg-background-subtle or semantic/10 (e.g., bg-success/10)
 * - Never use hardcoded shades: bg-*-50/100/200 (gray/blue/green)
 */

export interface ColorPalette {
  name: string;
  colors: {
    // Brand colors - Primary
    brandPrimary: string;
    brandPrimaryHover: string;
    brandPrimaryLight: string;
    brandPrimaryPale: string;
    brandPrimarySubtle: string;

    // Accent colors
    accentDefault: string;
    accentLight: string;
    accentPale: string;
    accentHover: string;

    // Background elevation levels
    backgroundBase: string;
    backgroundRaised: string;
    backgroundOverlay: string;
    backgroundSunken: string;
    backgroundSubtle: string;

    // Text hierarchy
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textSubtle: string;
    textInverse: string;

    // Border hierarchy
    borderSubtle: string;
    borderLight: string;
    borderDefault: string;
    borderStrong: string;
    borderFocus: string;
    borderFocusLight: string;

    // Semantic colors
    success: string;
    error: string;
    warning: string;
    info: string;

    // Gradient tokens (CSS linear-gradient strings)
    gradientBrand: string;
    gradientBrandBr: string;
    gradientBrandHover: string;
    gradientSuccess: string;
    gradientError: string;
    gradientWarning: string;
    gradientInfo: string;
    gradientBlue: string;
    gradientPurple: string;
    gradientOrange: string;
    gradientCyan: string;
  };
}

// ============================================
// DEFAULT THEME (Dark Gold - Current)
// ============================================
export const warmOrangeTheme: ColorPalette = {
  name: "Dark Gold",
  colors: {
    // Brand colors - Primary Gold/Button (#AE851B from your palette)
    brandPrimary: "#AE851B",
    brandPrimaryHover: "#957216",
    brandPrimaryLight: "#C19A3A",
    brandPrimaryPale: "#D4B465",
    brandPrimarySubtle: "#323230",    // One notch darker

    // Accent colors - Gold variants
    accentDefault: "#C19A3A",
    accentLight: "#D4B465",
    accentPale: "#323230",            // One notch darker
    accentHover: "#957216",

    // Background elevation levels - SLIGHTLY DARKER (middle point)
    backgroundBase: "#222220",        // Main background (was #262624, went to #1E1E1C, now middle)
    backgroundRaised: "#2A2A28",      // Component boxes (was #2E2E2C, went to #262624, now middle)
    backgroundOverlay: "#313131",     // Overlays (was #353533, went to #2E2E2C, now middle)
    backgroundSunken: "#1A1A18",      // Sunken areas (was #1E1E1C, went to #171715, now middle)
    backgroundSubtle: "#363634",      // Subtle highlights (was #3A3A38, went to #323230, now middle)

    // Text hierarchy (#FAF9F5 primary from your palette)
    textPrimary: "#FAF9F5",
    textSecondary: "#E5E4DD",
    textTertiary: "#C8C7C0",
    textSubtle: "#A09F98",
    textInverse: "#FFFFFF",

    // Border hierarchy - Grey tones (visible but subtle)
    borderSubtle: "#3A3836",          // Subtle grey (slightly lighter than bg)
    borderLight: "#53504A",           // Light grey (visible, good contrast)
    borderDefault: "#5A5753",         // Default grey (more visible)
    borderStrong: "#6B6762",          // Strong grey (most visible)
    borderFocus: "#AE851B",
    borderFocusLight: "#C19A3A",

    // Semantic colors - Vibrant and consistent with gradients
    success: "#22C55E",     // green-500 (matches gradientSuccess start)
    error: "#EF4444",       // red-500 (matches gradientError start)
    warning: "#F59E0B",     // amber-500 (matches gradientWarning start)
    info: "#3B82F6",        // blue-500 (matches gradientInfo start)

    // Gradient tokens - Exact colors from hardcoded usage
    gradientBrand: "linear-gradient(to right, #FCD34D, #D97706)",              // amber-400 to yellow-600
    gradientBrandBr: "linear-gradient(to bottom right, #FCD34D, #D97706)",     // amber-400 to yellow-600
    gradientBrandHover: "linear-gradient(to right, #F59E0B, #B45309)",         // amber-500 to yellow-700
    gradientSuccess: "linear-gradient(to bottom right, #22C55E, #10B981)",     // green-500 to emerald-600
    gradientError: "linear-gradient(to bottom right, #EF4444, #DC2626)",       // red-500 to red-600
    gradientWarning: "linear-gradient(to right, #F59E0B, #D97706)",            // amber-500 to amber-600
    gradientInfo: "linear-gradient(to bottom right, #3B82F6, #2563EB)",        // blue-500 to blue-600
    gradientBlue: "linear-gradient(to bottom right, #3B82F6, #4F46E5)",        // blue-500 to indigo-600
    gradientPurple: "linear-gradient(to bottom right, #A855F7, #7C3AED)",      // purple-500 to violet-600
    gradientOrange: "linear-gradient(to bottom right, #F97316, #DC2626)",      // orange-500 to red-600
    gradientCyan: "linear-gradient(to bottom right, #06B6D4, #0284C7)",        // cyan-500 to cyan-600
  },
};

// ============================================
// ALTERNATIVE THEME 1: Cool Blue
// ============================================
export const coolBlueTheme: ColorPalette = {
  name: "Cool Blue",
  colors: {
    // Brand colors - Primary Blue
    brandPrimary: "#2563EB",
    brandPrimaryHover: "#1D4ED8",
    brandPrimaryLight: "#60A5FA",
    brandPrimaryPale: "#DBEAFE",
    brandPrimarySubtle: "#EFF6FF",

    // Accent colors - Purple
    accentDefault: "#7C3AED",
    accentLight: "#A78BFA",
    accentPale: "#EDE9FE",
    accentHover: "#6D28D9",

    // Background elevation levels
    backgroundBase: "#F8FAFC",
    backgroundRaised: "#FFFFFF",
    backgroundOverlay: "#FFFFFF",
    backgroundSunken: "#F1F5F9",
    backgroundSubtle: "#E2E8F0",

    // Text hierarchy
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textTertiary: "#64748B",
    textSubtle: "#94A3B8",
    textInverse: "#FFFFFF",

    // Border hierarchy
    borderSubtle: "#F1F5F9",
    borderLight: "#E2E8F0",
    borderDefault: "#CBD5E1",
    borderStrong: "#94A3B8",
    borderFocus: "#2563EB",
    borderFocusLight: "#60A5FA",

    // Semantic colors
    success: "#059669",
    error: "#DC2626",
    warning: "#D97706",
    info: "#0284C7",
  },
};

// ============================================
// ALTERNATIVE THEME 2: Purple Dream
// ============================================
export const purpleDreamTheme: ColorPalette = {
  name: "Purple Dream",
  colors: {
    // Brand colors - Primary Purple
    brandPrimary: "#9333EA",
    brandPrimaryHover: "#7E22CE",
    brandPrimaryLight: "#C084FC",
    brandPrimaryPale: "#F3E8FF",
    brandPrimarySubtle: "#FAF5FF",

    // Accent colors - Pink
    accentDefault: "#EC4899",
    accentLight: "#F9A8D4",
    accentPale: "#FCE7F3",
    accentHover: "#DB2777",

    // Background elevation levels
    backgroundBase: "#FEFCE8",
    backgroundRaised: "#FFFFFF",
    backgroundOverlay: "#FFFFFF",
    backgroundSunken: "#FEF9C3",
    backgroundSubtle: "#FEF3C7",

    // Text hierarchy
    textPrimary: "#1F2937",
    textSecondary: "#4B5563",
    textTertiary: "#6B7280",
    textSubtle: "#9CA3AF",
    textInverse: "#FFFFFF",

    // Border hierarchy
    borderSubtle: "#FEF3C7",
    borderLight: "#FDE68A",
    borderDefault: "#FCD34D",
    borderStrong: "#FBBF24",
    borderFocus: "#9333EA",
    borderFocusLight: "#C084FC",

    // Semantic colors
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
  },
};

// ============================================
// ALTERNATIVE THEME 3: Green Nature
// ============================================
export const greenNatureTheme: ColorPalette = {
  name: "Green Nature",
  colors: {
    // Brand colors - Primary Green
    brandPrimary: "#059669",
    brandPrimaryHover: "#047857",
    brandPrimaryLight: "#34D399",
    brandPrimaryPale: "#D1FAE5",
    brandPrimarySubtle: "#ECFDF5",

    // Accent colors - Lime
    accentDefault: "#65A30D",
    accentLight: "#A3E635",
    accentPale: "#ECFCCB",
    accentHover: "#4D7C0F",

    // Background elevation levels
    backgroundBase: "#FEFCE8",
    backgroundRaised: "#FFFFFF",
    backgroundOverlay: "#FFFFFF",
    backgroundSunken: "#F7FEE7",
    backgroundSubtle: "#ECFCCB",

    // Text hierarchy
    textPrimary: "#14532D",
    textSecondary: "#166534",
    textTertiary: "#15803D",
    textSubtle: "#22C55E",
    textInverse: "#FFFFFF",

    // Border hierarchy
    borderSubtle: "#F0FDF4",
    borderLight: "#DCFCE7",
    borderDefault: "#BBF7D0",
    borderStrong: "#86EFAC",
    borderFocus: "#059669",
    borderFocusLight: "#34D399",

    // Semantic colors
    success: "#059669",
    error: "#DC2626",
    warning: "#EA580C",
    info: "#0284C7",
  },
};

// ============================================
// ACTIVE THEME SELECTOR
// ============================================
/**
 * CHANGE THIS to switch themes instantly!
 * Available options:
 * - warmOrangeTheme (default)
 * - coolBlueTheme
 * - purpleDreamTheme
 * - greenNatureTheme
 */
export const activeTheme = warmOrangeTheme;

/**
 * Get CSS variables object for the active theme
 * This is used by the ThemeProvider to inject CSS variables
 */
export function getThemeCSSVariables(theme: ColorPalette = activeTheme) {
  // Helper to convert hex to HSL for Tailwind
  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;

    let h = 0, s = 0;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Helper to convert hex to RGB channels (space-separated for Tailwind opacity)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
  };

  return {
    // Brand colors
    "--color-brand-primary": theme.colors.brandPrimary,
    "--color-brand-primary-hover": theme.colors.brandPrimaryHover,
    "--color-brand-primary-light": theme.colors.brandPrimaryLight,
    "--color-brand-primary-pale": theme.colors.brandPrimaryPale,
    "--color-brand-primary-subtle": theme.colors.brandPrimarySubtle,

    // Accent colors
    "--color-accent-default": theme.colors.accentDefault,
    "--color-accent-light": theme.colors.accentLight,
    "--color-accent-pale": theme.colors.accentPale,
    "--color-accent-hover": theme.colors.accentHover,

    // Background colors
    "--color-background-base": theme.colors.backgroundBase,
    "--color-background-raised": theme.colors.backgroundRaised,
    "--color-background-overlay": theme.colors.backgroundOverlay,
    "--color-background-sunken": theme.colors.backgroundSunken,
    "--color-background-subtle": theme.colors.backgroundSubtle,

    // Text colors
    "--color-text-primary": theme.colors.textPrimary,
    "--color-text-secondary": theme.colors.textSecondary,
    "--color-text-tertiary": theme.colors.textTertiary,
    "--color-text-subtle": theme.colors.textSubtle,
    "--color-text-inverse": theme.colors.textInverse,

    // Border colors
    "--color-border-subtle": theme.colors.borderSubtle,
    "--color-border-light": theme.colors.borderLight,
    "--color-border-default": theme.colors.borderDefault,
    "--color-border-strong": theme.colors.borderStrong,
    "--color-border-focus": theme.colors.borderFocus,
    "--color-border-focus-light": theme.colors.borderFocusLight,

    // Shadcn border variable (convert borderLight hex to HSL for Tailwind - NO % signs!)
    "--border": (() => {
      const hsl = hexToHsl(theme.colors.borderLight);
      return hsl ? `${hsl.h} ${hsl.s} ${hsl.l}` : "60 2 16";
    })(),

    // Semantic colors (hex for backward compatibility)
    "--color-success": theme.colors.success,
    "--color-error": theme.colors.error,
    "--color-warning": theme.colors.warning,
    "--color-info": theme.colors.info,

    // Semantic colors (RGB channels for Tailwind opacity modifiers)
    "--color-success-rgb": hexToRgb(theme.colors.success) || "139 195 74",
    "--color-error-rgb": hexToRgb(theme.colors.error) || "216 124 124",
    "--color-warning-rgb": hexToRgb(theme.colors.warning) || "255 193 7",
    "--color-info-rgb": hexToRgb(theme.colors.info) || "33 150 243",

    // Gradient tokens
    "--gradient-brand": theme.colors.gradientBrand,
    "--gradient-brand-br": theme.colors.gradientBrandBr,
    "--gradient-brand-hover": theme.colors.gradientBrandHover,
    "--gradient-success": theme.colors.gradientSuccess,
    "--gradient-error": theme.colors.gradientError,
    "--gradient-warning": theme.colors.gradientWarning,
    "--gradient-info": theme.colors.gradientInfo,
    "--gradient-blue": theme.colors.gradientBlue,
    "--gradient-purple": theme.colors.gradientPurple,
    "--gradient-orange": theme.colors.gradientOrange,
    "--gradient-cyan": theme.colors.gradientCyan,
  };
}
