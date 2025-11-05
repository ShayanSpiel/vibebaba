# Modern SaaS Design System - Production Quality

## **COLOR PALETTE** (Dark Mode First)

### Background
- **Primary BG**: `#0A0A0A` (Almost black, not pure black)
- **Card/Elevated**: `#111111` with subtle border `#1A1A1A`
- **Hover State**: `#161616`

### Text
- **Primary**: `#FFFFFF` (Pure white)
- **Secondary**: `#A0A0A0` (Muted gray)
- **Tertiary**: `#666666` (Subtle gray)

### Brand Colors
- **Primary (Accent)**: `#3B82F6` (Vibrant blue)
- **Primary Hover**: `#2563EB`
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

### Gradients
- **Hero Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Card Gradient**: `linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)`
- **Accent Gradient**: `linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)`

---

## **TYPOGRAPHY**

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', system-ui, sans-serif;
```

### Scale
- **Hero (H1)**: `clamp(40px, 5vw, 72px)` | Weight: 700 | Line-height: 1.1 | Letter-spacing: -0.02em
- **Heading (H2)**: `clamp(32px, 4vw, 48px)` | Weight: 600 | Line-height: 1.2
- **Subheading (H3)**: `clamp(24px, 3vw, 32px)` | Weight: 600 | Line-height: 1.3
- **Body Large**: `18px` | Weight: 400 | Line-height: 1.6
- **Body**: `16px` | Weight: 400 | Line-height: 1.6
- **Small**: `14px` | Weight: 400 | Line-height: 1.5
- **Caption**: `12px` | Weight: 500 | Line-height: 1.4 | Letter-spacing: 0.03em | Text-transform: uppercase

---

## **SPACING SYSTEM** (8px Base Grid)

- `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px`
- **Section Padding**: `96px` vertical, `24px` horizontal (mobile: `64px` vertical)
- **Card Padding**: `24px` (mobile: `16px`)
- **Button Padding**: `12px 24px`
- **Input Padding**: `12px 16px`

---

## **COMPONENTS**

### **Buttons**
```css
/* Primary */
background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
padding: 12px 32px;
border-radius: 12px;
font-weight: 600;
font-size: 16px;
transition: transform 0.2s, box-shadow 0.2s;
box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);

/* Hover */
transform: translateY(-2px);
box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);

/* Secondary */
background: #111111;
border: 1px solid #1A1A1A;
color: #FFFFFF;
```

### **Cards**
```css
background: #111111;
border: 1px solid #1A1A1A;
border-radius: 16px;
padding: 24px;
transition: border-color 0.3s, transform 0.3s;

/* Hover */
border-color: #3B82F6;
transform: translateY(-4px);
box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
```

### **Inputs**
```css
background: #0A0A0A;
border: 1px solid #1A1A1A;
border-radius: 12px;
padding: 12px 16px;
font-size: 16px;
color: #FFFFFF;
transition: border-color 0.2s, box-shadow 0.2s;

/* Focus */
border-color: #3B82F6;
box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
outline: none;
```

### **Navigation**
```css
background: rgba(10, 10, 10, 0.8);
backdrop-filter: blur(12px);
border-bottom: 1px solid #1A1A1A;
padding: 16px 0;
position: sticky;
top: 0;
z-index: 100;
```

---

## **LAYOUTS**

### **Hero Section**
- Full viewport height with gradient background
- Centered content with max-width: 800px
- Large heading + subheading + CTA button
- Subtle floating animation on elements

### **Feature Grid**
- 3 columns on desktop, 1 on mobile
- Gap: 32px
- Each card with icon, title, description
- Hover effect: lift and glow

### **Dashboard Layout**
- Sidebar: 280px width, fixed position
- Main content: calc(100% - 280px) with padding 32px
- Top bar: 64px height, sticky

---

## **ANIMATIONS & EFFECTS**

### **Glassmorphism**
```css
background: rgba(17, 17, 17, 0.6);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### **Subtle Animations**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeInUp 0.6s ease-out;
}
```

### **Transitions**
- All interactive elements: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
- Page loads: Stagger fade-in (0.1s delay between elements)

---

## **MODERN PATTERNS**

1. **Subtle Grid Background**
   ```css
   background-image:
     linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
     linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
   background-size: 64px 64px;
   ```

2. **Floating Cards** - Add subtle shadow and transform on hover
3. **Gradient Text**
   ```css
   background: linear-gradient(90deg, #3B82F6, #8B5CF6);
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
   ```

4. **Glow Effects** on hover
5. **Smooth Page Transitions**

---

## **RESPONSIVE BREAKPOINTS**

- Mobile: `max-width: 768px`
- Tablet: `768px - 1024px`
- Desktop: `1024px+`

### Mobile Adjustments
- Reduce font sizes by 20-30%
- Stack columns vertically
- Reduce padding/margins by 50%
- Hide complex animations
- Simplify navigation to hamburger menu

---

## **QUALITY CHECKLIST**

✅ Dark mode optimized
✅ Smooth transitions on ALL interactive elements
✅ Proper hover states (lift + glow)
✅ Consistent border radius (12-16px)
✅ Gradient accents for visual interest
✅ Proper spacing (8px grid system)
✅ Typography hierarchy (clear size differences)
✅ Mobile responsive (stack, scale fonts)
✅ Loading states (skeleton loaders)
✅ Focus states for accessibility
