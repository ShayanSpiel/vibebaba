"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
// PHASE 2: Kept backward compatibility - packages can now be fetched from API
import { PRICING_PACKAGES } from "@/lib/credits";
import Link from "next/link";
import { PaymentSuccessModal } from "@/components/payment/PaymentSuccessModal";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui";
import { ProfileButton } from "@/components/auth/ProfileButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type FAQItem = {
  question: string;
  answer: string;
};

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"USD" | "IRT">("USD");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [unlimitedExpanded, setUnlimitedExpanded] = useState(false);
  const [customTokens, setCustomTokens] = useState(100000);

  const t = useTranslations("pricing");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const { dir, locale } = useLanguage();
  const isRTL = dir === "rtl";

  // Auto-detect currency based on language
  useEffect(() => {
    if (locale === "fa") {
      setCurrency("IRT");
    } else {
      setCurrency("USD");
    }
  }, [locale]);

  useEffect(() => {
    // Check for payment success
    if (searchParams.get("success") === "true") {
      setPaymentResult({
        tokens: parseInt(searchParams.get("tokens") || "0"),
        package: searchParams.get("package"),
        refId: searchParams.get("refId"),
      });
      setShowSuccessModal(true);

      // Clean URL and redirect to homepage
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  const handlePurchase = async (packageId?: string, tokens?: number) => {
    if (!user) {
      router.push("/?auth=signin");
      return;
    }

    setLoading(packageId || "custom");

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          customTokens: tokens,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create payment");
        return;
      }

      // Redirect to payment gateway
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment");
    } finally {
      setLoading(null);
    }
  };

  const calculateCustomPrice = () => {
    const hundredKUnits = Math.ceil(customTokens / 100000);
    if (currency === "USD") {
      return hundredKUnits * 1; // $1 per 100K
    }
    return hundredKUnits * 70000; // 70K Toman per 100K
  };

  const formatPrice = (usd: number, toman: number) => {
    if (currency === "USD") {
      return `$${usd}`;
    }
    return `${(toman / 1000).toFixed(0)}K Toman`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  return (
    <div>
      <div className="min-h-screen bg-background-base">
        {/* Enhanced Header */}
        <div className="border-b border-light bg-background-base/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-brand-primary/50 transition-shadow">
                  <span className="text-white font-bold text-xl">V</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
                  <p className="text-xs text-text-tertiary">AI App Builder</p>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Profile Button or Sign In Button */}
                {user ? (
                  <ProfileButton variant="compact" />
                ) : (
                  <Button
                    onClick={() => router.push("/?auth=signin")}
                    variant="primary"
                    size="sm"
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    {tAuth("signIn")}
                  </Button>
                )}
              </div>
          </div>
        </div>

        {/* Clean Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">
            {t("pageTitle")}
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-12">
            {t("pageSubtitle")}
          </p>

          {/* Enhanced social proof with consistent icons */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-background-raised border border-light rounded-xl shadow-sm">
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-text-primary">500+</div>
                <div className="text-xs text-text-tertiary">Apps Built</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-background-raised border border-light rounded-xl shadow-sm">
              <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-text-primary">4.9★</div>
                <div className="text-xs text-text-tertiary">Rating</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-background-raised border border-light rounded-xl shadow-sm">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-text-primary">No Card</div>
                <div className="text-xs text-text-tertiary">Required</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Pricing Cards with Green & Golden Colors */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(PRICING_PACKAGES).map(([key, pkg]) => (
              <div
                key={key}
                className={`relative bg-background-raised rounded-xl border transition-all duration-300 overflow-hidden group ${
                  key === "pro"
                    ? "border-brand-primary/40 shadow-lg shadow-brand-primary/10 scale-[1.02]"
                    : "border-light hover:border-success/30"
                }`}
              >
                {/* Popular Badge */}
                {key === "pro" && (
                  <div className={`absolute top-0 ${isRTL ? 'left-0 rounded-br-xl' : 'right-0 rounded-bl-xl'} bg-gradient-brand text-white px-4 py-1.5 text-xs font-semibold shadow-md`}>
                    {t("popular")}
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  {/* Package Name */}
                  <h3 className="text-xl font-bold text-text-primary mb-6">{pkg.name}</h3>

                  {/* Price with Color */}
                  <div className="mb-6">
                    <div className={`text-4xl font-bold mb-1 ${
                      key === "pro"
                        ? "text-brand-primary"
                        : key === "unlimited"
                        ? "text-success"
                        : "text-text-primary"
                    }`}>
                      {key === "unlimited" && customTokens > 0
                        ? formatPrice(pkg.price + calculateCustomPrice(), pkg.priceToman + calculateCustomPrice())
                        : formatPrice(pkg.price, pkg.priceToman)
                      }
                    </div>
                    <span className="text-sm text-text-tertiary">{t("perMonth")}</span>
                  </div>

                  {/* Features with Monochrome Icons */}
                  <div className={`space-y-3 ${key === "unlimited" ? "mb-6" : "flex-1"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        key === "pro" ? "bg-brand-primary/20" : key === "unlimited" ? "bg-success/20" : "bg-text-tertiary/20"
                      }`}>
                        <svg className={`w-3 h-3 ${
                          key === "pro" ? "text-brand-primary" : key === "unlimited" ? "text-success" : "text-text-tertiary"
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-text-primary">
                        {formatTokens(pkg.monthlyTokens)} tokens/mo
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        key === "pro" ? "bg-brand-primary/20" : key === "unlimited" ? "bg-success/20" : "bg-text-tertiary/20"
                      }`}>
                        <svg className={`w-3 h-3 ${
                          key === "pro" ? "text-brand-primary" : key === "unlimited" ? "text-success" : "text-text-tertiary"
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-text-primary">
                        All AI models
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        key === "pro" ? "bg-brand-primary/20" : key === "unlimited" ? "bg-success/20" : "bg-text-tertiary/20"
                      }`}>
                        <svg className={`w-3 h-3 ${
                          key === "pro" ? "text-brand-primary" : key === "unlimited" ? "text-success" : "text-text-tertiary"
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-text-primary">
                        Download code
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        key === "pro" ? "bg-brand-primary/20" : key === "unlimited" ? "bg-success/20" : "bg-text-tertiary/20"
                      }`}>
                        <svg className={`w-3 h-3 ${
                          key === "pro" ? "text-brand-primary" : key === "unlimited" ? "text-success" : "text-text-tertiary"
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-text-primary">
                        Publish app
                      </div>
                    </div>

                    {key !== "starter" && (
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          key === "pro" ? "bg-brand-primary/20" : key === "unlimited" ? "bg-success/20" : "bg-text-tertiary/20"
                        }`}>
                          <svg className={`w-3 h-3 ${
                            key === "pro" ? "text-brand-primary" : key === "unlimited" ? "text-success" : "text-text-tertiary"
                          }`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-text-primary">
                          Custom domain
                        </div>
                      </div>
                    )}

                    {key !== "starter" && (
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          key === "pro" ? "bg-brand-primary/20" : key === "unlimited" ? "bg-success/20" : "bg-text-tertiary/20"
                        }`}>
                          <svg className={`w-3 h-3 ${
                            key === "pro" ? "text-brand-primary" : key === "unlimited" ? "text-success" : "text-text-tertiary"
                          }`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-text-primary">
                          +{formatTokens(pkg.dailyTokens)} daily credit{key === "unlimited" ? "+" : ""}
                        </div>
                      </div>
                    )}

                    {key === "starter" && (
                      <div className="flex items-center gap-3 opacity-40">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-text-tertiary/20">
                          <svg className="w-3 h-3 text-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm text-text-tertiary line-through">
                          No daily credit
                        </div>
                      </div>
                    )}

                    {key === "starter" && (
                      <div className="flex items-center gap-3 opacity-40">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-text-tertiary/20">
                          <svg className="w-3 h-3 text-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm text-text-tertiary line-through">
                          Custom domain
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Custom Credits for Unlimited Package */}
                  {key === "unlimited" && (
                    <div>
                      <div className="flex-1"></div>
                      <style jsx>{`
                        .custom-select {
                          position: relative;
                        }
                        .custom-select select {
                          appearance: none;
                          -webkit-appearance: none;
                          -moz-appearance: none;
                        }
                        .custom-select select option {
                          background: #2A2A28;
                          color: #FAF9F5;
                          padding: 12px 16px;
                          border-radius: 8px;
                          margin: 4px 0;
                        }
                        .custom-select select option:hover {
                          background: #34534D;
                        }
                        .custom-select select option:checked {
                          background: #059669;
                          color: white;
                        }
                      `}</style>
                      <div className="pt-6 border-t border-success/20 mb-6">
                        <div className="p-4 bg-success/10 rounded-xl border border-success/30">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-success flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-xs text-text-secondary font-semibold">
                              Add extra credits at a discounted rate
                            </p>
                          </div>

                          <div className="custom-select relative">
                            <select
                              value={customTokens}
                              onChange={(e) => setCustomTokens(parseInt(e.target.value))}
                              className="w-full px-4 py-3 bg-background-base border-2 border-success/40 text-text-primary rounded-lg focus:ring-2 focus:ring-success focus:border-success transition-all text-sm font-semibold cursor-pointer hover:border-success/60"
                            >
                              <option value={0}>No extra credits</option>
                              <option value={100000}>+100K tokens • {currency === "USD" ? "+$1" : "+70K"}</option>
                              <option value={250000}>+250K tokens • {currency === "USD" ? "+$3" : "+210K"}</option>
                              <option value={500000}>+500K tokens • {currency === "USD" ? "+$5" : "+350K"}</option>
                              <option value={1000000}>+1M tokens • {currency === "USD" ? "+$10" : "+700K"}</option>
                              <option value={2500000}>+2.5M tokens • {currency === "USD" ? "+$25" : "+1.75M"}</option>
                              <option value={5000000}>+5M tokens • {currency === "USD" ? "+$50" : "+3.5M"}</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA Button - Aligned for all packages */}
                  <div className="mt-auto">
                    <Button
                      onClick={() => key === "unlimited" && customTokens > 0
                        ? handlePurchase(key, customTokens)
                        : handlePurchase(key)
                      }
                      disabled={loading === key || (key === "unlimited" && loading === "custom")}
                      loading={loading === key || (key === "unlimited" && loading === "custom")}
                      className={`w-full rounded-xl ${
                        key === "pro"
                          ? "bg-gradient-brand text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
                          : key === "unlimited"
                          ? "bg-gradient-success text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
                          : "bg-background-subtle border border-light text-text-primary hover:bg-background-raised font-semibold"
                      }`}
                    >
                      {(loading === key || (key === "unlimited" && loading === "custom")) ? t("processing") : t("getStarted")}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-text-tertiary mt-3">
                    Cancel anytime
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background-raised border border-light rounded-full mb-4">
              <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-text-secondary">Common questions</span>
            </div>
            <h2 className="text-4xl font-bold mb-3 text-text-primary">
              {t("faqTitle")}
            </h2>
            <p className="text-text-secondary text-lg">Everything you need to know about pricing</p>
          </div>
          <div className="space-y-3">
            {[
              { q: t("faqTokensQ"), a: t("faqTokensA") },
              { q: t("faqBonusQ"), a: t("faqBonusA") },
              { q: t("faqUpgradeQ"), a: t("faqUpgradeA") }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-background-raised rounded-xl border border-light overflow-hidden hover:border-brand-primary/30 hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-background-subtle transition-colors group"
                >
                  <h4 className="font-semibold text-text-primary text-lg pr-4 group-hover:text-brand-primary transition-colors">{faq.q}</h4>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    expandedFAQ === index
                      ? 'bg-gradient-brand text-white'
                      : 'bg-background-subtle text-text-secondary group-hover:bg-brand-primary/10 group-hover:text-brand-primary'
                  }`}>
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        expandedFAQ === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-text-secondary leading-relaxed border-t border-light/50 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <Footer />

        {/* Success Modal */}
        {showSuccessModal && paymentResult && (
          <PaymentSuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            tokens={paymentResult.tokens}
            packageName={
              paymentResult.package !== "custom"
                ? PRICING_PACKAGES[paymentResult.package as keyof typeof PRICING_PACKAGES]?.name
                : "Custom Credits"
            }
            refId={paymentResult.refId}
          />
        )}
      </div>
      </div>
    </div>
  );
}
