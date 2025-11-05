# Validation and AI Debugging System

This document describes the comprehensive validation error logging and AI-powered debugging system implemented in the VB application.

## Overview

The system provides two main features:

1. **Admin Dashboard** (`/admin/validation`) - Logs and displays all validation errors
2. **AI Debugging Engine** - Automatically fixes validation errors by regenerating code (up to 3 attempts)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prototype Generation API                      │
│                   (/api/ai/prototype)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Validation System                              │
│               (lib/validation/index.ts)                          │
│                                                                  │
│  • Structure validation (DOCTYPE, links, tags)                  │
│  • HTML validation (HTMLHint)                                   │
│  • CSS validation (CSS parser)                                  │
│  • JavaScript validation (JS parser)                            │
│  • Placeholder detection                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
           No Errors Found    Errors Found
                   │                 │
                   ▼                 ▼
    ┌──────────────────┐  ┌──────────────────────────┐
    │  Log Success     │  │   AI Debugging Engine    │
    │  Session         │  │  (lib/services/ai-       │
    └──────────────────┘  │   debugger.ts)           │
                          │                           │
                          │  • Attempt 1: Fix errors  │
                          │  • Attempt 2: Fix errors  │
                          │  • Attempt 3: Fix errors  │
                          └───────────┬───────────────┘
                                      │
                              ┌───────┴───────┐
                              │               │
                        Success         Failed
                              │               │
                              ▼               ▼
                    ┌─────────────┐  ┌─────────────┐
                    │ Return Fixed│  │ Return Error│
                    │ Code         │  │ to User     │
                    └─────────────┘  └─────────────┘
                              │               │
                              └───────┬───────┘
                                      ▼
                          ┌───────────────────────┐
                          │   Error Logging       │
                          │   Service             │
                          │  (validation-error-   │
                          │   logger.ts)          │
                          │                       │
                          │  Saves to PocketBase: │
                          │  • validation_errors  │
                          │  • validation_sessions│
                          └───────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │   Admin Dashboard     │
                          │  (/admin/validation)  │
                          │                       │
                          │  • Statistics         │
                          │  • Error List         │
                          │  • Session History    │
                          │  • Analytics          │
                          └───────────────────────┘
```

## Components

### 1. Validation Error Logger (`lib/services/validation-error-logger.ts`)

**Purpose:** Logs validation errors and sessions to PocketBase for tracking and analysis.

**Key Functions:**

- `logValidationError()` - Log a single validation error
- `logValidationErrors()` - Batch log multiple errors
- `logValidationSession()` - Log a complete validation session summary
- `getValidationErrors()` - Retrieve errors with filters and pagination
- `getValidationSessions()` - Retrieve sessions with filters
- `getProjectValidationStats()` - Get statistics for a specific project

**Database Collections:**

- `validation_errors` - Individual error records
- `validation_sessions` - Session summaries

### 2. AI Debugging Engine (`lib/services/ai-debugger.ts`)

**Purpose:** Automatically fixes validation errors by regenerating code with AI feedback.

**Key Features:**

- **Max 3 Attempts:** Tries up to 3 times to fix errors
- **Error Feedback:** Sends detailed error information back to AI
- **Context Preservation:** Maintains original requirements while fixing
- **Multi-Page Support:** Special handling for multi-page app validation
- **Logging:** Logs every attempt and error to database

**Main Function:**

```typescript
debugWithAI(
  initialFiles: FileToValidate[],
  initialValidation: ValidationResult,
  context: DebugContext
): Promise<DebugResult>
```

**Debug Flow:**

1. Receive initial validation errors
2. Build detailed error feedback for AI
3. Regenerate code with AI using error feedback
4. Validate regenerated code
5. If errors remain, repeat (max 3 times)
6. Return success or failure with debug history

### 3. Admin API Endpoint (`app/api/admin/validation/route.ts`)

**Purpose:** API for fetching validation data in the admin dashboard.

**Endpoints:**

**GET `/api/admin/validation`**

Query Parameters:
- `type` - 'errors' | 'sessions' | 'stats'
- `projectId` - Filter by project
- `page` - Page number
- `perPage` - Results per page
- `severity` - 'error' | 'warning'
- `errorType` - Error type filter
- `wasSuccessful` - Filter sessions by success
- `startDate` - Start date filter
- `endDate` - End date filter

**POST `/api/admin/validation`**

Action:
- `aggregate_stats` - Get aggregated statistics across all projects

Returns:
- Total errors/warnings
- Success rate
- Error breakdown by type
- Most common errors
- Error trend (last 7 days)
- Recent errors and sessions

### 4. Admin Dashboard (`app/admin/validation/page.tsx`)

**Purpose:** Visual interface for monitoring validation errors and debugging sessions.

**Features:**

**Overview Tab:**
- Total errors/warnings count
- Total sessions count
- Success rate percentage
- Auto-fixed errors count
- Most common errors table

**Errors Tab:**
- Recent validation errors (last 20)
- File location and line number
- Error message and suggestion
- Fixed/fixable status
- Attempt number

**Sessions Tab:**
- Debug session history
- Session type (generation/debug)
- Files, errors, warnings counts
- Success/failure status
- Attempt numbers

**Analytics Tab:**
- Errors by type breakdown
- Error trend chart (last 7 days)
- Visual analytics

### 5. Integration (`app/api/ai/prototype/route.ts`)

The debugging engine is integrated into the prototype generation flow:

```typescript
// After AI generates code and initial validation runs...

