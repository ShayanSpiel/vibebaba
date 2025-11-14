/**
 * SHARED COLOR UTILITIES
 *
 * Common color manipulation functions used across the codebase
 * Extracted from various locations to eliminate duplication
 */

import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

// Enable accessibility plugin for contrast validation
extend([a11yPlugin]);

/**
 * Adjust color brightness using colord library
 * @param hex - Hex color code
 * @param amount - Amount to lighten (positive) or darken (negative)
 * @returns Adjusted hex color
 */
export function adjustColorBrightness(hex: string, amount: number): string {
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
 * Check if a color meets WCAG contrast ratio requirements
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns True if contrast meets requirements
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  try {
    const fg = colord(foreground);
    const bg = colord(background);
    const ratio = fg.contrast(bg);

    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    // WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
    const requiredRatio = level === 'AAA' ? 7 : 4.5;

    return ratio >= requiredRatio;
  } catch {
    return false;
  }
}

/**
 * Get contrast ratio between two colors
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  try {
    const fg = colord(foreground);
    const bg = colord(background);
    return fg.contrast(bg);
  } catch {
    return 1;
  }
}

/**
 * Convert any color format to hex
 * @param color - Color in any format (rgb, hsl, named, etc.)
 * @returns Hex color string
 */
export function toHex(color: string): string {
  try {
    return colord(color).toHex();
  } catch {
    return color;
  }
}

/**
 * Check if a color is valid
 * @param color - Color string to validate
 * @returns True if valid color
 */
export function isValidColor(color: string): boolean {
  try {
    return colord(color).isValid();
  } catch {
    return false;
  }
}

/**
 * Generate a color palette from a base color
 * @param baseColor - Base color to generate palette from
 * @returns Object with color variations
 */
export function generateColorPalette(baseColor: string): {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
} {
  try {
    const color = colord(baseColor);
    return {
      50: color.lighten(0.4).toHex(),
      100: color.lighten(0.35).toHex(),
      200: color.lighten(0.25).toHex(),
      300: color.lighten(0.15).toHex(),
      400: color.lighten(0.05).toHex(),
      500: color.toHex(),
      600: color.darken(0.1).toHex(),
      700: color.darken(0.2).toHex(),
      800: color.darken(0.3).toHex(),
      900: color.darken(0.4).toHex(),
    };
  } catch {
    // Return gray scale as fallback
    return {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    };
  }
}
