# Credit System - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

This will install the new `tiktoken` dependency required for accurate token counting.

### 2. Environment Variables

Add to your `.env` file (optional):

```bash
# Optional: Override pricing configuration
PRICING_CONFIG_JSON='{"packages":{"starter":{"prices":{"USD":9.99,"IRT":400000}}}}'
```

## 📊 Features Overview

### Phase 2: Centralized Pricing
- ✅ Single configuration source in `lib/config/pricing-config.ts`
- ✅ Environment variable override via `PRICING_CONFIG_JSON`
- ✅ 5-minute cache for performance
- ✅ Automatic currency conversion (USD ↔ Toman ↔ Rials)

### Phase 3: Accurate Token Estimation
- ✅ Tiktoken-based token counting (accurate vs rough `char/3` estimation)
- ✅ Credit reservation system (prevents overspending)
- ✅ 20% safety buffer
- ✅ Pre-flight credit checks

### Admin Panel
- ✅ Full pricing management UI at `/admin/pricing`
- ✅ Package pricing control
- ✅ Exchange rate management
- ✅ Per-token pricing configuration
- ✅ Credit system statistics

## 🔑 Admin Access

### Setting Up Admin User

1. Open PocketBase admin panel: `http://localhost:8090/_/`
2. Go to **Collections** → **users**
3. Edit your user
4. Set `role` field to `"admin"`
5. Save

### Accessing Admin Panel

Visit: `http://localhost:3000/admin/pricing`

## 💰 How Pricing Works

### Current Pricing (Default)

| Package | Monthly Tokens | Daily Bonus | USD Price | Toman Price |
|---------|----------------|-------------|-----------|-------------|
| Starter | 500,000 | 5,000 | $5 | 350,000 |
| Pro | 2,000,000 | 20,000 | $15 | 1,050,000 |
| Unlimited | 10,000,000 | 50,000 | $40 | 2,800,000 |

**Custom Credits:** $1 per 100,000 tokens (70,000 Toman per 100,000 tokens)

**Exchange Rate:** 1 USD = 70,000 Toman = 700,000 Rials

### Changing Pricing

#### Method 1: Admin UI (Recommended)
1. Go to `/admin/pricing`
2. Edit packages, exchange rates, or per-token pricing
3. Click "Save Configuration"
4. Copy the generated `PRICING_CONFIG_JSON` environment variable
5. Add to your `.env` file
6. Restart server

#### Method 2: Direct Environment Variable
```bash
PRICING_CONFIG_JSON='{"packages":{"pro":{"prices":{"USD":19.99,"IRT":1400000}}}}'
```

## 🔄 Credit Flow

### User Makes Request

1. **Estimation** - System estimates tokens needed using tiktoken
2. **Reservation** - Credits reserved upfront (estimate + 20% buffer)
3. **Check** - Returns 402 if insufficient credits
4. **Execution** - Workflow runs
5. **Consumption** - Reserved credits consumed
6. **Completion** - Unused credits returned to pool

### Example Flow

```typescript
// 1. User has 100,000 tokens available
// 2. Request estimated at 10,000 tokens
// 3. System reserves 12,000 tokens (20% buffer)
// 4. Available drops to 88,000 tokens
// 5. Workflow executes
// 6. System consumes 12,000 tokens
// 7. Final balance: 88,000 tokens
```

## 🎯 API Endpoints

### Public Endpoints

```bash
# Get current pricing
GET /api/pricing/packages

# Create payment
POST /api/payment/create
Body: { packageId: "pro", currency: "USD" }

# Verify payment
GET /api/payment/verify?Authority=xxx&transactionId=xxx

# Estimate workflow cost
POST /api/credits/estimate
Body: { workflow: { nodes: [...] } }
```

### Admin Endpoints (Require Admin Role)

```bash
# Get pricing config
GET /api/admin/pricing/config

# Save pricing config
POST /api/admin/pricing/config
Body: { packages: {...}, currency: {...}, customCredits: {...} }

# Update single package
PATCH /api/admin/pricing/packages/pro
Body: { prices: { USD: 19.99, IRT: 1400000 } }

# Update exchange rates
PATCH /api/admin/pricing/exchange-rates
Body: { USD_TO_IRT: 75000, USD_TO_RIALS: 750000 }

# Update custom credit pricing
PATCH /api/admin/pricing/custom-credits
Body: { priceUSD: 1.5, priceIRT: 105000, unitSize: 100000 }

# Get credit statistics
GET /api/admin/credits/stats
```

