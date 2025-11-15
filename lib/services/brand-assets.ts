// lib/services/brand-assets.ts
import { colord } from 'colord';

// ============================================================================
// TYPES
// ============================================================================

export interface LogoConfig {
  brandName: string;
  primaryColor: string;
  secondaryColor?: string;
  fontFamily?: string;
  style?: 'minimal' | 'modern' | 'playful' | 'professional';
}

export interface BrandAssetPaths {
  logo: string;
  logoDark?: string;
  favicon: string;
  icon192: string;
  icon512: string;
  appleTouchIcon: string;
}

// ============================================================================
// LOGO GENERATION
// ============================================================================

/**
 * Generate SVG logo from brand name and colors
 * Creates a template-based logo with initials or text
 */
export function generateLogo(config: LogoConfig): string {
  const { brandName, primaryColor, secondaryColor, style = 'modern' } = config;

  // Extract initials (up to 2 characters)
  const initials = brandName
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');

  // Determine if we should use initials or full name
  const useInitials = brandName.length > 12;
  const displayText = useInitials ? initials : brandName;

  // Get contrasting text color
  const textColor = colord(primaryColor).isDark() ? '#ffffff' : '#000000';

  // Generate SVG based on style
  let svg: string;

  switch (style) {
    case 'minimal':
      svg = generateMinimalLogo(displayText, primaryColor, textColor);
      break;
    case 'modern':
      svg = generateModernLogo(
        displayText,
        primaryColor,
        secondaryColor || primaryColor,
        textColor
      );
      break;
    case 'playful':
      svg = generatePlayfulLogo(
        displayText,
        primaryColor,
        secondaryColor || primaryColor,
        textColor
      );
      break;
    case 'professional':
      svg = generateProfessionalLogo(displayText, primaryColor, textColor);
      break;
    default:
      svg = generateModernLogo(
        displayText,
        primaryColor,
        secondaryColor || primaryColor,
        textColor
      );
  }

  return svg;
}

/**
 * Minimal logo style - Simple text with subtle background
 */
function generateMinimalLogo(text: string, bgColor: string, textColor: string): string {
  return `<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="60" fill="${bgColor}" rx="8"/>
  <text
    x="100"
    y="38"
    font-family="Inter, system-ui, sans-serif"
    font-size="24"
    font-weight="700"
    fill="${textColor}"
    text-anchor="middle"
  >${text}</text>
</svg>`;
}

/**
 * Modern logo style - Gradient background with bold text
 */
function generateModernLogo(
  text: string,
  color1: string,
  color2: string,
  textColor: string
): string {
  return `<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" fill="url(#grad1)" rx="12"/>
  <text
    x="100"
    y="40"
    font-family="Inter, system-ui, sans-serif"
    font-size="28"
    font-weight="800"
    fill="${textColor}"
    text-anchor="middle"
    letter-spacing="1"
  >${text}</text>
</svg>`;
}

/**
 * Playful logo style - Rounded shape with vibrant colors
 */
function generatePlayfulLogo(
  text: string,
  color1: string,
  color2: string,
  textColor: string
): string {
  return `<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" fill="url(#grad2)" rx="30"/>
  <circle cx="30" cy="30" r="5" fill="${textColor}" opacity="0.3"/>
  <circle cx="170" cy="30" r="5" fill="${textColor}" opacity="0.3"/>
  <text
    x="100"
    y="40"
    font-family="'Comic Sans MS', cursive, sans-serif"
    font-size="26"
    font-weight="700"
    fill="${textColor}"
    text-anchor="middle"
  >${text}</text>
</svg>`;
}

/**
 * Professional logo style - Clean geometric design
 */
function generateProfessionalLogo(text: string, bgColor: string, textColor: string): string {
  return `<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="60" fill="${bgColor}"/>
  <rect x="0" y="0" width="6" height="60" fill="${textColor}" opacity="0.8"/>
  <text
    x="110"
    y="38"
    font-family="'Georgia', serif"
    font-size="22"
    font-weight="600"
    fill="${textColor}"
    text-anchor="middle"
    letter-spacing="2"
  >${text}</text>
</svg>`;
}

/**
 * Generate dark mode version of logo
 */
export function generateDarkModeLogo(config: LogoConfig): string {
  // For dark mode, lighten the color
  const darkColor = colord(config.primaryColor).lighten(0.3).toHex();

  return generateLogo({
    ...config,
    primaryColor: darkColor,
  });
}

// ============================================================================
// FAVICON GENERATION (Simplified - uses same logo)
// ============================================================================

/**
 * Generate simple square favicon SVG from logo
 * Creates a smaller, icon-optimized version
 */
export function generateFaviconSVG(config: LogoConfig): string {
  const { brandName, primaryColor } = config;

  // Use first letter only for favicon
  const letter = brandName[0]?.toUpperCase() || 'A';
  const textColor = colord(primaryColor).isDark() ? '#ffffff' : '#000000';

  return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="${primaryColor}" rx="4"/>
  <text
    x="16"
    y="23"
    font-family="Inter, system-ui, sans-serif"
    font-size="18"
    font-weight="800"
    fill="${textColor}"
    text-anchor="middle"
  >${letter}</text>
</svg>`;
}

// ============================================================================
// MANIFEST.JSON GENERATION
// ============================================================================

/**
 * Generate web app manifest with brand assets
 */
export function generateManifest(
  brandName: string,
  primaryColor: string,
  description?: string
): string {
  const manifest = {
    name: brandName,
    short_name: brandName.split(' ')[0],
    description: description || `${brandName} - Progressive Web App`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: primaryColor,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return JSON.stringify(manifest, null, 2);
}

// ============================================================================
// SVG TO DATA URI CONVERSION
// ============================================================================

/**
 * Convert SVG string to data URI for embedding
 */
export function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generate all brand assets as data URIs (for immediate use)
 */
export function generateBrandAssetsDataUris(config: LogoConfig): {
  logo: string;
  logoDark: string;
  favicon: string;
} {
  const logoSvg = generateLogo(config);
  const darkLogoSvg = generateDarkModeLogo(config);
  const faviconSvg = generateFaviconSVG(config);

  return {
    logo: svgToDataUri(logoSvg),
    logoDark: svgToDataUri(darkLogoSvg),
    favicon: svgToDataUri(faviconSvg),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateLogo,
  generateDarkModeLogo,
  generateFaviconSVG,
  generateManifest,
  svgToDataUri,
  generateBrandAssetsDataUris,
};
