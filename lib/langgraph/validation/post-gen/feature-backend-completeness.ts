/**
 * Feature-Backend Completeness Validator
 *
 * Validates that Backend Node generated collections and endpoints for ALL features
 * that need backend/database support.
 *
 * PHILOSOPHY: AWARENESS + VALIDATION, NO EXAMPLES
 * - Check IF backend was generated for features needing it
 * - Do NOT dictate WHAT endpoint names should be
 * - Trust the backend AI to generate appropriate names
 */

import type { AppGenState } from '@/lib/langgraph/types';

export interface ValidationError {
  feature: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  included_in_mvp: boolean;
  phase?: number;
}

interface BackendConfig {
  collections: Array<{ name: string; fields: any[] }>;
  apiEndpoints: Array<{
    method: string;
    path: string;
    handler: string;
    collection: string;
    description: string;
  }>;
}

/**
 * Analyze a feature to determine if it needs backend support
 */
function featureNeedsBackend(feature: Feature): boolean {
  const name = feature.name.toLowerCase();
  const desc = feature.description.toLowerCase();
  const combined = `${name} ${desc}`;

  // Backend indicators: Data entities, persistence actions, user-generated content
  const backendIndicators = [
    // Data entities
    /\b(product|post|user|order|message|task|item|content|data|record|entry)\b/,
    // Persistence verbs
    /\b(save|store|create|update|delete|submit|register|add|edit|remove|persist)\b/,
    // User-generated content
    /\b(upload|comment|review|rating|feedback|form submission|user[ -]generated)\b/,
    // Dynamic data
    /\b(catalog|listing|database|collection|dynamic|search results?)\b/,
    // State across sessions
    /\b(cart|wishlist|saved|bookmark|profile|account|dashboard)\b/
  ];

  // Check if any indicator matches
  const needsBackend = backendIndicators.some(regex => regex.test(combined));

  // Static content indicators (features that DON'T need backend)
  const staticIndicators = [
    /\b(about us|contact info|faq|terms|privacy|static)\b/,
    /\b(animation|theme|style|layout|design|ui only)\b/,
    /\b(modal|dropdown|tooltip|menu|navigation)\b/
  ];

  const isStatic = staticIndicators.some(regex => regex.test(combined));

  return needsBackend && !isStatic;
}

/**
 * Extract likely collection names from feature
 * Used to check if backend AI generated appropriate collections
 */
function extractLikelyCollectionNames(feature: Feature): string[] {
  const name = feature.name.toLowerCase();
  const desc = feature.description.toLowerCase();
  const combined = `${name} ${desc}`;

  const possibleCollections: string[] = [];

  // E-commerce specific patterns (high priority - check first)
  const ecommercePatterns = [
    { pattern: /catalog|inventory|listing/, collections: ['products'] },
    { pattern: /shopping|cart|basket/, collections: ['cart', 'cart_items', 'cartItems', 'basket', 'basket_items'] },
    { pattern: /checkout|purchase/, collections: ['orders', 'payments'] },
  ];

  for (const { pattern, collections } of ecommercePatterns) {
    if (pattern.test(combined)) {
      possibleCollections.push(...collections);
    }
  }

  // Extract common entity nouns
  const entityPatterns = [
    /\b(product|item|good)s?\b/,
    /\b(cart|basket)s?\b/,
    /\b(order|purchase)s?\b/,
    /\b(user|customer|member)s?\b/,
    /\b(post|article|blog)s?\b/,
    /\b(task|todo)s?\b/,
    /\b(message|chat|conversation)s?\b/,
    /\b(review|rating|feedback)s?\b/,
    /\b(lead|contact)s?\b/,
  ];

  entityPatterns.forEach(pattern => {
    const match = combined.match(pattern);
    if (match) {
      // Normalize to collection name format
      let collection = match[1];

      // Convert basket → cart_items, cart → cart_items
      if (collection === 'cart' || collection === 'basket') {
        possibleCollections.push('cart');
        possibleCollections.push('basket');
        possibleCollections.push('cart_items');
        possibleCollections.push('cartItems');
        possibleCollections.push('basket_items');
      } else {
        // Add both singular and plural
        possibleCollections.push(collection);
        possibleCollections.push(collection + 's');
      }
    }
  });

  // If no matches, use feature name itself
  if (possibleCollections.length === 0) {
    const normalized = name.replace(/\s+/g, '_').toLowerCase();
    possibleCollections.push(normalized);
  }

  return [...new Set(possibleCollections)]; // Remove duplicates
}

