// lib/langsmith/ai-prompt-generator.ts
/**
 * AI-Powered Prompt Generation
 *
 * Uses AI to automatically generate optimized prompt variants
 * No manual prompt writing needed!
 */

// Load environment
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { generateWithFallback } from '@/lib/ai';
import { getLangSmithClient } from './client';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt generation strategies
 */
export type PromptStrategy =
  | 'concise'      // Short, efficient prompts
  | 'detailed'     // Comprehensive, thorough prompts
  | 'structured'   // JSON/structured output focused
  | 'creative'     // More creative/flexible
  | 'technical'    // Precise, technical language
  | 'conversational'; // Natural, friendly tone

/**
 * Generate prompt variants using AI
 */
export async function generatePromptVariants(config: {
  nodeName: string;
  purpose: string;
  baseExample: string;
  strategies: PromptStrategy[];
  numVariants?: number;
}): Promise<Array<{ name: string; template: string; strategy: PromptStrategy }>> {

  console.log(`🤖 [AI Generator] Creating prompts for ${config.nodeName}...`);

  const variants: Array<{ name: string; template: string; strategy: PromptStrategy }> = [];

  for (const strategy of config.strategies) {
    console.log(`   Generating "${strategy}" variant...`);

    const metaPrompt = buildMetaPrompt(
      config.nodeName,
      config.purpose,
      config.baseExample,
      strategy
    );

    try {
      const result = await generateWithFallback(metaPrompt, true);
      const generatedPrompt = result.text;

      variants.push({
        name: `${strategy}`,
        template: cleanGeneratedPrompt(generatedPrompt),
        strategy,
      });

      console.log(`   ✓ Created "${strategy}" variant (${generatedPrompt.length} chars) using ${result.provider}/${result.model}`);
    } catch (error: any) {
      console.error(`   ✗ Failed to generate "${strategy}":`, error.message);
    }
  }

  return variants;
}

/**
 * Build meta-prompt (prompt that generates prompts)
 */
function buildMetaPrompt(
  nodeName: string,
  purpose: string,
  baseExample: string,
  strategy: PromptStrategy
): string {

  const strategyInstructions = {
    concise: `
Create a CONCISE, efficient prompt that:
- Uses minimal words (30-50% shorter than example)
- Focuses only on essential outputs
- No fluff or explanations
- Direct, imperative tone
- Short bullet points`,

    detailed: `
Create a DETAILED, comprehensive prompt that:
- Provides extensive context (50-100% longer than example)
- Explains "why" behind each requirement
- Includes examples of good outputs
- Uses descriptive language
- Multiple sections with clear structure`,

    structured: `
Create a STRUCTURED prompt optimized for JSON output:
- Explicit JSON schema definition
- Field-by-field requirements
- Type specifications
- Validation rules
- Example JSON output`,

    creative: `
Create a CREATIVE, flexible prompt that:
- Encourages diverse outputs
- Allows AI autonomy
- Uses open-ended questions
- Flexible constraints
- Emphasizes innovation`,

    technical: `
Create a TECHNICAL, precise prompt that:
- Uses domain-specific terminology
- Exact specifications
- No ambiguity
- Precise constraints
- Technical accuracy focus`,

    conversational: `
Create a CONVERSATIONAL, friendly prompt that:
- Natural, human tone
- Questions instead of commands
- Collaborative language
- Encouraging, supportive
- Easy to understand`,
  };

  return `You are an expert prompt engineer. Create an optimized prompt for this AI task.

**Task:** ${nodeName}
**Purpose:** ${purpose}

**Strategy:** ${strategy}
${strategyInstructions[strategy]}

**Base Example Prompt:**
\`\`\`
${baseExample}
\`\`\`

**Requirements:**
1. Must use template variables like {variable_name} where appropriate
2. Must maintain same functionality as base example
3. Optimize for ${strategy} approach
4. Output ONLY the prompt template (no explanations)

**Output the optimized prompt below:**`;
}

/**
 * Clean generated prompt (remove markdown, extra formatting)
 */
function cleanGeneratedPrompt(rawPrompt: string): string {
  let cleaned = rawPrompt.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
  });

  // Remove leading/trailing quotes
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');

  return cleaned.trim();
}

/**
 * Upload generated prompts to LangSmith Hub
 */
