// lib/langsmith/dataset-setup.ts

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import {
  createDataset,
  addDatasetExample,
  listDatasets,
  getDataset,
} from './client';

/**
 * Example test cases for app generation workflow
 */
const APP_GEN_TEST_CASES = [
  {
    inputs: {
      userDescription: 'Build a simple todo app with add, delete, and mark as complete',
      userId: 'test-user-1',
      projectId: 'test-project-1',
    },
    outputs: {
      expectedFeatures: ['todo list', 'add task', 'delete task', 'mark complete'],
      needsBackend: true,
      complexity: 'simple',
    },
    metadata: {
      category: 'productivity',
      expectedDuration: '5-10 minutes',
    },
  },
  {
    inputs: {
      userDescription: 'Create a landing page for a SaaS product with hero section, features, pricing, and contact form',
      userId: 'test-user-2',
      projectId: 'test-project-2',
    },
    outputs: {
      expectedFeatures: ['hero section', 'features grid', 'pricing table', 'contact form'],
      needsBackend: true,
      complexity: 'moderate',
    },
    metadata: {
      category: 'marketing',
      expectedDuration: '10-15 minutes',
    },
  },
  {
    inputs: {
      userDescription: 'Build a blog with posts list, individual post pages, categories, and search',
      userId: 'test-user-3',
      projectId: 'test-project-3',
    },
    outputs: {
      expectedFeatures: ['posts list', 'post detail', 'categories', 'search'],
      needsBackend: true,
      complexity: 'moderate',
    },
    metadata: {
      category: 'content',
      expectedDuration: '15-20 minutes',
    },
  },
  {
    inputs: {
      userDescription: 'Create a dashboard with charts, user stats, and data tables',
      userId: 'test-user-4',
      projectId: 'test-project-4',
    },
    outputs: {
      expectedFeatures: ['charts', 'statistics cards', 'data tables', 'filters'],
      needsBackend: true,
      complexity: 'complex',
    },
    metadata: {
      category: 'analytics',
      expectedDuration: '20-30 minutes',
    },
  },
  {
    inputs: {
      userDescription: 'Simple portfolio website with projects showcase and about page',
      userId: 'test-user-5',
      projectId: 'test-project-5',
    },
    outputs: {
      expectedFeatures: ['projects grid', 'project detail', 'about page'],
      needsBackend: false,
      complexity: 'simple',
    },
    metadata: {
      category: 'portfolio',
      expectedDuration: '5-10 minutes',
    },
  },
];

/**
 * Setup dataset for app generation testing
 */
export async function setupAppGenDataset() {
  console.log('📦 [LangSmith] Setting up app generation dataset...');

  try {
    // Create dataset
    const dataset = await createDataset(
      'vibebaba-app-gen-tests',
      'Test cases for VibeBaba app generation workflow - various app types and complexities'
    );

    console.log(`✅ Dataset created: ${dataset.name} (ID: ${dataset.id})`);

    // Add examples
    for (const testCase of APP_GEN_TEST_CASES) {
      await addDatasetExample(
        dataset.id,
        testCase.inputs,
        testCase.outputs,
        testCase.metadata
      );

      console.log(`  ✓ Added test case: ${testCase.metadata.category}`);
    }

    console.log(`\n✅ Dataset setup complete! Added ${APP_GEN_TEST_CASES.length} test cases`);
    console.log(`\n🔗 View in LangSmith: https://smith.langchain.com/o/YOUR_ORG/datasets/${dataset.id}`);

    return dataset;
  } catch (error) {
    console.error('❌ Failed to setup dataset:', error);
    throw error;
  }
}

/**
 * Setup dataset for PM node specifically (for A/B testing PM prompts)
 */
