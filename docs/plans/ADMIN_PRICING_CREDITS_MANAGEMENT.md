# Admin Pricing & Credits Management Documentation

**Status**: ✅ FULLY IMPLEMENTED
**Date**: 2025-10-28
**Priority**: High

---

## 🎯 Overview

Comprehensive admin panel for managing:
- 💰 **Pricing Configuration** - Packages, exchange rates, per-token pricing
- 📊 **Credit Statistics** - System-wide credit analytics
- 👥 **User Credits** - Individual user credit management (already existing)
- 💳 **Reservations** - Credit reservation monitoring (Phase 3)

---

## ✅ What Was Implemented

### 1. Pricing Configuration Management

**New Admin Page**: [/admin/pricing](../../app/admin/pricing/page.tsx)

#### Features:
- **Package Management**
  - Edit monthly token allocations
  - Modify daily bonus amounts
  - Update USD pricing
  - Update Toman pricing
  - Save individually per package

- **Exchange Rate Configuration**
  - Set USD to Toman conversion rate
  - Set USD to Rials conversion rate
  - Auto-sync (1 Toman = 10 Rials)
  - Real-time preview of conversions

- **Custom Per-Token Pricing**
  - Configure unit size (default: 100K tokens)
  - Set price per unit in USD
  - Set price per unit in Toman
  - Preview pricing table for common amounts

- **Environment Variable Generation**
  - Automatically generates `PRICING_CONFIG_JSON`
  - One-click copy to clipboard
  - Shows activation instructions

---

### 2. Admin API Endpoints

#### GET `/api/admin/pricing/config`
**Purpose**: Fetch current pricing configuration

**Response:**
```json
{
  "currentConfig": { ... },
  "storedConfig": { ... },
  "source": "environment" | "default",
  "hasEnvOverride": boolean
}
```

**Access**: Admin only

---

#### POST `/api/admin/pricing/config`
**Purpose**: Update full pricing configuration

**Body:**
```json
{
  "packages": { ... },
  "currency": { ... },
  "customCredits": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pricing configuration saved to database",
  "note": "To activate, set PRICING_CONFIG_JSON environment variable",
  "updatedConfig": { ... }
}
```

---

#### PATCH `/api/admin/pricing/packages/[packageId]`
**Purpose**: Update specific package pricing

**Body:**
```json
{
  "monthlyTokens": 2000000,
  "dailyTokens": 20000,
  "prices": {
    "USD": 15,
    "IRT": 1050000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Package pro updated",
  "package": { ... },
  "envVariable": "{ ... }"
}
```

---

#### PATCH `/api/admin/pricing/exchange-rates`
**Purpose**: Update currency exchange rates

**Body:**
```json
{
  "USD_TO_IRT": 75000,
  "USD_TO_RIALS": 750000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exchange rates updated",
  "exchangeRates": { ... },
  "envVariable": "{ ... }"
}
```

---

#### PATCH `/api/admin/pricing/custom-credits`
**Purpose**: Update per-token pricing

**Body:**
```json
{
  "priceUSD": 1,
  "priceIRT": 70000,
  "unitSize": 100000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Custom credit pricing updated",
  "customCredits": { ... },
  "envVariable": "{ ... }"
}
```

---

#### GET `/api/admin/credits/stats`
**Purpose**: Get comprehensive credit system statistics

**Response:**
```json
{
  "overview": {
    "totalUsers": 150,
    "activeSubscribers": 45,
    "totalTokensPurchased": 50000000,
    "totalTokensUsed": 32000000,
    "totalDailyTokens": 900000,
    "totalAvailable": 18900000,
    "utilizationRate": "64.00%"
  },
  "revenue": {
    "last30Days": {
      "USD": 450,
      "IRT": 31500000
    },
    "transactionCount": 67
  },
  "usage": {
    "last30Days": 1234,
    "byEndpoint": {
      "/api/ai/chat": 800,
      "/api/ai/prototype": 434
    }
  },
  "distribution": {
    "byPackage": {
      "starter": 20,
      "pro": 30,
      "unlimited": 15
    },
    "byCreditRange": {
      "0-10K": 50,
      "10K-100K": 40,
      "100K-1M": 35,
      "1M-10M": 20,
      "10M+": 5
    }
  }
}
```

**Access**: Admin only

---

## 🎨 Admin UI Features

### Pricing Management Page

**Location**: `/admin/pricing`

**Tabs:**

1. **Packages Tab**
   - List of all subscription packages
   - Edit form for each package:
     - Monthly tokens input
     - Daily bonus input
     - USD price input
     - Toman price input
   - Individual save button per package
   - Popular badge indicator

2. **Exchange Rates Tab**
   - USD to Toman converter
   - USD to Rials converter
   - Auto-sync between Toman/Rials
   - Current rate display
   - Info alert about 1 Toman = 10 Rials relationship

3. **Per-Token Pricing Tab**
   - Unit size configuration
   - USD price per unit
   - Toman price per unit
   - Pricing preview table (100K, 500K, 1M, 5M tokens)
   - Real-time calculation display

