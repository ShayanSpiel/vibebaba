// @ts-nocheck
// lib/langgraph/nodes/devops-node.ts
import { pb } from '@/lib/database/pocketbase';
import { withLangSmithTracing } from '@/lib/langsmith/tracing';
import { messageManager } from '@/lib/messaging/message-manager';
import { logDeployment } from '@/lib/services/workflow-logger';
import { generateScaffold } from '../../../../deployment-server/nextjs-scaffold';
import type { AppGenState } from '../../types';
import { emitNodeComplete, emitNodeError, emitNodeStart } from '../../utils/logging/events';

async function devopsNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    // Emit thinking process before starting
    emitNodeStart('devops', state, {
      userInput: `Deploying ${state.files?.length || 0} app files to production environment`,
      interpretation: `I'm preparing your application for deployment! This includes merging your code with Next.js configuration files and setting up the database${state.backendConfig?.collections ? ` (${state.backendConfig.collections.length} collection${state.backendConfig.collections.length > 1 ? 's' : ''})` : ''}.`,
      plan: "First, I'll bundle your app with all necessary config files. Then I'll save everything to the database and generate your preview URL. Your app will be live in seconds! 🚀",
    });

    if (!state.files || state.files.length === 0) {
      console.error('[DevOps] No files to deploy');
      return {
        errors: [{ node: 'devops', message: 'No files to deploy' }], // Reducer auto-appends
        completedNodes: ['devops'], // Reducer auto-appends
      };
    }

    // Add scaffold files to user files for complete file list in UI
    // RULE 3: Pass backendConfig to scaffold generator for API server files
    const scaffoldFiles = generateScaffold(state.projectId, state.backendConfig as any);

    // ✅ FIX 47: Deduplicate files - user files take precedence over scaffold
    // This prevents duplicate globals.css (scaffold template + AI-generated)
    const fileMap = new Map();

    // Add scaffold files first
    scaffoldFiles.forEach((file) => {
      fileMap.set(file.path, file);
    });

    // Override with user files (these take precedence)
    state.files.forEach((file) => {
      fileMap.set(file.path, file);
    });

    const allFiles = Array.from(fileMap.values());
    const duplicateCount = scaffoldFiles.length + state.files.length - allFiles.length;

    console.log(
      `[DevOps] 📦 Total files: ${allFiles.length} (${scaffoldFiles.length} scaffold + ${state.files.length} user)`
    );
    if (duplicateCount > 0) {
      console.log(
        `[DevOps] ✅ Deduplicated ${duplicateCount} file(s) - user versions take precedence`
      );
    }

    // FILE SEPARATION: Hide backend infrastructure from Code tab
    // userFiles: Frontend only (Code tab) - clean, user-facing code
    // deploymentFiles: Frontend + api/* (deployment-server)
    // Reason: Backend files contain internal infrastructure (PocketBase, Express setup)
    const userFiles = allFiles.filter((file) => !file.path.startsWith('api/'));

    // Deployment files include EVERYTHING (user files + backend infrastructure)
    const deploymentFiles = allFiles;

    console.log(`[DevOps] 📂 File separation for storage:`);
    console.log(`[DevOps]   • User-facing files (Code tab): ${userFiles.length}`);
    console.log(`[DevOps]   • Deployment files (backend included): ${deploymentFiles.length}`);
    console.log(
      `[DevOps]   • Backend infrastructure files (hidden from users): ${deploymentFiles.length - userFiles.length}`
    );

    // Create/update project in PocketBase
    let actualProjectId = state.projectId;
    try {
      // Create a fresh PocketBase instance for server-side operations
      const PocketBase = (await import('pocketbase')).default;
      const serverPb = new PocketBase('http://localhost:8090');

      // Authenticate as admin for server-side operations
      try {
        await serverPb.admins.authWithPassword('admin@vibebaba.com', 'admin1234567890');
        console.log('[DevOps] ✅ Authenticated as admin');
      } catch (authError: any) {
        console.error('[DevOps] ❌ Admin auth failed:', authError.message);
        throw new Error(`Admin authentication failed: ${authError.message}`);
      }

      // CRITICAL: Store ONLY userFiles in PocketBase (shown in Code tab)
      const projectData = {
        userId: state.userId,
        name: state.userDescription.substring(0, 100),
        description: state.userDescription,
        stage: 'building',
        plan: state.plan || '',
        planMessages: '[]',
        files: userFiles, // ← User-facing files only (no api/* infrastructure)
        backendConfig: state.backendConfig || null,
        context: state.context || null,
        validationResult: state.validationResult,
        debugAttempts: state.debugAttempts || 0,
      };

      // Check if project already exists (in case of retry/re-generation)
      let project;
      try {
        console.log('[DevOps] 🔍 Looking for existing project:', state.projectId);
        project = await serverPb.collection('projects').getOne(state.projectId);
        console.log('[DevOps] ✅ Project found! Updating:', state.projectId);
        project = await serverPb.collection('projects').update(state.projectId, projectData);
        actualProjectId = project.id;
        console.log('[DevOps] ✅ Project updated successfully');
      } catch (getError: any) {
        // Project doesn't exist, create new one with SAME ID as workflow
        console.log('[DevOps] ❌ Project not found:', state.projectId);
        console.log('[DevOps] ❌ Error:', getError.message);
        console.log('[DevOps] 🆕 Creating new project with workflow ID');

        // CRITICAL: Force PocketBase to use the workflow ID instead of generating a new one
        // This ensures collections (projectId_collectionName) use the correct prefix
        project = await serverPb.collection('projects').create({
          id: state.projectId, // Force this exact ID
          ...projectData,
        });
        actualProjectId = project.id;
        console.log('[DevOps] ✅ Project created with ID:', actualProjectId);
      }

      console.log(
        '[DevOps] ✅ Project saved in PocketBase:',
        actualProjectId,
        'with',
        userFiles.length,
        'user-facing files'
      );
    } catch (error: any) {
      console.error('[DevOps] ❌❌❌ CRITICAL PocketBase ERROR ❌❌❌');
      console.error('[DevOps] Failed to update/create project:', error.message);
      console.error('[DevOps] Full error:', error);
      console.error('[DevOps] Error status:', error.status);
      console.error('[DevOps] Error URL:', error.url);

      // Log detailed error information for debugging
      if (error.data) {
        console.error('[DevOps] Error data:', JSON.stringify(error.data, null, 2));
      }

      // This is a critical error - add to state errors
      return {
        errors: [
          ...state.errors,
          {
            node: 'devops',
            message: `Database error: ${error.message}. Files generated but not saved.`,
          },
        ],
        deployUrl: `/project/${state.projectId}`,
        stage: 'complete',
        completedNodes: ['devops'], // Reducer auto-appends
      };
    }

    // Generate preview URL with original workflow ID (consistent with collections)
    const previewUrl = `/project/${state.projectId}`;

    const duration = Date.now() - startTime;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FEATURE COMPLETION TRACKING - Mark Phase 1 features as completed
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const phase1Features = state.allRequestedFeatures?.filter((f: any) => f.phase === 1) || [];
    console.log(`[DevOps] 📋 Marking ${phase1Features.length} Phase 1 features as completed...`);
    phase1Features.forEach((f: any) => {
      if (!f.completed) {
        f.completed = true;
        console.log(`[DevOps] ✅ Feature "${f.name}" marked as completed`);
      }
    });

    // ✅ NEW: USE MESSAGE MANAGER for deployment success
    const scaffoldCount = scaffoldFiles.length;
    const userFileCount = state.files.length;

    await messageManager.sendEvent(
      state.projectId,
      {
        type: 'deployment-success',
        filesDeployed: deploymentFiles.length,
        userFiles: userFileCount,
        scaffoldFiles: scaffoldCount,
        collections: state.backendConfig?.collections?.map((c: any) => c.name) || [],
        implementedFeatures: phase1Features.map((f: any) => f.name),
        previewUrl,
      },
      'devops'
    );
    console.log('[DevOps] 💬 Sent deployment success via MessageManager');

    // Emit completion for workflow tracking (without duplicate summary)
    emitNodeComplete('devops', state, duration, {
      taskDescription: 'Deployed your application',
      success: true,
      output: {
        filesDeployed: deploymentFiles.length,
        userFiles: userFileCount,
        scaffoldFiles: scaffoldCount,
        previewUrl,
        actualProjectId,
        hasDatabase: !!state.backendConfig?.collections,
        databaseCollections: state.backendConfig?.collections?.map((c: any) => c.name) || [],
        validationStatus: state.validationResult?.valid ? 'valid' : 'has-errors',
      },
      // Note: No summary field - messageManager handles user-facing message
    });

    // CRITICAL: Return deploymentFiles (includes api/* backend infrastructure)
    // Log successful deployment
    const deploymentUrl = `/project/${actualProjectId}`;

    if (state.userId) {
      await logDeployment({
        projectId: actualProjectId,
        userId: state.userId,
        deploymentUrl: `http://localhost:4000/apps${deploymentUrl}`,
        buildStatus: 'success',
        dependenciesInstalled: scaffoldFiles.length,
        deploymentDurationMs: duration,
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FEATURE COMPLETION TRACKING
    // Mark added features as completed after successful deployment
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (state.editingSession?.userRequest?.includes('Add this feature:')) {
      const featureNameMatch = state.editingSession.userRequest.match(/Add this feature: (.+)/);
      if (featureNameMatch) {
        const featureName = featureNameMatch[1].split('\n')[0];
        const feature = state.allRequestedFeatures?.find((f: any) => f.name === featureName);
        if (feature) {
          feature.completed = true;
          console.log(`[DevOps] ✅ Feature "${featureName}" marked as completed`);
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // END FEATURE COMPLETION TRACKING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // These files are sent to deployment-server for actual deployment.
    // PocketBase already has userFiles stored (frontend only, shown in Code tab).
    // IMPORTANT: Use actualProjectId (PocketBase-generated) for consistency
    return {
      files: deploymentFiles,
      projectId: actualProjectId,
      deployUrl: deploymentUrl,
      stage: 'complete',
      completedNodes: ['devops'], // Reducer auto-appends
      allRequestedFeatures: state.allRequestedFeatures, // NEW: Pass features to UI
      deploymentSummary: {
        // NEW: Summary data for UI
        filesDeployed: deploymentFiles.length,
        userFiles: userFileCount,
        scaffoldFiles: scaffoldCount,
        hasDatabase: !!state.backendConfig?.collections,
        databaseCollections: state.backendConfig?.collections?.map((c: any) => c.name) || [],
      },
    };
  } catch (error: any) {
    emitNodeError('devops', error as Error, state);
    console.error('[DevOps] Deployment failed:', error);

    // Log failed deployment
    const errorDuration = Date.now() - startTime;
    if (state.projectId && state.userId) {
      await logDeployment({
        projectId: state.projectId,
        userId: state.userId,
        buildStatus: 'failed',
        errorMessage: error.message,
        deploymentDurationMs: errorDuration,
      });
    }

    return {
      errors: [{ node: 'devops', message: error.message }], // Reducer auto-appends
      completedNodes: ['devops'], // Reducer auto-appends
    };
  }
}

// Export traced version of devops node
export const devopsNode = withLangSmithTracing('devops', devopsNodeImpl);
