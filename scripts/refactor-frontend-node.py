#!/usr/bin/env python3
"""
Frontend Node Refactoring Script
Extracts large code sections into separate modules to reduce file size from 5,647 lines to ~800 lines
"""

import os
import re

# File paths
FRONTEND_DIR = "/Users/shayan/Desktop/Projects/VB/lib/langgraph/nodes/frontend"
INDEX_FILE = f"{FRONTEND_DIR}/index.ts"

def read_file_lines(filepath, start=None, end=None):
    """Read specific lines from a file (1-indexed)"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        if start and end:
            return ''.join(lines[start-1:end])
        return ''.join(lines)

def extract_globals_css_template():
    """Extract globals.css generation (lines 1315-2275)"""
    print("Extracting globals.css template...")

    template_content = '''import { hexToHslString } from '../utils/color-converter';

/**
 * Generate globals.css file with theme colors and utilities
 * Direct generation - NO AI
 */
export function generateGlobalsCss(stylingConfig: any): string {
  const colors = stylingConfig?.colorTheme;
  const mode = colors?.mode || 'light';
  const typography = stylingConfig?.typography;
  const headingWeight = typography?.headingWeight || 700;
  const fontFamily = typography?.fontFamily || 'Inter';
  const animations = stylingConfig?.animations || { enabled: true, intensity: 'subtle' };
  const layout = stylingConfig?.layout || {};
  const borderRadius = layout?.borderRadius || 'medium';

  // Border radius mapping
  const radiusMap: Record<string, string> = {
    none: '0',
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
    full: '9999px'
  };
  const radiusValue = radiusMap[borderRadius] || '0.5rem';

  // Convert hex colors to HSL strings for Tailwind
  const primaryHSL = colors?.primary ? hexToHslString(colors.primary) : '221.2 83.2% 53.3%';
  const secondaryHSL = colors?.secondary ? hexToHslString(colors.secondary) : '210 40% 96.1%';
  const accentHSL = colors?.accent ? hexToHslString(colors.accent) : '217.2 91.2% 59.8%';
  const backgroundHSL = colors?.background ? hexToHslString(colors.background) : (mode === 'dark' ? '222.2 84% 4.9%' : '0 0% 100%');
  const backgroundSecondaryHSL = colors?.backgroundSecondary ? hexToHslString(colors.backgroundSecondary) : (mode === 'dark' ? '222.2 84% 8%' : '0 0% 98%');
  const backgroundTertiaryHSL = colors?.backgroundTertiary ? hexToHslString(colors.backgroundTertiary) : (mode === 'dark' ? '222.2 84% 11%' : '0 0% 96%');
  const borderHSL = colors?.border ? hexToHslString(colors.border) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 5.9% 90%');
  const mutedHSL = colors?.muted ? hexToHslString(colors.muted) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%');
  const destructiveHSL = colors?.destructive ? hexToHslString(colors.destructive) : '0 84.2% 60.2%';
  const successHSL = colors?.success ? hexToHslString(colors.success) : '142.1 76.2% 36.3%';
  const warningHSL = colors?.warning ? hexToHslString(colors.warning) : '32.1 94.6% 43.7%';
  const infoHSL = colors?.info ? hexToHslString(colors.info) : '221.2 83.2% 53.3%';

  console.log('[Frontend] 🎨 Generating globals.css with colors:', {
    primary: colors?.primary ? `${colors.primary} → ${primaryHSL}` : 'default',
    secondary: colors?.secondary ? `${colors.secondary} → ${secondaryHSL}` : 'default',
    accent: colors?.accent ? `${colors.accent} → ${accentHSL}` : 'default',
    border: colors?.border ? `${colors.border} → ${borderHSL}` : 'default',
    mode,
    fontFamily,
    borderRadius,
    animationIntensity: animations.intensity
  });

'''

    # Read the actual CSS template from the original file (lines 1369-2266)
    css_template_section = read_file_lines(INDEX_FILE, 1369, 2266)

    # Extract just the template literal content (inside the backticks)
    # Find the start of the template (after `const globalsCss = `)
    match = re.search(r'const globalsCss = `([^`]*)`', css_template_section, re.DOTALL)
    if not match:
        print("❌ Could not extract CSS template")
        return

    css_content = match.group(1)

    template_content += f'''  // Generate globals.css directly
  const globalsCss = `{css_content}`;

  console.log('[Frontend] ✅ globals.css directly generated - skipping AI');
  return globalsCss;
}}
'''

    output_path = f"{FRONTEND_DIR}/templates/globals-css-template.ts"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(template_content)

    print(f"✅ Created {output_path}")

def extract_api_client_generator():
    """Extract API client generator (lines 5335-5599)"""
    print("Extracting API client generator...")

    # Read the function
    api_client_code = read_file_lines(INDEX_FILE, 5335, 5599)

    content = '''/**
 * API Client Generator
 * Generates client-side TypeScript wrapper functions for calling backend PocketBase APIs
 * This is DIFFERENT from backend - Backend generates server collections, this generates client fetch wrappers
 */

'''
    content += api_client_code

    # Also include the helper functions (lines 5564-5627)
    helper_functions = read_file_lines(INDEX_FILE, 5564, 5627)
    content += "\n\n" + helper_functions

    output_path = f"{FRONTEND_DIR}/generators/api-client-generator.ts"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Created {output_path}")

def main():
    print("=" * 60)
    print("Frontend Node Refactoring")
    print("=" * 60)

    # Create directories
    os.makedirs(f"{FRONTEND_DIR}/templates", exist_ok=True)
    os.makedirs(f"{FRONTEND_DIR}/generators", exist_ok=True)
    os.makedirs(f"{FRONTEND_DIR}/prompts", exist_ok=True)
    os.makedirs(f"{FRONTEND_DIR}/validators", exist_ok=True)
    os.makedirs(f"{FRONTEND_DIR}/utils", exist_ok=True)

    # Extract modules
    extract_globals_css_template()
    extract_api_client_generator()

    print("=" * 60)
    print("✅ Refactoring complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
