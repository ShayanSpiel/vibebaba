/**
 * Gap Detection System
 * Automatically detects missing or insufficient design examples
 */

import { pb, type DesignExample, type ExampleCategory, type ExampleGenerationQueue } from './database/pocketbase';
import { STYLE_VARIANTS, INDUSTRY_CONTEXTS } from './examples/example-categories';

export interface Gap {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  gapType: 'critical' | 'target_not_met' | 'diversity' | 'quality';
  priority: number;
  details: {
    current: number;
    required: number;
    missing?: {
      styleVariants?: string[];
      industryContexts?: string[];
      lowQualityIds?: string[];
    };
  };
}

export interface GapDetectionReport {
  timestamp: string;
  totalGaps: number;
  criticalGaps: number;
  gapsByCategory: Gap[];
  summary: {
    categoriesBelowMinimum: number;
    categoriesBelowTarget: number;
    categoriesWithDiversityGaps: number;
    categoriesWithQualityIssues: number;
  };
}

/**
 * Count active examples for a category
 */
async function countExamplesForCategory(categoryId: string): Promise<number> {
  const result = await pb.collection('design_examples').getList<DesignExample>(1, 1, {
    filter: `categoryId = "${categoryId}" && isActive = true`,
  });

  return result.totalItems;
}

/**
 * Get all examples for a category
 */
async function getExamplesForCategory(categoryId: string): Promise<DesignExample[]> {
  return await pb.collection('design_examples').getFullList<DesignExample>({
    filter: `categoryId = "${categoryId}" && isActive = true`,
  });
}

/**
 * Check style variant diversity
 */
function checkStyleDiversity(examples: DesignExample[]): string[] {
  const existingStyles = new Set(examples.map(ex => ex.styleVariant));
  const missingStyles: string[] = [];

  for (const style of STYLE_VARIANTS) {
    if (!existingStyles.has(style)) {
      missingStyles.push(style);
    }
  }

  return missingStyles;
}

/**
 * Check industry context diversity
 */
function checkIndustryDiversity(examples: DesignExample[]): string[] {
  const existingIndustries = new Set<string>();

  examples.forEach(ex => {
    ex.industryContext.forEach(industry => existingIndustries.add(industry));
  });

  const missingIndustries: string[] = [];

  // Check for at least 5 different industries
  const targetIndustries = INDUSTRY_CONTEXTS.slice(0, 5);

  for (const industry of targetIndustries) {
    if (!existingIndustries.has(industry)) {
      missingIndustries.push(industry);
    }
  }

  return missingIndustries;
}

/**
 * Check quality issues
 */
function checkQualityIssues(examples: DesignExample[], minScore: number = 80): string[] {
  return examples
    .filter(ex => ex.qualityScore < minScore)
    .map(ex => ex.id);
}

/**
 * Detect gaps for a single category
 */
async function detectCategoryGaps(category: ExampleCategory): Promise<Gap[]> {
  const gaps: Gap[] = [];

  const examples = await getExamplesForCategory(category.id);
  const exampleCount = examples.length;

  // Check: Critical gap (below minimum)
  if (exampleCount < category.minExamplesRequired) {
    gaps.push({
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      gapType: 'critical',
      priority: 10,
      details: {
        current: exampleCount,
        required: category.minExamplesRequired,
      },
    });
  }

  // Check: Target not met
  if (exampleCount < category.targetExamples && exampleCount >= category.minExamplesRequired) {
    gaps.push({
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      gapType: 'target_not_met',
      priority: 5,
      details: {
        current: exampleCount,
        required: category.targetExamples,
      },
    });
  }

  // Check: Diversity gaps (only if we have some examples)
  if (exampleCount > 0) {
    const missingStyles = checkStyleDiversity(examples);
    const missingIndustries = checkIndustryDiversity(examples);

    if (missingStyles.length > 0 || missingIndustries.length > 0) {
      gaps.push({
        categoryId: category.id,
        categoryName: category.name,
        categorySlug: category.slug,
        gapType: 'diversity',
        priority: 7,
        details: {
          current: exampleCount,
          required: category.targetExamples,
          missing: {
            styleVariants: missingStyles,
            industryContexts: missingIndustries,
          },
        },
      });
    }
  }

  // Check: Quality issues
  const lowQualityIds = checkQualityIssues(examples);
  if (lowQualityIds.length > 0) {
    gaps.push({
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      gapType: 'quality',
      priority: 6,
      details: {
        current: exampleCount,
        required: exampleCount, // Same count, but quality needs improvement
        missing: {
          lowQualityIds,
        },
      },
    });
  }

  return gaps;
}

