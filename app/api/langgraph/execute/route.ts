// app/api/langgraph/execute/route.ts

import { customAlphabet } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/database/pocketbase';
import {
  checkAndResetDailyTokens,
  consumeTokens,
  getAvailableTokens,
} from '@/lib/database/pocketbase-credits';
import { getAuthenticatedUser } from '@/lib/database/pocketbase-middleware';
import type { AppGenState } from '@/lib/langgraph/types';
import { emitWorkflowComplete, emitWorkflowStart } from '@/lib/langgraph/utils/logging/events';
import { createAppGenWorkflow } from '@/lib/langgraph/workflow';
import { unifiedSearch } from '@/lib/mcp/unified-search';
import {
  addUserMessage,
  conversationMemoryStore,
  storeProjectConfig,
  storeWorkflowMetadata,
} from '@/lib/memory/conversation-memory';

// PocketBase-compatible ID generator (alphanumeric only, no hyphens)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 15);

// Set maximum duration for this route (Vercel/Next.js config)
export const maxDuration = 300; // 5 minutes for serverless functions (max allowed on most platforms)
// Note: Actual workflow has internal 20-minute timeout for local development

/**
 * NEW ENDPOINT: Execute full pipeline in one call
 *
 * POST /api/langgraph/execute
 * Body: { description: string }
 * Returns: { success, projectId, deployUrl, files, plan, backendConfig, ... }
 */