export async function setupPMNodeDataset() {
  console.log('📦 [LangSmith] Setting up PM node dataset...');

  const PM_TEST_CASES = [
    {
      inputs: {
        userDescription: 'E-commerce store with products, cart, and checkout',
        businessContext: {
          targetAudience: 'online shoppers',
          primaryGoal: 'sell products online',
          successMetrics: ['conversion rate', 'average order value'],
        },
      },
      outputs: {
        needsBackend: true,
        pages: ['home', 'products', 'product-detail', 'cart', 'checkout'],
        collections: ['products', 'orders', 'users'],
      },
      metadata: {
        category: 'e-commerce',
        complexity: 'complex',
      },
    },
    {
      inputs: {
        userDescription: 'Recipe sharing app where users can post and browse recipes',
        businessContext: {
          targetAudience: 'home cooks',
          primaryGoal: 'share and discover recipes',
          successMetrics: ['active users', 'recipes posted'],
        },
      },
      outputs: {
        needsBackend: true,
        pages: ['home', 'recipes', 'recipe-detail', 'new-recipe', 'profile'],
        collections: ['recipes', 'users', 'comments'],
      },
      metadata: {
        category: 'social',
        complexity: 'moderate',
      },
    },
  ];

  try {
    const dataset = await createDataset(
      'vibebaba-pm-node-tests',
      'Test cases for PM node prompt evaluation and A/B testing'
    );

    console.log(`✅ Dataset created: ${dataset.name} (ID: ${dataset.id})`);

    for (const testCase of PM_TEST_CASES) {
      await addDatasetExample(
        dataset.id,
        testCase.inputs,
        testCase.outputs,
        testCase.metadata
      );

      console.log(`  ✓ Added test case: ${testCase.metadata.category}`);
    }

    console.log(`\n✅ PM node dataset setup complete! Added ${PM_TEST_CASES.length} test cases`);

    return dataset;
  } catch (error) {
    console.error('❌ Failed to setup PM node dataset:', error);
    throw error;
  }
}

/**
 * Setup dataset for QA node (code validation and debugging)
 */
export async function setupQANodeDataset() {
  console.log('📦 [LangSmith] Setting up QA node dataset...');

  const QA_TEST_CASES = [
    {
      inputs: {
        files: [
          { path: 'page.tsx', content: 'const Comp = () => { return <div>Test</div> }' },
          { path: 'api.ts', content: 'export const getData = async () => { await fetch("/api/data") }' },
        ],
        backendConfig: {
          collections: [{ name: 'tasks', fields: [{ name: 'title', type: 'text' }] }],
        },
      },
      outputs: {
        validationStatus: 'pass',
        errors: [],
        warnings: ['Missing export default in page.tsx'],
      },
      metadata: {
        category: 'typescript-validation',
        severity: 'low',
      },
    },
    {
      inputs: {
        files: [
          { path: 'component.tsx', content: 'import { useState } from "react"\n\nconst Comp = () => { const [state, setState] = useState() }' },
        ],
        backendConfig: null,
      },
      outputs: {
        validationStatus: 'fail',
        errors: [
          { file: 'component.tsx', line: 3, message: 'Missing return statement' },
          { file: 'component.tsx', line: 3, message: 'useState needs type parameter' },
        ],
        warnings: [],
      },
      metadata: {
        category: 'react-errors',
        severity: 'high',
      },
    },
  ];

  try {
    const dataset = await createDataset(
      'vibebaba-qa-node-tests',
      'Test cases for QA node prompt evaluation and A/B testing'
    );

    console.log(`✅ Dataset created: ${dataset.name} (ID: ${dataset.id})`);

    for (const testCase of QA_TEST_CASES) {
      await addDatasetExample(
        dataset.id,
        testCase.inputs,
        testCase.outputs,
        testCase.metadata
      );

      console.log(`  ✓ Added test case: ${testCase.metadata.category}`);
    }

    console.log(`\n✅ QA node dataset setup complete! Added ${QA_TEST_CASES.length} test cases`);

    return dataset;
  } catch (error) {
    console.error('❌ Failed to setup QA node dataset:', error);
    throw error;
  }
}

/**
 * Setup dataset for DevOps node (deployment)
 */
