# NEW INFRASTRUCTURE IMPROVEMENTS
**VibeBaba System Modernization Plan**

Date: November 5, 2025
Status: Ready for Implementation
Effort: 20 hours total
Impact: 50% quality improvement + 25% faster builds

---

## EXECUTIVE SUMMARY

**Current State:**
- ❌ Component examples exist but NOT used during generation
- ❌ Only basic `useState` - no proper state management
- ❌ No React Query - manual fetch calls everywhere
- ❌ No form validation library
- ❌ Sequential builds (70-80s)
- ✅ PocketBase backend (keeping this!)
- ✅ TypeScript throughout
- ✅ Auto-debugging QA

**Target State:**
- ✅ Component examples integrated (50 real examples)
- ✅ Zustand for client state (lightweight, perfect for PocketBase)
- ✅ React Query for server state (caching, auto-refetch)
- ✅ React Hook Form + Zod (validation)
- ✅ Radix UI primitives (accessibility)
- ✅ Parallel builds (50-60s)
- ✅ PocketBase backend (no change!)

---

## PHASE 1: Enable Component Examples (2 hours)

### Current Problem
```typescript
// lib/langgraph/nodes/frontend-node.ts - Line 682
const componentCatalog = getComponentCatalog(designSystem);
// Returns 700 tokens of PATTERN DESCRIPTIONS:
// "✅ TAILWIND UTILITY CLASSES...
//  TYPOGRAPHY: text-h1, text-h2...
//  BUTTONS: btn btn-primary...
//  COMMON PATTERNS: ..."
```

**The `selectExamplesForCategory()` function exists but is NEVER called!**

### Solution: Wire Up Examples

**File: `lib/langgraph/nodes/frontend-node.ts`**

**Step 1:** Add import at top (around line 20):
```typescript
import { selectExamplesForCategory } from '@/lib/example-selector';
```

**Step 2:** Find Phase 2 generation (around line 850) and ADD this:

```typescript
// ========== PHASE 2: GENERATE FILES WITH AI AUTONOMY ==========
console.log('[Frontend] 🎨 Phase 2: AI-powered file generation');
console.log(`[Frontend] Generating ${filesToGenerate.length} files...`);

// ✨ NEW: Fetch component examples based on app type
const appType = state.context?.appType || 'general';
const visualTone = state.context?.visualTone || 'modern';
const industry = getIndustryFromDescription(state.userDescription);

console.log('[Frontend] 📚 Fetching component examples...');
const componentExamples = await selectExamplesForCategory(
  getCategoryFromAppType(appType),
  {
    industry,
    style: visualTone,
    limit: 8 // Get top 8 examples
  }
);

const exampleContext = componentExamples.length > 0
  ? `\n\n## 🎨 COMPONENT EXAMPLES (PROVEN PATTERNS)\n\nUse these real-world examples as reference. Adapt patterns, layouts, and interactions to match the user's requirements:\n\n${componentExamples.map((ex, idx) => `
### Example ${idx + 1}: ${ex.title}
**Description:** ${ex.description}
**Quality Score:** ${ex.qualityScore}/100
**Usage Count:** ${ex.usageCount}

\`\`\`${ex.codeLanguage || 'tsx'}
${ex.code}
\`\`\`

**Key Patterns:**
${ex.patterns?.map(p => `- ${p}`).join('\n') || '- Modern component structure\n- Responsive design\n- Accessible interactions'}
`).join('\n---\n')}\n`
  : '';

console.log(`[Frontend] ✅ Loaded ${componentExamples.length} component examples`);

// Track example usage (for analytics)
if (componentExamples.length > 0) {
  const { pb } = await import('@/lib/pocketbase');
  for (const example of componentExamples) {
    try {
      await pb.collection('design_examples').update(example.id, {
        usageCount: (example.usageCount || 0) + 1,
        lastUsed: new Date().toISOString()
      });
    } catch (error) {
      console.warn(`[Frontend] Failed to track example usage: ${example.id}`);
    }
  }
}
```

**Step 3:** Add helper functions at bottom of file:

