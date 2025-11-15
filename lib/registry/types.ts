/**
 * Component Registry Types
 * Tracks all components, types, routes, and their relationships
 */

export interface ComponentMetadata {
  name: string;
  path: string;
  type: 'page' | 'component' | 'layout' | 'context' | 'hook';
  imports: ImportSpec[];
  exports: ExportSpec[];
  props?: string; // Prop type name if exists
  usedBy: string[]; // File paths that import this
  uses: string[]; // Components/hooks this imports
  createdAt: Date;
}

export interface TypeMetadata {
  name: string;
  path: string;
  kind: 'interface' | 'type' | 'enum' | 'class';
  fields?: string[];
  usedBy: string[];
  isExported: boolean;
}

export interface RouteMetadata {
  path: string; // URL path: "/", "/products", "/products/[id]"
  file: string; // File path: "src/app/page.tsx"
  components: string[]; // Components used on this page
  linkedFrom: string[]; // Which routes link to this
  isDynamic: boolean; // Is it a dynamic route like [id]?
  featureId?: string; // Which feature does this belong to?
}

export interface ImportSpec {
  name: string; // "Logo" | "Product" | "useState"
  source: string; // "lucide-react" | "@/components/Logo" | "react"
  type: 'named' | 'default' | 'namespace' | 'type';
  isLocal: boolean; // true if source starts with "./" or "@/"
}

export interface ExportSpec {
  name: string;
  type: 'named' | 'default';
  isType: boolean;
}

export interface HookMetadata {
  name: string;
  path: string;
  dependencies: string[]; // Which React hooks it uses
  usedBy: string[];
}
