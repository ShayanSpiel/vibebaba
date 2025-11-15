'use client';

import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import Markdown from '@/components/Markdown';

interface PlanPreviewProps {
  plan: string;
  context?: any;
  onPlanUpdate?: (newPlan: string) => void;
}

export default function PlanPreview({ plan, context, onPlanUpdate }: PlanPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);

  const handleSave = () => {
    if (onPlanUpdate) {
      onPlanUpdate(editedPlan);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPlan(plan);
    setIsEditing(false);
  };

  // Parse color information from context - more comprehensive extraction
  const extractColors = () => {
    if (!context) return null;

    // Try multiple possible locations for color data
    const colorData = context.colors || context.palette || context.designColors || {};

    // Also check for color keywords in the plan text
    const planLower = plan.toLowerCase();
    const extractedColors: any = { ...colorData };

    // Extract colors from common patterns in the plan
    const colorPatterns = [
      { keyword: 'primary color', key: 'primary' },
      { keyword: 'secondary color', key: 'secondary' },
      { keyword: 'accent color', key: 'accent' },
      { keyword: 'background color', key: 'background' },
    ];

    colorPatterns.forEach(({ keyword, key }) => {
      if (!extractedColors[key]) {
        const regex = new RegExp(`${keyword}[:\\s]+([#a-fA-F0-9]{6}|[a-z]+)`, 'i');
        const match = plan.match(regex);
        if (match && match[1]) {
          extractedColors[key] = match[1].startsWith('#') ? match[1] : `#${match[1]}`;
        }
      }
    });

    return extractedColors;
  };

  const colors = extractColors();

  // Build color swatches array only if we have actual color data
  const colorSwatches =
    colors && Object.keys(colors).length > 0
      ? [
          colors.primary && { name: 'Primary', value: colors.primary },
          colors.secondary && { name: 'Secondary', value: colors.secondary },
          colors.accent && { name: 'Accent', value: colors.accent },
          colors.background && { name: 'Background', value: colors.background },
        ].filter(Boolean)
      : null;

  return (
    <div className="h-full flex items-start justify-center overflow-auto bg-background-base py-8 px-4">
      <div className="w-full max-w-4xl">
        {/* Header with Edit Button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">📋 Project Plan</h2>
            <p className="text-text-secondary">
              {isEditing
                ? 'Edit your application blueprint'
                : 'Review your application blueprint below'}
            </p>
          </div>

          {/* Edit/Save/Cancel Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2.5 rounded-lg bg-background-raised border border-light hover:bg-background-overlay hover:border-amber-400 transition-all group"
                title="Edit Plan"
              >
                <Pencil className="w-5 h-5 text-text-secondary group-hover:text-amber-500 transition-colors" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-md"
                  title="Save Changes"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-lg bg-background-raised border border-light text-text-secondary hover:bg-background-overlay hover:text-text-primary transition-all flex items-center gap-2"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                  <span className="text-sm font-medium">Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Color Swatches - Only show if we have actual colors */}
        {!isEditing && colorSwatches && colorSwatches.length > 0 && (
          <div className="mb-6 p-4 bg-background-raised border border-light rounded-xl">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-semibold text-text-secondary">Color Palette:</span>
              {colorSwatches.map((swatch: any) => (
                <div key={swatch.name} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg shadow-md border-2 border-white/50"
                    style={{ backgroundColor: swatch.value }}
                    title={swatch.value}
                  />
                  <span className="text-xs font-medium text-text-secondary">{swatch.name}</span>
                </div>
              ))}

              {/* Design Style Badge */}
              {context?.designStyle && (
                <div className="ml-auto">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    {context.designStyle.charAt(0).toUpperCase() + context.designStyle.slice(1)}{' '}
                    Style
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Design Info - Show even without color swatches */}
        {!isEditing && context && !colorSwatches && (
          <div className="mb-6 p-4 bg-background-raised border border-light rounded-xl">
            <div className="flex items-center gap-4 flex-wrap">
              {/* App Type Badge */}
              {context.appType && (
                <div>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    {context.appType
                      .split('-')
                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </span>
                </div>
              )}

              {/* Design Style Badge */}
              {context.designStyle && (
                <div>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    {context.designStyle.charAt(0).toUpperCase() + context.designStyle.slice(1)}{' '}
                    Style
                  </span>
                </div>
              )}

              {/* Complexity Badge */}
              {context.complexity && (
                <div>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {context.complexity.charAt(0).toUpperCase() + context.complexity.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plan Content */}
        <div className="border border-light rounded-xl bg-background-raised shadow-sm overflow-hidden max-h-[calc(100vh-16rem)]">
          {isEditing ? (
            <div className="p-6">
              <textarea
                value={editedPlan}
                onChange={(e) => setEditedPlan(e.target.value)}
                className="w-full h-[60vh] px-4 py-3 bg-background-base border border-light rounded-lg text-base text-text-primary font-mono resize-none focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="Enter your plan here..."
              />
            </div>
          ) : (
            <div className="p-8 overflow-auto max-h-[calc(100vh-20rem)]">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <style jsx>{`
                  .prose {
                    color: var(--color-text-primary);
                  }
                  .prose h1 {
                    font-size: 2em;
                    font-weight: 800;
                    margin-top: 0;
                    margin-bottom: 1rem;
                    color: var(--color-text-primary);
                    border-bottom: 2px solid var(--color-border-light);
                    padding-bottom: 0.5rem;
                  }
                  .prose h2 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 0.75rem;
                    color: var(--color-text-primary);
                    border-left: 4px solid #F59E0B;
                    padding-left: 0.75rem;
                  }
                  .prose h3 {
                    font-size: 1.25em;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: var(--color-text-secondary);
                  }
                  .prose p {
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                    line-height: 1.75;
                    color: var(--color-text-primary);
                  }
                  .prose ul, .prose ol {
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    padding-left: 1.5rem;
                  }
                  .prose li {
                    margin-top: 0.25rem;
                    margin-bottom: 0.25rem;
                    color: var(--color-text-primary);
                  }
                  .prose li::marker {
                    color: #F59E0B;
                  }
                  .prose strong {
                    font-weight: 700;
                    color: var(--color-text-primary);
                  }
                  .prose code {
                    background-color: var(--color-background-overlay);
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                    font-family: 'Courier New', monospace;
                    color: #F59E0B;
                  }
                  .prose blockquote {
                    border-left: 4px solid #F59E0B;
                    padding-left: 1rem;
                    font-style: italic;
                    color: var(--color-text-secondary);
                    margin: 1rem 0;
                  }
                  .prose hr {
                    border-color: var(--color-border-light);
                    margin: 2rem 0;
                  }
                `}</style>
                <Markdown content={plan} />
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        {!isEditing && (
          <div className="mt-4 text-center">
            <p className="text-xs text-text-tertiary">
              Click the edit icon to modify the plan or proceed to building
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
