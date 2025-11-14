import { colord } from 'colord';

/**
 * Convert hex color to HSL format for Tailwind CSS variables
 * @param hex - Hex color code (e.g., "#3B82F6")
 * @returns HSL string (e.g., "221.2 83.2% 53.3%")
 */
export function hexToHslString(hex: string): string {
  try {
    const color = colord(hex);
    const hsl = color.toHsl();
    return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
  } catch (error) {
    console.warn(`[Frontend] ⚠️ Failed to convert ${hex} to HSL, using fallback`);
    return '221.2 83.2% 53.3%'; // Fallback to blue
  }
}
