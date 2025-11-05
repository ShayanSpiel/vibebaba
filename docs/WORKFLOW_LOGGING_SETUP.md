# Workflow Logging Setup

This document explains how to set up the workflow logging collections in PocketBase for the admin dashboard.

## Overview

The admin dashboard includes a comprehensive Workflow Health monitoring system that tracks:
- **App Generation** - All workflow nodes (founder, pm, ux, frontend, backend, qa, devops)
- **Editor Operations** - File creation, modification, deletion, and renaming
- **Deployment** - Build and deployment status and errors
- **Validation** - Code validation errors and warnings

## Required Collections

The following PocketBase collections need to be created:

1. `workflow_execution_logs` - Tracks all workflow node executions
2. `editor_operation_logs` - Tracks editor operations
3. `deployment_logs` - Tracks deployment operations
4. `validation_errors` - Tracks validation errors

## Setup Methods

### Option 1: Automatic Setup (Recommended when admin account exists)

1. Ensure PocketBase is running:
   ```bash
   # PocketBase should be running on http://127.0.0.1:8090
   ```

2. Create admin account if it doesn't exist:
   - Visit http://127.0.0.1:8090/_/
   - Create an admin account
   - Update `.env.local` with admin credentials:
     ```
     POCKETBASE_ADMIN_EMAIL=your-admin@email.com
     POCKETBASE_ADMIN_PASSWORD=your-secure-password
     ```

3. Run the setup script:
   ```bash
   npx tsx scripts/setup-workflow-collections.ts
   ```

### Option 2: Manual Setup via PocketBase Admin UI

1. Visit http://127.0.0.1:8090/_/
2. Navigate to "Collections"
3. Create each collection with the schemas defined in `scripts/setup-workflow-collections.ts`

### Option 3: Use without Collections (Graceful Degradation)

The API routes are designed to handle missing collections gracefully. If the collections don't exist:
- The admin dashboard will show empty data (no errors)
- Workflow logging will fail silently (logged to console only)
- The app will continue to function normally

## Viewing the Dashboard

Once setup is complete (or even without collections), you can access:

- **Main Dashboard**: http://localhost:3000/admin/workflow-health
- **App Generation**: http://localhost:3000/admin/workflow-health/app-generation
- **Editor**: http://localhost:3000/admin/workflow-health/editor
- **Deployment**: http://localhost:3000/admin/workflow-health/deployment
- **Validation**: http://localhost:3000/admin/workflow-health/validation

## How Logging Works

### Workflow Execution Logging
File: `lib/services/workflow-logger.ts`

```typescript
import { logNodeExecution } from '@/lib/services/workflow-logger';

// Log a successful execution
await logNodeExecution({
  projectId: 'project_123',
  userId: 'user_123',
  workflowId: 'workflow_123',
  nodeName: 'frontend',
  status: 'success',
  durationMs: 1500,
  aiModel: 'claude-3-5-sonnet-20241022',
  tokensUsed: 5000
});
```

### Editor Operation Logging
```typescript
import { logEditorOperation } from '@/lib/services/workflow-logger';

await logEditorOperation({
  projectId: 'project_123',
  userId: 'user_123',
  operationType: 'modify',
  filePath: 'app/page.tsx',
  changeScope: 'moderate',
  status: 'success',
  durationMs: 800
});
```

### Deployment Logging
```typescript
import { logDeployment } from '@/lib/services/workflow-logger';

await logDeployment({
  projectId: 'project_123',
  userId: 'user_123',
  deploymentUrl: 'https://myapp.vercel.app',
  buildStatus: 'success',
  buildDurationMs: 45000,
  deploymentDurationMs: 60000
});
```

## Troubleshooting

### Collections Not Found (404 Error)
If you see 404 errors in the console:
1. The collections don't exist yet (this is OK - the app handles it gracefully)
2. Run the setup script to create them
3. Or ignore if you don't need the workflow health dashboard

### Authentication Failed
If the setup script fails to authenticate:
1. Ensure PocketBase is running
2. Create an admin account at http://127.0.0.1:8090/_/
3. Update `.env.local` with correct credentials

### Data Not Appearing
If the dashboard shows no data:
1. Verify collections exist in PocketBase admin UI
2. Check that the workflow is executing (trigger app generation)
3. Check browser console and server logs for errors

## Migration File

A migration file has been created at:
`pocketbase/pb_migrations/1761300000_created_workflow_logging.js`

This will be automatically applied when PocketBase restarts (if migrations are enabled).

## Performance Considerations

- Logs are indexed on `timestamp`, `status`, `node_name`, and `project_id` for fast queries
- The dashboard queries are filtered by timeframe (1h, 24h, 7d, 30d)
- Consider implementing log rotation/cleanup for production environments
- Logs are stored indefinitely by default - add a cleanup job if needed

## Security

- Collection access rules are set to `null` (admin-only) by default
- Only authenticated admin users can view the workflow health dashboard
- Logging functions catch errors and don't expose sensitive data
