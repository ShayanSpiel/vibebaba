/**
 * MCP Query Optimizer
 *
 * Generates highly optimized search queries for GitHub and Web Search
 * with brand recognition, semantic understanding, and search operator usage
 */

// Comprehensive brand database with metadata
export const BRAND_DATABASE = {
  // AI & Chatbots
  'openai': {
    keywords: ['openai', 'chatgpt', 'gpt-4', 'dalle', 'whisper'],
    designKeywords: ['clean interface', 'minimalist', 'dark mode', 'chat interface', 'sidebar'],
    techStack: ['react', 'typescript', 'tailwind', 'next.js'],
    colorScheme: ['#10a37f', '#19c37d', 'emerald green', 'dark theme'],
    officialDomains: ['openai.com', 'chat.openai.com'],
    minStars: 100,
  },
  'anthropic': {
    keywords: ['anthropic', 'claude', 'claude ai', 'constitutional ai'],
    designKeywords: ['elegant', 'professional', 'conversation UI', 'prompt library'],
    techStack: ['react', 'typescript', 'styled-components'],
    colorScheme: ['#cc785c', 'warm brown', 'cream', 'professional'],
    officialDomains: ['anthropic.com', 'claude.ai'],
    minStars: 50,
  },
  'midjourney': {
    keywords: ['midjourney', 'discord bot', 'image generation'],
    designKeywords: ['gallery', 'grid layout', 'image showcase', 'dark theme'],
    techStack: ['discord.js', 'node.js', 'react'],
    colorScheme: ['dark', 'vibrant', 'purple accents'],
    officialDomains: ['midjourney.com'],
    minStars: 50,
  },

  // Payment & Finance
  'stripe': {
    keywords: ['stripe', 'payment', 'checkout', 'billing'],
    designKeywords: ['professional', 'trustworthy', 'form design', 'payment flow'],
    techStack: ['react', 'node.js', 'stripe-js', 'next.js'],
    colorScheme: ['#635bff', 'indigo', 'white', 'modern'],
    officialDomains: ['stripe.com', 'dashboard.stripe.com'],
    minStars: 100,
  },
  'paypal': {
    keywords: ['paypal', 'payment gateway', 'checkout'],
    designKeywords: ['blue theme', 'secure', 'checkout flow'],
    techStack: ['react', 'javascript', 'paypal-sdk'],
    colorScheme: ['#003087', '#009cde', 'blue gradient'],
    officialDomains: ['paypal.com'],
    minStars: 50,
  },

  // E-commerce & Marketplace
  'shopify': {
    keywords: ['shopify', 'ecommerce', 'store', 'products'],
    designKeywords: ['product grid', 'cart', 'checkout', 'storefront'],
    techStack: ['react', 'liquid', 'polaris', 'graphql'],
    colorScheme: ['#5c6ac4', '#7ab55c', 'purple green'],
    officialDomains: ['shopify.com'],
    minStars: 100,
  },
  'amazon': {
    keywords: ['amazon', 'ecommerce', 'marketplace', 'shopping'],
    designKeywords: ['product listing', 'search bar', 'cart', 'reviews'],
    techStack: ['react', 'node.js', 'aws'],
    colorScheme: ['#ff9900', '#232f3e', 'orange dark'],
    officialDomains: ['amazon.com'],
    minStars: 200,
  },
  'etsy': {
    keywords: ['etsy', 'handmade', 'marketplace', 'crafts'],
    designKeywords: ['warm', 'creative', 'grid layout', 'vintage'],
    techStack: ['react', 'node.js'],
    colorScheme: ['#f1641e', 'orange', 'warm'],
    officialDomains: ['etsy.com'],
    minStars: 50,
  },

  // Social Media
  'twitter': {
    keywords: ['twitter', 'tweet', 'social media', 'feed'],
    designKeywords: ['timeline', 'feed', 'real-time', 'infinite scroll'],
    techStack: ['react', 'react-query', 'tailwind'],
    colorScheme: ['#1da1f2', 'blue', 'white'],
    officialDomains: ['twitter.com', 'x.com'],
    minStars: 150,
  },
  'instagram': {
    keywords: ['instagram', 'photo sharing', 'stories', 'reels'],
    designKeywords: ['grid layout', 'stories', 'image gallery', 'mobile-first'],
    techStack: ['react', 'react-native', 'graphql'],
    colorScheme: ['gradient', 'purple pink orange', 'vibrant'],
    officialDomains: ['instagram.com'],
    minStars: 150,
  },
  'linkedin': {
    keywords: ['linkedin', 'professional network', 'jobs', 'connections'],
    designKeywords: ['professional', 'blue theme', 'feed', 'profile'],
    techStack: ['react', 'java', 'kafka'],
    colorScheme: ['#0077b5', 'professional blue'],
    officialDomains: ['linkedin.com'],
    minStars: 100,
  },
  'facebook': {
    keywords: ['facebook', 'social network', 'feed', 'posts'],
    designKeywords: ['feed', 'timeline', 'messenger', 'groups'],
    techStack: ['react', 'relay', 'graphql'],
    colorScheme: ['#1877f2', 'blue'],
    officialDomains: ['facebook.com'],
    minStars: 150,
  },
  'tiktok': {
    keywords: ['tiktok', 'short video', 'fyp', 'vertical feed'],
    designKeywords: ['vertical video', 'swipe', 'dark theme', 'interactive'],
    techStack: ['react', 'react-native', 'video player'],
    colorScheme: ['#000000', '#fe2c55', 'black pink'],
    officialDomains: ['tiktok.com'],
    minStars: 100,
  },
  'reddit': {
    keywords: ['reddit', 'forum', 'subreddit', 'upvote'],
    designKeywords: ['forum', 'thread', 'voting', 'comment tree'],
    techStack: ['react', 'python', 'postgresql'],
    colorScheme: ['#ff4500', 'orange white'],
    officialDomains: ['reddit.com'],
    minStars: 100,
  },

  // Productivity & Tools
  'notion': {
    keywords: ['notion', 'notes', 'workspace', 'blocks'],
    designKeywords: ['block-based', 'drag-drop', 'clean', 'workspace'],
    techStack: ['react', 'prosemirror', 'slate'],
    colorScheme: ['minimal', 'white', 'clean'],
    officialDomains: ['notion.so'],
    minStars: 150,
  },
  'linear': {
    keywords: ['linear', 'project management', 'issue tracking', 'cycles'],
    designKeywords: ['minimal', 'keyboard shortcuts', 'command palette', 'fast'],
    techStack: ['react', 'graphql', 'typescript', 'framer-motion'],
    colorScheme: ['#5e6ad2', 'purple', 'dark mode'],
    officialDomains: ['linear.app'],
    minStars: 100,
  },
  'figma': {
    keywords: ['figma', 'design tool', 'prototyping', 'collaboration'],
    designKeywords: ['canvas', 'toolbar', 'panels', 'real-time collaboration'],
    techStack: ['react', 'webgl', 'typescript'],
    colorScheme: ['#000000', '#ffffff', 'colorful accents'],
    officialDomains: ['figma.com'],
    minStars: 100,
  },
  'slack': {
    keywords: ['slack', 'chat', 'workspace', 'channels'],
    designKeywords: ['sidebar', 'channels', 'threads', 'chat interface'],
    techStack: ['react', 'electron', 'node.js'],
    colorScheme: ['#611f69', '#4a154b', 'purple'],
    officialDomains: ['slack.com'],
    minStars: 100,
  },
  'discord': {
    keywords: ['discord', 'voice chat', 'servers', 'channels'],
    designKeywords: ['dark theme', 'sidebar', 'voice controls', 'chat'],
    techStack: ['react', 'electron', 'discord.js'],
    colorScheme: ['#5865f2', '#7289da', 'blurple'],
    officialDomains: ['discord.com'],
    minStars: 150,
  },
  'trello': {
    keywords: ['trello', 'kanban', 'boards', 'cards'],
    designKeywords: ['kanban', 'drag-drop', 'boards', 'cards'],
    techStack: ['react', 'node.js', 'mongodb'],
    colorScheme: ['#0079bf', 'blue'],
    officialDomains: ['trello.com'],
    minStars: 100,
  },
  'asana': {
    keywords: ['asana', 'project management', 'tasks', 'timeline'],
    designKeywords: ['task list', 'timeline', 'calendar', 'clean'],
    techStack: ['react', 'graphql', 'typescript'],
    colorScheme: ['#f06a6a', 'coral'],
    officialDomains: ['asana.com'],
    minStars: 75,
  },

  // Media & Entertainment
  'netflix': {
    keywords: ['netflix', 'streaming', 'video player', 'carousel'],
    designKeywords: ['carousel', 'video player', 'dark theme', 'grid'],
    techStack: ['react', 'node.js', 'graphql'],
    colorScheme: ['#e50914', 'red', 'black'],
    officialDomains: ['netflix.com'],
    minStars: 200,
  },
  'spotify': {
    keywords: ['spotify', 'music player', 'playlist', 'streaming'],
    designKeywords: ['dark theme', 'music player', 'sidebar', 'now playing'],
    techStack: ['react', 'typescript', 'web-playback-sdk'],
    colorScheme: ['#1db954', 'green', 'black'],
    officialDomains: ['spotify.com'],
    minStars: 150,
  },
  'youtube': {
    keywords: ['youtube', 'video platform', 'player', 'recommendations'],
    designKeywords: ['video player', 'sidebar', 'recommendations', 'comments'],
    techStack: ['react', 'polymer', 'youtube-api'],
    colorScheme: ['#ff0000', 'red', 'white'],
    officialDomains: ['youtube.com'],
    minStars: 200,
  },
  'soundcloud': {
    keywords: ['soundcloud', 'audio', 'waveform', 'music'],
    designKeywords: ['waveform', 'audio player', 'orange theme'],
    techStack: ['react', 'web-audio-api'],
    colorScheme: ['#ff8800', 'orange'],
    officialDomains: ['soundcloud.com'],
    minStars: 75,
  },

  // Travel & Booking
  'airbnb': {
    keywords: ['airbnb', 'booking', 'listings', 'map'],
    designKeywords: ['card grid', 'map view', 'filters', 'gallery'],
    techStack: ['react', 'graphql', 'mapbox'],
    colorScheme: ['#ff5a5f', 'rausch pink'],
    officialDomains: ['airbnb.com'],
    minStars: 150,
  },
  'uber': {
    keywords: ['uber', 'ride sharing', 'map', 'booking'],
    designKeywords: ['map interface', 'real-time tracking', 'dark theme'],
    techStack: ['react', 'react-native', 'mapbox'],
    colorScheme: ['#000000', 'black'],
    officialDomains: ['uber.com'],
    minStars: 100,
  },
  'booking': {
    keywords: ['booking.com', 'hotel booking', 'travel'],
    designKeywords: ['search filters', 'hotel cards', 'booking flow'],
    techStack: ['react', 'node.js'],
    colorScheme: ['#003580', 'blue'],
    officialDomains: ['booking.com'],
    minStars: 75,
  },

  // Developer Tools
  'github': {
    keywords: ['github', 'git', 'repository', 'code'],
    designKeywords: ['code view', 'dark mode', 'file tree', 'diff view'],
    techStack: ['react', 'ruby', 'graphql'],
    colorScheme: ['#24292e', 'dark gray'],
    officialDomains: ['github.com'],
    minStars: 200,
  },
  'gitlab': {
    keywords: ['gitlab', 'git', 'ci/cd', 'devops'],
    designKeywords: ['sidebar', 'project view', 'pipeline'],
    techStack: ['vue', 'ruby', 'gitlab-ci'],
    colorScheme: ['#fc6d26', 'orange'],
    officialDomains: ['gitlab.com'],
    minStars: 100,
  },
  'vercel': {
    keywords: ['vercel', 'deployment', 'hosting', 'serverless'],
    designKeywords: ['minimal', 'dark theme', 'dashboard', 'clean'],
    techStack: ['react', 'next.js', 'typescript'],
    colorScheme: ['#000000', 'black', 'white'],
    officialDomains: ['vercel.com'],
    minStars: 100,
  },
  'supabase': {
    keywords: ['supabase', 'database', 'backend', 'postgres'],
    designKeywords: ['dashboard', 'table view', 'green theme'],
    techStack: ['react', 'postgresql', 'typescript'],
    colorScheme: ['#3ecf8e', 'green'],
    officialDomains: ['supabase.com'],
    minStars: 150,
  },
} as const;

