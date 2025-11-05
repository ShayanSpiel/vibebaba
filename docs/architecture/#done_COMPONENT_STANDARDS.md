# Component Standards & Sizing Guide

## Overview

This document defines consistent sizing, spacing, and styling standards for all components in the Vibebaba app.

---

## 🎯 Button Standards

### Size Classes

All buttons should use one of three standard sizes:

#### Small (`btn-sm`)
```tsx
<button className="btn-sm bg-brand-primary text-white">
  Small Button
</button>
```
- **Padding**: `8px 16px` (0.5rem 1rem)
- **Font Size**: `14px` (0.875rem)
- **Min Height**: `36px` (2.25rem)
- **Border Radius**: `8px` (0.5rem)
- **Use For**: Secondary actions, compact UIs, mobile

#### Medium (`btn-md` or `btn`) - **Default**
```tsx
<button className="btn bg-brand-primary text-white">
  Medium Button
</button>
```
- **Padding**: `10px 24px` (0.625rem 1.5rem)
- **Font Size**: `16px` (1rem)
- **Min Height**: `44px` (2.75rem)
- **Border Radius**: `8px` (0.5rem)
- **Use For**: Primary actions, most use cases

#### Large (`btn-lg`)
```tsx
<button className="btn-lg bg-brand-primary text-white">
  Large Button
</button>
```
- **Padding**: `12px 32px` (0.75rem 2rem)
- **Font Size**: `18px` (1.125rem)
- **Min Height**: `52px` (3.25rem)
- **Border Radius**: `12px` (0.75rem)
- **Use For**: Hero CTAs, important actions

### Button Variants

#### Primary
```tsx
<button className="btn bg-brand-primary hover:bg-brand-primary-hover text-text-inverse">
  Primary
</button>
```

#### Secondary
```tsx
<button className="btn bg-background-raised border-2 border-border-default hover:bg-background-subtle text-text-primary">
  Secondary
</button>
```

#### Outline
```tsx
<button className="btn border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-text-inverse">
  Outline
</button>
```

#### Ghost
```tsx
<button className="btn hover:bg-background-subtle text-text-primary">
  Ghost
</button>
```

#### Danger
```tsx
<button className="btn bg-error hover:opacity-90 text-text-inverse">
  Delete
</button>
```

---

## 📝 Input Standards

### Size Classes

Inputs match button sizes for consistency:

#### Small (`input-sm`)
```tsx
<input
  type="text"
  className="input-sm border border-border-default rounded-lg"
  placeholder="Small input"
/>
```
- **Padding**: `8px 12px`
- **Font Size**: `14px`
- **Min Height**: `36px`

#### Medium (`input-md` or `input`) - **Default**
```tsx
<input
  type="text"
  className="input border border-border-default rounded-lg"
  placeholder="Medium input"
/>
```
- **Padding**: `10px 16px`
- **Font Size**: `16px`
- **Min Height**: `44px`

#### Large (`input-lg`)
```tsx
<input
  type="text"
  className="input-lg border border-border-default rounded-lg"
  placeholder="Large input"
/>
```
- **Padding**: `12px 20px`
- **Font Size**: `18px`
- **Min Height**: `52px`

### Input States

```tsx
// Default
<input className="input border border-border-default" />

// Focus
<input className="input border-2 border-border-focus focus:outline-none" />

// Error
<input className="input border-2 border-error" />

// Success
<input className="input border-2 border-success" />

// Disabled
<input className="input border border-border-light opacity-50 cursor-not-allowed" disabled />
```

---

## 📦 Container Standards

### Padding Classes

#### Small (`container-sm`)
```tsx
<div className="container-sm bg-background-raised border border-border-default rounded-lg">
  Small container
</div>
```
- **Padding**: `16px` (1rem)
- **Use For**: Compact cards, mobile

#### Medium (`container-md` or `container`) - **Default**
```tsx
<div className="container bg-background-raised border border-border-default rounded-lg">
  Medium container
</div>
```
- **Padding**: `24px` (1.5rem)
- **Use For**: Standard cards, content blocks

