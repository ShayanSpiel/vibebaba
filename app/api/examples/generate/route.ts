/**
 * Example Generation API
 * Admin endpoint for generating new examples
 */

import { type NextRequest, NextResponse } from 'next/server';
import { type ExampleCategory, pb } from '@/lib/database/pocketbase';
import { generateCategoryExamples, generateExample } from '@/lib/examples/example-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      categorySlug,
      styleVariant = 'modern',
      industryContext = 'saas',
      complexityLevel = 'medium',
      count = 1,
      validateQuality = true,
    } = body;

    if (!categorySlug) {
      return NextResponse.json({ error: 'categorySlug is required' }, { status: 400 });
    }

    // Get category
    const categories = await pb.collection('example_categories').getFullList<ExampleCategory>({
      filter: `slug = "${categorySlug}"`,
    });

    if (categories.length === 0) {
      return NextResponse.json({ error: `Category not found: ${categorySlug}` }, { status: 404 });
    }

    const category = categories[0];

    if (count === 1) {
      // Generate single example
      console.log(`Generating single example for ${category.name}...`);

      const example = await generateExample(
        category.name,
        category.description,
        styleVariant,
        industryContext,
        complexityLevel,
        validateQuality
      );

      // Save to database
      const created = await pb.collection('design_examples').create({
        categoryId: category.id,
        name: example.name,
        description: example.description,
        htmlContent: example.htmlContent,
        styleVariant,
        industryContext: [industryContext],
        complexityLevel,
        qualityScore: example.qualityScores?.qualityScore || 0,
        performanceScore: example.qualityScores?.performanceScore || 0,
        accessibilityScore: example.qualityScores?.accessibilityScore || 0,
        designTrendScore: example.qualityScores?.designTrendScore || 0,
        version: '1.0.0',
        isActive: true,
        usageCount: 0,
        tags: example.tags || [],
      });

      return NextResponse.json({
        success: true,
        example: {
          id: created.id,
          name: example.name,
          qualityScore: example.qualityScores?.qualityScore,
        },
      });
    } else {
      // Generate multiple examples
      console.log(`Generating ${count} examples for ${category.name}...`);

      const examples: any[] = [];
      const errors: string[] = [];

      const generatedExamples = await generateCategoryExamples(
        category.name,
        category.description,
        count,
        (current, total, example) => {
          console.log(
            `Progress: ${current}/${total} - Quality: ${example.qualityScores?.qualityScore}`
          );
        }
      );

      // Save all to database
      for (const example of generatedExamples) {
        try {
          const created = await pb.collection('design_examples').create({
            categoryId: category.id,
            name: example.name,
            description: example.description,
            htmlContent: example.htmlContent,
            styleVariant: 'modern', // Would need to track which variant
            industryContext: [industryContext],
            complexityLevel: 'medium',
            qualityScore: example.qualityScores?.qualityScore || 0,
            performanceScore: example.qualityScores?.performanceScore || 0,
            accessibilityScore: example.qualityScores?.accessibilityScore || 0,
            designTrendScore: example.qualityScores?.designTrendScore || 0,
            version: '1.0.0',
            isActive: true,
            usageCount: 0,
            tags: example.tags || [],
          });

          examples.push({
            id: created.id,
            name: example.name,
            qualityScore: example.qualityScores?.qualityScore,
          });
        } catch (error) {
          errors.push((error as Error).message);
        }
      }

      return NextResponse.json({
        success: true,
        generated: examples.length,
        failed: errors.length,
        examples,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  } catch (error) {
    console.error('Example generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate examples',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