export type BrandName = keyof typeof BRAND_DATABASE;

/**
 * Detect brands mentioned in description
 */
export function detectBrands(description: string): {
  brands: BrandName[];
  isClone: boolean;
  primaryBrand?: BrandName;
} {
  const lowerDesc = description.toLowerCase();
  const detectedBrands: BrandName[] = [];

  // Check for brand mentions
  for (const [brandName, brandData] of Object.entries(BRAND_DATABASE)) {
    const keywords = [brandName, ...brandData.keywords];
    if (keywords.some(kw => lowerDesc.includes(kw.toLowerCase()))) {
      detectedBrands.push(brandName as BrandName);
    }
  }

  // Check if it's a clone/replica request
  const isClone = /\b(clone|like|similar to|replica|copy|replicate|inspired by|style of|version of)\b/i.test(description);

  return {
    brands: detectedBrands,
    isClone,
    primaryBrand: detectedBrands[0],
  };
}

/**
 * Optimize GitHub search query
 */
export function optimizeGitHubQuery(
  description: string,
  appType: string,
  options: {
    minStars?: number;
    language?: string;
    includeTopics?: boolean;
  } = {}
): {
  query: string;
  explanation: string;
  strategy: string;
} {
  const { brands, isClone, primaryBrand } = detectBrands(description);
  const brandData = primaryBrand ? BRAND_DATABASE[primaryBrand] : null;

  let query = '';
  let explanation = '';
  let strategy = '';

  if (isClone && primaryBrand && brandData) {
    // BRAND CLONE: Find exact clones or similar implementations
    strategy = 'Brand Clone Search';

    // Strategy 1: Search for "{brand} clone" with high stars
    const minStars = options.minStars || brandData.minStars || 100;
    const brandKeywords = brandData.keywords.slice(0, 2).join(' OR ');

    query = `${primaryBrand} clone ${appType} stars:>${minStars} ${brandData.techStack.slice(0, 2).join(' ')}`;

    explanation = `Searching for ${primaryBrand} clones with:
- Clone/replica projects (${minStars}+ stars)
- Tech stack: ${brandData.techStack.join(', ')}
- App type: ${appType}`;

  } else if (primaryBrand && brandData) {
    // BRAND REFERENCE: Find similar apps (not exact clones)
    strategy = 'Brand-Inspired Search';

    const minStars = options.minStars || 20; // Lower threshold for brand references

    // Extract semantic keywords from description instead of just using brand name
    const semanticKeywords = extractKeywords(description).slice(0, 3);

    // Combine brand keywords with semantic keywords for better results
    const searchTerms = [...brandData.keywords.slice(0, 2), ...semanticKeywords].join(' ');

    query = `${searchTerms} language:typescript stars:>${minStars}`;

    explanation = `Searching for ${primaryBrand}-inspired projects with:
- Related functionality: ${semanticKeywords.join(', ')}
- Minimum ${minStars} stars
- TypeScript implementations`;

  } else {
    // GENERIC: Extract keywords and optimize with synonyms
    strategy = 'Semantic Keyword Search';

    const keywords = extractKeywords(description);
    const expandedKeywords = expandKeywordsWithSynonyms(keywords, 4);
    const minStars = options.minStars || 20;
    const language = options.language || 'typescript';

    // Build query with expanded keywords for better coverage
    const primaryKeywords = keywords.slice(0, 2).join(' ');
    const additionalTerms = expandedKeywords.slice(2, 4).join(' OR ');

    query = `${primaryKeywords} ${additionalTerms ? `(${additionalTerms})` : ''} language:${language} stars:>${minStars}`;

    explanation = `Generic search with:
- Keywords: ${keywords.join(', ')}
- Expanded: ${expandedKeywords.join(', ')}
- Language: ${language}
- Minimum stars: ${minStars}`;
  }

  return { query, explanation, strategy };
}

