# Security Best Practices

## Environment Variables

**IMPORTANT**: Never commit sensitive credentials to version control!

### Setup Instructions

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual credentials** in `.env.local`:
   - Replace `your-admin@email.com` with your PocketBase admin email
   - Replace `your-secure-admin-password` with a strong password
   - Add your actual API keys for Gemini, OpenRouter, etc.

3. **Verify `.gitignore` excludes `.env.local`**:
   ```bash
   cat .gitignore | grep .env.local
   ```

### Environment Variables Reference

#### Required for PocketBase Scripts:
- `POCKETBASE_ADMIN_EMAIL` - Admin email for PocketBase management scripts
- `POCKETBASE_ADMIN_PASSWORD` - Admin password (use a strong password!)
- `NEXT_PUBLIC_POCKETBASE_URL` - PocketBase server URL (default: http://localhost:8090)

#### Required for AI Features:
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENROUTER_API_KEY` - OpenRouter API key

#### Required for Payments:
- `ZARINPAL_MERCHANT_ID` - Zarinpal payment gateway merchant ID

#### Optional:
- `GITHUB_TOKEN` - For MCP GitHub integration
- `BRAVE_API_KEY` - For MCP web search integration
- `CRON_SECRET` - For securing cron endpoints

## PocketBase Admin Credentials

### Creating Admin Account

When you first run PocketBase, create an admin account:

```bash
# Start PocketBase
./pocketbase serve

# Visit http://localhost:8090/_/
# Create your admin account with:
# - Email: your-admin@email.com
# - Password: strong-random-password (min 10 characters)
```

### Updating Admin Credentials in Scripts

After creating your admin account, update `.env.local`:

```bash
POCKETBASE_ADMIN_EMAIL=your-actual-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-actual-admin-password
```

### Password Requirements

- **Minimum length**: 10 characters
- **Recommended**: Use a password manager to generate strong passwords
- **Never** use the same password for multiple services
- **Never** commit passwords to git

## Running Scripts Safely

All PocketBase management scripts now use environment variables:

```bash
# ✅ SAFE - Reads from .env.local
node scripts/fix-pocketbase-permissions.js
node scripts/create-remaining-collections.js
node scripts/migrate-user-to-pocketbase.js
node scripts/setup-pocketbase-schema.js

# ❌ UNSAFE - Don't hardcode credentials
# const ADMIN_EMAIL = 'admin@example.com'  // DON'T DO THIS
```

## API Key Security

### Best Practices:

1. **Rotate keys regularly** - Change API keys every 3-6 months
2. **Use separate keys** for development and production
3. **Set up rate limits** on your API keys
4. **Monitor usage** for unusual activity
5. **Revoke compromised keys** immediately

### If a Key is Compromised:

1. **Immediately revoke** the compromised key
2. **Generate a new key**
3. **Update `.env.local`** with the new key
4. **Restart your application**
5. **Review logs** for unauthorized usage

## Production Deployment

### Environment Variables in Production:

**DO NOT** deploy `.env.local` to production servers!

Instead, set environment variables through your hosting platform:

#### Vercel:
```bash
vercel env add POCKETBASE_ADMIN_EMAIL
vercel env add POCKETBASE_ADMIN_PASSWORD
# ... add all other variables
```

#### Railway/Render/Fly.io:
Use their dashboard or CLI to set environment variables

#### Docker:
```bash
docker run -e POCKETBASE_ADMIN_EMAIL=admin@example.com \
           -e POCKETBASE_ADMIN_PASSWORD=secret \
           your-image
```

### Additional Production Security:

1. **Use HTTPS** for all connections
2. **Enable CORS** restrictions
3. **Set up rate limiting**
4. **Enable security headers**
5. **Use environment-specific PocketBase URLs**
6. **Enable PocketBase auth rules**
7. **Regular security audits**

## PocketBase Security

### Collection Permissions:

All collections have row-level security configured:

```javascript
// Users can only access their own data
listRule: '@request.auth.id != "" && userId = @request.auth.id'
viewRule: '@request.auth.id != "" && userId = @request.auth.id'
createRule: '@request.auth.id != ""'
```

### API Rules:

- **Authentication required** for all write operations
- **User isolation** - users can only see/modify their own data
- **Admin-only operations** for sensitive actions
- **Token validation** on every request

## Monitoring & Auditing

### What to Monitor:

1. **Failed login attempts**
2. **API usage patterns**
3. **Token consumption rates**
4. **Unusual data access patterns**
5. **Database permission violations**

### Logging:

```javascript
// All token usage is logged
await pb.collection('token_usage').create({
  userId,
  tokensUsed: tokens,
  endpoint: endpoint,
  projectId: projectId
});

// All transactions are logged
await pb.collection('transactions').create({
  userId,
  type,
  amount,
  status
});
```

## Emergency Procedures

### If You Suspect a Security Breach:

1. **Immediately rotate** all API keys and passwords
2. **Review** recent `token_usage` and `transactions` logs
3. **Check** PocketBase admin logs for unauthorized access
4. **Reset** compromised user passwords
5. **Update** `.env.local` with new credentials
6. **Restart** all services
7. **Document** the incident

## Compliance

### Data Privacy:

- User data is **isolated** per user
- **No data sharing** between users
- **Deletion supported** via API
- **Audit trail** maintained

### GDPR Compliance:

- Users can **export** their data
- Users can **delete** their accounts
- **Consent tracking** available
- **Data retention** policies configurable

## Contact

For security issues, please contact: security@vibebaba.com

**DO NOT** open public issues for security vulnerabilities!
