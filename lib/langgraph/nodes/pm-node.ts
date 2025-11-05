// @ts-nocheck
// lib/langgraph/nodes/pm-node.ts
import { generateWithFallback } from '@/lib/ai';
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress } from '../events';
import { getMemoryService } from '@/lib/services/memory-service';
import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { extractAndParseJson } from '../utils/json-parser';
import { formatMemoryContextForPrompt } from '../memory-loader';
import { formatUnifiedSearchForAI } from '@/lib/mcp/unified-search';
import { getConversationContext, addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';

export async function pmNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('[PM] 🚀 Starting PM node (Product Manager)');

    // Safely extract requirements as string (handle objects, arrays, strings)
    let requirements: string;
    if (typeof state.refinedRequirements === 'string') {
      requirements = state.refinedRequirements;
    } else if (state.refinedRequirements && typeof state.refinedRequirements === 'object') {
      // If it's an object or array, convert to readable string
      requirements = Array.isArray(state.refinedRequirements)
        ? state.refinedRequirements.join(', ')
        : JSON.stringify(state.refinedRequirements);
    } else {
      requirements = String(state.userDescription || '');
    }

    console.log(`[PM] 📝 Requirements: "${requirements.substring(0, 100)}..."`);

    // Emit thinking process before starting
    emitNodeStart('pm', state, {
      userInput: state.userDescription, // Always use original user description for display
      interpretation: 'Analyzing requirements to determine the app type, complexity, design style, and create a comprehensive product plan.',
      plan: 'I will first classify the app type and design preferences, then create a detailed product plan with features, design direction, and UX considerations tailored to the target audience.'
    });

    // MEMORY: Fetch project context and user preferences
    console.log('[PM] 💾 Fetching memory context...');
    const memoryService = getMemoryService();
    const [projectContext, userPreferences] = await Promise.all([
      state.projectId ? memoryService.getProjectContext(state.projectId) : null,
      state.userId ? memoryService.getUserPreferences(state.userId) : null
    ]);

    if (projectContext) {
      console.log(`[PM] 💾 Found project context (${projectContext.plan ? 'existing plan' : 'no plan yet'})`);
    } else {
      console.log('[PM] 💾 No project context found (first time)');
    }

    // CONVERSATION MEMORY: Get conversation context for multi-turn editing
    console.log('[PM] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[PM] 💬 Conversation context loaded - enabling multi-turn editing');
    }

    // Analysis prompt (app type detection)
    const analysisPrompt = `${conversationContext}

${projectContext?.plan ? `
📋 PROJECT MEMORY:
This is a continuation of an existing project. Previous plan exists.
Build upon the existing architecture.

