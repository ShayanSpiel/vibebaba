"use client";

import { PocketBaseAuthProvider } from "@/components/auth/PocketBaseAuthProvider";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { useEffect } from "react";

// Extend Window interface for our custom properties
declare global {
  interface Window {
    __jsonErrorLogged?: boolean;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Filter out browser-generated console warnings (chromewebdata, etc.)
    if (typeof window !== 'undefined') {
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args: any[]) => {
        const message = String(args[0] || '');
        // Filter out ONLY chromewebdata and browser extension warnings
        // Keep deployment errors, workflow errors, and other app errors
        if (
          (message.includes('chromewebdata') ||
          message.includes('chrome-web-data') ||
          message.includes('chrome://') ||
          message.includes('chrome-extension://')) &&
          !message.includes('Deployment') && // Don't filter deployment errors
          !message.includes('Workflow') // Don't filter workflow errors
        ) {
          return; // Suppress these warnings
        }

        // Also filter out duplicate JSON parsing errors if they've been logged already
        if (message.includes('SyntaxError') && message.includes('JSON')) {
          // Only log once
          if (!window.__jsonErrorLogged) {
            window.__jsonErrorLogged = true;
            originalError.apply(console, args);
          }
          return;
        }

        originalError.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        const message = String(args[0] || '');
        // Filter out ONLY chromewebdata and browser extension warnings
        if (
          (message.includes('chromewebdata') ||
          message.includes('chrome-web-data') ||
          message.includes('chrome://') ||
          message.includes('chrome-extension://')) &&
          !message.includes('Deployment') // Don't filter deployment warnings
        ) {
          return; // Suppress these warnings
        }
        originalWarn.apply(console, args);
      };

      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <PocketBaseAuthProvider>{children}</PocketBaseAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
