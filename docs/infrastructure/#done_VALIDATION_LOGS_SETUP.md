# Validation Logs Setup Guide

## Overview

This document explains the validation logging system that tracks validation errors, debugging sessions, and provides detailed timing information for admin monitoring.

## Changes Made

### 1. PocketBase Collections Created

Three new collections have been added to store validation logs:

#### `validation_errors`
Stores individual validation errors with:
- Error details (type, severity, rule, file, line, message)
- Context (project, user, endpoint, attempt number)
- Timing information (timestamp, duration_ms)
- AI model information
- Fix status

#### `validation_sessions`
Stores complete validation session summaries with:
- Session metadata (type, attempt, files, errors, warnings)
- Success/failure status
- Error summary breakdown
- **Full log text** (up to 5MB)
- **Duration in milliseconds**
- Timestamp

#### `system_logs`
General system logs with:
- Log level (debug, info, warn, error)
- Source identification
- Message and full log text
- Metadata (JSON)
- Timestamp

### 2. Updated Services

#### `lib/services/validation-error-logger.ts`
- Now saves logs to PocketBase in addition to in-memory cache
- Added timing information (`timestamp`, `durationMs`)
- Automatic fallback to in-memory if PocketBase is unavailable
- Performance tracking for log operations
- Helper functions to convert between PocketBase records and app types

### 3. Admin Pages

#### New: `/admin/logs` (app/admin/logs/page.tsx)
Full logs viewer featuring:
- Complete validation session logs
- Timing information display
- Full log text in modal view
- Filterable table of all sessions
- Duration formatting (ms, seconds, minutes)

#### Updated: `/admin/validation` (app/admin/validation/page.tsx)
- Added "View Full Logs" button
- Added duration column to sessions table
- Displays timing information for each session

### 4. UI Components

Updated `components/ui/card.tsx` to include:
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

## Setup Instructions

### 1. Apply PocketBase Migration

The migration file is already created at:
```
pocketbase/pb_migrations/1748000000_validation_logs.js
```

To apply it:

```bash
# If PocketBase is running, stop it first (Ctrl+C)

# Restart PocketBase to apply migration
./pocketbase serve
```

Or use the helper script:
```bash
./scripts/apply-validation-logs-migration.sh
```

### 2. Verify Collections

After restarting PocketBase, verify the collections exist:

1. Open PocketBase admin: http://127.0.0.1:8090/_/
2. Check that these collections exist:
   - `validation_errors`
   - `validation_sessions`
   - `system_logs`

### 3. Access Admin Pages

- Validation Dashboard: http://localhost:3000/admin/validation
- Full Logs Viewer: http://localhost:3000/admin/logs

## Usage

### Logging Validation Errors

```typescript
import { logValidationError } from '@/lib/services/validation-error-logger';

await logValidationError(error, {
  projectId: 'proj_123',
  userId: 'user_456',
  endpoint: '/api/generate',
  attemptNumber: 1,
  totalErrors: 5,
  totalWarnings: 2,
  filesGenerated: 3,
  isFixed: false,
  aiModel: 'gpt-4',
  aiProvider: 'openai',
  durationMs: 1250, // Time taken to process
});
```

### Logging Validation Sessions

```typescript
import { logValidationSession } from '@/lib/services/validation-error-logger';

const startTime = Date.now();

// ... validation work ...

await logValidationSession({
  projectId: 'proj_123',
  userId: 'user_456',
  endpoint: '/api/generate',
  sessionType: 'generation',
  attemptNumber: 1,
  totalFiles: 3,
  totalErrors: 5,
  totalWarnings: 2,
  totalFixed: 3,
  wasSuccessful: true,
  aiModel: 'gpt-4',
  aiProvider: 'openai',
  errorSummary: { 'html-doctype': 1, 'css-placeholder': 2 },
  timestamp: new Date().toISOString(),
  durationMs: Date.now() - startTime,
  fullLog: capturedConsoleOutput, // Full log text
});
```

## Features

### Timing Information

All logs include:
- **timestamp**: ISO 8601 timestamp of when the log was created
- **durationMs**: Duration in milliseconds for the operation

Duration is displayed in human-readable format:
- < 1s: Shows milliseconds (e.g., "250ms")
- < 1m: Shows seconds (e.g., "12.5s")
- >= 1m: Shows minutes (e.g., "2.5m")

### Full Log Text

Validation sessions can store complete log output (up to 5MB) for detailed debugging. View full logs by:

1. Navigate to `/admin/logs`
2. Click "View Log" button for any session
3. Modal displays complete log with metadata

### Persistence

- **Primary storage**: PocketBase database (persistent)
- **Cache**: In-memory store for fast access (last 1000 errors, 100 sessions)
- **Fallback**: If PocketBase is unavailable, falls back to in-memory only

### Performance

- Log saves are non-blocking
- Parallel batch logging supported
- Performance metrics logged (e.g., "Logged error in 15ms")

## Troubleshooting

### Logs not appearing in admin

1. Check that PocketBase is running: `lsof -ti:8090`
2. Verify collections exist in PocketBase admin
3. Check browser console for errors
4. Verify authentication (logs require logged-in user)

### Migration not applied

1. Stop PocketBase completely
2. Check `pocketbase/pb_migrations/` for the migration file
3. Restart PocketBase and watch console for migration messages
4. Check PocketBase logs for errors

### Performance issues

- Logs are cached in-memory for fast access
- PocketBase saves are async and don't block operations
- Full log text is optional - only provide when needed
- Consider log rotation/cleanup for production

## Database Schema

### Indexes

For optimal performance, the following indexes are created:

**validation_errors**:
- `project_id`
- `user_id`
- `timestamp`
- `severity`

**validation_sessions**:
- `project_id`
- `user_id`
- `timestamp`

**system_logs**:
- `timestamp`
- `log_level`
- `source`

### Access Rules

All collections:
- **List/View**: Authenticated users only
- **Create**: Authenticated users only
- **Update**: None (logs are immutable)
- **Delete**: Authenticated users only (for cleanup)

## Next Steps

1. **Apply the migration** (restart PocketBase)
2. **Test logging** by generating a project
3. **View logs** at `/admin/logs`
4. **Monitor performance** using duration metrics

## Support

For issues or questions:
1. Check PocketBase logs
2. Check browser console
3. Review server logs
4. Check this documentation
