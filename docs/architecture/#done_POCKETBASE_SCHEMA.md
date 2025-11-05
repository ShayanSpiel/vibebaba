# PocketBase Complete Schema Design

## Overview
Complete migration to PocketBase as the single source of truth for all data.

---

## Core Collections

### 1. users (Built-in Auth Collection)
**Type:** `auth`
**Purpose:** User authentication and profile

Fields:
- `id` (auto) - Primary key
- `email` (email, required, unique)
- `password` (password, required)
- `name` (text)
- `avatar` (file, single, max 5MB)
- `emailVerified` (bool, default: false)
- `created` (auto)
- `updated` (auto)

**Custom Fields to Add:**
- `totalTokens` (number, default: 0) - Total purchased tokens
- `usedTokens` (number, default: 0) - Tokens consumed
- `dailyTokens` (number, default: 0) - Daily free tokens
- `lastDailyReset` (date) - Last daily reset timestamp
- `packageId` (text) - Current subscription package
- `packageExpiry` (date) - Package expiration date

API Rules:
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: Public (signup)
- Update: `@request.auth.id = id`
- Delete: `@request.auth.id = id`

---

### 2. transactions
**Type:** `base`
**Purpose:** Payment and credit purchase history

Fields:
- `id` (auto)
- `userId` (relation → users, required)
- `type` (select: purchase, subscription, refund)
- `amount` (number, required) - Payment amount
- `tokens` (number, required) - Tokens awarded
- `currency` (text, default: "USD")
- `packageId` (text) - Package identifier
- `paymentProvider` (select: stripe, paypal, zibal)
- `paymentId` (text) - External payment ID
- `status` (select: pending, completed, failed, refunded)
- `created` (auto)
- `updated` (auto)

API Rules:
- List: `userId = @request.auth.id`
- View: `userId = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: Admin only
- Delete: Admin only

Indexes:
- `userId`
- `status`

---

### 3. token_usage
**Type:** `base`
**Purpose:** Track token consumption per API call

Fields:
- `id` (auto)
- `userId` (relation → users, required)
- `tokensUsed` (number, required)
- `endpoint` (text) - API endpoint used
- `projectId` (text) - Related project
- `created` (auto)

API Rules:
- List: `userId = @request.auth.id`
- View: `userId = @request.auth.id`
- Create: Backend only
- Update: None
- Delete: Admin only

Indexes:
- `userId`
- `endpoint`
- `created`

---

### 4. projects
**Type:** `base`
**Purpose:** User-created app projects

Fields:
- `id` (auto)
- `userId` (relation → users, required)
- `name` (text, required)
- `description` (text, required)
- `stage` (select: planning, building, completed, error)
- `plan` (text) - AI-generated plan
- `backendConfig` (json) - Database schema config
- `context` (json) - Additional metadata
- `thumbnail` (file, single, max 2MB) - Project screenshot
- `deployUrl` (url) - Deployed app URL
- `created` (auto)
- `updated` (auto)

API Rules:
- List: `userId = @request.auth.id`
- View: `userId = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `userId = @request.auth.id`
- Delete: `userId = @request.auth.id`

Indexes:
- `userId`
- `stage`
- `created`

---

### 5. project_files
**Type:** `base`
**Purpose:** Store project source files (HTML, CSS, JS, etc.)

Fields:
- `id` (auto)
- `projectId` (relation → projects, required, cascade delete)
- `path` (text, required) - File path (e.g., "index.html", "css/style.css")
- `content` (text, required) - File contents
- `encoding` (select: utf-8, base64, default: utf-8)
- `size` (number) - Content size in bytes
- `created` (auto)
- `updated` (auto)

API Rules:
- List: `projectId.userId = @request.auth.id`
- View: `projectId.userId = @request.auth.id`
- Create: `projectId.userId = @request.auth.id`
- Update: `projectId.userId = @request.auth.id`
- Delete: `projectId.userId = @request.auth.id`

Indexes:
- `projectId`
- `path`

Unique Index:
- `projectId + path` (composite)

---

### 6. project_messages
**Type:** `base`
**Purpose:** Chat history between user and AI

Fields:
- `id` (auto)
- `projectId` (relation → projects, required, cascade delete)
- `role` (select: user, assistant, system)
- `content` (text, required)
- `tokens` (number) - Tokens used for this message
- `created` (auto)

API Rules:
- List: `projectId.userId = @request.auth.id`
- View: `projectId.userId = @request.auth.id`
- Create: `projectId.userId = @request.auth.id`
- Update: None
- Delete: `projectId.userId = @request.auth.id`

Indexes:
- `projectId`
- `created`

---

## Dynamic User-Generated Collections

### Pattern: `proj_{projectId}_{collectionName}`

Example: User creates a "tasks" collection for project "abc123"
Collection name: `proj_abc123_tasks`

**Dynamic Schema Creation:**
```javascript
// AI generates backend config like:
{
  collections: [
    {
      name: "tasks",
      fields: [
        { name: "title", type: "text" },
        { name: "completed", type: "bool" },
        { name: "dueDate", type: "date" }
      ]
    }
  ]
}

// We create: proj_abc123_tasks collection
```

**Auto-generated Fields:**
- `id` (auto)
- `projectId` (text, immutable) - Link back to parent project
- ...user-defined fields...
- `created` (auto)
- `updated` (auto)

**API Rules (Dynamic):**
- All operations: Check user owns the project via custom API

---

## Scalability Features

### 1. Sharding by Project
- Each project's data isolated in separate collections
- Easy to move individual projects to different PocketBase instances
- No table bloat from mixing all users' data

