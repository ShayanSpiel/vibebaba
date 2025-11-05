# Validation System Database Collections

This document describes the PocketBase collections needed for the validation error logging and AI debugging system.

## Collections to Create

### 1. validation_errors

Stores individual validation errors from code generation.

**Fields:**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| projectId | text | Yes | - |
| userId | text | Yes | - |
| endpoint | text | Yes | - |
| errorType | select | Yes | Options: structure, html, css, javascript, placeholder, multi-page |
| severity | select | Yes | Options: error, warning |
| rule | text | Yes | - |
| file | text | Yes | - |
| line | number | Yes | Min: 1 |
| column | number | No | Min: 1 |
| message | text | Yes | - |
| suggestion | text | No | - |
| context | text | No | - |
| autoFixable | bool | Yes | Default: false |
| isFixed | bool | Yes | Default: false |
| attemptNumber | number | Yes | Default: 1 |
| aiModel | text | No | - |
| aiProvider | text | No | - |
| filesGenerated | number | Yes | Default: 1 |
| totalErrors | number | Yes | Default: 0 |
| totalWarnings | number | Yes | Default: 0 |

**Indexes:**
- `projectId` (for fast project lookups)
- `userId` (for user-specific queries)
- `errorType` (for filtering by error type)
- `severity` (for filtering by severity)
- `created` (for time-based queries)

**API Rules:**
- List: `@request.auth.id != "" && userId = @request.auth.id`
- View: `@request.auth.id != "" && userId = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != "" && userId = @request.auth.id`
- Delete: `@request.auth.id != "" && userId = @request.auth.id`

---

### 2. validation_sessions

Stores summary of each validation/debugging session.

**Fields:**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| projectId | text | Yes | - |
| userId | text | Yes | - |
| endpoint | text | Yes | - |
| sessionType | select | Yes | Options: generation, debug_attempt |
| attemptNumber | number | Yes | Default: 1 |
| totalFiles | number | Yes | Default: 1 |
| totalErrors | number | Yes | Default: 0 |
| totalWarnings | number | Yes | Default: 0 |
| totalFixed | number | Yes | Default: 0 |
| wasSuccessful | bool | Yes | Default: false |
| aiModel | text | No | - |
| aiProvider | text | No | - |
| errorSummary | json | Yes | Default: {} |

**Indexes:**
- `projectId` (for fast project lookups)
- `userId` (for user-specific queries)
- `wasSuccessful` (for filtering by success)
- `created` (for time-based queries)

**API Rules:**
- List: `@request.auth.id != "" && userId = @request.auth.id`
- View: `@request.auth.id != "" && userId = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != "" && userId = @request.auth.id`
- Delete: `@request.auth.id != "" && userId = @request.auth.id`

---

## Manual Setup Instructions

### Using PocketBase Admin UI

1. **Start PocketBase:**
   ```bash
   ./pocketbase serve
   ```

2. **Access Admin Panel:**
   - Open http://127.0.0.1:8090/_/
   - Login with admin credentials

3. **Create validation_errors Collection:**
   - Click "Collections" → "New Collection"
   - Name: `validation_errors`
   - Type: Base
   - Add all fields from the table above
   - Set API rules as specified
   - Save

4. **Create validation_sessions Collection:**
   - Click "Collections" → "New Collection"
   - Name: `validation_sessions`
   - Type: Base
   - Add all fields from the table above
   - Set API rules as specified
   - Save

---

## Automated Setup Script

You can also use the automated setup script:

```bash
npm run setup:validation-db
```

This will create both collections automatically via the PocketBase API.

---

## Usage Examples

### Querying Errors

```javascript
// Get all errors for a project
const errors = await pb.collection('validation_errors').getFullList({
  filter: `projectId = "${projectId}"`,
  sort: '-created',
});

// Get only critical errors
const criticalErrors = await pb.collection('validation_errors').getFullList({
  filter: `projectId = "${projectId}" && severity = "error"`,
  sort: '-created',
});

// Get errors by type
const structureErrors = await pb.collection('validation_errors').getFullList({
  filter: `errorType = "structure"`,
  sort: '-created',
});
```

### Querying Sessions

```javascript
// Get all sessions for a project
const sessions = await pb.collection('validation_sessions').getFullList({
  filter: `projectId = "${projectId}"`,
  sort: '-created',
});

// Get only successful sessions
const successfulSessions = await pb.collection('validation_sessions').getFullList({
  filter: `wasSuccessful = true`,
  sort: '-created',
});
```

---

## Dashboard Access

After setup, access the validation dashboard at:

```
http://localhost:3000/admin/validation
```

The dashboard provides:
- Overview statistics
- Recent errors list
- Debug session history
- Analytics and trends
- Error type breakdown