if (!validationResult.valid && validationResult.report.errors.length > 0) {
  // Activate AI debugging engine
  const debugResult = await debugWithAI(files, validationResult, {
    projectId,
    userId: user.id,
    plan,
    description,
    backendConfig,
    context,
    isMultiPage: backendConfig?.pages && backendConfig.pages.length > 0,
    expectedPages,
  });

  if (debugResult.success) {
    // Use fixed files
    files = debugResult.files;
  } else {
    // Return error after 3 failed attempts
    return NextResponse.json({
      error: 'AI debugging engine could not fix all validation errors',
      // ... error details
    }, { status: 500 });
  }
}
```

## Database Schema

### validation_errors

| Field | Type | Description |
|-------|------|-------------|
| id | text | Auto-generated ID |
| projectId | text | Project identifier |
| userId | text | User who triggered generation |
| endpoint | text | API endpoint (e.g., /api/ai/prototype) |
| errorType | select | structure, html, css, javascript, placeholder, multi-page |
| severity | select | error or warning |
| rule | text | Validation rule that failed |
| file | text | File path where error occurred |
| line | number | Line number |
| column | number | Column number (optional) |
| message | text | Error description |
| suggestion | text | How to fix (optional) |
| context | text | Code context (optional) |
| autoFixable | bool | Whether error can be auto-fixed |
| isFixed | bool | Whether it was auto-fixed |
| attemptNumber | number | Which generation attempt (1-3) |
| aiModel | text | AI model used (optional) |
| aiProvider | text | AI provider (optional) |
| filesGenerated | number | Total files in generation |
| totalErrors | number | Total errors in that attempt |
| totalWarnings | number | Total warnings in that attempt |
| created | datetime | Auto-generated |
| updated | datetime | Auto-generated |

### validation_sessions

| Field | Type | Description |
|-------|------|-------------|
| id | text | Auto-generated ID |
| projectId | text | Project identifier |
| userId | text | User who triggered generation |
| endpoint | text | API endpoint |
| sessionType | select | generation or debug_attempt |
| attemptNumber | number | Attempt number |
| totalFiles | number | Files generated/validated |
| totalErrors | number | Total errors found |
| totalWarnings | number | Total warnings found |
| totalFixed | number | Total auto-fixed errors |
| wasSuccessful | bool | Whether validation passed |
| aiModel | text | AI model used (optional) |
| aiProvider | text | AI provider (optional) |
| errorSummary | json | Error counts by rule |
| created | datetime | Auto-generated |
| updated | datetime | Auto-generated |

## Setup Instructions

### 1. Create Database Collections

**Option A: Manual Setup**

1. Start PocketBase: `./pocketbase serve`
2. Open admin panel: http://127.0.0.1:8090/_/
3. Follow instructions in `pocketbase/migrations/validation_collections.md`

**Option B: Automated Setup**

```bash
# Set environment variables
export POCKETBASE_ADMIN_EMAIL="admin@example.com"
export POCKETBASE_ADMIN_PASSWORD="your_password"

# Run setup script
npm run setup:validation-db
```

### 2. Access Dashboard

Once collections are created, access the dashboard:

```
http://localhost:3000/admin/validation
```

## Usage Examples

### Query Errors via API

```typescript
// Get all errors for current user
const response = await fetch('/api/admin/validation?type=errors&page=1&perPage=50');
const data = await response.json();

// Get only critical errors
const response = await fetch('/api/admin/validation?type=errors&severity=error');
const data = await response.json();

// Get errors by type
const response = await fetch('/api/admin/validation?type=errors&errorType=structure');
const data = await response.json();

// Get project-specific errors
const response = await fetch('/api/admin/validation?type=errors&projectId=abc123');
const data = await response.json();
```

### Query Sessions

```typescript
// Get all sessions
const response = await fetch('/api/admin/validation?type=sessions');
const data = await response.json();

// Get only successful sessions
const response = await fetch('/api/admin/validation?type=sessions&wasSuccessful=true');
const data = await response.json();
```

### Get Aggregate Statistics

```typescript
const response = await fetch('/api/admin/validation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'aggregate_stats' }),
});
const stats = await response.json();