/**
 * Optimize web search query
 */
export function optimizeWebQuery(
  description: string,
  appType: string,
  options: {
    includeYear?: boolean;
    focusOn?: 'design' | 'code' | 'architecture' | 'general';
  } = {}
): {
  query: string;
  explanation: string;
  strategy: string;
} {
  const { brands, isClone, primaryBrand } = detectBrands(description);
  const brandData = primaryBrand ? BRAND_DATABASE[primaryBrand] : null;
  const year = options.includeYear !== false ? '2024 2025' : '';
  const focusOn = options.focusOn || 'general';

  let query = '';
  let explanation = '';
  let strategy = '';

  if (isClone && primaryBrand && brandData) {
    // BRAND CLONE: Search for official design resources
    strategy = 'Brand Design System Search';

    if (focusOn === 'design') {
      query = `${primaryBrand} official design system UI components ${brandData.designKeywords.join(' ')} ${year}`;
      explanation = `Searching for ${primaryBrand}'s official design system and UI patterns`;
    } else if (focusOn === 'code') {
      query = `${primaryBrand} ${appType} ${brandData.techStack.join(' ')} implementation tutorial ${year}`;
      explanation = `Searching for ${primaryBrand} implementation guides with ${brandData.techStack.join(', ')}`;
    } else {
      query = `"${primaryBrand}" ${appType} interface design patterns ${brandData.designKeywords[0]} ${year}`;
      explanation = `Searching for ${primaryBrand}'s interface and design patterns`;
    }

  } else if (primaryBrand && brandData) {
    // BRAND REFERENCE: Search for similar functionality patterns
    strategy = 'Functionality Pattern Search';

    // Extract semantic keywords for better search
    const semanticKeywords = extractKeywords(description).slice(0, 3);

    query = `${semanticKeywords.join(' ')} ${appType} design patterns best practices ${year}`;
    explanation = `Searching for ${semanticKeywords.join(', ')} patterns similar to ${primaryBrand}`;

  } else {
    // GENERIC: Optimized search for app type with expanded keywords
    strategy = 'Best Practices Search';

    const keywords = extractKeywords(description);
    const expandedKeywords = expandKeywordsWithSynonyms(keywords, 3);

    // Use expanded keywords for better search coverage
    const searchTerms = expandedKeywords.join(' ');

    if (focusOn === 'design') {
      query = `${searchTerms} ${appType} modern UI design examples ${year}`;
      explanation = `Searching for modern UI/UX design examples for ${appType} (${keywords.join(', ')})`;
    } else if (focusOn === 'code') {
      query = `${searchTerms} ${appType} react typescript tutorial ${year}`;
      explanation = `Searching for code examples and tutorials (${keywords.join(', ')})`;
    } else {
      query = `${searchTerms} ${appType} react component library ${year}`;
      explanation = `Searching for component libraries and patterns (${keywords.join(', ')})`;
    }
  }

  return { query, explanation, strategy };
}

