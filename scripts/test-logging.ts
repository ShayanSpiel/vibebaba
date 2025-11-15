/**
 * Test workflow logging
 */

import {
  logDeployment,
  logEditorOperation,
  logNodeExecution,
} from '../lib/services/workflow-logger';

async function testLogging() {
  console.log('🧪 Testing workflow logging...\n');

  try {
    // Test workflow execution logging
    console.log('1. Testing workflow execution logging...');
    await logNodeExecution({
      projectId: 'test_project_123',
      userId: 'test_user_123',
      workflowId: 'test_workflow_123',
      nodeName: 'test_node',
      status: 'success',
      durationMs: 1000,
      aiModel: 'claude-3-5-sonnet',
      tokensUsed: 500,
    });
    console.log('✅ Workflow execution logged successfully\n');

    // Test editor operation logging
    console.log('2. Testing editor operation logging...');
    await logEditorOperation({
      projectId: 'test_project_123',
      userId: 'test_user_123',
      operationType: 'modify',
      filePath: 'test.tsx',
      changeScope: 'moderate',
      status: 'success',
      durationMs: 500,
    });
    console.log('✅ Editor operation logged successfully\n');

    // Test deployment logging
    console.log('3. Testing deployment logging...');
    await logDeployment({
      projectId: 'test_project_123',
      userId: 'test_user_123',
      deploymentUrl: 'https://test.vercel.app',
      buildStatus: 'success',
      buildDurationMs: 30000,
      deploymentDurationMs: 45000,
    });
    console.log('✅ Deployment logged successfully\n');

    console.log('🎉 All logging tests passed! Workflow logging is working correctly.');
  } catch (error) {
    console.error('❌ Logging test failed:', error);
    process.exit(1);
  }
}

testLogging();
