# Security Documentation - VB Application

## Overview

This document outlines the security measures implemented in the VB application and provides guidelines for maintaining security best practices.

**Last Updated:** 2025-10-30
**Status:** Active Development

---

## Table of Contents

1. [Security Features Implemented](#security-features-implemented)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Security](#api-security)
4. [Input Validation](#input-validation)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)
7. [Security Headers](#security-headers)
8. [Known Limitations](#known-limitations)
9. [Security Checklist](#security-checklist)
10. [Reporting Security Issues](#reporting-security-issues)

---

## Security Features Implemented

### ✅ Completed

- **Authentication Middleware**: Server-side route protection in `middleware.ts`
- **Admin Authorization**: Role-based access control for admin endpoints
- **Security Headers**: CSP, XSS Protection, Frame Options, etc.
- **Filter Injection Prevention**: Escaped PocketBase filter strings
- **Rate Limiting**: Payment endpoints limited to 5 requests/minute
- **Error Sanitization**: Production errors don't expose system details
- **Input Validation**: Collection names and record IDs validated
- **HTTPS Enforcement**: Secure cookies when in production

### 🚧 In Progress

- **CSRF Protection**: Token generation exists but not enforced on all endpoints
- **Session Management**: httpOnly cookies (needs server-side implementation)
- **Audit Logging**: Partial implementation for admin actions

### ⏳ Planned

- **Request Signing**: HMAC signatures for admin API calls
- **Content Security Policy Reporting**: Violation logging endpoint
- **Penetration Testing**: Third-party security audit
- **WAF Integration**: Web Application Firewall for production

---

## Authentication & Authorization

### Authentication Flow

```
User Login → PocketBase Auth → Set pb_auth Cookie → Middleware Validates Token
```

### Protected Routes

Defined in `middleware.ts`:
- `/settings` - User settings
- `/projects` - User's projects list
- `/project/*` - Individual project pages

### Admin Routes

Protected by `requireAdmin` middleware in `lib/pocketbase-middleware.ts`:
- `/api/admin/*` - All admin operations
- Checks user role === 'admin'
- Logs admin actions for audit trail

### Security Considerations

⚠️ **Current Issue**: Auth token stored in localStorage
- **Risk**: Vulnerable to XSS attacks
- **Mitigation**: Moving to httpOnly cookies (server-side only)

⚠️ **Current Issue**: Cookies lack httpOnly flag
- **Risk**: JavaScript can read authentication tokens
- **Mitigation**: Implement server-side cookie management

---

## API Security

### Endpoint Protection

#### Public Endpoints (No Auth Required)
- `GET /api/health` - Health check
- `/` - Homepage
- `/pricing` - Pricing page

#### User Endpoints (Auth Required)
- `POST /api/payment/create` - Create payment (+ Rate Limited)
- `GET /api/payment/verify` - Verify payment
- `POST /api/database/[projectId]/[collection]` - Create records
- `GET /api/database/[projectId]/[collection]` - Read records

#### Admin Endpoints (Admin Role Required)
- `POST /api/admin/credits/adjust` - Adjust user credits
- `POST /api/admin/credits/add-by-email` - Add credits by email
- `POST /api/admin/payments/refund` - Refund payments
- `PUT /api/admin/pricing/packages/[id]` - Update pricing

### Filter Injection Prevention

**Problem**: User input in PocketBase filters can be manipulated

**Solution**: Use `escapeFilterValue()` from `lib/pocketbase-utils.ts`

```typescript
// ❌ UNSAFE
const records = await pb.collection(collection).getFullList({
  filter: `projectId = "${projectId}"` // Vulnerable!
});

// ✅ SAFE
import { escapeFilterValue } from '@/lib/pocketbase-utils';

const records = await pb.collection(collection).getFullList({
  filter: `projectId = "${escapeFilterValue(projectId)}"` // Escaped!
});
```

### Collection Name Validation

Use `validateCollectionName()` to prevent injection:

```typescript
import { validateCollectionName } from '@/lib/pocketbase-utils';

// Validates alphanumeric + underscores only
// Rejects system collections (_superusers, etc.)
validateCollectionName(collection);
```

---

## Input Validation

### Implemented Validators

Located in `lib/pocketbase-utils.ts`:

#### `validateEmail(email: string): boolean`
Validates email format against regex pattern

#### `validateUrl(url: string, allowedDomains?: string[]): boolean`
Validates URL format and optionally checks domain whitelist

#### `validateRecordId(id: string): string`
Validates PocketBase record ID format (15-char alphanumeric)

#### `validateCollectionName(collection: string): string`
Validates collection name format and prevents system collection access

### Usage Example

```typescript
import { validateEmail, validateUrl } from '@/lib/pocketbase-utils';

// Email validation
if (!validateEmail(userEmail)) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}

// URL validation with domain whitelist
if (!validateUrl(redirectUrl, ['yourdomain.com', 'trusted.com'])) {
  return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
}
```

---

## Rate Limiting

### Implementation

`RateLimiter` class in `lib/pocketbase-utils.ts` provides sliding window rate limiting.

### Current Rate Limits

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| `/api/payment/create` | 5 req | 1 min | User ID |
| `/api/ai/generate` | Varies | Varies | User tier |

### Usage

```typescript
import { RateLimiter } from '@/lib/pocketbase-utils';

// Create limiter
const rateLimiter = new RateLimiter(60000, 10); // 10 req/min

// Check limit
if (!rateLimiter.checkLimit(userId)) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

### Cleanup

Rate limiters maintain in-memory maps. Call `cleanup()` periodically:

```typescript
// Every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 300000);
```

---

## Error Handling

### Error Sanitization

**Problem**: Detailed error messages expose system internals in production

**Solution**: Use `sanitizeError()` from `lib/pocketbase-utils.ts`

```typescript
import { sanitizeError } from '@/lib/pocketbase-utils';

try {
  // ... operation
} catch (error: any) {
  console.error('Internal error:', error); // Server logs only

  return NextResponse.json(
    { error: sanitizeError(error) }, // Safe message to client
    { status: 500 }
  );
}
```

### Safe vs Unsafe Error Messages

#### Development Mode
Returns full error details for debugging:
```json
{
  "error": "SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email"
}
```

#### Production Mode
Returns generic safe message:
```json
{
  "error": "Record already exists"
}
```

### Error Mapping

Common errors are mapped to user-friendly messages:

| Internal Error | Safe Message |
|----------------|--------------|
| `SQLITE_CONSTRAINT` | Database constraint violation |
| `UNIQUE constraint failed` | Record already exists |
| `NOT NULL constraint failed` | Required field missing |
| `Unauthorized` | Authentication required |
| Default | An error occurred. Please try again later. |

---

## Security Headers

Implemented in `middleware.ts`:

### Headers Applied to All Responses

```typescript
// Prevent clickjacking
X-Frame-Options: DENY

// Prevent MIME type sniffing
X-Content-Type-Options: nosniff

// Enable XSS protection
X-XSS-Protection: 1; mode=block

// Referrer policy
Referrer-Policy: strict-origin-when-cross-origin

// Content Security Policy
Content-Security-Policy: [See middleware.ts for full policy]
```

### Content Security Policy (CSP)

Current policy allows:
- Scripts: `'self' 'unsafe-inline' 'unsafe-eval'` (⚠️ Consider tightening)
- Styles: `'self' 'unsafe-inline'`
- Images: `'self' data: https:`
- Connections: `'self' https: localhost:*`
- Frames: `'self' localhost:*`
- Frame Ancestors: `'none'` (prevents embedding)

⚠️ **Note**: `'unsafe-inline'` and `'unsafe-eval'` are security risks. Plan to migrate to nonces or hashes.

---

## Known Limitations

### 1. CSRF Protection Not Enforced
**Issue**: Token generation exists but validation not implemented
**Impact**: Vulnerable to cross-site request forgery
**Status**: High priority fix planned
**Mitigation**: Use SameSite cookies as partial defense

### 2. Authentication Token in localStorage
**Issue**: Tokens accessible to JavaScript
**Impact**: XSS can steal tokens
**Status**: Migration to httpOnly cookies in progress
**Mitigation**: Strict CSP and input sanitization

### 3. No Request Signing
**Issue**: Admin API requests not cryptographically signed
**Impact**: Replay attacks possible
**Status**: Planned for next quarter
**Mitigation**: HTTPS + short-lived tokens

### 4. Limited Audit Logging
**Issue**: Not all sensitive operations logged
**Impact**: Difficult to trace security incidents
**Status**: Partial implementation
**Mitigation**: Admin middleware logs some actions

### 5. XSS Risk in HTML Generator
**Issue**: `innerHTML` used in `lib/html-generator.ts`
**Impact**: Potential XSS if user content rendered
**Status**: Needs review and sanitization
**Mitigation**: Currently only renders trusted templates

---

## Security Checklist

### For All API Endpoints

- [ ] Authentication check (if not public)
- [ ] Authorization check (if role-specific)
- [ ] Input validation (use validators)
- [ ] Rate limiting (if sensitive)
- [ ] Filter escaping (for PocketBase queries)
- [ ] Error sanitization (use `sanitizeError()`)
- [ ] Audit logging (if admin/sensitive)

### For User Input

- [ ] Validate format (email, URL, etc.)
- [ ] Sanitize special characters
- [ ] Check length limits
- [ ] Escape for database queries
- [ ] Escape for HTML rendering (if applicable)

### For Cookies

- [ ] `httpOnly: true` (for sensitive data)
- [ ] `secure: true` (HTTPS only)
- [ ] `sameSite: 'strict'` or `'lax'`
- [ ] Appropriate `maxAge` or `expires`
- [ ] Domain restriction

### For Redirects

- [ ] Validate destination URL
- [ ] Check against whitelist
- [ ] Use relative paths when possible
- [ ] Construct URL using `new URL()` API

---

## Security Testing

### Manual Testing Checklist

1. **Authentication Bypass**
   - Try accessing protected routes without token
   - Try using expired/invalid tokens
   - Try accessing other users' data

2. **Filter Injection**
   - Input special characters in filters: `"`, `'`, `\`
   - Try boolean conditions: `" || true`
   - Try nested filters

3. **XSS Attempts**
   - Input `<script>alert('XSS')</script>` in text fields
   - Try event handlers: `<img src=x onerror=alert(1)>`
   - Test HTML entity encoding

4. **Rate Limiting**
   - Make rapid requests to payment endpoints
   - Verify 429 status after limit exceeded

5. **CSRF** (when implemented)
   - Make requests without CSRF token
   - Try using token from different session

### Automated Testing

```bash
# Install security tools
npm install --save-dev @security/audit

# Run security audit
npm audit

# Check for known vulnerabilities
npm run security:check
```

---

## Reporting Security Issues

### Internal Team

For security vulnerabilities discovered internally:

1. **Do NOT** commit security fixes to public branches
2. Create private security advisory on GitHub
3. Notify team lead immediately
4. Document vulnerability details
5. Implement fix in private branch
6. Test thoroughly
7. Deploy and publish advisory

### External Researchers

If you discover a security vulnerability:

**Email**: security@vibebaba.com
**PGP Key**: [Link to public key if available]

**Please Include**:
- Detailed description of vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

**Response Timeline**:
- Acknowledgment: 24 hours
- Initial assessment: 3 business days
- Fix timeline: Based on severity

**Disclosure Policy**:
- We follow responsible disclosure practices
- Please allow 90 days before public disclosure
- We credit researchers (unless anonymous requested)

---

## Security Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [PocketBase Security](https://pocketbase.io/docs/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)
- [Content Security Policy Validator](https://csp-evaluator.withgoogle.com/)

---

## Changelog

### 2025-10-30 - Initial Security Hardening
- ✅ Added filter injection prevention
- ✅ Implemented rate limiting for payments
- ✅ Added error sanitization
- ✅ Created validation utilities
- ✅ Documented security measures
- ✅ Added sign-in button to pricing page
- ✅ Verified upgrade button logic
- ⚠️ Identified critical issues for future fixes

### Future Updates
- [ ] Implement CSRF validation
- [ ] Migrate to httpOnly cookies
- [ ] Add request signing
- [ ] Comprehensive audit logging
- [ ] Third-party security audit

---

**Document Version**: 1.0
**Maintained By**: VB Security Team
**Review Frequency**: Quarterly
