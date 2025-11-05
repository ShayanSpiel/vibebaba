/**
 * MCP Data Extractor
 *
 * Extracts structured data, code snippets, design patterns, and components
 * from GitHub repositories and web search results
 */

import { BRAND_DATABASE, BrandName } from './mcp-query-optimizer';

export interface ExtractedRepository {
  name: string;
  fullName: string;
  url: string;
  stars: number;
  description: string;
  topics: string[];
  language: string;
  homepage?: string;

  // Extracted data
  techStack: string[];
  designPatterns: string[];
  components: string[];
  features: string[];
  uiPatterns: string[];
  colorScheme?: string[];

  // Quality score (0-100)
  relevanceScore: number;
  qualityScore: number;
}

export interface ExtractedWebResult {
  title: string;
  url: string;
  description: string;
  domain: string;

  // Extracted data
  designPatterns: string[];
  codeSnippets: string[];
  concepts: string[];
  tools: string[];
  libraries: string[];

  // Quality indicators
  isOfficial: boolean;
  isTutorial: boolean;
  isDocumentation: boolean;
  relevanceScore: number;
}

export interface ExtractedContext {
  repositories: ExtractedRepository[];
  webResults: ExtractedWebResult[];

  // Aggregated insights
  topTechStack: string[];
  topDesignPatterns: string[];
  topComponents: string[];
  recommendedLibraries: string[];
  colorSchemes: string[][];

  // Metadata
  totalSources: number;
  averageQuality: number;
  hasOfficialSources: boolean;
  brandMatch?: BrandName;
}

/**
 * Extract data from GitHub repository search results
 */
export function extractGitHubData(
  rawResults: any,
  searchContext: { description: string; appType: string; brandName?: BrandName }
): ExtractedRepository[] {
  // Unwrap MCP response format
  let data = rawResults;

  // Check if this is an MCP-wrapped response
  if (rawResults?.content && Array.isArray(rawResults.content)) {
    try {
      const textContent = rawResults.content.find((c: any) => c.type === 'text')?.text;
      if (textContent) {
        data = JSON.parse(textContent);
        console.log('[Data Extractor] 📦 Unwrapped MCP response');
      }
    } catch (error) {
      console.log('[Data Extractor] ⚠️  Failed to parse MCP content:', error);
      return [];
    }
  }

  console.log('[Data Extractor] GitHub data keys:', Object.keys(data || {}).join(', '));
  console.log('[Data Extractor] Total count:', data?.total_count);

  // Support multiple response formats
  let items: any[] = [];

  if (data?.items) {
    // Standard GitHub API format
    items = data.items;
  } else if (data?.repositories) {
    // Alternative format
    items = data.repositories;
  } else if (Array.isArray(data)) {
    // Direct array format
    items = data;
  } else {
    console.log('[Data Extractor] ❌ No items found in GitHub response');
    return [];
  }

  console.log('[Data Extractor] ✅ Found', items.length, 'GitHub repositories');
  const repositories: ExtractedRepository[] = [];

  for (const item of items.slice(0, 10)) { // Process top 10
    const repo = extractRepositoryData(item, searchContext);
    if (repo.relevanceScore > 30) { // Only include relevant repos
      repositories.push(repo);
    }
  }

  // Sort by combined score
  repositories.sort((a, b) => {
    const scoreA = (a.relevanceScore * 0.6) + (a.qualityScore * 0.4);
    const scoreB = (b.relevanceScore * 0.6) + (b.qualityScore * 0.4);
    return scoreB - scoreA;
  });

  return repositories.slice(0, 5); // Return top 5
}

/**
 * Extract data from a single repository
 */
