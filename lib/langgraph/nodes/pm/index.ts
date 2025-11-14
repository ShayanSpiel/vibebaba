// @ts-nocheck
// lib/langgraph/nodes/pm-node-simplified.ts
/**
 * PM NODE - SIMPLIFIED & OPTIMIZED
 *
 * RESPONSIBILITIES:
 * 1. Feature extraction from user request
 * 2. Route planning (Feature → Route mapping)
 * 3. Backend detection
 * 4. Simple priority-based phasing
 *
 * WHAT'S SIMPLIFIED:
 * - No complex dependency-based phasing (now priority-based)
 * - Simplified funnel detection (keyword-only, no AI extraction)
 * - Cleaner code structure
 *
 * WHAT'S PRESERVED:
 * - Feature extraction system (CRITICAL - validators depend on this)
 * - Backend detection logic (CRITICAL - backend integration depends on this)
 * - Output structure (CRITICAL - downstream nodes depend on this)
 */

import type { AppGenState } from '../../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress } from '../../utils/logging/events';
import { generateWithLogging, estimateTokens } from '../../utils/logging/ai-with-logging';
import { extractAndParseJson } from '../../utils/json-parser';
import { addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';
import {
  FEATURE_EXTRACTION_RULES,
  ROUTE_PATTERNS
} from '@/lib/langgraph/prompts/feature-plan';

export async function pmNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INCREMENTAL FEATURE DETECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const isExistingProject = state.files && state.files.length > 0;
    const existingFeatures = state.allRequestedFeatures || [];
    const existingBackend = state.backendConfig;
    const existingContext = state.context;

    if (isExistingProject) {
      console.log('[PM] 🔄 INCREMENTAL MODE: Adding feature to existing project');
      console.log(`[PM]   Existing features: ${existingFeatures.length}`);
      console.log(`[PM]   Existing files: ${state.files?.length}`);
      console.log(`[PM]   Has backend: ${!!existingBackend?.collections?.length}`);
    } else {
      console.log('[PM] 🚀 NEW PROJECT MODE: Creating from scratch');
    }

    // Extract requirements as string
    let requirements: string;
    if (typeof state.refinedRequirements === 'string') {
      requirements = state.refinedRequirements;
    } else if (state.refinedRequirements && typeof state.refinedRequirements === 'object') {
      requirements = Array.isArray(state.refinedRequirements)
        ? state.refinedRequirements.join(', ')
        : JSON.stringify(state.refinedRequirements);
    } else {
      requirements = String(state.userDescription || '');
    }

    // For existing projects, clarify we're adding a feature
    const userRequest = isExistingProject
      ? `Add the following feature to the existing app: ${requirements}\n\nExisting features: ${existingFeatures.map(f => f.name).join(', ')}`
      : requirements;

    console.log(`[PM] 📝 Requirements: "${userRequest.substring(0, 100)}..."`);

    emitNodeStart('pm', state, {
      userInput: state.userDescription,
      interpretation: isExistingProject
        ? 'Adding new feature to existing app - will integrate with current features and backend'
        : 'Analyzing requirements to determine app type, complexity, and create product plan with routes.',
      plan: isExistingProject
        ? 'I will extract the new feature, ensure no conflicts with existing features, and plan integration with current backend/routes.'
        : 'I will classify the app, extract features with routes, detect backend needs, and create a comprehensive plan.'
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: APP TYPE ANALYSIS (Skip if existing project)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let context: any;

    if (isExistingProject && existingContext) {
      // Reuse existing context
      context = existingContext;
      console.log('[PM] 📊 Reusing existing context (incremental mode)');
      console.log(`[PM]   App: ${context.appType}, Complexity: ${context.complexity}, Design: ${context.designStyle}`);
    } else {
      // New project - analyze app type
      const appTypeAnalysisPrompt = `Analyze: "${requirements}"

Return JSON:
{
  "appType": "landing-page|dashboard|saas-app|ecommerce|blog|portfolio|tool|marketplace|social|other",
  "complexity": "simple|moderate|complex",
  "designStyle": "minimalist|modern|professional|playful|creative|corporate|tech|elegant",
  "visualTone": "light|dark|colorful",
  "animationLevel": "none|subtle|moderate|heavy",
  "targetAudience": "who is this for"
}

RULES:
- Respect explicit intent: "multi-page" ≠ landing-page
- landing-page = Single marketing page only
- Check for multiple routes mentioned
`;

      console.log('[PM] 📝 Analyzing app type...');
      emitProgress('pm', state.projectId, 'Analyzing app type...');

      const appTypeResult = await generateWithLogging({
        prompt: appTypeAnalysisPrompt,
        projectId: state.projectId,
        nodeName: 'pm',
        callType: 'analysis',
        estimatedTokens: estimateTokens(appTypeAnalysisPrompt),
        attempt: 1
      });

      context = extractAndParseJson(appTypeResult, {
        appType: 'other',
        complexity: 'moderate',
        designStyle: 'modern',
        visualTone: 'light',
        animationLevel: 'subtle',
        targetAudience: 'General users'
      });

      console.log(`[PM] 📊 App: ${context.appType}, Complexity: ${context.complexity}, Design: ${context.designStyle}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: FEATURE EXTRACTION WITH ROUTES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[PM] 🔍 Extracting features and routes...');
    emitProgress('pm', state.projectId, isExistingProject ? 'Extracting new feature and planning integration...' : 'Extracting features and planning routes...');

    const featureExtractionPrompt = `User Request: "${userRequest}"

${FEATURE_EXTRACTION_RULES}

${ROUTE_PATTERNS}

REMEMBER:
- Extract ALL features the user mentioned
- Mark infrastructure features with classification='infrastructure'
- Ensure all features get appropriate routes
- Phasing (which to build first) will be determined automatically
`;

    const featureResult = await generateWithLogging({
      prompt: featureExtractionPrompt,
      projectId: state.projectId,
      nodeName: 'pm',
      callType: 'feature-extraction',
      estimatedTokens: estimateTokens(featureExtractionPrompt),
      attempt: 1
    });

    const extractedData = extractAndParseJson(featureResult, {
      features: []
    });

    // Process all extracted features (both regular and infrastructure)
    const features: any[] = [];
    const backendReqs: { [featureId: string]: boolean } = state.backendRequirements || {};

    // Process extracted features
    (extractedData.features || []).forEach((item: any) => {
      const featureId = item.name.toLowerCase().replace(/\s+/g, '-');

      // Ensure routes are assigned
      let routes = item.routes;
      if (!routes || !Array.isArray(routes) || routes.length === 0) {
        // Features without routes get default based on type
        const isInfrastructure = item.classification === 'infrastructure';
        routes = isInfrastructure
          ? [] // Infrastructure features may not need dedicated routes
          : [{ path: '/', purpose: item.name }]; // Regular features get homepage by default
      }

      const feature = {
        id: featureId,
        name: item.name,
        description: item.description || '',
        dependencies: [], // Will be assigned by backend node based on collection relationships
        complexity: item.complexity || 'moderate',
        included_in_mvp: false, // Will be set by phasing logic
        completed: false,
        routes,
        backend_required: item.backend_required || false,
        classification: item.classification || 'regular',
        suggested: false, // User explicitly requested these
        userRequested: true,
        phase: 2 // Will be set by phasing logic (default to Phase 2)
      };

      backendReqs[featureId] = item.backend_required || false;
      features.push(feature); // Add all features to main array
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INFRASTRUCTURE FEATURE SUGGESTIONS (if not explicitly requested)
    // IMPROVED: Stricter detection to reduce false positives
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const allExtractedFeatureIds = features.map(f => f.id);

    // Suggest Auth ONLY if user management is explicitly mentioned (login/signup keywords)
    const hasAuthKeywords = features.some(f =>
      /(login|signup|register|sign up|sign in|authentication|user registration)/i.test(f.name + ' ' + f.description)
    );
    const hasAuthFeature = allExtractedFeatureIds.includes('authentication') ||
                           allExtractedFeatureIds.includes('user-authentication');

    if (hasAuthKeywords && !hasAuthFeature) {
      features.push({
        id: 'user-authentication',
        name: 'User Authentication',
        description: 'Login, signup, and session management for user accounts',
        dependencies: [], // Will be assigned by backend node
        complexity: 'moderate',
        included_in_mvp: false, // Phasing will be determined by AI analysis
        completed: false,
        routes: [{ path: '/login', purpose: 'User login' }, { path: '/signup', purpose: 'User registration' }],
        backend_required: true,
        classification: 'infrastructure',
        suggested: true,
        userRequested: false,
        phase: 2
      });
      backendReqs['user-authentication'] = true;
      console.log('[PM] 💡 Suggested: User Authentication (detected login/signup features)');
    }

    // Suggest Payments ONLY if payment PROCESSING is mentioned (not donation wallets)
    const hasPaymentProcessing = features.some(f =>
      /(stripe|paypal|payment processing|checkout.*pay|subscription payment|credit card)/i.test(f.description)
    );
    const hasPaymentFeature = allExtractedFeatureIds.includes('payment') ||
                              allExtractedFeatureIds.includes('payment-integration');

    if (hasPaymentProcessing && !hasPaymentFeature) {
      features.push({
        id: 'payment-integration',
        name: 'Payment Integration',
        description: 'Stripe/PayPal integration for processing payments',
        dependencies: [], // Will be assigned by backend node
        complexity: 'moderate',
        included_in_mvp: false, // Always Phase 2
        completed: false,
        routes: [], // No specific routes, integrated into checkout
        backend_required: true,
        classification: 'infrastructure',
        suggested: true,
        userRequested: false,
        phase: 2
      });
      backendReqs['payment-integration'] = true;
      console.log('[PM] 💡 Suggested: Payment Integration (detected payment processing)');
    }

    // Suggest Admin Panel ONLY if explicitly mentioned or user roles + moderation detected
    const hasAdminKeywords = features.some(f =>
      /(admin|moderate content|manage users|user roles|permissions|admin panel|cms)/i.test(f.description)
    );
    const hasAdminFeature = allExtractedFeatureIds.includes('admin') ||
                           allExtractedFeatureIds.includes('admin-panel');

    if (hasAdminKeywords && !hasAdminFeature) {
      features.push({
        id: 'admin-panel',
        name: 'Admin Panel',
        description: 'Dashboard for managing content, users, and site settings',
        dependencies: [], // Will be assigned by backend node
        complexity: 'moderate',
        included_in_mvp: false, // Always Phase 2
        completed: false,
        routes: [{ path: '/admin', purpose: 'Admin dashboard' }],
        backend_required: true,
        classification: 'infrastructure',
        suggested: true,
        userRequested: false,
        phase: 2
      });
      backendReqs['admin-panel'] = true;
      console.log('[PM] 💡 Suggested: Admin Panel (detected admin/moderation features)');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INCREMENTAL FEATURE MERGING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let allFeaturesList: any[];

    if (isExistingProject && existingFeatures.length > 0) {
      console.log('[PM] 🔄 Merging new features with existing features...');

      // Filter out duplicate features (by ID)
      const newFeatures = features.filter(newF =>
        !existingFeatures.some((existingF: any) =>
          existingF.id.toLowerCase() === newF.id.toLowerCase()
        )
      );

      console.log(`[PM]   New features: ${newFeatures.length}`);
      console.log(`[PM]   Existing features preserved: ${existingFeatures.length}`);

      // Mark new features as not yet completed
      // Phasing will be determined by smart logic below
      newFeatures.forEach(f => {
        f.completed = false;
        f.included_in_mvp = false; // Will be set by phasing logic
        f.phase = 2; // Default to Phase 2, will be updated if selected
      });

      // Merge: Existing features + New features
      allFeaturesList = [
        ...existingFeatures,
        ...newFeatures
      ];

      console.log(`[PM] ✅ Total features after merge: ${allFeaturesList.length}`);
    } else {
      // New project - use extracted features as-is
      allFeaturesList = features;
      console.log(`[PM] 📊 New project features: ${features.length}`);
    }

    // Count regular vs infrastructure features
    const regularFeatures = allFeaturesList.filter(f => f.classification === 'regular');
    const infrastructureFeatures = allFeaturesList.filter(f => f.classification === 'infrastructure');
    const userRequestedCount = allFeaturesList.filter(f => f.userRequested).length;
    const suggestedCount = allFeaturesList.filter(f => f.suggested).length;

    console.log(`[PM] 📊 Total: ${allFeaturesList.length} features`);
    console.log(`[PM]   └─ User Requested: ${userRequestedCount}`);
    console.log(`[PM]   └─ AI Suggested: ${suggestedCount}`);
    console.log(`[PM]   └─ Regular: ${regularFeatures.length}, Infrastructure: ${infrastructureFeatures.length}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: SMART PHASING WITH AI CONTEXT ANALYSIS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[PM] 🎯 Analyzing MVP flow with AI...');
    emitProgress('pm', state.projectId, 'Analyzing MVP flow...');

    // Use AI to understand core user flow and value proposition
    const phasingPrompt = `Analyze app to determine MVP (Phase 1) vs enhancements (Phase 2):

User Request: "${requirements}"

All Features Extracted:
${allFeaturesList.map((f, i) => `${i + 1}. ${f.name} - ${f.description} ${f.backend_required ? '[Backend]' : '[Frontend-only]'} ${f.classification === 'infrastructure' ? '[Infrastructure]' : ''}`).join('\n')}

Total: ${allFeaturesList.length} features (${userRequestedCount} user-requested, ${suggestedCount} suggested)

TASK: Identify which features are ESSENTIAL for the app to deliver its core value.

IMPORTANT: If the user requested ${allFeaturesList.length} features, they likely want a multi-page app with multiple features, NOT just a landing page. Build a complete MVP flow.

RULES:
1. **Core Value First**: What is the main purpose/benefit of this app?
2. **Minimum Viable Flow**: Entry → Core Action → Result
3. **User Journey**: What path must users take to get value?
4. **Dependencies**: If feature B depends on feature A, both must be in Phase 1 or both in Phase 2

EXAMPLES:

Example 1 - Collaboration Platform (Multi-Page App with Landing):
Core Value: "Connect writers for collaboration"
MVP Flow: Landing → Register → View Requests → Create Request → Edit Profile
Phase 1: Landing Page, Registration, Dashboard (collab requests), Profile basics
Phase 2: Advanced features, social media links, donation, sticky notes
WHY: Users need the complete flow to get value. Landing page is just the entry point.

Example 2 - E-commerce Store (Multi-Page App):
Core Value: "Buy products"
MVP Flow: Browse → Add to Cart → Checkout
Phase 1: Landing/Product Catalog, Shopping Cart, Checkout
Phase 2: User accounts, reviews, wishlist, recommendations
WHY: Users must be able to complete a purchase in Phase 1.

Example 3 - Simple Marketing Landing Page (ONLY Landing):
Core Value: "Explain product and capture leads"
MVP Flow: Read content → Take action (sign up/contact)
Phase 1: Landing Page (all sections), Contact Form
Phase 2: Blog, testimonials, advanced integrations
WHY: This is ONLY a landing page app - no other pages mentioned by user.

CRITICAL DISTINCTION:
- If user mentions ONLY a landing page → Phase 1 = Landing page only
- If user mentions landing page + OTHER pages (dashboard, profile, etc.) → Phase 1 = Landing + other essential pages
- Look at the FULL user request, not just the landing page mention!

INFRASTRUCTURE FEATURES:
- Auth: Phase 1 only if user accounts are core to the value (dashboard, user data)
- Payments: Phase 1 only if purchasing is the core action
- Admin: Always Phase 2 (not user-facing)

Return JSON:
{
  "coreValue": "One sentence describing the app's main benefit",
  "mvpFlow": ["step1", "step2", "step3"],
  "phase1Features": ["feature-id-1", "feature-id-2"],
  "reasoning": "Why these features deliver the core value"
}`;

    const phasingResult = await generateWithLogging({
      prompt: phasingPrompt,
      projectId: state.projectId,
      nodeName: 'pm',
      callType: 'phasing-analysis',
      estimatedTokens: estimateTokens(phasingPrompt),
      attempt: 1
    });

    const phasingDecision = extractAndParseJson(phasingResult, {
      coreValue: 'Complete app functionality',
      mvpFlow: ['Homepage'],
      phase1Features: [],
      reasoning: 'Default phasing'
    });

    console.log('[PM] 🎯 Smart Phasing Decision:');
    console.log(`[PM]   Core Value: ${phasingDecision.coreValue}`);
    console.log(`[PM]   MVP Flow: ${phasingDecision.mvpFlow.join(' → ')}`);
    console.log(`[PM]   Phase 1 Features: ${phasingDecision.phase1Features.length}`);
    console.log(`[PM]   Reasoning: ${phasingDecision.reasoning}`);

    // Assign phases based on AI analysis
    const allFeatures = allFeaturesList.map(f => {
      let isPhase1 = false;

      // Check if AI selected this feature for Phase 1
      if (phasingDecision.phase1Features.includes(f.id)) {
        isPhase1 = true;
      }

      // Fallback: If AI didn't select any features, use old logic
      if (phasingDecision.phase1Features.length === 0) {
        const homepageFeature = allFeaturesList.find(f =>
          f.routes?.some((r: any) => r.path === '/')
        );
        if (f.id === homepageFeature?.id) {
          isPhase1 = true;
        }
      }

      // Preserve existing MVP status for incremental projects
      if (f.included_in_mvp && f.completed) {
        isPhase1 = true;
      }

      return {
        ...f,
        phase: isPhase1 ? 1 : 2,
        included_in_mvp: isPhase1
      };
    });

    const phase1Features = allFeatures.filter(f => f.phase === 1);
    const phase2Features = allFeatures.filter(f => f.phase === 2);

    // For incremental mode, show only NEW features being added
    if (isExistingProject) {
      const newFeatures = allFeatures.filter(f => !f.completed);
      console.log(`[PM] 📋 Adding ${newFeatures.length} new feature(s): ${newFeatures.map(f => f.name).join(', ')}`);
      console.log(`[PM] 📋 Existing features: ${allFeatures.filter(f => f.completed).map(f => f.name).join(', ')}`);
    } else {
      console.log(`[PM] 📋 Phase 1 (Building Now - ${phase1Features.length} features):`);
      phase1Features.forEach(f => {
        console.log(`[PM]   ✅ ${f.name} ${f.classification === 'infrastructure' ? '(infrastructure)' : ''}`);
      });

      if (phase2Features.length > 0) {
        const regularPhase2 = phase2Features.filter(f => f.classification === 'regular');
        const infraPhase2 = phase2Features.filter(f => f.classification === 'infrastructure');

        console.log(`[PM] 📋 Phase 2 (Queued for Later - ${phase2Features.length} features):`);

        if (regularPhase2.length > 0) {
          console.log(`[PM]   Regular Features (${regularPhase2.length}):`);
          regularPhase2.forEach(f => {
            console.log(`[PM]     ⏳ ${f.name}${f.suggested ? ' (suggested)' : ''}`);
          });
        }

        if (infraPhase2.length > 0) {
          console.log(`[PM]   Infrastructure (${infraPhase2.length}):`);
          infraPhase2.forEach(f => {
            console.log(`[PM]     ⏳ ${f.name}${f.suggested ? ' (suggested)' : ''}`);
          });
        }
      }
    }

    // Log assigned routes
    console.log('[PM] 🗺️ Route Assignments:');
    allFeatures.forEach(f => {
      f.routes?.forEach((route: any) => {
        console.log(`[PM]   ${f.name} → ${route.path} (${route.purpose})`);
      });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: GENERATE PLAN (or update existing plan)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let plan: string;

    if (isExistingProject && state.plan) {
      // Incremental mode - append to existing plan
      console.log('[PM] 📝 Updating existing plan with new feature...');
      emitProgress('pm', state.projectId, 'Updating plan with new feature...');

      const newFeatures = allFeatures.filter(f => !f.completed);
      const newFeaturesList = newFeatures.map(f => `- ${f.name}: ${f.description}`).join('\n');

      const planUpdatePrompt = `Update plan for feature addition:

Existing Plan:
${state.plan}

New Feature Being Added:
${newFeaturesList}

Generate brief update section describing:
- What feature is being added
- How it integrates with existing features
- Any new routes or backend requirements

Keep it concise (2-3 sentences).`;

      const planUpdate = await generateWithLogging({
        prompt: planUpdatePrompt,
        projectId: state.projectId,
        nodeName: 'pm',
        callType: 'planning',
        estimatedTokens: estimateTokens(planUpdatePrompt),
        attempt: 1
      });

      plan = `${state.plan}\n\n### Feature Addition:\n${planUpdate}`;

      console.log('[PM] ✅ Plan updated with new feature');
    } else {
      // New project - generate full plan
      console.log('[PM] 📝 Generating product plan...');
      emitProgress('pm', state.projectId, 'Generating product plan...');

      const mvpFeaturesList = phase1Features.map(f => `- ${f.name}: ${f.description}`).join('\n');

      const planPrompt = `Create MVP plan for: "${requirements}"

App Type: ${context.appType}
Complexity: ${context.complexity}

MVP Features:
${mvpFeaturesList}

CRITICAL RULES:
1. Preserve ALL user-mentioned features in your plan
2. DO NOT simplify or remove any elements the user explicitly requested
3. List all features in the "Core Features" section
4. Keep the overview focused on what the user asked for

Generate concise plan with these sections:
- Overview: 1-2 sentences describing the complete app as user requested
- Core Features: List ALL ${phase1Features.length} features
- Design Direction: Visual style (${context.designStyle}, ${context.visualTone} theme)`;

      plan = await generateWithLogging({
        prompt: planPrompt,
        projectId: state.projectId,
        nodeName: 'pm',
        callType: 'planning',
        estimatedTokens: estimateTokens(planPrompt),
        attempt: 1
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ADD PHASE 1 FEATURES LIST TO PLAN MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const phase1FeaturesList = phase1Features.map(f => `✅ ${f.name}`).join('\n');
    const planWithFeatures = `${plan}\n\n---\n\n**🚀 Phase 1 Features (Building Now):**\n\n${phase1FeaturesList}\n\n*Phase 2 features (${phase2Features.length}) will be added later.*`;

    // Track in conversation memory
    addAssistantMessage(state.projectId, planWithFeatures, 'pm');
    console.log('[PM] 💬 Tracked response in conversation memory with Phase 1 features list');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: BACKEND DETECTION (from feature extraction)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const needsBackend = Object.values(backendReqs).some(required => required);
    console.log(`[PM] ${needsBackend ? '✅ Backend required' : '📦 Static site only'}`);

    // Log backend requirements per feature
    console.log('[PM] 🗂️ Backend requirements by feature:');
    allFeatures.forEach(feature => {
      const required = backendReqs[feature.id];
      console.log(`[PM]   ${feature.name}: ${required ? '✅' : '❌'} Backend`);
    });

    // Save memory checkpoint
    await conversationMemoryStore.saveMemory(state.projectId);

    const duration = Date.now() - startTime;

    emitNodeComplete('pm', state, duration, {
      taskDescription: 'Created product plan with features and routes',
      success: true,
      output: {
        appType: context.appType,
        complexity: context.complexity,
        featureCount: phase1Features.length,
        needsBackend
      },
      summary: `Created ${context.complexity} ${context.appType} plan with ${phase1Features.length} MVP features. ${needsBackend ? '🔧 Backend required' : '📦 Static site'}. Routes assigned to all features.`
    });

    // Safeguard: Handle edge cases
    if (!allFeatures || allFeatures.length === 0) {
      console.log('[PM] ⚠️ No features extracted - creating fallback');
      allFeatures.push({
        id: 'main-app',
        name: 'Main Application',
        description: requirements.substring(0, 150),
        priority: 'high',
        dependencies: [],
        complexity: 'moderate',
        included_in_mvp: true,
        completed: false,
        phase: 1,
        routes: [{ path: '/', purpose: 'Homepage' }]
      });
    }

    // ✅ ENSURE HOMEPAGE: If no route for "/", add primary feature to homepage
    const hasHomepage = allFeatures.some(f => f.routes?.some((r: any) => r.path === '/'));
    if (!hasHomepage && allFeatures.length > 0) {
      const primaryFeature = allFeatures.find(f => f.priority === 'high') || allFeatures[0];
      if (!primaryFeature.routes) {
        primaryFeature.routes = [];
      }
      primaryFeature.routes.push({
        path: '/',
        purpose: `Homepage - ${primaryFeature.name}`
      });
      console.log('[PM] 🏠 Added homepage route for primary feature:', primaryFeature.name);
    }

    console.log('[PM] ✅ PM planning complete - Backend will generate collections and endpoints');

    return {
      plan,
      context: {
        appType: context.appType || 'other',
        complexity: context.complexity || 'moderate',
        designStyle: context.designStyle || 'modern',
        visualTone: context.visualTone || 'light',
        animationLevel: context.animationLevel || 'subtle',
        targetAudience: context.targetAudience || 'General users',
        pmPlan: {
          needsBackend
        }
      },
      allRequestedFeatures: allFeatures, // Now includes infrastructure features with classification='infrastructure'
      backendRequirements: backendReqs,
      stage: 'designing',
      completedNodes: ['pm']
    };

  } catch (error) {
    emitNodeError('pm', error as Error, state);

    const requirements = state.refinedRequirements || state.userDescription;
    const fallbackFeature = [{
      id: 'emergency-fallback',
      name: 'Main Application',
      description: requirements?.substring(0, 150) || 'Primary application',
      priority: 'high' as const,
      dependencies: [],
      complexity: 'moderate' as const,
      included_in_mvp: true,
      completed: false,
      routes: [{ path: '/', purpose: 'Homepage' }]
    }];

    console.log('[PM] 🚨 ERROR FALLBACK: Creating emergency feature');

    return {
      plan: `Simple plan for: ${state.userDescription}`,
      context: {
        appType: 'other',
        complexity: 'simple',
        designStyle: 'modern',
        visualTone: 'light',
        animationLevel: 'subtle',
        targetAudience: 'General users',
        pmPlan: {
          needsBackend: false
        }
      },
      allRequestedFeatures: fallbackFeature,
      stage: 'designing',
      completedNodes: ['pm'],
      errors: [{ node: 'pm', message: (error as Error).message }]
    };
  }
}

