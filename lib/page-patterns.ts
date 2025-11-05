/**
 * Page Pattern Library
 *
 * Provides common page patterns with WHEN to use them (not exact HOW)
 * Enables AI to make informed layout decisions
 * ~150 tokens vs rigid templates
 *
 * Philosophy: Show PURPOSE and STRUCTURE, allow creative adaptation
 */

export interface PagePattern {
  name: string;
  purpose: string;
  structure: string;
  whenToUse: string;
  example: string;
}

/**
 * Get all available page patterns
 */
export function getPagePatterns(): PagePattern[] {
  return [
    {
      name: 'List View',
      purpose: 'Display collection of items with filtering and actions',
      structure: 'Header + Filters/Search + Table/Grid/List + Pagination',
      whenToUse: 'User needs to browse, filter, or manage multiple items',
      example: 'User list, product catalog, order history, blog posts'
    },
    {
      name: 'Detail View',
      purpose: 'Show comprehensive information about a single item',
      structure: 'Header + Content Sections + Related Data + Actions',
      whenToUse: 'User needs to view full details of one item',
      example: 'User profile, product details, order summary, blog post'
    },
    {
      name: 'Form View',
      purpose: 'Create or edit data with validation',
      structure: 'Header + Form Sections + Validation + Submit Actions',
      whenToUse: 'User needs to input or modify data',
      example: 'Create user, edit product, checkout form, settings'
    },
    {
      name: 'Dashboard',
      purpose: 'Overview of key metrics and recent activity',
      structure: 'Stats Grid + Charts/Graphs + Recent Activity + Quick Actions',
      whenToUse: 'User needs to see aggregated data and insights',
      example: 'Admin dashboard, analytics page, project overview'
    },
    {
      name: 'Calendar View',
      purpose: 'Display and manage time-based data',
      structure: 'Calendar Component + View Toggle (Day/Week/Month) + Event Details',
      whenToUse: 'User needs to view or schedule time-based items',
      example: 'Event scheduler, booking system, timeline, deadline tracker'
    },
    {
      name: 'Feed/Timeline',
      purpose: 'Display chronological stream of updates',
      structure: 'Header + Stream/Feed + Load More/Infinite Scroll',
      whenToUse: 'User needs to see recent updates or activity',
      example: 'Social feed, activity log, notifications, news feed'
    },
    {
      name: 'Wizard/Multi-Step',
      purpose: 'Guide user through sequential process',
      structure: 'Progress Indicator + Step Content + Back/Next Navigation',
      whenToUse: 'User needs to complete complex task in steps',
      example: 'Onboarding, checkout, setup wizard, form wizard'
    },
    {
      name: 'Split View',
      purpose: 'Show list and details side-by-side',
      structure: 'Sidebar List + Main Detail Panel',
      whenToUse: 'User needs to browse list while viewing details',
      example: 'Email client, file browser, chat interface'
    }
  ];
}

/**
 * Get page patterns as formatted string for AI prompts
 * Returns ~150 tokens of guidance
 */
export function getPagePatternsPrompt(): string {
  const patterns = getPagePatterns();

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 COMMON PAGE PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${patterns.map(p => `
${p.name.toUpperCase()}
Purpose: ${p.purpose}
Structure: ${p.structure}
Use When: ${p.whenToUse}
Examples: ${p.example}
`).join('\n')}

IMPORTANT:
- Choose pattern based on page purpose
- Mix patterns if requirements need it
- Adapt structure to fit specific content
- Be creative within pattern guidelines
`;
}

/**
 * Get specific pattern recommendation based on purpose keywords
 */
export function recommendPattern(
  purpose: string,
  keywords: string[]
): PagePattern | null {
  const patterns = getPagePatterns();
  const lowerPurpose = purpose.toLowerCase();
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  // Scoring system
  const scores = patterns.map(pattern => {
    let score = 0;

    // Check purpose description
    if (lowerPurpose.includes('list') || lowerPurpose.includes('browse')) {
      if (pattern.name === 'List View') score += 3;
    }
    if (lowerPurpose.includes('detail') || lowerPurpose.includes('view')) {
      if (pattern.name === 'Detail View') score += 3;
    }
    if (lowerPurpose.includes('form') || lowerPurpose.includes('create') || lowerPurpose.includes('edit')) {
      if (pattern.name === 'Form View') score += 3;
    }
    if (lowerPurpose.includes('dashboard') || lowerPurpose.includes('overview')) {
      if (pattern.name === 'Dashboard') score += 3;
    }
    if (lowerPurpose.includes('calendar') || lowerPurpose.includes('schedule')) {
      if (pattern.name === 'Calendar View') score += 3;
    }

    // Check keywords
    lowerKeywords.forEach(keyword => {
      if (pattern.example.toLowerCase().includes(keyword)) score += 1;
      if (pattern.whenToUse.toLowerCase().includes(keyword)) score += 1;
    });

    return { pattern, score };
  });

  // Return highest scoring pattern
  const best = scores.reduce((max, curr) => curr.score > max.score ? curr : max);
  return best.score > 0 ? best.pattern : null;
}

/**
 * Get minimal pattern reference (for tight token budgets)
 * Returns ~50 tokens
 */
export function getMinimalPatternReference(): string {
  return `⚠️ PATTERN REFERENCE - Choose ONE pattern based on what user requested. DO NOT build all patterns!

If user wants a simple form → Use FORM pattern only
If user wants to display list → Use LIST pattern only
If user wants dashboard → Use DASHBOARD pattern only

Common Patterns (REFERENCE):
• FORM: Form Fields + Validation + Submit
• LIST: Table/Grid + Pagination (if showing multiple items)
• DASHBOARD: Stats + Charts (if showing analytics)

Build ONLY the pattern matching the user's request. Do not mix multiple patterns unnecessarily.
`;
}

/**
 * Estimate token count for patterns prompt
 */
export function getPatternTokenEstimate(): number {
  const prompt = getPagePatternsPrompt();
  // Rough estimate: 4 chars per token
  return Math.ceil(prompt.length / 4);
}