export async function setupDevOpsNodeDataset() {
  console.log('📦 [LangSmith] Setting up DevOps node dataset...');

  const DEVOPS_TEST_CASES = [
    {
      inputs: {
        appName: 'todo-app',
        files: [
          { path: 'page.tsx', content: '<div>Todo App</div>' },
          { path: 'globals.css', content: 'body { margin: 0; }' },
        ],
        backendConfig: {
          collections: [{ name: 'todos', fields: [{ name: 'title', type: 'text' }] }],
        },
      },
      outputs: {
        deploymentStatus: 'success',
        previewUrl: 'https://example.com/preview/todo-app',
        filesDeployed: 2,
      },
      metadata: {
        category: 'simple-deployment',
        hasBackend: true,
      },
    },
    {
      inputs: {
        appName: 'landing-page',
        files: [
          { path: 'page.tsx', content: '<div>Landing</div>' },
        ],
        backendConfig: null,
      },
      outputs: {
        deploymentStatus: 'success',
        previewUrl: 'https://example.com/preview/landing-page',
        filesDeployed: 1,
      },
      metadata: {
        category: 'static-deployment',
        hasBackend: false,
      },
    },
  ];

  try {
    const dataset = await createDataset(
      'vibebaba-devops-node-tests',
      'Test cases for DevOps node prompt evaluation and A/B testing'
    );

    console.log(`✅ Dataset created: ${dataset.name} (ID: ${dataset.id})`);

    for (const testCase of DEVOPS_TEST_CASES) {
      await addDatasetExample(
        dataset.id,
        testCase.inputs,
        testCase.outputs,
        testCase.metadata
      );

      console.log(`  ✓ Added test case: ${testCase.metadata.category}`);
    }

    console.log(`\n✅ DevOps node dataset setup complete! Added ${DEVOPS_TEST_CASES.length} test cases`);

    return dataset;
  } catch (error) {
    console.error('❌ Failed to setup DevOps node dataset:', error);
    throw error;
  }
}

/**
 * Setup dataset for Editor node (code modifications)
 */
export async function setupEditorNodeDataset() {
  console.log('📦 [LangSmith] Setting up Editor node dataset...');

  const EDITOR_TEST_CASES = [
    {
      inputs: {
        userRequest: 'Add a dark mode toggle button to the header',
        files: [
          { path: 'page.tsx', content: 'export default function Page() { return <div><h1>Header</h1></div> }' },
        ],
        backendConfig: null,
      },
      outputs: {
        filesModified: ['page.tsx'],
        filesAdded: [],
        filesDeleted: [],
        changeDescription: 'Added dark mode toggle button to header',
      },
      metadata: {
        category: 'ui-modification',
        changeScope: 'moderate',
      },
    },
    {
      inputs: {
        userRequest: 'Create a new contact form page',
        files: [
          { path: 'page.tsx', content: 'export default function Page() { return <div>Home</div> }' },
        ],
        backendConfig: {
          collections: [{ name: 'contacts', fields: [{ name: 'email', type: 'email' }] }],
        },
      },
      outputs: {
        filesModified: [],
        filesAdded: ['contact.tsx'],
        filesDeleted: [],
        changeDescription: 'Created new contact form page with database integration',
      },
      metadata: {
        category: 'new-page',
        changeScope: 'major',
      },
    },
  ];

  try {
    const dataset = await createDataset(
      'vibebaba-editor-node-tests',
      'Test cases for Editor node prompt evaluation and A/B testing'
    );

    console.log(`✅ Dataset created: ${dataset.name} (ID: ${dataset.id})`);

    for (const testCase of EDITOR_TEST_CASES) {
      await addDatasetExample(
        dataset.id,
        testCase.inputs,
        testCase.outputs,
        testCase.metadata
      );

      console.log(`  ✓ Added test case: ${testCase.metadata.category}`);
    }

    console.log(`\n✅ Editor node dataset setup complete! Added ${EDITOR_TEST_CASES.length} test cases`);

    return dataset;
  } catch (error) {
    console.error('❌ Failed to setup Editor node dataset:', error);
    throw error;
  }
}

/**
 * Setup dataset for Autogen node (multi-agent debugging)
 */