/**
 * Domain-specific keywords that should be preserved
 */
const DOMAIN_KEYWORDS = new Set([
  // Productivity & Task Management
  'calendar', 'checklist', 'todo', 'task', 'schedule', 'event', 'reminder',
  'planner', 'agenda', 'appointment', 'booking', 'timeline', 'deadline',

  // Data & Content
  'dashboard', 'analytics', 'chart', 'graph', 'table', 'list', 'grid',
  'form', 'input', 'search', 'filter', 'sort', 'pagination',

  // Social & Communication
  'chat', 'message', 'comment', 'post', 'feed', 'profile', 'user',
  'notification', 'follow', 'like', 'share',

  // E-commerce & Transactions
  'cart', 'checkout', 'payment', 'product', 'catalog', 'shop', 'store',
  'order', 'invoice', 'pricing', 'subscription',

  // Media & Files
  'image', 'video', 'audio', 'file', 'upload', 'download', 'gallery',
  'photo', 'document', 'pdf',

  // Authentication & Users
  'login', 'signup', 'register', 'auth', 'authentication', 'password',
  'account', 'settings', 'permission', 'role',

  // Technical Terms
  'api', 'database', 'real-time', 'websocket', 'crud', 'admin'
]);

/**
 * Synonym map for expanding search queries
 */
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  'calendar': ['schedule', 'event', 'date', 'planner'],
  'checklist': ['todo', 'task', 'list'],
  'todo': ['task', 'checklist', 'item'],
  'task': ['todo', 'checklist', 'item', 'assignment'],
  'chat': ['message', 'messaging', 'conversation'],
  'dashboard': ['admin', 'panel', 'analytics'],
  'cart': ['shopping-cart', 'basket', 'checkout'],
  'auth': ['authentication', 'login', 'signup'],
  'form': ['input', 'fields', 'validation'],
};

