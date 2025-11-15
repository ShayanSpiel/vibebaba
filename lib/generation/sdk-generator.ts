/**
 * SDK GENERATOR
 *
 * Automatically generates type-safe TypeScript SDK from backend API definitions
 * Prevents issues like "posts loading in subscription form" by enforcing type safety
 *
 * PROBLEM IT SOLVES:
 * - Manual string-based API calls are error-prone
 * - No type safety between frontend and backend
 * - Easy to call wrong endpoint with wrong data
 *
 * SOLUTION:
 * - Parse lib/api.ts function definitions
 * - Generate TypeScript SDK with proper types
 * - Auto-complete and type checking in frontend code
 */

import type { FileToValidate } from '../langgraph/validation/post-gen/types';

/**
 * Represents a single API endpoint definition
 */
interface APIEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  parameters: APIParameter[];
  returnType: string;
  description?: string;
}

interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

/**
 * Parse lib/api.ts to extract API function definitions
 */
export function parseAPIDefinitions(apiFileContent: string): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  const lines = apiFileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match function definition: export async function functionName(params): Promise<Type>
    const functionMatch = line.match(
      /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*:\s*Promise<([^>]+)>)?/
    );

    if (functionMatch) {
      const functionName = functionMatch[1];
      const paramsStr = functionMatch[2];
      const returnType = functionMatch[3] || 'any';

      // Parse parameters
      const parameters: APIParameter[] = [];
      if (paramsStr.trim()) {
        const paramParts = paramsStr.split(',').map((p) => p.trim());

        for (const paramPart of paramParts) {
          // Format: paramName: ParamType or paramName?: ParamType
          const paramMatch = paramPart.match(/([a-zA-Z0-9_]+)(\?)?:\s*([^=]+)/);

          if (paramMatch) {
            const paramName = paramMatch[1];
            const optional = !!paramMatch[2];
            const paramType = paramMatch[3].trim();

            parameters.push({
              name: paramName,
              type: paramType,
              required: !optional,
            });
          }
        }
      }

      // Infer HTTP method from function name
      let method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET';
      const lowerName = functionName.toLowerCase();

      if (
        lowerName.startsWith('create') ||
        lowerName.startsWith('add') ||
        lowerName.startsWith('post')
      ) {
        method = 'POST';
      } else if (lowerName.startsWith('update') || lowerName.startsWith('edit')) {
        method = 'PUT';
      } else if (lowerName.startsWith('delete') || lowerName.startsWith('remove')) {
        method = 'DELETE';
      } else if (lowerName.startsWith('patch')) {
        method = 'PATCH';
      }

      // Infer API path from function name
      // Example: getPosts → /api/posts
      // Example: createPost → /api/posts
      // Example: getPostById → /api/posts/:id
      const path = inferAPIPath(functionName);

      // Look for JSDoc comment above function
      let description: string | undefined;
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        const commentMatch = prevLine.match(/^\*\s*(.+)$/);
        if (commentMatch) {
          description = commentMatch[1];
        }
      }

      endpoints.push({
        name: functionName,
        method,
        path,
        parameters,
        returnType,
        description,
      });
    }
  }

  return endpoints;
}

/**
 * Infer API endpoint path from function name
 * getPosts → /api/posts
 * getPostById → /api/posts/:id
 * createUser → /api/users
 */
function inferAPIPath(functionName: string): string {
  // Remove common prefixes
  let resourceName = functionName.replace(
    /^(get|create|update|delete|fetch|post|put|patch|remove|add|save|load)/,
    ''
  );

  // Handle "ById" suffix
  if (resourceName.endsWith('ById')) {
    resourceName = resourceName.replace(/ById$/, '');
    const pluralResource = pluralize(resourceName);
    return `/api/${camelToKebab(pluralResource)}/:id`;
  }

  // Pluralize resource name for collection endpoints
  const pluralResource = pluralize(resourceName);

  return `/api/${camelToKebab(pluralResource)}`;
}

/**
 * Simple pluralization (can be improved with a library like 'pluralize')
 */
function pluralize(word: string): string {
  if (!word) return word;

  const lower = word.toLowerCase();

  // Special cases
  const irregulars: Record<string, string> = {
    person: 'people',
    child: 'children',
    tooth: 'teeth',
    foot: 'feet',
    man: 'men',
    woman: 'women',
  };

  if (irregulars[lower]) {
    return irregulars[lower];
  }

  // Already plural
  if (lower.endsWith('s') || lower.endsWith('data') || lower.endsWith('information')) {
    return word;
  }

  // Common pluralization rules
  if (lower.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lower[lower.length - 2])) {
    return word.slice(0, -1) + 'ies';
  }

  if (
    lower.endsWith('s') ||
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh')
  ) {
    return word + 'es';
  }

  return word + 's';
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate TypeScript SDK from API endpoints
 */
