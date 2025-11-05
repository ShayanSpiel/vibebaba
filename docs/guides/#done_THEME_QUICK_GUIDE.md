# 🎨 Quick Theme Change Guide

## Change Theme in 10 Seconds

### Step 1: Open Theme Config
Open [`lib/theme/theme-config.ts`](lib/theme/theme-config.ts)

### Step 2: Find This Line (around line 221)
```typescript
export const activeTheme = warmOrangeTheme;
```

### Step 3: Change to One of These

```typescript
// Option 1: Cool Blue (Modern, Professional)
export const activeTheme = coolBlueTheme;

// Option 2: Purple Dream (Creative, Vibrant)
export const activeTheme = purpleDreamTheme;

// Option 3: Green Nature (Eco, Calm)
export const activeTheme = greenNatureTheme;

// Option 4: Warm Orange (Default)
export const activeTheme = warmOrangeTheme;
```

### Step 4: Save
The entire app updates instantly! ✨

---

## Preview Themes

### Warm Orange (Default)
- Primary: Orange `#BC6C25`
- Accent: Teal `#3A7D8E`
- Feel: Warm, professional, approachable

### Cool Blue
- Primary: Blue `#2563EB`
- Accent: Purple `#7C3AED`
- Feel: Modern, tech-forward, trustworthy

### Purple Dream
- Primary: Purple `#9333EA`
- Accent: Pink `#EC4899`
- Feel: Creative, energetic, bold

### Green Nature
- Primary: Green `#059669`
- Accent: Lime `#65A30D`
- Feel: Natural, eco-friendly, fresh

---

## Create Your Own Theme

Add this to [`lib/theme/theme-config.ts`](lib/theme/theme-config.ts) before the `activeTheme` line:

```typescript
export const myTheme: ColorPalette = {
  name: "My Theme",
  colors: {
    // Just change these hex colors!
    brandPrimary: "#YOUR_COLOR",
    brandPrimaryHover: "#DARKER_SHADE",
    brandPrimaryLight: "#LIGHTER_SHADE",
    brandPrimaryPale: "#VERY_LIGHT",
    brandPrimarySubtle: "#ALMOST_WHITE",

    accentDefault: "#ACCENT_COLOR",
    accentLight: "#ACCENT_LIGHT",
    accentPale: "#ACCENT_PALE",
    accentHover: "#ACCENT_DARK",

    // Copy these from any existing theme
    backgroundBase: "#FAFAFA",
    backgroundRaised: "#FFFFFF",
    backgroundOverlay: "#FFFFFF",
    backgroundSunken: "#F5F5F5",
    backgroundSubtle: "#EEEEEE",

    textPrimary: "#1A1A1A",
    textSecondary: "#4A4A4A",
    textTertiary: "#6A6A6A",
    textSubtle: "#9A9A9A",
    textInverse: "#FFFFFF",

    borderSubtle: "#F0F0F0",
    borderLight: "#E0E0E0",
    borderDefault: "#D0D0D0",
    borderStrong: "#B0B0B0",
    borderFocus: "#YOUR_COLOR",  // Usually same as primary
    borderFocusLight: "#LIGHTER_SHADE",

    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
  },
};

// Then use it:
export const activeTheme = myTheme;
```

---

## Pro Tips

✅ **No Rebuild Needed** - Just save the file and see changes instantly

✅ **Works Everywhere** - All components that use semantic colors update automatically

✅ **Safe to Experiment** - Just change back to `warmOrangeTheme` if you don't like it

✅ **Use Semantic Names** - Components should use `bg-brand-primary`, not hardcoded colors

---

## That's It!

You can now change your entire app's color scheme in seconds. 🎉

For more details, see [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
