'use client';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  Download,
  Info,
  Layout,
  Lock,
  Mail,
  MessageSquare,
  Palette,
  Search,
  Settings,
  Sparkles,
  Square,
  Type,
  Upload,
  User,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { warmOrangeTheme } from '@/lib/theme/theme-config';
import {
  DEFAULT_CONFIG,
  MESSAGE_ICONS,
  ROLE_CONFIGS,
  STATUS_CONFIGS,
  TOPIC_CONFIGS,
  USER_MESSAGE_CONFIG,
} from '@/lib/ui/message-ui-config';

export default function BrandGuidelinesPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');

  const theme = warmOrangeTheme.colors;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background-base">
      {/* Header - Matching actual app style */}
      <header className="sticky top-0 z-50 h-16 bg-background-base border-b border-border-light shadow-sm">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Brand Guidelines</h1>
              <p className="text-xs text-text-tertiary">Design System v4.0</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-background-raised border border-border-light text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle transition-all shadow-sm">
              <Download className="h-4 w-4 inline mr-2" />
              Export
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg">
              <Sparkles className="h-4 w-4 inline mr-2" />
              Apply Theme
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h1 className="text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
            Vibebaba Design System
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Golden gradient aesthetics with premium dark mode. Rounded corners, smooth transitions,
            and a luxurious amber color palette.
          </p>
        </section>

        {/* Single Source of Truth Notice */}
        <section className="mb-12">
          <div className="relative bg-gradient-to-br from-background-raised to-background-subtle border-2 border-amber-400/30 rounded-2xl p-8 shadow-2xl overflow-hidden">
            {/* Animated sparkles background */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
            <div
              className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-yellow-600 rounded-full animate-ping"
              style={{ animationDelay: '0.3s' }}
            />
            <div
              className="absolute top-1/2 right-1/3 w-1 h-1 bg-amber-400 rounded-full animate-ping"
              style={{ animationDelay: '0.6s' }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Single Source of Truth</h2>
              </div>

              <p className="text-center text-text-secondary max-w-3xl mx-auto mb-6">
                All colors in this design system are defined in{' '}
                <code className="bg-background-subtle px-2 py-1 rounded text-amber-400">
                  lib/theme/theme-config.ts
                </code>{' '}
                and automatically propagated through CSS variables.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background-raised rounded-xl p-4 border border-amber-400/20">
                  <h4 className="font-semibold mb-2 text-amber-400">1. Theme Config</h4>
                  <code className="text-xs text-text-tertiary block">warmOrangeTheme.colors</code>
                  <p className="text-xs text-text-secondary mt-2">
                    Define colors once in TypeScript
                  </p>
                </div>
                <div className="bg-background-raised rounded-xl p-4 border border-amber-400/20">
                  <h4 className="font-semibold mb-2 text-amber-400">2. CSS Variables</h4>
                  <code className="text-xs text-text-tertiary block">--gradient-brand</code>
                  <p className="text-xs text-text-secondary mt-2">Auto-generated CSS variables</p>
                </div>
                <div className="bg-background-raised rounded-xl p-4 border border-amber-400/20">
                  <h4 className="font-semibold mb-2 text-amber-400">3. Tailwind Classes</h4>
                  <code className="text-xs text-text-tertiary block">bg-gradient-brand</code>
                  <p className="text-xs text-text-secondary mt-2">Use in any component</p>
                </div>
              </div>

              <div className="bg-background-base border border-amber-400/20 rounded-xl p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  How to Update Main Colors
                </h4>
                <ol className="space-y-2 text-sm text-text-secondary">
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-bold shrink-0">1.</span>
                    <span>
                      Open{' '}
                      <code className="bg-background-subtle px-2 py-1 rounded text-xs">
                        lib/theme/theme-config.ts
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-bold shrink-0">2.</span>
                    <span>
                      Update colors in{' '}
                      <code className="bg-background-subtle px-2 py-1 rounded text-xs">
                        warmOrangeTheme.colors
                      </code>{' '}
                      object
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-bold shrink-0">3.</span>
                    <span>All components automatically update - no manual changes needed!</span>
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-xs text-success flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Changing{' '}
                      <code className="bg-background-subtle px-1.5 py-0.5 rounded">
                        gradientBrand
                      </code>{' '}
                      updates buttons, badges, chat messages, and all components instantly
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-text-tertiary">
                  <strong className="text-amber-400">Golden Rule:</strong> Never hardcode colors
                  like{' '}
                  <code className="bg-background-subtle px-2 py-1 rounded line-through">
                    bg-blue-500
                  </code>{' '}
                  or{' '}
                  <code className="bg-background-subtle px-2 py-1 rounded line-through">
                    #FCD34D
                  </code>{' '}
                  - always use semantic tokens
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <nav className="sticky top-20 bg-background-raised border border-border-light rounded-xl p-4 shadow-lg z-40">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'colors', icon: Palette, label: 'Colors' },
              { id: 'buttons', icon: Square, label: 'Buttons' },
              { id: 'inputs', icon: Circle, label: 'Inputs' },
              { id: 'typography', icon: Type, label: 'Typography' },
              { id: 'spacing', icon: Layout, label: 'Spacing' },
              { id: 'modals', icon: AlertCircle, label: 'Modals' },
              { id: 'product-colors', icon: Palette, label: 'Product Colors' },
              { id: 'icons', icon: Sparkles, label: 'Icons' },
              { id: 'animations', icon: Zap, label: 'Animations' },
              { id: 'ai-chat', icon: Info, label: 'AI Chat' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    document
                      .getElementById(item.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-md'
                      : 'bg-background-subtle text-text-secondary hover:bg-background-overlay'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Colors Section */}
        <section id="colors" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Color Palette</h2>
              <p className="text-text-secondary">
                Golden gradient theme with dark mode optimization
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Primary Golden Gradient - THE MAIN COLOR */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Primary Golden Gradient - Main Brand Color
              </h3>
              <p className="text-text-secondary mb-6">
                This is our signature gradient used for all primary buttons, CTAs, logos, and
                important UI elements.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Main Gradient */}
                <div className="relative group">
                  <div
                    className="h-32 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() =>
                      copyToClipboard('from-amber-400 to-yellow-600', 'Primary Gradient')
                    }
                  >
                    {copiedColor === 'Primary Gradient' && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold">Copied!</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-sm">Primary Gradient</p>
                    <code className="text-xs text-text-tertiary block mt-1">
                      from-amber-400 to-yellow-600
                    </code>
                    <p className="text-xs text-text-tertiary mt-2">Main buttons, logo, titles</p>
                  </div>
                </div>

                {/* Hover State */}
                <div className="relative group">
                  <div
                    className="h-32 bg-gradient-to-r from-amber-500 to-yellow-700 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() =>
                      copyToClipboard('from-amber-500 to-yellow-700', 'Hover Gradient')
                    }
                  >
                    {copiedColor === 'Hover Gradient' && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold">Copied!</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-sm">Hover State</p>
                    <code className="text-xs text-text-tertiary block mt-1">
                      from-amber-500 to-yellow-700
                    </code>
                    <p className="text-xs text-text-tertiary mt-2">Button hover, active states</p>
                  </div>
                </div>

                {/* Bottom-Right Variant */}
                <div className="relative group">
                  <div
                    className="h-32 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() =>
                      copyToClipboard('from-amber-400 to-yellow-600', 'Diagonal Gradient')
                    }
                  >
                    {copiedColor === 'Diagonal Gradient' && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold">Copied!</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-sm">Diagonal (Bottom-Right)</p>
                    <code className="text-xs text-text-tertiary block mt-1">
                      to-br from-amber-400 to-yellow-600
                    </code>
                    <p className="text-xs text-text-tertiary mt-2">Logo, icons, decorative</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Colors */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Background Colors</h3>
              <p className="text-text-secondary mb-6">
                Layered dark backgrounds creating depth and hierarchy
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'Base', color: theme.backgroundBase, usage: 'Main app background' },
                  { name: 'Raised', color: theme.backgroundRaised, usage: 'Cards, panels' },
                  { name: 'Overlay', color: theme.backgroundOverlay, usage: 'Dropdowns, modals' },
                  { name: 'Sunken', color: theme.backgroundSunken, usage: 'Input fields' },
                  { name: 'Subtle', color: theme.backgroundSubtle, usage: 'Hover states' },
                ].map((item) => (
                  <ColorSwatch
                    key={item.name}
                    {...item}
                    onCopy={copyToClipboard}
                    copied={copiedColor === item.name}
                  />
                ))}
              </div>
            </div>

            {/* Text Colors */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Text Colors</h3>
              <p className="text-text-secondary mb-6">Text hierarchy for optimal readability</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'Primary', color: theme.textPrimary, usage: 'Headings, body text' },
                  { name: 'Secondary', color: theme.textSecondary, usage: 'Subheadings' },
                  { name: 'Tertiary', color: theme.textTertiary, usage: 'Helper text' },
                  { name: 'Subtle', color: theme.textSubtle, usage: 'Placeholders' },
                  { name: 'Inverse', color: theme.textInverse, usage: 'On dark backgrounds' },
                ].map((item) => (
                  <ColorSwatch
                    key={item.name}
                    {...item}
                    onCopy={copyToClipboard}
                    copied={copiedColor === item.name}
                    showText
                  />
                ))}
              </div>
            </div>

            {/* Semantic Colors - Single Gradients */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Semantic Colors - Single Gradients</h3>
              <p className="text-text-secondary mb-6">
                Status and feedback colors - always use gradients for colored elements
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Success - Green Gradient */}
                <div className="text-center">
                  <div className="h-32 bg-gradient-success rounded-xl mb-3 shadow-lg flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Success</p>
                  <code className="text-xs text-text-tertiary block">bg-gradient-success</code>
                  <p className="text-xs text-text-secondary mt-2">Confirmations, publish</p>
                </div>

                {/* Error - Red Gradient */}
                <div className="text-center">
                  <div className="h-32 bg-gradient-error rounded-xl mb-3 shadow-lg flex items-center justify-center">
                    <XCircle className="h-10 w-10 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Error</p>
                  <code className="text-xs text-text-tertiary block">bg-gradient-error</code>
                  <p className="text-xs text-text-secondary mt-2">Errors, destructive</p>
                </div>

                {/* Warning - Amber Gradient */}
                <div className="text-center">
                  <div className="h-32 bg-gradient-warning rounded-xl mb-3 shadow-lg flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Warning</p>
                  <code className="text-xs text-text-tertiary block">bg-gradient-warning</code>
                  <p className="text-xs text-text-secondary mt-2">Warnings, cautions</p>
                </div>

                {/* Info - Golden Gradient (subsidiary) */}
                <div className="text-center">
                  <div className="h-32 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-xl mb-3 shadow-lg flex items-center justify-center">
                    <Info className="h-10 w-10 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Info</p>
                  <code className="text-xs text-text-tertiary block">
                    from-amber-400 to-yellow-600
                  </code>
                  <p className="text-xs text-text-secondary mt-2">Information, tips</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-background-subtle to-background-overlay border border-amber-400/20 rounded-xl">
                <p className="text-xs text-text-tertiary">
                  <strong className="text-amber-400">Rule:</strong> Only use single gradient
                  backgrounds for colored elements (buttons, icons, badges). For simple
                  alerts/information, use low opacity backgrounds with colored borders.
                </p>
              </div>
            </div>

            {/* Border Colors */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Border Colors</h3>
              <p className="text-text-secondary mb-6">Border hierarchy for containers</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Subtle', color: theme.borderSubtle, usage: 'Minimal separation' },
                  { name: 'Light', color: theme.borderLight, usage: 'Default borders' },
                  { name: 'Default', color: theme.borderDefault, usage: 'Standard borders' },
                  { name: 'Strong', color: theme.borderStrong, usage: 'Emphasized borders' },
                ].map((item) => (
                  <ColorSwatch
                    key={item.name}
                    {...item}
                    onCopy={copyToClipboard}
                    copied={copiedColor === item.name}
                    showBorder
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Section - MATCHING ACTUAL APP */}
        <section id="buttons" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Square className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Buttons</h2>
              <p className="text-text-secondary">
                Rounded corners (12px) with golden gradient primary buttons
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Primary Golden Buttons - THE MAIN STYLE */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Primary Golden Gradient Buttons
              </h3>
              <p className="text-text-secondary mb-6">
                Our signature button style used throughout the app. Always use{' '}
                <code className="bg-background-subtle px-2 py-1 rounded">rounded-xl</code> for
                buttons.
              </p>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">
                    Default Primary Button
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg">
                      Primary Button
                    </button>
                    <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-base font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg">
                      Larger Button
                    </button>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-xs font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg">
                      Small Button
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">With Icons</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Get Started
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Disabled State</p>
                  <button
                    disabled
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl opacity-50 cursor-not-allowed"
                  >
                    Disabled Button
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Secondary Buttons</h3>
              <p className="text-text-secondary mb-6">
                Used for alternative actions. Note the rounded-xl corners and border.
              </p>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Standard Secondary</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-background-raised border border-border-light text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle hover:border-amber-400/30 transition-all shadow-sm">
                      Secondary Button
                    </button>
                    <button className="px-4 py-2 bg-background-raised border border-border-light text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle hover:border-amber-400/30 transition-all shadow-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sign In
                    </button>
                    <button className="px-4 py-2 bg-background-raised border border-border-light text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle hover:border-amber-400/30 transition-all shadow-sm flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">
                    Ghost Style (No Border)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle transition-all">
                      Ghost Button
                    </button>
                    <button className="px-4 py-2 text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle transition-all flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Destructive Buttons - Gradient Style */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Destructive Actions - Single Gradient</h3>
              <p className="text-text-secondary mb-6">
                For dangerous actions like delete, remove, cancel - always use red gradient
              </p>

              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-gradient-error text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg">
                  Delete
                </button>
                <button className="px-4 py-2 bg-gradient-error text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button className="px-4 py-2 border-2 border-error/60 text-error text-sm font-semibold rounded-xl hover:bg-error/10 transition-all">
                  Remove
                </button>
              </div>

              <div className="mt-4 p-3 bg-background-subtle rounded-lg">
                <p className="text-xs text-text-tertiary">
                  <strong className="text-amber-400">Pattern:</strong> Primary destructive ={' '}
                  <code>bg-gradient-error</code>, Secondary destructive = border with{' '}
                  <code>border-error/60</code>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Inputs Section */}
        <section id="inputs" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Circle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Form Inputs</h2>
              <p className="text-text-secondary">Rounded input fields with golden focus states</p>
            </div>
          </div>

          <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Default Input</label>
              <input
                type="text"
                placeholder="Enter text here..."
                className="w-full px-4 py-2.5 bg-background-sunken border border-border-light text-text-primary rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">With Icon (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-background-sunken border border-border-light text-text-primary rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 bg-background-sunken border border-border-light text-text-primary rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Textarea</label>
              <textarea
                rows={4}
                placeholder="Enter your message..."
                className="w-full px-4 py-2.5 bg-background-sunken border border-border-light text-text-primary rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Error State</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Invalid input"
                  className="w-full px-4 py-2.5 pr-10 bg-background-sunken border-2 border-error/60 text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-error/20 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-gradient-error flex items-center justify-center shadow-sm">
                  <X className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="text-xs text-error flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-gradient-error flex items-center justify-center flex-shrink-0">
                  <X className="h-2.5 w-2.5 text-white" />
                </div>
                This field is required
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Success State</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Valid input"
                  className="w-full px-4 py-2.5 pr-10 bg-background-sunken border-2 border-success/60 text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-success/20 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-gradient-success flex items-center justify-center shadow-sm">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="text-xs text-success flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-gradient-success flex items-center justify-center flex-shrink-0">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
                Looks good!
              </div>
            </div>

            <div className="mt-6 p-3 bg-background-subtle rounded-lg">
              <p className="text-xs text-text-tertiary">
                <strong className="text-amber-400">Pattern:</strong> Use gradient icons for
                success/error indicators, not solid colors
              </p>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section id="typography" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Type className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Typography</h2>
              <p className="text-text-secondary">Proxima Nova for English, IRANSansX for Farsi</p>
            </div>
          </div>

          <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-text-secondary">Headings</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-border-light">
                  <h1 className="text-5xl font-bold mb-2">Heading 1 - Extra Large</h1>
                  <code className="text-xs text-text-tertiary">text-5xl font-bold (48px)</code>
                </div>
                <div className="pb-4 border-b border-border-light">
                  <h2 className="text-4xl font-bold mb-2">Heading 2 - Large</h2>
                  <code className="text-xs text-text-tertiary">text-4xl font-bold (36px)</code>
                </div>
                <div className="pb-4 border-b border-border-light">
                  <h3 className="text-3xl font-semibold mb-2">Heading 3 - Medium</h3>
                  <code className="text-xs text-text-tertiary">text-3xl font-semibold (30px)</code>
                </div>
                <div className="pb-4 border-b border-border-light">
                  <h4 className="text-2xl font-semibold mb-2">Heading 4 - Regular</h4>
                  <code className="text-xs text-text-tertiary">text-2xl font-semibold (24px)</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-text-secondary">Body Text</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-border-light">
                  <p className="text-lg mb-2">
                    Large body text for emphasis and readability in hero sections.
                  </p>
                  <code className="text-xs text-text-tertiary">text-lg (18px)</code>
                </div>
                <div className="pb-4 border-b border-border-light">
                  <p className="text-base mb-2">
                    Default body text size used throughout the application for optimal readability.
                  </p>
                  <code className="text-xs text-text-tertiary">text-base (16px)</code>
                </div>
                <div className="pb-4 border-b border-border-light">
                  <p className="text-sm mb-2">
                    Small text for captions, labels, and secondary information.
                  </p>
                  <code className="text-xs text-text-tertiary">text-sm (14px)</code>
                </div>
                <div>
                  <p className="text-xs mb-2">Extra small text for fine print and metadata.</p>
                  <code className="text-xs text-text-tertiary">text-xs (12px)</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-text-secondary">
                Golden Gradient Text
              </h3>
              <h1 className="text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                Build Amazing Apps
              </h1>
              <code className="text-xs text-text-tertiary block">
                bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent
              </code>
            </div>
          </div>
        </section>

        {/* Spacing Section */}
        <section id="spacing" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Layout className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Spacing & Border Radius</h2>
              <p className="text-text-secondary">Consistent spacing and rounded corners</p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Border Radius */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Border Radius - Rounded Corners</h3>
              <p className="text-text-secondary mb-6">
                We use <code className="bg-background-subtle px-2 py-1 rounded">rounded-xl</code>{' '}
                (12px) as our standard for buttons, cards, and containers.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-full h-24 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-lg mb-2" />
                  <p className="text-sm font-medium">rounded-lg</p>
                  <code className="text-xs text-text-tertiary">8px</code>
                </div>
                <div className="text-center">
                  <div className="w-full h-24 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-xl mb-2" />
                  <p className="text-sm font-medium">rounded-xl ⭐</p>
                  <code className="text-xs text-text-tertiary">12px - Primary</code>
                </div>
                <div className="text-center">
                  <div className="w-full h-24 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-2xl mb-2" />
                  <p className="text-sm font-medium">rounded-2xl</p>
                  <code className="text-xs text-text-tertiary">16px</code>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full mb-2 mx-auto" />
                  <p className="text-sm font-medium">rounded-full</p>
                  <code className="text-xs text-text-tertiary">Full circle</code>
                </div>
              </div>
            </div>

            {/* Spacing Scale */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Spacing Scale</h3>
              <p className="text-text-secondary mb-6">
                Based on 4px increments for consistent rhythm
              </p>
              <div className="space-y-3">
                {[
                  { name: '2', px: '8px', rem: '0.5rem' },
                  { name: '3', px: '12px', rem: '0.75rem' },
                  { name: '4', px: '16px', rem: '1rem' },
                  { name: '6', px: '24px', rem: '1.5rem' },
                  { name: '8', px: '32px', rem: '2rem' },
                  { name: '12', px: '48px', rem: '3rem' },
                  { name: '16', px: '64px', rem: '4rem' },
                ].map((space) => (
                  <div
                    key={space.name}
                    className="flex items-center gap-4 pb-3 border-b border-border-light last:border-0"
                  >
                    <code className="text-xs text-text-tertiary w-12">space-{space.name}</code>
                    <div
                      className="h-8 bg-gradient-to-r from-amber-400 to-yellow-600 rounded"
                      style={{ width: space.rem }}
                    />
                    <span className="text-sm text-text-secondary">{space.rem}</span>
                    <span className="text-xs text-text-tertiary">({space.px})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modals & Alerts - App Components */}
        <section id="modals" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Modals & Alerts</h2>
              <p className="text-text-secondary">
                Context-aware notification system from actual app components
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Warning Modal - Amber/Red */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Warning Modal - Amber/Red Gradient
              </h3>
              <p className="text-text-secondary mb-6">
                Used for critical alerts like credit depletion. Features amber background with
                red/amber gradient buttons.
                <br />
                <code className="text-xs bg-background-subtle px-2 py-1 rounded mt-2 inline-block">
                  Reference: CreditPurchaseModal.tsx
                </code>
              </p>

              <div className="relative w-full max-w-md mx-auto bg-background-raised backdrop-blur-sm border-2 border-warning/30 rounded-2xl shadow-2xl overflow-hidden p-8">
                {/* Animated background gradient - RED/GOLD urgency */}
                <div className="absolute inset-0 bg-gradient-to-br from-error/20 via-warning/15 to-error/10 animate-pulse" />

                {/* Sparkle effects */}
                <div className="absolute top-4 left-4 w-2 h-2 bg-warning rounded-full animate-ping" />
                <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-error rounded-full animate-ping animation-delay-100" />
                <div className="absolute bottom-8 left-8 w-2 h-2 bg-warning rounded-full animate-ping animation-delay-200" />

                <div className="relative z-10 text-center">
                  {/* Warning icon with gradient */}
                  <div className="relative w-14 h-14 bg-gradient-warning rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4">
                    <Zap className="w-7 h-7 text-white animate-bounce" />
                  </div>

                  <h4 className="text-xl font-bold mb-2">Credits Running Low!</h4>
                  <p className="text-sm text-text-secondary mb-6">
                    You need to purchase more credits to continue.
                  </p>

                  <button className="relative group w-full px-5 py-3 text-white rounded-xl font-semibold shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-warning rounded-lg transition-all duration-300 group-hover:scale-105" />
                    <span className="relative">Purchase Credits</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Success Modal - Green Gradient */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Success Modal - Single Green Gradient
              </h3>
              <p className="text-text-secondary mb-6">
                Used for successful operations like payment completion or app publishing.
                <br />
                <code className="text-xs bg-background-subtle px-2 py-1 rounded mt-2 inline-block">
                  Reference: PaymentSuccessModal.tsx, PublishModal.tsx
                </code>
              </p>

              <div className="relative w-full max-w-md mx-auto bg-background-raised backdrop-blur-sm border-2 border-success/30 rounded-2xl shadow-2xl p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-success/15 via-success/10 to-success/5" />

                <div className="relative z-10 text-center">
                  {/* Success icon with green gradient + pulse effect */}
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-success/20 rounded-full animate-pulse" />
                    <div className="relative w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  <h4 className="text-2xl font-bold mb-2">Payment Successful!</h4>
                  <p className="text-sm text-text-secondary mb-6">
                    Your credits have been added to your account.
                  </p>

                  <button className="w-full px-5 py-3 bg-gradient-success text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg">
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Error Modal - Red Gradient */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-error" />
                Error Modal - Single Red Gradient
              </h3>
              <p className="text-text-secondary mb-6">
                Used for critical errors like app generation failures.
                <br />
                <code className="text-xs bg-background-subtle px-2 py-1 rounded mt-2 inline-block">
                  Reference: GenerationErrorModal.tsx
                </code>
              </p>

              <div className="relative w-full max-w-md mx-auto bg-background-raised backdrop-blur-sm border-2 border-error/30 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-error/25 via-error/10 to-error/15 animate-pulse" />

                <div className="relative z-10 text-center">
                  {/* Error icon with red gradient + pulse */}
                  <div className="relative w-16 h-16 bg-gradient-error rounded-2xl flex items-center justify-center shadow-xl animate-pulse mx-auto mb-4">
                    <AlertCircle className="w-9 h-9 text-white" />
                  </div>

                  <h4 className="text-xl font-bold mb-2">Generation Failed</h4>
                  <p className="text-sm text-text-secondary mb-6">
                    Something went wrong while generating your app.
                  </p>

                  <button className="relative group w-full px-5 py-3 text-white rounded-xl font-semibold shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-error rounded-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg" />
                    <span className="relative">Try Again</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Information Modal - Subsidiary Golden */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-400" />
                Information Modal - Subsidiary of Brand Color
              </h3>
              <p className="text-text-secondary mb-6">
                For informational messages. Uses subtle golden/amber tones as subsidiary of main
                brand.
              </p>

              <div className="relative w-full max-w-md mx-auto bg-background-raised backdrop-blur-sm border-2 border-amber-400/20 rounded-2xl shadow-2xl p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-yellow-600/10" />

                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border-2 border-amber-400/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Info className="w-7 h-7 text-amber-400" />
                  </div>

                  <h4 className="text-xl font-bold mb-2">Information</h4>
                  <p className="text-sm text-text-secondary mb-6">
                    Here's some helpful information about your app.
                  </p>

                  <button className="w-full px-5 py-3 bg-background-subtle border border-amber-400/30 text-text-primary rounded-xl font-semibold hover:bg-amber-400/10 transition-all">
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Colors Section */}
        <section id="product-colors" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Product Color System</h2>
              <p className="text-text-secondary">
                Secondary colors for product differentiation - pair with golden gradient
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Product - Green */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <div className="h-32 bg-gradient-success rounded-xl mb-4 shadow-lg flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Product</h3>
              <p className="text-text-secondary text-sm mb-4">
                Single gradient green - same as Publish button
              </p>
              <div className="space-y-2 text-xs">
                <code className="block bg-background-subtle px-3 py-2 rounded">
                  bg-gradient-success
                </code>
                <code className="block bg-background-subtle px-3 py-2 rounded">
                  linear-gradient(to bottom right, #22C55E, #10B981)
                </code>
                <p className="text-text-tertiary pt-2">
                  Use for: Product features, core functionality, building/creation actions
                </p>
              </div>
            </div>

            {/* Marketing - Blue */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <div className="h-32 bg-gradient-blue rounded-xl mb-4 shadow-lg flex items-center justify-center">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Marketing</h3>
              <p className="text-text-secondary text-sm mb-4">Single gradient blue</p>
              <div className="space-y-2 text-xs">
                <code className="block bg-background-subtle px-3 py-2 rounded">
                  bg-gradient-blue
                </code>
                <code className="block bg-background-subtle px-3 py-2 rounded">
                  linear-gradient(to bottom right, #3B82F6, #4F46E5)
                </code>
                <p className="text-text-tertiary pt-2">
                  Use for: Marketing features, communications, social, outreach
                </p>
              </div>
            </div>

            {/* Analytics - Red */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <div className="h-32 bg-gradient-error rounded-xl mb-4 shadow-lg flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-text-secondary text-sm mb-4">
                Single gradient red - different from error
              </p>
              <div className="space-y-2 text-xs">
                <code className="block bg-background-subtle px-3 py-2 rounded">
                  bg-gradient-error
                </code>
                <code className="block bg-background-subtle px-3 py-2 rounded">
                  linear-gradient(to bottom right, #EF4444, #DC2626)
                </code>
                <p className="text-text-tertiary pt-2">
                  Use for: Analytics features, metrics, reports, data visualization
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-background-raised to-background-subtle border-2 border-amber-400/20 rounded-xl p-6 shadow-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Usage Guidelines
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>These colors pair with the golden gradient as secondary branding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  Use in specific product pages or feature sections to differentiate functionality
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Golden gradient remains primary - these are supporting colors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Never mix Product/Marketing/Analytics colors in the same section</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SVG Icon Set */}
        <section id="icons" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">SVG Monochromic Icon Set</h2>
              <p className="text-text-secondary">Lucide React icons with consistent styling</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Icon Grid */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Core Icons</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {[
                  { icon: Sparkles, name: 'Sparkles' },
                  { icon: Check, name: 'Check' },
                  { icon: X, name: 'Close' },
                  { icon: Download, name: 'Download' },
                  { icon: Upload, name: 'Upload' },
                  { icon: Search, name: 'Search' },
                  { icon: Settings, name: 'Settings' },
                  { icon: User, name: 'User' },
                  { icon: Mail, name: 'Mail' },
                  { icon: Lock, name: 'Lock' },
                  { icon: AlertCircle, name: 'Alert' },
                  { icon: CheckCircle2, name: 'Success' },
                  { icon: XCircle, name: 'Error' },
                  { icon: Info, name: 'Info' },
                  { icon: Zap, name: 'Zap' },
                  { icon: Palette, name: 'Palette' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background-subtle transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center text-text-secondary group-hover:text-amber-400 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs text-text-tertiary">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Icon Usage */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Icon Usage Examples</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-background-subtle rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold">With Gradient</span>
                  </div>
                  <code className="text-xs text-text-tertiary">Icon in golden gradient box</code>
                </div>

                <div className="bg-background-subtle rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <span className="font-semibold">Semantic Color</span>
                  </div>
                  <code className="text-xs text-text-tertiary">Icon with success/error color</code>
                </div>

                <div className="bg-background-subtle rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-6 w-6 text-text-secondary" />
                    <span className="font-semibold">Neutral</span>
                  </div>
                  <code className="text-xs text-text-tertiary">Icon with text-secondary</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Icon Background Styles - Universal Patterns */}
        <section id="icon-backgrounds" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Square className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Icon Background Styles</h2>
              <p className="text-text-secondary">
                Universal icon container patterns used throughout the app
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Primary Icon Styles */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Primary Icon Containers</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Golden Gradient - Primary Brand */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl shadow-lg mb-3">
                    <Settings className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Golden Gradient</p>
                  <code className="text-xs text-text-tertiary block">rounded-xl shadow-lg</code>
                  <p className="text-xs text-text-secondary mt-2">Primary actions, settings</p>
                </div>

                {/* Success Green */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-success rounded-xl shadow-lg mb-3">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Success Green</p>
                  <code className="text-xs text-text-tertiary block">bg-gradient-success</code>
                  <p className="text-xs text-text-secondary mt-2">Confirmations, publish</p>
                </div>

                {/* Error Red */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-error rounded-xl shadow-lg mb-3">
                    <AlertCircle className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Error Red</p>
                  <code className="text-xs text-text-tertiary block">bg-gradient-error</code>
                  <p className="text-xs text-text-secondary mt-2">Errors, alerts, analytics</p>
                </div>

                {/* Blue Gradient */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-blue rounded-xl shadow-lg mb-3">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Blue Gradient</p>
                  <code className="text-xs text-text-tertiary block">bg-gradient-blue</code>
                  <p className="text-xs text-text-secondary mt-2">Database, marketing, info</p>
                </div>
              </div>
            </div>

            {/* Neutral/Dark Background Icons - NEW */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Neutral & Dark Background Icons</h3>
              <p className="text-text-secondary mb-6 text-sm">
                Alternative icon styles without gradients - for secondary actions and less prominent
                features
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Dark Slate Background */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-600 rounded-xl shadow-lg mb-3">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </div>
                  <p className="font-semibold text-sm mb-1">Dark Slate</p>
                  <code className="text-xs text-text-tertiary block">bg-slate-600</code>
                  <p className="text-xs text-text-secondary mt-2">Share, copy link</p>
                </div>

                {/* Neutral Gray Background */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-500 rounded-xl shadow-lg mb-3">
                    <Download className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Neutral Gray</p>
                  <code className="text-xs text-text-tertiary block">bg-gray-500</code>
                  <p className="text-xs text-text-secondary mt-2">Download, export</p>
                </div>

                {/* Background Raised (Theme) */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-background-raised border border-border-light rounded-xl shadow-md mb-3">
                    <User className="h-7 w-7 text-text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Raised (Theme)</p>
                  <code className="text-xs text-text-tertiary block">bg-background-raised</code>
                  <p className="text-xs text-text-secondary mt-2">User profile, info</p>
                </div>

                {/* Background Subtle (Theme) */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-background-subtle rounded-xl shadow-sm mb-3">
                    <Settings className="h-7 w-7 text-text-secondary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Subtle (Theme)</p>
                  <code className="text-xs text-text-tertiary block">bg-background-subtle</code>
                  <p className="text-xs text-text-secondary mt-2">Secondary actions</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-background-subtle to-background-overlay border border-amber-400/20 rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-amber-400" />
                  When to Use Neutral Backgrounds
                </h4>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> <strong>Secondary actions</strong>{' '}
                    that don't need emphasis (Share Link, Copy)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span>{' '}
                    <strong>Less prominent features</strong> in crowded interfaces
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> <strong>Neutral contexts</strong>{' '}
                    where colored gradients would be too bold
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> <strong>User profile/settings</strong>{' '}
                    where brand colors aren't needed
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> <strong>Contrast:</strong> Use
                    gradients for primary actions, neutral for secondary
                  </li>
                </ul>
              </div>
            </div>

            {/* Share & Sidebar Icon Styles */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Share Link & Sidebar Icons</h3>
              <p className="text-text-secondary mb-6 text-sm">
                Beautiful icon styles with hover effects - perfect for sidebars and share buttons
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Subtle Background Style */}
                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Subtle Background</p>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay hover:border-amber-400/30 border border-transparent transition-all">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text-primary">Share Link</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay hover:border-amber-400/30 border border-transparent transition-all">
                      <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text-primary">Publish</span>
                    </button>

                    <code className="block text-xs text-text-tertiary mt-2">
                      bg-background-subtle hover:bg-background-overlay
                    </code>
                  </div>
                </div>

                {/* Raised Card Style */}
                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Raised Card</p>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-background-raised border border-border-light rounded-xl hover:border-amber-400/40 hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-gradient-blue rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text-primary">View Files</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 bg-background-raised border border-border-light rounded-xl hover:border-amber-400/40 hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-gradient-orange rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text-primary">Edit Code</span>
                    </button>

                    <code className="block text-xs text-text-tertiary mt-2">
                      bg-background-raised border hover:border-amber-400/40
                    </code>
                  </div>
                </div>

                {/* Minimal Style */}
                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Minimal</p>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background-subtle transition-all">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Settings</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background-subtle transition-all">
                      <div className="w-10 h-10 bg-gradient-warning rounded-lg flex items-center justify-center shadow-md">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Upgrade</span>
                    </button>

                    <code className="block text-xs text-text-tertiary mt-2">
                      No background, hover:bg-background-subtle
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Gradient vs Neutral Comparison */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Gradient vs Neutral - When to Use Each</h3>
              <p className="text-text-secondary mb-6 text-sm">
                Side-by-side comparison to help you choose the right style
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Gradient Icons - Primary Actions */}
                <div className="bg-gradient-to-br from-amber-400/5 to-yellow-600/5 border border-amber-400/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <h4 className="font-semibold text-text-primary">Use Gradient Icons For:</h4>
                  </div>

                  <div className="space-y-3 mb-4">
                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay transition-all">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Generate App</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay transition-all">
                      <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text-primary">Publish</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay transition-all">
                      <div className="w-10 h-10 bg-gradient-error rounded-lg flex items-center justify-center shadow-md">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Delete Project</span>
                    </button>
                  </div>

                  <ul className="space-y-2 text-xs text-text-secondary">
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> Primary
                      actions (Generate, Publish, Save)
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> Important
                      features that need emphasis
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />{' '}
                      Success/error/warning indicators
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> Brand-forward
                      UI elements
                    </li>
                  </ul>
                </div>

                {/* Neutral Icons - Secondary Actions */}
                <div className="bg-slate-500/5 border border-slate-400/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-slate-400" />
                    <h4 className="font-semibold text-text-primary">Use Neutral Icons For:</h4>
                  </div>

                  <div className="space-y-3 mb-4">
                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay transition-all">
                      <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text-primary">Share Link</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay transition-all">
                      <div className="w-10 h-10 bg-background-raised border border-border-light rounded-lg flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-text-primary" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Profile</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 bg-background-subtle rounded-xl hover:bg-background-overlay transition-all">
                      <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center shadow-md">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Download Code</span>
                    </button>
                  </div>

                  <ul className="space-y-2 text-xs text-text-secondary">
                    <li className="flex gap-2">
                      <Info className="h-4 w-4 text-slate-400 flex-shrink-0" /> Secondary actions
                      (Share, Copy, Download)
                    </li>
                    <li className="flex gap-2">
                      <Info className="h-4 w-4 text-slate-400 flex-shrink-0" /> Less prominent
                      features in busy layouts
                    </li>
                    <li className="flex gap-2">
                      <Info className="h-4 w-4 text-slate-400 flex-shrink-0" /> User info, profile,
                      settings
                    </li>
                    <li className="flex gap-2">
                      <Info className="h-4 w-4 text-slate-400 flex-shrink-0" /> Neutral contexts
                      without strong emphasis
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-background-subtle to-background-overlay border border-amber-400/20 rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Golden Rule for Icon Backgrounds
                </h4>
                <p className="text-xs text-text-secondary">
                  <strong className="text-amber-400">Primary actions get gradients</strong>{' '}
                  (Generate, Publish, Delete).{' '}
                  <strong className="text-slate-400">
                    Secondary actions get neutral backgrounds
                  </strong>{' '}
                  (Share, Profile, Download). This creates visual hierarchy and guides users to the
                  most important actions.
                </p>
              </div>
            </div>

            {/* Size Variations */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Icon Container Sizes</h3>

              <div className="flex flex-wrap items-end gap-6">
                {/* Extra Small */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-md shadow-sm mb-2">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs font-medium">XS - 24px</p>
                  <code className="text-[10px] text-text-tertiary">rounded-md</code>
                </div>

                {/* Small */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg shadow-md mb-2">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-medium">S - 32px</p>
                  <code className="text-[10px] text-text-tertiary">rounded-lg</code>
                </div>

                {/* Medium */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg shadow-md mb-2">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs font-medium">M - 40px</p>
                  <code className="text-[10px] text-text-tertiary">rounded-lg</code>
                </div>

                {/* Large */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl shadow-lg mb-2">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-xs font-medium">L - 56px</p>
                  <code className="text-[10px] text-text-tertiary">rounded-xl</code>
                </div>

                {/* Extra Large */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl shadow-xl mb-2">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-xs font-medium">XL - 80px</p>
                  <code className="text-[10px] text-text-tertiary">rounded-2xl</code>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-background-subtle to-background-overlay border border-amber-400/20 rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Usage Guidelines
                </h4>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Chat icons: 28px (w-7 h-7, rounded-lg)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Sidebar/Share icons: 40px (w-10 h-10,
                    rounded-lg)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Section headers: 56px (w-14 h-14,
                    rounded-xl)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Modal icons: 64-80px (w-16-20 h-16-20,
                    rounded-2xl)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Always use gradient backgrounds for
                    colored icons
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Add shadow-md or shadow-lg for depth
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Animations */}
        <section id="animations" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Animation System</h2>
              <p className="text-text-secondary">Smooth, performant animations for polish</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Animation Examples */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Core Animations</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pulse */}
                <div className="bg-background-subtle rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full mx-auto mb-4 animate-pulse" />
                  <h4 className="font-semibold mb-2">Pulse</h4>
                  <code className="text-xs text-text-tertiary">animate-pulse</code>
                  <p className="text-xs text-text-secondary mt-2">Loading states, attention</p>
                </div>

                {/* Bounce */}
                <div className="bg-background-subtle rounded-xl p-6 text-center">
                  <Zap className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-bounce" />
                  <h4 className="font-semibold mb-2">Bounce</h4>
                  <code className="text-xs text-text-tertiary">animate-bounce</code>
                  <p className="text-xs text-text-secondary mt-2">Alerts, warnings</p>
                </div>

                {/* Ping */}
                <div className="bg-background-subtle rounded-xl p-6 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full" />
                  </div>
                  <h4 className="font-semibold mb-2">Ping</h4>
                  <code className="text-xs text-text-tertiary">animate-ping</code>
                  <p className="text-xs text-text-secondary mt-2">Notifications, indicators</p>
                </div>

                {/* Spin */}
                <div className="bg-background-subtle rounded-xl p-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 animate-spin text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <h4 className="font-semibold mb-2">Spin</h4>
                  <code className="text-xs text-text-tertiary">animate-spin</code>
                  <p className="text-xs text-text-secondary mt-2">Loading spinners</p>
                </div>

                {/* Scale on Hover */}
                <div className="bg-background-subtle rounded-xl p-6 text-center">
                  <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:scale-105 transition-transform shadow-md">
                    Hover Me
                  </button>
                  <h4 className="font-semibold mb-2 mt-4">Scale Hover</h4>
                  <code className="text-xs text-text-tertiary">hover:scale-105</code>
                  <p className="text-xs text-text-secondary mt-2">Interactive elements</p>
                </div>

                {/* Slide Up */}
                <div className="bg-background-subtle rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl mx-auto mb-4 hover:-translate-y-2 transition-transform" />
                  <h4 className="font-semibold mb-2">Slide Up</h4>
                  <code className="text-xs text-text-tertiary">hover:-translate-y-2</code>
                  <p className="text-xs text-text-secondary mt-2">Cards, images</p>
                </div>
              </div>
            </div>

            {/* Transition Guidelines */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Transition Guidelines</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <code className="bg-background-subtle px-3 py-2 rounded text-sm shrink-0">
                    transition-all
                  </code>
                  <p className="text-sm text-text-secondary">
                    Use for hover states on buttons, cards - smooth transitions for all properties
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <code className="bg-background-subtle px-3 py-2 rounded text-sm shrink-0">
                    transition-colors
                  </code>
                  <p className="text-sm text-text-secondary">
                    Use for color changes only - more performant than transition-all
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <code className="bg-background-subtle px-3 py-2 rounded text-sm shrink-0">
                    transition-transform
                  </code>
                  <p className="text-sm text-text-secondary">
                    Use for scale, translate effects - hardware accelerated
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <code className="bg-background-subtle px-3 py-2 rounded text-sm shrink-0">
                    duration-300
                  </code>
                  <p className="text-sm text-text-secondary">
                    Default duration - 300ms feels responsive
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Chat Components */}
        <section id="ai-chat" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold">AI Chat Components</h2>
              <p className="text-text-secondary">
                Comprehensive chat interface system with contextual colors
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Chat Messages */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Chat Message Styles</h3>

              <div className="space-y-4 max-w-2xl">
                {/* User message - Darker golden gradient */}
                <div className="flex justify-end">
                  <div className="max-w-[90%] bg-gradient-to-br from-amber-500 to-yellow-700 rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed text-white">
                      User message with darker golden gradient for better contrast
                    </p>
                    <code className="text-xs opacity-75 block mt-2">
                      from-amber-500 to-yellow-700
                    </code>
                  </div>
                </div>

                {/* AI message - default with icon */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-background-raised border border-border-light rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-text-primary">
                          Default AI message with dark background and icon
                        </p>
                        <code className="text-xs text-text-tertiary block mt-2">
                          bg-background-raised + border + icon
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI message - success (done, complete) with colored border and low opacity */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-success/10 border border-success/40 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-text-primary">
                          ✓ Task completed successfully!
                        </p>
                        <code className="text-xs text-text-tertiary block mt-2">
                          bg-success/10 border-success/40
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI message - database (blue) with dark bg and colored border */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-background-raised border border-border-light rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-text-primary">
                          Setting up database tables...
                        </p>
                        <code className="text-xs text-text-tertiary block mt-2">
                          Dark bg + blue icon gradient
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI message - code (orange) */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-background-raised border border-border-light rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-orange flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-text-primary">
                          Building application code...
                        </p>
                        <code className="text-xs text-text-tertiary block mt-2">
                          Dark bg + orange icon gradient
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI message - thinking/analyzing (cyan) */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-background-raised border border-border-light rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-cyan flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white animate-spin"
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-text-primary">
                          Analyzing your request...
                        </p>
                        <code className="text-xs text-text-tertiary block mt-2">
                          Dark bg + cyan icon with spin animation
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chatbox Container - Buttons INSIDE */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Chatbox Input Area - Actual App Style</h3>
              <p className="text-text-secondary mb-6">
                Complete chatbox with all controls INSIDE the container - no shadows on chatbox
              </p>

              <div className="bg-background-base rounded-2xl p-1">
                <div className="relative bg-background-raised border border-border-light rounded-2xl focus-within:border-amber-400 transition-colors">
                  <textarea
                    placeholder="Describe your app idea..."
                    className="w-full h-36 px-4 py-4 text-base bg-transparent resize-none focus:outline-none text-text-primary"
                    disabled
                  />

                  {/* Bottom Left - Feature Buttons */}
                  <div className="absolute left-3 bottom-3 flex items-center gap-2">
                    {/* Cofounder Button - Neutral */}
                    <button className="p-2.5 rounded-lg bg-background-subtle text-text-secondary hover:bg-background-overlay hover:text-text-primary transition-all group relative">
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none">
                        Cofounder Features
                      </span>
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
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </button>

                    {/* Attach Button - Neutral */}
                    <button className="p-2.5 rounded-lg bg-background-subtle text-text-secondary hover:bg-background-overlay hover:text-text-primary transition-all group relative">
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none">
                        Attach Files
                      </span>
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
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>

                    {/* Expandable Tags (shown on click) */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
                        Startup
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                        Magic
                      </span>
                    </div>
                  </div>

                  {/* Bottom Right - Plan Toggle and Send Button */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {/* Plan Toggle Button - Neutral (inactive state) */}
                    <button className="p-2.5 rounded-lg bg-background-subtle text-text-tertiary hover:bg-background-overlay hover:text-text-secondary transition-all group relative">
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none">
                        Plan First
                      </span>
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
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </button>

                    {/* Send Button - Golden Gradient (primary action) */}
                    <button className="p-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-600 text-white hover:from-amber-500 hover:to-yellow-700 transition-all flex items-center justify-center">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="p-4 bg-gradient-to-br from-background-subtle to-background-overlay border border-amber-400/20 rounded-xl">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Chatbox Design Rules
                  </h4>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span> <strong>NO shadows</strong> on
                      chatbox container or buttons
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span> <strong>All buttons:</strong>{' '}
                      Consistent size <code>p-2.5 rounded-lg</code> with <code>w-5 h-5</code> icons
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span> <strong>Neutral icons:</strong>{' '}
                      Feature buttons use neutral backgrounds (bg-background-subtle)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span> <strong>Gradient icon:</strong> Only
                      Send button uses golden gradient (primary action)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span> <strong>Tooltips:</strong> Fast
                      150ms opacity transition on hover
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span> <strong>Tags:</strong> Gradient
                      backgrounds, no shadows
                    </li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {/* Neutral Icon Buttons */}
                  <div className="p-3 bg-background-subtle rounded-lg">
                    <p className="text-xs font-medium mb-2 text-text-primary">
                      Neutral Icon Buttons
                    </p>
                    <div className="space-y-2">
                      <button className="w-full p-2.5 rounded-lg bg-background-subtle text-text-secondary hover:bg-background-overlay hover:text-text-primary transition-all flex items-center justify-center gap-2">
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
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      </button>
                      <code className="text-[10px] text-text-tertiary block text-center">
                        Cofounder, Attach, etc.
                      </code>
                    </div>
                  </div>

                  {/* Toggle States */}
                  <div className="p-3 bg-background-subtle rounded-lg">
                    <p className="text-xs font-medium mb-2 text-text-primary">Toggle States</p>
                    <div className="space-y-2">
                      <button className="w-full p-2.5 rounded-lg bg-background-subtle text-text-tertiary transition-all flex items-center justify-center gap-2">
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
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </button>
                      <button className="w-full p-2.5 rounded-lg bg-yellow-400/20 text-yellow-600 transition-all flex items-center justify-center gap-2">
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
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </button>
                      <code className="text-[10px] text-text-tertiary block text-center">
                        Inactive / Active
                      </code>
                    </div>
                  </div>

                  {/* Send Button States */}
                  <div className="p-3 bg-background-subtle rounded-lg">
                    <p className="text-xs font-medium mb-2 text-text-primary">
                      Send Button (Gradient)
                    </p>
                    <div className="space-y-2">
                      <button className="w-full p-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-600 text-white transition-all flex items-center justify-center gap-2">
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </button>
                      <button className="w-full p-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-600 text-white opacity-50 cursor-not-allowed transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </button>
                      <code className="text-[10px] text-text-tertiary block text-center">
                        Ready / Loading
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Confirmation & Action Modals */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">User Confirmation Modals in Chat</h3>
              <p className="text-text-secondary mb-6">
                Interactive confirmation steps during the chat experience
              </p>

              <div className="space-y-6">
                {/* Plan Confirmation */}
                <div className="bg-background-base rounded-2xl border border-border-light px-6 py-4 shadow-md">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-warning flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium">
                        Ready to proceed with building?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-brand text-white hover:bg-gradient-brand-hover shadow-lg hover:shadow-xl transition-all">
                      Start Building
                    </button>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-background-subtle text-text-primary hover:bg-background-overlay border border-border-light transition-all">
                      Keep Planning
                    </button>
                  </div>
                </div>

                {/* Success Confirmation with Action */}
                <div className="bg-success/5 border border-success rounded-2xl px-6 py-4 shadow-md">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-sm text-text-primary font-medium">
                      <p>Your app is ready! Would you like to publish it now?</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-3 border-t border-success/20">
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-success text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                      Publish Now
                    </button>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-background-subtle text-text-primary hover:bg-background-overlay border border-border-light transition-all">
                      Review First
                    </button>
                  </div>
                </div>

                {/* Warning Confirmation - Overwrite */}
                <div className="bg-background-raised border border-border-light rounded-2xl px-6 py-4 shadow-md">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-warning flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-sm text-text-primary font-medium">
                      <p>This will overwrite your current changes. Are you sure?</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-3 border-t border-border-light">
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-error text-white hover:opacity-90 shadow-md transition-all">
                      Yes, Overwrite
                    </button>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-background-subtle text-text-primary hover:bg-background-overlay border border-border-light transition-all">
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Edit Confirmation */}
                <div className="bg-background-raised border border-border-light rounded-2xl px-6 py-4 shadow-md">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-sm text-text-primary font-medium">
                      <p>I've updated 3 files. Would you like to review the changes?</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-3 border-t border-border-light">
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-brand text-white hover:bg-gradient-brand-hover shadow-lg hover:shadow-xl transition-all">
                      Review Changes
                    </button>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-background-subtle text-text-primary hover:bg-background-overlay border border-border-light transition-all">
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Icons */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Chat Icons & Indicators</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {/* AI Avatar */}
                <div className="bg-background-subtle rounded-xl p-4 text-center">
                  <div className="w-12 h-12 rounded-lg bg-gradient-brand flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold mb-1">AI Avatar</p>
                  <code className="text-xs text-text-tertiary">
                    Golden gradient box with Sparkles icon
                  </code>
                </div>

                {/* Send Button */}
                <div className="bg-background-subtle rounded-xl p-4 text-center">
                  <button className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-lg hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md mx-auto mb-3 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                  <p className="font-semibold mb-1">Send Button</p>
                  <code className="text-xs text-text-tertiary">Golden gradient with send icon</code>
                </div>

                {/* Typing Indicator */}
                <div className="bg-background-subtle rounded-xl p-4 text-center">
                  <div className="flex gap-1 justify-center mb-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <p className="font-semibold mb-1">Typing Indicator</p>
                  <code className="text-xs text-text-tertiary">Three bouncing amber dots</code>
                </div>
              </div>
            </div>

            {/* Message Configuration - SINGLE SOURCE OF TRUTH */}
            <div className="bg-gradient-to-br from-background-raised to-background-subtle border-2 border-amber-400/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-400" />
                  Message Configuration
                </h4>
                <code className="text-xs bg-background-subtle px-3 py-1.5 rounded-lg text-amber-400">
                  lib/ui/message-ui-config.ts
                </code>
              </div>

              <div className="p-4 bg-success/10 border border-success/30 rounded-xl mb-6">
                <p className="text-xs text-success flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>All message colors below are live from config!</strong> Edit{' '}
                    <code className="bg-background-subtle px-1.5 py-0.5 rounded">
                      lib/ui/message-ui-config.ts
                    </code>{' '}
                    to change them instantly across the entire app.
                  </span>
                </p>
              </div>

              {/* Role Icons (All Grey) */}
              <div className="mb-6">
                <h5 className="font-medium mb-3 text-text-primary flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  Role Message Icons (Neutral Grey)
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(ROLE_CONFIGS).map(([key, config]) => (
                    <div
                      key={key}
                      className={`${config.bgClass} border border-border-light rounded-lg p-3`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-md ${config.bgClass} flex items-center justify-center`}
                        >
                          <div className={config.iconColor}>{MESSAGE_ICONS[config.icon]}</div>
                        </div>
                        <span className="text-xs font-medium text-text-primary">{config.name}</span>
                      </div>
                      <code className="text-[10px] text-text-tertiary block">{config.bgClass}</code>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  All role messages use consistent grey backgrounds to maintain professional
                  appearance
                </p>
              </div>

              {/* Status Colors */}
              <div className="mb-6">
                <h5 className="font-medium mb-3 text-text-primary">Status Message Colors</h5>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIGS).map(([key, config]) => (
                    <div
                      key={key}
                      className="bg-background-base border border-border-light rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${config.iconGradient} flex items-center justify-center shadow-md shrink-0`}
                        >
                          {MESSAGE_ICONS[config.icon]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-semibold text-sm text-text-primary">
                              {config.name}
                            </h6>
                            <span className="text-xs text-text-tertiary">
                              Priority: {config.priority}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {config.keywords.slice(0, 3).map((keyword, i) => (
                              <code
                                key={i}
                                className="text-[10px] bg-background-subtle px-2 py-0.5 rounded text-text-secondary"
                              >
                                "{keyword}"
                              </code>
                            ))}
                            {config.keywords.length > 3 && (
                              <span className="text-[10px] text-text-tertiary">
                                +{config.keywords.length - 3} more
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-text-tertiary">Background: </span>
                              <code className="text-text-primary">{config.bgClass}</code>
                            </div>
                            <div>
                              <span className="text-text-tertiary">Icon: </span>
                              <code className="text-text-primary">{config.iconGradient}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Colors */}
              <div>
                <h5 className="font-medium mb-3 text-text-primary">Topic-Based Colors</h5>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(TOPIC_CONFIGS).map(([key, config]) => (
                    <div
                      key={key}
                      className="bg-background-base border border-border-light rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-7 h-7 rounded-lg ${config.gradient} flex items-center justify-center shadow-md`}
                        >
                          {MESSAGE_ICONS[config.icon]}
                        </div>
                        <div className="flex-1">
                          <h6 className="font-semibold text-xs text-text-primary">{config.name}</h6>
                          <code className="text-[10px] text-text-tertiary">{config.gradient}</code>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {config.keywords.slice(0, 2).map((keyword, i) => (
                          <code
                            key={i}
                            className="text-[10px] bg-background-subtle px-1.5 py-0.5 rounded text-text-secondary"
                          >
                            "{keyword}"
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-background-base border border-amber-400/20 rounded-lg">
                <p className="text-xs text-text-tertiary">
                  <strong className="text-amber-400">How to update:</strong> Edit{' '}
                  <code className="bg-background-subtle px-2 py-1 rounded">
                    lib/ui/message-ui-config.ts
                  </code>{' '}
                  to change colors, add new statuses, or modify keywords. All changes apply
                  instantly!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Components Showcase */}
        <section className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Components Gallery</h2>
              <p className="text-text-secondary">Additional UI elements and patterns</p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Cards */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Cards</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background-base border border-border-light rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-2">Standard Card</h4>
                  <p className="text-sm text-text-secondary">
                    Cards use rounded-xl and border-border-light for subtle separation.
                  </p>
                </div>
                <div className="bg-background-base border-2 border-amber-400/30 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Highlighted Card
                  </h4>
                  <p className="text-sm text-text-secondary">
                    Use golden border for emphasis or featured content.
                  </p>
                </div>
              </div>
            </div>

            {/* Alerts - Aligned with Modal Colors */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Alerts & Inline Notifications</h3>
              <p className="text-text-secondary mb-6 text-sm">
                Alerts use the same color system as modals - low opacity backgrounds with colored
                borders
              </p>

              <div className="space-y-4">
                {/* Success Alert - Green gradient icon */}
                <div className="bg-success/10 border border-success/40 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Success</h5>
                    <p className="text-sm text-text-secondary">
                      Your changes have been saved successfully.
                    </p>
                  </div>
                </div>

                {/* Error Alert - Red gradient icon */}
                <div className="bg-error/10 border border-error/40 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-error flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Error</h5>
                    <p className="text-sm text-text-secondary">
                      Something went wrong. Please try again.
                    </p>
                  </div>
                </div>

                {/* Warning Alert - Amber gradient icon */}
                <div className="bg-warning/10 border border-warning/40 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-warning flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Warning</h5>
                    <p className="text-sm text-text-secondary">
                      Please review your information before continuing.
                    </p>
                  </div>
                </div>

                {/* Information Alert - Golden gradient icon */}
                <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Information</h5>
                    <p className="text-sm text-text-secondary">
                      Here's some helpful information for you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-background-subtle rounded-lg">
                <p className="text-xs text-text-tertiary">
                  <strong className="text-amber-400">Pattern:</strong> All alerts use gradient icons
                  matching their modal counterparts + low opacity backgrounds
                </p>
              </div>
            </div>

            {/* Badges & Tags */}
            <div className="bg-background-raised border border-border-light rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Badges & Tags</h3>
              <p className="text-text-secondary mb-6 text-sm">
                Tags follow the same contextual color system as modals
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">
                    Primary & Information
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-xs font-semibold rounded-full shadow-md">
                      Primary
                    </span>
                    <span className="px-3 py-1.5 bg-amber-400/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-400/30">
                      Information
                    </span>
                    <span className="px-3 py-1.5 bg-gradient-to-br from-amber-400/20 to-yellow-600/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-400/30">
                      Featured
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Success & Product</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-success text-white text-xs font-semibold rounded-full shadow-md">
                      Success
                    </span>
                    <span className="px-3 py-1.5 bg-success/20 text-success text-xs font-semibold rounded-full border border-success">
                      Complete
                    </span>
                    <span className="px-3 py-1.5 bg-success/10 text-success text-xs font-semibold rounded-full border border-success/50">
                      Product
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Warning</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-warning text-white text-xs font-semibold rounded-full shadow-md">
                      Warning
                    </span>
                    <span className="px-3 py-1.5 bg-warning/20 text-warning text-xs font-semibold rounded-full border border-warning">
                      Pending
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Error & Analytics</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-error text-white text-xs font-semibold rounded-full shadow-md">
                      Error
                    </span>
                    <span className="px-3 py-1.5 bg-error/20 text-error text-xs font-semibold rounded-full border border-error">
                      Failed
                    </span>
                    <span className="px-3 py-1.5 bg-error/10 text-error text-xs font-semibold rounded-full border border-error/50">
                      Analytics
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Marketing (Blue)</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-blue text-white text-xs font-semibold rounded-full shadow-md">
                      Marketing
                    </span>
                    <span className="px-3 py-1.5 bg-info/20 text-info text-xs font-semibold rounded-full border border-info">
                      Info
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 text-text-tertiary">Neutral</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1.5 bg-background-subtle text-text-secondary text-xs font-semibold rounded-full border border-border-light">
                      Default
                    </span>
                    <span className="px-3 py-1.5 bg-background-subtle text-text-secondary text-xs font-semibold rounded-full">
                      No Border
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Design Guidelines */}
        <section className="scroll-mt-24">
          <div className="bg-gradient-to-br from-background-raised to-background-subtle border-2 border-amber-400/30 rounded-xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-amber-400" />
              <h2 className="text-3xl font-bold">Design Guidelines</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-success flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  Do's
                </h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>
                      Use <code className="bg-background-subtle px-1 rounded">rounded-xl</code> for
                      all buttons and cards
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>
                      Primary buttons must use golden gradient:{' '}
                      <code className="bg-background-subtle px-1 rounded">
                        from-amber-400 to-yellow-600
                      </code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>
                      Use semantic colors only for their intended purpose (success, error, etc.)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>Maintain consistent spacing using the 4px-based scale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>
                      Add subtle hover effects with{' '}
                      <code className="bg-background-subtle px-1 rounded">transition-all</code>
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-error flex items-center justify-center">
                    <X className="h-3 w-3 text-white" />
                  </div>
                  Don'ts
                </h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-error flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>
                      Don't use{' '}
                      <code className="bg-background-subtle px-1 rounded">rounded-md</code> - it's
                      too small
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-error flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>Don't use blue gradients - we're a golden brand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-error flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>
                      Avoid hardcoded colors like{' '}
                      <code className="bg-background-subtle px-1 rounded">bg-gray-800</code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-error flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>Don't mix gradient directions - stick to right or bottom-right</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gradient-error flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span>Never use primary gradient for destructive actions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-light mt-24 py-12 bg-background-raised">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm">
            Vibebaba Design System v4.0 • Golden Gradient Theme
          </p>
          <p className="text-text-tertiary text-xs mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
}

// Color Swatch Component
function ColorSwatch({
  name,
  color,
  usage,
  icon,
  showBorder = false,
  showText = false,
  onCopy,
  copied,
}: {
  name: string;
  color: string;
  usage: string;
  icon?: React.ReactNode;
  showBorder?: boolean;
  showText?: boolean;
  onCopy: (color: string, name: string) => void;
  copied: boolean;
}) {
  return (
    <div className="group cursor-pointer" onClick={() => onCopy(color, name)}>
      <div
        className={`h-24 rounded-xl mb-2 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105 ${
          showBorder ? 'border-2' : ''
        }`}
        style={{
          backgroundColor: showBorder ? 'transparent' : color,
          borderColor: showBorder ? color : 'transparent',
        }}
      >
        {icon && (
          <div
            className="opacity-50 group-hover:opacity-100 transition-opacity"
            style={{ color: showText ? color : 'white' }}
          >
            {icon}
          </div>
        )}
        {showText && (
          <span className="font-bold" style={{ color }}>
            Aa
          </span>
        )}
        {copied && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-medium">Copied!</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{name}</p>
        <code className="text-xs text-text-tertiary block">{color}</code>
        <p className="text-xs text-text-tertiary">{usage}</p>
      </div>
    </div>
  );
}
