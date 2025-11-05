# Fix 40: Preview Not Showing After Project Completion (2025-10-31)

## Issue Addressed

### User Report:
> "Deployment loading still not showing / not triggered."

### Root Cause

After **Fix 38** changed `stage: "ready"` to `stage: "completed"` to match the database schema, the PreviewTabs component still had a hardcoded check for the old `"ready"` stage value.

**Result**: When projects completed, they would be marked as `stage: "completed"`, but the preview wouldn't show because the UI was checking for `stage === "ready"`.

---

## Technical Details

### The Problem

**Database Schema** ([lib/pocketbase.ts:103](../lib/pocketbase.ts#L103)):
```typescript
stage: 'planning' | 'building' | 'completed' | 'error';
```

**Fix 38 Changed** ([app/project/[id]/page.tsx:310](../app/project/[id]/page.tsx#L310)):
```typescript
// After workflow completes
stage: "completed"  // ✅ Matches schema
```

**But PreviewTabs Was Still Checking** ([components/project/PreviewTabs.tsx:144](../components/project/PreviewTabs.tsx#L144)):
```typescript
// ❌ BEFORE Fix 40:
{(project.stage === "building" || project.stage === "ready") && (
  <BrowserPreview ... />
)}
```

**Impact**:
1. Project completes with `stage: "completed"`
2. PreviewTabs checks `project.stage === "building" || project.stage === "ready"`
3. Neither condition matches ❌
4. BrowserPreview never renders
5. Deployment loading never shows
6. User sees blank screen or stale content

---

## Solution

Updated the stage check to include `"completed"` instead of `"ready"`.

### File Changed: [components/project/PreviewTabs.tsx](../components/project/PreviewTabs.tsx)

**Before (Line 144)**:
```typescript
{(project.stage === "building" || project.stage === "ready") && (
```

**After (Lines 144-145)**:
```typescript
{/* ✅ FIX 40: Include "completed" stage (was "ready" before Fix 38) */}
{(project.stage === "building" || project.stage === "completed") && (
```

---

## Expected Behavior

### Before Fix 40:
```
1. Project workflow completes
2. Stage set to "completed" (Fix 38)
3. PreviewTabs checks: stage === "building" || stage === "ready"
4. Both false ❌
5. BrowserPreview never renders
6. Deployment never triggers
7. User sees nothing
```

### After Fix 40:
```
1. Project workflow completes
2. Stage set to "completed" (Fix 38)
3. PreviewTabs checks: stage === "building" || stage === "completed"
4. Second condition true ✅
5. BrowserPreview renders
6. Auto-deploy useEffect fires (line 74-81)
7. deployment.deploy() called
8. Status changes to 'deploying'
9. Loading indicator shows ✅
10. Deployment completes
11. Preview shows deployed app ✅
```

---

## Stage Flow Reference

**Complete Stage Lifecycle**:

1. **`planning`**: Initial state, PM node working
2. **`building`**: Files being generated (UX/Frontend/Backend nodes)
3. **`completed`**: All generation done, files ready ✅
4. **`error`**: Something failed

**UI Behavior by Stage**:

- **`planning`**: Shows PlanPreview with loading animation
- **`building`**: Shows BrowserPreview OR building message (if loadingMessage set)
- **`completed`**: Shows BrowserPreview with deployment + preview ✅
- **`error`**: Shows error state

---

## Related Code

### Auto-Deploy Logic

When `project.stage === "completed"` and BrowserPreview renders, this useEffect triggers:

**File**: [components/project/PreviewTabs.tsx:74-81](../components/project/PreviewTabs.tsx#L74-81)
```typescript
// Auto-deploy when files are generated
useEffect(() => {
  if (project.files && project.files.length > 0 && deployment.status === 'idle') {
    console.log('🚀 Auto-deploying project:', project.id, 'with', project.files.length, 'files');
    deployment.deploy(project.files, project.backendConfig).catch((err) => {
      console.warn('⚠️  Auto-deploy failed, but files are still available locally:', err);
    });
  }
}, [project.files, deployment.status, deployment.deploy, project.id, project.backendConfig]);
```

### Deployment Status Propagation

**File**: [components/project/PreviewTabs.tsx:26-32](../components/project/PreviewTabs.tsx#L26-32)
```typescript
// Notify parent of deployment status changes
useEffect(() => {
  console.log('[PreviewTabs] Deployment status changed:', deployment.status);
  if (onDeploymentStatusChange) {
    console.log('[PreviewTabs] Calling onDeploymentStatusChange with status:', deployment.status);
    onDeploymentStatusChange(deployment.status, deployment.error);
  }
}, [deployment.status, deployment.error, onDeploymentStatusChange]);
```

### BrowserPreview Loading State

**File**: [components/project/BrowserPreview.tsx:29-35](../components/project/BrowserPreview.tsx#L29-35)
```typescript
// Generate dynamic loading message when deployment starts
useEffect(() => {
  if (isDeploying) {
    const timeBasedMsg = getTimeBasedMessage();
    const contextualMsg = getContextualLoadingMessage('deploying');
    const finalMsg = timeBasedMsg || getMaybeRareMessage(contextualMsg);
    setLoadingMessage(finalMsg);
  }
}, [isDeploying]);
```

---

## Testing

### Test 1: Verify Preview Shows After Completion
```
1. Create a new project
2. Wait for workflow to complete
3. Project should update to stage: "completed"
4. Browser console should show:
   - "🚀 Auto-deploying project: [id] with [N] files"
   - "[useDeployment] 🚀 Setting status to 'deploying'..."
   - "[PreviewTabs] Deployment status changed: deploying"
5. Preview should show loading indicator
6. After deployment: Preview shows the app
```

### Test 2: Verify Building Stage Still Works
```
1. Create a new project
2. During building stage (before completion)
3. If loadingMessage is set: Shows building animation
4. If loadingMessage not set: Shows BrowserPreview (early)
5. Should work correctly in both cases
```

### Test 3: Verify Planning Stage Not Affected
```
1. Create a new project
2. During planning stage
3. Should show PlanPreview
4. Should NOT show BrowserPreview
```

---

## Console Logs to Verify

After this fix, when a project completes, you should see in **browser console**:

```
💾 Updating project: { projectId: '...', stage: 'completed', ... }
🚀 Auto-deploying project: mhdweihw31sceoq83h with 11 files
[useDeployment] 🚀 Setting status to 'deploying' for project mhdweihw31sceoq83h with 11 files...
[useDeployment] ✅ State updated to 'deploying'
[PreviewTabs] Deployment status changed: deploying
[PreviewTabs] Calling onDeploymentStatusChange with status: deploying
```

If you see these logs but still no loading indicator, the issue is in the parent component's state management.

---

## Files Changed

### Modified:
1. **[components/project/PreviewTabs.tsx](../components/project/PreviewTabs.tsx)**
   - Line 144-145: Changed stage check from `"ready"` to `"completed"`

### Documentation:
2. **[docs/FIX_40_PREVIEW_STAGE_CHECK.md](../docs/FIX_40_PREVIEW_STAGE_CHECK.md)** ← This file

---

## Summary

**Fixed:**
- ✅ Preview now shows after project completion
- ✅ Stage check updated to match Fix 38 changes (`"ready"` → `"completed"`)
- ✅ Auto-deploy now triggers correctly
- ✅ Deployment loading indicator should now appear

**Root Cause:**
PreviewTabs was checking for obsolete `"ready"` stage that was replaced with `"completed"` in Fix 38.

**Solution:**
Updated stage condition: `stage === "building" || stage === "ready"` → `stage === "building" || stage === "completed"`

**User Impact:**
- Preview will now show after project generation completes
- Deployment loading indicator will display during deployment
- Users will see their app in the preview once deployed

**Status**: ✅ Completed
**Breaking Changes**: None
**Applied**: 2025-10-31
**Related Fixes**:
- Fix 38 (changed database stage from "ready" to "completed")
- Fix 39 (added deployment status logging)
