# MCP Enhancement Guide

## Overview

The MCP (Model Context Protocol) system has been significantly enhanced with:
- **Smart Query Optimizer** - Generates optimized search queries for GitHub and Web Search
- **Brand Recognition Engine** - Comprehensive brand detection with 50+ brands
- **Advanced Data Extractor** - Extracts structured data, code snippets, design patterns
- **Context Passer** - Properly formats and passes data to AI for execution

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Request                                │
│            "Create a Stripe clone dashboard"                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Brand Detection & Query Optimization               │
│  - Detect: ["stripe"]                                           │
│  - Type: Brand Clone                                            │
│  - Generate optimized queries for GitHub and Web                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌──────────────────┐
│  GitHub Search  │           │   Web Search     │
│  - Brave (1st)  │           │  - DuckDuckGo    │
│  - DuckDuckGo   │           │  - Exa           │
│  - Fallbacks    │           │  - Fallbacks     │
└────────┬────────┘           └────────┬─────────┘
         │                             │
         └───────────────┬─────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Data Extraction & Analysis                    │
│  - Extract: Tech Stack, Design Patterns, Components            │
│  - Score: Relevance (0-100), Quality (0-100)                   │
│  - Filter: Only high-quality, relevant results                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Context Aggregation                          │
│  - Combine GitHub + Web results                                │
│  - Identify top tech stack                                     │
│  - Identify top design patterns                                │
│  - Identify essential components                               │
│  - Generate actionable insights                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Enhanced AI Context                            │
│  - Structured data passed to AI                                │
│  - Clear action items                                          │
│  - Mandatory instructions for brand clones                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Generates Code                             │
│  - With proper tech stack                                      │
│  - With correct design patterns                                │
│  - With brand-accurate styling                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Brand Recognition Engine

**Location:** `lib/mcp-query-optimizer.ts`

Detects 50+ brands across categories:
- AI & Chatbots: OpenAI, Anthropic, Midjourney
- Payment: Stripe, PayPal
- E-commerce: Shopify, Amazon, Etsy
- Social Media: Twitter, Instagram, LinkedIn, Facebook, TikTok, Reddit
- Productivity: Notion, Linear, Figma, Slack, Discord, Trello, Asana
- Media: Netflix, Spotify, YouTube, SoundCloud
- Travel: Airbnb, Uber, Booking.com
- Developer Tools: GitHub, GitLab, Vercel, Supabase

Each brand includes:
- Keywords for detection
- Design keywords (UI patterns)
- Recommended tech stack
- Color scheme
- Official domains
- Minimum star threshold

**Example:**
```typescript
const brandInfo = detectBrands("Create a Stripe clone payment dashboard");
// Returns:
// {
//   brands: ['stripe'],
//   isClone: true,
//   primaryBrand: 'stripe'
// }
```

### 2. Smart Query Optimizer

**Location:** `lib/mcp-query-optimizer.ts`

Generates optimized queries based on:
- **Brand Clone Detection** - Special queries for brand replicas
- **Keyword Extraction** - Removes stop words, prioritizes meaningful terms
- **Search Operators** - Uses GitHub's `stars:>N`, `language:`, `topic:` operators
- **Contextual Focus** - Different strategies for design vs. code vs. architecture

**GitHub Query Strategies:**
1. **Brand Clone Search** - `${brand} clone ${appType} stars:>100 ${techStack}`
2. **Brand Reference Search** - `${brand} ${appType} stars:>50 ${techStack}`
3. **Semantic Keyword Search** - `${keywords} ${appType} language:typescript stars:>20`

**Web Query Strategies:**
1. **Brand Design System Search** - `${brand} official design system UI components 2024 2025`
2. **Brand Information Search** - `${brand} design patterns best practices 2024 2025`
3. **Best Practices Search** - `${appType} ${keywords} modern UI design examples 2024 2025`

**Example:**
```typescript
const githubQuery = optimizeGitHubQuery(
  "Create a Stripe payment dashboard",
  "dashboard",
  { minStars: 50 }
);
// Returns:
// {
//   query: "stripe clone dashboard stars:>100 react typescript",
//   explanation: "Searching for stripe clones with...",
//   searchStrategy: "Brand Clone Search"
// }
```

### 3. Advanced Data Extractor