export async function uploadPromptsToHub(
  prompts: Array<{ name: string; template: string; strategy: PromptStrategy }>,
  projectName: string
): Promise<void> {

  console.log(`\n📤 [Hub Upload] Uploading ${prompts.length} prompts...`);

  const client = getLangSmithClient();

  for (const prompt of prompts) {
    try {
      // Create a simple prompt name without username prefix
      // LangSmith will automatically associate it with your account
      // Format: lowercase, alphanumeric, hyphen, underscore only, starting with a-z
      const baseName = projectName.replace(/YOUR-LANGSMITH-USERNAME\//g, '').replace(/\//g, '-');
      const promptName = `${baseName}-${prompt.name}`
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Escape curly braces that are NOT template variables
      // This handles JSON examples in the prompts
      let escapedTemplate = prompt.template;

      // Detect template variables (they start with letter or underscore)
      // Everything else is JSON or literal text that needs escaping
      const templateVars: string[] = [];
      const tempPlaceholder = '___TEMPLATE_VAR_';

      // Replace template variables with placeholders
      escapedTemplate = escapedTemplate.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, varName) => {
        templateVars.push(varName);
        return `${tempPlaceholder}${templateVars.length - 1}___`;
      });

      // Now escape ALL remaining curly braces (these are JSON/literal)
      escapedTemplate = escapedTemplate.replace(/\{/g, '{{').replace(/\}/g, '}}');

      // Restore template variables
      escapedTemplate = escapedTemplate.replace(new RegExp(`${tempPlaceholder}(\\d+)___`, 'g'), (match, index) => {
        return `{${templateVars[parseInt(index)]}}`;
      });

      // Convert template string to ChatPromptTemplate
      const chatPrompt = ChatPromptTemplate.fromMessages([
        ['system', escapedTemplate]
      ]);

      await client.pushPrompt(promptName, {
        object: chatPrompt,
        isPublic: false,
      });

      console.log(`   ✓ Uploaded: ${promptName}`);
    } catch (error: any) {
      console.error(`   ✗ Failed to upload ${prompt.name}:`, error.message);
    }
  }

  console.log(`\n✅ Upload complete!`);
}

/**
 * Generate and upload prompts for a node (complete flow)
 */
export async function autoGenerateNodePrompts(config: {
  nodeName: string;
  purpose: string;
  baseExample: string;
  projectName: string;
  strategies?: PromptStrategy[];
}): Promise<void> {

  const strategies = config.strategies || ['concise', 'detailed', 'structured'];

  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🤖 Auto-Generating Prompts for ${config.nodeName}`);
  console.log('━'.repeat(60));

  // Generate variants
  const variants = await generatePromptVariants({
    nodeName: config.nodeName,
    purpose: config.purpose,
    baseExample: config.baseExample,
    strategies,
  });

  console.log(`\n📊 Generated ${variants.length} variants`);

  // Show preview
  for (const variant of variants) {
    console.log(`\n${variant.name}:`);
    console.log(`  Length: ${variant.template.length} chars`);
    console.log(`  Preview: ${variant.template.substring(0, 100)}...`);
  }

  // Upload to Hub
  await uploadPromptsToHub(variants, config.projectName);

  console.log(`\n✅ Done! Created ${variants.length} prompts for ${config.nodeName}`);
  console.log(`\nView in Hub: https://smith.langchain.com/hub`);
}

/**
 * Node configurations for prompt generation
 */