console.log('Total errors:', stats.totalErrors);
console.log('Success rate:', stats.successRate + '%');
console.log('Most common errors:', stats.mostCommonErrors);
```

## AI Debugging Process

### Example Flow

1. **Initial Generation:**
   ```
   User requests app → AI generates code → Validation runs
   ```

2. **Error Detection:**
   ```
   Validation finds:
   - 3 structure errors (missing DOCTYPE, broken links)
   - 2 HTML errors (unclosed tags)
   - 1 multi-page error (hash routing instead of separate files)
   ```

3. **Debugging Attempt 1:**
   ```
   AI Debugger builds feedback:
   "You generated code with 6 errors. Fix:
   - index.html line 1: Missing DOCTYPE
   - index.html line 45: Broken link to about.html
   - about.html line 23: Unclosed <script> tag
   ..."

   AI regenerates → Validation runs → 2 errors remain
   ```

4. **Debugging Attempt 2:**
   ```
   AI Debugger sends remaining 2 errors → AI regenerates
   → Validation runs → All errors fixed!
   ```

5. **Result:**
   ```
   Success! Fixed code returned to user.
   All attempts logged to database.
   ```

### Error Feedback Format

The AI receives detailed feedback:

```markdown
# VALIDATION ERRORS DETECTED

You generated code with 3 error(s) that need to be fixed.

## CRITICAL: Multi-Page App Requirements
This is a MULTI-PAGE application. You MUST create separate HTML files:
- index.html
- about.html
- contact.html

DO NOT use hash routing (href="#about"), show/hide page logic, or window.location.hash.
Use proper navigation: <a href="about.html">About</a>

## Errors by File:

### index.html

**Error 1** (Line 1):
- **Rule**: doctype-first
- **Message**: Missing or incorrect DOCTYPE declaration
- **How to fix**: Add <!DOCTYPE html> at the beginning of the file

**Error 2** (Line 45):
- **Rule**: broken-link
- **Message**: Broken link: "about.html" not found in generated files
- **How to fix**: Create about.html or fix the link to an existing file: index.html

## Code Context:

### index.html
```html
<html>
<head>
  <title>My App</title>
</head>
<body>
  <a href="about.html">About</a>
</body>
</html>
```

## Instructions:
1. Fix ALL the errors listed above
2. Maintain the same functionality and design
3. Ensure all HTML files start with <!DOCTYPE html>
4. Make sure all <script> and <style> tags are properly closed
5. Create SEPARATE HTML files (no hash routing!)
6. Use proper links: href="pagename.html" not href="#pagename"
```

## Performance Considerations

### Error Logging

- Errors are logged asynchronously (non-blocking)
- Batch logging for multiple errors
- Failed logging doesn't break app generation
- All logging wrapped in try-catch

### AI Debugging

- Maximum 3 attempts to prevent infinite loops
- Each attempt has timeout protection (90 seconds)
- Circuit breaker prevents cascading failures
- Exponential backoff on retries

### Database Queries

- Indexes on frequently queried fields:
  - `projectId`, `userId`, `errorType`, `severity`, `created`
- Pagination for large result sets
- Filtered queries reduce data transfer
- Efficient aggregation queries

## Monitoring & Analytics

### Key Metrics

1. **Success Rate:** Percentage of sessions that pass validation
2. **Error Distribution:** Which errors are most common
3. **Auto-Fix Rate:** Percentage of errors that are auto-fixable
4. **Debug Success:** How often AI debugging succeeds
5. **Error Trends:** Are errors increasing or decreasing over time

### Dashboard Insights

- Identify problematic validation rules
- Track improvement over time
- Find patterns in errors
- Monitor AI debugging effectiveness
- User-specific error patterns

## Troubleshooting

### Database Connection Issues

```bash
# Check if PocketBase is running
curl http://127.0.0.1:8090/api/health

# Restart PocketBase
./pocketbase serve
```

### Collections Not Found

```bash
# Run setup script
npm run setup:validation-db

# Or create manually via admin panel
```

### AI Debugging Not Working

Check console logs for:
- `[AI Debugger] 🔍 Starting debugging engine...`
- `[AI Debugger] 🔧 Debug Attempt X/3`
- `[AI Debugger] ✅ AI debugging succeeded!`

If not appearing, validation errors may not be triggering the debugger.

### Dashboard Not Loading

1. Ensure you're authenticated
2. Check browser console for errors
3. Verify API endpoint is accessible: `/api/admin/validation`
4. Check database collections exist

## Future Improvements

### Potential Enhancements

1. **Real-time Dashboard:** WebSocket updates for live monitoring
2. **Error Patterns:** ML-based error pattern detection
3. **Custom Rules:** Allow users to define custom validation rules
4. **Notifications:** Email/Slack alerts for critical errors
5. **Export:** Export error reports as CSV/PDF
6. **Historical Analysis:** Compare error rates month-over-month
7. **Team Analytics:** Multi-user error tracking
8. **Code Suggestions:** AI-generated fix suggestions for manual errors

## Security Considerations

- All database queries filtered by `userId`
- API requires authentication
- No sensitive code exposed in logs
- Admin access can be restricted with additional checks
- Error messages sanitized before storage

## Conclusion

The Validation and AI Debugging System provides:

✅ **Comprehensive Error Logging** - Track every validation error
✅ **Automated Debugging** - AI fixes errors automatically (up to 3 attempts)
✅ **Admin Dashboard** - Visual monitoring and analytics
✅ **Scalable Architecture** - Clean, modular, and performant
✅ **Production Ready** - Error handling, logging, and monitoring built-in

The system ensures higher code quality and provides valuable insights into the app generation process.
