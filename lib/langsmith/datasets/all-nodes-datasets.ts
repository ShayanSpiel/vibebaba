// lib/langsmith/datasets/all-nodes-datasets.ts
/**
 * Dataset setup for ALL workflow nodes
 * Run: npx tsx lib/langsmith/datasets/all-nodes-datasets.ts [node-name]
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createDataset, addDatasetExample } from '../client';

/**
 * FOUNDER NODE TEST CASES
 */
const FOUNDER_TEST_CASES = [
  {
    inputs: { userDescription: 'Build a todo app with categories and priorities' },
    outputs: {
      refinedRequirements: 'Task management app with categorization and priority levels',
      targetAudience: 'productivity users',
      primaryGoal: 'organize tasks efficiently',
    },
  },
  {
    inputs: { userDescription: 'Create a blog where users can post articles' },
    outputs: {
      refinedRequirements: 'Blog platform with user-generated content',
      targetAudience: 'writers and readers',
      primaryGoal: 'share and discover content',
    },
  },
  {
    inputs: { userDescription: 'E-commerce site selling clothes' },
    outputs: {
      refinedRequirements: 'Online clothing store with product catalog and checkout',
      targetAudience: 'online shoppers',
      primaryGoal: 'sell clothing products',
    },
  },
];

/**
 * PM NODE TEST CASES
 */
const PM_TEST_CASES = [
  {
    inputs: {
      userDescription: 'Task management app with categorization',
      refinedRequirements: 'Task management with categories and priorities',
    },
    outputs: {
      appType: 'productivity',
      complexity: 'simple',
      needsBackend: true,
      features: ['task list', 'categories', 'priorities'],
    },
  },
  {
    inputs: {
      userDescription: 'Blog platform',
      refinedRequirements: 'Blog with user-generated content',
    },
    outputs: {
      appType: 'blog',
      complexity: 'moderate',
      needsBackend: true,
      features: ['posts', 'authors', 'comments'],
    },
  },
];

/**
 * UX NODE TEST CASES
 */
const UX_TEST_CASES = [
  {
    inputs: {
      plan: 'Task app with categories and priorities',
      appType: 'productivity',
      complexity: 'simple',
    },
    outputs: {
      designSystem: 'tailwind-shadcn',
      visualTone: 'light',
      primaryColors: ['blue', 'white'],
    },
  },
  {
    inputs: {
      plan: 'Blog platform with posts and comments',
      appType: 'blog',
      complexity: 'moderate',
    },
    outputs: {
      designSystem: 'ant-design',
      visualTone: 'modern',
      primaryColors: ['gray', 'black'],
    },
  },
];

/**
 * BACKEND NODE TEST CASES
 */
const BACKEND_TEST_CASES = [
  {
    inputs: {
      plan: 'Task app with categories',
      needsBackend: true,
    },
    outputs: {
      collections: ['tasks', 'categories', 'users'],
      hasRelationships: true,
    },
  },
  {
    inputs: {
      plan: 'Blog with posts',
      needsBackend: true,
    },
    outputs: {
      collections: ['posts', 'users', 'comments'],
      hasRelationships: true,
    },
  },
];

/**
 * FRONTEND NODE TEST CASES
 */
const FRONTEND_TEST_CASES = [
  {
    inputs: {
      plan: 'Task app with list and categories',
      designSystem: 'tailwind-shadcn',
      backendConfig: { collections: ['tasks'] },
    },
    outputs: {
      hasPages: true,
      hasComponents: true,
      hasApiIntegration: true,
    },
  },
  {
    inputs: {
      plan: 'Blog with posts list',
      designSystem: 'ant-design',
      backendConfig: { collections: ['posts'] },
    },
    outputs: {
      hasPages: true,
      hasComponents: true,
      hasApiIntegration: true,
    },
  },
];

/**
 * QA NODE TEST CASES
 */