const nodeConfigs = [
  {
    nodeName: 'Founder',
    projectName: 'YOUR-LANGSMITH-USERNAME/founder',
    purpose: 'Refine user requirements into clear, actionable specifications',
    baseExample: `Analyze this user request: "{userDescription}"

Provide:
- Refined requirements (clear description)
- Target audience (specific demographics)
- Primary goal (main objective)
- Success metrics (measurable KPIs)`,
    strategies: ['concise', 'detailed', 'technical'] as PromptStrategy[],
  },

  {
    nodeName: 'PM',
    projectName: 'YOUR-LANGSMITH-USERNAME/pm-planning',  // TODO: Replace with your actual LangSmith username
    purpose: 'Create product plan with features and design direction',
    baseExample: `Create MVP plan for: "{requirements}"

Context:
- App Type: {appType}
- Complexity: {complexity}
- Features: {mvpFeatures}

Generate:
- Overview (1-3 sentences)
- Core Features ({featureCount} features)
- Design Direction (visual style)`,
    strategies: ['concise', 'detailed', 'structured'] as PromptStrategy[],
  },

  {
    nodeName: 'UX',
    projectName: 'YOUR-LANGSMITH-USERNAME/ux-design',
    purpose: 'Select design system and define UI/UX approach',
    baseExample: `Design UI/UX for: {appType}

Plan: {plan}

Select:
- Design system (tailwind-shadcn/ant-design)
- Visual tone (light/dark/colorful)
- Color palette
- Typography`,
    strategies: ['concise', 'creative', 'structured'] as PromptStrategy[],
  },

  {
    nodeName: 'Backend',
    projectName: 'YOUR-LANGSMITH-USERNAME/backend-schema',
    purpose: 'Generate database schema and API structure',
    baseExample: `Generate database schema for: "{plan}"

Create:
- Collections/tables
- Fields with types
- Relationships
- Indexes`,
    strategies: ['technical', 'structured', 'detailed'] as PromptStrategy[],
  },

  {
    nodeName: 'Frontend',
    projectName: 'YOUR-LANGSMITH-USERNAME/frontend-gen',
    purpose: 'Generate Next.js code with components and pages',
    baseExample: `Generate Next.js app for: "{plan}"

Design: {designSystem}
Backend: {backendConfig}

Create:
- File structure
- Components
- Pages
- API integration`,
    strategies: ['technical', 'structured', 'detailed'] as PromptStrategy[],
  },

  {
    nodeName: 'QA',
    projectName: 'YOUR-LANGSMITH-USERNAME/qa-validation',
    purpose: 'Validate generated code and trigger automated debugging when issues are found',
    baseExample: `Validate these code files: {files}

Check for:
- TypeScript errors
- Import issues
- API integration problems
- Database schema mismatches

Return:
- Validation status (pass/fail)
- Error list with locations
- Severity (critical/warning)
- Suggested fixes`,
    strategies: ['technical', 'structured', 'detailed'] as PromptStrategy[],
  },

  {
    nodeName: 'DevOps',
    projectName: 'YOUR-LANGSMITH-USERNAME/devops-deployment',
    purpose: 'Deploy application files to PocketBase and generate preview URLs',
    baseExample: `Deploy application: {appName}

Files: {files}
Backend: {backendConfig}

Actions:
- Deduplicate files (scaffold vs user files)
- Save to PocketBase
- Generate preview URL
- Return deployment status`,
    strategies: ['technical', 'concise', 'structured'] as PromptStrategy[],
  },

  {
    nodeName: 'Editor',
    projectName: 'YOUR-LANGSMITH-USERNAME/editor-modifications',
    purpose: 'Intelligently modify, create, or delete code files based on user requests',
    baseExample: `Edit application based on request: "{userRequest}"

Current files: {files}
Backend: {backendConfig}

Determine:
- Which files to modify/create/delete
- Specific changes needed
- Preserve database integration
- Maintain code quality

Return:
- Modified files with full content
- Change descriptions`,
    strategies: ['technical', 'detailed', 'structured'] as PromptStrategy[],
  },

  {
    nodeName: 'Autogen',
    projectName: 'YOUR-LANGSMITH-USERNAME/autogen-debugger',
    purpose: 'Multi-agent automated debugging using analyst, fixer, file operations, and reviewer agents',
    baseExample: `Debug errors: {errors}

Context:
- Files: {files}
- Backend: {backendConfig}

Workflow:
1. Analyst: Analyze errors and identify root causes
2. Fixer: Generate code fixes
3. FileOps: Apply file operations
4. Reviewer: Validate fixes

Return:
- Fixed files
- Changes made
- Validation results`,
    strategies: ['technical', 'structured', 'detailed'] as PromptStrategy[],
  },
];

/**
 * Batch generate prompts for all nodes
 */
export async function generateAllNodePrompts(): Promise<void> {

  console.log('🤖 Generating prompts for ALL nodes...\n');

  for (const nodeConfig of nodeConfigs) {
    await autoGenerateNodePrompts(nodeConfig);
  }

  console.log('\n🎉 All node prompts generated successfully!');
}

/**
 * CLI
 */
