# Database Synchronization Architecture Analysis

## Executive Summary

The VB application implements a multi-layered database synchronization system with:
- **Primary Storage**: PocketBase (cloud-backed NoSQL database)
- **Fallback Storage**: Browser localStorage (client-side)
- **Sync Strategy**: Real-time WebSocket subscriptions + manual refresh
- **Database Tab**: Professional UI for viewing and managing database records
- **Forms**: Direct inline editing in database viewer with automatic persistence

---

## 1. Database Tab Implementation

### Location
**File**: `/Users/shayan/Desktop/Projects/VB/components/project/DatabaseViewerPro.tsx`

### Components
The database tab is implemented with a **professional two-column layout**:

1. **Left Sidebar** (Sidebar Navigation)
   - Shows all collections/tables from the backend config
   - Displays record count badges
   - Allows collection selection
   - Gradient highlight for active collection

2. **Main Content Area** (Data Display)
   - Search functionality for filtering records
   - Toolbar with sync status indicators
   - Table view with inline editing
   - Add/Edit/Delete operations

### Data Displayed
```typescript
- Collection Names (from backendConfig.collections)
- Record Count per Collection (tracked in recordCounts state)
- Field Names & Types (text, number, boolean, date, email, etc.)
- Record Values (displayed in table rows)
- Sync Status (idle, syncing, synced, error)
```

### UI Features
- Real-time sync status badges showing:
  - "Syncing..." (blue, animated)
  - "Synced" (green, 2-second duration)
  - "Sync Error" (red)
- Search filter for records
- Record count display
- Loading states

---

## 2. Forms & Input Components for Database Modifications

### Add Record Form
**Location**: DatabaseViewerPro.tsx (lines 667-703)

```typescript
// Inline form row in table
{isAddingRow && (
  <tr className="bg-brand-primary/5 border-t-2 border-brand-primary">
    {fields.map((field) => (
      <td key={field.name}>
        <input
          type={field.type === "number" ? "number" : "email" ? "email" : "text"}
          placeholder={`Enter ${field.name}...`}
          value={newRowData[field.name] || ""}
          onChange={(e) => setNewRowData({ ...newRowData, [field.name]: e.target.value })}
          className="..."
        />
      </td>
    ))}
    <td>
      <button onClick={handleAddRow}>Save</button>
      <button onClick={() => { setIsAddingRow(false); setNewRowData({}); }}>Cancel</button>
    </td>
  </tr>
)}
```

**Handler**: `handleAddRow()` (lines 225-298)
- Generates unique ID: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
- Type conversion for number/boolean fields
- Saves to localStorage
- Syncs to PocketBase

### Edit Record Form
**Location**: DatabaseViewerPro.tsx (lines 614-620)

```typescript
{editingRow === row.id && field.name !== "id" ? (
  <input
    type="text"
    value={row[field.name] || ""}
    onChange={(e) => handleUpdateRow(row.id, field.name, e.target.value)}
    className="..."
  />
) : (
  <span>{/* display value */}</span>
)}
```

**Handler**: `handleUpdateRow()` (lines 355-406)
- Updates record field-by-field
- Saves to localStorage
- Syncs to PocketBase

### Delete Record
**Handler**: `handleDeleteRow()` (lines 303-350)
- Confirmation dialog
- Filters record from array
- Saves to localStorage
- Syncs to PocketBase

---

## 3. Synchronization Mechanism

### Architecture Layers

#### Layer 1: Real-Time Subscriptions (WebSocket)
**Location**: DatabaseViewerPro.tsx (lines 55-95)

```typescript
const setupRealtimeSubscription = (collectionName: string) => {
  pb.collection('project_files').subscribe('*', (e) => {
    if (e.record.projectId === projectId) {
      loadCollectionData(selectedCollection);
      updateAllRecordCounts();
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, {
    filter: `projectId = "${projectId}"`
  });
};
```

**Key Points**:
- Uses PocketBase WebSocket subscriptions
- Filters by projectId to prevent cross-project updates
- Automatically reloads data when changes detected
- Sets sync status for UI feedback
- Returns unsubscribe function for cleanup

#### Layer 2: Data Loading Strategy
**Location**: DatabaseViewerPro.tsx (lines 100-168)

```
1. Try PocketBase First
   └─ Query: project_files collection
   └─ Filter: projectId && path ~ collectionName
   └─ Files: database/{collectionName}.json

2. Fallback to localStorage
   └─ Key: db_{projectId}_{collectionName}

3. Handle Errors
   └─ Final fallback to localStorage
   └─ Set empty array if nothing found
```