const QA_TEST_CASES = [
  {
    inputs: {
      files: [
        { path: 'app/page.tsx', content: 'export default function Home() { return <div>Hello</div> }' },
        { path: 'app/api/tasks/route.ts', content: 'export async function GET() { return Response.json([]) }' }
      ],
      backendConfig: { collections: ['tasks'] },
    },
    outputs: {
      validationStatus: 'pass',
      errors: [],
      warnings: [],
    },
  },
  {
    inputs: {
      files: [
        { path: 'app/page.tsx', content: 'import { missing } from "nonexistent"' }
      ],
      backendConfig: null,
    },
    outputs: {
      validationStatus: 'fail',
      errors: ['Module "nonexistent" not found'],
      fixes: ['Check import path'],
    },
  },
];

/**
 * DEVOPS NODE TEST CASES
 */
const DEVOPS_TEST_CASES = [
  {
    inputs: {
      projectId: 'test-project-123',
      appName: 'Task Manager',
      files: [
        { path: 'app/page.tsx', content: 'export default function Home() {}' }
      ],
      backendConfig: { collections: ['tasks'] },
    },
    outputs: {
      deploymentStatus: 'success',
      previewUrl: 'http://localhost:4000/apps/test-project-123',
      filesDeployed: 1,
    },
  },
  {
    inputs: {
      projectId: 'blog-456',
      appName: 'My Blog',
      files: [
        { path: 'app/page.tsx', content: 'export default function Home() {}' },
        { path: 'app/posts/page.tsx', content: 'export default function Posts() {}' }
      ],
      backendConfig: { collections: ['posts', 'users'] },
    },
    outputs: {
      deploymentStatus: 'success',
      previewUrl: 'http://localhost:4000/apps/blog-456',
      filesDeployed: 2,
    },
  },
];

/**
 * EDITOR NODE TEST CASES
 */
const EDITOR_TEST_CASES = [
  {
    inputs: {
      userRequest: 'Change the title from "Hello" to "Welcome"',
      files: [
        { path: 'app/page.tsx', content: '<h1>Hello</h1>' }
      ],
      backendConfig: null,
    },
    outputs: {
      filesModified: ['app/page.tsx'],
      changes: ['Updated title text'],
      newContent: '<h1>Welcome</h1>',
    },
  },
  {
    inputs: {
      userRequest: 'Add a new button that says "Submit"',
      files: [
        { path: 'app/page.tsx', content: '<div><input /></div>' }
      ],
      backendConfig: null,
    },
    outputs: {
      filesModified: ['app/page.tsx'],
      changes: ['Added submit button'],
      newContent: '<div><input /><button>Submit</button></div>',
    },
  },
];

/**
 * Context Analyzer / Input Detector NODE TEST CASES
 */
const CONTEXT_ANALYZER_TEST_CASES = [
  {
    inputs: {
      userRequest: 'Change the homepage background to blue',
      files: [
        { path: 'app/page.tsx', content: 'export default function Home() {}' },
        { path: 'app/globals.css', content: 'body { background: white; }' }
      ],
    },
    outputs: {
      scope: 'styling',
      filesToModify: ['app/globals.css'],
      changeType: 'visual',
      needsUserInput: false,
    },
  },
  {
    inputs: {
      userRequest: 'Add a new page for user profiles',
      files: [
        { path: 'app/page.tsx', content: 'export default function Home() {}' }
      ],
    },
    outputs: {
      scope: 'new-feature',
      filesToModify: ['app/profile/page.tsx'],
      changeType: 'structural',
      needsUserInput: false,
    },
  },
];

/**
 * Setup functions for each node
 */
