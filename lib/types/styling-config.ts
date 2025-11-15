// lib/types/styling-config.ts

export interface ColorTheme {
  mode: 'light' | 'dark' | 'auto';
  primary: string; // Hex color (e.g., '#1890ff')
  secondary?: string; // Optional secondary color
  accent?: string; // Optional accent color
  background?: string; // Main background color
  backgroundSecondary?: string; // Secondary background (cards, panels)
  backgroundTertiary?: string; // Tertiary background (hover states)
  border?: string; // Border color
  muted?: string; // Muted text/elements
  destructive?: string; // Error/delete actions (red)
  success?: string; // Success states (green)
  warning?: string; // Warning states (yellow/orange)
  info?: string; // Info states (blue)
}

export interface LayoutConfig {
  direction: 'ltr' | 'rtl';
  maxWidth: '1200px' | '1400px' | '1600px' | 'full';
  spacing: 'compact' | 'normal' | 'spacious';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
}

export interface TypographyConfig {
  fontFamily:
    | 'Inter'
    | 'Roboto'
    | 'Poppins'
    | 'Montserrat'
    | 'Open Sans'
    | 'Lato'
    | 'Playfair Display'
    | 'Space Grotesk'
    | 'custom';
  customFont?: string; // If fontFamily === 'custom'
  scale: 'small' | 'normal' | 'large';
  headingWeight: 400 | 500 | 600 | 700 | 800 | 900;
  bodyWeight?: 300 | 400 | 500; // Body text weight
  weights?: number[]; // Font weights to load from Google Fonts
}

export interface IconographyConfig {
  style: 'outlined' | 'filled' | 'two-tone' | 'rounded';
  source: 'lucide' | 'heroicons' | 'material-icons'; // Standardized to match frontend usage
  size: 'small' | 'medium' | 'large';
}

export interface AnimationsConfig {
  enabled: boolean;
  intensity: 'none' | 'subtle' | 'moderate' | 'heavy';
  transitions: boolean;
  pageTransitions: boolean;
  hoverEffects: boolean;
}

// ============================================================================
// BRAND CONFIGURATION
// ============================================================================

export interface BrandConfig {
  /** Design system framework */
  designSystem: 'Shadcn/Tailwind' | 'Material UI' | 'Ant Design' | 'Chakra UI';

  /** Underlying CSS/styling technology */
  stylingFramework: 'Tailwind CSS' | 'CSS Modules' | 'Styled Components' | 'Emotion';

  /** Brand name */
  brandName: string;

  /** Logo assets */
  logoAssets: {
    /** Path to main logo */
    primary: string;
    /** Path to favicon */
    favicon: string;
    /** Path to dark mode logo (optional) */
    dark?: string;
  };

  /** Responsive breakpoints */
  breakpoints: {
    sm: string; // e.g., "640px"
    md: string; // e.g., "768px"
    lg: string; // e.g., "1024px"
    xl: string; // e.g., "1280px"
    '2xl': string; // e.g., "1536px"
  };
}

// ============================================================================
// ENHANCED COLOR THEME WITH SEMANTIC COLORS
// ============================================================================

export interface SemanticColors {
  /** Default text color */
  textDefault: string;
  /** Secondary/muted text */
  textSecondary: string;
  /** Disabled text */
  textDisabled: string;
  /** Text on colored backgrounds */
  textOnColor: string;

  /** Default background */
  bgDefault: string;
  /** Surface/card background */
  bgSurface: string;
  /** Elevated surface background */
  bgElevated: string;
  /** Overlay background */
  bgOverlay: string;

  /** Default border color */
  borderDefault: string;
  /** Subtle border (lighter) */
  borderSubtle: string;
  /** Strong border (darker) */
  borderStrong: string;

  /** Interactive elements (links, buttons) */
  interactive: string;
  /** Interactive hover state */
  interactiveHover: string;
  /** Interactive active/pressed state */
  interactiveActive: string;
}

export interface DarkModeOverrides {
  /** Dark mode background */
  bgDefault: string;
  /** Dark mode surface */
  bgSurface: string;
  /** Dark mode text */
  textDefault: string;
  /** Dark mode borders */
  borderDefault: string;
  /** Additional dark mode overrides */
  [key: string]: string;
}