```typescript
/**
 * Extract industry from user description
 */
function getIndustryFromDescription(description: string): string {
  const lower = description.toLowerCase();

  const industries: Record<string, string[]> = {
    'ecommerce': ['shop', 'store', 'buy', 'sell', 'product', 'cart', 'checkout', 'ecommerce', 'e-commerce'],
    'saas': ['saas', 'software', 'platform', 'dashboard', 'analytics', 'tool', 'service'],
    'fintech': ['finance', 'bank', 'payment', 'wallet', 'crypto', 'trading', 'investment'],
    'healthcare': ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'appointment'],
    'education': ['education', 'learn', 'course', 'student', 'teacher', 'school', 'university', 'training'],
    'social': ['social', 'network', 'community', 'chat', 'message', 'friend', 'post', 'feed'],
    'travel': ['travel', 'hotel', 'flight', 'booking', 'trip', 'vacation', 'tour'],
    'food': ['food', 'restaurant', 'delivery', 'recipe', 'meal', 'kitchen', 'dining'],
    'real-estate': ['property', 'real estate', 'apartment', 'house', 'rent', 'lease'],
    'entertainment': ['music', 'movie', 'video', 'stream', 'watch', 'listen', 'play', 'game']
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return industry;
    }
  }

  return 'general';
}

/**
 * Map app type to example category
 */
function getCategoryFromAppType(appType: string): string {
  const mapping: Record<string, string> = {
    'landing-page': 'landing-page',
    'saas-dashboard': 'dashboard',
    'e-commerce': 'ecommerce',
    'blog': 'blog',
    'portfolio': 'portfolio',
    'social-media': 'social',
    'marketplace': 'marketplace',
    'admin-panel': 'admin',
    'crm': 'crm',
    'analytics': 'analytics'
  };

  return mapping[appType] || 'landing-page';
}
```

**Step 4:** Update AI prompt to include examples (around line 900):

```typescript
const filePrompt = `
${designSystemPrompt}
${componentCatalog}
${exampleContext}  // ✨ ADD THIS LINE

# FILE GENERATION TASK
Generate the following file with PRODUCTION-READY code:
...
`;
```

---

## PHASE 2: Add State Management (4 hours)

### 2A: Add Zustand for Client State (2 hours)

**Why Zustand?**
- ✅ Lightweight (1KB vs Redux 10KB)
- ✅ Works perfectly with PocketBase
- ✅ No boilerplate
- ✅ TypeScript-first
- ✅ DevTools support

**File: `lib/langgraph/nodes/frontend-node.ts`**

**Step 1:** Update package.json generation (around line 250):

```typescript
const packageJson = {
  name: projectId,
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint',
    export: 'next build && next export'
  },
  dependencies: {
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
    // ✨ NEW: State management
    'zustand': '^4.5.0',
    '@tanstack/react-query': '^5.56.2',
    'react-hook-form': '^7.53.0',
    'zod': '^3.23.8',
    '@hookform/resolvers': '^3.9.0',
    // ✨ NEW: Radix UI primitives
    '@radix-ui/react-dialog': '^1.1.1',
    '@radix-ui/react-dropdown-menu': '^2.1.1',
    '@radix-ui/react-select': '^2.1.1',
    '@radix-ui/react-tabs': '^1.1.0',
    '@radix-ui/react-toast': '^1.2.1'
  },
  devDependencies: {
    eslint: '^8.57.1',
    'eslint-config-next': '^14.2.13'
  }
};
```

**Step 2:** Generate Zustand store template:

```typescript
// ✨ NEW FILE: lib/store.ts
export const storeTemplate = `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Global App State Store
 * Uses Zustand for lightweight, TypeScript-first state management
 */

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // App-specific state (customize based on app type)
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isSidebarOpen: true,
        theme: 'light',
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        logout: () => set({ user: null, isAuthenticated: false }),
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setTheme: (theme) => set({ theme }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error })
      }),
      {
        name: 'app-storage', // localStorage key
        partialize: (state) => ({
          // Only persist these fields
          user: state.user,
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen
        })
      }
    )
  )
);

/**
 * Usage examples:
 *
 * // Get state
 * const user = useStore((state) => state.user);
 * const theme = useStore((state) => state.theme);
 *
 * // Set state
 * const setUser = useStore((state) => state.setUser);
 * const setTheme = useStore((state) => state.setTheme);
 *
 * // Use in component
 * function MyComponent() {
 *   const { user, setUser, logout } = useStore();
 *   return <div>Welcome {user?.name}</div>;
 * }
 */