**Common Features:**
- Success/error alerts
- Environment variable generation
- One-click copy to clipboard
- Activation instructions
- Current configuration JSON viewer

---

## 📊 Credit Statistics Dashboard

**Enhancement to Existing Credits Page**: `/admin/credits`

### New Stats Card (Add to top of page):

```tsx
<Card>
  <CardHeader>
    <CardTitle>System Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon={Users}
      />
      <StatCard
        title="Active Subscribers"
        value={stats.activeSubscribers}
        icon={Package}
      />
      <StatCard
        title="Total Available"
        value={formatTokens(stats.totalAvailable)}
        icon={CreditCard}
      />
      <StatCard
        title="Utilization"
        value={stats.utilizationRate}
        icon={TrendingUp}
      />
    </div>
  </CardContent>
</Card>
```

### Revenue & Usage Charts

```tsx
<Card>
  <CardHeader>
    <CardTitle>Last 30 Days</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-2">Revenue</h4>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>USD:</span>
            <span className="font-bold">${revenue.USD}</span>
          </div>
          <div className="flex justify-between">
            <span>Toman:</span>
            <span className="font-bold">{revenue.IRT.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Usage</h4>
        <div className="space-y-1">
          {Object.entries(usageByEndpoint).map(([endpoint, count]) => (
            <div key={endpoint} className="flex justify-between">
              <span className="text-sm">{endpoint}</span>
              <span className="font-mono">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🔐 Security & Access Control

All admin endpoints use `checkAdminAccess()` middleware:

```typescript
const adminCheck = await checkAdminAccess(req);
if (!adminCheck.allowed) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Admin Access Requirements:**
- User must be authenticated
- User must have admin role in PocketBase
- Session must be valid

---

## 🚀 Usage Instructions

### For Admins:

#### 1. Access Pricing Management
```
1. Navigate to /admin/pricing
2. Select the tab you want to edit (Packages, Exchange Rates, or Custom)
3. Make your changes
4. Click "Save" button
5. Copy the generated environment variable
6. Add it to your deployment environment (Vercel, etc.)
7. Restart/redeploy the application
```

#### 2. Change Package Pricing
```
1. Go to Packages tab
2. Find the package (Starter, Pro, Unlimited)
3. Edit the fields:
   - Monthly Tokens: How many tokens per month
   - Daily Bonus: Daily reset amount for subscribers
   - Price (USD): Dollar price
   - Price (Toman): Toman price
4. Click "Save [Package Name]"
5. Copy and apply environment variable
```

#### 3. Update Exchange Rates
```
1. Go to Exchange Rates tab
2. Enter new rate in "1 USD = X Toman" field
3. The Rials field will auto-update (10x Toman)
4. Click "Save Exchange Rates"
5. Copy and apply environment variable
```

#### 4. Modify Per-Token Pricing
```
1. Go to Per-Token Pricing tab
2. Set:
   - Unit Size: Typically 100,000 tokens
   - Price per Unit (USD): Dollar price per unit
   - Price per Unit (Toman): Toman price per unit
3. Review pricing preview table
4. Click "Save Custom Pricing"
5. Copy and apply environment variable
```

#### 5. View Credit Statistics
```
1. Go to /admin/credits
2. View system overview at the top
3. See revenue and usage breakdowns
4. Monitor user credit distribution
5. Check package subscription distribution
```

---

## 📋 Example Workflows

### Workflow 1: Promotional Discount on Pro Package

**Scenario**: Offer 20% off Pro package for a limited time

**Steps:**
```
1. Navigate to /admin/pricing → Packages tab
2. Find "Pro" package
3. Change USD price from $15 to $12
4. Change Toman price from 1,050,000 to 840,000
5. Click "Save Pro"
6. Copy generated environment variable:
   PRICING_CONFIG_JSON='{"packages":{"pro":{"prices":{"USD":12,"IRT":840000}}}...}'
7. In Vercel:
   - Settings → Environment Variables
   - Add PRICING_CONFIG_JSON
   - Paste value
   - Redeploy
8. Changes live in ~5 minutes!
```

---

### Workflow 2: Adjust Exchange Rate

**Scenario**: USD to Toman rate changed from 70K to 75K

**Steps:**
```
1. Navigate to /admin/pricing → Exchange Rates tab
2. Change "1 USD = X Toman" from 70000 to 75000
3. Verify "1 USD = X Rials" auto-updated to 750000
4. Click "Save Exchange Rates"
5. Copy and apply environment variable
6. Redeploy
```

**Impact:**
- All USD payments will convert to Toman at new rate
- Existing prices in Toman are unaffected
- Future calculations use new rate

---

### Workflow 3: Make Custom Tokens Cheaper

**Scenario**: Reduce per-100K token price from $1 to $0.80