export interface ShadowSystem {
  /** Small shadow (subtle elevation) */
  sm: string;
  /** Medium shadow (cards) */
  md: string;
  /** Large shadow (modals) */
  lg: string;
  /** Extra large shadow (high elevation) */
  xl: string;
  /** 2XL shadow (popovers) */
  '2xl': string;
  /** Inner shadow */
  inner: string;
}

// Extend existing ColorTheme interface
export interface EnhancedColorTheme extends ColorTheme {
  /** Semantic color mappings */
  semantic: SemanticColors;

  /** Dark mode color overrides */
  darkMode?: DarkModeOverrides;

  /** Shadow/elevation system */
  shadows: ShadowSystem;
}

// ============================================================================
// ENHANCED TYPOGRAPHY
// ============================================================================

export interface FontSizes {
  xs: string; // 0.75rem
  sm: string; // 0.875rem
  base: string; // 1rem
  lg: string; // 1.125rem
  xl: string; // 1.25rem
  '2xl': string; // 1.5rem
  '3xl': string; // 1.875rem
  '4xl': string; // 2.25rem
  '5xl': string; // 3rem
  h1: string; // Heading 1
  h2: string; // Heading 2
  h3: string; // Heading 3
  h4: string; // Heading 4
  h5: string; // Heading 5
  h6: string; // Heading 6
}

export interface LineHeights {
  none: number; // 1
  tight: number; // 1.25
  snug: number; // 1.375
  normal: number; // 1.5
  relaxed: number; // 1.625
  loose: number; // 2
}

export interface FontWeights {
  thin: number; // 100
  extralight: number; // 200
  light: number; // 300
  normal: number; // 400
  medium: number; // 500
  semibold: number; // 600
  bold: number; // 700
  extrabold: number; // 800
  black: number; // 900
}

// Extend existing TypographyConfig
export interface EnhancedTypographyConfig extends TypographyConfig {
  /** Font size scale */
  fontSizes: FontSizes;

  /** Line height scale */
  lineHeights: LineHeights;

  /** Font weight scale */
  fontWeights: FontWeights;

  /** Primary font stack (full CSS) */
  fontFamilyPrimary: string; // e.g., "'Inter', sans-serif"

  /** Heading font stack (full CSS) */
  fontFamilyHeading: string; // e.g., "'Georgia', serif"
}

// ============================================================================
// SPACING CONFIGURATION
// ============================================================================

export interface SpacingScale {
  '0': string; // 0
  '1': string; // 0.25rem
  '2': string; // 0.5rem
  '3': string; // 0.75rem
  '4': string; // 1rem
  '5': string; // 1.25rem
  '6': string; // 1.5rem
  '8': string; // 2rem
  '10': string; // 2.5rem
  '12': string; // 3rem
  '16': string; // 4rem
  '20': string; // 5rem
  '24': string; // 6rem
  '32': string; // 8rem
}

export interface LayoutSpacing {
  /** Maximum container width */
  containerMax: string; // e.g., "1280px"

  /** Section padding (vertical) */
  sectionPadding: string; // e.g., "4rem"

  /** Component gap (default) */
  componentGap: string; // e.g., "1rem"

  /** Grid gutter */
  gridGutter: string; // e.g., "1.5rem"
}

export interface SpacingConfig {
  /** Spacing scale */
  scale: SpacingScale;

  /** Layout-specific spacing */
  layout: LayoutSpacing;
}

// ============================================================================
// BORDERING CONFIGURATION
// ============================================================================

export interface BorderRadiusScale {
  none: string; // 0
  sm: string; // 0.125rem
  md: string; // 0.375rem
  lg: string; // 0.5rem
  xl: string; // 0.75rem
  '2xl': string; // 1rem
  '3xl': string; // 1.5rem
  full: string; // 9999px
}

export interface BorderWidths {
  none: string; // 0
  thin: string; // 1px
  medium: string; // 2px
  thick: string; // 4px
}

export interface BorderingConfig {
  /** Border radius scale */
  radiusScale: BorderRadiusScale;

  /** Border width scale */
  borderWidths: BorderWidths;
}

