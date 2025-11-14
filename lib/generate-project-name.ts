import { generateWithFallback } from './ai/ai';

/**
 * Generate a URL-friendly project name from a description using AI
 * @param description - The project description
 * @returns A unique, URL-friendly project name
 */
export async function generateProjectName(description: string): Promise<string> {
  try {
    const prompt = `Extract a short URL-friendly name from this project description: "${description}".

Rules:
- Lowercase only
- Use hyphens instead of spaces
- 2-4 words maximum
- Only alphanumeric characters and hyphens
- Make it descriptive but concise
- Example outputs: "todo-app", "blog-platform", "fitness-tracker", "recipe-finder"

Return ONLY the name, nothing else.`;

    const result = await generateWithFallback(prompt);

    // Clean and sanitize the AI response
    const baseName = result
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 40); // Max 40 characters for base name

    // Add unique 4-character suffix
    const uniqueId = Math.random().toString(36).substring(2, 6);

    return `${baseName}-${uniqueId}`;
  } catch (error) {
    console.error('Failed to generate project name with AI:', error);

    // Fallback: Generate from first few words of description
    const fallbackName = description
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 40);

    const uniqueId = Math.random().toString(36).substring(2, 6);
    return `${fallbackName || 'project'}-${uniqueId}`;
  }
}

/**
 * Validate if a subdomain is acceptable
 * @param subdomain - The subdomain to validate
 * @returns true if valid, false otherwise
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Must be 3-63 characters
  if (subdomain.length < 3 || subdomain.length > 63) {
    return false;
  }

  // Must match pattern: lowercase alphanumeric and hyphens only
  const pattern = /^[a-z0-9-]+$/;
  if (!pattern.test(subdomain)) {
    return false;
  }

  // Cannot start or end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return false;
  }

  return true;
}

/**
 * Reserved subdomains that cannot be used
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'smtp',
  'pop',
  'imap',
  'blog',
  'shop',
  'store',
  'cdn',
  'static',
  'assets',
  'files',
  'media',
  'images',
  'uploads',
  'download',
  'downloads',
  'login',
  'signin',
  'signup',
  'register',
  'auth',
  'account',
  'accounts',
  'user',
  'users',
  'dashboard',
  'console',
  'control',
  'panel',
  'cpanel',
  'webmail',
  'mysql',
  'pgsql',
  'database',
  'db',
  'ns1',
  'ns2',
  'ns3',
  'dns',
  'mx',
  'localhost',
  'test',
  'dev',
  'development',
  'staging',
  'production',
  'prod'
];

/**
 * Check if a subdomain is reserved
 * @param subdomain - The subdomain to check
 * @returns true if reserved, false otherwise
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}