/**
 * Extract meaningful keywords from description with domain awareness
 */
function extractKeywords(description: string): string[] {
  // Minimal stop words - only remove true filler words
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'and', 'or', 'but', 'in', 'on',
    'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'into',
    'through', 'after', 'over', 'between', 'out', 'against', 'during',
    'without', 'before', 'under', 'around', 'among'
    // NOTE: Removed 'want', 'need', 'make', 'create', 'build', 'app', 'like' - these can be meaningful
  ]);

  const words = description
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Keep hyphens for terms like 'drag-and-drop'
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Prioritize domain-specific keywords
  const domainWords = words.filter(w => DOMAIN_KEYWORDS.has(w));
  const otherWords = words.filter(w => !DOMAIN_KEYWORDS.has(w));

  // Get unique keywords
  const uniqueDomainWords = [...new Set(domainWords)];
  const uniqueOtherWords = [...new Set(otherWords)];

  // Combine: domain keywords first (sorted by frequency), then others (sorted by length)
  const domainSorted = uniqueDomainWords.slice(0, 4); // Prioritize up to 4 domain keywords
  const othersSorted = uniqueOtherWords
    .sort((a, b) => b.length - a.length)
    .slice(0, 3); // Add up to 3 other descriptive words

  return [...domainSorted, ...othersSorted].slice(0, 5);
}