#### Layer 3: Data Persistence
**Three-Tier Persistence**:

1. **Immediate localStorage Update**
   - Ensures offline-first capability
   - Immediate UI feedback
   - Fast local access

2. **Background PocketBase Sync**
   - Non-blocking async operation
   - Error logging but non-fatal
   - Automatic retry on next operation

3. **Sync Status Feedback**
   - "syncing" during operation
   - "synced" on success
   - "error" on failure

---

## 4. Synchronization Flow: Real-Time vs Manual

### Real-Time Sync (WebSocket)
**Status**: IMPLEMENTED ✅

**Triggered by**:
- Any changes to project_files collection matching projectId
- Automatic via PocketBase realtime subscriptions

**Flow**:
```
User edits record in DatabaseViewerPro
  ↓
handleAddRow/handleUpdateRow/handleDeleteRow
  ↓
Update localStorage immediately
  ↓
Sync to PocketBase in background
  ↓
PocketBase broadcasts change via WebSocket
  ↓
setupRealtimeSubscription receives event
  ↓
loadCollectionData() reloads from server
  ↓
updateAllRecordCounts() refreshes counts
  ↓
UI updates with new data + sync status
```

### Manual Refresh
**Status**: AVAILABLE but NOT REQUIRED ✅

- User can manually refresh via browser (F5)
- Preview tab has refresh button
- Real-time sync handles most updates automatically
- Manual refresh useful for syncing external changes

### No Polling Used
**Status**: CONFIRMED ❌
- No setInterval-based polling
- No setTimeout-based polling
- Relies entirely on WebSocket subscriptions
- Much more efficient than polling

---

## 5. Backend Database Routes

### API Endpoints
**Location**: `/Users/shayan/Desktop/Projects/VB/app/api/db/`

#### GET /api/db/[projectId]/[collection]
**File**: `route.ts` (lines 11-55)

```typescript
// Returns all records from a collection
GET /api/db/123/users
→ [{ id: "...", name: "...", email: "..." }, ...]
```

**Process**:
1. Load auth from localStorage
2. Query PocketBase: `projectId = "123" && path = "database/users.json"`
3. Parse JSON content
4. Return array

#### POST /api/db/[projectId]/[collection]
**File**: `route.ts` (lines 61-143)

```typescript
// Add new record
POST /api/db/123/users
Body: { name: "John", email: "john@example.com" }
→ { id: "auto-generated", name: "John", ... }
```

**Process**:
1. Generate ID if not provided
2. Load existing data from PocketBase
3. Add new record
4. Save back to PocketBase
5. PocketBase broadcasts change via WebSocket

#### PATCH /api/db/[projectId]/[collection]/[id]
**File**: `[id]/route.ts` (lines 11-72)

```typescript
// Update specific record
PATCH /api/db/123/users/user123
Body: { name: "Jane", email: "jane@example.com" }
→ { id: "user123", name: "Jane", ... }
```

**Process**:
1. Find record by ID
2. Merge updates
3. Save to PocketBase
4. Broadcast change via WebSocket

#### DELETE /api/db/[projectId]/[collection]/[id]
**File**: `[id]/route.ts` (lines 78-136)

```typescript
// Delete record
DELETE /api/db/123/users/user123
→ { success: true }
```

**Process**:
1. Find record by ID
2. Filter it out
3. Save remaining records
4. Broadcast change via WebSocket

---

## 6. State Management Architecture

### Client State Management
**Location**: DatabaseViewerPro.tsx (lines 1-50)

```typescript
const [selectedCollection, setSelectedCollection] = useState<string>("");
const [collectionData, setCollectionData] = useState<any[]>([]);
const [isAddingRow, setIsAddingRow] = useState(false);
const [editingRow, setEditingRow] = useState<string | null>(null);
const [newRowData, setNewRowData] = useState<any>({});
const [searchTerm, setSearchTerm] = useState("");
const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
const [loading, setLoading] = useState(false);
const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
```

### Parent State Management
**Location**: `/Users/shayan/Desktop/Projects/VB/app/project/[id]/page.tsx`

```typescript
// Project data stored in React state
const [project, setProject] = useState<ProjectData | null>(null);

// Updates propagated via:
const updateProject = async (updates: Partial<ProjectData>) => {
  setProject(prev => ({ ...prev, ...updates }));
  updateProjectHelper(projectId, updates); // Async sync
};
```

