# MCP Quick Start Guide

## What Changed?

Your MCP system has been significantly enhanced to generate **super optimized queries** and extract **structured data** properly. Here's what's new:

## Key Improvements

### 1. Smart Brand Recognition (50+ brands)

**Before:**
```
Search: "stripe dashboard" → Basic keyword search
```

**After:**
```
Search: "Create a Stripe clone" → Detects brand "Stripe"
→ Uses brand-specific query: "stripe clone dashboard stars:>100 react typescript"
→ Searches for official Stripe design system
→ Extracts color scheme: #635bff (indigo)
→ Recommends tech: React, TypeScript, Stripe API
```

### 2. Optimized Search Queries

**Before:**
```typescript
GitHub: "dashboard app stars:>20"
Web: "dashboard app best practices 2025"
```

**After:**
```typescript
// Brand Clone
GitHub: "stripe clone dashboard stars:>100 react typescript"
Web: "stripe official design system UI components 2024 2025"

// Generic App
GitHub: "payment dashboard typescript stars:>50 topic:react"
Web: "payment dashboard modern UI design examples 2024 2025"
```

### 3. Structured Data Extraction

**Before:**
```
Returns: "stripe/stripe-node (3500 ⭐) - Stripe Node.js library"
```

**After:**
```typescript
{
  name: "stripe-node",
  stars: 3500,
  techStack: ['TypeScript', 'Node.js', 'Stripe', 'Express'],
  designPatterns: ['Authentication', 'Webhooks', 'Testing'],
  components: ['Payment form', 'Dashboard', 'API client'],
  relevanceScore: 92,
  qualityScore: 95,
  colorScheme: ['#635bff', 'indigo', 'white']
}
```

### 4. Context Passing to AI

**Before:**
```
Passes: Simple list of repository names
```

**After:**
```
Passes:
- Brand information (detected, clone status)
- Aggregated tech stack recommendations
- Design patterns to implement
- Essential components to include
- Color schemes
- Quality metrics
- Official documentation links
- Clear action items
```

## Usage Examples

### Example 1: Brand Clone

**User Request:**
```
"Create a Stripe clone payment dashboard"
```

**What Happens:**

1. **Brand Detection:**
   - Detects: `stripe`
   - Type: `Clone Request`
   - Official domains: `stripe.com`

2. **Optimized Queries:**
   ```
   GitHub: "stripe clone dashboard stars:>100 react typescript"
   Web: "stripe official design system UI components 2024 2025"
   ```

3. **Data Extracted:**
   - Tech Stack: React, TypeScript, Tailwind CSS, Stripe API
   - Patterns: Dark mode, Authentication, Form validation
   - Components: Payment form, Dashboard, Sidebar, Table
   - Colors: #635bff (indigo), white, modern

4. **AI Context:**
   ```
   ⚠️ CRITICAL: Brand clone request detected!

   You MUST:
   1. Study stripe repositories below
   2. Replicate their design (indigo colors, clean forms)
   3. Use tech: React, TypeScript, Tailwind CSS, Stripe API
   4. Include: Payment forms, Dashboard, Tables
   5. Implement: Dark mode, Authentication, Webhooks
   ```

5. **Result:** AI generates accurate Stripe-like dashboard with correct colors, components, and tech stack.

### Example 2: Social Media App

**User Request:**
```
"Build a Twitter-like social feed"
```

**What Happens:**

1. **Brand Detection:**
   - Detects: `twitter`
   - Type: `Clone Request`
   - Official domains: `twitter.com`, `x.com`

2. **Optimized Queries:**
   ```
   GitHub: "twitter clone social-media stars:>150 react"
   Web: "twitter design system UI patterns feed 2024 2025"
   ```

3. **Data Extracted:**
   - Tech Stack: React, React Query, Tailwind CSS, WebSocket
   - Patterns: Real-time updates, Infinite scroll, Authentication
   - Components: Timeline, Tweet card, Profile, Trending sidebar
   - Colors: #1da1f2 (blue), white

4. **AI Context:**
   ```
   ⚠️ CRITICAL: Brand clone request detected!

   Top Patterns:
   1. Timeline feed with infinite scroll
   2. Real-time updates (WebSocket)
   3. Tweet cards with actions (like, retweet)
   4. Responsive design
   5. Dark mode
   ```

