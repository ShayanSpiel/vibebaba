// lib/infrastructure-templates.ts
// Infrastructure code templates for generated Next.js apps
// Includes: Zustand, React Query, React Hook Form + Zod, Radix UI

/**
 * ========================================
 * ZUSTAND STATE MANAGEMENT
 * ========================================
 */

export const zustandStoreTemplate = `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Global App State Store
 * Uses Zustand for lightweight, TypeScript-first state management
 *
 * This is a minimal template - add app-specific state as needed
 */

interface AppState {
  // UI state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Global loading and error state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        theme: 'light',
        isLoading: false,
        error: null,

        // UI actions
        setTheme: (theme) => set({ theme }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

        // App state actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null })
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          theme: state.theme
        })
      }
    )
  )
);

/**
 * Usage examples:
 *
 * // Get state
 * const theme = useStore((state) => state.theme);
 * const isLoading = useStore((state) => state.isLoading);
 *
 * // Get multiple values
 * const { theme, setTheme, error } = useStore();
 *
 * // Set state
 * const setTheme = useStore((state) => state.setTheme);
 * setTheme('dark');
 *
 * // Toggle theme
 * const toggleTheme = useStore((state) => state.toggleTheme);
 * toggleTheme();
 */
`;

/**
 * ========================================
 * REACT QUERY SETUP
 * ========================================
 */

export const queryClientTemplate = `import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Handles server state (API calls, caching, refetching)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: How long inactive data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true
    },
    mutations: {
      // Retry failed mutations once
      retry: 1
    }
  }
});

/**
 * Query Keys Factory
 * Centralized query key management for type safety
 *
 * Add your resource types here dynamically.
 * Example structure:
 *
 * export const queryKeys = {
 *   {resourceName}: {
 *     all: ['{resourceName}'] as const,
 *     lists: () => [...queryKeys.{resourceName}.all, 'list'] as const,
 *     list: (filters: string) => [...queryKeys.{resourceName}.lists(), { filters }] as const,
 *     details: () => [...queryKeys.{resourceName}.all, 'detail'] as const,
 *     detail: (id: string) => [...queryKeys.{resourceName}.details(), id] as const
 *   }
 * };
 */
export const queryKeys = {
  // Add your resource types here based on your collections
};
`;

/**
 * ========================================
 * POCKETBASE CLIENT
 * ========================================
 */

export const pocketbaseClientTemplate = `import PocketBase from 'pocketbase';

/**
 * PocketBase Client Instance
 * Configured to connect to backend API
 */

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

export const pb = new PocketBase(PB_URL);

// Enable auto-cancellation of pending requests
pb.autoCancellation(false);

/**
 * Helper to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/**
 * Helper to get current user
 */
export function getCurrentUser() {
  return pb.authStore.model;
}

/**
 * Helper to logout
 */
export function logout() {
  pb.authStore.clear();
}

/**
 * Subscribe to auth changes
 */
export function onAuthChange(callback: (user: any) => void) {
  return pb.authStore.onChange((token, model) => {
    callback(model);
  });
}
`;

/**
 * Generate API hooks dynamically based on PocketBase collections
 */