#### Large (`container-lg`)
```tsx
<div className="container-lg bg-background-raised border border-border-default rounded-lg">
  Large container
</div>
```
- **Padding**: `32px` (2rem)
- **Use For**: Main content areas, modals

#### Extra Large (`container-xl`)
```tsx
<div className="container-xl bg-background-raised border border-border-default rounded-lg">
  Extra large container
</div>
```
- **Padding**: `48px` (3rem)
- **Use For**: Landing sections, hero areas

---

## 📏 Spacing System

### Margin Classes

Use these for consistent spacing:

```tsx
<div className="space-xs">4px margin</div>
<div className="space-sm">8px margin</div>
<div className="space-md">16px margin</div>
<div className="space-lg">24px margin</div>
<div className="space-xl">32px margin</div>
<div className="space-2xl">48px margin</div>
```

### Gap Classes (for Flex/Grid)

```tsx
<div className="flex gap-xs">4px gap</div>
<div className="flex gap-sm">8px gap</div>
<div className="flex gap-md">16px gap</div>
<div className="flex gap-lg">24px gap</div>
<div className="flex gap-xl">32px gap</div>
<div className="flex gap-2xl">48px gap</div>
```

### Spacing Scale Reference

| Class | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `xs` | 0.25rem | 4px | Tight spacing, icon gaps |
| `sm` | 0.5rem | 8px | Small gaps, list items |
| `md` | 1rem | 16px | Default spacing, paragraphs |
| `lg` | 1.5rem | 24px | Section spacing, cards |
| `xl` | 2rem | 32px | Large sections, headings |
| `2xl` | 3rem | 48px | Hero sections, page breaks |

---

## 🎨 Typography Standards

### Headings

All headings use **weight 1000** (Heavy) by default:

```tsx
<h1 className="text-6xl">Main Hero Title</h1>      // 60px, weight 1000
<h2 className="text-5xl">Section Title</h2>        // 48px, weight 1000
<h3 className="text-4xl">Subsection Title</h3>     // 36px, weight 1000
<h4 className="text-3xl">Card Title</h4>           // 30px, weight 1000
<h5 className="text-2xl">Small Heading</h5>        // 24px, weight 1000
<h6 className="text-xl">Tiny Heading</h6>          // 20px, weight 1000
```

### Body Text

Regular text uses **weight 200** (UltraLight):

```tsx
<p className="text-base">Regular paragraph</p>     // 16px, weight 200
<p className="text-sm">Small text</p>              // 14px, weight 200
<p className="text-lg">Large text</p>              // 18px, weight 200
```

### Bold Text

Use **weight 700** (Bold):

```tsx
<p className="font-bold">Bold text</p>             // weight 700
<strong>Important text</strong>                    // weight 700
```

### Font Weights Available

For fine control:

| Weight | Name | Use Case |
|--------|------|----------|
| 100 | Thin | Ultra-light decorative text |
| 200 | UltraLight | **Body text (default)** |
| 300 | Light | Subtle text, captions |
| 400 | Regular | Alternative body text |
| 500 | Medium | Emphasized text |
| 600 | DemiBold | Semi-bold text |
| 700 | Bold | **Strong text** |
| 800 | ExtraBold | Very strong text |
| 900 | Black | Heavy impact text |
| 950 | ExtraBlack | Maximum impact |
| 1000 | Heavy | **Headings (default)** |

---

## 🌐 Farsi-Specific Standards

### Font Weights in Farsi

Farsi uses the same weight system but with IRANSansX:

```tsx
// Automatically applied via [lang="fa"]
<h1>عنوان اصلی</h1>              // IRANSansX weight 1000
<p>متن معمولی</p>                // IRANSansX weight 200
<strong>متن پررنگ</strong>       // IRANSansX weight 700
```

### Farsi Numbers

Numbers automatically display in Farsi when language is Farsi:

```tsx
// In English: 1234
// In Farsi: ۱۲۳۴
<p lang="fa">{1234}</p>  // Shows ۱۲۳۴
```