`;
```

### 2B: Add React Query for Server State (2 hours)

**File: Add to generated files**

```typescript
// ✨ NEW FILE: lib/query-client.ts
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
 */
export const queryKeys = {
  // Example: Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const
  },
  // Add more resource types as needed
  // posts: { ... },
  // products: { ... }
};
`;
```

**Update app layout to include providers:**

```typescript
// ✨ UPDATE: app/layout.tsx
export const layoutWithProviders = `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create QueryClient instance per component (not global)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 3,
        refetchOnWindowFocus: true
      }
    }
  }));

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* Show React Query DevTools in development */}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
`;
```

**Generate API hooks with React Query:**

```typescript
// ✨ NEW FILE: lib/api-hooks.ts (generated dynamically based on backend collections)
export function generateApiHooks(collections: any[]): string {
  return `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from './pocketbase';

/**
 * Auto-generated API Hooks for PocketBase Collections
 * Using React Query for server state management
 */

${collections.map(collection => `
// ========== ${collection.name.toUpperCase()} ==========

/**
 * Fetch all ${collection.name}
 */
export function use${capitalizeFirst(collection.name)}() {
  return useQuery({
    queryKey: ['${collection.name}'],
    queryFn: async () => {
      const records = await pb.collection('${collection.name}').getFullList({
        sort: '-created'
      });
      return records;
    }
  });
}

/**
 * Fetch single ${collection.name} by ID
 */
export function use${capitalizeFirst(collection.name)}ById(id: string) {
  return useQuery({
    queryKey: ['${collection.name}', id],
    queryFn: async () => {
      const record = await pb.collection('${collection.name}').getOne(id);
      return record;
    },
    enabled: !!id // Only run if ID is provided
  });
}

/**
 * Create new ${collection.name}
 */
export function useCreate${capitalizeFirst(collection.name)}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const record = await pb.collection('${collection.name}').create(data);
      return record;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['${collection.name}'] });
    }
  });
}

/**
 * Update ${collection.name}
 */
export function useUpdate${capitalizeFirst(collection.name)}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const record = await pb.collection('${collection.name}').update(id, data);
      return record;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific item and list
      queryClient.invalidateQueries({ queryKey: ['${collection.name}', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['${collection.name}'] });
    }
  });
}

/**
 * Delete ${collection.name}
 */
