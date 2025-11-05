"use client";

import { useState, useEffect, useRef } from "react";
import { getContextualLoadingMessage, getMaybeRareMessage, getTimeBasedMessage } from "@/lib/loading-messages";

interface BrowserPreviewProps {
  projectId: string;
  deploymentUrl?: string;
  isDeploying?: boolean;
  files?: { path: string }[];
}

export default function BrowserPreview({
  projectId,
  deploymentUrl,
  isDeploying = false,
  files = []
}: BrowserPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPath, setCurrentPath] = useState('/');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showUrlDropdown, setShowUrlDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Generate dynamic loading message when deployment starts
  useEffect(() => {
    if (isDeploying) {
      const timeBasedMsg = getTimeBasedMessage();
      const contextualMsg = getContextualLoadingMessage('deploying');
      const finalMsg = timeBasedMsg || getMaybeRareMessage(contextualMsg);
      setLoadingMessage(finalMsg);
    }
  }, [isDeploying]);

  // Build full preview URL - Fixed to handle trailing slashes properly
  const previewUrl = deploymentUrl
    ? currentPath === '/' || currentPath === '/index.html'
      ? deploymentUrl // Use base URL for index
      : `${deploymentUrl.endsWith('/') ? deploymentUrl.slice(0, -1) : deploymentUrl}${currentPath}`
    : null;

  // Reset iframe loading state when URL changes
  useEffect(() => {
    if (deploymentUrl) {
      setIsIframeLoading(true);
    }
  }, [deploymentUrl, currentPath, refreshKey]);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
    console.log('🎉 Preview loaded successfully!');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUrlDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect routes from project structure
  const detectRoutes = (): { path: string; label: string }[] => {
    const routes: { path: string; label: string }[] = [];

    // Check for Next.js App Router (app directory structure)
    const appDirPages = files.filter(f =>
      f.path.startsWith('app/') &&
      (f.path.endsWith('/page.tsx') || f.path.endsWith('/page.ts') || f.path.endsWith('/page.jsx') || f.path.endsWith('/page.js'))
    );

    if (appDirPages.length > 0) {
      // Next.js App Router detected
      appDirPages.forEach(file => {
        // Extract route from file path
        // app/page.tsx -> /
        // app/dashboard/page.tsx -> /dashboard
        // app/blog/[id]/page.tsx -> /blog/[id]
        let route = file.path
          .replace(/^app/, '')
          .replace(/\/page\.(tsx|ts|jsx|js)$/, '')
          .replace(/\\/g, '/');

        if (route === '') route = '/';

        const label = route === '/' ? 'Home' : route.split('/').filter(Boolean).map(s =>
          s.charAt(0).toUpperCase() + s.slice(1)
        ).join(' / ');

        routes.push({ path: route, label });
      });
      return routes;
    }

    // Check for Next.js Pages Router
    const pagesFiles = files.filter(f =>
      f.path.startsWith('pages/') &&
      (f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.path.endsWith('.jsx') || f.path.endsWith('.js')) &&
      !f.path.includes('/_') && // Exclude _app, _document
      !f.path.includes('api/') // Exclude API routes
    );

    if (pagesFiles.length > 0) {
      // Next.js Pages Router detected
      pagesFiles.forEach(file => {
        // Extract route from file path
        // pages/index.tsx -> /
        // pages/dashboard.tsx -> /dashboard
        // pages/blog/[id].tsx -> /blog/[id]
        let route = file.path
          .replace(/^pages/, '')
          .replace(/\/index\.(tsx|ts|jsx|js)$/, '')
          .replace(/\.(tsx|ts|jsx|js)$/, '')
          .replace(/\\/g, '/');

        if (route === '') route = '/';

        const label = route === '/' ? 'Home' : route.split('/').filter(Boolean).map(s =>
          s.charAt(0).toUpperCase() + s.slice(1)
        ).join(' / ');

        routes.push({ path: route, label });
      });
      return routes;
    }

    // Fallback: Check for HTML pages (vanilla/static sites)
    const htmlPages = files.filter(f => f.path.endsWith('.html'));
    if (htmlPages.length > 0) {
      htmlPages.forEach(file => {
        const route = file.path === 'index.html' ? '/' : '/' + file.path.replace('.html', '');
        const label = route === '/' ? 'Home' : route.split('/').filter(Boolean).map(s =>
          s.charAt(0).toUpperCase() + s.slice(1)
        ).join(' / ');
        routes.push({ path: route, label });
      });
      return routes;
    }

    // Default: Just show homepage
    return [{ path: '/', label: 'Home' }];
  };

  const availableRoutes = detectRoutes();

  return (
    <div className="h-full flex flex-col bg-background-base">
        {/* Browser Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-background-raised to-background-subtle border-b border-light shadow-sm">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isDeploying}
              className="p-2 hover:bg-background-overlay rounded-lg transition-all group disabled:opacity-50"
              title="Refresh preview"
            >
              <svg
                className={`w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-all duration-300 ${
                  isDeploying ? 'animate-spin' : 'group-hover:rotate-180'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-background-raised border border-light rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-gradient-brand text-white shadow-md'
                    : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
                }`}
                title="Desktop view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'mobile'
                    ? 'bg-gradient-brand text-white shadow-md'
                    : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
                }`}
                title="Mobile view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Address Bar with Dropdown */}
          <div className="flex-1 relative flex items-center gap-2" ref={dropdownRef}>
            <div
              className="flex-1 flex items-center gap-2 px-4 py-2 bg-background-base rounded-lg border border-light shadow-sm cursor-pointer hover:border-brand-primary/30 transition-all"
              onClick={() => availableRoutes.length > 0 && deploymentUrl && setShowUrlDropdown(!showUrlDropdown)}
            >
              <svg
                className="w-4 h-4 text-text-tertiary flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                type="text"
                value={deploymentUrl ? (deploymentUrl + currentPath).replace(/([^:]\/)\/+/g, "$1") : (isDeploying ? 'Deploying...' : 'Waiting for deployment...')}
                readOnly
                className="flex-1 text-sm text-text-primary bg-transparent outline-none font-medium cursor-pointer"
              />
              <div className="flex items-center gap-2">
                {availableRoutes.length > 0 && deploymentUrl && (
                  <svg
                    className={`w-4 h-4 text-text-tertiary transition-transform ${showUrlDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Open in Browser Icon */}
            {deploymentUrl && (
              <button
                onClick={() => window.open(previewUrl || deploymentUrl, '_blank', 'noopener,noreferrer')}
                className="p-2 bg-background-base hover:bg-background-subtle rounded-lg border border-light shadow-sm transition-all group"
                title="Open in new browser tab"
              >
                <svg className="w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}

            {/* URL Dropdown Menu */}
            {showUrlDropdown && availableRoutes.length > 0 && deploymentUrl && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background-raised border border-light rounded-lg shadow-xl z-50 max-h-96 overflow-auto">
                <div className="p-3 border-b border-light bg-background-subtle">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">Available Routes</h3>
                      <p className="text-xs text-text-tertiary mt-0.5">{availableRoutes.length} route{availableRoutes.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => setShowUrlDropdown(false)}
                      className="text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {availableRoutes.map(route => {
                    const isActive = currentPath === route.path;
                    return (
                      <button
                        key={route.path}
                        onClick={() => {
                          setCurrentPath(route.path);
                          setShowUrlDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all mb-1 hover:bg-background-subtle group ${
                          isActive ? 'bg-brand-primary/10 border border-brand-primary/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-text-tertiary group-hover:text-brand-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${isActive ? 'text-brand-primary' : 'text-text-primary'} mb-0.5`}>
                              {route.path}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {route.label}
                            </div>
                          </div>
                          {isActive && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-background-base relative">
          {(isDeploying || isIframeLoading) ? (
            <div className="flex items-center justify-center absolute inset-0 bg-background-base z-10">
              <div className="text-center">
                {/* Contextual Icon Badge - matching ChatBubble style */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  {/* Animated ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-light border-t-brand-primary animate-spin"></div>
                  {/* Icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Dynamic loading message */}
                <p className="text-sm text-text-primary font-bold mb-2">{isDeploying ? loadingMessage : "Loading your app..."}</p>
                <p className="text-xs text-text-tertiary">{isDeploying ? "Setting up real server & database" : "Preview coming up..."}</p>
              </div>
            </div>
          ) : null}

          {previewUrl ? (
            viewMode === 'mobile' ? (
              // Mobile View with Frame
              <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-2xl border-[14px] border-gray-800 overflow-hidden transition-all duration-300 relative">
                {/* Mobile Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-10"></div>
                <iframe
                  key={refreshKey}
                  src={previewUrl}
                  onLoad={handleIframeLoad}
                  className="w-full h-full border-0"
                  title="App Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              </div>
            ) : (
              // Desktop View - Full Screen
              <iframe
                key={refreshKey}
                src={previewUrl}
                onLoad={handleIframeLoad}
                className="w-full h-full border-0"
                title="App Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background-raised to-background-subtle rounded-2xl border-2 border-dashed border-light">
              <div className="text-center text-text-tertiary p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-background-overlay flex items-center justify-center">
                  <svg className="w-10 h-10 opacity-40" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-base font-semibold text-text-secondary mb-2">Waiting for Deployment</p>
                <p className="text-sm text-text-tertiary">Your app will appear here once deployed</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