export async function setupFounderDataset() {
  console.log('📦 [Founder] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-founder-tests',
    'Test cases for Founder node - requirements refinement'
  );

  for (const testCase of FOUNDER_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${FOUNDER_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupPMDataset() {
  console.log('📦 [PM] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-pm-tests',
    'Test cases for PM node - product planning'
  );

  for (const testCase of PM_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${PM_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupUXDataset() {
  console.log('📦 [UX] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-ux-tests',
    'Test cases for UX node - design system selection'
  );

  for (const testCase of UX_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${UX_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupBackendDataset() {
  console.log('📦 [Backend] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-backend-tests',
    'Test cases for Backend node - schema generation'
  );

  for (const testCase of BACKEND_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${BACKEND_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupFrontendDataset() {
  console.log('📦 [Frontend] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-frontend-tests',
    'Test cases for Frontend node - code generation'
  );

  for (const testCase of FRONTEND_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${FRONTEND_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupQADataset() {
  console.log('📦 [QA] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-qa-tests',
    'Test cases for QA node - code validation and debugging'
  );

  for (const testCase of QA_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${QA_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupDevOpsDataset() {
  console.log('📦 [DevOps] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-devops-tests',
    'Test cases for DevOps node - deployment and infrastructure'
  );

  for (const testCase of DEVOPS_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${DEVOPS_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupEditorDataset() {
  console.log('📦 [Editor] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-editor-tests',
    'Test cases for Editor node - code modifications'
  );

  for (const testCase of EDITOR_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${EDITOR_TEST_CASES.length} test cases`);
  return dataset;
}

export async function setupContextAnalyzerDataset() {
  console.log('📦 [Context Analyzer] Setting up dataset...');

  const dataset = await createDataset(
    'vibebaba-context-analyzer-tests',
    'Test cases for Context Analyzer / Input Detector node - understanding edit scope'
  );

  for (const testCase of CONTEXT_ANALYZER_TEST_CASES) {
    await addDatasetExample(dataset.id, testCase.inputs, testCase.outputs);
  }

  console.log(`✅ Created ${CONTEXT_ANALYZER_TEST_CASES.length} test cases`);
  return dataset;
}

/**
 * Setup all datasets at once
 */
export async function setupAllDatasets() {
  console.log('📦 Setting up ALL node datasets...\n');

  try {
    await setupFounderDataset();
    await setupPMDataset();
    await setupUXDataset();
    await setupBackendDataset();
    await setupFrontendDataset();
    await setupQADataset();
    await setupDevOpsDataset();
    await setupEditorDataset();
    await setupContextAnalyzerDataset();

    console.log('\n✅ All datasets created successfully!');
    console.log('\nView in LangSmith: https://smith.langchain.com/datasets');
  } catch (error: any) {
    console.error('\n❌ Failed to setup datasets:', error.message);
    throw error;
  }
}

/**
 * CLI
 */
if (require.main === module) {
  const node = process.argv[2];

  (async () => {
    try {
      switch (node) {
        case 'founder':
          await setupFounderDataset();
          break;
        case 'pm':
          await setupPMDataset();
          break;
        case 'ux':
          await setupUXDataset();
          break;
        case 'backend':
          await setupBackendDataset();
          break;
        case 'frontend':
          await setupFrontendDataset();
          break;
        case 'qa':
          await setupQADataset();
          break;
        case 'devops':
          await setupDevOpsDataset();
          break;
        case 'editor':
          await setupEditorDataset();
          break;
        case 'context-analyzer':
        case 'context':
          await setupContextAnalyzerDataset();
          break;
        case 'all':
        case undefined:
          await setupAllDatasets();
          break;
        default:
          console.log(`
📦 Dataset Setup for All Nodes

Usage:
  npx tsx lib/langsmith/datasets/all-nodes-datasets.ts [node]

Nodes:
  founder          - Founder node dataset
  pm               - PM node dataset
  ux               - UX node dataset
  backend          - Backend node dataset
  frontend         - Frontend node dataset
  qa               - QA node dataset
  devops           - DevOps node dataset
  editor           - Editor node dataset
  context-analyzer - Context Analyzer / Input Detector dataset
  all              - All datasets (default)

Examples:
  npx tsx lib/langsmith/datasets/all-nodes-datasets.ts all
  npx tsx lib/langsmith/datasets/all-nodes-datasets.ts pm
  npx tsx lib/langsmith/datasets/all-nodes-datasets.ts qa
          `);
      }
    } catch (error) {
      console.error('\n❌ Error:', error);
      process.exit(1);
    }
  })();
}