### Example 3: Generic App (No Brand)

**User Request:**
```
"Create a todo app with dark mode"
```

**What Happens:**

1. **Brand Detection:**
   - Detects: None
   - Type: `Generic App`

2. **Optimized Queries:**
   ```
   GitHub: "todo dark mode typescript stars:>20 topic:react"
   Web: "todo app dark mode modern UI design examples 2024 2025"
   ```

3. **Data Extracted:**
   - Tech Stack: React, TypeScript, Tailwind CSS
   - Patterns: Dark mode toggle, Local storage, Drag-drop
   - Components: Todo item, Filter buttons, Input form

4. **AI Context:**
   ```
   Recommended Stack: React, TypeScript, Tailwind CSS

   Design Patterns to Apply:
   1. Dark mode with toggle
   2. Drag and drop
   3. Filter/search
   4. Local storage persistence
   ```

## Supported Brands (50+)

### AI & Chatbots
- OpenAI, ChatGPT, Claude, Midjourney

### Payment & Finance
- Stripe, PayPal

### E-commerce
- Shopify, Amazon, Etsy

### Social Media
- Twitter/X, Instagram, Facebook, LinkedIn, TikTok, Reddit

### Productivity
- Notion, Linear, Figma, Slack, Discord, Trello, Asana

### Media & Entertainment
- Netflix, Spotify, YouTube, SoundCloud

### Travel & Booking
- Airbnb, Uber, Booking.com

### Developer Tools
- GitHub, GitLab, Vercel, Supabase

## How to Test

### Test 1: Stripe Clone

```bash
# Make a request through your app
"Create a Stripe clone dashboard with payment forms"
```

