// NextAuth PocketBase Schema
// Collections required for NextAuth adapter

export const NEXTAUTH_COLLECTIONS = [
  {
    name: 'users',
    fields: [
      { name: 'email', type: 'email', required: true, unique: true },
      { name: 'emailVerified', type: 'date', required: false },
      { name: 'name', type: 'text', required: false },
      { name: 'avatar', type: 'text', required: false },
      { name: 'password', type: 'text', required: false },
    ],
  },
  {
    name: 'accounts',
    fields: [
      { name: 'userId', type: 'text', required: true },
      { name: 'type', type: 'text', required: true },
      { name: 'provider', type: 'text', required: true },
      { name: 'providerAccountId', type: 'text', required: true },
      { name: 'refresh_token', type: 'text', required: false },
      { name: 'access_token', type: 'text', required: false },
      { name: 'expires_at', type: 'number', required: false },
      { name: 'token_type', type: 'text', required: false },
      { name: 'scope', type: 'text', required: false },
      { name: 'id_token', type: 'text', required: false },
      { name: 'session_state', type: 'text', required: false },
    ],
  },
  {
    name: 'sessions',
    fields: [
      { name: 'sessionToken', type: 'text', required: true, unique: true },
      { name: 'userId', type: 'text', required: true },
      { name: 'expires', type: 'date', required: true },
    ],
  },
  {
    name: 'verification_tokens',
    fields: [
      { name: 'identifier', type: 'text', required: true },
      { name: 'token', type: 'text', required: true, unique: true },
      { name: 'expires', type: 'date', required: true },
    ],
  },
];

export const NEXTAUTH_BACKEND_PROMPT = `
🔐 AUTHENTICATION SYSTEM DETECTED

NextAuth.js requires 4 specific PocketBase collections with exact schema:

1. **users** - User accounts
   - email (email, required, unique)
   - emailVerified (date, optional)
   - name (text, optional)
   - avatar (text, optional)
   - password (text, optional) - for credentials provider

2. **accounts** - OAuth provider accounts
   - userId (text, required)
   - type (text, required)
   - provider (text, required)
   - providerAccountId (text, required)
   - refresh_token, access_token, expires_at, token_type, scope, id_token, session_state (all optional)

3. **sessions** - Active user sessions
   - sessionToken (text, required, unique)
   - userId (text, required)
   - expires (date, required)

4. **verification_tokens** - Email verification
   - identifier (text, required)
   - token (text, required, unique)
   - expires (date, required)

⚠️ DO NOT create custom auth endpoints. NextAuth handles:
- POST /api/auth/signin
- POST /api/auth/signout
- GET /api/auth/session
- POST /api/auth/callback/:provider

ONLY include these 4 collections in your schema output.
`;