` : ''}

🎯 MVP PHILOSOPHY - CRITICAL RULES:

Your PRIMARY goal is to identify the ABSOLUTE MINIMUM features for a working product.

**MVP Definition:**
- MVP = 1-3 core features MAXIMUM
- Landing page = 1 feature (the page itself)
- Blog = 1 feature (blog posts)
- Each feature should take 1-3 files to implement
- Defer EVERYTHING that's not core to basic functionality

**Landing Page MVP RULES:**
- If request says "landing page" → ALWAYS return 1 feature: "Landing Page"
- Hero, CTA, testimonials, contact form are SECTIONS, not features
- DO NOT break landing page into multiple features
- Example: "Modern landing page with hero and pricing" → 1 feature: "Landing Page"

**Multi-Page App RULES (CRITICAL FIX):**
- When user requests multiple pages (e.g., "blog with posts, main page, and dashboard")
- DO NOT automatically call one of the pages "Landing Page"
- Each distinct page/system is its own feature with its proper name
- Example: "blog with posts, main page, dashboard" → 3 features: "Main Page", "Blog Posts", "Dashboard"
- "Landing Page" should ONLY be used when the user explicitly asks for a "landing page"

**Blog MVP RULES:**
- "Blog" without "admin" mentioned → 1 feature: "Blog Posts"
- "Blog with admin" → 2 features: "Blog Posts" + "Admin Panel"
- Defer: Comments, auth, categories, tags, search (add in future iterations)
- Example: "Blog site" → 1 feature: "Blog Posts"

**SaaS/Dashboard MVP RULES:**
- Auth + 1-2 core actions ONLY
- Dashboard is a feature when explicitly mentioned as a separate admin/management interface
- Example: "SaaS for project management" → 3 features max:
  - "User Authentication"
  - "Create Projects"
  - "View Project List"
- DEFERRED: Edit, delete, team management, settings, billing

**E-commerce MVP RULES:**
- Core flow: Browse → Add to cart → Checkout
- Example: "E-commerce site" → 3 features:
  - "Product Catalog"
  - "Shopping Cart"
  - "Checkout"
- DEFERRED: User accounts, wishlist, reviews, ratings, search filters

**EXAMPLES OF CORRECT MVP ANALYSIS:**

Example 1: "Build a modern landing page for my SaaS startup"
✅ CORRECT:
- appType: "landing-page"
- complexity: "simple"

Example 2: "I need a blog where I can post articles"
✅ CORRECT:
- appType: "blog"
- complexity: "simple"

Example 3: "Build an e-commerce site for selling products"
✅ CORRECT:
- appType: "ecommerce"
- complexity: "moderate"

Example 4: "Create a blog with posts, main page, and dashboard"
✅ CORRECT:
- appType: "blog"
- complexity: "moderate"
- Features should be: "Main Page", "Blog Posts", "Dashboard" (NOT "Landing Page")

Example 5: "Portfolio site with about, projects, and contact page"
✅ CORRECT:
- appType: "portfolio"
- complexity: "simple"

Analyze this app request:

"${requirements}"

Return JSON:
{
  "appType": "landing-page|dashboard|saas-app|ecommerce|blog|portfolio|tool|game|other",
  "complexity": "simple|moderate|complex (default to simple for MVP)",
  "designStyle": "minimalist|modern|professional|playful|creative|corporate|tech|elegant",
  "visualTone": "light|dark|colorful|muted|vibrant",
  "animationLevel": "none|subtle|moderate|heavy",
  "targetAudience": "who is this for"
}`;

    console.log('[PM] 📝 Analyzing app type and complexity...');
    emitProgress('pm', state.projectId, 'Analyzing app type and complexity...');

    const estimatedTokensAnalysis = estimateTokens(analysisPrompt);
    console.log(`[PM] 🤖 AI Call: Analysis (~${estimatedTokensAnalysis} tokens, gemini-2.0-flash)`);

    const analysisResult = await generateWithLogging({
      prompt: analysisPrompt,
      projectId: state.projectId,
      nodeName: 'pm',
      callType: 'analysis',
      estimatedTokens: estimatedTokensAnalysis,
      attempt: 1
    });

    // Parse JSON safely (handles control characters)
    const context = extractAndParseJson(analysisResult, {
      appType: 'other',
      complexity: 'moderate',
      designStyle: 'modern',
      visualTone: 'light',
      animationLevel: 'subtle',
      targetAudience: 'General users'
    });

    console.log(`[PM] 📊 App Type: ${context.appType}, Complexity: ${context.complexity}, Design: ${context.designStyle}`);
    console.log('[PM] Framework: Next.js (AI autonomy for file structure)');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AI-DRIVEN FEATURE PRIORITIZATION SYSTEM
    // ALWAYS extract features - let AI decide if single or multiple
    // If multiple (2+), select 1-2 main pages/features for MVP, queue rest
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('[PM] 🤖 Analyzing request complexity with AI...');
    console.log(`[PM] 📝 Request: "${requirements.substring(0, 150)}..."`);
    emitProgress('pm', state.projectId, 'Analyzing request complexity and features...');

    // AI call: Extract APP FEATURES only (NOT page sections/components)
    const featureExtractionPrompt = `${conversationContext}

Analyze this app request and extract distinct FEATURES (separate pages/systems, NOT sections):

"${requirements}"

🎯 CRITICAL: What counts as a FEATURE?

✅ FEATURES = Separate pages/systems with their own routes/functionality:
- Landing Page (the entire page, not individual sections!)
- Blog Posts (listing + individual posts)
- Admin Dashboard/Panel (separate management interface)
- User Authentication (login/signup system)
- E-commerce (products + cart + checkout)
- User Profiles (dedicated user pages)
- Messaging/Chat system
- Main Page / Home Page (when explicitly mentioned as part of multi-page app)
- About Page (only when it's a complex standalone page, not just a section)
- Dashboard (when explicitly mentioned as a separate admin/management interface)

❌ NOT FEATURES = Page sections/components (already part of the page):
- Pricing section, testimonials, reviews
- Hero section, features list, benefits
- Contact form, newsletter signup, waitlist form
- FAQ, team section, about section
- Header, footer, navigation

🚨 GOLDEN RULE FOR LANDING PAGES/MARKETING SITES:
**ALWAYS extract ONLY 1 feature for landing pages, regardless of how many sections mentioned!**

Examples:
- "landing page with pricing, testimonials, contact form" → 1 feature (Landing Page)
- "SaaS landing page with waitlist, features, pricing" → 1 feature (Landing Page)
- "marketing site with hero, testimonials, FAQ" → 1 feature (Marketing Site)
- "portfolio with projects, about, contact" → 1 feature (Portfolio)

🚨 MULTI-PAGE APP NAMING RULES (CRITICAL):
- DO NOT automatically call pages "Landing Page" unless user explicitly asks for it
- Use the actual page names the user mentions
- Examples:
  - "blog with posts, main page, and dashboard" → 3 features: "Main Page", "Blog Posts", "Dashboard"
  - "site with home, about, and contact" → 1 feature: "Multi-Page Site" (simple pages aren't separate features)
  - "app with dashboard and user profiles" → 2 features: "Dashboard", "User Profiles"

🚨 ONLY extract multiple features when there are genuinely SEPARATE SYSTEMS:

Examples:
- "blog" → 1 feature (Blog Posts)
- "blog with admin panel" → 2 features (Blog Posts, Admin Panel)
- "blog with admin panel and user auth" → 3 features (Blog Posts, Admin Panel, User Auth)
- "e-commerce site" → 1 feature (E-commerce)
- "e-commerce with user accounts" → 2 features (E-commerce, User Auth)
- "social network" → Multiple features (Posts, Profiles, Messaging)
- "blog with posts, main page, dashboard" → 3 features (Main Page, Blog Posts, Dashboard)

🔍 FEATURE VALIDATION RULES (ENFORCE STRICTLY):

**CRITICAL VALIDATION CHECKS:**

1. **Feature Count Check:**
   - If >3 features detected → REDUCE to MVP (2-3 features MAXIMUM)
   - Landing page → MUST be exactly 1 feature
   - Blog (simple) → MUST be 1 feature
   - Any app → 3 features is the ABSOLUTE MAXIMUM for MVP

2. **Feature vs Section Check:**
   - ❌ WRONG: "Hero Section", "CTA Button", "Pricing Section" (these are SECTIONS, not features)
   - ✅ RIGHT: "Landing Page" (one feature containing all sections)

3. **Feature vs Page Check:**
   - ❌ WRONG: "Home Page", "About Page", "Contact Page" as separate features (unless they're complex)
   - ✅ RIGHT: "Landing Page" or "Multi-Page Site" (one feature, multiple sections/pages)

4. **Naming Check:**
   - ❌ WRONG: Automatically using "Landing Page" for any home/main page
   - ✅ RIGHT: Use the actual name user mentioned ("Main Page", "Home", etc.)

5. **MVP vs Future Check:**
   - If feature is mentioned but not core → Mark included_in_mvp: false
   - Examples of NON-MVP features:
     - Comments system
     - User profiles (unless core to the app)
     - Advanced search/filters
     - Analytics/reporting
     - Team management
     - Admin panels (unless explicitly requested)
     - Settings pages
     - Email notifications

**VALIDATION EXAMPLES:**

Input: "Landing page with hero, pricing, testimonials, contact form"
❌ WRONG OUTPUT: 4 features (Hero, Pricing, Testimonials, Contact)
✅ CORRECT OUTPUT: 1 feature (Landing Page)

Input: "Blog with posts, comments, and user authentication"
❌ WRONG OUTPUT: All 3 in MVP
✅ CORRECT OUTPUT: 1 feature in MVP (Blog Posts), 2 deferred (Comments, Auth)

Input: "E-commerce site with products, cart, checkout, wishlist, reviews"
❌ WRONG OUTPUT: All 5 in MVP
✅ CORRECT OUTPUT: 3 in MVP (Products, Cart, Checkout), 2 deferred (Wishlist, Reviews)

Input: "Blog with posts, main page, and dashboard"
❌ WRONG OUTPUT: "Landing Page", "Blog Posts", "Dashboard"
✅ CORRECT OUTPUT: "Main Page", "Blog Posts", "Dashboard"

**POST-EXTRACTION VALIDATION:**
After extracting features, ALWAYS ask:
1. Can this be launched with fewer features? (If yes → reduce)
2. Is this a section/page, not a feature? (If yes → combine with parent feature)
3. Is this needed for day-1 launch? (If no → defer)
4. Am I using "Landing Page" when user didn't ask for it? (If yes → use user's actual page name)

Priority:
- high = main user-facing pages (landing page, blog, products)
- medium = admin/management panels
- low = extras (analytics, notifications)

Return JSON:
{
  "features": [{
    "id": "main-page",
    "name": "Main Page",
    "description": "Complete main page with all requested sections",
    "priority": "high",
    "dependencies": [],
    "complexity": "simple"
  }]
}

✅ CORRECT:
- "landing page with pricing and testimonials" → 1 feature: Landing Page
- "SaaS landing with waitlist form" → 1 feature: Landing Page
- "blog with admin" → 2 features: Blog Posts, Admin Panel
- "blog with posts, main page, dashboard" → 3 features: Main Page, Blog Posts, Dashboard

❌ WRONG - DO NOT DO THIS:
- "landing page with pricing" → ❌ Landing Page (feature), Pricing (feature), Testimonials (feature)
- "blog with posts, main page" → ❌ "Landing Page", "Blog Posts" (should be "Main Page", "Blog Posts")
- Landing page sections are NOT separate features!

REMEMBER: Sections/components of a single page are NOT features. Only separate pages/systems are features!`;

    const estimatedTokensFeatures = estimateTokens(featureExtractionPrompt);
    console.log(`[PM] 🤖 AI Call: Feature Analysis (~${estimatedTokensFeatures} tokens, gemini-2.0-flash)`);

    const featureExtractionResponse = await generateWithLogging({
      prompt: featureExtractionPrompt,
      projectId: state.projectId,
      nodeName: 'pm',
      callType: 'feature-extraction',
      estimatedTokens: estimatedTokensFeatures,
      attempt: 1
    });

    console.log('[PM] 🔍 AI Feature Extraction Response:', featureExtractionResponse.substring(0, 500));
    const featuresData = extractAndParseJson(featureExtractionResponse, { features: [] });
    console.log('[PM] 📊 Parsed features data:', JSON.stringify(featuresData, null, 2));
    let allFeatures: any[] | undefined = undefined;

    // AI has decided how many features exist
    if (featuresData.features.length === 0) {
      console.log('[PM] ⚠️ No features extracted - creating default feature');
      // Fallback: Create a single feature based on user description
      allFeatures = [{
        id: 'main-feature',
        name: 'Main Feature',
        description: state.userDescription?.substring(0, 100) || 'Primary application feature',
        priority: 'high',
        dependencies: [],
        complexity: 'simple',
        included_in_mvp: true,
        completed: false
      }];
    } else if (featuresData.features.length === 1) {
      console.log(`[PM] 📦 Single feature: ${featuresData.features[0].name}`);
      // Mark the single feature as included in MVP
      allFeatures = featuresData.features.map((f: any) => ({
        ...f,
        included_in_mvp: true,
        completed: false
      }));
    } else {
      console.log(`[PM] 🎯 Complex request: ${featuresData.features.length} features detected`);
      console.log(`[PM] 📋 Features:`, featuresData.features.map((f: any) => f.name).join(', '));

      // MVP STRATEGY: Prioritize 1-2 PAGES/CORE FEATURES first (not just any 3 features)
      // Filter to features without dependencies
      const availableFeatures = featuresData.features.filter((f: any) =>
        !f.dependencies || f.dependencies.length === 0 || f.dependencies.every((depId: string) =>
          state.allRequestedFeatures?.find((af: any) => af.id === depId)?.completed
        )
      );

      // Select MVP features: 1-2 main pages/features (keep it minimal!)
      const mvpFeatures = availableFeatures
        .sort((a: any, b: any) => {
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        })
        .slice(0, 2); // Changed from 3 to 2 for truly minimal MVP

      // Mark selected features
      allFeatures = featuresData.features.map((f: any) => ({
        ...f,
        included_in_mvp: mvpFeatures.some((mvp: any) => mvp.id === f.id),
        completed: false
      }));

      console.log(`[PM] ✅ MVP: ${mvpFeatures.length} main features:`, mvpFeatures.map((f: any) => f.name).join(', '));
      const remainingCount = allFeatures.filter((f: any) => !f.included_in_mvp).length;
      if (remainingCount > 0) {
        console.log(`[PM] 📋 Queued ${remainingCount} for later:`, allFeatures.filter((f: any) => !f.included_in_mvp).map((f: any) => f.name).join(', '));
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // END FEATURE PRIORITIZATION SYSTEM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // #done Format memory and background context for AI
    const memoryPrompt = state.memoryContext ? formatMemoryContextForPrompt(state.memoryContext) : '';
    const searchPrompt = state.backgroundContext ? formatUnifiedSearchForAI(state.backgroundContext as any, requirements) : '';

    // Planning prompt with context injection
    console.log('[PM] 📝 Generating comprehensive product plan...');
    emitProgress('pm', state.projectId, 'Generating comprehensive product plan...');

    // Build MVP feature list for prompt
    const mvpFeaturesList = allFeatures
      ? allFeatures.filter((f: any) => f.included_in_mvp).map((f: any) => `- ${f.name}`).join('\n')
      : '';

    const planPrompt = `${conversationContext}

${memoryPrompt}${searchPrompt}Create MVP plan for: "${requirements}"

App Type: ${context.appType}
Complexity: ${context.complexity}
${mvpFeaturesList ? `\nMVP Features:\n${mvpFeaturesList}` : ''}

Generate:
- Overview (1-2 sentences)
- Core Features (${allFeatures ? allFeatures.filter((f: any) => f.included_in_mvp).length : '1-3'} features)
- Design Direction (visual style)`;

    const estimatedTokensPlan = estimateTokens(planPrompt);
    console.log(`[PM] 🤖 AI Call: Planning (~${estimatedTokensPlan} tokens, gemini-2.0-flash)`);
    if (memoryPrompt) console.log('[PM] ✅ Memory context injected');
    if (searchPrompt) console.log('[PM] ✅ Research context injected');

    const plan = await generateWithLogging({
      prompt: planPrompt,
      projectId: state.projectId,
      nodeName: 'pm',
      callType: 'planning',
      estimatedTokens: estimatedTokensPlan,
      attempt: 1
    });

    const duration = Date.now() - startTime;
    console.log(`[PM] ✅ Completed in ${duration}ms`);

    // CONVERSATION MEMORY: Track PM's response
    addAssistantMessage(state.projectId, plan, 'pm');
    console.log('[PM] 💬 Tracked assistant response in conversation memory');

    const featureCount = '2-3'; // Always 2-3 core features (MVP approach)

    // RULE 1: Database-first approach - detect backend needs
    console.log('[PM] 🔍 Analyzing backend requirements...');
    const needsBackend = detectBackendNeed(state.userDescription, plan);
    console.log(`[PM] ${needsBackend ? '✅ Backend required' : '📦 Static site only'}`);

    console.log(`[PM] 📊 Framework: Next.js + TypeScript + Tailwind (always)`);
    console.log(`[PM] 📊 Features: ${featureCount} planned (MVP approach - core features only)`);

    // Emit completion with detailed task information
    emitNodeComplete('pm', state, duration, {
      taskDescription: 'Created comprehensive product plan with features and design direction',
      success: true,
      output: {
        appType: context.appType,
        complexity: context.complexity,
        designStyle: context.designStyle,
        featureCount,
        needsBackend
      },
      summary: `Created ${context.complexity} ${context.appType} plan with ${featureCount} features. ${needsBackend ? '🔧 Backend API required for data persistence.' : '📦 Static site (no backend).'} Design style: ${context.designStyle} with ${context.visualTone} visual tone. Target: ${context.targetAudience || (state.businessContext?.targetAudience?.primary || state.businessContext?.targetAudience) || 'General users'}.`
    });

    // MEMORY: Store plan in project context
    if (state.projectId && plan) {
      console.log('[PM] 💾 Storing plan in memory...');
      await memoryService.addObservation(
        `project_${state.projectId}`,
        `plan: ${plan.substring(0, 500)}`
      );
      await memoryService.addObservation(
        `project_${state.projectId}`,
        `pm_planning: ${context.appType} (${context.complexity}) with ${context.designStyle} design`
      );
      console.log('[PM] 💾 Plan stored successfully');

      // 💾 Save memory checkpoint after plan creation
      await conversationMemoryStore.saveMemory(state.projectId);
      console.log('[PM] 💾 Checkpoint saved after plan creation');
    }

    // 🚨 CRITICAL SAFEGUARD: NEVER return undefined/null features
    if (!allFeatures || allFeatures.length === 0) {
      console.log('[PM] 🚨 CRITICAL: allFeatures is empty/undefined! Creating emergency fallback feature');
      allFeatures = [{
        id: 'main-app',
        name: 'Main Application',
        description: state.userDescription?.substring(0, 150) || requirements.substring(0, 150),
        priority: 'high',
        dependencies: [],
        complexity: 'moderate',
        included_in_mvp: true,
        completed: false
      }];
    }

    // 🐛 DEBUG: Log what we're returning
    console.log('🐛 [PM Node] Returning allRequestedFeatures:', {
      count: allFeatures?.length,
      features: allFeatures,
      mvpCount: allFeatures?.filter((f: any) => f.included_in_mvp).length
    });

    return {
      plan,
      context: {
        appType: context.appType || 'other',
        complexity: context.complexity || 'moderate',
        designStyle: context.designStyle || 'modern',
        visualTone: context.visualTone || 'light',
        animationLevel: context.animationLevel || 'subtle',
        targetAudience: context.targetAudience || state.businessContext?.targetAudience || 'General users',
        pmPlan: {
          needsBackend
        }
      },
      allRequestedFeatures: allFeatures, // NEW: Pass features to next nodes (GUARANTEED non-empty)
      stage: 'designing',
      completedNodes: ['pm'] // Reducer auto-appends
    };
  } catch (error) {
    emitNodeError('pm', error as Error, state);

    // 🚨 CRITICAL: Fallback MUST include allRequestedFeatures or annotation defaults to []
    const requirements = state.refinedRequirements || state.userDescription;
    const fallbackFeature = [{
      id: 'emergency-fallback',
      name: 'Main Application',
      description: requirements?.substring(0, 150) || 'Primary application feature',
      priority: 'high' as const,
      dependencies: [],
      complexity: 'moderate' as const,
      included_in_mvp: true,
      completed: false
    }];

    console.log('[PM] 🚨 ERROR FALLBACK: Creating emergency feature due to PM node error');

    // Fallback
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
        // NOTE: generationMode removed - framework is always Next.js
      },
      allRequestedFeatures: fallbackFeature, // 🚨 CRITICAL: Must include features
      stage: 'designing',
      completedNodes: ['pm'], // Reducer auto-appends
      errors: [{ node: 'pm', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}

/**
 * RULE 1: Database-first approach - detect backend needs
 */
function detectBackendNeed(userRequest: string, pmPlan: string): boolean {
  const backendKeywords = [
    // Data persistence
    'save', 'store', 'persist', 'database', 'data', 'submit',
    // User management
    'user accounts', 'login', 'signup', 'authentication', 'auth', 'register',
    // Admin features
    'admin panel', 'dashboard', 'admin', 'cms',
    // CRUD operations
    'crud', 'create', 'update', 'delete', 'manage', 'edit',
    // Real-time features
    'real-time', 'websocket', 'chat', 'messaging',
    // Data operations
    'search', 'filter', 'query', 'list', 'records',
    // Backend infrastructure
    'api', 'endpoint', 'backend', 'server',
    // Forms (any type of form that saves data)
    'form submission', 'contact form', 'newsletter', 'email form', 'signup form',
    'registration form', 'feedback form', 'survey', 'application form',
    // E-commerce
    'cart', 'checkout', 'payment', 'order', 'product',
    // Content management
    'blog', 'post', 'article', 'comment', 'review',
    // Collections/Lists
    'collection', 'items', 'entries', 'tasks', 'todos'
  ];

  const staticKeywords = [
    'landing page', 'portfolio', 'marketing site',
    'documentation', 'docs', 'static site', 'brochure'
  ];

  const request = userRequest.toLowerCase();
  const plan = pmPlan.toLowerCase();

  // FIRST: Check if backend keywords are present (they override static keywords)
  const hasBackendKeywords = backendKeywords.some(kw => request.includes(kw) || plan.includes(kw));

  if (hasBackendKeywords) {
    const matchedKeywords = backendKeywords.filter(kw => request.includes(kw) || plan.includes(kw));
    console.log('[PM] 🔧 Backend keywords detected - API required');
    console.log('[PM]   Matched keywords:', matchedKeywords.join(', '));
    return true;
  }

  // SECOND: If no backend keywords, check if it's explicitly static
  const isExplicitlyStatic = staticKeywords.some(kw => request.includes(kw));

  if (isExplicitlyStatic) {
    console.log('[PM] 📦 Static keywords detected - no backend needed');
    return false;
  }

  // DEFAULT: No clear indicators, assume static
  console.log('[PM] 📦 No backend keywords found - static site');
  return false;
}