function extractRepositoryData(
  item: any,
  searchContext: { description: string; appType: string; brandName?: BrandName }
): ExtractedRepository {
  const description = item.description || '';
  const topics = item.topics || [];
  const readme = item.readme || ''; // If available
  const combined = `${description} ${topics.join(' ')} ${readme}`.toLowerCase();

  // Extract tech stack
  const techStack = extractTechStack(combined, topics);

  // Extract design patterns
  const designPatterns = extractDesignPatterns(combined);

  // Extract components
  const components = extractComponents(combined);

  // Extract features
  const features = extractFeatures(combined, description);

  // Extract UI patterns
  const uiPatterns = extractUIPatterns(combined);

  // Extract color scheme
  const colorScheme = extractColorScheme(combined, searchContext.brandName);

  // Calculate relevance score
  const relevanceScore = calculateRelevanceScore(
    { description, topics, techStack, designPatterns, components },
    searchContext
  );

  // Calculate quality score
  const qualityScore = calculateQualityScore({
    stars: item.stargazers_count || 0,
    hasDescription: !!description,
    hasTopics: topics.length > 0,
    hasHomepage: !!item.homepage,
    lastUpdated: item.updated_at,
  });

  return {
    name: item.name,
    fullName: item.full_name,
    url: item.html_url,
    stars: item.stargazers_count || 0,
    description,
    topics,
    language: item.language || 'Unknown',
    homepage: item.homepage,
    techStack,
    designPatterns,
    components,
    features,
    uiPatterns,
    colorScheme,
    relevanceScore,
    qualityScore,
  };
}

/**
 * Extract tech stack from text
 */
function extractTechStack(text: string, topics: string[]): string[] {
  const techMap: Record<string, string[]> = {
    'React': ['react', 'reactjs', 'react.js'],
    'Next.js': ['next.js', 'nextjs', 'next'],
    'TypeScript': ['typescript', 'ts'],
    'Tailwind CSS': ['tailwind', 'tailwindcss'],
    'Vue.js': ['vue', 'vuejs', 'vue.js'],
    'Svelte': ['svelte', 'sveltekit'],
    'Node.js': ['node.js', 'nodejs', 'node'],
    'Express': ['express', 'expressjs'],
    'FastAPI': ['fastapi', 'fast-api'],
    'Django': ['django'],
    'Flask': ['flask'],
    'PostgreSQL': ['postgresql', 'postgres', 'pg'],
    'MongoDB': ['mongodb', 'mongo'],
    'Redis': ['redis'],
    'GraphQL': ['graphql', 'apollo'],
    'tRPC': ['trpc'],
    'Prisma': ['prisma'],
    'Drizzle': ['drizzle', 'drizzle-orm'],
    'Supabase': ['supabase'],
    'Firebase': ['firebase'],
    'Clerk': ['clerk', 'clerk-auth'],
    'NextAuth': ['nextauth', 'next-auth'],
    'Stripe': ['stripe'],
    'Shadcn UI': ['shadcn', 'shadcn-ui', 'shadcn/ui'],
    'Radix UI': ['radix', 'radix-ui'],
    'Framer Motion': ['framer-motion', 'framer'],
    'Zustand': ['zustand'],
    'Jotai': ['jotai'],
    'Zod': ['zod'],
    'React Query': ['react-query', 'tanstack-query'],
    'SWR': ['swr'],
  };

  const found = new Set<string>();
  const combinedText = `${text} ${topics.join(' ')}`.toLowerCase();

  for (const [tech, keywords] of Object.entries(techMap)) {
    if (keywords.some(kw => combinedText.includes(kw))) {
      found.add(tech);
    }
  }

  return Array.from(found);
}

/**
 * Extract design patterns
 */