export function generateApiHooks(collections: any[]): string {
  if (!collections || collections.length === 0) {
    return `// No backend collections - API hooks not generated`;
  }

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from './pocketbase';

/**
 * Auto-generated API Hooks for PocketBase Collections
 * Using React Query for server state management
 *
 * USAGE EXAMPLES:
 *
 * // Fetch all items
 * const { data: items, isLoading } = useCollectionName();
 *
 * // Create new item
 * const createMutation = useCreateCollectionName();
 * createMutation.mutate({ field: 'value' });
 *
 * // Update item
 * const updateMutation = useUpdateCollectionName();
 * updateMutation.mutate({ id: '123', data: { field: 'newValue' } });
 *
 * // Delete item
 * const deleteMutation = useDeleteCollectionName();
 * deleteMutation.mutate('item-id');
 *
 * IMPORTANT: All hooks follow React Query patterns:
 * - useCollectionName() returns query object with { data, isLoading, error }
 * - useCr eateCollectionName() returns mutation object with { mutate, isPending, isSuccess }
 * - NO raw functions like createCollectionName() exist - use mutation.mutate() instead!
 */

${collections
  .map((collection) => {
    const collectionName = collection.name;
    const CollectionName = capitalizeFirst(collectionName);

    return `
// ========== ${collectionName.toUpperCase()} ==========

/**
 * Fetch all ${collectionName}
 */
export function use${CollectionName}() {
  return useQuery({
    queryKey: ['${collectionName}'],
    queryFn: async () => {
      const records = await pb.collection('${collectionName}').getFullList({
        sort: '-created'
      });
      return records;
    }
  });
}

/**
 * Fetch single ${collectionName} by ID
 */
export function use${CollectionName}ById(id: string) {
  return useQuery({
    queryKey: ['${collectionName}', id],
    queryFn: async () => {
      const record = await pb.collection('${collectionName}').getOne(id);
      return record;
    },
    enabled: !!id // Only run if ID is provided
  });
}

/**
 * Create new ${collectionName}
 */
export function useCreate${CollectionName}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const record = await pb.collection('${collectionName}').create(data);
      return record;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['${collectionName}'] });
    }
  });
}

/**
 * Update ${collectionName}
 */
export function useUpdate${CollectionName}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const record = await pb.collection('${collectionName}').update(id, data);
      return record;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific item and list
      queryClient.invalidateQueries({ queryKey: ['${collectionName}', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['${collectionName}'] });
    }
  });
}

/**
 * Delete ${collectionName}
 */
export function useDelete${CollectionName}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await pb.collection('${collectionName}').delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${collectionName}'] });
    }
  });
}
`;
  })
  .join('\n')}
`;
}

/**
 * ========================================
 * REACT HOOK FORM + ZOD VALIDATION
 * ========================================
 */

export const formUtilsTemplate = `import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Form Utilities with Zod Validation
 */

// ========== COMMON VALIDATION SCHEMAS ==========

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().url('Invalid URL');
export const phoneSchema = z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/, 'Invalid phone number');

// ========== FORM HELPERS ==========

/**
 * Create typed form with Zod validation
 */
export function createForm<T extends z.ZodType>(schema: T) {
  type FormData = z.infer<T>;

  return {
    useForm: (defaultValues?: Partial<FormData>) => {
      return useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as any
      });
    },
    schema
  };
}

/**
 * Form field error helper
 * Returns error message string, or null if no error
 *
 * Usage in JSX:
 * {getFieldError(errors.email) && (
 *   <span className="text-sm text-red-500 mt-1 block">
 *     {getFieldError(errors.email)}
 *   </span>
 * )}
 */
export function getFieldError(error?: { message?: string }): string | null {
  return error?.message || null;
}
`;

/**
 * ========================================
 * RADIX UI COMPONENTS
 * ========================================
 */

export const radixModalComponent = `'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-xl p-6 w-full max-w-md z-50 animate-in fade-in zoom-in duration-200">
          <Dialog.Title className="text-xl font-bold text-foreground mb-2">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-muted-foreground mb-4">
              {description}
            </Dialog.Description>
          )}
          {children}
          <Dialog.Close className="absolute top-4 right-4 p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
`;

export const radixDropdownComponent = `'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface DropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    destructive?: boolean;
    divider?: boolean;
  }>;
}