if (require.main === module) {
  const nodesArg = process.argv[2] || 'all';
  const countArg = process.argv[3] ? parseInt(process.argv[3], 10) : 6;

  (async () => {
    try {
      // Validate count
      if (countArg < 1 || countArg > 6) {
        console.error('❌ Strategy count must be between 1 and 6');
        process.exit(1);
      }

      // Show help
      if (nodesArg === 'help' || nodesArg === '--help' || nodesArg === '-h') {
        console.log(`
🤖 AI Prompt Generator

Automatically creates optimized prompt variants using AI!

Usage:
  npm run langsmith:generate-prompts [nodes] [count]

Arguments:
  nodes   Which nodes to generate for (default: all)
          Options: all, founder, pm, ux, backend, frontend, qa, devops, editor, autogen
          Can specify multiple: pm,founder,ux,qa

  count   How many strategies per node (default: 6)
          Options: 1-6

Strategies (in order):
  1. concise: Short, efficient (30-50% shorter)
  2. detailed: Comprehensive, thorough (50-100% longer)
  3. structured: JSON-focused, organized
  4. creative: Flexible, innovative
  5. technical: Precise, domain-specific
  6. conversational: Natural, friendly

Examples:
  npm run langsmith:generate-prompts
    → All 9 nodes, 6 strategies each (54 prompts)

  npm run langsmith:generate-prompts all 3
    → All 9 nodes, 3 strategies each (27 prompts)

  npm run langsmith:generate-prompts pm
    → PM node only, 6 strategies (6 prompts)

  npm run langsmith:generate-prompts pm 4
    → PM node only, 4 strategies (4 prompts)

  npm run langsmith:generate-prompts pm,founder
    → PM & Founder, 6 strategies each (12 prompts)

  npm run langsmith:generate-prompts qa,devops,editor 3
    → QA, DevOps & Editor, 3 strategies each (9 prompts)

Output:
  All prompts uploaded to LangSmith Hub automatically
  Ready for A/B testing immediately
        `);
        process.exit(0);
      }

      // Determine which nodes to generate for
      let nodesToGenerate: string[] = [];

      if (nodesArg === 'all') {
        nodesToGenerate = ['founder', 'pm', 'ux', 'backend', 'frontend', 'qa', 'devops', 'editor', 'autogen'];
      } else {
        // Parse comma-separated list
        const validNodes = ['founder', 'pm', 'ux', 'backend', 'frontend', 'qa', 'devops', 'editor', 'autogen'];
        nodesToGenerate = nodesArg.split(',').map(n => n.trim().toLowerCase());

        // Validate all nodes
        const invalidNodes = nodesToGenerate.filter(n => !validNodes.includes(n));
        if (invalidNodes.length > 0) {
          console.error(`❌ Invalid node(s): ${invalidNodes.join(', ')}`);
          console.error(`Valid nodes: ${validNodes.join(', ')}, all`);
          process.exit(1);
        }
      }

      // Determine which strategies to use
      const allStrategies: PromptStrategy[] = ['concise', 'detailed', 'structured', 'creative', 'technical', 'conversational'];
      const strategies = allStrategies.slice(0, countArg);

      console.log(`\n${'━'.repeat(60)}`);
      console.log(`🤖 AI Prompt Generator`);
      console.log('━'.repeat(60));
      console.log(`Nodes: ${nodesToGenerate.join(', ')}`);
      console.log(`Strategies: ${strategies.join(', ')} (${strategies.length} per node)`);
      console.log(`Total prompts: ${nodesToGenerate.length * strategies.length}`);
      console.log('━'.repeat(60));

      // Generate for each node
      for (const nodeName of nodesToGenerate) {
        const nodeConfig = nodeConfigs.find(config =>
          config.nodeName.toLowerCase() === nodeName.toLowerCase()
        );

        if (!nodeConfig) {
          console.error(`\n❌ No config found for node: ${nodeName}`);
          continue;
        }

        await autoGenerateNodePrompts({
          ...nodeConfig,
          strategies,
        });
      }

      console.log('\n🎉 All prompts generated successfully!');
      console.log(`\nGenerated ${nodesToGenerate.length * strategies.length} prompts across ${nodesToGenerate.length} node(s)`);

    } catch (error: any) {
      console.error('\n💥 Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}