**Location:** `lib/mcp-data-extractor.ts`

Extracts structured data from raw search results:

**From GitHub Repositories:**
- Tech stack (React, Next.js, TypeScript, Tailwind, etc.)
- Design patterns (SSR, SSG, Dark mode, Authentication, etc.)
- UI components (Navbar, Sidebar, Modal, Table, etc.)
- Features (from description)
- UI patterns (Grid, Glassmorphism, Animations, etc.)
- Color scheme (brand colors)
- Quality score (0-100 based on stars, recency, documentation)
- Relevance score (0-100 based on description match, tech stack)

**From Web Results:**
- Design patterns
- Code snippets
- Concepts (MVC, Microservices, JAMstack, etc.)
- Tools and libraries
- Content type (Official, Tutorial, Documentation)
- Relevance score

**Scoring Algorithm:**

*Relevance Score (0-100):*
- Description match: 30 points
- App type match: 20 points
- Brand match: 25 points
- Tech stack: 15 points
- Design patterns: 10 points

*Quality Score (0-100):*
- Star count: 40 points (logarithmic)
- Has description: 10 points
- Has topics: 10 points
- Has homepage: 10 points
- Recently updated: 20 points

**Example:**
```typescript
const extractedRepos = extractGitHubData(githubResults, {
  description: "Stripe clone",
  appType: "dashboard",
  brandName: "stripe"
});
// Returns array of ExtractedRepository with:
// - Relevance scores (70-95)
// - Quality scores (80-95)
// - Tech stack: ['React', 'TypeScript', 'Stripe', 'Tailwind CSS']
// - Design patterns: ['Dark mode', 'Authentication', 'Responsive design']
// - Components: ['Payment form', 'Dashboard', 'Table']
```

### 4. Context Aggregation

**Location:** `lib/mcp-data-extractor.ts` - `aggregateExtractedData()`

Combines all extracted data into actionable insights:
- **Top Tech Stack** - Most mentioned technologies across all sources
- **Top Design Patterns** - Most common patterns
- **Top Components** - Essential UI components
- **Recommended Libraries** - From top tech stack
- **Color Schemes** - Brand-specific colors
- **Quality Metrics** - Average quality score, total sources
- **Official Sources** - Whether official documentation was found

**Example Output:**
```typescript
{
  topTechStack: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Stripe'],
  topDesignPatterns: ['Dark mode', 'Responsive design', 'Authentication', 'SSR'],
  topComponents: ['Navigation bar', 'Sidebar', 'Dashboard', 'Table', 'Modal'],
  recommendedLibraries: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Stripe'],
  colorSchemes: [['#635bff', 'indigo', 'white', 'modern']],
  totalSources: 8,
  averageQuality: 87,
  hasOfficialSources: true,
  brandMatch: 'stripe'
}
```

### 5. Enhanced Context Formatting

**Location:** `lib/mcp-background-helper.ts` - `formatEnhancedContextForAI()`

Formats aggregated data into comprehensive AI context:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ENHANCED REFERENCE CONTEXT (MCP-Powered)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 BRAND DETECTION:
   Detected: stripe
   Primary: stripe
   Clone Request: ✅ YES

⚠️ CRITICAL INSTRUCTION:
This is a BRAND CLONE request. You MUST:
1. Study the official design patterns below
2. Replicate the visual style, layout, and components
3. Match the color scheme and branding
4. Include similar features and functionality
This is MANDATORY - not a suggestion!

📊 DATA ANALYSIS:
   Total Sources: 8
   Average Quality: 87/100
   Official Sources: ✅ Found

💻 RECOMMENDED TECH STACK:
   1. React
   2. TypeScript
   3. Tailwind CSS
   4. Next.js
   5. Stripe

🎨 TOP DESIGN PATTERNS:
   1. Dark mode
   2. Responsive design
   3. Authentication
   4. SSR (Server-side rendering)
   5. Form validation
   ...

🧩 ESSENTIAL COMPONENTS:
   1. Navigation bar
   2. Sidebar
   3. Payment form
   4. Dashboard
   5. Table
   ...

📦 HIGH-QUALITY GITHUB REPOSITORIES:

