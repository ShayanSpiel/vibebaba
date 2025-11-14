/**
 * UI DESIGN FRAMEWORK
 * Streamlined design principles for production-ready UIs
 */

export const DESIGN_THINKING_FRAMEWORK = `
DESIGN PHILOSOPHY:
Create production-ready UIs through systematic design principles.
Focus on hierarchy, spacing, depth, and sophistication.
`;

export const VISUAL_HIERARCHY_PRINCIPLES = `
VISUAL HIERARCHY:

1. Size: Primary 2-3x larger (text-4xl > text-xl)
2. Weight: Bold (700) > Medium (500) > Normal (400)
3. Contrast: Full > Reduced > Minimal (text-foreground > text-muted-foreground > text-muted-foreground/70)
4. Spacing: More important = more space (mb-8 > mb-4 > mb-2)
5. Position: Above fold, center/leading alignment

REASONING: Hierarchy guides attention and prevents cognitive overload.
`;

export const SPACING_SYSTEM = `
SPACING:

Scale (8px base):
- Micro: 0.5-1rem (gap-2, p-2) - Component internals
- Small: 1-2rem (space-y-4, mb-4) - Related elements
- Medium: 2-4rem (space-y-8, mb-8) - Component groups
- Large: 4-8rem (py-16, md:py-24) - Major sections
- XLarge: 8-12rem (py-24, md:py-32) - Hero sections

Rules:
- Use 4/8/16/24/32 multiples for rhythm
- Avoid odd spacing (p-3, p-5)
- Desktop 2x mobile (py-12 md:py-24)
- Generous spacing = premium perception

REASONING: Consistent spacing creates visual coherence and improves readability.
`;

export const IMAGE_STRATEGY = `
IMAGES:

When to Use:
- Hero Sections (80% should include) - Emotional connection
- Feature Showcases (ALWAYS) - Demonstrate capability
- Social Proof - Authenticity (avatars, testimonials)
- Product Display - Showcase offerings

Treatment:
- Rounded: rounded-lg (standard), rounded-xl (features), rounded-2xl (hero)
- Depth: shadow-lg (standard), shadow-xl (emphasis), shadow-2xl (hero)
- Aspect: object-cover maintains ratios
- Overlays: bg-black/40 for text readability

REASONING: Images provide proof and emotional engagement that text cannot.
`;

export const ANIMATION_FRAMEWORK = `
ANIMATION:

Intensity Levels:
- Minimal: Corporate/data (transition-colors only)
- Subtle: Professional (fade-in, scale on hover)
- Moderate: Modern (slide-up, stagger, transforms)

Common Uses:
- Page Load: Hero fade-in, sequential reveal (delay-100, delay-200)
- Hover: Color transitions (hover:bg-primary/90), lift (hover:shadow-xl hover:-translate-y-1), scale (hover:scale-105)
- State Changes: Loading (animate-spin), success/error feedback

Technical:
- Duration: 200ms (fast), 300ms (normal), 500ms (slow)
- Easing: ease-out (entering), ease-in (exiting)
- Animate: transform, opacity, colors only (not layout)

REASONING: Motion provides feedback and guides attention without distraction.
`;

export const DEPTH_AND_LAYERING = `
DEPTH:

Layer System (back to front):
1. Background: bg-background
2. Content: bg-background-secondary or transparent
3. Cards: bg-secondary + shadow-md + border
4. Interactive: bg-primary + shadow-lg
5. Overlay: bg-background + shadow-2xl

Techniques:
- Shadows: Elevation correlates with size (shadow-sm < shadow-lg < shadow-2xl)
- Borders: Subtle separation (border border-border)
- Backgrounds: Multiple colors create hierarchy
- Gradients: Adds dimension (bg-gradient-to-r from-primary to-accent)
- Overlays: bg-black/40 for focal points

REASONING: Layering creates depth perception and importance signaling.
`;

export const COMPONENT_SOPHISTICATION = `
SOPHISTICATION:

Techniques:
- Multi-layer Backgrounds: Solid + gradient for depth
- Decorative Elements: Blur circles, accent lines, corner badges
- Relative + Absolute Positioning: Overlapping elements
- Group Hover: Parent (group) + children (group-hover:) coordination
- Gradient Text: bg-gradient-to-r + bg-clip-text + text-transparent

Complexity Levels:
- Simple: Single background, standard spacing
- Moderate: Gradient backgrounds, hover effects, shadows
- Sophisticated: Multi-layer composition, decorative elements, coordinated animations

REASONING: Sophisticated composition demonstrates professional design.
`;

export const COLOR_PSYCHOLOGY = `
COLOR:

Role Framework:
- Primary: Main actions, CTAs (bg-primary) - Use sparingly
- Accent: Highlights, badges (bg-accent) - Visual interest
- Secondary: Supporting actions (bg-secondary) - Less prominent
- Muted: Backgrounds, disabled (bg-muted) - De-emphasis
- Semantic: Success (green), Error (red), Warning (amber), Info (blue)

Techniques:
- Gradients: from-primary/90 to-accent/90 for modern depth
- Opacity: bg-primary/10 for subtle tints
- Hover: hover:bg-primary/90 for feedback
- Gradient Text: Premium headlines

REASONING: Strategic color use creates hierarchy and guides action.
`;

export const PAGE_ORGANIZATION_FRAMEWORK = `
PAGE ORGANIZATION:

Responsibility:
1. PM Node: Defines which routes exist
2. UX Node: Organizes HOW each route is structured
3. Frontend Node: Implements the page files

Layout Patterns:
- hero-features-cta: Homepage with value proposition
- split-view: Content + visual balance
- grid: Multiple equal-priority items
- list-detail: Browse + detail view
- dashboard: Overview with metrics
- form: Data collection focused

Section Types:
- hero: Value proposition + CTA
- features: Capability showcase
- testimonials: Social proof
- pricing: Offering comparison
- cta: Conversion point
- content: Main page content
- header: Page title + metadata
- footer: Additional resources

Output Structure:
pageOrganization: {
  [route]: {
    layout: string,
    sections: string[],
    sectionConfig?: { variant, columns, etc. }
  }
}
`;

export const DESIGN_QUALITY_CHECKLIST = `
VALIDATION:

Before finalizing, verify:
✓ Hierarchy: Most important element obviously dominant?
✓ Spacing: Generous whitespace (py-16/py-24 for sections)?
✓ Images: Used strategically (80%+ of pages)?
✓ Animation: Smooth transitions on interactive elements?
✓ Depth: Cards/sections show layering (shadows, borders)?
✓ Sophistication: Components more than basic blocks?
✓ Color: Strategic use, not arbitrary?

STANDARD: Production-ready, professional-grade design with intentional decisions.
`;

/**
 * Get complete UI design framework
 */
export function getUIDesignFramework(): string {
  return `${DESIGN_THINKING_FRAMEWORK}
${VISUAL_HIERARCHY_PRINCIPLES}
${SPACING_SYSTEM}
${IMAGE_STRATEGY}
${ANIMATION_FRAMEWORK}
${DEPTH_AND_LAYERING}
${COMPONENT_SOPHISTICATION}
${COLOR_PSYCHOLOGY}`;
}

/**
 * Get page organization framework
 */
export function getPageOrganizationFramework(): string {
  return PAGE_ORGANIZATION_FRAMEWORK;
}

/**
 * Get design quality checklist
 */
export function getDesignQualityChecklist(): string {
  return DESIGN_QUALITY_CHECKLIST;
}