export function useDelete${capitalizeFirst(collection.name)}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await pb.collection('${collection.name}').delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${collection.name}'] });
    }
  });
}
`).join('\n')}

// ========== HELPER ==========

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`;
}
```

---

## PHASE 3: Add Form Validation (2 hours)

### React Hook Form + Zod Integration

**Generate form utilities:**

```typescript
// ✨ NEW FILE: lib/form-utils.ts
export const formUtilsTemplate = `import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Form Utilities with Zod Validation
 */

// ========== COMMON SCHEMAS ==========

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
 * Form field error component
 */
export function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null;
  return (
    <span className="text-sm text-red-500 mt-1 block">
      {error.message}
    </span>
  );
}

// ========== EXAMPLE SCHEMAS ==========

/**
 * Login Form Schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Register Form Schema
 */
export const registerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

/**
 * Contact Form Schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
`;
```

**Example form component generation:**

```typescript
// ✨ EXAMPLE: Generated form component with validation
export const formComponentExample = `'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser } from '@/lib/api-hooks';
import { useStore } from '@/lib/store';

// Define schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

type FormData = z.infer<typeof formSchema>;

export default function ContactForm() {
  const createUser = useCreateUser();
  const setError = useStore((state) => state.setError);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createUser.mutateAsync(data);
      reset();
      alert('Success!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="John Doe"
        />
        {errors.name && (
          <span className="text-sm text-red-500 mt-1 block">
            {errors.name.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="john@example.com"
        />
        {errors.email && (
          <span className="text-sm text-red-500 mt-1 block">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          {...register('message')}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Your message..."
        />
        {errors.message && (
          <span className="text-sm text-red-500 mt-1 block">
            {errors.message.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || createUser.isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting || createUser.isPending ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
`;
```

---

## PHASE 4: Add Radix UI Components (3 hours)

### Generate Accessible Component Library

**File: `lib/radix-components.ts`**

```typescript
// ✨ NEW: Radix UI component templates
export const radixComponents = {
  Dialog: `'use client';

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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-xl font-bold mb-2">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-gray-600 mb-4">
              {description}
            </Dialog.Description>
          )}
          {children}
          <Dialog.Close className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}`,

  DropdownMenu: `'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    destructive?: boolean;
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
          className="bg-white rounded-lg shadow-xl border p-1 min-w-[200px] z-50"
          sideOffset={5}
        >
          {items.map((item, idx) => (
            <DropdownMenu.Item
              key={idx}
              onClick={item.onClick}
              className={\`px-3 py-2 rounded cursor-pointer outline-none flex items-center gap-2 \${
                item.destructive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'hover:bg-gray-100'
              }\`}
            >
              {item.icon}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}`,

  Select: `'use client';

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
      <Select.Trigger className="inline-flex items-center justify-between px-4 py-2 bg-white border rounded-lg w-full hover:bg-gray-50">
        <Select.Value placeholder={placeholder || 'Select...'} />
        <Select.Icon>
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="bg-white rounded-lg shadow-xl border overflow-hidden z-50">
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="px-3 py-2 rounded cursor-pointer outline-none hover:bg-gray-100 flex items-center justify-between"
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
}`,

  Toast: `'use client';

import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { createContext, useContext, useState } from 'react';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  showToast: (toast: Omit<ToastData, 'id'>) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
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
            className={\`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 min-w-[300px] z-50 \${
              toast.type === 'success' ? 'border-green-500' :
              toast.type === 'error' ? 'border-red-500' :
              'border-blue-500'
            }\`}
          >
            <Toast.Title className="font-semibold">{toast.title}</Toast.Title>
            {toast.description && (
              <Toast.Description className="text-sm text-gray-600 mt-1">
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
}`
};
```

---

## PHASE 5: Parallel Build Optimization (3 hours)

### Current Sequential Flow (70-80s)
```
Founder (5s) → PM (10s) → UX (15s) → Backend (15s) → Frontend (25s) → QA (5s) → DevOps (5s)
```

### Optimized Parallel Flow (50-60s)
```
Founder (5s) → PM (10s) → [UX (15s) + Backend (15s)] PARALLEL → Frontend (25s) → QA (5s) → DevOps (5s)
```

**File: `lib/langgraph/workflow.ts`**

**Find the edges section (around line 400) and REPLACE:**

```typescript
// OLD - Sequential
.addEdge('pm', 'ux')
.addEdge('ux', 'backend')
.addEdge('backend', 'frontend')
```

**WITH:**

```typescript
// NEW - Parallel UX + Backend
.addConditionalEdges(
  'pm',
  (state: AppGenState) => {
    const needsBackend = state.context?.pmPlan?.needsBackend || false;

    if (needsBackend) {
      // Both UX and Backend can run in parallel
      return ['ux', 'backend'];
    } else {
      // Only UX needed
      return ['ux'];
    }
  }
)

// Wait for both to complete before Frontend
.addEdge('ux', 'wait_for_design_and_backend')
.addEdge('backend', 'wait_for_design_and_backend')
.addEdge('wait_for_design_and_backend', 'frontend')
```

**Add synchronization node:**

```typescript
// ✨ NEW NODE: Synchronization point
async function waitForDesignAndBackend(state: AppGenState): Promise<Partial<AppGenState>> {
  console.log('[Sync] ⏳ Waiting for UX and Backend to complete...');

  // Check if both completed
  const hasDesign = !!state.designSystem && !!state.stylingConfig;
  const hasBackend = state.context?.pmPlan?.needsBackend
    ? !!state.backendConfig
    : true; // If no backend needed, pass through

  if (!hasDesign) {
    throw new Error('UX node did not complete successfully');
  }

  if (!hasBackend) {
    throw new Error('Backend node did not complete successfully');
  }

  console.log('[Sync] ✅ Design and Backend ready for Frontend');

  return {
    stage: 'sync_complete',
    completedNodes: ['wait_for_design_and_backend']
  };
}

