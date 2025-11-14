import type {
  ComponentMetadata,
  TypeMetadata,
  RouteMetadata,
  ImportSpec,
  ExportSpec,
  HookMetadata,
} from './types';

/**
 * Project Registry
 * Single source of truth for all project structure information
 */
export class ProjectRegistry {
  private components: Map<string, ComponentMetadata> = new Map();
  private types: Map<string, TypeMetadata> = new Map();
  private routes: Map<string, RouteMetadata> = new Map();
  private hooks: Map<string, HookMetadata> = new Map();

  // Known external packages (for import resolution)
  private readonly KNOWN_PACKAGES = new Set([
    'react', 'react-dom', 'next', 'next/link', 'next/image', 'next/navigation',
    'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-toast',
    'zustand', 'react-hook-form', 'zod', '@hookform/resolvers/zod',
    'pocketbase', 'clsx', 'tailwind-merge'
  ]);

  // Known lucide-react icons (from component-catalog.ts)
  private readonly LUCIDE_ICONS = new Set([
    'Menu', 'X', 'Check', 'ChevronDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp',
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
    'User', 'Users', 'UserPlus', 'UserCheck', 'UserX',
    'Mail', 'Send', 'Inbox', 'MessageCircle', 'MessageSquare',
    'Lock', 'Unlock', 'Key', 'Shield', 'ShieldCheck',
    'Home', 'Search', 'Settings', 'Bell', 'Calendar',
    'Clock', 'MapPin', 'Globe', 'Link', 'ExternalLink',
    'File', 'FileText', 'Folder', 'FolderOpen', 'Upload', 'Download',
    'Image', 'Video', 'Music', 'Camera', 'Mic',
    'Heart', 'Star', 'Bookmark', 'Flag', 'Tag',
    'ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'TrendingUp',
    'Eye', 'EyeOff', 'Loader', 'Loader2', 'RefreshCw', 'RotateCw',
    'Edit', 'Edit2', 'Edit3', 'Pen', 'Pencil',
    'Trash', 'Trash2', 'Delete', 'XCircle', 'CheckCircle',
    'AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle',
    'Plus', 'Minus', 'PlusCircle', 'MinusCircle',
    'Copy', 'Clipboard', 'ClipboardCheck', 'Share', 'Share2',
    'Filter', 'SortAsc', 'SortDesc', 'Grid', 'List',
    'MoreVertical', 'MoreHorizontal', 'Maximize', 'Minimize',
    'Zap', 'Cpu', 'Database', 'Server', 'Cloud',
    'Package', 'Box', 'Archive', 'Briefcase',
    'LogIn', 'LogOut', 'UserCircle', 'Activity',
    'BarChart', 'PieChart', 'LineChart'
  ]);

  constructor() {}

  // ============================================================================
  // COMPONENT MANAGEMENT
  // ============================================================================

  registerComponent(component: ComponentMetadata): void {
    this.components.set(component.name, component);
    console.log(`[Registry] ✅ Registered component: ${component.name} (${component.path})`);
  }