## 🐛 Troubleshooting

### Issue: 402 Insufficient Credits
**Solution:** User needs to purchase more credits at `/pricing`

### Issue: Admin endpoints return 401
**Solution:**
1. Check user has `role: "admin"` in PocketBase
2. Verify `pb_auth` cookie exists
3. Check browser console for auth errors

### Issue: Pricing changes not applying
**Solution:**
1. Verify `PRICING_CONFIG_JSON` environment variable is set
2. Restart the server
3. Check server logs for parsing errors

### Issue: Token estimation seems off
**Solution:**
- System uses tiktoken for accurate counting
- 20% buffer is intentional (prevents edge case failures)
- Check `estimatedCost` in 402 error response

## 📈 Monitoring

### Credit Statistics

Visit `/admin/pricing` and check the stats (if implemented in UI), or call:

```bash
GET /api/admin/credits/stats
```

Returns:
- Total users and active subscribers
- Total tokens purchased/used/available
- Utilization rate
- Revenue (last 30 days)
- Usage by endpoint
- Distribution by package and credit range

## 🔐 Security

### Admin Authentication
- Uses PocketBase `role` field
- Admin-only endpoints check `checkAdminAccess()`
- Non-admin users get 401 Unauthorized

### Credit Safety
- Pre-flight checks prevent overspending
- Reservations expire after 30 minutes
- Automatic cleanup every 5 minutes
- 20% buffer prevents edge case failures

## 📚 Code References

### Key Files

**Pricing Configuration:**
- [lib/config/pricing-config.ts](../lib/config/pricing-config.ts) - Centralized pricing

**Token Estimation:**
- [lib/credits/token-estimator.ts](../lib/credits/token-estimator.ts) - Tiktoken-based estimation
- [lib/credits/reservation-manager.ts](../lib/credits/reservation-manager.ts) - Credit reservations
- [lib/langgraph/credit-aware-workflow.ts](../lib/langgraph/credit-aware-workflow.ts) - Workflow integration

**Admin:**
- [lib/admin-auth.ts](../lib/admin-auth.ts) - Admin authentication
- [app/admin/pricing/page.tsx](../app/admin/pricing/page.tsx) - Admin UI

**API Routes:**
- [app/api/pricing/packages/route.ts](../app/api/pricing/packages/route.ts) - Public pricing
- [app/api/admin/pricing/config/route.ts](../app/api/admin/pricing/config/route.ts) - Admin config
- [app/api/credits/estimate/route.ts](../app/api/credits/estimate/route.ts) - Estimation endpoint

## 🎉 What's New

### vs. Old System

| Feature | Old | New |
|---------|-----|-----|
| Token Estimation | Rough (`char/3`) | Accurate (tiktoken) |
| Pre-flight Check | ❌ | ✅ Credit reservation |
| Pricing Changes | Code deployment | Environment variable |
| Admin UI | ❌ | ✅ Full pricing management |
| Credit Safety | Basic | 20% buffer + reservations |
| Performance | N/A | 5-minute cache |
| Multi-currency | Hardcoded rates | Configurable exchange rates |

## 🚢 Deployment Checklist

- [ ] Run `npm install` to install tiktoken
- [ ] Set up admin user in PocketBase (role: "admin")
- [ ] Test credit estimation endpoint
- [ ] Test payment creation and verification
- [ ] Test admin pricing UI
- [ ] Configure `PRICING_CONFIG_JSON` if needed
- [ ] Verify exchange rates are correct
- [ ] Test insufficient credits flow (402 response)
- [ ] Monitor credit statistics

---

**Need Help?** Check the full documentation:
- [Endpoint Verification and Fixes](./plans/#done_ENDPOINT_VERIFICATION_AND_FIXES.md)
- [Admin Pricing Management](./plans/ADMIN_PRICING_CREDITS_MANAGEMENT.md)
- [Implementation Summary](./plans/#doing_CREDIT_SYSTEM_PHASES_2_3_IMPLEMENTATION.md)
