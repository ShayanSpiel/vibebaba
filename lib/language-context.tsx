"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

type Locale = "en" | "fa";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<any>(null);

  const dir = locale === "fa" ? "rtl" : "ltr";

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "fa" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  // Load messages when locale changes
  useEffect(() => {
    console.log(`[LanguageProvider] Loading messages for locale: ${locale}`);
    import(`@/messages/${locale}.json`)
      .then((msgs) => {
        console.log(`[LanguageProvider] Messages loaded successfully for ${locale}`);
        setMessages(msgs.default);
      })
      .catch((error) => {
        console.error(`[LanguageProvider] Failed to load messages for ${locale}:`, error);
        // Fallback to English if locale fails
        import(`@/messages/en.json`).then((msgs) => {
          console.log(`[LanguageProvider] Loaded fallback English messages`);
          setMessages(msgs.default);
        });
      });
  }, [locale]);

  useEffect(() => {
    // Set document direction and language
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  if (!messages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-base">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dir }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