/**
 * Expand keywords with synonyms for better search coverage
 */
function expandKeywordsWithSynonyms(keywords: string[], maxExpanded: number = 3): string[] {
  const expanded = new Set(keywords);

  for (const keyword of keywords) {
    if (KEYWORD_SYNONYMS[keyword]) {
      KEYWORD_SYNONYMS[keyword].slice(0, 1).forEach(syn => expanded.add(syn));
    }
  }

  return Array.from(expanded).slice(0, maxExpanded);
}

/**
 * Get search suggestions based on app type
 */
export function getSearchSuggestions(appType: string): string[] {
  const suggestions: Record<string, string[]> = {
    'landing-page': [
      'hero section design',
      'landing page conversion',
      'modern landing page UI',
      'SaaS landing page',
    ],
    'dashboard': [
      'admin dashboard',
      'analytics dashboard',
      'data visualization',
      'dashboard UI kit',
    ],
    'saas-app': [
      'SaaS boilerplate',
      'multi-tenant app',
      'subscription management',
      'SaaS architecture',
    ],
    'ecommerce': [
      'ecommerce storefront',
      'product catalog',
      'checkout flow',
      'shopping cart',
    ],
    'social-media': [
      'social feed',
      'user profiles',
      'real-time updates',
      'infinite scroll',
    ],
    'chat': [
      'chat interface',
      'real-time messaging',
      'WebSocket implementation',
      'chat UI',
    ],
  };

  return suggestions[appType] || [];
}
