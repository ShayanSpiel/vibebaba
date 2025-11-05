"use client";

import { useEffect, useState, createContext, useContext, useLayoutEffect } from "react";
import { getThemeCSSVariables, activeTheme, ColorPalette } from "./theme-config";

interface ThemeContextType {
  currentTheme: ColorPalette;
  switchTheme: (theme: ColorPalette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

/**
 * ThemeProvider
 *
 * Injects CSS variables into the document root for dynamic theming.
 * Works seamlessly with Tailwind CSS using the theme() function.
 * Now supports runtime theme switching!
 *
 * Uses useLayoutEffect to apply theme BEFORE paint to prevent FOUC.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ColorPalette>(activeTheme);

  const applyTheme = (theme: ColorPalette) => {
    // Get CSS variables for the theme
    const cssVars = getThemeCSSVariables(theme);

    // Apply CSS variables to the root element
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  };

  // Use useLayoutEffect instead of useEffect to apply theme BEFORE paint
  // This prevents flash of unstyled content (FOUC)
  useLayoutEffect(() => {
    // Apply the initial theme synchronously
    applyTheme(currentTheme);
  }, [currentTheme]);

  const switchTheme = (theme: ColorPalette) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
