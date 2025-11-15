/**
 * Test script with detailed logs
 */

import { logValidationSession } from './lib/services/validation-error-logger';

async function testDetailedLogging() {
  console.log('Creating detailed test logs...\n');

  const timestamp = new Date().toISOString();
  const fullLog = `
=== VALIDATION SESSION LOG ===
Timestamp: ${timestamp}
Project: test_proj_123
Endpoint: /api/generate

[INFO] Starting validation...
[INFO] Checking HTML structure...
[WARN] Missing doctype declaration
[ERROR] Unclosed <div> tag at line 42
[INFO] Checking CSS...
[WARN] Unused CSS class: .unused-style
[INFO] Validation complete
[INFO] Total errors: 5
[INFO] Total warnings: 3
[INFO] Files processed: 3

=== ERROR DETAILS ===
1. html-doctype: Missing DOCTYPE declaration
   File: index.html:1
   Suggestion: Add <!DOCTYPE html> at the beginning

2. html-tag-pair: Unclosed div tag
   File: index.html:42
   Suggestion: Add closing </div> tag

3. css-placeholder: Placeholder color detected
   File: styles.css:15
   Suggestion: Replace with actual color value

=== END OF LOG ===
  `.trim();

  await logValidationSession({
    projectId: 'test_proj_123',
    userId: 'test_user_456',
    endpoint: '/api/generate',
    sessionType: 'generation',
    attemptNumber: 1,
    totalFiles: 3,
    totalErrors: 5,
    totalWarnings: 3,
    totalFixed: 2,
    wasSuccessful: false,
    errorSummary: {
      'html-doctype': 1,
      'html-tag-pair': 1,
      'css-placeholder': 3,
    },
    timestamp,
    durationMs: 2500,
    fullLog,
  });

  console.log('✅ Detailed log created successfully');
}

testDetailedLogging();
