import type { NextRequest } from 'next/server';

/**
 * CSRF Protection Utilities
 * Implements Double Submit Cookie pattern for CSRF protection
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
  }
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
}

/**
 * Set CSRF token cookie (client-side)
 */
export function setCsrfTokenCookie(token: string): void {
  if (typeof window === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; path=/; max-age=3600; SameSite=Strict; ${isSecure ? 'Secure;' : ''}`;
}

/**
 * Get CSRF token from cookie (client-side)
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

/**
 * Get or create CSRF token (client-side)
 */
export function getOrCreateCsrfToken(): string {
  let token = getCsrfTokenFromCookie();

  if (!token) {
    token = generateCsrfToken();
    setCsrfTokenCookie(token);
  }

  return token;
}

/**
 * Validate CSRF token (server-side)
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }

  // Get token from cookie
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Get token from header
  const headerToken = req.headers.get(CSRF_HEADER_NAME);

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    console.warn('[CSRF] Missing CSRF token:', {
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
      method: req.method,
      path: req.nextUrl.pathname,
    });
    return false;
  }

  if (cookieToken !== headerToken) {
    console.warn('[CSRF] CSRF token mismatch');
    return false;
  }

  return true;
}

/**
 * Add CSRF token to fetch headers (client-side helper)
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  if (typeof window === 'undefined') return headers;

  const token = getOrCreateCsrfToken();

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Secure fetch wrapper with automatic CSRF token
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';

  // Add CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    options.headers = addCsrfHeader(options.headers);
  }

  return fetch(url, options);
}
