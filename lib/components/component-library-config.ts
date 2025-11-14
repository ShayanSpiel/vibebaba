/**
 * Component Library Configuration
 * Manages which component libraries are active and their priorities
 */

export interface ComponentLibrary {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  categories: string[];
}

export const COMPONENT_LIBRARIES: ComponentLibrary[] = [
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    priority: 1,
    enabled: true,
    categories: ['forms', 'buttons', 'modals', 'cards'],
  },
  {
    id: 'custom',
    name: 'Custom Components',
    priority: 2,
    enabled: true,
    categories: ['chat', 'project', 'admin'],
  },
];

export const PRESETS = {
  minimal: {
    name: 'Minimal',
    libraries: ['shadcn'],
  },
  full: {
    name: 'Full Stack',
    libraries: ['shadcn', 'custom'],
  },
};

export function getActiveLibraries(): ComponentLibrary[] {
  return COMPONENT_LIBRARIES.filter(lib => lib.enabled);
}

export function getConfigSummary() {
  const active = getActiveLibraries();
  return {
    totalLibraries: COMPONENT_LIBRARIES.length,
    activeLibraries: active.length,
    categories: Array.from(new Set(active.flatMap(lib => lib.categories))),
  };
}

export function toggleLibrary(libraryId: string, enabled: boolean) {
  const library = COMPONENT_LIBRARIES.find(lib => lib.id === libraryId);
  if (library) {
    library.enabled = enabled;
  }
}

export function toggleLibraryCategory(libraryId: string, category: string, enabled: boolean) {
  const library = COMPONENT_LIBRARIES.find(lib => lib.id === libraryId);
  if (library) {
    if (enabled && !library.categories.includes(category)) {
      library.categories.push(category);
    } else if (!enabled) {
      library.categories = library.categories.filter(c => c !== category);
    }
  }
}

export function applyPreset(presetKey: keyof typeof PRESETS) {
  const preset = PRESETS[presetKey];
  COMPONENT_LIBRARIES.forEach(lib => {
    lib.enabled = preset.libraries.includes(lib.id);
  });
}