### PocketBase State Management
**Location**: `/Users/shayan/Desktop/Projects/VB/lib/pocketbase.ts`

```typescript
// Global PocketBase client instance
export const pb = new PocketBase(PB_URL);

// Real-time subscription helper
export function subscribeToCollection<T = any>(
  collection: string,
  callback: (data: { action: string; record: T }) => void,
  filter?: string
) {
  return pb.collection(collection).subscribe('*', callback, filter ? { filter } : undefined);
}
```

### Auth Provider
**Location**: `/Users/shayan/Desktop/Projects/VB/components/auth/PocketBaseAuthProvider.tsx`

```typescript
// Global auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Listens to auth store changes
pb.authStore.onChange((token, model) => {
  setUser(model as User | null);
  // Update cookie for server-side auth
});
```

---

## 7. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DatabaseViewerPro Component                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Actions (Add/Edit/Delete)                                  │
│            ↓                                                      │
│  Handle Functions                                                │
│  ├─ handleAddRow()      → Generate ID + merge data              │
│  ├─ handleUpdateRow()   → Merge field changes                   │
│  └─ handleDeleteRow()   → Filter out record                     │
│            ↓                                                      │
│  saveCollectionData() / Direct Updates                           │
│            ↓                                                      │
│  ┌─────────────────────────────────────────┐                   │
│  │  Step 1: Update localStorage IMMEDIATELY│                   │
│  │  Key: db_{projectId}_{collectionName}   │                   │
│  └─────────────────────────────────────────┘                   │
│            ↓                                                      │
│  ┌─────────────────────────────────────────┐                   │
│  │ Step 2: Sync to PocketBase (async)      │                   │
│  │ - Set syncStatus('syncing')             │                   │
│  │ - Check if file exists in project_files │                   │
│  │ - Update or Create with new content     │                   │
│  │ - Set syncStatus('synced') on success   │                   │
│  └─────────────────────────────────────────┘                   │
│            ↓ (PocketBase broadcasts via WebSocket)              │
│  ┌─────────────────────────────────────────┐                   │
│  │ Step 3: WebSocket Event Received        │                   │
│  │ setupRealtimeSubscription() triggers    │                   │
│  │ (only if projectId matches)             │                   │
│  └─────────────────────────────────────────┘                   │
│            ↓                                                      │
│  ┌─────────────────────────────────────────┐                   │
│  │ Step 4: Reload from Server              │                   │
│  │ loadCollectionData()                    │                   │
│  │ updateAllRecordCounts()                 │                   │
│  │ setCollectionData(newData)              │                   │
│  └─────────────────────────────────────────┘                   │
│            ↓                                                      │
│  ┌─────────────────────────────────────────┐                   │
│  │ Step 5: UI Updates                      │                   │
│  │ Table renders with new data             │                   │
│  │ Record count badges update              │                   │
│  │ Sync status shows "Synced"              │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Database Operations Detailed Breakdown

### Operation: Add Record

**Sequence**:
```
1. User fills form and clicks "Save"
   ├─ State: isAddingRow = true, newRowData populated
   
2. handleAddRow() executes
   ├─ Generate unique ID
   ├─ Build record object
   ├─ Validate data types
   
3. Save to localStorage
   ├─ Get existing: localStorage.getItem(key)
   ├─ Push new record
   ├─ Set: localStorage.setItem(key, JSON.stringify(data))
   
4. Sync to PocketBase (background)
   ├─ Set syncStatus('syncing')
   ├─ Query: getFullList({ filter: projectId && path })
   ├─ If exists: update() with new content
   ├─ If not exists: create() new file
   ├─ Log success: console.log('✅ Created file in PocketBase')
   ├─ Set syncStatus('synced')
   
5. Reload data
   ├─ loadCollectionData() → Reloads from PocketBase
   ├─ updateAllRecordCounts()
   ├─ UI re-renders with new record
   
6. Reset form
   ├─ setIsAddingRow(false)
   ├─ setNewRowData({})
```

### Operation: Update Record

**Sequence**:
```
1. User clicks "Edit" on record
   ├─ setEditingRow(rowId)
   ├─ Field inputs become editable
   
2. User modifies field and input changes
   ├─ handleUpdateRow(rowId, fieldName, value)
   
3. Save to localStorage
   ├─ Get existing: localStorage.getItem(key)
   ├─ Map over data: find row, merge changes
   ├─ Set: localStorage.setItem(key, JSON.stringify(updated))
   
4. Sync to PocketBase (background)
   ├─ Set syncStatus('syncing')
   ├─ Query: getFullList({ filter: projectId && path })
   ├─ Update: update(fileId, { content, size })
   ├─ Set syncStatus('synced')
   
5. Reload data
   ├─ loadCollectionData()
   ├─ UI updates inline
   
6. User clicks "Done"
   ├─ setEditingRow(null)
   ├─ Fields become read-only display
```

