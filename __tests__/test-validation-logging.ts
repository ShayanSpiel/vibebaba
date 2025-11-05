/**
 * Test script to verify validation logging works
 */

import { logValidationError, logValidationSession } from './lib/services/validation-error-logger';

async function testLogging() {
  console.log('Testing validation logging...\n');

  try {
    // Test validation error logging
    console.log('1. Testing error logging...');
    await logValidationError(
      {
        rule: 'test-rule',
        severity: 'error',
        file: 'test.html',
        line: 1,
        column: 10,
        message: 'Test error message',
        suggestion: 'Fix it',
        context: 'Test context',
        autoFixable: true,
      },
      {
        projectId: 'test_proj_123',
        userId: 'test_user_456',
        endpoint: '/api/test',
        attemptNumber: 1,
        totalErrors: 1,
        totalWarnings: 0,
        filesGenerated: 1,
        isFixed: false,
        durationMs: 500,
      }
    );
    console.log('✅ Error logged successfully\n');

    // Test validation session logging
    console.log('2. Testing session logging...');
    await logValidationSession({
      projectId: 'test_proj_123',
      userId: 'test_user_456',
      endpoint: '/api/test',
      sessionType: 'generation',
      attemptNumber: 1,
      totalFiles: 1,
      totalErrors: 1,
      totalWarnings: 0,
      totalFixed: 0,
      wasSuccessful: true,
      errorSummary: { 'test-rule': 1 },
      timestamp: new Date().toISOString(),
      durationMs: 1000,
      fullLog: 'This is a test log\nWith multiple lines\nAnd some details...',
    });
    console.log('✅ Session logged successfully\n');

    console.log('All tests passed! ✅');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLogging();