function extractDesignPatterns(text: string): string[] {
  const patterns: Record<string, string[]> = {
    'Component-based architecture': ['component', 'modular', 'reusable components'],
    'Responsive design': ['responsive', 'mobile-first', 'mobile responsive'],
    'Dark mode': ['dark mode', 'dark theme', 'theme toggle'],
    'Accessibility (a11y)': ['accessibility', 'a11y', 'wcag', 'aria'],
    'Server-side rendering (SSR)': ['ssr', 'server-side rendering', 'server render'],
    'Static site generation (SSG)': ['ssg', 'static site', 'static generation'],
    'Incremental static regeneration (ISR)': ['isr', 'incremental static'],
    'API routes': ['api routes', 'api endpoints', 'serverless functions'],
    'Authentication': ['authentication', 'auth', 'login', 'oauth'],
    'Real-time updates': ['real-time', 'websocket', 'socket.io', 'live updates'],
    'Infinite scroll': ['infinite scroll', 'virtual scroll', 'pagination'],
    'Drag and drop': ['drag and drop', 'dnd', 'draggable'],
    'File upload': ['file upload', 'image upload', 'file handling'],
    'Search functionality': ['search', 'search bar', 'fuzzy search'],
    'Form validation': ['form validation', 'validation', 'form handling'],
    'State management': ['state management', 'global state', 'context'],
    'Code splitting': ['code splitting', 'lazy loading', 'dynamic import'],
    'SEO optimization': ['seo', 'meta tags', 'open graph'],
    'Performance optimization': ['performance', 'optimization', 'lighthouse'],
    'Testing': ['testing', 'jest', 'cypress', 'playwright'],
  };

  const found = new Set<string>();

  for (const [pattern, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      found.add(pattern);
    }
  }

  return Array.from(found);
}

/**
 * Extract UI components
 */
function extractComponents(text: string): string[] {
  const components: Record<string, string[]> = {
    'Navigation bar': ['navbar', 'navigation', 'menu', 'header'],
    'Sidebar': ['sidebar', 'side panel', 'drawer'],
    'Footer': ['footer'],
    'Hero section': ['hero', 'hero section', 'landing hero'],
    'Card': ['card', 'cards', 'card component'],
    'Modal/Dialog': ['modal', 'dialog', 'popup'],
    'Dropdown': ['dropdown', 'select', 'combobox'],
    'Table': ['table', 'data table', 'grid'],
    'Form': ['form', 'input', 'textarea', 'checkbox'],
    'Button': ['button', 'cta', 'action button'],
    'Tabs': ['tabs', 'tab panel'],
    'Accordion': ['accordion', 'collapse'],
    'Toast/Notification': ['toast', 'notification', 'snackbar', 'alert'],
    'Tooltip': ['tooltip', 'popover'],
    'Avatar': ['avatar', 'profile picture'],
    'Badge': ['badge', 'chip', 'tag'],
    'Progress bar': ['progress', 'progress bar', 'loading bar'],
    'Skeleton loader': ['skeleton', 'placeholder', 'loading state'],
    'Carousel': ['carousel', 'slider', 'slideshow'],
    'Chart/Graph': ['chart', 'graph', 'visualization'],
    'Calendar': ['calendar', 'date picker'],
    'Timeline': ['timeline'],
    'Breadcrumb': ['breadcrumb', 'breadcrumbs'],
    'Pagination': ['pagination', 'page navigation'],
  };

  const found = new Set<string>();

  for (const [component, keywords] of Object.entries(components)) {
    if (keywords.some(kw => text.includes(kw))) {
      found.add(component);
    }
  }

  return Array.from(found);
}

/**
 * Extract features from description
 */
function extractFeatures(text: string, description: string): string[] {
  const features: string[] = [];

  // Common feature patterns
  const featurePatterns = [
    /features?:([^.!?]+)/gi,
    /includes?:([^.!?]+)/gi,
    /supports?:([^.!?]+)/gi,
    /provides?:([^.!?]+)/gi,
  ];

  for (const pattern of featurePatterns) {
    const matches = description.match(pattern);
    if (matches) {
      features.push(...matches);
    }
  }

  return features.slice(0, 5);
}

/**
 * Extract UI patterns
 */