### Operation: Delete Record

**Sequence**:
```
1. User clicks "Delete"
   ├─ Confirm dialog: confirm('Delete this record?')
   ├─ Return if not confirmed
   
2. Delete from localStorage
   ├─ Get existing: localStorage.getItem(key)
   ├─ Filter: data.filter(row => row.id !== rowId)
   ├─ Set: localStorage.setItem(key, JSON.stringify(filtered))
   
3. Sync to PocketBase (background)
   ├─ Set syncStatus('syncing')
   ├─ Query: getFullList({ filter: projectId && path })
   ├─ Update: update(fileId, { content, size })
   ├─ Set syncStatus('synced')
   
4. Reload data
   ├─ loadCollectionData()
   ├─ updateAllRecordCounts()
   ├─ UI removes row from table
```

---

## 9. PocketBase Integration

### Connection Details
**File**: `/Users/shayan/Desktop/Projects/VB/lib/pocketbase.ts`

```typescript
// Initialize client
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation
pb.autoCancellation(false);

// Ensure auth before operations
export function ensureAuth() {
  if (pb.authStore.isValid && pb.authStore.model) return;
  
  const authData = localStorage.getItem('pocketbase_auth');
  if (authData) {
    const parsed = JSON.parse(authData);
    pb.authStore.save(parsed.token, parsed.model);
  }
}
```

### Collections Used

#### 1. project_files
**Stores**: Database files (JSON content)

```typescript
interface ProjectFile {
  id: string;
  projectId: string;
  path: string;                    // "database/users.json"
  content: string;                 // JSON array as string
  encoding: 'utf-8' | 'base64';
  size: number;                    // Content length
  created: string;
  updated: string;
}
```

**File Paths**:
- `database/{collectionName}.json` - Stores collection data
- Example: `database/users.json`, `database/products.json`

#### 2. projects
**Stores**: Project metadata

```typescript
interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  stage: 'planning' | 'building' | 'completed' | 'error';
  plan?: string;
  backendConfig?: any;          // Schema definition
  context?: any;
  deployUrl?: string;
  created: string;
  updated: string;
}
```

### Real-Time Subscription
```typescript
pb.collection('project_files').subscribe('*', (e) => {
  // Triggered on CREATE, UPDATE, DELETE
  // Receives: { action: 'create|update|delete', record: ProjectFile }
}, {
  filter: `projectId = "${projectId}"`
});
```

---

## 10. Error Handling & Fallbacks

### Graceful Degradation

```typescript
try {
  ensureAuth();
  // Try PocketBase
  const records = await pb.collection('project_files').getFullList(...);
  const parsed = JSON.parse(collectionFile.content);
  setCollectionData(parsed);
} catch (error) {
  console.error('PocketBase error:', error);
  setSyncStatus('error');
  
  // Fallback to localStorage
  try {
    const key = getStorageKey(collectionName);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      setCollectionData(parsed);
    } else {
      setCollectionData([]);
    }
  } catch {
    setCollectionData([]);
  }
}
```

### Sync Status Handling
- **idle**: Ready for next operation
- **syncing**: Operation in progress
- **synced**: Operation succeeded (auto-clears after 2s)
- **error**: Operation failed (remains until next attempt)

---

## 11. localStorage Key Structure

### Project Storage
```
localStorage Keys:
- project_{projectId}              // Project data JSON
- pb_project_map_{projectId}       // Maps to PocketBase project ID
- db_{projectId}_{collectionName}  // Collection records JSON
- pocketbase_auth                  // Auth token and user model
- pb_auth (cookie)                 // Auth for server-side routes
```

### Example Values
```
project_abc123: {
  "id": "abc123",
  "description": "My App",
  "stage": "building",
  "backendConfig": { "collections": [...] },
  "files": [...],
  "pbId": "pb_id_12345"
}

db_abc123_users: [
  {
    "id": "1699564800000_a1b2c3",
    "name": "John",
    "email": "john@example.com"
  }
]
```

---

## 12. Record Count Updates