export async function POST(req: NextRequest) {
  const workflowStartTime = Date.now();

  // Ensure we always return JSON, even on unexpected errors
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let description: string;
    let existingProjectId: string | undefined;

    try {
      const body = await req.json();
      description = body.description;
      existingProjectId = body.projectId;
    } catch (parseError: any) {
      console.error('[LangGraph] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON with 'description' field." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Estimate tokens (full pipeline uses more)
    const estimatedTokens = Math.ceil(description.length * 4);

    const updatedUser = await checkAndResetDailyTokens(user.id);
    const availableTokens = getAvailableTokens(updatedUser);

    if (availableTokens < estimatedTokens) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please purchase more credits.', insufficientTokens: true },
        { status: 402 }
      );
    }

    // #done Load MCP Memory Context
    console.log('[LangGraph] Loading memory context...');

    // For existing projects, resolve PocketBase ID if there's a mapping
    let projectId: string;
    if (existingProjectId) {
      // Try to get actual PocketBase project to use its ID
      try {
        const PocketBase = (await import('pocketbase')).default;
        const serverPb = new PocketBase('http://localhost:8090');
        await serverPb.admins.authWithPassword('admin@vibebaba.com', 'admin1234567890');

        // Try to find existing project by ID
        const existingProject = await serverPb.collection('projects').getOne(existingProjectId);
        projectId = existingProject.id;
        console.log(`[LangGraph] ✅ Found existing project: ${projectId}`);
      } catch (error: any) {
        // Project not found, use the provided ID (devops will handle creation)
        projectId = existingProjectId;
        console.log(`[LangGraph] ⚠️ Project not found in PocketBase, using ID: ${projectId}`);
      }
    } else {
      // For new projects, generate 15-char ID (PocketBase compatible, no hyphens)
      projectId = nanoid();
      console.log(`[LangGraph] 🆕 New project - generated ID: ${projectId}`);

      // ✅ FIX: Create project in PocketBase IMMEDIATELY to avoid 404 errors
      try {
        const PocketBase = (await import('pocketbase')).default;
        const serverPb = new PocketBase('http://localhost:8090');
        await serverPb.admins.authWithPassword('admin@vibebaba.com', 'admin1234567890');

        await serverPb.collection('projects').create({
          id: projectId,
          userId: user.id,
          name: description.substring(0, 100),
          description: description,
          initialPrompt: description,
          stage: 'planning',
          plan: '',
          planMessages: JSON.stringify([]),
          context: JSON.stringify({}),
          backendConfig: null,
        });

        console.log(`[LangGraph] ✅ Project created in PocketBase: ${projectId}`);
      } catch (error: any) {
        console.error(`[LangGraph] ❌ Failed to create project in PocketBase:`, error);
        // Continue anyway - devops node will handle creation if this fails
      }
    }

    // ✅ PHASE 2: Load conversation memory from PocketBase
    console.log('[LangGraph] 📦 Loading project memory...');
    const memory = await conversationMemoryStore.loadMemory(projectId);

    if (memory) {
      console.log('[LangGraph] ✅ Loaded memory:');
      console.log(`  - Messages: ${memory.messages.length}`);
      console.log(`  - Files: ${memory.projectConfig?.files?.length || 0}`);
      console.log(`  - Backend: ${memory.projectConfig?.backendConfig ? 'YES' : 'NO'}`);
      console.log(`  - Features: ${memory.projectConfig?.allRequestedFeatures?.length || 0}`);
      if (memory.workflowMetadata?.completedNodes?.length) {
        console.log(`  - Previous workflow: ${memory.workflowMetadata.completedNodes.join(' → ')}`);
      }
    } else {
      console.log('[LangGraph] ℹ️  No existing memory (new project)');
    }

    // #done Run Unified Search for Background Context
    console.log('[LangGraph] Running unified search...');
    const searchResult = await unifiedSearch(description, 'app', {
      useCache: true,
      minStars: 10, // Lowered from 20 to get more results
      maxResults: 5,
      timeout: 10000, // Increased to 10 seconds for better results
    });

    // Create workflow
    const workflow = createAppGenWorkflow();

    // ✅ PHASE 2: Initialize state with memory hydration
    const initialState: AppGenState = {
      userDescription: description,
      userId: user.id,
      projectId,
      stage: 'initial',

      // ✅ HYDRATE FROM MEMORY:
      files:
        memory?.projectConfig?.files?.map((f) => ({
          path: f.path,
          content: '', // Content loaded separately if needed
          language: f.path.endsWith('.tsx') || f.path.endsWith('.ts') ? 'typescript' : 'javascript',
        })) || [],

      backendConfig: memory?.projectConfig?.backendConfig || null,
      stylingConfig: memory?.projectConfig?.stylingConfig || null,
      allRequestedFeatures: (memory?.projectConfig?.allRequestedFeatures || []).map((f: any) => ({
        ...f,
        dependencies: f.dependencies || [], // Ensure dependencies property exists
      })),
      context: memory?.projectConfig?.context
        ? {
            appType: memory.projectConfig.context.appType || 'app',
            complexity: memory.projectConfig.context.complexity || 'moderate',
            designStyle: memory.projectConfig.context.designStyle || 'modern',
            visualTone: memory.projectConfig.context.visualTone || 'professional',
            animationLevel: memory.projectConfig.context.animationLevel || 'subtle',
            targetAudience: memory.projectConfig.context.targetAudience || 'general',
            pmPlan: (memory.projectConfig.context as any).pmPlan,
          }
        : {
            appType: 'app',
            complexity: 'moderate',
            designStyle: 'modern',
            visualTone: 'professional',
            animationLevel: 'subtle',
            targetAudience: 'general',
          },
      plan: memory?.projectConfig?.plan || '',
      designSystem: memory?.projectConfig?.designSystem as
        | 'ant-design'
        | 'tailwind-shadcn'
        | 'v0-inspired'
        | 'enhanced-2025'
        | undefined,

      // Background context from unified search
      backgroundContext: searchResult.success ? searchResult : undefined,

      completedNodes: [],
      errors: [],
      artifacts: new Map(),
    };

    // ✨ Add user message to conversation memory
    await addUserMessage(projectId, description);
    console.log('[LangGraph] 💬 Added user message to conversation memory');

    console.log('[LangGraph] Starting FULL pipeline execution...');
    console.log(`[LangGraph] Project ID: ${projectId}`);
    console.log(`[LangGraph] Memory hydrated: ${memory ? 'YES' : 'NO'}`);
    console.log(`[LangGraph] Files restored: ${initialState.files?.length || 0}`);
    console.log(`[LangGraph] Backend restored: ${initialState.backendConfig ? 'YES' : 'NO'}`);
    console.log(
      `[LangGraph] Search results: ${searchResult.success ? searchResult.source : 'none'}`
    );
    emitWorkflowStart(projectId, description);

    // Run FULL workflow with timeout (20 minutes max)
    const WORKFLOW_TIMEOUT = 20 * 60 * 1000; // 20 minutes - increased from 10 to handle very complex workflows with multiple AI calls
    let result: AppGenState;

    try {
      const workflowPromise = workflow.invoke(initialState as any, {
        recursionLimit: 30, // Higher limit for full pipeline
      }) as unknown as Promise<AppGenState>;

      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Workflow timeout after 20 minutes')), WORKFLOW_TIMEOUT)
      );

      result = await Promise.race([workflowPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('[LangGraph] Workflow execution error:', error);

      // Return partial results if available
      return NextResponse.json(
        {
          error: error.message || 'Workflow execution failed',
          partialResults: true,
          projectId,
          metadata: {
            errors: [{ node: 'workflow', message: error.message }],
            duration: Date.now() - workflowStartTime,
          },
        },
        { status: 500 }
      );
    }

    const totalDuration = Date.now() - workflowStartTime;
    emitWorkflowComplete(result, totalDuration);

    // Get token usage stats
    const { aiConversationLogger } = await import(
      '@/lib/langgraph/utils/logging/ai-conversation-logger'
    );
    const stats = aiConversationLogger.getProjectStats(projectId);

    console.log('[LangGraph] ✅ Pipeline COMPLETE!');
    console.log(`[LangGraph] Flow: ${result.completedNodes.join(' → ')}`);
    console.log(`[LangGraph] Files: ${result.files?.length || 0}`);
    console.log(`[LangGraph] Debug attempts: ${result.debugAttempts || 0}`);
    console.log(`[LangGraph] 💰 Total tokens used: ${stats.totalTokens.toLocaleString()} tokens`);
    console.log(
      `[LangGraph] 🤖 AI calls: ${stats.totalCalls} (${stats.successfulCalls} successful, ${stats.failedCalls} failed)`
    );
    console.log(`[LangGraph] Deploy URL: ${result.deployUrl}`);

    // ✅ UNIFIED MEMORY: Store full project config
    storeProjectConfig(projectId, {
      description: result.userDescription,
      plan: result.plan,
      designSystem: result.designSystem,
      stylingConfig: result.stylingConfig, // Complete 80+ design tokens
      backendConfig: result.backendConfig,
      files: result.files?.map((f) => ({
        path: f.path,
        size: f.content?.length || 0,
        purpose: (f as any).purpose,
      })),
      context: result.context,
      allRequestedFeatures: result.allRequestedFeatures,
    });

    // ✅ UNIFIED MEMORY: Store workflow metadata
    storeWorkflowMetadata(projectId, {
      completedNodes: result.completedNodes,
      totalDuration,
      tokenUsage: {
        total: stats.totalTokens,
        byNode: (stats as any).tokensByNode || {},
      },
      deployUrl: result.deployUrl,
      validationResult: result.validationResult
        ? {
            valid: result.validationResult.valid || false,
            errors: result.validationResult.report?.errors?.length || 0,
            warnings: result.validationResult.report?.warnings?.length || 0,
          }
        : undefined,
      debugAttempts: result.debugAttempts || 0,
      lastUpdated: new Date(),
    });

    // ✅ OPTIONAL: Persist stylingConfig to project_settings_memory database
    // This is optional - workflow continues even if it fails
    try {
      // 🔍 CRITICAL DEBUG: Check what we received from workflow
      console.log('[LangGraph] 🔍 === RESULT OBJECT DEBUG ===');
      console.log('[LangGraph] 🔍 result.stylingConfig exists?', !!result.stylingConfig);
      console.log('[LangGraph] 🔍 result.stylingConfig type:', typeof result.stylingConfig);
      console.log(
        '[LangGraph] 🔍 result.stylingConfig keys:',
        result.stylingConfig ? Object.keys(result.stylingConfig) : 'N/A'
      );

      if (result.stylingConfig) {
        console.log('[LangGraph] 🎨 Styling config FULL STRUCTURE:');
        console.log(
          '[LangGraph] 🎨   - brand:',
          !!result.stylingConfig.brand,
          result.stylingConfig.brand?.brandName || 'N/A'
        );
        console.log('[LangGraph] 🎨   - enhancedColors:', !!result.stylingConfig.enhancedColors);
        console.log(
          '[LangGraph] 🎨   - enhancedTypography:',
          !!result.stylingConfig.enhancedTypography
        );
        console.log(
          '[LangGraph] 🎨   - components:',
          !!result.stylingConfig.components,
          result.stylingConfig.components ? Object.keys(result.stylingConfig.components) : []
        );
        console.log('[LangGraph] 🎨   - spacing:', !!result.stylingConfig.spacing);
        console.log('[LangGraph] 🎨   - shadows:', !!result.stylingConfig.shadows);
        console.log('[LangGraph] 🎨   - colorTheme:', !!result.stylingConfig.colorTheme);
        console.log('[LangGraph] 🎨   - typography:', !!result.stylingConfig.typography);
        console.log('[LangGraph] 🎨   - iconography:', !!result.stylingConfig.iconography);
      } else {
        console.log('[LangGraph] ❌ NO stylingConfig in result! This is the problem!');
      }

      // Check if collection exists first
      try {
        await pb.collection('project_settings_memory').getList(1, 1);
      } catch (collectionError: any) {
        console.warn(
          '[LangGraph] ⚠️ project_settings_memory collection not set up, skipping persistence'
        );
        console.warn('[LangGraph] Run setup script or create collection manually');
        throw collectionError; // Exit early if collection doesn't exist
      }

      const existing = await pb.collection('project_settings_memory').getFullList({
        filter: `projectId = "${projectId}"`,
      });

      const projectName =
        (result as any).requirements?.projectName ||
        result.userDescription?.split(' ').slice(0, 3).join(' ') ||
        'Untitled Project';

      const settingsData = {
        projectId,
        userId: user.id,
        projectName,
        initialPrompt: result.userDescription || '',
        stylingConfig: JSON.stringify(result.stylingConfig || {}),
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 🔍 DEBUG: Show what we're about to save
      const stylingConfigPreview = result.stylingConfig || {};
      console.log('[LangGraph] 💾 About to save to database:');
      console.log('[LangGraph] 💾   - projectName:', projectName);
      console.log(
        '[LangGraph] 💾   - stylingConfig string length:',
        settingsData.stylingConfig.length,
        'bytes'
      );
      console.log('[LangGraph] 💾   - stylingConfig has brand?', !!stylingConfigPreview.brand);
      console.log(
        '[LangGraph] 💾   - stylingConfig has enhancedColors?',
        !!stylingConfigPreview.enhancedColors
      );

      if (existing.length > 0) {
        const saved = await pb
          .collection('project_settings_memory')
          .update(existing[0].id, settingsData);
        console.log(
          `[LangGraph] ✅ Updated project_settings_memory for ${projectId} (record ID: ${saved.id})`
        );
      } else {
        const saved = await pb.collection('project_settings_memory').create(settingsData);
        console.log(
          `[LangGraph] ✅ Created project_settings_memory for ${projectId} (record ID: ${saved.id})`
        );
      }

      // 🔍 VERIFY: Read back what was saved
      const verification = await pb.collection('project_settings_memory').getFullList({
        filter: `projectId = "${projectId}"`,
      });
      if (verification.length > 0) {
        const savedConfig = JSON.parse(verification[0].stylingConfig || '{}');
        console.log('[LangGraph] ✅ VERIFICATION - Saved config has:');
        console.log('[LangGraph] ✅   - brand:', !!savedConfig.brand);
        console.log('[LangGraph] ✅   - enhancedColors:', !!savedConfig.enhancedColors);
        console.log('[LangGraph] ✅   - components:', !!savedConfig.components);
      }
    } catch (error: any) {
      console.warn('[LangGraph] ⚠️ Skipping project_settings_memory persistence:', error.message);
      // Don't fail the entire workflow if this fails - it's optional
    }

    // ✅ UNIFIED MEMORY: Save everything to PocketBase (persistent across sessions)
    await conversationMemoryStore.saveMemory(projectId);
    console.log(
      '[LangGraph] 💾 Saved unified memory (conversations + project config + workflow metadata) to PocketBase'
    );

    // Consume tokens
    await consumeTokens(user.id, estimatedTokens, '/api/langgraph/execute');

    // Determine if workflow was truly successful (consistent with emitWorkflowComplete)
    const hasFiles = (result.files?.length || 0) > 0;
    const hasDeployUrl = !!result.deployUrl;
    const hasCriticalErrors = result.errors.some(
      (err) =>
        err.node === 'devops' ||
        err.node === 'qa' ||
        err.node === 'frontend' ||
        err.node === 'backend'
    );
    const validationFailed =
      !result.validationResult?.valid && (result.validationResult?.report?.errors || []).length > 0;

    // SUCCESS CRITERIA: Has files, has deploy URL, no critical errors, validation passed
    const workflowSuccess = hasFiles && hasDeployUrl && !hasCriticalErrors && !validationFailed;

    // Return complete result with all artifacts
    return NextResponse.json({
      success: workflowSuccess, // NEW: Use consistent success criteria
      projectId: result.projectId,
      deployUrl: result.deployUrl,
      files: result.files,
      plan: result.plan,
      context: result.context,
      backendConfig: result.backendConfig,
      allRequestedFeatures: result.allRequestedFeatures, // CRITICAL: Feature list for follow-up messages
      validationResult: result.validationResult,
      debugAttempts: result.debugAttempts,
      completedNodes: result.completedNodes,
      metadata: {
        stage: result.stage,
        artifacts: Object.fromEntries(result.artifacts || []),
        errors: result.errors,
        duration: totalDuration,
        // NEW: Add detailed success metadata for debugging
        successCriteria: {
          hasFiles,
          hasDeployUrl,
          hasCriticalErrors,
          validationFailed,
        },
      },
    });
  } catch (error: any) {
    console.error('[LangGraph] Pipeline execution failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