1. stripe/stripe-node (⭐ 3500)
   Official Stripe Node.js library
   Tech: TypeScript, Node.js, Stripe, Express
   Patterns: Authentication, Webhooks, Testing
   Quality: 95/100 | Relevance: 92/100
   URL: https://github.com/stripe/stripe-node

...

🌐 WEB INSIGHTS & RESOURCES:

1. Stripe Official Documentation ⭐ OFFICIAL
   Complete guide to Stripe's payment APIs and integration...
   Source: stripe.com
   Type: Documentation
   Relevance: 98/100
   URL: https://stripe.com/docs

...

✅ ACTION ITEMS:
   1. Study the stripe repositories and resources above
   2. Replicate their design language and component structure
   3. Use the recommended tech stack and patterns
   4. Match the official color scheme and branding
   5. Implement similar features and user flows

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Usage

### Basic Usage

The enhanced MCP system is automatically used when you make requests:

```typescript
// In your app (e.g., planning phase)
import { gatherBackgroundContext, formatEnhancedContextForAI } from './lib/mcp-background-helper';

const context = await gatherBackgroundContext(
  "Create a Stripe clone payment dashboard",
  "dashboard"
);

const aiContext = formatEnhancedContextForAI(context, description);
// Pass aiContext to your AI prompt
```

### Advanced Usage

Access structured data directly:

```typescript
const context = await gatherBackgroundContext(...);

if (context.structured) {
  // Access brand info
  console.log(context.structured.brandInfo);

  // Access aggregated insights
  const techStack = context.structured.aggregated.topTechStack;
  const patterns = context.structured.aggregated.topDesignPatterns;

  // Access repositories
  const repos = context.structured.repositories;
  const topRepo = repos[0];
  console.log(topRepo.techStack);
  console.log(topRepo.components);

  // Access web results
  const webResults = context.structured.webResults;
  const officialSources = webResults.filter(r => r.isOfficial);
}
```

### Standalone Query Optimization

Use the query optimizer independently:

```typescript
import { optimizeGitHubQuery, optimizeWebQuery } from './lib/mcp-query-optimizer';

// Optimize GitHub query
const githubQuery = optimizeGitHubQuery(
  "Create a Netflix clone",
  "video-streaming-app",
  { minStars: 100, language: 'typescript' }
);

console.log(githubQuery.query);
console.log(githubQuery.searchStrategy);
console.log(githubQuery.explanation);

// Optimize web query
const webQuery = optimizeWebQuery(
  "Create a Netflix clone",
  "video-streaming-app",
  { includeYear: true, focusOn: 'design' }
);
```

### Standalone Data Extraction

Extract data from raw search results:

```typescript
import { extractGitHubData, extractWebData, aggregateExtractedData } from './lib/mcp-data-extractor';

// Extract from GitHub
const repos = extractGitHubData(rawGithubResults, {
  description: "Netflix clone",
  appType: "video-streaming",
  brandName: "netflix"
});

// Extract from web
const webResults = extractWebData(rawWebResults, {
  description: "Netflix clone",
  appType: "video-streaming",
  brandName: "netflix"
});

// Aggregate
const aggregated = aggregateExtractedData(repos, webResults, "netflix");
```

## Configuration

### Search Provider Priority

**Current Order:**
1. Brave Search (paid, best quality) - Requires `BRAVE_API_KEY`
2. DuckDuckGo (free, good quality) - No API key required
3. Exa Search (paid, alternative) - Requires `EXA_API_KEY`

### Star Thresholds by App Type

```typescript
{
  'landing-page': 20,
  'dashboard': 50,
  'saas-app': 100,
  'ecommerce': 50,
  'blog': 20,
  'portfolio': 20,
  'tool': 30,
  'game': 50,
  'other': 20
}
```

Brand clones automatically use higher thresholds (50-200 stars).

### Timeout Configuration

Background context gathering has a 3-second timeout by default:

```typescript
const context = await gatherBackgroundContext(
  description,
  appType,
  { timeout: 5000, minStars: 50 } // Custom timeout: 5 seconds
);
```

## Performance Optimizations

1. **Parallel Search Execution** - GitHub and Web searches run in parallel
2. **Smart Filtering** - Only high-relevance (>30) and high-quality (>40) results kept
3. **Result Limiting** - Max 5 repos, max 5 web results to avoid context bloat
4. **Fallback Chain** - Graceful degradation if any provider fails
5. **Silent Failures** - Background context never blocks the main flow
6. **Caching Potential** - Structured data can be cached for repeated queries