function extractUIPatterns(text: string): string[] {
  const patterns: Record<string, string[]> = {
    'Grid layout': ['grid', 'grid layout', 'css grid'],
    'Flexbox layout': ['flexbox', 'flex layout'],
    'Glassmorphism': ['glassmorphism', 'frosted glass', 'backdrop blur'],
    'Neumorphism': ['neumorphism', 'soft ui'],
    'Gradient': ['gradient', 'linear gradient', 'radial gradient'],
    'Animation': ['animation', 'transition', 'motion', 'animated'],
    'Parallax': ['parallax'],
    'Sticky header': ['sticky', 'fixed header'],
    'Floating action button': ['fab', 'floating button'],
    'Split screen': ['split screen', 'two column'],
    'Full-screen': ['full-screen', 'fullscreen'],
    'Minimalist': ['minimalist', 'minimal', 'clean'],
  };

  const found = new Set<string>();

  for (const [pattern, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      found.add(pattern);
    }
  }

  return Array.from(found);
}

/**
 * Extract color scheme
 */
function extractColorScheme(text: string, brandName?: BrandName): string[] | undefined {
  if (brandName && BRAND_DATABASE[brandName]) {
    return [...BRAND_DATABASE[brandName].colorScheme];
  }

  const colors: string[] = [];
  const colorPatterns = [
    /#[0-9a-f]{6}\b/gi, // Hex colors
    /\b(red|blue|green|yellow|purple|pink|orange|teal|cyan|indigo|violet|emerald|amber|lime|sky|rose)\b/gi,
  ];

  for (const pattern of colorPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      colors.push(...matches);
    }
  }

  return colors.length > 0 ? Array.from(new Set(colors)).slice(0, 5) : undefined;
}

/**
 * Calculate relevance score (0-100)
 */
function calculateRelevanceScore(
  data: {
    description: string;
    topics: string[];
    techStack: string[];
    designPatterns: string[];
    components: string[];
  },
  context: { description: string; appType: string; brandName?: BrandName }
): number {
  let score = 0;

  // Description match (0-30 points)
  const descWords = context.description.toLowerCase().split(/\s+/);
  const matchCount = descWords.filter(word =>
    data.description.toLowerCase().includes(word)
  ).length;
  score += Math.min(30, (matchCount / descWords.length) * 30);

  // App type match (0-20 points)
  if (data.description.toLowerCase().includes(context.appType.toLowerCase()) ||
      data.topics.some(t => t.includes(context.appType))) {
    score += 20;
  }

  // Brand match (0-25 points)
  if (context.brandName) {
    const brandData = BRAND_DATABASE[context.brandName];
    const brandKeywords = [context.brandName, ...brandData.keywords];
    if (brandKeywords.some(kw =>
      data.description.toLowerCase().includes(kw.toLowerCase())
    )) {
      score += 25;
    }
  }

  // Tech stack relevance (0-15 points)
  score += Math.min(15, data.techStack.length * 3);

  // Design patterns (0-10 points)
  score += Math.min(10, data.designPatterns.length * 2);

  return Math.min(100, Math.round(score));
}

/**
 * Calculate quality score (0-100)
 */
