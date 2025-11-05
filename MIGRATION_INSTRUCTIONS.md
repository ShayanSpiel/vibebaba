# Database Migration Instructions

## File Upload Fix - Make projectId Optional

### Issue
The `uploaded_files` collection requires `projectId`, but homepage uploads don't have a project yet.

### Solution
Run the migration to make `projectId` optional in the `uploaded_files` collection.

### Steps to Apply Migration

1. **Stop PocketBase** (if running):
   ```bash
   # Kill any running PocketBase process
   lsof -ti:8090 | xargs kill -9
   ```

2. **Navigate to deployment server**:
   ```bash
   cd deployment-server
   ```

3. **Run PocketBase** (migrations auto-apply on startup):
   ```bash
   ./pocketbase serve
   ```

4. **Verify the migration**:
   - Open PocketBase Admin: http://127.0.0.1:8090/_/
   - Go to Collections → `uploaded_files`
   - Check that `projectId` field shows "NOT required"

5. **Test file upload**:
   - Go to your app homepage
   - Try uploading an image file
   - Should succeed without errors

### Migration Details

**File**: `deployment-server/pb_migrations/1762234300_make_projectId_optional.js`

**Changes**:
- Makes `projectId` field optional (not required)
- Allows uploading files on homepage without a project
- Files can later be associated with projects

### Rollback

If you need to revert:
```bash
cd deployment-server
./pocketbase migrate down
```

This will make `projectId` required again.