// ============================================================================
// TRANSITION CONFIGURATION
// ============================================================================

export interface TransitionDurations {
  fast: string; // 150ms
  normal: string; // 300ms
  slow: string; // 500ms
}

export interface EasingFunctions {
  default: string; // ease-in-out
  linear: string; // linear
  easeIn: string; // ease-in
  easeOut: string; // ease-out
  spring: string; // cubic-bezier(0.68, -0.55, 0.265, 1.55)
}

export interface ZIndices {
  dropdown: number; // 100
  sticky: number; // 200
  fixed: number; // 300
  overlay: number; // 400
  modal: number; // 500
  popover: number; // 600
  toast: number; // 1000
}

export interface TransitionConfig {
  /** Transition durations */
  durations: TransitionDurations;

  /** Easing functions */
  easings: EasingFunctions;

  /** Z-index scale */
  zIndices: ZIndices;
}

// ============================================================================
// COMPONENT-SPECIFIC STYLING
// ============================================================================

export interface ButtonVariants {
  primary: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    activeBg: string;
  };
  secondary: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    activeBg: string;
  };
  outline: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    activeBg: string;
  };
  ghost: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    activeBg: string;
  };
  destructive: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    activeBg: string;
  };
}

export interface ButtonSizes {
  sm: {
    padding: string;
    fontSize: string;
    height: string;
  };
  md: {
    padding: string;
    fontSize: string;
    height: string;
  };
  lg: {
    padding: string;
    fontSize: string;
    height: string;
  };
}

export interface ButtonConfig {
  variants: ButtonVariants;
  sizes: ButtonSizes;
  defaultVariant: keyof ButtonVariants;
  defaultSize: keyof ButtonSizes;
}

export interface InputConfig {
  defaultBg: string;
  defaultBorder: string;
  focusBorder: string;
  focusRing: string;
  disabledBg: string;
  disabledText: string;
  errorBorder: string;
  successBorder: string;
  padding: string;
  fontSize: string;
  height: string;
  borderRadius: string;
}

export interface CardConfig {
  defaultBg: string;
  defaultBorder: string;
  hoverBg: string;
  hoverBorder: string;
  padding: string;
  borderRadius: string;
  shadow: string;
  hoverShadow: string;
}

export interface AlertConfig {
  info: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  success: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  warning: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  error: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  padding: string;
  borderRadius: string;
  borderWidth: string;
}

export interface ComponentStyleConfig {
  button: ButtonConfig;
  input: InputConfig;
  card: CardConfig;
  alert: AlertConfig;
}

// ============================================================================
// MAIN STYLING CONFIG (EXTENDED)
// ============================================================================

export interface StylingConfig {
  // ========== EXISTING FIELDS ==========
  colorTheme: ColorTheme;
  layout: LayoutConfig;
  typography: TypographyConfig;
  iconography: IconographyConfig;
  animations: AnimationsConfig;

  // ========== NEW ENRICHED FIELDS ==========

  /** Brand configuration (NEW) */
  brand?: BrandConfig;

  /** Enhanced color theme with semantics (NEW) */
  enhancedColors?: EnhancedColorTheme;

  /** Enhanced typography (NEW) */
  enhancedTypography?: EnhancedTypographyConfig;

  /** Spacing configuration (NEW) */
  spacing?: SpacingConfig;

  /** Border configuration (NEW) */
  bordering?: BorderingConfig;

  /** Transition configuration (NEW) */
  transitions?: TransitionConfig;

  /** Component-specific styles (NEW) */
  components?: ComponentStyleConfig;
}

// Default configurations
export const DEFAULT_STYLING_CONFIG: StylingConfig = {
  colorTheme: {
    primary: '#1890ff',
    mode: 'light',
  },
  layout: {
    direction: 'ltr',
    maxWidth: '1200px',
    spacing: 'normal',
  },
  typography: {
    fontFamily: 'Inter',
    scale: 'normal',
    headingWeight: 700,
  },
  iconography: {
    style: 'outlined',
    source: 'lucide',
    size: 'medium',
  },
  animations: {
    enabled: true,
    intensity: 'subtle',
    transitions: true,
    pageTransitions: false,
    hoverEffects: true,
  },
};
