# Bolt Infrastructure Integration Guide

This guide explains how to integrate the new Bolt-inspired infrastructure into your VB application.

## Summary of Changes

We've implemented the following Bolt.new-inspired components:

### Core Infrastructure (✅ Completed)

1. **File Tracker** (`/lib/file-tracker.ts`)
   - Tracks file changes and modifications
   - Maintains change history
   - Detects actual content changes via hashing

2. **Error Loop Detector** (`/lib/error-loop-detector.ts`)
   - Prevents infinite error-fix loops
   - Tracks error attempts with configurable limits
   - Time-windowed duplicate detection

3. **Suggestion Validator** (`/lib/suggestion-validator.ts`)
   - Prevents duplicate AI suggestions
   - Tracks suggestion history per error
   - Similarity detection for code suggestions

4. **Error Context Enrichment** (`/lib/error-context.ts`)
   - Enriches errors with file history
   - Provides recent changes context
   - Includes previous fix attempts

5. **Build Monitor** (`/lib/build-monitor.ts`)
   - Parses TypeScript, JavaScript, and syntax errors
   - Supports multiple build tools
   - Deduplicates error messages

6. **Runtime Error Reporter** (`/lib/runtime-error-reporter.ts`)
   - Injects error reporting into generated HTML
   - Captures runtime errors and unhandled rejections
   - Sends errors to parent window via postMessage

7. **AI Request Throttler** (`/lib/ai-throttler.ts`)
   - Queues and throttles AI requests
   - Configurable min delay and max concurrent
   - Prevents rate limiting

8. **Error Boundary Component** (`/components/ErrorBoundary.tsx`)
   - React error boundary for UI errors
   - Provides fallback UI
   - Reports errors to callbacks

---

## Integration Steps

### Step 1: Add Environment Variables

Add these to your `.env` file:

```env
# Error Loop Prevention
ENABLE_ERROR_LOOP_DETECTION=true
MAX_ERROR_ATTEMPTS=3
ERROR_LOOP_TIME_WINDOW=60000

# File Tracking
ENABLE_FILE_TRACKING=true

# Runtime Error Reporting
ENABLE_RUNTIME_ERROR_REPORTING=true

# Request Throttling
ENABLE_AI_THROTTLING=true
AI_REQUEST_MIN_DELAY=1000
AI_REQUEST_MAX_CONCURRENT=1
AI_REQUEST_MAX_QUEUE_SIZE=10

# Error Tracking Database (optional)
ENABLE_ERROR_TRACKING_DB=false
```

### Step 2: Integrate with AI Endpoints

Here's how to integrate the error loop detection and throttling into your AI endpoints:

#### Example: `/app/api/ai/prototype/route.ts`

```typescript
import { getErrorLoopDetector } from '@/lib/error-loop-detector';
import { getSuggestionValidator } from '@/lib/suggestion-validator';
import { getAIThrottler } from '@/lib/ai-throttler';
import { enrichErrorContext, buildContextualPrompt } from '@/lib/error-context';
import { getFileTracker } from '@/lib/file-tracker';

export async function POST(req: NextRequest) {
  try {
    // ... existing auth and token checks ...

    const { plan, description, projectId, backendConfig } = await req.json();

    // Get infrastructure instances
    const errorDetector = getErrorLoopDetector();
    const suggestionValidator = getSuggestionValidator();
    const throttler = getAIThrottler();

    // Check for error loops (if this is a retry/fix request)
    const errorHash = `prototype_${projectId || 'new'}`;
    if (!errorDetector.canAttempt(errorHash)) {
      return NextResponse.json({
        error: 'Error loop detected. Too many failed attempts. Please try a different approach.',
        loopDetected: true,
        attemptHistory: errorDetector.getHistory(errorHash),
      }, { status: 429 });
    }

    // Throttle the request
    const result = await throttler.enqueue(async () => {
      // ... existing AI generation code ...
      const aiResult = await generateWithFallback(htmlPrompt, backendConfig);

      // Record this attempt
      errorDetector.recordError(
        errorHash,
        aiResult.content,
        'prototype',
        true, // success
        { projectId, model: aiResult.model }
      );

      return aiResult;
    });

    // ... rest of existing code ...

    return NextResponse.json({
      code: mainFile.content,
      files: files,
      aiMetadata: {
        model: result.model,
        provider: result.provider,
        attemptsLog: result.attemptsLog,
        filesGenerated: files.length,
        totalCharacters: files.reduce((sum, f) => sum + f.content.length, 0),
        throttleStats: throttler.getStats(), // Add throttle info
      }
    });

  } catch (error: any) {
    // Record failed attempt
    const errorDetector = getErrorLoopDetector();
    const errorHash = `prototype_${projectId || 'new'}`;
    errorDetector.recordError(
      errorHash,
      error.message,
      'prototype',
      false // failed
    );

    console.error("Error generating prototype:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### Step 3: Integrate Runtime Error Reporter

Update `/lib/html-generator.ts` to inject error reporter:

```typescript
import { injectErrorReporter } from '@/lib/runtime-error-reporter';