**Expected:**
- ✅ Detects "Stripe" brand
- ✅ Finds official Stripe repos
- ✅ Extracts Stripe color scheme (#635bff)
- ✅ Recommends: React, TypeScript, Stripe API
- ✅ AI generates Stripe-like UI

### Test 2: Netflix Clone

```bash
"Build a Netflix clone with video streaming"
```

**Expected:**
- ✅ Detects "Netflix" brand
- ✅ Finds Netflix clone repos (stars >150)
- ✅ Extracts Netflix colors (#e50914 red, black)
- ✅ Recommends: React, Video player, Carousel
- ✅ AI generates Netflix-like UI

### Test 3: Generic App

```bash
"Create a simple blog with comments"
```

**Expected:**
- ✅ No brand detected
- ✅ Finds blog template repos
- ✅ Recommends: Next.js, MDX, Tailwind
- ✅ Patterns: SSG, SEO optimization, Comments
- ✅ AI generates modern blog

## Checking Logs

Enable detailed logging to see the MCP system in action:

```bash
# Run your app and watch the console
npm run dev
```

**Look for:**
```
[Background MCP] 🔍 Brand Detection: { detected: ['stripe'], isClone: true }
[Background MCP] 🎯 GitHub Strategy: Brand Clone Search
[Background MCP] 🔎 Query: stripe clone dashboard stars:>100 react typescript
[Background MCP] ✅ Found 5 high-quality GitHub repos
[Background MCP] 📊 Aggregation Summary:
  - Total sources: 8
  - Top tech: React, TypeScript, Tailwind CSS
  - Average quality: 87/100
```

## Configuration

### Environment Variables

```bash
# Required for GitHub search
GITHUB_TOKEN=your_github_token

# Optional: Better web search quality
BRAVE_API_KEY=your_brave_api_key

# Optional: Alternative web search
EXA_API_KEY=your_exa_api_key
```

### Adjust Timeouts

```typescript
// In your code
const context = await gatherBackgroundContext(
  description,
  appType,
  {
    timeout: 5000,  // 5 seconds (default: 3)
    minStars: 50    // Minimum stars (default: 20)
  }
);
```

### Adjust Quality Thresholds

Edit `lib/mcp-background-helper.ts`:

```typescript
// Line 146: Change relevance threshold
if (repo.relevanceScore > 30) {  // Lower = more results, higher = better quality
  repositories.push(repo);
}
```

## Troubleshooting

### "No references found"

**Possible causes:**
1. No API keys configured
2. Network issues
3. Rate limiting
4. Very niche query with no matches

**Solutions:**
1. Add `GITHUB_TOKEN` and `BRAVE_API_KEY` to `.env`
2. Check internet connection
3. Wait a few minutes and try again
4. Try a more general query

### "Low quality results"

**Possible causes:**
1. `minStars` threshold too low
2. Query too generic
3. Brand not in database

**Solutions:**
1. Increase `minStars`: `{ minStars: 100 }`
2. Be more specific: "Create a Stripe-like payment dashboard with checkout flow"
3. Add brand to `BRAND_DATABASE` in `lib/mcp-query-optimizer.ts`

### "Results not relevant"

**Possible causes:**
1. Ambiguous description
2. Wrong app type
3. Conflicting keywords

**Solutions:**
1. Be more specific about what you want
2. Use correct app type: `dashboard`, `landing-page`, `saas-app`
3. Remove contradictory requirements

## Advanced Usage

### Access Structured Data

```typescript
import { gatherBackgroundContext } from './lib/mcp-background-helper';

const context = await gatherBackgroundContext(
  "Create a Stripe clone",
  "dashboard"
);

// Access structured data
if (context.structured) {
  const { aggregated, repositories, webResults, brandInfo } = context.structured;

  // Use aggregated insights
  console.log("Top tech:", aggregated.topTechStack);
  console.log("Top patterns:", aggregated.topDesignPatterns);
  console.log("Top components:", aggregated.topComponents);

  // Use repositories
  repositories.forEach(repo => {
    console.log(`${repo.fullName}: ${repo.techStack.join(', ')}`);
  });

  // Use brand info
  if (brandInfo) {
    console.log("Brand:", brandInfo.primary);
    console.log("Is clone:", brandInfo.isClone);
  }
}
```

### Custom Query Optimization

```typescript
import { optimizeGitHubQuery, optimizeWebQuery } from './lib/mcp-query-optimizer';

// Custom GitHub query
const githubQuery = optimizeGitHubQuery(
  "Real-time chat app",
  "chat",
  {
    minStars: 200,
    language: 'typescript',
    includeTopics: true
  }
);

console.log(githubQuery.query);
// "real-time chat app language:typescript stars:>200 topic:react"

// Custom web query
const webQuery = optimizeWebQuery(
  "Real-time chat app",
  "chat",
  {
    includeYear: true,
    focusOn: 'architecture'  // 'design' | 'code' | 'architecture'
  }
);

console.log(webQuery.query);
// "chat app real-time messaging design architecture best practices 2024 2025"
```

### Add New Brand

Edit `lib/mcp-query-optimizer.ts`:

```typescript
export const BRAND_DATABASE = {
  // ... existing brands

  'yourBrand': {
    keywords: ['yourbrand', 'your-product'],
    designKeywords: ['clean', 'modern', 'colorful'],
    techStack: ['react', 'typescript', 'tailwind'],
    colorScheme: ['#ff0000', 'red', 'white'],
    officialDomains: ['yourbrand.com'],
    minStars: 50,
  },
};
```

## Performance Tips

1. **Use specific brand names** - Better results than generic terms
2. **Set appropriate minStars** - Higher = better quality, fewer results
3. **Increase timeout for complex queries** - `{ timeout: 5000 }`
4. **Cache results** - Store `context.structured` for repeated queries
5. **Use focused queries** - Don't combine unrelated features

## Next Steps

1. ✅ Test with different brand clones
2. ✅ Review generated code quality
3. ✅ Add your custom brands to `BRAND_DATABASE`
4. ✅ Adjust thresholds based on your needs
5. ✅ Monitor logs for optimization opportunities

## Support

For issues or questions:
1. Check the logs: `[Background MCP]` messages
2. Review the full documentation: [MCP_ENHANCEMENT_GUIDE.md](./MCP_ENHANCEMENT_GUIDE.md)
3. Test individual components (query optimizer, data extractor)
4. File an issue with logs and description

## Summary

The enhanced MCP system now:

✅ Recognizes 50+ brands automatically
✅ Generates optimized search queries
✅ Extracts structured data (tech stack, patterns, components)
✅ Scores results by quality and relevance
✅ Passes rich context to AI
✅ Provides clear action items
✅ Handles brand clones specially
✅ Degrades gracefully on errors

**Result:** Your AI generates **significantly better** code with **proper tech stacks**, **accurate designs**, and **brand-matching UI** every time! 🚀