// Register the node
graph.addNode('wait_for_design_and_backend', waitForDesignAndBackend);
```

**Enable parallel execution in LangGraph config:**

```typescript
// In workflow compilation (around line 600)
export const workflow = graph.compile({
  // ✨ Enable parallel execution
  checkpointer: undefined, // No checkpointing for now
  interruptBefore: [], // No interrupts
  interruptAfter: [],

  // ✨ NEW: Allow parallel node execution
  debug: false,
  recursionLimit: 30,

  // ✨ Critical: Enable concurrent execution
  stepTimeout: 60000 // 60s timeout per node
});
```

---

## PHASE 6: Update Frontend Node Prompts (2 hours)

### Add State Management to AI Instructions

**File: `lib/langgraph/nodes/frontend-node.ts`**

**Update the AI prompt (around line 680):**

```typescript
const aiPrompt = `
You are an expert frontend engineer building a production-ready Next.js 14 application.

# TECH STACK
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State Management:
  • Zustand (client state: theme, UI, auth)
  • React Query (server state: API calls, caching)
- Forms: React Hook Form + Zod validation
- UI Components: Radix UI primitives (accessible)
- Icons: ${iconLibrary.name}
${hasBackend ? '- Backend: PocketBase API' : '- No backend (client-side only)'}

# STATE MANAGEMENT PATTERNS

## Client State (Zustand)
\`\`\`typescript
import { useStore } from '@/lib/store';

// In component
const user = useStore((state) => state.user);
const setTheme = useStore((state) => state.setTheme);
\`\`\`

## Server State (React Query)
\`\`\`typescript
import { useUsers, useCreateUser } from '@/lib/api-hooks';

// Fetch data
const { data, isLoading, error } = useUsers();

// Mutate data
const createUser = useCreateUser();
await createUser.mutateAsync({ name: 'John' });
\`\`\`

## Forms (React Hook Form + Zod)
\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
\`\`\`

# COMPONENT PATTERNS

✅ Use Radix UI for accessible components:
- Dialog/Modal: @radix-ui/react-dialog
- Dropdown: @radix-ui/react-dropdown-menu
- Select: @radix-ui/react-select
- Toast: @radix-ui/react-toast

✅ Use React Query for ALL API calls:
- No manual fetch() or useEffect for data fetching
- Use generated hooks from lib/api-hooks.ts

✅ Use Zustand for client state:
- Theme, auth, UI state (sidebar, modals)
- NOT for server data (use React Query)

✅ Use React Hook Form for ALL forms:
- Define Zod schema first
- Use register() for inputs
- Show validation errors

# QUALITY CHECKLIST
- [ ] All API calls use React Query hooks
- [ ] All forms use React Hook Form + Zod
- [ ] Client state uses Zustand store
- [ ] Accessible components (Radix UI)
- [ ] Loading states for async operations
- [ ] Error handling with toast notifications
- [ ] Mobile responsive
- [ ] TypeScript types for all data

${exampleContext}
${componentCatalog}

NOW GENERATE THE FILE WITH THESE PATTERNS...
`;
```

---

## PHASE 7: Generate Supporting Files (2 hours)

### Add Infrastructure Files to Generation

**File: `lib/langgraph/nodes/frontend-node.ts`**

**Update fileStructurePlan to include new files:**

```typescript
const infraFiles = [
  {
    path: 'lib/store.ts',
    purpose: 'Zustand store for client state management',
    dependencies: ['zustand']
  },
  {
    path: 'lib/query-client.ts',
    purpose: 'React Query client configuration',
    dependencies: ['@tanstack/react-query']
  },
  {
    path: 'lib/api-hooks.ts',
    purpose: 'Generated React Query hooks for PocketBase collections',
    dependencies: ['@tanstack/react-query', 'pocketbase']
  },
  {
    path: 'lib/form-utils.ts',
    purpose: 'Form utilities with Zod schemas',
    dependencies: ['react-hook-form', 'zod']
  },
  {
    path: 'components/ui/Modal.tsx',
    purpose: 'Radix Dialog component',
    dependencies: ['@radix-ui/react-dialog']
  },
  {
    path: 'components/ui/Dropdown.tsx',
    purpose: 'Radix Dropdown Menu component',
    dependencies: ['@radix-ui/react-dropdown-menu']
  },
  {
    path: 'components/ui/Select.tsx',
    purpose: 'Radix Select component',
    dependencies: ['@radix-ui/react-select']
  },
  {
    path: 'components/ui/Toast.tsx',
    purpose: 'Radix Toast notification system',
    dependencies: ['@radix-ui/react-toast']
  }
];

