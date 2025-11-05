# 🚀 Quick Start - Credit System

## Your Server
**Running at**: http://localhost:3003

---

## 🎯 Test Payment Flow (2 Minutes)

### Step 1: Visit Pricing
```
http://localhost:3003/pricing
```

### Step 2: Select Package
- Click any "Get Started" button
- Or select custom amount from dropdown

### Step 3: Pay (Sandbox)
Use these test credentials:
```
Card: 6037-9977-9999-9999
CVC:  123
Date: 12/25
```

### Step 4: Success! 🎉
- See confetti animation
- Check balance in profile (top right)
- View details in Settings

---

## 📊 Check Your Balance

### Profile Dropdown
- Click your avatar (top right)
- See token bar and balance

### Settings Page
- Click Settings from dropdown
- See full token details at top

---

## 💰 Pricing

| Package | Price | Tokens | Daily |
|---------|-------|--------|-------|
| Starter | $5 | 500K | 5K |
| Pro | $15 | 2M | 20K |
| Unlimited | $40 | 10M | 50K |
| Custom | $1/100K | Any | - |

**Currency**: Toggle USD ⇄ Toman

---

## 🔧 Quick Commands

### Restart Server
```bash
pkill -9 -f "next dev" && npm run dev
```

### Check Database
```bash
sqlite3 data/auth.db "SELECT * FROM user_credits;"
```

### View Logs
```bash
tail -f /tmp/vb-dev.log
```

### Test Credits API
```bash
curl http://localhost:3003/api/credits
# Returns: {"error":"Unauthorized"} - Expected!
```

---

## 📚 Documentation

- **IMPLEMENTATION_SUMMARY.md** - What was built
- **CREDITS_SYSTEM_README.md** - Technical details
- **TESTING_GUIDE.md** - Complete testing steps

---

## ✅ Quick Health Check

Everything working if:
- ✅ Pricing page loads
- ✅ Currency toggle works
- ✅ Payment completes
- ✅ Modal shows confetti
- ✅ Balance updates

---

## 🐛 Troubleshooting

**Issue**: Page not found
**Fix**: Wait 10 seconds, refresh

**Issue**: Payment error
**Fix**: Use test card above

**Issue**: No tokens after payment
**Fix**: Check profile dropdown

---

## 🎊 You're Ready!

Start testing at:
**http://localhost:3003/pricing**

---

Built with ❤️ for Vibebaba
