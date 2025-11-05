"use client";

import dynamic from 'next/dynamic';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/lib/language-context";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";

// Lazy load heavy components
const AIChat = dynamic(() => import("@/components/chat/AIChat"), {
  loading: () => <div className="w-full h-32 bg-background-raised rounded-2xl animate-pulse" />,
  ssr: false,
});

const ProfileButton = dynamic(() => import("@/components/auth/ProfileButton").then(mod => ({ default: mod.ProfileButton })), {
  loading: () => <div className="w-24 h-10 bg-background-raised rounded-xl animate-pulse" />,
  ssr: false,
});

const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then(mod => ({ default: mod.AuthModal })), {
  ssr: false,
});

const ProjectsSidebar = dynamic(() => import("@/components/ProjectsSidebar").then(mod => ({ default: mod.ProjectsSidebar })), {
  loading: () => null,
  ssr: false,
});

const AIStatusIndicator = dynamic(() => import("@/components/AIStatusIndicator").then(mod => ({ default: mod.AIStatusIndicator })), {
  ssr: false,
});

export default function Home() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = !!user;
  const t = useTranslations("landing");
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";

  // Auto-show auth modal if redirected from protected page
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'signin' && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [searchParams, isAuthenticated]);

  return (
    <>
      <main className="min-h-screen bg-background-base flex flex-col">
        {/* Projects Sidebar - only show when authenticated */}
        {isAuthenticated && <ProjectsSidebar />}

        {/* Top menu - Enhanced Header matching Project Page */}
        <header className="h-16 fixed top-0 left-0 right-0 z-30 bg-background-base border-b border-border-light shadow-sm">
          <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
                <p className="text-xs text-text-tertiary">AI App Builder</p>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Pricing Button - Golden Gradient with Enhanced Icon */}
              <a
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                title="View Pricing Plans"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("pricing")}
              </a>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Profile or Sign In */}
              {isAuthenticated ? (
                <ProfileButton variant="compact" />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-background-raised border border-border-light text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle hover:border-amber-400/30 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  title="Sign in to continue"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  {t("signIn")}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                {t("title")}
              </h1>
              <p className="text-lg text-text-secondary max-w-xl mx-auto">
                {t("subtitle")}
              </p>
            </div>

            {/* Always show chatbox, but with sign-in button if not authenticated */}
            <AIChat />
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* AI Status Indicator */}
      <AIStatusIndicator />
    </>
  );
}
