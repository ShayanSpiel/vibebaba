export function generateApiClient(
  endpoints: any[],
  projectId: string,
  collections: any[] = []
): string {
  // POCKETBASE DIRECT API CLIENT
  // No Next.js API routes - calls PocketBase REST API directly

  // ✅ CRITICAL FIX: Generate TypeScript interfaces for each collection
  const typeInterfaces = collections
    .map((col) => {
      // Use originalName if available (preserves camelCase), otherwise capitalize normalized name
      const nameForType = col.originalName || col.name;
      const typeName = nameForType.charAt(0).toUpperCase() + nameForType.slice(1);
      const fields = col.fields || [];

      // Filter out PocketBase auto-generated fields (id, created, updated) since we add them separately
      const userFields = fields.filter(
        (field: any) => !['id', 'created', 'updated'].includes(field.name)
      );

      const fieldDefinitions = userFields
        .map((field: any) => {
          let tsType = 'any';

          // Map PocketBase field types to TypeScript types
          switch (field.type?.toLowerCase()) {
            case 'text':
            case 'email':
            case 'url':
            case 'editor':
              tsType = 'string';
              break;
            case 'number':
              tsType = 'number';
              break;
            case 'bool':
            case 'boolean':
              tsType = 'boolean';
              break;
            case 'date':
            case 'datetime':
              tsType = 'string'; // ISO date string
              break;
            case 'json':
              // Default to any[] for JSON fields (most common: arrays of strings/objects)
              // This allows TypeScript to infer parameter types in .map() callbacks
              tsType = 'any[]';
              break;
            case 'file':
              tsType = 'string'; // File URL
              break;
            case 'relation':
              tsType = 'string'; // Relation ID
              break;
            case 'select':
              tsType = 'string';
              break;
            default:
              tsType = 'any';
          }

          const optional = field.required === false ? '?' : '';
          return `  ${field.name}${optional}: ${tsType};`;
        })
        .join('\n');

      return `export interface ${typeName} {
  id?: string;
  created?: string;
  updated?: string;
${fieldDefinitions}
}`;
    })
    .join('\n\n');

  return `/**
 * AUTO-GENERATED API CLIENT
 *
 * Calls PocketBase REST API directly (no Next.js API routes).
 * Uses PocketBase's built-in REST endpoints for CRUD operations.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚨 CRITICAL: ALL INTERFACES BELOW ARE EXPORTED FROM @/lib/api
// 🚨 YOU MUST IMPORT ANY INTERFACE YOU USE: import { InterfaceName } from '@/lib/api';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${typeInterfaces || '// No collections defined'}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Use proxy endpoint to avoid Chrome's Private Network Access blocking
// Proxy at /pb-api forwards to PocketBase at localhost:8090/api
const PB_URL = process.env.NEXT_PUBLIC_PB_URL || '/pb-api';
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || '${projectId}';

// Helper to get full collection name with project prefix
function getCollectionName(name: string): string {
  return \`\${PROJECT_ID}_\${name}\`;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, error.message || \`HTTP \${res.status}\`);
  }

  // Handle 204 No Content (empty response body)
  if (res.status === 204) {
    return null as T;
  }

  const data = await res.json();

  // PocketBase list responses: { items: [...], totalItems: N }
  // Auto-extract items array for convenience
  if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
    return data.items as T;
  }

  return data;
}

${endpoints
  .map((ep) => {
    // Convert Next.js path to PocketBase collection name
    // /api/products → products
    // /api/Products/:id → products (lowercase for PocketBase)
    const collection = (
      ep.collection || ep.path.replace(/^\/api\//, '').split('/')[0]
    ).toLowerCase();

    // Determine if this is a detail endpoint (has :id parameter)
    const hasIdParam = ep.path.includes(':id');

    // Determine HTTP method
    const method = ep.method;
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

    // ✅ SCHEMA-DRIVEN: Use endpoint.parameters if available, fall back to heuristics
    const params = [];
    let hasQueryParams = false;
    let bodyParamName = 'data'; // Track the actual body parameter name

    if (ep.parameters && Array.isArray(ep.parameters) && ep.parameters.length > 0) {
      // ✅ Use schema to build exact parameter list
      const pathParams = ep.parameters.filter((p: any) => p.location === 'path');
      const queryParams = ep.parameters.filter((p: any) => p.location === 'query');
      const bodyParams = ep.parameters.filter((p: any) => p.location === 'body');

      hasQueryParams = queryParams.length > 0;

      // Add path parameters (e.g., id: string)
      pathParams.forEach((p: any) => {
        params.push(`${p.name}: ${p.type}`);
      });

      // Add query parameters as optional object (e.g., params?: { query?: string, category?: string })
      if (queryParams.length > 0) {
        const queryType = `{ ${queryParams
          .map((p: any) => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
          .join(', ')} }`;
        params.push(`params${queryParams.every((p: any) => !p.required) ? '?' : ''}: ${queryType}`);
      }

      // Add body parameters (e.g., data: any, credentials: object, etc.)
      bodyParams.forEach((p: any) => {
        params.push(`${p.name}: ${p.type}`);
        bodyParamName = p.name; // Use the actual parameter name from schema
      });
    } else {
      // ❌ FALLBACK: Use heuristics (backward compatibility)
      console.log(`[Frontend] ⚠️  ${ep.handler}: No schema, using heuristic detection`);

      // Detect search/filter endpoints
      const isSearchEndpoint =
        method === 'GET' &&
        (ep.path.includes('/search') ||
          ep.path.includes('/filter') ||
          ep.handler.toLowerCase().includes('search') ||
          ep.handler.toLowerCase().includes('filter'));

      hasQueryParams = isSearchEndpoint;

      if (hasIdParam) params.push('id: string');
      if (hasBody) params.push('data: any');
      if (isSearchEndpoint) params.push('params?: Record<string, any>');
    }

    // Build PocketBase URL with project-prefixed collection name
    let pbUrl = '';
    if (hasIdParam) {
      // Detail endpoint: GET/PATCH/DELETE /api/collections/{projectId}_{collection}/records/{id}
      pbUrl = `\`\${PB_URL}/api/collections/\${getCollectionName('${collection}')}/records/\${id}\``;
    } else if (hasQueryParams) {
      // Search endpoint: GET /api/collections/{projectId}_{collection}/records?filter=(...)
      pbUrl = `\`\${PB_URL}/api/collections/\${getCollectionName('${collection}')}/records\${params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString() : ''}\``;
    } else {
      // List/Create endpoint: GET/POST /api/collections/{projectId}_{collection}/records
      pbUrl = `\`\${PB_URL}/api/collections/\${getCollectionName('${collection}')}/records\``;
    }

    // Map HTTP methods to PocketBase methods
    let pbMethod = method;
    if (method === 'PUT') pbMethod = 'PATCH'; // PocketBase uses PATCH for updates

    // ✅ SCHEMA-DRIVEN: Use endpoint.returns if available
    const returnType = ep.returns || 'any';

    return `
/**
 * ${ep.description || `${method} ${ep.path}`}
 * PocketBase: ${pbMethod} /api/collections/\${PROJECT_ID}_${collection}/records${hasIdParam ? '/:id' : ''}
 */
export async function ${ep.handler}(${params.join(', ')}): Promise<${returnType}> {
  const url = ${pbUrl};

  const res = await fetch(url, {
    method: '${pbMethod}',
    ${hasBody ? `headers: { 'Content-Type': 'application/json' },` : ''}
    ${hasBody ? `body: JSON.stringify(${bodyParamName}),` : ''}
    credentials: 'include'
  });

  return handleResponse(res);
}`;
  })
  .join('\n\n')}