// Add to fileStructurePlan
state.fileStructurePlan = [
  ...existingFiles,
  ...infraFiles
];
```

**Generate these files automatically:**

```typescript
// After Phase 1 planning, before Phase 2 generation
console.log('[Frontend] 📦 Generating infrastructure files...');

const generatedInfraFiles = [
  {
    path: 'lib/store.ts',
    content: storeTemplate
  },
  {
    path: 'lib/query-client.ts',
    content: queryClientTemplate
  },
  {
    path: 'lib/api-hooks.ts',
    content: generateApiHooks(state.backendConfig?.collections || [])
  },
  {
    path: 'lib/form-utils.ts',
    content: formUtilsTemplate
  },
  {
    path: 'components/ui/Modal.tsx',
    content: radixComponents.Dialog
  },
  {
    path: 'components/ui/Dropdown.tsx',
    content: radixComponents.DropdownMenu
  },
  {
    path: 'components/ui/Select.tsx',
    content: radixComponents.Select
  },
  {
    path: 'components/ui/Toast.tsx',
    content: radixComponents.Toast
  }
];

// Add to files array
files.push(...generatedInfraFiles);

console.log('[Frontend] ✅ Generated 8 infrastructure files');
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Component Examples (2 hours)
- [ ] Add import in frontend-node.ts
- [ ] Fetch examples before generation
- [ ] Add exampleContext to AI prompt
- [ ] Track example usage
- [ ] Test with landing page generation

### Phase 2A: Zustand Store (2 hours)
- [ ] Update package.json dependencies
- [ ] Add store template
- [ ] Generate lib/store.ts file
- [ ] Update layout to include provider
- [ ] Test state persistence

### Phase 2B: React Query (2 hours)
- [ ] Add query-client template
- [ ] Generate api-hooks dynamically
- [ ] Update layout with QueryProvider
- [ ] Add DevTools in development
- [ ] Test data fetching

### Phase 3: Forms (2 hours)
- [ ] Add form-utils template
- [ ] Generate common Zod schemas
- [ ] Update form components to use RHF
- [ ] Add validation error display
- [ ] Test form submission

### Phase 4: Radix UI (3 hours)
- [ ] Add Radix UI dependencies
- [ ] Generate Modal component
- [ ] Generate Dropdown component
- [ ] Generate Select component
- [ ] Generate Toast system
- [ ] Test accessibility

### Phase 5: Parallel Build (3 hours)
- [ ] Update workflow edges
- [ ] Add sync node
- [ ] Enable parallel execution
- [ ] Test with backend + no-backend apps
- [ ] Measure performance improvement

### Phase 6: Update Prompts (2 hours)
- [ ] Add state management patterns
- [ ] Add component examples
- [ ] Update quality checklist
- [ ] Test generated code quality

### Phase 7: Infrastructure Files (2 hours)
- [ ] Add infra files to plan
- [ ] Generate files automatically
- [ ] Update file structure
- [ ] Test imports and types

---

## TESTING PLAN

### Test Case 1: Landing Page (No Backend)
```
User: "Create a modern landing page for a SaaS product"

Expected:
✅ 8 component examples loaded
✅ Zustand store generated
✅ No React Query (no backend)
✅ Contact form with Zod validation
✅ Radix UI Modal for video
✅ Build time: ~50s (parallel not needed)
```

### Test Case 2: Dashboard (With Backend)
```
User: "Create a task management dashboard with user authentication"

Expected:
✅ 8 component examples loaded
✅ Zustand store (auth, theme)
✅ React Query hooks for tasks
✅ Forms with validation
✅ Radix UI components
✅ Build time: ~50s (parallel UX+Backend)
✅ Type-safe API calls
```