  getComponent(name: string): ComponentMetadata | undefined {
    return this.components.get(name);
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  getAllComponents(): ComponentMetadata[] {
    return Array.from(this.components.values());
  }

  // ============================================================================
  // TYPE MANAGEMENT
  // ============================================================================

  registerType(type: TypeMetadata): void {
    this.types.set(type.name, type);
    console.log(`[Registry] ✅ Registered type: ${type.name} (${type.path})`);
  }

  getType(name: string): TypeMetadata | undefined {
    return this.types.get(name);
  }

  hasType(name: string): boolean {
    return this.types.has(name);
  }

  // ============================================================================
  // ROUTE MANAGEMENT
  // ============================================================================

  registerRoute(route: RouteMetadata): void {
    this.routes.set(route.path, route);
    console.log(`[Registry] ✅ Registered route: ${route.path} → ${route.file}`);
  }

  getRoute(path: string): RouteMetadata | undefined {
    return this.routes.get(path);
  }

  hasRoute(path: string): boolean {
    return this.routes.has(path);
  }

  getAllRoutes(): RouteMetadata[] {
    return Array.from(this.routes.values());
  }

  // ============================================================================
  // IMPORT RESOLUTION (THE CRITICAL PART!)
  // ============================================================================

  /**
   * Check if a name is a valid lucide-react icon
   */
  isLucideIcon(name: string): boolean {
    return this.LUCIDE_ICONS.has(name);
  }

  /**
   * Resolve where a component should be imported from
   * This is THE function that prevents import errors!
   */
  resolveImport(name: string): ImportSpec | null {
    // 1. Check if it's a registered local component
    const component = this.getComponent(name);
    if (component) {
      return {
        name,
        source: this.getImportPath(component.path),
        type: 'default',
        isLocal: true
      };
    }

    // 2. Check if it's a registered local type
    const type = this.getType(name);
    if (type && type.isExported) {
      return {
        name,
        source: this.getImportPath(type.path),
        type: 'type',
        isLocal: true
      };
    }

    // 3. Check if it's a lucide-react icon
    if (this.LUCIDE_ICONS.has(name)) {
      return {
        name,
        source: 'lucide-react',
        type: 'named',
        isLocal: false
      };
    }

    // 4. Check if it's a known external package
    const externalSource = this.resolveExternalPackage(name);
    if (externalSource) {
      return {
        name,
        source: externalSource,
        type: this.getImportType(name, externalSource),
        isLocal: false
      };
    }

    // 5. NOT FOUND
    return null;
  }

  /**
   * Get import path for a component (converts file path to import path)
   */
  private getImportPath(filePath: string): string {
    // src/components/Logo.tsx → @/components/Logo
    // src/app/page.tsx → @/app/page
    const withoutExt = filePath.replace(/\.(tsx?|jsx?)$/, '');
    if (withoutExt.startsWith('src/')) {
      return '@/' + withoutExt.substring(4);
    }
    return '@/' + withoutExt;
  }

  /**
   * Resolve which external package exports this name
   */
  private resolveExternalPackage(name: string): string | null {
    // React hooks
    if (['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef',
         'useContext', 'useReducer', 'createContext', 'forwardRef'].includes(name)) {
      return 'react';
    }

    // Next.js navigation
    if (['useRouter', 'usePathname', 'useSearchParams', 'redirect', 'notFound'].includes(name)) {
      return 'next/navigation';
    }

    // Next.js components
    if (name === 'Link') return 'next/link';
    if (name === 'Image') return 'next/image';

    // Common patterns
    if (name.startsWith('Dialog')) return '@radix-ui/react-dialog';
    if (name.startsWith('Toast')) return '@radix-ui/react-toast';

    return null;
  }

  /**
   * Determine import type (named, default, namespace)
   */
  private getImportType(name: string, source: string): 'named' | 'default' | 'namespace' {
    if (source === 'next/link' || source === 'next/image') return 'default';
    if (source.startsWith('@radix-ui')) return 'namespace';
    return 'named';
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================

  /**
   * Record that fileA imports componentB
   */
  recordUsage(consumerPath: string, componentName: string): void {
    const component = this.getComponent(componentName);
    if (component && !component.usedBy.includes(consumerPath)) {
      component.usedBy.push(consumerPath);
    }
  }

  /**
   * Get all files that use a component
   */
  getComponentUsage(componentName: string): string[] {
    return this.getComponent(componentName)?.usedBy || [];
  }

  // ============================================================================
  // DEBUGGING & INSPECTION
  // ============================================================================

  /**
   * Get full registry state for debugging
   */
  toJSON() {
    return {
      components: Array.from(this.components.entries()),
      types: Array.from(this.types.entries()),
      routes: Array.from(this.routes.entries()),
      hooks: Array.from(this.hooks.entries())
    };
  }

  /**
   * Print registry summary to console
   */
  printSummary(): void {
    console.log('[Registry] 📊 Registry Summary:');
    console.log(`[Registry]   Components: ${this.components.size}`);
    console.log(`[Registry]   Types: ${this.types.size}`);
    console.log(`[Registry]   Routes: ${this.routes.size}`);
    console.log(`[Registry]   Hooks: ${this.hooks.size}`);
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.components.clear();
    this.types.clear();
    this.routes.clear();
    this.hooks.clear();
  }
}

// Singleton instance per project
const registryStore: Map<string, ProjectRegistry> = new Map();

export function getProjectRegistry(projectId: string): ProjectRegistry {
  if (!registryStore.has(projectId)) {
    registryStore.set(projectId, new ProjectRegistry());
  }
  return registryStore.get(projectId)!;
}

export function resetProjectRegistry(projectId: string): void {
  registryStore.delete(projectId);
}