/**
 * Run full gap detection across all categories
 */
export async function detectAllGaps(): Promise<GapDetectionReport> {
  const categories = await pb.collection('example_categories').getFullList<ExampleCategory>({
    filter: 'isActive = true',
    sort: '-priority',
  });

  const allGaps: Gap[] = [];

  for (const category of categories) {
    const categoryGaps = await detectCategoryGaps(category);
    allGaps.push(...categoryGaps);
  }

  // Calculate summary
  const criticalGaps = allGaps.filter(g => g.gapType === 'critical').length;
  const targetNotMet = allGaps.filter(g => g.gapType === 'target_not_met').length;
  const diversityGaps = allGaps.filter(g => g.gapType === 'diversity').length;
  const qualityIssues = allGaps.filter(g => g.gapType === 'quality').length;

  const report: GapDetectionReport = {
    timestamp: new Date().toISOString(),
    totalGaps: allGaps.length,
    criticalGaps,
    gapsByCategory: allGaps.sort((a, b) => b.priority - a.priority),
    summary: {
      categoriesBelowMinimum: criticalGaps,
      categoriesBelowTarget: targetNotMet,
      categoriesWithDiversityGaps: diversityGaps,
      categoriesWithQualityIssues: qualityIssues,
    },
  };

  return report;
}

/**
 * Create generation tasks from detected gaps
 */
export async function createGenerationTasksFromGaps(
  gaps: Gap[]
): Promise<ExampleGenerationQueue[]> {
  const tasks: ExampleGenerationQueue[] = [];

  for (const gap of gaps) {
    // Check if task already exists for this category
    const existingTasks = await pb.collection('example_generation_queue').getFullList<ExampleGenerationQueue>({
      filter: `categoryId = "${gap.categoryId}" && (status = "pending" || status = "in_progress")`,
    });

    if (existingTasks.length > 0) {
      console.log(`Task already exists for ${gap.categoryName}, skipping`);
      continue;
    }

    let targetCount = gap.details.required;
    let generationConfig = {
      styleVariants: Array.from(STYLE_VARIANTS),
      industryContexts: INDUSTRY_CONTEXTS.slice(0, 5),
      complexityLevels: ['simple', 'medium', 'complex'],
    };

    // Customize config based on gap type
    if (gap.gapType === 'diversity' && gap.details.missing) {
      if (gap.details.missing.styleVariants) {
        generationConfig.styleVariants = gap.details.missing.styleVariants as any;
      }
      if (gap.details.missing.industryContexts) {
        generationConfig.industryContexts = gap.details.missing.industryContexts as any;
      }
      targetCount = Math.max(
        gap.details.missing.styleVariants?.length || 0,
        gap.details.missing.industryContexts?.length || 0
      );
    }

    const task = await pb.collection('example_generation_queue').create<ExampleGenerationQueue>({
      categoryId: gap.categoryId,
      targetCount,
      currentCount: gap.details.current,
      status: 'pending',
      priority: gap.priority,
      reason: gap.gapType,
      generationConfig,
      generatedIds: [],
      created: new Date().toISOString(),
    });

    tasks.push(task);
  }

  return tasks;
}

/**
 * Run gap detection and create tasks automatically
 */
