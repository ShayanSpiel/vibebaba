/**
 * Central Generation Constraints
 *
 * Single source of truth for generation rules
 * Applied at workflow level, not repeated in every prompt
 */

export const GENERATION_CONSTRAINTS = {
  // Core principle
  principle: 'explicit-only',  // Only add what user explicitly requested

  // Default component inclusion behavior
  components: {
    navigation: {
      defaultInclude: false,
      includeIf: 'User mentions navigation/menu/navbar OR multi-page app'
    },
    footer: {
      defaultInclude: false,
      includeIf: 'User mentions footer/copyright/contact info at bottom'
    },
    hero: {
      defaultInclude: false,
      includeIf: 'Landing page OR user mentions hero section'
    }
  },

  // Feature addition policy
  features: {
    policy: 'never-assume',
    rule: 'Do not add features for completeness or best practices'
  },

  // Output format constraints
  output: {
    jsonOnly: true,
    noMarkdown: true,
    noReasoningTags: true,
    noPlaceholders: true
  }
};

/**
 * Get constraint summary for prompts
 * This replaces verbose "don't do X" instructions
 */
export function getConstraintSummary(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 GENERATION CONSTRAINT (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONLY generate what user EXPLICITLY requested.

When in doubt: Generate LESS, not more.

Examples:
- "contact page" → ONLY contact form (no nav, no footer, no hero)
- "landing page" → Hero + CTA (probably no nav, no footer unless requested)
- "dashboard" → Nav + main content (no footer, no hero)
- "full website" → Nav + pages + footer (complete structure)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Get output format rules for prompts
 */
export function getOutputFormatRules(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ DO NOT include:
- Markdown code fences (\`\`\`json, \`\`\`)
- Reasoning tags (<think>, <reasoning>, <analysis>)
- Explanatory text before or after output
- Placeholder content (..., TODO, etc.)

✅ DO include:
- Only pure, valid output
- Complete implementations (no shortcuts)
- Exact format requested

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