### Test Case 3: E-commerce (Complex)
```
User: "Create an e-commerce platform with products, cart, and checkout"

Expected:
✅ 8 component examples (ecommerce category)
✅ Zustand for cart state
✅ React Query for products
✅ Checkout form with Zod
✅ Radix Select for filters
✅ Toast notifications
✅ Build time: ~55s
```

---

## PERFORMANCE METRICS

### Before Improvements:
- Build time: 70-80s
- Component quality: 6/10 (pattern-based)
- State management: 4/10 (manual useState)
- Form validation: 3/10 (no validation)
- Accessibility: 5/10 (manual)
- Type safety: 6/10 (inline types)

### After Improvements:
- Build time: 50-60s (25% faster)
- Component quality: 9/10 (example-based)
- State management: 9/10 (Zustand + React Query)
- Form validation: 9/10 (Zod + RHF)
- Accessibility: 9/10 (Radix UI)
- Type safety: 8/10 (shared schemas)

**Total Quality Improvement: 50%**
**Build Time Improvement: 25%**

---

## ROLLOUT STRATEGY

### Week 1: Core Infrastructure
- Day 1-2: Component examples integration
- Day 3-4: State management (Zustand + React Query)
- Day 5: Testing and bug fixes

### Week 2: Forms and UI
- Day 1-2: React Hook Form + Zod
- Day 3-4: Radix UI components
- Day 5: Testing and refinement

### Week 3: Optimization
- Day 1-2: Parallel build implementation
- Day 3-4: Update prompts and examples
- Day 5: Final testing and documentation

### Week 4: Production
- Day 1-2: Deploy to staging
- Day 3: Monitor and fix issues
- Day 4-5: Deploy to production

---

## MAINTENANCE

### Monthly Tasks:
- [ ] Update component examples (add new, remove low-quality)
- [ ] Review generated code quality
- [ ] Update Radix UI components
- [ ] Check dependency versions
- [ ] Update AI prompts based on feedback

### Quarterly Tasks:
- [ ] Audit state management patterns
- [ ] Review React Query cache strategy
- [ ] Update Zod schemas
- [ ] Performance benchmarking
- [ ] User feedback analysis

---

## APPENDIX A: File Structure

```
lib/
├── store.ts                    # Zustand client state
├── query-client.ts            # React Query config
├── api-hooks.ts               # Auto-generated PB hooks
├── form-utils.ts              # Zod schemas & helpers
├── example-selector.ts        # ✅ Already exists
├── component-catalog.ts       # ✅ Already exists
└── pocketbase.ts             # ✅ Already exists

components/
├── ui/
│   ├── Modal.tsx              # Radix Dialog
│   ├── Dropdown.tsx           # Radix Dropdown
│   ├── Select.tsx             # Radix Select
│   └── Toast.tsx              # Radix Toast
└── [other components]

app/
├── layout.tsx                 # QueryProvider + ToastProvider
├── page.tsx                   # Home page
└── [other pages]
```

---

## APPENDIX B: Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "^14.2.13",
    "typescript": "^5.6.2",
    "tailwindcss": "^3.4.13",

    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.56.2",
    "@tanstack/react-query-devtools": "^5.56.2",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.0",

    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",

    "pocketbase": "^0.21.5",
    "lucide-react": "^0.441.0"
  }
}
```

---

## SUCCESS CRITERIA

✅ Component examples are used in 100% of generations
✅ All generated apps have Zustand store
✅ All API calls use React Query hooks
✅ All forms use React Hook Form + Zod
✅ All modals/dropdowns use Radix UI
✅ Build time reduced by 20-30%
✅ Generated code quality score > 8/10
✅ Zero TypeScript errors in generated code
✅ WCAG AA compliance for all components
✅ Lighthouse score > 90 for generated apps

---

## NEXT STEPS

1. ✅ Review this document
2. ⏳ Start Phase 1 implementation
3. ⏳ Test with sample prompts
4. ⏳ Deploy to staging
5. ⏳ Monitor and iterate

**Estimated Total Time: 20 hours**
**Expected Quality Improvement: 50%**
**Expected Performance Improvement: 25%**

---

*Document created: November 5, 2025*
*Last updated: November 5, 2025*
*Status: Ready for Implementation*