export async function autoDetectAndQueue(): Promise<{
  report: GapDetectionReport;
  tasksCreated: number;
}> {
  console.log('🔍 Running gap detection...');

  const report = await detectAllGaps();

  console.log(`\nGap Detection Results:`);
  console.log(`  Total gaps: ${report.totalGaps}`);
  console.log(`  Critical gaps: ${report.criticalGaps}`);
  console.log(`  Target not met: ${report.summary.categoriesBelowTarget}`);
  console.log(`  Diversity gaps: ${report.summary.categoriesWithDiversityGaps}`);
  console.log(`  Quality issues: ${report.summary.categoriesWithQualityIssues}`);

  if (report.totalGaps === 0) {
    console.log('\n✅ No gaps detected! All categories are well-covered.');
    return { report, tasksCreated: 0 };
  }

  console.log('\n📋 Creating generation tasks...');

  const tasks = await createGenerationTasksFromGaps(report.gapsByCategory);

  console.log(`✅ Created ${tasks.length} generation tasks`);

  return { report, tasksCreated: tasks.length };
}

/**
 * Get coverage matrix (for dashboard visualization)
 */
export async function getCoverageMatrix(): Promise<{
  categories: Array<{
    name: string;
    slug: string;
    coverage: {
      total: number;
      byStyle: Record<string, number>;
      byIndustry: Record<string, number>;
      avgQuality: number;
    };
  }>;
}> {
  const categories = await pb.collection('example_categories').getFullList<ExampleCategory>({
    filter: 'isActive = true',
    sort: 'name',
  });

  const matrix = [];

  for (const category of categories) {
    const examples = await getExamplesForCategory(category.id);

    const byStyle: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};

    examples.forEach(ex => {
      byStyle[ex.styleVariant] = (byStyle[ex.styleVariant] || 0) + 1;

      ex.industryContext.forEach(industry => {
        byIndustry[industry] = (byIndustry[industry] || 0) + 1;
      });
    });

    const avgQuality =
      examples.length > 0
        ? Math.round(
            examples.reduce((sum, ex) => sum + ex.qualityScore, 0) / examples.length
          )
        : 0;

    matrix.push({
      name: category.name,
      slug: category.slug,
      coverage: {
        total: examples.length,
        byStyle,
        byIndustry,
        avgQuality,
      },
    });
  }

  return { categories: matrix };
}

/**
 * Generate simple text report
 */
export function formatGapReport(report: GapDetectionReport): string {
  let output = `\n${'='.repeat(60)}\n`;
  output += `GAP DETECTION REPORT - ${new Date(report.timestamp).toLocaleString()}\n`;
  output += `${'='.repeat(60)}\n\n`;

  output += `SUMMARY:\n`;
  output += `  Total Gaps: ${report.totalGaps}\n`;
  output += `  Critical (below minimum): ${report.summary.categoriesBelowMinimum}\n`;
  output += `  Below target: ${report.summary.categoriesBelowTarget}\n`;
  output += `  Diversity gaps: ${report.summary.categoriesWithDiversityGaps}\n`;
  output += `  Quality issues: ${report.summary.categoriesWithQualityIssues}\n\n`;

  if (report.totalGaps === 0) {
    output += `✅ No gaps detected! All categories are well-covered.\n`;
    return output;
  }

  output += `GAPS BY CATEGORY:\n`;
  output += `${'-'.repeat(60)}\n`;

  report.gapsByCategory.forEach(gap => {
    const icon =
      gap.gapType === 'critical'
        ? '🚨'
        : gap.gapType === 'target_not_met'
        ? '⚠️'
        : gap.gapType === 'diversity'
        ? '🎨'
        : '⭐';

    output += `\n${icon} ${gap.categoryName} (Priority: ${gap.priority})\n`;
    output += `   Type: ${gap.gapType}\n`;
    output += `   Current: ${gap.details.current} | Required: ${gap.details.required}\n`;

    if (gap.details.missing) {
      if (gap.details.missing.styleVariants?.length) {
        output += `   Missing styles: ${gap.details.missing.styleVariants.join(', ')}\n`;
      }
      if (gap.details.missing.industryContexts?.length) {
        output += `   Missing industries: ${gap.details.missing.industryContexts.join(', ')}\n`;
      }
      if (gap.details.missing.lowQualityIds?.length) {
        output += `   Low quality examples: ${gap.details.missing.lowQualityIds.length}\n`;
      }
    }
  });

  output += `\n${'-'.repeat(60)}\n`;

  return output;
}