export async function setupAutogenNodeDataset() {
  console.log('📦 [LangSmith] Setting up Autogen node dataset...');

  const AUTOGEN_TEST_CASES = [
    {
      inputs: {
        errors: [
          { file: 'page.tsx', line: 10, message: 'Cannot find name "unknownVar"' },
        ],
        files: [
          { path: 'page.tsx', content: 'export default function Page() { return <div>{unknownVar}</div> }' },
        ],
        backendConfig: null,
      },
      outputs: {
        fixed: true,
        filesModified: ['page.tsx'],
        fixDescription: 'Removed undefined variable reference',
        validationPassed: true,
      },
      metadata: {
        category: 'undefined-variable',
        errorType: 'typescript',
      },
    },
    {
      inputs: {
        errors: [
          { file: 'api.ts', line: 5, message: 'Missing await for async function' },
        ],
        files: [
          { path: 'api.ts', content: 'export const getData = async () => { fetch("/api/data") }' },
        ],
        backendConfig: {
          collections: [{ name: 'data', fields: [{ name: 'value', type: 'text' }] }],
        },
      },
      outputs: {
        fixed: true,
        filesModified: ['api.ts'],
        fixDescription: 'Added await keyword for async fetch call',
        validationPassed: true,
      },
      metadata: {
        category: 'async-await',
        errorType: 'async',
      },
    },
  ];

  try {
    const dataset = await createDataset(
      'vibebaba-autogen-node-tests',
      'Test cases for Autogen node prompt evaluation and A/B testing'
    );

    console.log(`✅ Dataset created: ${dataset.name} (ID: ${dataset.id})`);

    for (const testCase of AUTOGEN_TEST_CASES) {
      await addDatasetExample(
        dataset.id,
        testCase.inputs,
        testCase.outputs,
        testCase.metadata
      );

      console.log(`  ✓ Added test case: ${testCase.metadata.category}`);
    }

    console.log(`\n✅ Autogen node dataset setup complete! Added ${AUTOGEN_TEST_CASES.length} test cases`);

    return dataset;
  } catch (error) {
    console.error('❌ Failed to setup Autogen node dataset:', error);
    throw error;
  }
}

/**
 * List all existing datasets
 */
export async function listExistingDatasets() {
  console.log('📋 [LangSmith] Listing existing datasets...\n');

  try {
    const datasets = await listDatasets();

    if (datasets.length === 0) {
      console.log('No datasets found.');
      return [];
    }

    datasets.forEach((dataset, index) => {
      console.log(`${index + 1}. ${dataset.name}`);
      console.log(`   ID: ${dataset.id}`);
      console.log(`   Description: ${dataset.description || 'N/A'}`);
      console.log(`   Created: ${new Date(dataset.created_at).toLocaleString()}`);
      console.log('');
    });

    return datasets;
  } catch (error) {
    console.error('❌ Failed to list datasets:', error);
    throw error;
  }
}

/**
 * Main CLI script for dataset management
 */
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'setup':
          await setupAppGenDataset();
          break;
        case 'setup-pm':
          await setupPMNodeDataset();
          break;
        case 'setup-qa':
          await setupQANodeDataset();
          break;
        case 'setup-devops':
          await setupDevOpsNodeDataset();
          break;
        case 'setup-editor':
          await setupEditorNodeDataset();
          break;
        case 'setup-autogen':
          await setupAutogenNodeDataset();
          break;
        case 'setup-all-nodes':
          console.log('📦 Setting up datasets for all nodes...\n');
          await setupPMNodeDataset();
          await setupQANodeDataset();
          await setupDevOpsNodeDataset();
          await setupEditorNodeDataset();
          await setupAutogenNodeDataset();
          console.log('\n🎉 All node datasets created successfully!');
          break;
        case 'list':
          await listExistingDatasets();
          break;
        default:
          console.log(`
📦 LangSmith Dataset Setup Tool

Usage:
  npm run langsmith:setup-dataset [command]

Commands:
  setup            - Setup full app generation test dataset
  setup-pm         - Setup PM node specific test dataset
  setup-qa         - Setup QA node specific test dataset
  setup-devops     - Setup DevOps node specific test dataset
  setup-editor     - Setup Editor node specific test dataset
  setup-autogen    - Setup Autogen node specific test dataset
  setup-all-nodes  - Setup datasets for all 5 specialized nodes
  list             - List all existing datasets

Examples:
  npm run langsmith:setup-dataset setup
  npm run langsmith:setup-dataset setup-all-nodes
  npm run langsmith:setup-dataset list
          `);
      }
    } catch (error) {
      console.error('\n❌ Error:', error);
      process.exit(1);
    }
  })();
}
