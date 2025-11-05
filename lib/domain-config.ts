/**
 * Domain configuration for localhost development and production
 */

// Detect if we're in development (localhost) or production
export const isDevelopment = process.env.NODE_ENV === 'development' ||
                             process.env.NEXT_PUBLIC_ENV === 'development' ||
                             typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Base domain configuration
export const DOMAIN_CONFIG = {
  // Development (localhost)
  development: {
    baseDomain: 'localhost',
    deploymentPort: 4000,
    protocol: 'http',
    useSubdomains: false, // Localhost doesn't support real subdomains
  },
  // Production (vibebaba.com)
  production: {
    baseDomain: 'vibebaba.com',
    deploymentPort: null, // Uses standard ports (80/443)
    protocol: 'https',
    useSubdomains: true,
  }
};

/**
 * Get the current environment configuration
 */
export function getConfig() {
  return isDevelopment ? DOMAIN_CONFIG.development : DOMAIN_CONFIG.production;
}

/**
 * Build a URL for a published project
 * @param subdomain - The project subdomain
 * @param projectId - The project ID (used for localhost routing)
 * @returns Full URL to the published project
 */
export function buildPublishUrl(subdomain: string, projectId: string): string {
  const config = getConfig();

  if (config.useSubdomains) {
    // Production: Use actual subdomains
    const port = config.deploymentPort ? `:${config.deploymentPort}` : '';
    return `${config.protocol}://${subdomain}.${config.baseDomain}${port}`;
  } else {
    // Development: Use path-based routing
    const port = config.deploymentPort ? `:${config.deploymentPort}` : '';
    return `${config.protocol}://${config.baseDomain}${port}/apps/project-${projectId}`;
  }
}

/**
 * Get the deployment server URL
 */
export function getDeploymentServerUrl(): string {
  if (isDevelopment) {
    return 'http://localhost:4000';
  }
  return process.env.DEPLOYMENT_SERVER_URL || 'http://localhost:4000';
}

/**
 * Format a subdomain for display
 * @param subdomain - The subdomain
 * @param includeProtocol - Whether to include the protocol
 */
export function formatSubdomainDisplay(subdomain: string, includeProtocol: boolean = false): string {
  const config = getConfig();
  const protocol = includeProtocol ? `${config.protocol}://` : '';

  if (config.useSubdomains) {
    return `${protocol}${subdomain}.${config.baseDomain}`;
  } else {
    return `${protocol}${config.baseDomain}:${config.deploymentPort}/apps/[subdomain-${subdomain}]`;
  }
}

/**
 * Get display text for the environment
 */
export function getEnvironmentDisplay(): string {
  return isDevelopment ? 'Development (Localhost)' : 'Production';
}
