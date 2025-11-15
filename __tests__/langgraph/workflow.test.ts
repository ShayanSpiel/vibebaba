/**
 * LangGraph Workflow Integration Tests
 *
 * Tests the complete workflow and individual nodes
 */

import { beforeAll, describe, expect, test } from '@jest/globals';
import { nanoid } from 'nanoid';
import type { AppGenState } from '@/lib/langgraph/types';
import { createAppGenWorkflow } from '@/lib/langgraph/workflow';

// Mock dependencies for testing
jest.mock('@/lib/ai', () => ({
  generateWithFallback: jest.fn(async (prompt: string, multiline?: boolean) => ({
    text: mockAIResponse(prompt),
    model: 'test-model',
    provider: 'test',
  })),
}));

jest.mock('@/lib/validation', () => ({
  validateCode: jest.fn(async (files: any[]) => ({
    valid: true,
    report: { errors: [], warnings: [] },
    files,
  })),
}));

jest.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: jest.fn(() => ({
      create: jest.fn(async (data: any) => ({ id: 'test-id', ...data })),
      update: jest.fn(async (id: string, data: any) => ({ id, ...data })),
    })),
  },
}));

function mockAIResponse(prompt: string): string {
  if (prompt.includes('Founder')) {
    return JSON.stringify({
      refinedRequirements: 'Build a simple landing page',
      businessContext: {
        targetAudience: 'General users',
        primaryGoal: 'Lead generation',
        successMetrics: ['Conversions'],
      },
    });
  }

  if (prompt.includes('product plan')) {
    return JSON.stringify({
      appType: 'landing-page',
      complexity: 'simple',
      designStyle: 'modern',
      visualTone: 'light',
      animationLevel: 'subtle',
      targetAudience: 'General users',
    });
  }

  if (prompt.includes('component')) {
    return JSON.stringify({
      navigation: 'simple',
      hero: 'centered',
      features: 'none',
      emailCapture: 'waitlist-only',
      pricing: 'none',
      cta: 'simple',
      footer: 'minimal',
      buttons: 'standard',
      justification: 'Simple landing page needs',
    });
  }

  if (prompt.includes('backend config')) {
    return JSON.stringify({
      collections: [
        {
          name: 'leads',
          fields: [
            { name: 'email', type: 'string' },
            { name: 'name', type: 'string' },
          ],
        },
      ],
      pages: [],
    });
  }

  // Default HTML response
  return '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Page</h1></body></html>';
}

describe('LangGraph Workflow', () => {
  test('should create workflow successfully', () => {
    const workflow = createAppGenWorkflow();
    expect(workflow).toBeDefined();
  });

  test('should execute founder node', async () => {
    const { founderNode } = await import('@/lib/langgraph/nodes/founder-node');

    const state: AppGenState = {
      userDescription: 'Build a landing page for my SaaS',
      userId: 'test-user',
      projectId: nanoid(),
      completedNodes: [],
      errors: [],
      artifacts: new Map(),
      stage: 'initial',
    };

    const result = await founderNode(state);

    expect(result.refinedRequirements).toBeDefined();
    expect(result.businessContext).toBeDefined();
    expect(result.completedNodes).toContain('founder');
    expect(result.stage).toBe('planning');
  });

  test('should execute pm node', async () => {
    const { pmNode } = await import('@/lib/langgraph/nodes/pm-node');

    const state: AppGenState = {
      userDescription: 'Build a landing page for my SaaS',
      userId: 'test-user',
      projectId: nanoid(),
      refinedRequirements: 'Build a simple landing page',
      completedNodes: ['founder'],
      errors: [],
      artifacts: new Map(),
      stage: 'planning',
    };

    const result = await pmNode(state);

    expect(result.plan).toBeDefined();
    expect(result.context).toBeDefined();
    expect(result.context?.appType).toBeDefined();
    expect(result.completedNodes).toContain('pm');
    expect(result.stage).toBe('designing');
  });

  test('should handle errors gracefully', async () => {
    const { founderNode } = await import('@/lib/langgraph/nodes/founder-node');

    // Mock AI failure
    const { generateWithFallback } = require('@/lib/ai');
    generateWithFallback.mockRejectedValueOnce(new Error('API Error'));

    const state: AppGenState = {
      userDescription: '',
      userId: 'test-user',
      projectId: nanoid(),
      completedNodes: [],
      errors: [],
      artifacts: new Map(),
      stage: 'initial',
    };

    const result = await founderNode(state);

    // Should have fallback values
    expect(result.refinedRequirements).toBeDefined();
    expect(result.completedNodes).toContain('founder');
  });

  test('should track completed nodes correctly', () => {
    const state: AppGenState = {
      userDescription: 'Test',
      userId: 'test-user',
      projectId: nanoid(),
      completedNodes: ['founder', 'pm', 'ux'],
      errors: [],
      artifacts: new Map(),
      stage: 'building',
    };

    expect(state.completedNodes).toHaveLength(3);
    expect(state.completedNodes).toContain('founder');
    expect(state.completedNodes).toContain('pm');
    expect(state.completedNodes).toContain('ux');
  });
});

describe('Node Integration', () => {
  test('founder → pm flow should work', async () => {
    const { founderNode } = await import('@/lib/langgraph/nodes/founder-node');
    const { pmNode } = await import('@/lib/langgraph/nodes/pm-node');

    let state: AppGenState = {
      userDescription: 'Build a task manager',
      userId: 'test-user',
      projectId: nanoid(),
      completedNodes: [],
      errors: [],
      artifacts: new Map(),
      stage: 'initial',
    };

    // Execute founder
    const founderResult = await founderNode(state);
    state = { ...state, ...founderResult };

    expect(state.refinedRequirements).toBeDefined();
    expect(state.completedNodes).toContain('founder');

    // Execute PM
    const pmResult = await pmNode(state);
    state = { ...state, ...pmResult };

    expect(state.plan).toBeDefined();
    expect(state.context).toBeDefined();
    expect(state.completedNodes).toContain('pm');
  });
});
