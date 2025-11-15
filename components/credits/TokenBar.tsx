'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/PocketBaseAuthProvider';
import { PRICING_PACKAGES } from '@/lib/credits';

interface TokenBarProps {
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}

export function TokenBar({ variant = 'default', showLabel = true }: TokenBarProps) {
  const { session } = useAuth();
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.data?.user) {
      fetchCredits();
      // Refresh every 30 seconds
      const interval = setInterval(fetchCredits, 30000);
      return () => clearInterval(interval);
    }
  }, [session.data?.user]);

  const fetchCredits = async () => {
    try {
      const startTime = performance.now();
      const response = await fetch('/api/credits', {
        // Optimize for speed
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
        setLoading(false);
        const endTime = performance.now();
        console.log(`Credits loaded in ${(endTime - startTime).toFixed(0)}ms`);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setLoading(false);
    }
  };

  // Only show loading on FIRST load (not on background refreshes)
  if (loading && !credits) {
    return variant === 'compact' ? (
      <div className="h-2 bg-background-subtle rounded-full animate-pulse w-full"></div>
    ) : (
      <div className="h-16 bg-background-subtle rounded-lg animate-pulse"></div>
    );
  }

  // If no credits yet, show skeleton
  if (!credits) {
    return variant === 'compact' ? (
      <div className="h-2 bg-background-subtle rounded-full animate-pulse w-full"></div>
    ) : (
      <div className="h-16 bg-background-subtle rounded-lg animate-pulse"></div>
    );
  }

  const availableTokens = credits.availableTokens || 0;
  const totalCapacity = credits.totalTokens + credits.dailyTokens || 1;
  const usedTokens = credits.usedTokens || 0;
  const percentage = Math.min(100, Math.max(0, (availableTokens / totalCapacity) * 100));

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  const getColorClass = () => {
    if (percentage > 50) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (percentage > 20) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  const getGlowClass = () => {
    if (percentage > 50) return 'shadow-green-500/50';
    if (percentage > 20) return 'shadow-yellow-500/50';
    return 'shadow-red-500/50';
  };

  // Get package info
  const getPackageInfo = () => {
    if (credits?.packageId && credits?.packageExpiry) {
      const expiry = new Date(credits.packageExpiry);
      const now = new Date();
      if (expiry > now) {
        const pkg = PRICING_PACKAGES[credits.packageId as keyof typeof PRICING_PACKAGES];
        return pkg;
      }
    }
    return null;
  };

  const packageInfo = getPackageInfo();

  if (variant === 'compact') {
    return (
      <div className="w-full">
        {/* Package Badge */}
        {packageInfo ? (
          <div className="flex items-center justify-between mb-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                packageInfo.id === 'pro'
                  ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                  : packageInfo.id === 'unlimited'
                    ? 'bg-success/20 text-success border border-success/30'
                    : 'bg-info/20 text-info border border-info/30'
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {packageInfo.name}
            </div>
            <div className="text-right">
              <div className="font-bold text-base text-text-primary">
                {formatTokens(availableTokens)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-600 border border-gray-500/30 text-xs font-semibold">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Free Tier
            </div>
            <div className="text-right">
              <div className="font-bold text-base text-text-primary">
                {formatTokens(availableTokens)}
              </div>
            </div>
          </div>
        )}

        <div className="relative h-2 bg-background-subtle rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-700 ease-out ${getColorClass()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* PHASE 1: Daily reset info for compact */}
        {credits.dailyTokens > 0 && packageInfo && (
          <div className="flex items-center gap-1 mb-2 text-xs text-text-tertiary">
            <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-success font-medium">+{formatTokens(credits.dailyTokens)}</span>
            <span>daily bonus (resets every 24h)</span>
          </div>
        )}

        {percentage < 30 && (
          <div className="text-xs text-error font-medium mb-2">Running low on tokens</div>
        )}

        {/* Simple CTA */}
        <Link
          href="/pricing"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Get More Tokens
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background-raised border border-light rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-600/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-lg">Token Balance</h3>
            <p className="text-text-tertiary text-sm">Your available credits</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Get More
        </Link>
      </div>

      {/* Package Badge */}
      {packageInfo ? (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 text-sm font-semibold ${
            packageInfo.id === 'pro'
              ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
              : packageInfo.id === 'unlimited'
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-info/20 text-info border border-info/30'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {packageInfo.name} Plan
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-600 border border-gray-500/30 mb-4 text-sm font-semibold">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Free Tier
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-3 bg-background-subtle rounded-full overflow-hidden mb-6 shadow-inner">
        <div
          className={`h-full transition-all duration-700 ease-out ${getColorClass()} shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-background-subtle rounded-xl border border-light">
          <div className="text-text-tertiary text-xs font-medium mb-1.5">Available</div>
          <div className="font-bold text-2xl text-text-primary">
            {formatTokens(availableTokens)}
          </div>
        </div>
        <div className="p-4 bg-background-subtle rounded-xl border border-light">
          <div className="text-text-tertiary text-xs font-medium mb-1.5">Used</div>
          <div className="font-bold text-2xl text-text-secondary">{formatTokens(usedTokens)}</div>
        </div>
      </div>

      {/* PHASE 1: Daily Bonus with Reset Info */}
      {credits.dailyTokens > 0 && packageInfo && (
        <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-text-secondary text-sm font-medium">Daily Bonus</div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/20 rounded text-xs text-success">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Resets daily
                </div>
              </div>
              <div className="font-bold text-success">
                +{formatTokens(credits.dailyTokens)} tokens
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                Your daily credit bonus resets every 24 hours
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Balance Warning */}
      {percentage < 20 && (
        <div className="p-4 bg-error/10 border border-error/30 rounded-xl">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-error flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-error font-semibold text-sm">Running low on tokens</p>
              <p className="text-error text-xs">Top up to keep building amazing apps</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
