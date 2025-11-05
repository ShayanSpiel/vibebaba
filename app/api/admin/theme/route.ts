import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const THEME_CONFIG_PATH = path.join(process.cwd(), 'lib/theme/theme-config.ts');
const CUSTOM_THEMES_PATH = path.join(process.cwd(), 'lib/theme/custom-themes.json');

// Available default themes
const DEFAULT_THEMES = [
  'warmOrangeTheme',
  'coolBlueTheme',
  'purpleDreamTheme',
  'greenNatureTheme',
];

/**
 * GET /api/admin/theme
 * Get current active theme and available themes
 */
export async function GET() {
  try {
    // Read the current theme config file
    const configContent = await fs.readFile(THEME_CONFIG_PATH, 'utf-8');

    // Extract the active theme
    const activeThemeMatch = configContent.match(/export const activeTheme = (\w+);/);
    const activeTheme = activeThemeMatch ? activeThemeMatch[1] : 'warmOrangeTheme';

    // Load custom themes if they exist
    let customThemes = [];
    try {
      const customThemesContent = await fs.readFile(CUSTOM_THEMES_PATH, 'utf-8');
      customThemes = JSON.parse(customThemesContent);
    } catch (error) {
      // Custom themes file doesn't exist yet, that's okay
    }

    return NextResponse.json({
      success: true,
      activeTheme,
      availableThemes: DEFAULT_THEMES,
      customThemes,
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch theme configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/theme
 * Switch the active theme or add a new custom theme
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, themeName, themeData } = body;

    if (action === 'switch') {
      // Switch to a different theme
      if (!themeName) {
        return NextResponse.json(
          { success: false, error: 'Theme name is required' },
          { status: 400 }
        );
      }

      // Read the current config file
      let configContent = await fs.readFile(THEME_CONFIG_PATH, 'utf-8');

      // Replace the active theme export
      configContent = configContent.replace(
        /export const activeTheme = \w+;/,
        `export const activeTheme = ${themeName};`
      );

      // Write back to file
      await fs.writeFile(THEME_CONFIG_PATH, configContent, 'utf-8');

      return NextResponse.json({
        success: true,
        message: `Theme switched to ${themeName}`,
        activeTheme: themeName,
      });
    } else if (action === 'add') {
      // Add a new custom theme
      if (!themeName || !themeData) {
        return NextResponse.json(
          { success: false, error: 'Theme name and data are required' },
          { status: 400 }
        );
      }

      // Validate theme data structure
      if (!themeData.name || !themeData.colors) {
        return NextResponse.json(
          { success: false, error: 'Invalid theme data structure' },
          { status: 400 }
        );
      }

      // Load existing custom themes
      let customThemes = [];
      try {
        const customThemesContent = await fs.readFile(CUSTOM_THEMES_PATH, 'utf-8');
        customThemes = JSON.parse(customThemesContent);
      } catch (error) {
        // File doesn't exist, start with empty array
      }

      // Check if theme already exists
      const existingIndex = customThemes.findIndex((t: any) => t.id === themeName);
      if (existingIndex >= 0) {
        // Update existing theme
        customThemes[existingIndex] = {
          id: themeName,
          ...themeData,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Add new theme
        customThemes.push({
          id: themeName,
          ...themeData,
          createdAt: new Date().toISOString(),
        });
      }

      // Save custom themes
      await fs.writeFile(CUSTOM_THEMES_PATH, JSON.stringify(customThemes, null, 2), 'utf-8');

      // Read the current config file
      let configContent = await fs.readFile(THEME_CONFIG_PATH, 'utf-8');

      // Generate theme constant code
      const themeConstant = generateThemeConstant(themeName, themeData);

      // Check if this custom theme already exists in the config
      const customThemeRegex = new RegExp(
        `// Custom Theme: ${themeName}[\\s\\S]*?export const ${themeName}: ColorPalette = {[\\s\\S]*?};`,
        'g'
      );

      if (customThemeRegex.test(configContent)) {
        // Replace existing custom theme
        configContent = configContent.replace(customThemeRegex, themeConstant);
      } else {
        // Add new custom theme before the ACTIVE THEME SELECTOR section
        const insertPosition = configContent.indexOf('// ============================================\n// ACTIVE THEME SELECTOR');
        if (insertPosition >= 0) {
          configContent =
            configContent.slice(0, insertPosition) +
            themeConstant +
            '\n\n' +
            configContent.slice(insertPosition);
        }
      }

      // Write back to file
      await fs.writeFile(THEME_CONFIG_PATH, configContent, 'utf-8');

      return NextResponse.json({
        success: true,
        message: `Custom theme "${themeData.name}" added successfully`,
        themeName,
      });
    } else if (action === 'delete') {
      // Delete a custom theme
      if (!themeName) {
        return NextResponse.json(
          { success: false, error: 'Theme name is required' },
          { status: 400 }
        );
      }

      // Don't allow deleting default themes
      if (DEFAULT_THEMES.includes(themeName)) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete default themes' },
          { status: 400 }
        );
      }

      // Load existing custom themes
      let customThemes = [];
      try {
        const customThemesContent = await fs.readFile(CUSTOM_THEMES_PATH, 'utf-8');
        customThemes = JSON.parse(customThemesContent);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'No custom themes found' },
          { status: 404 }
        );
      }

      // Filter out the theme to delete
      customThemes = customThemes.filter((t: any) => t.id !== themeName);

      // Save updated custom themes
      await fs.writeFile(CUSTOM_THEMES_PATH, JSON.stringify(customThemes, null, 2), 'utf-8');

      // Read the current config file
      let configContent = await fs.readFile(THEME_CONFIG_PATH, 'utf-8');

      // Remove the theme constant from config
      const customThemeRegex = new RegExp(
        `// Custom Theme: ${themeName}[\\s\\S]*?export const ${themeName}: ColorPalette = {[\\s\\S]*?};\\n\\n`,
        'g'
      );
      configContent = configContent.replace(customThemeRegex, '');

      // Write back to file
      await fs.writeFile(THEME_CONFIG_PATH, configContent, 'utf-8');

      return NextResponse.json({
        success: true,
        message: `Custom theme deleted successfully`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update theme configuration' },
      { status: 500 }
    );
  }
}