/**
 * Validate that backend was generated for all features needing it
 *
 * PHILOSOPHY CHANGE: We check IF backend exists, not WHAT it should be named
 */
export function validateFeatureBackendCompleteness(
  state: AppGenState
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Get all MVP features
  const mvpFeatures = state.allRequestedFeatures?.filter((f: Feature) => f.included_in_mvp) || [];
  const featuresNeedingBackend = mvpFeatures.filter(featureNeedsBackend);

  console.log('[BackendCompatibility] Starting backend compatibility validation...');

  // If no backend config exists but features need it
  if (!state.backendConfig && featuresNeedingBackend.length > 0) {
    errors.push({
      feature: 'Backend',
      severity: 'error',
      message: `${featuresNeedingBackend.length} features need backend but no backend configuration generated`,
      suggestion: 'Backend node should generate collections and API endpoints',
      autoFixable: false
    });
    return { errors, warnings };
  }

  const backendConfig = state.backendConfig;
  if (!backendConfig) {
    return { errors, warnings }; // No backend needed, no features need it
  }

  const generatedCollections = backendConfig.collections?.map((c: any) => c.name.toLowerCase()) || [];
  const generatedEndpoints = backendConfig.apiEndpoints?.map((e: any) => e.handler.toLowerCase()) || [];

  console.log(`[BackendCompatibility] Validating ${featuresNeedingBackend.length} features needing backend`);
  console.log(`[BackendCompatibility] Generated collections: ${generatedCollections.join(', ')}`);
  console.log(`[BackendCompatibility] Generated endpoints: ${generatedEndpoints.length}`);

  // Validate each feature
  featuresNeedingBackend.forEach(feature => {
    const likelyCollections = extractLikelyCollectionNames(feature);

    // Check if AT LEAST ONE likely collection was generated
    const hasCollection = likelyCollections.some(col =>
      generatedCollections.includes(col.toLowerCase())
    );

    if (!hasCollection) {
      // ERROR: Feature needs backend but no matching collection found
      errors.push({
        feature: feature.name,
        severity: 'error',
        message: `No collection generated for feature '${feature.name}'. Expected one of: ${likelyCollections.join(', ')}`,
        suggestion: `Backend should generate a collection for ${feature.name}`,
        autoFixable: false
      });
    } else {
      // Collection exists, now check if it has endpoints
      const relevantEndpoints = backendConfig.apiEndpoints?.filter((ep: any) =>
        likelyCollections.some(col =>
          ep.collection?.toLowerCase() === col.toLowerCase() ||
          ep.path?.toLowerCase().includes(col.toLowerCase())
        )
      ) || [];

      if (relevantEndpoints.length === 0) {
        warnings.push({
          feature: feature.name,
          severity: 'warning',
          message: `Collection exists for '${feature.name}' but no API endpoints generated`,
          suggestion: `Backend should generate CRUD endpoints for the collection`,
          autoFixable: false
        });
      }
    }
  });

  return { errors, warnings };
}

/**
 * Get summary report
 */
export function getCompletenessReport(state: AppGenState): {
  totalFeatures: number;
  featuresNeedingBackend: number;
  collectionsGenerated: number;
  endpointsGenerated: number;
  errors: number;
  warnings: number;
} {
  const mvpFeatures = state.allRequestedFeatures?.filter((f: Feature) => f.included_in_mvp) || [];
  const featuresNeedingBackend = mvpFeatures.filter(featureNeedsBackend).length;

  const { errors, warnings } = validateFeatureBackendCompleteness(state);

  return {
    totalFeatures: mvpFeatures.length,
    featuresNeedingBackend,
    collectionsGenerated: state.backendConfig?.collections?.length || 0,
    endpointsGenerated: state.backendConfig?.apiEndpoints?.length || 0,
    errors: errors.length,
    warnings: warnings.length
  };
}
