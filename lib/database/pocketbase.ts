import PocketBase from 'pocketbase';
import { config } from '../config';

// Initialize PocketBase client using centralized config
export const pb = new PocketBase(config.POCKETBASE_URL);

// Disable auto-cancellation for better request handling
pb.autoCancellation(false);

/**
 * Ensure auth is loaded from localStorage before making requests
 * Call this before ANY PocketBase operation on client-side
 */
export function ensureAuth() {
  if (typeof window === 'undefined') return; // Server-side, skip

  // If already valid, no need to reload
  if (pb.authStore.isValid && pb.authStore.model) return;

  // Try multiple possible auth keys (for compatibility)
  const possibleKeys = ['pb_auth', 'pocketbase_auth'];

  for (const key of possibleKeys) {
    const authData = localStorage.getItem(key);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token && parsed.model) {
          pb.authStore.save(parsed.token, parsed.model);
          // Logging removed - using centralized logger
          return;
        }
      } catch (e) {
        // Silent fail - auth will be requested when needed
      }
    }
  }
}

// Load auth from localStorage on initialization (client-side only)
if (typeof window !== 'undefined') {
  ensureAuth();
}

// TypeScript interfaces for all collections

export interface User {
  id: string;
  collectionId: string;
  collectionName: string;
  username?: string;
  email: string;
  emailVisibility?: boolean;
  verified: boolean;
  name?: string;
  avatar?: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  lastDailyReset?: string;
  packageId?: string;
  packageExpiry?: string;
  created: string;
  updated: string;
}

export interface Transaction {
  id: string;
  collectionId: string;
  collectionName: string;
  userId: string;
  type: 'purchase' | 'subscription' | 'refund';
  amount: number;
  tokens: number;
  currency?: string;
  packageId?: string;
  paymentProvider?: 'stripe' | 'paypal' | 'zibal' | 'zarinpal';
  paymentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  created: string;
  updated: string;
}

export interface TokenUsage {
  id: string;
  collectionId: string;
  collectionName: string;
  userId: string;
  tokensUsed: number;
  endpoint?: string;
  projectId?: string;
  created: string;
}

export interface Organization {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  slug: string;
  ownerId: string;
  totalCredits: number;
  usedCredits: number;
  monthlyCredits: number;
  created: string;
  updated: string;
}

export interface OrgMember {
  id: string;
  collectionId: string;
  collectionName: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created: string;
  updated: string;
}

export interface Project {
  id: string;
  collectionId: string;
  collectionName: string;
  userId: string;
  organizationId?: string; // NEW: Optional for backwards compatibility
  name: string;
  description: string;
  stage: 'planning' | 'building' | 'completed' | 'error';
  plan?: string;
  backendConfig?: any;
  context?: any;
  thumbnail?: string;
  deployUrl?: string;
  created: string;
  updated: string;
}

export interface ProjectFile {
  id: string;
  collectionId: string;
  collectionName: string;
  projectId: string;
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
  size?: number;
  created: string;
  updated: string;
}

export interface ProjectMessage {
  id: string;
  collectionId: string;
  collectionName: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  created: string;
}

export interface ExampleCategory {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  slug: string;
  description: string;
  minExamplesRequired: number;
  targetExamples: number;
  parentCategory?: string;
  isActive: boolean;
  priority: number;
  created: string;
  updated: string;
}

export interface DesignExample {
  id: string;
  collectionId: string;
  collectionName: string;
  categoryId: string;
  name: string;
  description: string;
  htmlContent: string;

  // Classification
  styleVariant: 'minimal' | 'modern' | 'glassmorphism' | 'brutalist' | 'gradient' | 'dark';
  industryContext: string[]; // ['saas', 'ecommerce', 'blog', etc.]
  complexityLevel: 'simple' | 'medium' | 'complex';

  // Quality Metrics
  qualityScore: number; // 0-100
  performanceScore: number; // 0-100
  accessibilityScore: number; // 0-100
  designTrendScore: number; // 0-100

  // Versioning
  version: string;
  isActive: boolean;
  replacedBy?: string;

  // Tracking (infrastructure for future)
  usageCount: number;
  successRate?: number;

  // Metadata
  tags: string[];
  previewImage?: string;

  created: string;
  updated: string;
}

export interface ExampleGenerationQueue {
  id: string;
  collectionId: string;
  collectionName: string;
  categoryId: string;

  // Progress Tracking
  targetCount: number;
  currentCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  // Prioritization
  priority: number; // 1-10
  reason: string;

  // Generation Config
  generationConfig: {
    styleVariants: string[];
    industryContexts: string[];
    complexityLevels: string[];
  };

  // Results
  generatedIds: string[];
  errorLog?: string;

  created: string;
  completed?: string;
}

export interface UserContribution {
  id: string;
  collectionId: string;
  collectionName: string;
  projectId: string;
  userId: string;

  // Component Data
  extractedHtml: string;
  componentType: string;

  // Quality Assessment
  aiQualityScore: number;
  meetsCriteria: boolean;
  assessmentNotes: string;

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'in_library';
  approvedAsExampleId?: string;

  created: string;
  reviewed?: string;
}

// Helper functions for common operations

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return pb.authStore.model as User | null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid && !!pb.authStore.model;
}

/**
 * Logout current user
 */
export function logout(): void {
  pb.authStore.clear();
}

/**
 * Get user's available tokens
 */
export function getAvailableTokens(user: User): number {
  return Math.max(0, user.totalTokens + user.dailyTokens - user.usedTokens);
}

/**
 * Format PocketBase date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get file URL from PocketBase
 */
export function getFileUrl(
  record: any,
  filename: string,
  queryParams?: Record<string, string>
): string {
  return pb.files.getUrl(record, filename, queryParams);
}

/**
 * Subscribe to collection changes (real-time)
 */
export function subscribeToCollection<T = any>(
  collection: string,
  callback: (data: { action: string; record: T }) => void,
  filter?: string
) {
  return pb.collection(collection).subscribe('*', callback, filter ? { filter } : undefined);
}

/**
 * Unsubscribe from collection
 */
export function unsubscribeFromCollection(collection: string) {
  return pb.collection(collection).unsubscribe();
}

export default pb;