/**
 * Generate TypeScript code for a custom theme constant
 */
function generateThemeConstant(themeName: string, themeData: any): string {
  const colors = themeData.colors;

  return `// ============================================
// Custom Theme: ${themeName}
// ============================================
export const ${themeName}: ColorPalette = {
  name: "${themeData.name}",
  colors: {
    // Brand colors - Primary
    brandPrimary: "${colors.brandPrimary}",
    brandPrimaryHover: "${colors.brandPrimaryHover}",
    brandPrimaryLight: "${colors.brandPrimaryLight}",
    brandPrimaryPale: "${colors.brandPrimaryPale}",
    brandPrimarySubtle: "${colors.brandPrimarySubtle}",

    // Accent colors
    accentDefault: "${colors.accentDefault}",
    accentLight: "${colors.accentLight}",
    accentPale: "${colors.accentPale}",
    accentHover: "${colors.accentHover}",

    // Background elevation levels
    backgroundBase: "${colors.backgroundBase}",
    backgroundRaised: "${colors.backgroundRaised}",
    backgroundOverlay: "${colors.backgroundOverlay}",
    backgroundSunken: "${colors.backgroundSunken}",
    backgroundSubtle: "${colors.backgroundSubtle}",

    // Text hierarchy
    textPrimary: "${colors.textPrimary}",
    textSecondary: "${colors.textSecondary}",
    textTertiary: "${colors.textTertiary}",
    textSubtle: "${colors.textSubtle}",
    textInverse: "${colors.textInverse}",

    // Border hierarchy
    borderSubtle: "${colors.borderSubtle}",
    borderLight: "${colors.borderLight}",
    borderDefault: "${colors.borderDefault}",
    borderStrong: "${colors.borderStrong}",
    borderFocus: "${colors.borderFocus}",
    borderFocusLight: "${colors.borderFocusLight}",

    // Semantic colors
    success: "${colors.success}",
    error: "${colors.error}",
    warning: "${colors.warning}",
    info: "${colors.info}",
  },
};`;
}