function calculateQualityScore(data: {
  stars: number;
  hasDescription: boolean;
  hasTopics: boolean;
  hasHomepage: boolean;
  lastUpdated: string;
}): number {
  let score = 0;

  // Star count (0-40 points)
  score += Math.min(40, Math.log10(data.stars + 1) * 10);

  // Has description (10 points)
  if (data.hasDescription) score += 10;

  // Has topics (10 points)
  if (data.hasTopics) score += 10;

  // Has homepage (10 points)
  if (data.hasHomepage) score += 10;

  // Recently updated (0-20 points)
  const daysSinceUpdate = data.lastUpdated
    ? Math.floor((Date.now() - new Date(data.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
    : 9999;
  score += Math.max(0, 20 - (daysSinceUpdate / 30));

  return Math.min(100, Math.round(score));
}

/**
 * Extract data from web search results
 */
export function extractWebData(
  rawResults: any,
  searchContext: { description: string; appType: string; brandName?: BrandName }
): ExtractedWebResult[] {
  console.log('[Data Extractor] Web raw results structure:', JSON.stringify(rawResults, null, 2).substring(0, 500));
  console.log('[Data Extractor] Has web.results?', !!rawResults?.web?.results);
  console.log('[Data Extractor] Has results?', !!rawResults?.results);
  console.log('[Data Extractor] Is array?', Array.isArray(rawResults));
  console.log('[Data Extractor] Keys:', Object.keys(rawResults || {}).join(', '));

  const results: ExtractedWebResult[] = [];

  // Support multiple search provider formats
  let items: any[] = [];

  if (rawResults?.web?.results) {
    // Brave Search format
    items = rawResults.web.results;
  } else if (rawResults?.results) {
    // Exa/generic format
    items = rawResults.results;
  } else if (Array.isArray(rawResults)) {
    // Array format (DuckDuckGo)
    items = rawResults;
  }

  console.log('[Data Extractor] Found', items.length, 'web items');

  for (const item of items.slice(0, 10)) {
    const result = extractWebResultData(item, searchContext);
    if (result.relevanceScore > 30) {
      results.push(result);
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results.slice(0, 5);
}

/**
 * Extract data from a single web result
 */
function extractWebResultData(
  item: any,
  searchContext: { description: string; appType: string; brandName?: BrandName }
): ExtractedWebResult {
  const title = item.title || '';
  const description = item.description || item.snippet || item.body || '';
  const url = item.url || item.href || '';
  const domain = extractDomain(url);

  const combined = `${title} ${description}`.toLowerCase();

  // Extract design patterns
  const designPatterns = extractDesignPatterns(combined);

  // Extract code snippets (if present)
  const codeSnippets = extractCodeSnippets(description);

  // Extract concepts
  const concepts = extractConcepts(combined);

  // Extract tools and libraries
  const tools = extractTechStack(combined, []);

  // Check if official source
  const isOfficial = checkIfOfficial(domain, searchContext.brandName);

  // Check content type
  const isTutorial = /tutorial|guide|how to|step by step/i.test(combined);
  const isDocumentation = /documentation|docs|api reference/i.test(combined);

  // Calculate relevance
  const relevanceScore = calculateWebRelevance(
    { title, description, domain, isOfficial },
    searchContext
  );

  return {
    title,
    url,
    description,
    domain,
    designPatterns,
    codeSnippets,
    concepts,
    tools,
    libraries: tools,
    isOfficial,
    isTutorial,
    isDocumentation,
    relevanceScore,
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Extract code snippets
 */
function extractCodeSnippets(text: string): string[] {
  const snippets: string[] = [];

  // Look for code block patterns
  const codeBlockPattern = /```[\s\S]*?```/g;
  const matches = text.match(codeBlockPattern);
  if (matches) {
    snippets.push(...matches);
  }

  // Look for inline code
  const inlineCodePattern = /`[^`]+`/g;
  const inlineMatches = text.match(inlineCodePattern);
  if (inlineMatches) {
    snippets.push(...inlineMatches.slice(0, 3));
  }

  return snippets.slice(0, 5);
}

/**
 * Extract concepts
 */
function extractConcepts(text: string): string[] {
  const concepts: Record<string, string[]> = {
    'MVC architecture': ['mvc', 'model view controller'],
    'Microservices': ['microservices', 'microservice architecture'],
    'Monorepo': ['monorepo', 'monolithic repository'],
    'JAMstack': ['jamstack', 'jam stack'],
    'Serverless': ['serverless', 'faas', 'lambda functions'],
    'Edge computing': ['edge', 'edge computing', 'cloudflare workers'],
    'Progressive Web App (PWA)': ['pwa', 'progressive web app'],
    'Single Page Application (SPA)': ['spa', 'single page application'],
    'Multi-page Application (MPA)': ['mpa', 'multi-page application'],
  };

  const found = new Set<string>();

  for (const [concept, keywords] of Object.entries(concepts)) {
    if (keywords.some(kw => text.includes(kw))) {
      found.add(concept);
    }
  }

  return Array.from(found);
}

/**
 * Check if source is official
 */
function checkIfOfficial(domain: string, brandName?: BrandName): boolean {
  if (!brandName || !domain) return false;

  const brandData = BRAND_DATABASE[brandName];
  return brandData.officialDomains.some(official =>
    domain.includes(official)
  );
}

/**
 * Calculate web result relevance (0-100)
 */
function calculateWebRelevance(
  data: { title: string; description: string; domain: string; isOfficial: boolean },
  context: { description: string; appType: string; brandName?: BrandName }
): number {
  let score = 0;

  // Official source (40 points)
  if (data.isOfficial) score += 40;

  // Title match (0-30 points)
  const titleWords = context.description.toLowerCase().split(/\s+/);
  const titleMatchCount = titleWords.filter(word =>
    data.title.toLowerCase().includes(word)
  ).length;
  score += Math.min(30, (titleMatchCount / titleWords.length) * 30);

  // Description match (0-20 points)
  const descMatchCount = titleWords.filter(word =>
    data.description.toLowerCase().includes(word)
  ).length;
  score += Math.min(20, (descMatchCount / titleWords.length) * 20);

  // Trusted domain (0-10 points)
  const trustedDomains = ['github.com', 'stackoverflow.com', 'dev.to', 'medium.com', 'css-tricks.com'];
  if (trustedDomains.some(d => data.domain.includes(d))) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Aggregate extracted data into context
 */
export function aggregateExtractedData(
  repositories: ExtractedRepository[],
  webResults: ExtractedWebResult[],
  brandName?: BrandName
): ExtractedContext {
  // Aggregate tech stack
  const techStackMap = new Map<string, number>();
  repositories.forEach(repo => {
    repo.techStack.forEach(tech => {
      techStackMap.set(tech, (techStackMap.get(tech) || 0) + 1);
    });
  });
  webResults.forEach(result => {
    result.tools.forEach(tech => {
      techStackMap.set(tech, (techStackMap.get(tech) || 0) + 0.5);
    });
  });

  const topTechStack = Array.from(techStackMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tech]) => tech);

  // Aggregate design patterns
  const patternMap = new Map<string, number>();
  repositories.forEach(repo => {
    repo.designPatterns.forEach(pattern => {
      patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1);
    });
  });
  webResults.forEach(result => {
    result.designPatterns.forEach(pattern => {
      patternMap.set(pattern, (patternMap.get(pattern) || 0) + 0.5);
    });
  });

  const topDesignPatterns = Array.from(patternMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern]) => pattern);

  // Aggregate components
  const componentMap = new Map<string, number>();
  repositories.forEach(repo => {
    repo.components.forEach(component => {
      componentMap.set(component, (componentMap.get(component) || 0) + 1);
    });
  });

  const topComponents = Array.from(componentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([component]) => component);

  // Get recommended libraries (from top tech stack)
  const recommendedLibraries = topTechStack.slice(0, 5);

  // Collect color schemes
  const colorSchemes = repositories
    .filter(repo => repo.colorScheme)
    .map(repo => repo.colorScheme!);

  // Calculate average quality
  const totalQuality = repositories.reduce((sum, repo) => sum + repo.qualityScore, 0);
  const averageQuality = repositories.length > 0
    ? Math.round(totalQuality / repositories.length)
    : 0;

  // Check for official sources
  const hasOfficialSources = webResults.some(r => r.isOfficial);

  return {
    repositories,
    webResults,
    topTechStack,
    topDesignPatterns,
    topComponents,
    recommendedLibraries,
    colorSchemes,
    totalSources: repositories.length + webResults.length,
    averageQuality,
    hasOfficialSources,
    brandMatch: brandName,
  };
}
