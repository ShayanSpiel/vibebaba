import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Server-Side Route Protection
 * This runs BEFORE the page is rendered, preventing unauthorized access
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth cookie
  const authCookie = request.cookies.get('pb_auth');
  const isAuthenticated = !!authCookie?.value;

  // Define protected routes that require authentication
  const protectedRoutes = ['/settings', '/projects', '/project'];

  // Define public routes (accessible without auth)
  const publicRoutes = ['/', '/pricing'];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If trying to access protected route without auth, redirect to home
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    url.searchParams.set('auth', 'signin');
    return NextResponse.redirect(url);
  }

  // Validate token format if authenticated
  if (isAuthenticated && authCookie?.value) {
    try {
      const authData = JSON.parse(authCookie.value);

      // Check if token exists and is not empty
      if (!authData.token || !authData.model) {
        // Invalid auth data, clear cookie and redirect if on protected route
        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/', request.url))
          : NextResponse.next();

        response.cookies.delete('pb_auth');
        return response;
      }
    } catch (error) {
      // Invalid JSON, clear cookie
      const response = isProtectedRoute
        ? NextResponse.redirect(new URL('/', request.url))
        : NextResponse.next();

      response.cookies.delete('pb_auth');
      return response;
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust as needed)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https: http://localhost:4000 http://localhost:8090 http://127.0.0.1:8090 ws://localhost:* wss://localhost:*; " +
    "frame-src 'self' http://localhost:4000 http://localhost:8090; " +
    "frame-ancestors 'none';"
  );

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
