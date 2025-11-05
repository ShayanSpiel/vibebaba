"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePocketBaseAuth } from "./PocketBaseAuthProvider";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, signup, loginWithGoogle } = usePocketBaseAuth();
  const { dir } = useLanguage();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const isRTL = dir === "rtl";
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await signup(email, password, name);
        onClose();
        // Reset form
        setEmail("");
        setPassword("");
        setName("");

        // Redirect to projects page after signup
        router.push('/projects');
      } else {
        await login(email, password);
        onClose();
        // Reset form
        setEmail("");
        setPassword("");

        // Get redirect URL from search params (set by middleware)
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          console.log('🔄 Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        } else {
          // Default redirect to projects page
          router.push('/projects');
        }
      }
    } catch (err: any) {
      setError(err.message || tErrors("generic"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle();

      // Close the modal after successful authentication
      onClose();

      // Reset form
      setEmail("");
      setPassword("");
      setName("");

      // Get redirect URL from search params (set by middleware)
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        console.log('🔄 Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      } else {
        // Default redirect to projects page
        router.push('/projects');
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 bg-black/85 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="bg-background-raised rounded-xl border border-border-light w-full max-w-sm p-8 relative animate-in zoom-in duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 rounded-xl bg-transparent hover:bg-background-overlay text-text-tertiary hover:text-text-primary transition-all duration-200 group`}
          aria-label={tCommon("close")}
        >
          <svg
            className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 bg-gradient-brand rounded-xl flex items-center justify-center mx-auto mb-6 transition-transform duration-300 hover:scale-105 shadow-lg"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {mode === "signin" ? t("welcomeBack") : t("createYourAccount")}
          </h2>
          <p className="text-text-secondary text-sm">
            {mode === "signin"
              ? t("signInSubtitle")
              : t("signUpSubtitle")}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm animate-in slide-in-from-top duration-200"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <Input
              id="name"
              label={t("name")}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
              disabled={isLoading}
            />
          )}

          <Input
            id="email"
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            disabled={isLoading}
          />

          <Input
            id="password"
            label={t("password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            minLength={6}
            disabled={isLoading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              fullWidth
              className="rounded-xl"
            >
              {mode === "signin" ? t("signIn") : t("signUp")}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background-raised text-text-tertiary">OR</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background-raised hover:bg-background-overlay border border-border-light rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary group"
        >
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              className="text-brand-primary"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              className="text-brand-primary"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              className="text-brand-primary"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              className="text-brand-primary"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{t("continueWithGoogle")}</span>
        </button>

        {/* Toggle mode */}
        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <p className="text-sm text-text-secondary">
            {mode === "signin" ? (
              <>
                {t("dontHaveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-brand-primary font-medium hover:text-brand-primary-hover transition-colors duration-200 underline-offset-4 hover:underline"
                  disabled={isLoading}
                >
                  {t("signUp")}
                </button>
              </>
            ) : (
              <>
                {t("alreadyHaveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-brand-primary font-medium hover:text-brand-primary-hover transition-colors duration-200 underline-offset-4 hover:underline"
                  disabled={isLoading}
                >
                  {t("signIn")}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