### 2. Horizontal Scaling
```
Load Balancer
    ↓
┌──────────────┬──────────────┬──────────────┐
│ PocketBase 1 │ PocketBase 2 │ PocketBase 3 │
│ Projects A-F │ Projects G-M │ Projects N-Z │
└──────────────┴──────────────┴──────────────┘
```

### 3. File Storage Scaling
- Built-in S3 support (later migration)
- CDN integration ready
- Automatic image optimization

### 4. Caching Strategy
```javascript
// Client-side caching with PocketBase SDK
pb.autoCancellation(false);
pb.collection('projects').getList(1, 50, {
  '$autoCancel': false,
  'cache': 'force-cache'
});
```

### 5. Real-time Subscriptions (Future)
```javascript
// Live updates without polling
pb.collection('proj_abc123_tasks').subscribe('*', (e) => {
  console.log('Task updated:', e.record);
});
```

---

## Migration Strategy

### Phase 1: Setup PocketBase Collections ✓
1. Access admin UI at `http://localhost:8090/_/`
2. Create all base collections
3. Configure API rules
4. Test CRUD operations

### Phase 2: Migrate User Data
1. Export from SQLite auth.db
2. Import to PocketBase users collection
3. Migrate credits data to user fields
4. Migrate transactions
5. Migrate token_usage

### Phase 3: Migrate Projects
1. Read all localStorage `project_*` keys
2. Create project records in PocketBase
3. Create project_files records
4. Create project_messages records

### Phase 4: Update Backend
1. Remove better-auth dependencies
2. Install PocketBase SDK
3. Create PocketBase client wrapper
4. Update all API routes
5. Add authentication middleware

### Phase 5: Update Frontend
1. Install pocketbase SDK
2. Create auth context with PocketBase
3. Update all components to use PocketBase
4. Remove localStorage code
5. Add real-time subscriptions

### Phase 6: Cleanup
1. Remove auth.db file
2. Remove better-auth packages
3. Remove better-sqlite3 packages
4. Update documentation
5. Create backup script

---

## API Performance

### Current (Mixed)
```
localStorage read: ~0.1ms ⚡ (but temporary)
SQLite query: ~1ms ⚡⚡ (but requires server)
PocketBase API: ~5-10ms ⚡⚡⚡ (includes auth check)
```

### After Migration (All PocketBase)
```
PocketBase (localhost): ~5-10ms
PocketBase (production): ~20-50ms (with CDN)
PocketBase (cached): ~0ms (SDK handles caching)
```

### Optimization
- Enable PocketBase caching
- Use batch operations
- Real-time subscriptions (no polling)
- CDN for static files

---

## Storage Limits

### Development (localhost)
- Database: Unlimited (SQLite file grows)
- Files: Limited by disk space
- Collections: 1000+ supported

### Production Recommendations
- PocketBase Cloud: 5GB-100GB tiers
- Self-hosted: Unlimited (your server)
- S3 backend: Petabyte scale

### Per-Project Limits (Enforced)
```javascript
const PROJECT_LIMITS = {
  maxFiles: 100,
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
  maxTotalSize: 50 * 1024 * 1024, // 50MB per project
  maxCollections: 20,
  maxRecordsPerCollection: 10000
};
```

---

## Security

### Authentication
- PocketBase built-in auth (email/password)
- OAuth2 ready (Google, GitHub, etc.)
- JWT tokens with auto-refresh
- Session management

### Authorization
- Collection-level rules (PocketBase filter syntax)
- API rules enforced at database level
- No way to bypass (unlike middleware)

### Data Isolation
- Users can only access their projects
- Dynamic collections scoped by project
- File uploads sanitized and validated

### Rate Limiting (Add later)
```javascript
// Nginx config
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req zone=api burst=20;
```

---

## Backup Strategy

### Automated Daily Backups
```bash
#!/bin/bash
# backup-pocketbase.sh
DATE=$(date +%Y%m%d)
pb backup create --dir=/backups/pb_backup_$DATE
```

### Restore Process
```bash
pb backup restore /backups/pb_backup_20250101
```

### Cloud Sync (Production)
```bash
# Sync to S3
aws s3 sync /backups/ s3://vibebaba-backups/pocketbase/
```

---

## Development vs Production

### Development (Current)
- PocketBase binary (localhost:8090)
- SQLite file: `pb_data/data.db`
- Local file storage: `pb_data/storage/`
- Admin UI: `localhost:8090/_/`

### Production (Future)
- PocketBase on dedicated server/container
- PostgreSQL backend (migration available)
- S3/R2 file storage
- Cloudflare CDN in front
- Multiple replicas for HA

---

## Monitoring

### PocketBase Built-in Logs
- Request logs: `pb_data/logs.db`
- Error tracking
- Performance metrics

### Custom Monitoring (Add)
- Grafana + Prometheus
- Track API latency
- Database size growth
- User activity metrics

---

## Cost Estimation

### Self-Hosted (Recommended)
- VPS (4GB RAM): $12/month
- Backups (S3): $1/month
- CDN (Cloudflare): Free
- **Total: ~$13/month** for unlimited users

### PocketBase Cloud
- Starter (5GB): $19/month
- Pro (25GB): $79/month
- Business (100GB): $299/month

### Comparison
Current (SQLite + localStorage): Free but not scalable
PocketBase: $13-19/month, infinitely scalable

---

## Next Steps

1. ✅ Create this schema document
2. ⏳ Create PocketBase collections via admin UI
3. ⏳ Write migration scripts
4. ⏳ Update backend to use PocketBase SDK
5. ⏳ Update frontend to use PocketBase SDK
6. ⏳ Test complete flow
7. ⏳ Deploy and celebrate! 🎉