// Health check - verify PocketBase connection
export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  const res = await fetch(\`\${PB_URL}/api/health\`);
  if (res.ok) {
    return { status: 'ok', timestamp: Date.now() };
  }
  throw new ApiError(res.status, 'PocketBase health check failed');
}
`;
}

/**
 * Calculate deterministic port from projectId (matches deployment-server logic)
 * This ensures the frontend always knows the correct API port
 */
function calculateApiPort(projectId: string): number {
  const PORT_RANGE = { min: 5000, max: 6000 };

  // Same hash algorithm as deployment server
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash << 5) - hash + projectId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Map hash to port range (5000-6000)
  const portOffset = Math.abs(hash) % (PORT_RANGE.max - PORT_RANGE.min + 1);
  const port = PORT_RANGE.min + portOffset;

  return port;
}

export function generateEnvFile(projectId: string, hasAuth = false): string {
  // PocketBase Direct Architecture - Frontend calls PocketBase REST API directly
  // No Next.js API routes, so no NEXT_PUBLIC_API_URL needed

  const authVars = hasAuth
    ? `

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production

# OAuth Providers (optional - uncomment to enable)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_ID=your-github-client-id
# GITHUB_SECRET=your-github-client-secret

# PocketBase URL for NextAuth adapter
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
`
    : '';

  return `# Auto-generated environment variables
# PocketBase Direct Architecture - Frontend calls PocketBase REST API via proxy

NEXT_PUBLIC_PROJECT_ID=${projectId}
NEXT_PUBLIC_PB_URL=/pb-api${authVars}

# No JWT_SECRET or NEXT_PUBLIC_API_URL needed
# PocketBase handles authentication and backend logic
# API calls go through /pb-api proxy to avoid Chrome's Private Network Access blocking
# For custom backend logic, use PocketBase hooks in deployment-server/pb_migrations/
`;
}

/**
 * Extract industry from user description
 */
function getIndustryFromDescription(description: string): string {
  const lower = description.toLowerCase();

  const industries: Record<string, string[]> = {
    ecommerce: [
      'shop',
      'store',
      'buy',
      'sell',
      'product',
      'cart',
      'checkout',
      'ecommerce',
      'e-commerce',
    ],
    saas: ['saas', 'software', 'platform', 'dashboard', 'analytics', 'tool', 'service'],
    fintech: ['finance', 'bank', 'payment', 'wallet', 'crypto', 'trading', 'investment'],
    healthcare: ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'appointment'],
    education: [
      'education',
      'learn',
      'course',
      'student',
      'teacher',
      'school',
      'university',
      'training',
    ],
    social: ['social', 'network', 'community', 'chat', 'message', 'friend', 'post', 'feed'],
    travel: ['travel', 'hotel', 'flight', 'booking', 'trip', 'vacation', 'tour'],
    food: ['food', 'restaurant', 'delivery', 'recipe', 'meal', 'kitchen', 'dining'],
    'real-estate': ['property', 'real estate', 'apartment', 'house', 'rent', 'lease'],
    entertainment: ['music', 'movie', 'video', 'stream', 'watch', 'listen', 'play', 'game'],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return industry;
    }
  }

  return 'general';
}
