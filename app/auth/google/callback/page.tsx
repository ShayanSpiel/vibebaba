'use client';

import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { autoCreateOrganization } from '@/lib/services/org-auto-create';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuth = async () => {
      try {
        // Get URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for token with PocketBase
        const authData = await pb.collection('users').authWithOAuth2Code(
          'google',
          code,
          pb.authStore.model?.id || '', // code verifier (empty for now)
          `${window.location.origin}/auth/google/callback`,
          // Optional: create data for new users
          {
            emailVisibility: false,
          }
        );

        console.log('✅ Google OAuth successful:', authData);

        // ✨ NEW: Auto-create organization for new user (invisible to user)
        if (authData.record) {
          await autoCreateOrganization(
            authData.record.id,
            authData.record.email,
            authData.record.name
          );
        }

        // Store auth in localStorage
        localStorage.setItem('pocketbase_auth', JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model
        }));

        setStatus('success');

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth-success', user: authData.record },
            window.location.origin
          );

          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1000);
        }
      } catch (err: any) {
        console.error('❌ Google OAuth error:', err);
        setStatus('error');
        setError(err.message || 'Authentication failed');

        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth-error', error: err.message },
            window.location.origin
          );

          // Close popup after showing error
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      }
    };

    handleOAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-base">
      <div className="text-center p-8">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary">Completing sign-in...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-brand rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary font-medium">Sign-in successful!</p>
            <p className="text-text-tertiary text-sm">Closing window...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-error rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-error font-medium">Sign-in failed</p>
            <p className="text-text-tertiary text-sm">{error}</p>
            <p className="text-text-tertiary text-xs">This window will close automatically...</p>
          </div>
        )}
      </div>
    </div>
  );
}
