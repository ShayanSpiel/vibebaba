/**
 * Comprehensive Component Categories Taxonomy
 * Defines all 55+ component categories with metadata
 */

export interface CategoryDefinition {
  slug: string;
  name: string;
  description: string;
  minExamplesRequired: number;
  targetExamples: number;
  priority: number; // 1-10, higher = more important
  parentCategory?: string;
  isActive?: boolean; // Whether category is active (default true)
}

/**
 * Complete taxonomy of all component categories
 * Organized by functional groups
 */
export const EXAMPLE_CATEGORIES: CategoryDefinition[] = [
  // ========================================
  // NAVIGATION & HEADERS (3 categories)
  // ========================================
  {
    slug: 'primary-navigation',
    name: 'Primary Navigation',
    description: 'Main navigation bars with logo, links, and CTAs',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 10, // Critical - appears on every page
  },
  {
    slug: 'mobile-navigation',
    name: 'Mobile Navigation',
    description: 'Mobile-optimized navigation with hamburger menus',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'mega-menus',
    name: 'Mega Menus',
    description: 'Large dropdown menus with multiple columns and categories',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },

  // ========================================
  // HERO SECTIONS (4 categories)
  // ========================================
  {
    slug: 'hero-with-cta',
    name: 'Hero with CTA',
    description: 'Hero sections with headline, description, and call-to-action buttons',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 10, // Critical - first impression
  },
  {
    slug: 'hero-with-media',
    name: 'Hero with Media',
    description: 'Hero sections featuring images, videos, or graphics',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'hero-with-form',
    name: 'Hero with Form',
    description: 'Hero sections with embedded signup or lead capture forms',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'hero-minimal',
    name: 'Minimal Hero',
    description: 'Simple, text-focused hero sections with minimal design',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },

  // ========================================
  // CONTENT SECTIONS (8 categories)
  // ========================================
  {
    slug: 'feature-grids',
    name: 'Feature Grids',
    description: 'Grid layouts showcasing product features with icons and descriptions',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'feature-lists',
    name: 'Feature Lists',
    description: 'Vertical or horizontal lists of features with checkmarks or icons',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'testimonials',
    name: 'Testimonials',
    description: 'Customer testimonials and reviews with avatars and ratings',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'team-sections',
    name: 'Team Sections',
    description: 'Team member profiles with photos, names, and roles',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },
  {
    slug: 'stats-metrics',
    name: 'Stats & Metrics',
    description: 'Statistical highlights and key metrics displays',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    description: 'Chronological timelines for company history, process steps, etc.',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 5,
  },
  {
    slug: 'faq',
    name: 'FAQ Sections',
    description: 'Frequently asked questions with accordion or expanded layouts',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'content-cards',
    name: 'Content Cards',
    description: 'Reusable card components for various content types',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },

  // ========================================
  // CALL-TO-ACTION (3 categories)
  // ========================================
  {
    slug: 'inline-cta',
    name: 'Inline CTA',
    description: 'Inline call-to-action elements within content flow',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'section-cta',
    name: 'Section CTA',
    description: 'Full-width CTA sections for page conversion goals',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'modal-cta',
    name: 'Modal CTA',
    description: 'Pop-up or modal-based calls-to-action',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },

  // ========================================
  // FORMS (5 categories)
  // ========================================
  {
    slug: 'contact-forms',
    name: 'Contact Forms',
    description: 'Contact forms with name, email, message fields',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'authentication-forms',
    name: 'Authentication Forms',
    description: 'Login, signup, and password reset forms',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'multi-step-forms',
    name: 'Multi-step Forms',
    description: 'Multi-page forms with progress indicators',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },
  {
    slug: 'search-forms',
    name: 'Search Forms',
    description: 'Search inputs with filters and autocomplete',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Email capture forms for newsletters and updates',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },

  // ========================================
  // E-COMMERCE (6 categories)
  // ========================================
  {
    slug: 'product-grids',
    name: 'Product Grids',
    description: 'Product listing grids with images, prices, and quick actions',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'product-detail',
    name: 'Product Detail',
    description: 'Product detail pages with gallery, specs, and add-to-cart',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'shopping-cart',
    name: 'Shopping Cart',
    description: 'Shopping cart displays with item management',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'checkout',
    name: 'Checkout',
    description: 'Checkout flows with shipping and payment forms',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'pricing-tables',
    name: 'Pricing Tables',
    description: 'Pricing comparison tables for products or services',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'product-filters',
    name: 'Product Filters',
    description: 'Sidebar or toolbar filters for product searches',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 7,
  },

  // ========================================
  // DASHBOARD & DATA (5 categories)
  // ========================================
  {
    slug: 'dashboard-cards',
    name: 'Dashboard Cards',
    description: 'Dashboard metric cards with KPIs and status indicators',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'data-tables',
    name: 'Data Tables',
    description: 'Tables with sorting, filtering, and pagination',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'charts-line',
    name: 'Line Charts',
    description: 'Line charts for time-series and trend data',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'charts-bar',
    name: 'Bar Charts',
    description: 'Bar charts for categorical data comparisons',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'charts-pie',
    name: 'Pie & Donut Charts',
    description: 'Circular charts for part-to-whole relationships',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },

  // ========================================
  // MEDIA & GALLERY (3 categories)
  // ========================================
  {
    slug: 'image-galleries',
    name: 'Image Galleries',
    description: 'Photo galleries with grid or masonry layouts',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'video-embeds',
    name: 'Video Embeds',
    description: 'Video players and embedded media sections',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },
  {
    slug: 'carousels-sliders',
    name: 'Carousels & Sliders',
    description: 'Image and content carousels with navigation',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },

  // ========================================
  // BLOG & CONTENT (4 categories)
  // ========================================
  {
    slug: 'blog-post-layouts',
    name: 'Blog Post Layouts',
    description: 'Article layouts with headers, content, and sidebars',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'article-cards',
    name: 'Article Cards',
    description: 'Blog post cards for listings and archives',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'author-bios',
    name: 'Author Bios',
    description: 'Author profile sections with photo and bio',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 5,
  },
  {
    slug: 'related-posts',
    name: 'Related Posts',
    description: 'Related or recommended content sections',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },

  // ========================================
  // FOOTER (2 categories)
  // ========================================
  {
    slug: 'multi-column-footer',
    name: 'Multi-column Footer',
    description: 'Footer with multiple columns of links and information',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 9,
  },
  {
    slug: 'minimal-footer',
    name: 'Minimal Footer',
    description: 'Simple footer with copyright and essential links',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 7,
  },

  // ========================================
  // UTILITY & FEEDBACK (8 categories)
  // ========================================
  {
    slug: 'modals-dialogs',
    name: 'Modals & Dialogs',
    description: 'Modal windows and dialog boxes for interactions',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'notifications-toasts',
    name: 'Notifications & Toasts',
    description: 'Toast notifications and alert messages',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'loading-states',
    name: 'Loading States',
    description: 'Loading indicators, spinners, and progress bars',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'error-pages',
    name: 'Error Pages',
    description: '404, 500, and other error page designs',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'empty-states',
    name: 'Empty States',
    description: 'Empty state designs for zero-data scenarios',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },
  {
    slug: 'skeleton-loaders',
    name: 'Skeleton Loaders',
    description: 'Content placeholder skeletons during loading',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'breadcrumbs',
    name: 'Breadcrumbs',
    description: 'Navigation breadcrumb trails',
    minExamplesRequired: 2,
    targetExamples: 5,
    priority: 6,
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    description: 'Page navigation controls for lists and tables',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },

  // ========================================
  // INTERACTIVE ELEMENTS (4 categories)
  // ========================================
  {
    slug: 'buttons',
    name: 'Buttons',
    description: 'Button variants (primary, secondary, outline, icon, etc.)',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 10, // Critical - used everywhere
  },
  {
    slug: 'dropdowns',
    name: 'Dropdowns',
    description: 'Dropdown menus and select components',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 8,
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    description: 'Tabbed navigation and content panels',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
  {
    slug: 'accordions',
    name: 'Accordions',
    description: 'Collapsible content sections and accordions',
    minExamplesRequired: 3,
    targetExamples: 5,
    priority: 7,
  },
];

/**
 * Style variants for examples
 */
export const STYLE_VARIANTS = [
  'minimal',
  'modern',
  'glassmorphism',
  'brutalist',
  'gradient',
  'dark',
] as const;

/**
 * Industry contexts for examples
 */
export const INDUSTRY_CONTEXTS = [
  'aas', // Note: Database has 'aas' instead of 'saas' (typo in migration)
  'ecommerce',
  'blog',
  'portfolio',
  'agency',
  'fintech',
  'healthcare',
  'education',
  'media',
  'nonprofit',
] as const;

/**
 * Complexity levels
 */
export const COMPLEXITY_LEVELS = [
  'simple',
  'medium',
  'complex',
] as const;

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return EXAMPLE_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Get high priority categories (priority >= 8)
 */
export function getHighPriorityCategories(): CategoryDefinition[] {
  return EXAMPLE_CATEGORIES.filter(cat => cat.priority >= 8)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get categories by priority range
 */
export function getCategoriesByPriority(min: number, max: number): CategoryDefinition[] {
  return EXAMPLE_CATEGORIES.filter(cat => cat.priority >= min && cat.priority <= max)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate total target examples
 */
export function getTotalTargetExamples(): number {
  return EXAMPLE_CATEGORIES.reduce((sum, cat) => sum + cat.targetExamples, 0);
}

/**
 * Summary statistics
 */
export const TAXONOMY_STATS = {
  totalCategories: EXAMPLE_CATEGORIES.length,
  totalTargetExamples: getTotalTargetExamples(),
  highPriorityCount: getHighPriorityCategories().length,
  styleVariantsCount: STYLE_VARIANTS.length,
  industryContextsCount: INDUSTRY_CONTEXTS.length,
  complexityLevelsCount: COMPLEXITY_LEVELS.length,
};