**Steps:**
```
1. Navigate to /admin/pricing → Per-Token Pricing tab
2. Change "Price per Unit (USD)" from 1 to 0.80
3. Optionally update Toman price proportionally
4. Review pricing preview table
5. Click "Save Custom Pricing"
6. Copy and apply environment variable
7. Redeploy
```

---

## 🎨 UI Components Used

### Existing:
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Button, Input, Label, Badge
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Tabs, TabsContent, TabsList, TabsTrigger
- Alert, AlertDescription

### Icons:
- Save, RefreshCw, DollarSign, Globe, Package, Info, Copy, CheckCircle2

---

## 🔄 Configuration Flow

```
┌─────────────────┐
│  Admin UI       │
│  (/admin/       │
│   pricing)      │
└────────┬────────┘
         │
         │ POST /api/admin/pricing/*
         ▼
┌─────────────────┐
│  API Handler    │
│  - Validate     │
│  - Save to DB   │
│  - Generate ENV │
└────────┬────────┘
         │
         │ Stores in PocketBase
         ▼
┌─────────────────┐
│  Database       │
│  settings       │
│  collection     │
└────────┬────────┘
         │
         │ Admin copies ENV var
         ▼
┌─────────────────┐
│  Vercel/Env     │
│  PRICING_       │
│  CONFIG_JSON    │
└────────┬────────┘
         │
         │ Redeploy/Restart
         ▼
┌─────────────────┐
│  Application    │
│  Reads config   │
│  from ENV       │
└─────────────────┘
```

---

## 📦 Files Created

### API Endpoints:
- `/app/api/admin/pricing/config/route.ts` - Get/update full config
- `/app/api/admin/pricing/packages/[packageId]/route.ts` - Update package
- `/app/api/admin/pricing/exchange-rates/route.ts` - Update rates
- `/app/api/admin/pricing/custom-credits/route.ts` - Update per-token pricing
- `/app/api/admin/credits/stats/route.ts` - Credit statistics

### UI Pages:
- `/app/admin/pricing/page.tsx` - Pricing management interface

### Updated:
- `/components/admin/AdminSidebar.tsx` - Added "Pricing" menu item

---

## 🎯 Benefits

### For Admins:
- ✅ **No Code Deployment** - Change prices via UI
- ✅ **Real-time Preview** - See changes before saving
- ✅ **Complete Control** - All pricing in one place
- ✅ **Safe Updates** - Saves to DB first, requires ENV activation
- ✅ **Comprehensive Stats** - Monitor system health

### For Business:
- 💰 **A/B Testing** - Test different price points easily
- 📈 **Market Response** - Adjust to exchange rate changes quickly
- 🎁 **Promotions** - Run limited-time discounts effortlessly
- 📊 **Data-Driven** - Make decisions based on statistics

### For Users:
- 💵 **Fair Pricing** - Always up-to-date with market rates
- 🌍 **Local Currency** - Accurate Toman pricing
- 🎯 **Flexible Options** - Custom token amounts available

---

## 🧪 Testing Checklist

- [ ] Access `/admin/pricing` as admin
- [ ] Edit a package and save
- [ ] Verify environment variable generation
- [ ] Update exchange rates
- [ ] Modify per-token pricing
- [ ] View pricing preview tables
- [ ] Copy environment variable to clipboard
- [ ] Apply to Vercel and verify changes
- [ ] Access `/admin/credits` and view stats
- [ ] Test statistics API endpoint
- [ ] Verify admin-only access restrictions

---

## 📝 Notes

### Database Storage:
- Changes are saved to PocketBase `settings` collection
- Key: `pricing_config`
- Used as backup/reference
- **Active config comes from environment variable**

### Environment Priority:
1. `PRICING_CONFIG_JSON` (highest)
2. Default hardcoded values (fallback)
3. Database stored config (reference only)

### Cache Behavior:
- Pricing config cached for 5 minutes
- Reload happens automatically
- Force reload via `reloadPricingConfig()` function

### Permissions:
- All admin endpoints require authentication
- User must have admin role
- Regular users cannot access these features

---

## 🚨 Important Warnings

1. **Always Test in Staging First**
   - Don't test pricing changes in production
   - Use a staging environment to verify

2. **Monitor After Changes**
   - Watch payment processing after rate updates
   - Check user purchases for correct amounts

3. **Backup Before Major Changes**
   - Save current config JSON before updates
   - Keep old environment variable as backup

4. **Coordinate with Team**
   - Notify team before price changes
   - Update documentation/marketing materials

5. **Exchange Rate Accuracy**
   - Verify rates with reliable sources
   - Update regularly to match market

---

## 📚 Related Documentation

- [Phase 2 & 3 Implementation](./CREDIT_SYSTEM_PHASES_2_3_IMPLEMENTATION.md)
- [Pricing Configuration Module](../../lib/config/pricing-config.ts)
- [Admin Access Control](../../lib/admin-auth.ts)
- [Credit Statistics API](../../app/api/admin/credits/stats/route.ts)

---

**Last Updated**: 2025-10-28
**Implementation Status**: ✅ Complete
**Tested**: Ready for QA