### Count Tracking
**Location**: DatabaseViewerPro.tsx (lines 46-50, 173-220)

```typescript
const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

useEffect(() => {
  if (backendConfig?.collections) {
    updateAllRecordCounts();
  }
}, [backendConfig, projectId]);

const updateAllRecordCounts = async () => {
  const counts: Record<string, number> = {};
  
  for (const collection of backendConfig.collections) {
    try {
      // Try PocketBase first
      const records = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path ~ "${collection.name}"`
      });
      
      const collectionFile = records.find(r =>
        r.path === `database/${collection.name}.json`
      );
      
      if (collectionFile && collectionFile.content) {
        const parsed = JSON.parse(collectionFile.content);
        counts[collection.name] = Array.isArray(parsed) ? parsed.length : 0;
      } else {
        // Fallback to localStorage
        // ...
      }
    } catch {
      // Final fallback to localStorage
      // ...
    }
  }
  
  setRecordCounts(counts);
};
```

**Display** (Sidebar badge):
```jsx
<span className="text-xs px-2 py-0.5 rounded-full">
  {recordCounts[collection.name] || 0}
</span>
```

---

## 13. Performance Considerations

### Strengths
✅ **No Polling**: Uses WebSocket subscriptions (efficient)
✅ **Offline First**: localStorage provides instant feedback
✅ **Non-blocking Sync**: PocketBase updates in background
✅ **Automatic Refresh**: WebSocket triggers updates
✅ **Selective Updates**: Filtered by projectId to prevent noise

### Potential Improvements
⚠️ **Large Datasets**: Full data reload on each change
   - Could implement partial updates or delta sync
⚠️ **Concurrent Edits**: Last-write-wins (no conflict resolution)
   - Could add optimistic locking
⚠️ **Subscription Cleanup**: Manual unsubscribe in cleanup
   - Should have central subscription manager
⚠️ **Bundle Size**: Full table reload on filter change
   - Could paginate or virtualize

---

## 14. Security Considerations

### Current Implementation
✅ **Auth Required**: PocketBase enforces auth
✅ **projectId Filter**: Subscriptions and queries filtered by projectId
✅ **Server-Side Validation**: API routes validate projectId
✅ **Auth Middleware**: ensureAuth() before operations

### Potential Risks
⚠️ **localStorage Exposure**: Client-side storage readable by scripts
   - Mitigation: Use secure, HTTPOnly cookies when available
⚠️ **No Encryption**: Data sent plaintext over HTTPS
   - Mitigation: Use TLS/HTTPS (assumed in production)
⚠️ **No Row-Level Access Control**: Anyone with projectId access
   - Mitigation: Implement RLS on PocketBase server

---

## 15. Summary: Key Findings

### Data Flow
1. **User Action** → DatabaseViewerPro component
2. **Immediate Update** → React state + localStorage
3. **Background Sync** → PocketBase API
4. **Broadcast** → WebSocket event
5. **Automatic Reload** → Query PocketBase again
6. **UI Update** → Component re-renders

### Synchronization Type
**Real-time with fallback to manual refresh**
- ✅ WebSocket subscriptions for automatic updates
- ✅ localStorage for offline-first UX
- ✅ Manual refresh available but rarely needed
- ✅ Sync status indicators for transparency

### Forms & Inputs
**In-place inline editing**
- No separate form page
- Direct row editing in table
- Immediate localStorage persistence
- Background PocketBase sync
- Automatic UI update on remote changes

### State Management
**Distributed architecture**
- Component state: DatabaseViewerPro (local UI state)
- App state: Project page (backendConfig, files, stage)
- Global state: PocketBase auth + WebSocket
- Persistent state: localStorage (fallback) + PocketBase (source of truth)

---

## 16. Key Files Reference

| File | Purpose | Key Lines |
|------|---------|-----------|
| DatabaseViewerPro.tsx | Database UI + Sync logic | 1-728 |
| DatabaseViewer.tsx | Legacy database UI (localStorage only) | 1-290 |
| PreviewTabs.tsx | Tab routing (preview/code/database) | 230-250 |
| pocketbase.ts | Client initialization + helpers | 1-312 |
| project-helpers.ts | Project CRUD operations | 75-148 |
| /api/db/[projectId]/[collection]/route.ts | GET/POST endpoints | 1-143 |
| /api/db/[projectId]/[collection]/[id]/route.ts | PATCH/DELETE endpoints | 1-136 |
| PocketBaseAuthProvider.tsx | Auth context + subscription setup | 1-100 |