export function generateSDK(endpoints: APIEndpoint[], projectName: string = 'API'): string {
  const sdkCode = `
/**
 * AUTO-GENERATED API SDK
 * Generated from lib/api.ts
 * DO NOT EDIT MANUALLY - regenerate using SDK generator
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * API Client with automatic token refresh
 */
class ${projectName}Client {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  /**
   * Set authentication tokens
   */
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(\`\${API_URL}/api/auth/refresh\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        this.accessToken = data.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.accessToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    const makeRequest = async (token: string | null): Promise<Response> => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token && requiresAuth) {
        headers['Authorization'] = \`Bearer \${token}\`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      return fetch(\`\${API_URL}\${endpoint}\`, options);
    };

    // First attempt
    let response = await makeRequest(this.accessToken);

    // If 401 and requires auth, try refreshing token
    if (response.status === 401 && requiresAuth) {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        // Retry with new token
        response = await makeRequest(this.accessToken);
      } else {
        // Refresh failed - clear tokens and redirect to login
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed');
      }
    }

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || \`Request failed with status \${response.status}\`);
    }

    return responseData as T;
  }

${generateEndpointMethods(endpoints)}
}

// Export singleton instance
export const api = new ${projectName}Client();
export default api;
`;

  return sdkCode.trim();
}

/**
 * Generate method definitions for each endpoint
 */
function generateEndpointMethods(endpoints: APIEndpoint[]): string {
  return endpoints
    .map((endpoint) => {
      const paramsList = endpoint.parameters
        .map((p) => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
        .join(', ');

      const description = endpoint.description
        ? `  /**\n   * ${endpoint.description}\n   */\n`
        : '';

      // Build request data object from parameters
      const dataObject =
        endpoint.parameters.length > 0
          ? `{ ${endpoint.parameters.map((p) => p.name).join(', ')} }`
          : 'undefined';

      // Determine if endpoint requires auth (assume most do except login/register)
      const requiresAuth =
        !endpoint.name.toLowerCase().includes('login') &&
        !endpoint.name.toLowerCase().includes('register');

      return `${description}  async ${endpoint.name}(${paramsList}): Promise<${endpoint.returnType}> {
    return this.request<${endpoint.returnType}>(
      '${endpoint.method}',
      '${endpoint.path}',
      ${dataObject},
      ${requiresAuth}
    );
  }`;
    })
    .join('\n\n');
}

/**
 * Generate TypeScript type definitions from endpoints
 */
export function generateTypeDefinitions(endpoints: APIEndpoint[]): string {
  const types = new Set<string>();

  endpoints.forEach((endpoint) => {
    // Extract custom types from parameters
    endpoint.parameters.forEach((param) => {
      if (!isPrimitiveType(param.type)) {
        types.add(param.type);
      }
    });

    // Extract custom types from return type
    if (!isPrimitiveType(endpoint.returnType)) {
      types.add(endpoint.returnType);
    }
  });

  if (types.size === 0) {
    return '';
  }

  return `
/**
 * Type definitions for API responses
 * Define these types based on your backend models
 */

${Array.from(types)
  .map(
    (type) => `export interface ${type} {
  // TODO: Define properties for ${type}
  [key: string]: any;
}`
  )
  .join('\n\n')}
`;
}

/**
 * Check if type is primitive
 */
function isPrimitiveType(type: string): boolean {
  const primitives = ['string', 'number', 'boolean', 'any', 'void', 'null', 'undefined'];
  const baseType = type.replace(/\[\]$/, '').trim(); // Remove array notation
  return primitives.includes(baseType);
}

/**
 * Main function: Generate complete SDK from API file
 */
export function generateSDKFromFiles(
  files: FileToValidate[],
  projectName: string = 'API'
): FileToValidate[] {
  const apiFile = files.find((f) => f.path.includes('lib/api.ts') || f.path.endsWith('/api.ts'));

  if (!apiFile) {
    console.log('[SDKGenerator] No lib/api.ts found - skipping SDK generation');
    return [];
  }

  console.log('[SDKGenerator] Parsing API definitions from lib/api.ts...');
  const endpoints = parseAPIDefinitions(apiFile.content);

  console.log(`[SDKGenerator] Found ${endpoints.length} API endpoints`);

  if (endpoints.length === 0) {
    return [];
  }

  // Generate SDK code
  const sdkCode = generateSDK(endpoints, projectName);

  // Generate type definitions
  const typeDefinitions = generateTypeDefinitions(endpoints);

  const generatedFiles: FileToValidate[] = [
    {
      path: 'src/lib/api-client.ts',
      content: sdkCode,
    },
  ];

  if (typeDefinitions) {
    generatedFiles.push({
      path: 'src/types/api.ts',
      content: typeDefinitions,
    });
  }

  console.log(`[SDKGenerator] Generated ${generatedFiles.length} SDK files`);

  return generatedFiles;
}

/**
 * Example usage in backend-node.ts:
 *
 * import { generateSDKFromFiles } from '../sdk-generator';
 *
 * // After generating backend API files
 * const sdkFiles = generateSDKFromFiles(allFiles, 'MyApp');
 * allFiles.push(...sdkFiles);
 */

export default {
  parseAPIDefinitions,
  generateSDK,
  generateTypeDefinitions,
  generateSDKFromFiles,
};