export function Dropdown({ trigger, items }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-background rounded-lg shadow-xl border border-border p-1 min-w-[200px] z-50 animate-in fade-in zoom-in duration-100"
          sideOffset={5}
        >
          {items.map((item, idx) => (
            <div key={idx}>
              {item.divider ? (
                <DropdownMenu.Separator className="h-px bg-border my-1" />
              ) : (
                <DropdownMenu.Item
                  onClick={item.onClick}
                  className={\`px-3 py-2 rounded cursor-pointer outline-none flex items-center gap-2 \${
                    item.destructive
                      ? 'text-destructive hover:bg-destructive/10'
                      : 'hover:bg-muted'
                  }\`}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenu.Item>
              )}
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
`;

export const radixSelectComponent = `'use client';

import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({ value, onValueChange, options, placeholder }: SelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="inline-flex items-center justify-between px-4 py-2 bg-background border border-border rounded-lg w-full hover:bg-muted transition-colors">
        <Select.Value placeholder={placeholder || 'Select...'} />
        <Select.Icon>
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="bg-background rounded-lg shadow-xl border border-border overflow-hidden z-50 animate-in fade-in zoom-in duration-100">
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="px-3 py-2 rounded cursor-pointer outline-none hover:bg-muted flex items-center justify-between"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
`;

export const radixToastComponent = `'use client';

import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  showToast: (toast: Omit<ToastData, 'id'>) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider>
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className={\`fixed bottom-4 right-4 bg-background rounded-lg shadow-xl border p-4 min-w-[300px] z-50 animate-in slide-in-from-right \${
              toast.type === 'success' ? 'border-success' :
              toast.type === 'error' ? 'border-destructive' :
              'border-info'
            }\`}
          >
            <Toast.Title className="font-semibold">{toast.title}</Toast.Title>
            {toast.description && (
              <Toast.Description className="text-sm text-muted-foreground mt-1">
                {toast.description}
              </Toast.Description>
            )}
            <Toast.Close className="absolute top-2 right-2">
              <X className="w-4 h-4" />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
`;

/**
 * ========================================
 * UPDATED PACKAGE.JSON
 * ========================================
 */

// ✅ FIX #4: SMART DEPENDENCY MANAGEMENT
// Only include dependencies that are actually used in the project
export interface FeatureFlags {
  hasBackend?: boolean;
  hasAuth?: boolean;
  needsForms?: boolean;
  needsModals?: boolean;
  needsDropdowns?: boolean;
  needsToasts?: boolean;
  needsStateManagement?: boolean;
}

export function generateUpdatedPackageJson(
  projectId: string,
  iconLibrary: any,
  features?: FeatureFlags
) {
  // Base dependencies (always included)
  const baseDeps: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    next: '^14.2.13',
    typescript: '^5.6.2',
    '@types/react': '^18.3.11',
    '@types/react-dom': '^18.3.0',
    '@types/node': '^22.7.5',
    tailwindcss: '^3.4.13',
    postcss: '^8.4.47',
    autoprefixer: '^10.4.20',
    [iconLibrary.package]: iconLibrary.version,
  };

  // Optional dependencies (conditionally included)
  const optionalDeps: Record<string, string> = {};

  // Backend dependencies (only if backend exists)
  if (features?.hasBackend) {
    optionalDeps['pocketbase'] = '^0.21.5';
    optionalDeps['@tanstack/react-query'] = '^5.56.2';
    optionalDeps['@tanstack/react-query-devtools'] = '^5.56.2';
  }

  // Form dependencies (only if forms are used)
  if (features?.needsForms) {
    optionalDeps['react-hook-form'] = '^7.53.0';
    optionalDeps['zod'] = '^3.23.8';
    optionalDeps['@hookform/resolvers'] = '^3.9.0';
  }

  // State management (only if complex state needs)
  if (features?.needsStateManagement) {
    optionalDeps['zustand'] = '^4.5.0';
  }

  // Radix UI primitives (only if specific components used)
  if (features?.needsModals) {
    optionalDeps['@radix-ui/react-dialog'] = '^1.1.1';
  }

  if (features?.needsDropdowns) {
    optionalDeps['@radix-ui/react-dropdown-menu'] = '^2.1.1';
    optionalDeps['@radix-ui/react-select'] = '^2.1.1';
  }

  if (features?.needsToasts) {
    optionalDeps['@radix-ui/react-toast'] = '^1.2.1';
  }

  // NextAuth dependencies (only if auth is needed)
  if (features?.hasAuth) {
    optionalDeps['next-auth'] = '^4.24.8';
    optionalDeps['bcryptjs'] = '^2.4.3';
    optionalDeps['@types/bcryptjs'] = '^2.4.6';
  }

  return {
    name: projectId,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      export: 'next build && next export',
    },
    dependencies: { ...baseDeps, ...optionalDeps },
    devDependencies: {
      eslint: '^8.57.1',
      'eslint-config-next': '^14.2.13',
    },
  };
}

/**
 * ========================================
 * THEME PROVIDER (Placeholder)
 * ========================================
 * Simple theme provider placeholder to prevent import errors
 */
export const themeProviderTemplate = `'use client'

import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Placeholder theme provider - can be extended with theme switching logic
  return <>{children}</>;
}
`;

/**
 * ========================================
 * AUTH CONTEXT (React Context API)
 * ========================================
 * Simple authentication context using React Context
 */

export const authContextTemplate = `'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Replace with your actual auth check logic
      const token = localStorage.getItem('authToken');
      if (token) {
        // Validate token with your backend
        // For now, just set a mock user
        const userData = localStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      // Replace with your actual login API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userData = { id: data.id, email: data.email, name: data.name };

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }

  async function signup(email: string, password: string, name?: string) {
    setIsLoading(true);
    try {
      // Replace with your actual signup API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      const userData = { id: data.id, email: data.email, name: data.name };

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`;