export async function generateCompleteHTML(
  pages: Page[],
  schema: BackendSchema,
  designSystem: DesignSystem
): Promise<string> {
  // ... existing code ...

  let html = /* generate HTML */;

  // Inject error reporter if enabled
  if (process.env.ENABLE_RUNTIME_ERROR_REPORTING !== 'false') {
    html = injectErrorReporter(html);
  }

  return html;
}
```

### Step 4: Add Error Boundary to Project Pages

Update `/app/project/[id]/page.tsx`:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createErrorListener } from '@/lib/runtime-error-reporter';

export default function ProjectPage() {
  // ... existing code ...

  // Listen for runtime errors from iframe
  useEffect(() => {
    const cleanup = createErrorListener(
      (error) => {
        console.error('[Runtime Error in Preview]', error);
        // Optionally: Send to error tracking service
        // Optionally: Show error notification to user
      },
      () => {
        console.log('[Preview] App loaded successfully');
      }
    );

    window.addEventListener('message', cleanup);

    return () => {
      window.removeEventListener('message', cleanup);
    };
  }, []);

  return (
    <ErrorBoundary
      showDetails={true}
      onError={(error, errorInfo) => {
        console.error('[UI Error]', error, errorInfo);
      }}
    >
      {/* existing project UI */}
    </ErrorBoundary>
  );
}
```

### Step 5: Integrate File Tracker

Track file changes when generating or updating projects:

```typescript
import { getFileTracker } from '@/lib/file-tracker';

// When generating new files
const fileTracker = getFileTracker();
files.forEach(file => {
  fileTracker.recordChange(file.path, file.content, 'create');
});

// When updating existing files
fileTracker.recordChange(filePath, newContent, 'update');

// Get recent changes for error context
const recentChanges = fileTracker.getRecentChanges(300000); // Last 5 minutes
```

---

## Usage Examples

### Example 1: Error Loop Detection

```typescript
const errorDetector = getErrorLoopDetector();

// Before attempting a fix
if (!errorDetector.canAttempt(errorMessage)) {
  console.log('Too many attempts! Suggesting manual intervention.');
  return;
}

// Record the attempt
errorDetector.recordError(
  errorMessage,
  suggestedFix,
  'ai/prototype',
  success
);

// Get attempt history
const history = errorDetector.getHistory(errorMessage);
console.log(`Attempted ${history.length} times`);
```

### Example 2: Suggestion Validation

```typescript
const validator = getSuggestionValidator();

// Check if suggestion is duplicate
if (validator.isDuplicateSuggestion(error, aiSuggestion)) {
  console.log('Duplicate suggestion detected! Requesting different approach...');
  // Modify prompt to request different solution
}
```

### Example 3: AI Request Throttling

```typescript
const throttler = getAIThrottler();

// Enqueue multiple requests - they'll be processed sequentially
const result1 = await throttler.enqueue(() => callAI(prompt1));
const result2 = await throttler.enqueue(() => callAI(prompt2));
const result3 = await throttler.enqueue(() => callAI(prompt3));

// Check throttle status
const stats = throttler.getStats();
console.log(`Queue: ${stats.queueSize}, Active: ${stats.activeRequests}`);
```

### Example 4: Error Context Enrichment

```typescript
import { enrichErrorContext, buildContextualPrompt } from '@/lib/error-context';

// Enrich error with context
const context = await enrichErrorContext(
  errorMessage,
  projectFiles,
  fileTracker,
  errorDetector,
  'User is trying to add authentication'
);

// Build enhanced prompt
const enriched = buildContextualPrompt(context, basePrompt, true);

// Send enriched prompt to AI
const result = await callAI(enriched.enrichedPrompt);
```

