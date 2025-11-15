'use client';

import { AlertCircle, Check, Globe, Info, Loader2, Lock, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/PocketBaseAuthProvider';
import { useProjectSettings } from '@/lib/contexts/ProjectSettingsContext';
import { formatSubdomainDisplay, getConfig } from '@/lib/domain-config';

interface PublishModalProps {
  projectId: string;
  projectName: string;
  currentDeployUrl?: string;
  isPublished: boolean;
  defaultName?: string;
  subdomain?: string;
  customDomain?: string;
  onPublish?: () => void;
  onClose: () => void;
}

export default function PublishModal({
  projectId,
  projectName,
  currentDeployUrl,
  isPublished,
  defaultName,
  subdomain: initialSubdomain,
  customDomain: initialCustomDomain,
  onPublish,
  onClose,
}: PublishModalProps) {
  const [subdomain, setSubdomain] = useState(initialSubdomain || defaultName || '');
  const [customDomain, setCustomDomain] = useState(initialCustomDomain || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const config = getConfig();
  const { user } = useAuth();

  // 🎯 SINGLE SOURCE OF TRUTH: Use centralized project settings context
  const { settings: projectSettings } = useProjectSettings();

  // Load project name from context for better subdomain suggestion
  useEffect(() => {
    if (projectSettings?.projectName) {
      console.log('[PublishModal] ✅ Using centralized settings from context');
      // Only update subdomain if it's still the default
      if (subdomain === (initialSubdomain || defaultName || '')) {
        const suggestedSubdomain = projectSettings.projectName
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        setSubdomain(suggestedSubdomain);
      }
    }
  }, [projectSettings]); // Depend on projectSettings from context

  // Check if user has active subscription
  const hasActiveSubscription =
    user?.packageId && user?.packageExpiry ? new Date(user.packageExpiry) > new Date() : false;

  // Real-time subdomain availability check
  useEffect(() => {
    const checkAvailability = async () => {
      if (!subdomain || subdomain === initialSubdomain) {
        setAvailable(null);
        return;
      }

      setChecking(true);
      setAvailable(null);

      try {
        const res = await fetch(`/api/subdomains/check?subdomain=${encodeURIComponent(subdomain)}`);
        const data = await res.json();

        if (data.available) {
          setAvailable(true);
          setError('');
        } else {
          setAvailable(false);
          setError(data.error || 'Subdomain is not available');
        }
      } catch (err) {
        console.error('Error checking subdomain:', err);
        setError('Failed to check subdomain availability');
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [subdomain, initialSubdomain]);

  const handlePublish = async () => {
    if (!subdomain.trim()) {
      setError('Please enter a subdomain');
      return;
    }

    // Don't allow publishing if subdomain is taken (unless it's the current subdomain)
    if (available === false && subdomain !== initialSubdomain) {
      setError('This subdomain is not available');
      return;
    }

    setError('');
    setIsPublishing(true);

    const toastId = toast.loading('Publishing your app...');

    try {
      const res = await fetch('/api/subdomains/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          subdomain: subdomain.trim().toLowerCase(),
          customDomain: customDomain.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Published to ${data.url}`, { id: toastId });
        if (data.customUrl) {
          toast.info(`Custom domain configured: ${data.customUrl}`);
        }
        onPublish?.();
        onClose();
      } else {
        toast.error(data.error || 'Failed to publish', { id: toastId });
        setError(data.error || 'Failed to publish. Please try again.');
      }
    } catch (err: any) {
      console.error('Error publishing:', err);
      toast.error('Failed to publish. Please try again.', { id: toastId });
      setError(err.message || 'Failed to publish. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg mx-4 animate-slideUp"
        style={{ animationDuration: '300ms' }}
      >
        {/* Modal body */}
        <div className="bg-background-raised rounded-3xl shadow-2xl border border-light p-8 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-background-subtle rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>

          {/* Icon with pulsing background */}
          <div className="flex justify-center mb-6 relative">
            <div className="absolute w-20 h-20 bg-success/20 rounded-full pulse-subtle"></div>
            <div className="w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center shadow-lg relative z-10">
              <Globe className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-text-primary">
              {isPublished ? 'Update Published App' : 'Publish Your App'}
            </h2>
            <p className="text-sm text-text-secondary">
              {isPublished
                ? "Update your app's URL or republish with the same settings"
                : 'Make your app live and share it with the world'}
            </p>
            {!config.useSubdomains && (
              <div className="flex items-center gap-2 justify-center text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg mt-2">
                <Info className="w-4 h-4" />
                <span>Development Mode: Using localhost paths</span>
              </div>
            )}
          </div>

          {/* Subdomain Section */}
          <div className="space-y-3 mb-6">
            <label className="block text-sm font-semibold text-text-primary">
              {config.useSubdomains ? 'Subdomain *' : 'Project Identifier *'}
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value);
                    setError('');
                  }}
                  placeholder="my-app"
                  className="flex-1 px-4 py-3 bg-background-base border border-light rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all"
                />
                <span className="text-sm text-text-secondary whitespace-nowrap">
                  {config.useSubdomains ? `.${config.baseDomain}` : ''}
                </span>
              </div>

              {/* Status indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />}
                {!checking && available === true && <Check className="w-5 h-5 text-green-500" />}
                {!checking && available === false && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Availability message */}
            {checking && <p className="text-sm text-text-secondary">Checking availability...</p>}
            {!checking && available === true && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Available
              </p>
            )}
            {!checking && available === false && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error || 'Already taken'}
              </p>
            )}
            {error && !checking && available !== false && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Custom Domain Section - Only in production */}
          {config.useSubdomains && (
            <div className="space-y-3 mb-6 relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-text-primary">
                  Custom Domain (Optional)
                </label>
                {!hasActiveSubscription && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Lock className="w-3 h-3" />
                    Pro Feature
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => {
                    if (!hasActiveSubscription) {
                      toast.error(
                        'Custom domains require an active subscription. Please upgrade to use this feature.'
                      );
                      return;
                    }
                    setCustomDomain(e.target.value);
                  }}
                  placeholder="myapp.com"
                  disabled={!hasActiveSubscription}
                  className={`w-full px-4 py-3 bg-background-base border border-light rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success/50 transition-all ${
                    !hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                {!hasActiveSubscription && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background-base/80 rounded-lg backdrop-blur-sm">
                    <button
                      onClick={() =>
                        toast.info('Please upgrade your subscription to use custom domains')
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-lg hover:opacity-90 transition-all text-sm font-semibold shadow-md"
                    >
                      <Lock className="w-4 h-4" />
                      Upgrade to Unlock
                    </button>
                  </div>
                )}
              </div>

              {customDomain && hasActiveSubscription && (
                <div className="text-xs text-text-secondary bg-background-subtle p-3 rounded-lg space-y-1">
                  <p className="font-semibold mb-2">Add these DNS records:</p>
                  <code className="block bg-background-base p-2 rounded font-mono">
                    A @ [YOUR_SERVER_IP]
                    <br />
                    CNAME www {config.baseDomain}
                  </code>
                </div>
              )}

              {!hasActiveSubscription && (
                <div className="text-xs text-text-secondary bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <p className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-800 dark:text-amber-200">
                      Custom domains and DNS settings are available with Pro, Business, or
                      Enterprise subscriptions.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Development Mode Info */}
          {!config.useSubdomains && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Development Mode:</strong> Your app will be accessible at:
                <br />
                <code className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mt-1 inline-block">
                  http://localhost:4000/apps/project-{projectId}
                </code>
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Publish Now Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing || (available === false && subdomain !== initialSubdomain)}
              className="w-full px-5 py-3 bg-gradient-success text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 text-white" />
                  {isPublished ? 'Update' : 'Publish Now'}
                </>
              )}
            </button>

            {/* Cancel button */}
            <button
              onClick={onClose}
              disabled={isPublishing}
              className="w-full px-5 py-3 bg-background-subtle border border-light text-text-primary rounded-xl font-semibold hover:bg-background-raised hover:border-success/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {/* Info note */}
          {isPublished && (
            <div className="bg-background-subtle border border-light rounded-lg p-3 mt-4">
              <p className="text-xs text-text-secondary text-center">
                Your app is currently live. Updating will republish with new settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add pulse animation styles */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.5;
          }
        }

        .pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
