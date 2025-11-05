/**
 * Example Query API
 * Endpoint for selecting examples based on context
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  selectExamplesForCategory,
  selectExamplesWithFallback,
  formatExamplesForPrompt,
  trackExampleUsage,
  type SelectionContext,
} from '@/lib/example-selector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      categorySlug,
      context,
      limit = 3,
      includeFallback = true,
      trackUsage = true,
    } = body;

    if (!categorySlug) {
      return NextResponse.json(
        { error: 'categorySlug is required' },
        { status: 400 }
      );
    }

    const selectionContext: SelectionContext = context || {};

    let result;

    if (includeFallback) {
      // Use fallback-enabled selection
      const examples = await selectExamplesWithFallback(
        categorySlug,
        selectionContext,
        limit
      );

      result = {
        categorySlug,
        examples: examples.map(ex => ({
          html: ex.html,
          source: ex.source,
        })),
        prompt: formatExamplesForPrompt(examples, categorySlug),
      };
    } else {
      // Database only
      const selectedExamples = await selectExamplesForCategory(
        categorySlug,
        selectionContext,
        limit
      );

      result = {
        categorySlug,
        examples: selectedExamples.map(selected => ({
          id: selected.example.id,
          name: selected.example.name,
          html: selected.example.htmlContent,
          styleVariant: selected.example.styleVariant,
          industryContext: selected.example.industryContext,
          qualityScore: selected.example.qualityScore,
          matchScore: selected.matchScore,
          matchReasons: selected.matchReasons,
        })),
        prompt: formatExamplesForPrompt(
          selectedExamples.map(s => ({
            html: s.example.htmlContent,
            source: 'database' as const,
          })),
          categorySlug
        ),
      };

      // Track usage
      if (trackUsage && selectedExamples.length > 0) {
        const exampleIds = selectedExamples.map(s => s.example.id);
        await trackExampleUsage(exampleIds);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Example query error:', error);
    return NextResponse.json(
      {
        error: 'Failed to query examples',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    if (!categorySlug) {
      return NextResponse.json(
        { error: 'category parameter is required' },
        { status: 400 }
      );
    }

    const examples = await selectExamplesWithFallback(
      categorySlug,
      {},
      limit
    );

    return NextResponse.json({
      categorySlug,
      count: examples.length,
      examples: examples.map(ex => ({
        html: ex.html,
        source: ex.source,
      })),
    });
  } catch (error) {
    console.error('Example query error:', error);
    return NextResponse.json(
      {
        error: 'Failed to query examples',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
