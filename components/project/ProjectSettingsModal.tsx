'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProjectSettings } from '@/lib/contexts/ProjectSettingsContext';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  initialPrompt: string;
  stylingConfig?: any;
  onUpdateProject?: (updates: any) => void;
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  projectId,
  projectName: initialProjectName,
  initialPrompt: initialDescription,
  stylingConfig,
  onUpdateProject,
}: ProjectSettingsModalProps) {
  const [projectName, setProjectName] = useState(initialProjectName);
  const [prompt, setPrompt] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);

  // 🎯 SINGLE SOURCE OF TRUTH: Use centralized project settings context
  const { settings: projectSettings, updateSettings } = useProjectSettings();

  useEffect(() => {
    // Only load from context if modal is open
    if (!isOpen) return;

    // 🎯 Use centralized settings from context (no API call!)
    if (projectSettings) {
      console.log('[ProjectSettingsModal] ✅ Using centralized settings from context');
      setProjectName(projectSettings.projectName || initialProjectName);
      setPrompt(projectSettings.initialPrompt || initialDescription);
    } else {
      // Fallback to props if context not loaded yet
      setProjectName(initialProjectName);
      setPrompt(initialDescription);
    }
  }, [isOpen, projectSettings, initialProjectName, initialDescription]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('[Settings] Saving settings:', {
        projectId,
        projectName,
        initialPrompt: prompt,
      });

      // 🎯 SINGLE SOURCE OF TRUTH: Use centralized updateSettings from context
      await updateSettings({
        projectName: projectName,
        initialPrompt: prompt,
        stylingConfig,
      });

      console.log('[Settings] ✅ Saved to centralized context successfully');

      // Update project in database and localStorage
      if (onUpdateProject) {
        await onUpdateProject({
          description: projectName,
          userDescription: prompt,
          initialPrompt: prompt,
        });
      }

      console.log('[Settings] ✅ Updated project successfully');

      // Trigger a storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      onClose();
    } catch (error) {
      console.error('[Settings] ❌ Failed to save project settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Extract brand assets from styling config
  const brandAssets = stylingConfig?.brand;
  const colors = stylingConfig?.colorTheme;
  const enhancedColors = stylingConfig?.enhancedColors;
  const typography = stylingConfig?.typography || stylingConfig?.enhancedTypography;
  const iconography = stylingConfig?.iconography;
  const spacing = stylingConfig?.spacing;
  const components = stylingConfig?.components;

  // Debug log to see what we have
  useEffect(() => {
    if (stylingConfig) {
      console.log('[Settings Modal] Styling config keys:', Object.keys(stylingConfig));
      console.log('[Settings Modal] Has brand:', !!brandAssets);
      console.log('[Settings Modal] Has colors:', !!colors);
      console.log('[Settings Modal] Has enhancedColors:', !!enhancedColors);
      console.log('[Settings Modal] Has components:', !!components);
    } else {
      console.log('[Settings Modal] No styling config provided');
    }
  }, [stylingConfig]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background-base rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light">
          <h2 className="text-2xl font-bold text-text-primary">Project Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-subtle rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 bg-background-raised border border-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Initial Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background-raised border border-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                  placeholder="Original project description"
                />
              </div>
            </div>
          </section>

          {/* Brand Assets Section */}
          {(brandAssets || colors || typography) && (
            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Brand Assets</h3>

              {/* Brand Name & Design System */}
              {brandAssets && (
                <div className="mb-6 p-4 bg-background-raised rounded-lg border border-light">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Brand Name</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {brandAssets.brandName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Design System</p>
                      <p className="text-sm text-text-secondary">{brandAssets.designSystem}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Styling Framework</p>
                      <p className="text-sm text-text-secondary">{brandAssets.stylingFramework}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Palette */}
              {colors && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Color Palette</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {Object.entries(colors)
                      .filter(
                        ([key]) =>
                          key !== 'mode' && typeof colors[key as keyof typeof colors] === 'string'
                      )
                      .map(([name, color]) => (
                        <div key={name} className="group">
                          <div
                            className="w-full aspect-square rounded-lg mb-2 shadow-md border border-light group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: color as string }}
                            title={`${name}: ${color}`}
                          />
                          <p className="text-[10px] text-text-tertiary capitalize truncate">
                            {name}
                          </p>
                          <p className="text-[9px] text-text-tertiary/60 font-mono">
                            {(color as string).substring(0, 7)}
                          </p>
                        </div>
                      ))}
                  </div>
                  {colors.mode && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-background-subtle rounded-full">
                      <div
                        className={`w-2 h-2 rounded-full ${colors.mode === 'dark' ? 'bg-gray-800' : 'bg-yellow-400'}`}
                      />
                      <span className="text-xs text-text-secondary capitalize">
                        {colors.mode} Mode
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Semantic Colors (Enhanced) */}
              {enhancedColors?.semantic && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Semantic Colors</h4>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {Object.entries(enhancedColors.semantic).map(([name, color]) => (
                      <div
                        key={name}
                        className="flex items-center gap-2 p-2 bg-background-raised rounded border border-light"
                      >
                        <div
                          className="w-6 h-6 rounded flex-shrink-0 border border-light"
                          style={{ backgroundColor: color as string }}
                        />
                        <p className="text-[10px] text-text-tertiary truncate">
                          {name.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Typography */}
              {typography && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Typography</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-background-raised rounded-lg border border-light">
                      <p className="text-xs text-text-tertiary mb-2">Font Family</p>
                      <p
                        className="text-sm font-semibold text-text-primary"
                        style={{ fontFamily: typography.fontFamily }}
                      >
                        {typography.fontFamily}
                      </p>
                      <p className="text-2xl mt-2" style={{ fontFamily: typography.fontFamily }}>
                        Aa
                      </p>
                    </div>

                    <div className="p-4 bg-background-raised rounded-lg border border-light">
                      <p className="text-xs text-text-tertiary mb-2">Scale</p>
                      <p className="text-sm capitalize text-text-primary">{typography.scale}</p>
                      {typography.fontSizes && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs" style={{ fontSize: typography.fontSizes.sm }}>
                            Small
                          </p>
                          <p className="text-base" style={{ fontSize: typography.fontSizes.base }}>
                            Base
                          </p>
                          <p className="text-lg" style={{ fontSize: typography.fontSizes.lg }}>
                            Large
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-background-raised rounded-lg border border-light">
                      <p className="text-xs text-text-tertiary mb-2">Weights</p>
                      <div className="space-y-1">
                        {typography.headingWeight && (
                          <p className="text-sm text-text-secondary">
                            Heading: {typography.headingWeight}
                          </p>
                        )}
                        {typography.bodyWeight && (
                          <p className="text-sm text-text-secondary">
                            Body: {typography.bodyWeight}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Iconography */}
              {iconography && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Iconography</h4>
                  <div className="flex items-center gap-6 p-4 bg-background-raised rounded-lg border border-light">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Source</p>
                      <p className="text-sm capitalize text-text-primary">{iconography.source}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Style</p>
                      <p className="text-sm capitalize text-text-primary">{iconography.style}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Size</p>
                      <p className="text-sm capitalize text-text-primary">{iconography.size}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Spacing System */}
              {spacing && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Spacing System</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {spacing.layout &&
                      Object.entries(spacing.layout).map(([name, value]) => (
                        <div
                          key={name}
                          className="p-3 bg-background-raised rounded-lg border border-light"
                        >
                          <p className="text-xs text-text-tertiary mb-1 capitalize">
                            {name.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm font-mono text-text-primary">{value as string}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Component Styles Preview */}
              {components && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Component Styles</h4>
                  <div className="space-y-4">
                    {/* Button Preview */}
                    {components.button && (
                      <div>
                        <p className="text-xs text-text-tertiary mb-2">Buttons</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(components.button.variants).map(
                            ([variant, styles]: [string, any]) => (
                              <button
                                key={variant}
                                className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                                style={{
                                  backgroundColor: styles.bg,
                                  color: styles.text,
                                  border: `1px solid ${styles.border}`,
                                }}
                              >
                                {variant.charAt(0).toUpperCase() + variant.slice(1)}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Input Preview */}
                    {components.input && (
                      <div>
                        <p className="text-xs text-text-tertiary mb-2">Input Field</p>
                        <input
                          type="text"
                          placeholder="Example input"
                          className="w-full max-w-md transition-all"
                          style={{
                            backgroundColor: components.input.defaultBg,
                            border: `1px solid ${components.input.defaultBorder}`,
                            padding: components.input.padding,
                            fontSize: components.input.fontSize,
                            borderRadius: components.input.borderRadius,
                          }}
                          readOnly
                        />
                      </div>
                    )}

                    {/* Card Preview */}
                    {components.card && (
                      <div>
                        <p className="text-xs text-text-tertiary mb-2">Card</p>
                        <div
                          className="max-w-md transition-all"
                          style={{
                            backgroundColor: components.card.defaultBg,
                            border: `1px solid ${components.card.defaultBorder}`,
                            borderRadius: components.card.borderRadius,
                            padding: components.card.padding,
                            boxShadow: components.card.shadow,
                          }}
                        >
                          <h5 className="font-semibold mb-1">Card Title</h5>
                          <p className="text-sm opacity-80">
                            This is an example card component with your brand styling.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
