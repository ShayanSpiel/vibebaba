"use client";

import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileButton } from "@/components/auth/ProfileButton";
import { useRouter } from "next/navigation";
import { TokenBar } from "@/components/credits/TokenBar";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/lib/language-context";
import { Button, Input } from "@/components/ui";
import { useState, useEffect } from "react";
import { getUserOrganization } from "@/lib/services/org-auto-create";
import type { Organization } from "@/lib/database/pocketbase";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);

  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";

  // ✨ NEW: Load user's organization
  useEffect(() => {
    if (user) {
      getUserOrganization(user.id).then(setOrganization).catch(console.error);
    }
  }, [user]);

  // Show loading state while auth is being checked
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-base">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-base">
      {/* Header - Consistent with Homepage */}
      <header className="h-16 fixed top-0 left-0 right-0 z-30 bg-background-base border-b border-border-light shadow-sm">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Settings Title with Back Button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 flex items-center justify-center hover:bg-background-subtle text-text-primary rounded-lg transition-all"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-text-primary">{t("title")}</h1>
          </div>

          {/* Right Navigation - Only Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ProfileButton variant="compact" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-background-raised rounded-xl border border-border-light overflow-hidden shadow-lg">
            <div className="bg-background-subtle p-6 border-b border-border-light">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-h-[40px] flex flex-col justify-between py-0.5">
                  <h3 className="text-base font-bold text-text-primary leading-tight">{t("accountInfo")}</h3>
                  <p className="text-xs text-text-secondary leading-tight">Your profile information</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between gap-6 mb-6 pb-6 border-b border-border-light">
                {/* Left side - User info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${user.collectionId}/${user.id}/${user.avatar}`}
                        alt={user.name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary mb-1">
                      {user.name || "User"}
                    </h2>
                    <p className="text-text-secondary text-sm">{user.email}</p>
                  </div>
                </div>

                {/* Right side - Organization info */}
                {organization && (
                  <div className="flex-shrink-0 bg-background-subtle border border-border-light rounded-lg p-4 min-w-[280px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h3 className="text-sm font-semibold text-text-primary">Organization</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">Name</p>
                        <p className="text-sm text-text-primary font-medium">{organization.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">ID</p>
                        <p className="text-xs font-mono text-text-secondary break-all">{organization.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-5">
                <Input
                  label={t("name")}
                  type="text"
                  value={user.name || ""}
                  disabled
                />
                <Input
                  label={t("email")}
                  type="email"
                  value={user.email || ""}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Credits Section */}
          <div className="bg-background-raised rounded-xl border border-border-light overflow-hidden shadow-lg">
            <div className="bg-background-subtle p-6 border-b border-border-light">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-h-[40px] flex flex-col justify-between py-0.5">
                  <h3 className="text-base font-bold text-text-primary leading-tight">{t("tokenBalance")}</h3>
                  <p className="text-xs text-text-secondary leading-tight">{t("manageCredits")}</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <TokenBar variant="default" showLabel={true} />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-background-raised rounded-xl border border-border-light overflow-hidden shadow-lg">
            <div className="bg-background-subtle p-6 border-b border-border-light">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-info flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1 min-h-[40px] flex flex-col justify-between py-0.5">
                  <h3 className="text-base font-bold text-text-primary leading-tight">{t("preferences")}</h3>
                  <p className="text-xs text-text-secondary leading-tight">{t("preferencesDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {/* Preferences content can be added here */}
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-background-raised rounded-xl border border-border-light overflow-hidden shadow-lg">
            <div className="bg-background-subtle p-6 border-b border-border-light">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-success flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1 min-h-[40px] flex flex-col justify-between py-0.5">
                  <h3 className="text-base font-bold text-text-primary leading-tight">{t("security")}</h3>
                  <p className="text-xs text-text-secondary leading-tight">{t("securityDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {/* Security content can be added here */}
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
