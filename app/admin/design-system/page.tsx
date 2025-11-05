'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Check,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import * as allThemes from '@/lib/theme/theme-config';

interface ThemeInfo {
  id: string;
  name: string;
  isActive: boolean;
  isCustom: boolean;
  colors?: any;
}

export default function DesignSystemPage() {
  const [activeTheme, setActiveTheme] = useState<string>('warmOrangeTheme');
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Load themes on mount
  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/theme');
      const data = await response.json();

      if (data.success) {
        setActiveTheme(data.activeTheme);

        // Map default themes
        const defaultThemes: ThemeInfo[] = data.availableThemes.map((id: string) => ({
          id,
          name: (allThemes as any)[id]?.name || id,
          isActive: id === data.activeTheme,
          isCustom: false,
        }));

        // Map custom themes
        const customThemes: ThemeInfo[] = (data.customThemes || []).map((theme: any) => ({
          id: theme.id,
          name: theme.name,
          isActive: theme.id === data.activeTheme,
          isCustom: true,
          colors: theme.colors,
        }));

        setThemes([...defaultThemes, ...customThemes]);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTheme = async (themeName: string) => {
    setSwitching(true);
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch',
          themeName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update active theme in state
        setActiveTheme(themeName);
        setThemes((prev) =>
          prev.map((t) => ({
            ...t,
            isActive: t.id === themeName,
          }))
        );

        // Apply theme immediately without reload
        const theme = (allThemes as any)[themeName];
        if (theme) {
          applyThemeToDOM(theme);
        }

        // Show success message
        alert(`Theme switched to ${data.activeTheme}. Refresh the page to see changes across the entire app.`);
      } else {
        alert('Failed to switch theme: ' + data.error);
      }
    } catch (error) {
      console.error('Error switching theme:', error);
      alert('Failed to switch theme');
    } finally {
      setSwitching(false);
    }
  };

  const deleteTheme = async (themeName: string) => {
    if (!confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          themeName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Theme deleted successfully');
        loadThemes();
      } else {
        alert('Failed to delete theme: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Failed to delete theme');
    }
  };

  const previewThemeColors = (themeName: string) => {
    setPreviewTheme(themeName);
    const theme = (allThemes as any)[themeName];
    if (theme) {
      applyThemeToDOM(theme);
    }
  };

  const cancelPreview = () => {
    setPreviewTheme(null);
    // Revert to active theme
    const theme = (allThemes as any)[activeTheme];
    if (theme) {
      applyThemeToDOM(theme);
    }
  };

  const applyThemeToDOM = (theme: any) => {
    const cssVars = allThemes.getThemeCSSVariables(theme);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  };

  const exportTheme = (theme: ThemeInfo) => {
    const themeData = theme.colors || (allThemes as any)[theme.id]?.colors;
    if (!themeData) return;

    const exportData = {
      name: theme.name,
      colors: themeData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const content = await file.text();
        const themeData = JSON.parse(content);

        // Validate theme structure
        if (!themeData.name || !themeData.colors) {
          alert('Invalid theme file structure');
          return;
        }

        // Generate theme ID from name
        const themeId = themeData.name.replace(/\s+/g, '') + 'Theme';

        // Add theme via API
        const response = await fetch('/api/admin/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add',
            themeName: themeId,
            themeData,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert('Theme imported successfully! Refresh the page to use it.');
          loadThemes();
        } else {
          alert('Failed to import theme: ' + data.error);
        }
      } catch (error) {
        console.error('Error importing theme:', error);
        alert('Failed to import theme');
      }
    };
    input.click();
  };

  const getThemeColors = (theme: ThemeInfo) => {
    if (theme.colors) return theme.colors;
    const themeObj = (allThemes as any)[theme.id];
    return themeObj?.colors || {};
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design System</h1>
          <p className="text-text-secondary mt-1">
            Manage and customize your application's color themes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={importTheme} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Theme
          </Button>
          <Button onClick={() => setShowAddTheme(!showAddTheme)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Theme
          </Button>
        </div>
      </div>

      {/* Preview Banner */}
      {previewTheme && (
        <Card className="border-info bg-info/10">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-info" />
              <span className="font-medium">
                Previewing: {themes.find((t) => t.id === previewTheme)?.name}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelPreview}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  switchTheme(previewTheme);
                  setPreviewTheme(null);
                }}
              >
                Apply Theme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Active Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Active Theme
          </CardTitle>
          <CardDescription>Currently applied across the entire application</CardDescription>
        </CardHeader>
        <CardContent>
          {themes
            .filter((t) => t.isActive)
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                colors={getThemeColors(theme)}
                isActive
                onPreview={() => {}}
                onSwitch={() => {}}
                onDelete={() => {}}
                onExport={() => exportTheme(theme)}
              />
            ))}
        </CardContent>
      </Card>

      {/* Available Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Available Themes</CardTitle>
          <CardDescription>Click on a theme to preview or switch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes
              .filter((t) => !t.isActive)
              .map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  colors={getThemeColors(theme)}
                  isActive={false}
                  onPreview={() => previewThemeColors(theme.id)}
                  onSwitch={() => switchTheme(theme.id)}
                  onDelete={() => deleteTheme(theme.id)}
                  onExport={() => exportTheme(theme)}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Theme Form */}
      {showAddTheme && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Theme</CardTitle>
            <CardDescription>
              Design your own color palette for the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomThemeForm
              onCancel={() => setShowAddTheme(false)}
              onSuccess={() => {
                setShowAddTheme(false);
                loadThemes();
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ThemeCardProps {
  theme: ThemeInfo;
  colors: any;
  isActive: boolean;
  onPreview: () => void;
  onSwitch: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function ThemeCard({ theme, colors, isActive, onPreview, onSwitch, onDelete, onExport }: ThemeCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <h3 className="font-semibold">{theme.name}</h3>
          {isActive && <Badge variant="default">Active</Badge>}
          {theme.isCustom && <Badge variant="outline">Custom</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Color Preview */}
      <div className="grid grid-cols-5 gap-2">
        <ColorSwatch color={colors.brandPrimary} label="Primary" />
        <ColorSwatch color={colors.accentDefault} label="Accent" />
        <ColorSwatch color={colors.backgroundBase} label="BG" />
        <ColorSwatch color={colors.textPrimary} label="Text" />
        <ColorSwatch color={colors.success} label="Success" />
      </div>

      {/* Actions */}
      {!isActive && (
        <div className="flex gap-2">
          <Button onClick={onPreview} variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={onSwitch} size="sm" className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Apply
          </Button>
          {theme.isCustom && (
            <Button onClick={onDelete} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full h-12 rounded border"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

function CustomThemeForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [themeName, setThemeName] = useState('');
  const [colors, setColors] = useState({
    brandPrimary: '#3B82F6',
    brandPrimaryHover: '#2563EB',
    brandPrimaryLight: '#60A5FA',
    brandPrimaryPale: '#DBEAFE',
    brandPrimarySubtle: '#EFF6FF',
    accentDefault: '#8B5CF6',
    accentLight: '#A78BFA',
    accentPale: '#EDE9FE',
    accentHover: '#7C3AED',
    backgroundBase: '#FFFFFF',
    backgroundRaised: '#F9FAFB',
    backgroundOverlay: '#F3F4F6',
    backgroundSunken: '#E5E7EB',
    backgroundSubtle: '#D1D5DB',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6B7280',
    textSubtle: '#9CA3AF',
    textInverse: '#FFFFFF',
    borderSubtle: '#F3F4F6',
    borderLight: '#E5E7EB',
    borderDefault: '#D1D5DB',
    borderStrong: '#9CA3AF',
    borderFocus: '#3B82F6',
    borderFocusLight: '#60A5FA',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const themeId = themeName.replace(/\s+/g, '') + 'Theme';

    try {
      const response = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          themeName: themeId,
          themeData: {
            name: themeName,
            colors,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Theme created successfully! Refresh the page to use it.');
        onSuccess();
      } else {
        alert('Failed to create theme: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating theme:', error);
      alert('Failed to create theme');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Theme Name</label>
        <Input
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          placeholder="My Custom Theme"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorInput
          label="Brand Primary"
          value={colors.brandPrimary}
          onChange={(value) => setColors({ ...colors, brandPrimary: value })}
        />
        <ColorInput
          label="Brand Primary Hover"
          value={colors.brandPrimaryHover}
          onChange={(value) => setColors({ ...colors, brandPrimaryHover: value })}
        />
        <ColorInput
          label="Accent Default"
          value={colors.accentDefault}
          onChange={(value) => setColors({ ...colors, accentDefault: value })}
        />
        <ColorInput
          label="Background Base"
          value={colors.backgroundBase}
          onChange={(value) => setColors({ ...colors, backgroundBase: value })}
        />
        <ColorInput
          label="Text Primary"
          value={colors.textPrimary}
          onChange={(value) => setColors({ ...colors, textPrimary: value })}
        />
        <ColorInput
          label="Success"
          value={colors.success}
          onChange={(value) => setColors({ ...colors, success: value })}
        />
      </div>

      <div className="text-sm text-text-secondary">
        Only key colors are shown here. The theme will use intelligent defaults for other colors.
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Theme</Button>
      </div>
    </form>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 rounded border cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  );
}