This is handled automatically by the `IRANSansXFaNum` font.

---

## 🧩 Component Composition Examples

### Card with Consistent Sizing

```tsx
<div className="container bg-background-raised border border-border-default rounded-lg">
  <h3 className="text-2xl mb-4">Card Title</h3>
  <p className="text-base mb-6">
    Card description text with proper spacing.
  </p>
  <div className="flex gap-sm">
    <button className="btn bg-brand-primary text-text-inverse">
      Primary Action
    </button>
    <button className="btn border-2 border-border-default text-text-primary">
      Cancel
    </button>
  </div>
</div>
```

### Form with Consistent Inputs

```tsx
<form className="container-lg">
  <div className="mb-4">
    <label className="block mb-2 text-sm">Email</label>
    <input
      type="email"
      className="input w-full border border-border-default rounded-lg"
      placeholder="your@email.com"
    />
  </div>

  <div className="mb-6">
    <label className="block mb-2 text-sm">Password</label>
    <input
      type="password"
      className="input w-full border border-border-default rounded-lg"
      placeholder="••••••••"
    />
  </div>

  <button className="btn-lg w-full bg-brand-primary text-text-inverse">
    Sign In
  </button>
</form>
```

### Button Group

```tsx
<div className="flex gap-sm">
  <button className="btn bg-brand-primary text-text-inverse">Save</button>
  <button className="btn border-2 border-border-default">Cancel</button>
  <button className="btn-sm text-text-secondary">Reset</button>
</div>
```

---

## ✅ Design Checklist

When creating a new component, ensure:

- [ ] Buttons use `btn-sm`, `btn-md`, or `btn-lg` classes
- [ ] Inputs use `input-sm`, `input-md`, or `input-lg` classes
- [ ] Containers use `container-sm/md/lg/xl` for padding
- [ ] Spacing uses `gap-*` or `space-*` utilities
- [ ] Colors use semantic names from theme system
- [ ] Typography uses standard weight (200 for text, 1000 for headings)
- [ ] Component works in both LTR and RTL modes
- [ ] Component works in both English and Farsi

---

## 🚫 Common Mistakes to Avoid

### ❌ Inconsistent Button Sizes
```tsx
// Bad - custom padding
<button className="px-5 py-2.5">Click me</button>

// Good - use standard class
<button className="btn">Click me</button>
```

### ❌ Random Spacing Values
```tsx
// Bad - arbitrary spacing
<div className="mb-7">Content</div>

// Good - use spacing system
<div className="mb-lg">Content</div>
```

### ❌ Hardcoded Colors
```tsx
// Bad - hardcoded colors
<button className="bg-orange-500">Click</button>

// Good - semantic colors
<button className="bg-brand-primary">Click</button>
```

### ❌ Inconsistent Font Weights
```tsx
// Bad - random weights
<h1 className="font-semibold">Title</h1>

// Good - standard weight (automatic)
<h1>Title</h1>  {/* automatically weight 1000 */}
```

---

## 📱 Responsive Sizing

Components automatically adapt to screen size using Tailwind's responsive utilities:

```tsx
// Responsive button
<button className="btn-sm md:btn-md lg:btn-lg">
  Responsive
</button>

// Responsive container
<div className="container-sm md:container-md lg:container-lg">
  Content
</div>

// Responsive spacing
<div className="gap-sm md:gap-md lg:gap-lg">
  Items
</div>
```

---

## 🎯 Quick Reference

### Most Common Classes

```tsx
// Buttons
.btn            // Default button (44px height)
.btn-sm         // Small button (36px height)
.btn-lg         // Large button (52px height)

// Inputs
.input          // Default input (44px height)
.input-sm       // Small input (36px height)
.input-lg       // Large input (52px height)

// Containers
.container      // Default padding (24px)
.container-lg   // Large padding (32px)

// Spacing
.gap-sm         // 8px gap
.gap-md         // 16px gap
.gap-lg         // 24px gap
```

---

**Last Updated:** October 20, 2025
**Version:** 1.0.0
**See Also:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
