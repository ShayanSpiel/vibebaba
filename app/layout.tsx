import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Script from 'next/script';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://vibebaba.app'),
  title: {
    default: 'Vibebaba - AI App Builder',
    template: '%s | Vibebaba'
  },
  description: 'Turn your ideas into full-stack applications with AI. Generate React, Next.js, and Vue apps instantly with advanced AI models. No-code platform for developers.',
  keywords: [
    'AI app builder',
    'no-code platform',
    'full-stack generator',
    'React app generator',
    'Next.js builder',
    'AI development tool',
    'code generator',
    'app development',
    'artificial intelligence',
    'web app builder'
  ],
  authors: [{ name: 'Vibebaba Team', url: 'https://vibebaba.app' }],
  creator: 'Vibebaba',
  publisher: 'Vibebaba',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fa_IR', 'ar_SA'],
    url: 'https://vibebaba.app',
    title: 'Vibebaba - AI App Builder',
    description: 'Turn your ideas into full-stack applications with AI. Generate modern web applications instantly.',
    siteName: 'Vibebaba',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Vibebaba AI App Builder - Generate Full-Stack Applications',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibebaba - AI App Builder',
    description: 'Turn your ideas into full-stack applications with AI',
    creator: '@vibebaba',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: 'https://vibebaba.app',
    languages: {
      'en': 'https://vibebaba.app',
      'fa': 'https://vibebaba.app/fa',
      'ar': 'https://vibebaba.app/ar',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F59E0B',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vibebaba',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'AI-powered full-stack application builder that generates React, Next.js, and Vue applications',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vibebaba',
    url: 'https://vibebaba.app',
    logo: 'https://vibebaba.app/logo.png',
    description: 'AI App Builder for Full-Stack Applications',
  };

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts to prevent FOUT/FOIT - optimized woff2 format */}
        <link
          rel="preload"
          href="/fonts/proxima-nova/proximanova_regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/proxima-nova/proximanova_bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/iransansx/IRANSansX-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/iransansx/IRANSansXFaNum-RegularD4.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Inline script to ensure font consistency - runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force font to be loaded before rendering
              if ('fonts' in document) {
                Promise.all([
                  document.fonts.load('400 1rem "Proxima Nova"'),
                  document.fonts.load('600 1rem "Proxima Nova"')
                ]).then(() => {
                  document.documentElement.classList.add('fonts-loaded');
                }).catch(() => {
                  document.documentElement.classList.add('fonts-failed');
                });
              }
            `,
          }}
        />
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          icons={{
            // BRAND GUIDELINE ICONS - Exactly matching /app/brand-guidelines/page.tsx:2024-2074
            error: (
              <div className="w-7 h-7 rounded-lg bg-gradient-error flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ),
            success: (
              <div className="w-7 h-7 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ),
            warning: (
              <div className="w-7 h-7 rounded-lg bg-gradient-warning flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            ),
            info: (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ),
            loading: (
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex-shrink-0"></div>
            ),
          }}
          toastOptions={{
            // CRITICAL: unstyled=true to prevent Sonner's CSS from overriding our Tailwind classes
            unstyled: true,
            classNames: {
              // Base toast container - matching brand guideline structure
              toast: 'flex items-start gap-3 rounded-xl p-4 shadow-lg border w-full',
              // Title and description styling
              title: 'font-semibold text-text-primary text-sm',
              description: 'text-sm text-text-secondary mt-1',
              // Type-specific backgrounds - BRAND GUIDELINE PATTERN: bg-{color}/10 border-{color}/40
              error: 'bg-error/10 border-error/40',
              success: 'bg-success/10 border-success/40',
              warning: 'bg-warning/10 border-warning/40',
              info: 'bg-amber-400/10 border-amber-400/30',
              loading: 'bg-background-raised border-border-light',
            },
          }}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />

      </body>
    </html>
  );
}