## Error Handling

All MCP operations are wrapped in try-catch blocks:

```typescript
try {
  // Search GitHub
} catch (error) {
  console.log("[Background MCP] GitHub search failed (OK)");
  // Continue with web search
}

try {
  // Search web
} catch (error) {
  console.log("[Background MCP] Web search failed (OK)");
  // Continue anyway
}
```

The system **never throws errors** - it degrades gracefully.

## Logging

Enhanced logging for debugging:

```
[Background MCP] 🔍 Brand Detection: { detected: ['stripe'], isClone: true }
[Background MCP] 📦 Optimizing GitHub query...
[Background MCP] 🎯 GitHub Strategy: Brand Clone Search
[Background MCP] 🔎 Query: stripe clone dashboard stars:>100 react typescript
[Background MCP] 💡 Searching for stripe clones with...
[Background MCP] ✅ Found 5 high-quality GitHub repos
[Background MCP] 🌐 Optimizing web query...
[Background MCP] 🎯 Web Strategy: Brand Design System Search
[Background MCP] 🔎 Design Query: stripe official design system UI components 2024 2025
[Background MCP] 🔵 Trying Brave Search (primary)...
[Background MCP] ✅ Brave found results
[Background MCP] ✅ Extracted 3 high-quality web results from Brave Search
[Background MCP] 📊 Aggregation Summary:
  - Total sources: 8
  - Top tech: React, TypeScript, Tailwind CSS
  - Top patterns: Dark mode, Responsive design, Authentication
  - Official sources: Yes
  - Average quality: 87/100
```

## Testing

### Test Brand Detection

```typescript
import { detectBrands } from './lib/mcp-query-optimizer';

console.log(detectBrands("Build a Stripe clone"));
console.log(detectBrands("Create an app like Netflix"));
console.log(detectBrands("Dashboard with charts"));
```

### Test Query Optimization

```typescript
import { optimizeGitHubQuery, optimizeWebQuery } from './lib/mcp-query-optimizer';

const tests = [
  "Build a Stripe clone dashboard",
  "Create a Netflix-like streaming app",
  "Simple todo app with dark mode"
];

tests.forEach(desc => {
  console.log("\n" + desc);
  console.log("GitHub:", optimizeGitHubQuery(desc, "app").query);
  console.log("Web:", optimizeWebQuery(desc, "app", { focusOn: 'design' }).query);
});
```

### Test Data Extraction

```typescript
// Use real MCP calls
const mcpManager = getMCPManager();

const result = await mcpManager.callTool("github", "search_repositories", {
  query: "stripe clone stars:>100"
});

const extracted = extractGitHubData(result, {
  description: "Stripe clone",
  appType: "dashboard",
  brandName: "stripe"
});

console.log(extracted);
```

## Future Enhancements

1. **Code Snippet Extraction** - Directly extract code from repositories
2. **Component Library Detection** - Identify shadcn/ui, Radix, etc.
3. **Architecture Analysis** - Detect monorepo, microservices patterns
4. **Performance Metrics** - Lighthouse scores from live demos
5. **Visual Similarity** - Screenshot analysis for design matching
6. **Semantic Search** - Use embeddings for better matching
7. **Result Caching** - Cache results for repeated queries
8. **A/B Testing** - Compare different query strategies

## Troubleshooting

### No results returned

1. Check API keys: `BRAVE_API_KEY`, `GITHUB_TOKEN`
2. Check rate limits on search providers
3. Try reducing `minStars` threshold
4. Check logs for specific errors

### Low-quality results

1. Increase `minStars` threshold
2. Add more specific keywords to description
3. Mention brand name explicitly if applicable
4. Check if results are being filtered by relevance score

### Timeout errors

1. Increase timeout: `{ timeout: 5000 }`
2. Check network connection
3. Try individual providers separately

## API Reference

See the detailed API documentation in:
- [lib/mcp-query-optimizer.ts](../lib/mcp-query-optimizer.ts)
- [lib/mcp-data-extractor.ts](../lib/mcp-data-extractor.ts)
- [lib/mcp-background-helper.ts](../lib/mcp-background-helper.ts)
