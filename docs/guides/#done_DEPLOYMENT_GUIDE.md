# VB Platform - Complete Deployment Guide

> **Status**: #done - Consolidated deployment guide for all VB features
> **Last Updated**: 2025-10-26
> **Purpose**: Single reference for deploying VB platform to production

---

## Quick Navigation

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Database Migrations](#database-migrations)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Verification](#post-deployment-verification)
- [Feature-Specific Deployments](#feature-specific-deployments)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] `npm run lint` passes
- [ ] `npm run build` completes successfully
- [ ] No console errors in browser
- [ ] All tests pass (if applicable)

### Documentation

- [ ] CHANGELOG updated with new features
- [ ] API changes documented
- [ ] Breaking changes noted (if any)
- [ ] Migration guide created (if schema changes)

### Environment Variables

- [ ] All required variables set in `.env.local`
- [ ] Production variables configured in hosting platform
- [ ] Secrets rotated (if needed)
- [ ] CRON_SECRET generated and set

---

## Environment Setup

### Required Environment Variables

```bash
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=https://your-pocketbase-url.com
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your_secure_password

# AI Models
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Payment Providers
ZARINPAL_MERCHANT_ID=your_zarinpal_merchant_id
# Optional: STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID

# Cron Jobs
CRON_SECRET=<generate_with_openssl_rand_hex_32>

# MCP Integration (Optional)
GITHUB_TOKEN=your_github_personal_access_token
BRAVE_API_KEY=your_brave_search_api_key

# Feature Flags (Optional)
USE_LANGGRAPH=true
```

### Generating Secrets

```bash
# Generate CRON_SECRET
openssl rand -hex 32

# Add to .env.local
echo "CRON_SECRET=<generated_secret>" >> .env.local
```

---

## Database Migrations

### Migration Files Location

```
deployment-server/pb_migrations/
├── 1761400000_add_daily_reset_fields.js
├── 1761400100_add_credit_indexes.js
└── [80+ other migration files]
```

### Running Migrations

**Automatic (Recommended)**:
- Migrations run automatically when PocketBase starts

**Manual**:
```bash
cd deployment-server
./pocketbase migrate
```

### Verifying Migrations

```bash
# Check migration status
cd deployment-server
./pocketbase migrate status

# View applied migrations
sqlite3 pb_data/data.db "SELECT * FROM _migrations ORDER BY applied DESC LIMIT 10;"
```

---

## Deployment Steps

### Step 1: Local Testing

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

Verify:
- [ ] Server starts on port 3000
- [ ] Homepage loads correctly
- [ ] API routes respond
- [ ] No build warnings

### Step 2: Commit Changes

```bash
# Review changes
git status
git diff

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: [Feature Name]

- Added [feature 1]
- Improved [feature 2]
- Fixed [issue]

Impact: [Expected improvement]"

# Push to repository
git push origin main
```

### Step 3: Deploy Frontend

**Vercel (Recommended)**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Manual Deployment**:
```bash
# Build
npm run build

# Start server
npm start

# Or use PM2
pm2 start npm --name "vb-frontend" -- start
```

### Step 4: Deploy Backend

```bash
cd deployment-server

# Start PocketBase
./start.sh

# Or use PM2
pm2 start pocketbase --name "vb-backend" -- serve --http=0.0.0.0:8090
```

### Step 5: Configure Cron Jobs

**Vercel Cron** (Automatic via `vercel.json`):
- Verify in Vercel Dashboard → Project → Settings → Cron Jobs
- Should see: `/api/cron/smart-daily-reset` running hourly

**External Cron** (Alternative):
```bash
# Add to crontab
crontab -e

# Daily at 2 AM
0 2 * * * curl -X GET https://your-domain.com/api/cron/reset-daily-tokens -H "Authorization: Bearer YOUR_CRON_SECRET"
0 2 * * * curl -X GET https://your-domain.com/api/cron/consolidate-memory -H "Authorization: Bearer YOUR_CRON_SECRET"

# Smart reset (hourly)
0 * * * * curl -X GET https://your-domain.com/api/cron/smart-daily-reset -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Post-Deployment Verification

### Step 1: Health Checks

```bash
# Test frontend
curl https://your-domain.com

# Test API
curl https://your-domain.com/api/auth/check

# Test cron endpoint
curl -X GET https://your-domain.com/api/cron/smart-daily-reset \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 2: SEO Verification

```bash
# Test sitemap
curl https://your-domain.com/sitemap.xml

# Test robots.txt
curl https://your-domain.com/robots.txt

# Test Open Graph image
curl -I https://your-domain.com/opengraph-image
```

Expected responses:
- [ ] Sitemap returns valid XML
- [ ] Robots.txt returns correct directives
- [ ] OG image returns 200 status

### Step 3: Performance Testing

**Lighthouse Audit**:
1. Open https://your-domain.com in Chrome
2. Open DevTools (F12)
3. Navigate to Lighthouse tab
4. Run audit

**Target Scores**:
- [ ] Performance: 75+
- [ ] Accessibility: 85+
- [ ] Best Practices: 80+
- [ ] SEO: 90+

### Step 4: Functional Testing

- [ ] User signup/login works
- [ ] AI chat generates responses
- [ ] Project creation successful
- [ ] Code preview renders
- [ ] Payment flow works
- [ ] Admin dashboard accessible
- [ ] Credit system functioning

### Step 5: Monitor Logs

**Vercel**:
- Check function logs for errors
- Monitor cron job executions
- Review build logs

**PocketBase**:
```bash
# View logs
tail -f deployment-server/pb_data/logs.db

# Or check via admin UI
http://your-pocketbase-url.com/_/
```

---

## Feature-Specific Deployments

### Phase 1: Credit System Performance

**Status**: ✅ Complete

**Key Changes**:
- Enhanced caching (5s → 60s TTL)
- Background daily resets (cron job)
- Admin pagination (50 users/page)
- Database indexes added

**Deployment Checklist**:
- [ ] CRON_SECRET environment variable set
- [ ] Vercel cron configured (or external cron)
- [ ] Database migrations applied
- [ ] Admin dashboard loads <2s
- [ ] Credit loading <50ms

**Verification**:
```bash
# Test cron endpoint
curl -X GET https://your-domain.com/api/cron/smart-daily-reset \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return:
# {"success":true,"resetCount":0,"duration":123}
```

### SEO & Performance Optimizations

**Status**: ✅ Complete

**Key Changes**:
- Sitemap and robots.txt added
- Open Graph and Twitter cards
- Lazy loading components
- Request caching system
- AI timeout reduced (180s → 60s)
- Skeleton loaders

**Deployment Checklist**:
- [ ] Build completes successfully
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible
- [ ] Social media previews work
- [ ] Lighthouse scores improved

**Verification**:
```bash
# Test Google Rich Results
# Visit: https://search.google.com/test/rich-results
# Enter: https://your-domain.com

# Test Facebook Debugger
# Visit: https://developers.facebook.com/tools/debug/
# Enter: https://your-domain.com

# Test Twitter Card Validator
# Visit: https://cards-dev.twitter.com/validator
# Enter: https://your-domain.com
```

### HTML/CSS Error Fixes

**Status**: ✅ Complete

**Key Changes**:
- Enhanced HTML quality guard
- Fixed placeholder detection
- Pre-validation module added
- AutoGen fixer improvements

**Deployment Checklist**:
- [ ] Pre-validation module deployed
- [ ] Enhanced prompts active
- [ ] Placeholder detection working
- [ ] Error rate <3 per generation

**Expected Results** (after 24 hours):
- First-pass success: 30% → 70%
- AutoGen success: 20% → 60%
- Avg validation errors: 15 → 0-2

**Monitoring Queries**:
```sql
-- Check validation error trends
SELECT DATE(created), AVG(error_count)
FROM validation_logs
WHERE created >= datetime('now', '-7 days')
GROUP BY DATE(created);

-- Check AutoGen success rate
SELECT
  success,
  COUNT(*) as count
FROM autogen_attempts
WHERE created >= datetime('now', '-24 hours')
GROUP BY success;
```

---

## Troubleshooting

### Build Errors

**Issue**: TypeScript errors during build

**Solution**:
```bash
# Check for errors
npx tsc --noEmit

# Fix or suppress specific errors
# Add to tsconfig.json:
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Cron Jobs Not Running

**Issue**: Cron endpoint not executing

**Solutions**:
1. Verify CRON_SECRET is set correctly
2. Check Vercel cron configuration
3. Test endpoint manually
4. Review function logs

```bash
# Manual test
curl -X GET https://your-domain.com/api/cron/smart-daily-reset \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

### Database Connection Errors

**Issue**: Cannot connect to PocketBase

**Solutions**:
1. Verify NEXT_PUBLIC_POCKETBASE_URL is correct
2. Check PocketBase is running
3. Verify network access
4. Check CORS settings

```bash
# Test PocketBase
curl https://your-pocketbase-url.com/api/health
```

### Performance Issues

**Issue**: Slow page loads

**Solutions**:
1. Check cache is working (60s TTL)
2. Verify lazy loading enabled
3. Review Lighthouse audit
4. Check API response times

```bash
# Test cache
curl -I https://your-domain.com/api/credits
# Look for cache headers
```

### SEO Not Indexing

**Issue**: Google not finding sitemap

**Solutions**:
1. Submit sitemap to Google Search Console
2. Verify robots.txt allows crawling
3. Check sitemap.xml is valid
4. Wait 1-2 weeks for indexing

```bash
# Validate sitemap
curl https://your-domain.com/sitemap.xml | xmllint --format -
```

---

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Git Rollback

```bash
# View commit history
git log --oneline -10

# Revert last commit
git revert HEAD

# Or rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Database Rollback

**⚠️ Warning**: Database rollbacks can cause data loss

```bash
# Backup current database
cd deployment-server
cp pb_data/data.db pb_data/data.db.backup

# Restore from backup
cp pb_data/data.db.backup.<date> pb_data/data.db

# Restart PocketBase
pm2 restart vb-backend
```

### Feature Flag Rollback

If a feature is causing issues, use feature flags to disable:

```bash
# In Vercel environment variables
USE_LANGGRAPH=false

# Redeploy or restart
vercel --prod
```

---

## Monitoring & Metrics

### Key Metrics to Track

**Performance**:
- Page load time (target: <3s)
- API response time (target: <500ms)
- Credit loading (target: <50ms)
- AI generation time (target: <60s)

**Usage**:
- Daily active users
- Apps generated per day
- Token consumption
- Error rate

**Quality**:
- Validation error count (target: <3)
- First-pass success rate (target: >70%)
- AutoGen success rate (target: >60%)

### Monitoring Tools

**Built-in**:
- Vercel Analytics
- PocketBase admin UI logs
- Browser console (for errors)

**Recommended**:
- Google Search Console (SEO)
- Lighthouse CI (performance)
- Sentry (error tracking)
- PostHog (analytics)

---

## Support & Documentation

### Documentation Files

- [#done_TECHNICAL_REFERENCE.md](#done_TECHNICAL_REFERENCE.md) - Complete architecture
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - File index
- [DOCUMENTATION_AND_PLANNING_RULES.md](DOCUMENTATION_AND_PLANNING_RULES.md) - Standards
- [README.md](README.md) - Project overview

### Getting Help

1. **Check documentation** - Most answers are documented
2. **Review logs** - Vercel logs, PocketBase logs, browser console
3. **Test locally** - Reproduce issue in development
4. **Search issues** - GitHub issues or internal docs

---

## Deployment Checklist Template

Copy this for each deployment:

```markdown
## Deployment: [Feature Name] - [Date]

### Pre-Deployment
- [ ] Code reviewed
- [ ] Tests pass
- [ ] Build successful
- [ ] Documentation updated
- [ ] Environment variables configured

### Deployment
- [ ] Changes committed
- [ ] Deployed to staging (if applicable)
- [ ] Deployed to production
- [ ] Cron jobs configured

### Post-Deployment
- [ ] Health checks pass
- [ ] SEO verified
- [ ] Performance tested
- [ ] Functional tests pass
- [ ] Monitoring active

### Results
- **Deployment Time**: _____
- **Issues Encountered**: _____
- **Resolution**: _____
- **Metrics After 24h**: _____
```

---

## Summary

This guide covers deployment for:
- ✅ Credit system performance optimizations
- ✅ SEO and performance improvements
- ✅ HTML/CSS error fixes
- ✅ General VB platform deployment

**Expected Deployment Time**: 30-60 minutes
**Rollback Time**: 5-10 minutes
**Zero Downtime**: Yes (with Vercel)

---

**Last Updated**: 2025-10-26
**Status**: Production Ready ✅
**Next Review**: After each major release
