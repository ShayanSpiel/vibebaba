/**
 * Generate Examples Script (Gemini)
 * Generates design examples using Google Gemini
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import PocketBase from 'pocketbase';
import { generateExample, validateExampleQuality } from '../lib/example-generator-gemini';
import { STYLE_VARIANTS, INDUSTRY_CONTEXTS, COMPLEXITY_LEVELS } from '../lib/example-categories';
import type { ExampleCategory, DesignExample } from '../lib/pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

const pb = new PocketBase(PB_URL);

interface GenerationOptions {
  categorySlug?: string;
  highPriorityOnly?: boolean;
  count?: number;
  minQualityScore?: number;
  maxRetries?: number;
}

async function generateExamplesForCategory(
  category: ExampleCategory,
  count: number = 5,
  minQualityScore: number = 80,
  maxRetries: number = 3
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generating ${count} examples for: ${category.name}`);
  console.log(`${'='.repeat(60)}\n`);

  // Check existing examples
  const existing = await pb.collection('design_examples').getFullList<DesignExample>({
    filter: `categoryId = "${category.id}" && isActive = true`,
  });

  console.log(`Existing examples: ${existing.length}`);

  if (existing.length >= count) {
    console.log(`✅ Category already has enough examples (${existing.length}/${count})\n`);
    return;
  }

  const needed = count - existing.length;
  console.log(`Need to generate: ${needed} examples\n`);

  // Define variety matrix
  const styleVariants = Array.from(STYLE_VARIANTS);
  const industries = INDUSTRY_CONTEXTS.slice(0, 5); // Top 5 industries
  const complexities = Array.from(COMPLEXITY_LEVELS);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < needed; i++) {
    const styleVariant = styleVariants[i % styleVariants.length];
    const industryContext = industries[i % industries.length];
    const complexityLevel = complexities[i % complexities.length];

    console.log(`\n[${i + 1}/${needed}] Generating:`);
    console.log(`  Style: ${styleVariant}`);
    console.log(`  Industry: ${industryContext}`);
    console.log(`  Complexity: ${complexityLevel}`);

    let attempts = 0;
    let success = false;

    while (attempts < maxRetries && !success) {
      attempts++;

      try {
        console.log(`  Attempt ${attempts}/${maxRetries}...`);

        const example = await generateExample(
          category.name,
          category.description,
          styleVariant,
          industryContext,
          complexityLevel,
          false // Don't validate during generation
        );

        // Validate quality
        console.log(`  Validating quality...`);
        const scores = await validateExampleQuality(
          category.name,
          example.htmlContent,
          styleVariant,
          industryContext
        );

        console.log(`  Quality Scores:`);
        console.log(`    Overall: ${scores.qualityScore}/100`);
        console.log(`    Performance: ${scores.performanceScore}/100`);
        console.log(`    Accessibility: ${scores.accessibilityScore}/100`);
        console.log(`    Design Trends: ${scores.designTrendScore}/100`);

        if (scores.qualityScore < minQualityScore) {
          console.log(`  ⚠️  Score too low (${scores.qualityScore}/${minQualityScore}), retrying...`);

          if (scores.issues.length > 0) {
            console.log(`  Issues: ${scores.issues.join(', ')}`);
          }

          continue;
        }

        // Save to database
        console.log(`  💾 Saving to database...`);

        await pb.collection('design_examples').create({
          categoryId: category.id,
          name: example.name,
          description: example.description,
          htmlContent: example.htmlContent,
          styleVariant: styleVariant, // PocketBase select field - pass value directly
          industryContext: industryContext, // PocketBase select field - pass value directly
          complexityLevel,
          qualityScore: scores.qualityScore,
          performanceScore: scores.performanceScore,
          accessibilityScore: scores.accessibilityScore,
          designTrendScore: scores.designTrendScore,
          version: '1.0.0',
          isActive: true,
          usageCount: 0,
          tags: example.tags || [],
          previewImage: '',
          replacedBy: '',
          successRate: 0,
        });

        console.log(`  ✅ Example created successfully!`);

        if (scores.strengths.length > 0) {
          console.log(`  Strengths: ${scores.strengths.slice(0, 2).join(', ')}`);
        }

        generated++;
        success = true;
      } catch (error) {
        console.error(`  ❌ Attempt ${attempts} failed:`, (error as Error).message);
        console.error(`  Full error:`, error);

        if (attempts === maxRetries) {
          console.error(`  Failed after ${maxRetries} attempts`);
          failed++;
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    // Rate limiting delay between examples
    if (i < needed - 1) {
      console.log(`  Waiting 2s before next example...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`CATEGORY COMPLETE: ${category.name}`);
  console.log(`  ✅ Generated: ${generated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total examples: ${existing.length + generated}`);
  console.log(`${'='.repeat(60)}\n`);
}

async function generateExamples(options: GenerationOptions = {}) {
  console.log('\n🎨 EXAMPLE GENERATION SCRIPT (GEMINI)\n');
  console.log(`PocketBase URL: ${PB_URL}\n`);
  console.log('Options:');
  console.log(`  Category: ${options.categorySlug || 'all'}`);
  console.log(`  High priority only: ${options.highPriorityOnly || false}`);
  console.log(`  Examples per category: ${options.count || 5}`);
  console.log(`  Min quality score: ${options.minQualityScore || 80}`);
  console.log(`  Max retries: ${options.maxRetries || 3}\n`);

  try {
    // Get categories
    let filter = 'isActive = true';

    if (options.categorySlug) {
      filter += ` && slug = "${options.categorySlug}"`;
    }

    if (options.highPriorityOnly) {
      filter += ' && priority >= 8';
    }

    const categories = await pb.collection('example_categories').getFullList<ExampleCategory>({
      filter,
      sort: '-priority',
    });

    if (categories.length === 0) {
      console.log('❌ No categories found matching criteria');
      return;
    }

    console.log(`Found ${categories.length} categories to process\n`);

    const startTime = Date.now();

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];

      console.log(`\n[${i + 1}/${categories.length}] Processing: ${category.name} (Priority: ${category.priority})`);

      await generateExamplesForCategory(
        category,
        options.count || category.targetExamples,
        options.minQualityScore,
        options.maxRetries
      );

      // Delay between categories
      if (i < categories.length - 1) {
        console.log('Waiting 5s before next category...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 GENERATION COMPLETE');
    console.log(`${'='.repeat(60)}`);
    console.log(`Categories processed: ${categories.length}`);
    console.log(`Total time: ${minutes}m ${seconds}s`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: GenerationOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--category' && args[i + 1]) {
    options.categorySlug = args[i + 1];
    i++;
  } else if (arg === '--high-priority') {
    options.highPriorityOnly = true;
  } else if (arg === '--count' && args[i + 1]) {
    options.count = parseInt(args[i + 1], 10);
    i++;
  } else if (arg === '--min-quality' && args[i + 1]) {
    options.minQualityScore = parseInt(args[i + 1], 10);
    i++;
  } else if (arg === '--max-retries' && args[i + 1]) {
    options.maxRetries = parseInt(args[i + 1], 10);
    i++;
  }
}

// Run generation
generateExamples(options).catch(console.error);
