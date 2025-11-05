# Testing Guide - Credit System & Payment Integration

## Quick Start

Your server is running at: **http://localhost:3003**

## 🧪 Test Checklist

### 1. ✅ Pricing Page
**URL**: http://localhost:3003/pricing

**What to test**:
- [ ] Page loads without errors
- [ ] Currency toggle switches between USD and Toman
- [ ] All 3 package cards display correctly
- [ ] Custom credit selector works
- [ ] Package prices update when currency changes
- [ ] "Get Started" buttons are clickable

**Expected Results**:
- Starter: $5 / 350K Toman
- Pro: $15 / 1.05M Toman (marked as Popular)
- Unlimited: $40 / 2.8M Toman
- Custom: Dropdown with 100K to 5M options

---

### 2. ✅ Homepage Integration
**URL**: http://localhost:3003

**What to test**:
- [ ] Pricing link appears in top menu (left side)
- [ ] Link has coin icon
- [ ] Hover effect works
- [ ] Clicking navigates to pricing page

---

### 3. ✅ Authentication & Profile
**URL**: http://localhost:3003

**What to test**:
- [ ] Sign up for a new account
- [ ] Sign in works
- [ ] Profile dropdown shows in top right
- [ ] Click profile to see token bar in dropdown
- [ ] Token bar shows "0" tokens for new users

**Expected in Profile Dropdown**:
```
[User Name]
[Email]
─────────────
Tokens: 0
[Progress Bar - Red/Empty]
─────────────
Settings
Log out
```

---

### 4. ✅ Settings Page
**URL**: http://localhost:3003/settings

**What to test**:
- [ ] Navigate to Settings from profile dropdown
- [ ] Full token bar displays at top
- [ ] Shows Available and Used tokens
- [ ] Shows daily bonus (if applicable)
- [ ] "Buy More" link navigates to pricing

**Expected Display**:
```
Token Balance
┌─────────────────────────┐
│ Token Balance   Buy More │
│ [Progress Bar]           │
│ Available: 0  Used: 0    │
└─────────────────────────┘
```

---

### 5. 🔥 Payment Flow (Sandbox)

#### Step 1: Initiate Payment
1. Go to pricing page
2. Select any package or custom amount
3. Click "Get Started" or "Purchase Credits"

**Expected**: Redirect to Zarinpal sandbox payment page

#### Step 2: Complete Payment (Sandbox)
Use these test credentials:
- **Card Number**: `6037-9977-9999-9999`
- **CVC**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)

**Expected**: Payment success, redirect back to app

#### Step 3: Verify Success
After payment:
- [ ] Redirected to pricing page with success modal
- [ ] Confetti animation plays
- [ ] Modal shows:
  - Package name (or "Custom Credits")
  - Token amount added
  - Reference ID
- [ ] "Start Creating" and "View Balance" buttons work

#### Step 4: Check Balance
- [ ] Profile dropdown shows new token count
- [ ] Settings page shows updated balance
- [ ] Progress bar is green (full)

---

### 6. ✅ Token Consumption

#### Test AI Usage
1. Create a new project from homepage
2. Enter an app description
3. Click "Create Plan"

**Expected**:
- Plan generates successfully
- Tokens decrease in profile dropdown
- Can view updated balance in settings

#### Test Low Balance
To test insufficient tokens:
1. Use the app until tokens are low
2. Try to create another project

**Expected**:
- Error message: "Insufficient tokens. Please purchase more credits."
- HTTP 402 status code
- User directed to purchase more

---

### 7. ✅ API Endpoints

#### Get Credits (Requires Auth)
```bash
# Will return 401 without auth
curl http://localhost:3003/api/credits
```

**Expected Response** (when authenticated):
```json
{
  "totalTokens": 500000,
  "usedTokens": 0,
  "dailyTokens": 5000,
  "availableTokens": 505000,
  "packageId": "starter",
  "packageExpiry": 1234567890
}
```

#### Create Payment
```bash
curl -X POST http://localhost:3003/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"packageId":"starter","currency":"USD"}'
```

**Expected**: Payment URL for redirect

---

### 8. ⏰ Daily Token Reset

**Cron Endpoint**: http://localhost:3003/api/cron/reset-daily-tokens

**Test**:
```bash
curl -X GET \
  -H "Authorization: Bearer your-secret-key-change-in-production" \
  http://localhost:3003/api/cron/reset-daily-tokens
```

**Expected Response**:
```json
{
  "success": true,
  "resetCount": 0,
  "message": "Reset daily tokens for 0 users"
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Payment Modal Shows Error
**Solution**: Modal has been fixed. Refresh the page and try again.

### Issue: Tokens Don't Decrease
**Solution**:
- Check that user is authenticated
- Verify AI API call completed successfully
- Check browser console for errors

### Issue: Database Error
**Solution**:
- Ensure `data/auth.db` file exists
- Restart the dev server: `npm run dev`

### Issue: 404 on Pricing Page
**Solution**:
- Wait a few seconds for Next.js to compile
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 📊 Database Inspection

To inspect the database directly:

```bash
sqlite3 data/auth.db

# View user credits
SELECT * FROM user_credits;

# View transactions
SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 10;

# View token usage
SELECT * FROM token_usage ORDER BY createdAt DESC LIMIT 10;
```

---

## 🎯 Success Criteria

All features are working if:
- ✅ Pricing page displays correctly
- ✅ Currency toggle works
- ✅ Payment flow completes in sandbox
- ✅ Success modal shows with confetti
- ✅ Token balance updates in profile and settings
- ✅ Tokens consumed during AI operations
- ✅ Low balance warning shows when needed

---

## 🚀 Production Checklist

Before going to production:

1. **Environment Variables**:
   ```env
   ZARINPAL_MERCHANT_ID=your-production-merchant-id
   CRON_SECRET=your-strong-secret-key
   NODE_ENV=production
   ```

2. **Remove Sandbox Mode**:
   - Zarinpal will automatically use production URLs when `NODE_ENV=production`

3. **Set Up Cron Job**:
   ```bash
   # Daily at midnight
   0 0 * * * curl -X GET -H "Authorization: Bearer your-secret" https://yourdomain.com/api/cron/reset-daily-tokens
   ```

4. **Test Production Payment**:
   - Use real card for test transaction
   - Verify payment in Zarinpal dashboard
   - Check credits added correctly

5. **Monitor**:
   - Database size
   - Transaction success rate
   - Token usage patterns
   - Payment failures

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs: `tail -f /tmp/vb-dev.log`
3. Verify database tables exist
4. Ensure environment variables are set

---

**Built with ❤️ for Vibebaba**
**Ready for production! 🎉**