---

## Configuration Options

### Error Loop Detector

```typescript
const detector = new ErrorLoopDetector({
  maxAttempts: 3,       // Max attempts before loop detected
  timeWindow: 60000,    // Time window in ms
  enabled: true         // Enable/disable detection
});
```

### AI Throttler

```typescript
const throttler = new AIRequestThrottler({
  minDelay: 1000,       // Min delay between requests (ms)
  maxConcurrent: 1,     // Max concurrent requests
  maxQueueSize: 10,     // Max queue size
  enabled: true         // Enable/disable throttling
});
```

### File Tracker

```typescript
const tracker = new FileTracker(
  10 // Max history per file
);
```

---

## Testing

### Test Error Loop Detection

```bash
# Simulate multiple failed attempts
curl -X POST http://localhost:3000/api/ai/prototype \\
  -H "Content-Type: application/json" \\
  -d '{"description":"test","projectId":"loop-test"}' \\
  # Run this 4 times to trigger loop detection
```

### Test Throttling

```bash
# Send rapid requests - should be queued
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/ai/prototype \\
    -H "Content-Type: application/json" \\
    -d '{"description":"test '$i'"}' &
done
wait
```

---

## Monitoring & Debugging

### Check Error Loop Stats

```typescript
const detector = getErrorLoopDetector();
const stats = detector.getStats();
console.log('Error Loop Stats:', stats);
// {
//   totalErrors: 5,
//   totalAttempts: 12,
//   loopsDetected: 2,
//   mostAttempted: { errorHash: 'abc123', attempts: 4 }
// }
```

### Check Throttle Stats

```typescript
const throttler = getAIThrottler();
const stats = throttler.getStats();
console.log('Throttle Stats:', stats);
// {
//   queueSize: 3,
//   activeRequests: 1,
//   requestCount: 15,
//   isThrottled: true
// }
```

### Check File Tracker Stats

```typescript
const tracker = getFileTracker();
const stats = tracker.getStats();
console.log('File Tracker Stats:', stats);
// {
//   totalFiles: 10,
//   totalSize: 125000,
//   totalChanges: 45,
//   mostModified: { path: 'index.html', changes: 8 }
// }
```

---

## Best Practices

1. **Always wrap AI calls with throttler** to prevent rate limiting
2. **Check for error loops** before retry attempts
3. **Validate suggestions** to avoid duplicate fixes
4. **Enrich error context** for better AI responses
5. **Track file changes** for debugging and audit
6. **Use error boundaries** in React components
7. **Monitor stats** to tune configuration
8. **Enable runtime error reporting** in production

---

## Troubleshooting

### Problem: Too many error loops detected

**Solution**: Increase `MAX_ERROR_ATTEMPTS` or `ERROR_LOOP_TIME_WINDOW`

```env
MAX_ERROR_ATTEMPTS=5
ERROR_LOOP_TIME_WINDOW=120000  # 2 minutes
```

### Problem: Requests are being throttled too aggressively

**Solution**: Decrease `AI_REQUEST_MIN_DELAY` or increase `AI_REQUEST_MAX_CONCURRENT`

```env
AI_REQUEST_MIN_DELAY=500
AI_REQUEST_MAX_CONCURRENT=2
```

### Problem: Not receiving runtime errors

**Solution**: Check if error reporter is injected and message listener is set up

```typescript
// In preview component
useEffect(() => {
  const listener = createErrorListener((error) => {
    console.log('Received error:', error);
  });

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}, []);
```

---

## Next Steps

1. ✅ Infrastructure implemented
2. ⏳ Integrate with AI endpoints
3. ⏳ Add configuration to `.env`
4. ⏳ Test error loop detection
5. ⏳ Test throttling
6. ⏳ Monitor in production

---

## Summary

The Bolt infrastructure adds production-grade error handling, request management, and monitoring to your VB application. All components are:

- **Non-breaking**: Existing functionality continues to work
- **Configurable**: Environment variables control behavior
- **Optional**: Can be enabled/disabled per feature
- **Extensible**: Easy to add custom logic

Refer to individual files for detailed API documentation.
