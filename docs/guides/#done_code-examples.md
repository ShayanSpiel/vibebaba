# Database Sync Architecture - Code Examples

## 1. Adding a Record

### Frontend (DatabaseViewerPro.tsx)

```typescript
// Step 1: User clicks "New Record" button
onClick={() => {
  setIsAddingRow(true);
  setNewRowData({});
}}

// Step 2: User fills form and clicks "Save"
const handleAddRow = async () => {
  if (!selectedCollection) return;

  const fieldsToUse = getFieldNames();
  const newRow: any = { 
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
  };

  // Type conversion
  fieldsToUse.forEach((field: any) => {
    if (field.name !== "id") {
      let value = newRowData[field.name] || "";
      if (field.type === "number") value = value ? Number(value) : 0;
      if (field.type === "boolean" || field.type === "bool") 
        value = value === "true" || value === true;
      newRow[field.name] = value;
    }
  });

  try {
    setSyncStatus('syncing');

    // Step 3: Save to localStorage immediately
    const key = getStorageKey(selectedCollection);
    const existing = localStorage.getItem(key);
    const data = existing ? JSON.parse(existing) : [];
    data.push(newRow);
    localStorage.setItem(key, JSON.stringify(data));

    // Step 4: Sync to PocketBase (background)
    try {
      ensureAuth();
      const filePath = `database/${selectedCollection}.json`;
      const existingFiles = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`
      });

      if (existingFiles.length > 0) {
        await pb.collection('project_files').update(existingFiles[0].id, {
          content: JSON.stringify(data),
          size: JSON.stringify(data).length
        });
      } else {
        await pb.collection('project_files').create({
          projectId,
          path: filePath,
          content: JSON.stringify(data),
          encoding: 'utf-8',
          size: JSON.stringify(data).length
        });
      }

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (pbError) {
      console.error('Failed to sync to PocketBase:', pbError);
      setSyncStatus('error');
    }

    // Step 5: Reload data and update UI
    setIsAddingRow(false);
    setNewRowData({});
    loadCollectionData(selectedCollection);
    updateAllRecordCounts();

  } catch (error) {
    console.error('Failed to add record:', error);
    setSyncStatus('error');
  }
};

// Step 6: UI renders form row
{isAddingRow && (
  <tr className="bg-brand-primary/5 border-t-2 border-brand-primary">
    {fields.map((field: any) => (
      <td key={field.name} className="px-5 py-3.5">
        {field.name === "id" ? (
          <span className="text-xs text-text-tertiary italic">Auto-generated</span>
        ) : (
          <input
            type={field.type === "number" ? "number" : "text"}
            placeholder={`Enter ${field.name}...`}
            value={newRowData[field.name] || ""}
            onChange={(e) => setNewRowData({ 
              ...newRowData, 
              [field.name]: e.target.value 
            })}
            className="w-full px-3 py-1.5 text-sm bg-background-raised border border-border-light rounded-lg"
          />
        )}
      </td>
    ))}
    <td className="px-5 py-3.5">
      <button onClick={handleAddRow} className="...">Save</button>
      <button onClick={() => { setIsAddingRow(false); setNewRowData({}); }}>Cancel</button>
    </td>
  </tr>
)}
```

### Backend (API Route - POST)

```typescript
// app/api/db/[projectId]/[collection]/route.ts

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string }> }
) {
  const params = await context.params;
  const { projectId, collection } = params;
  const record = await req.json();

  console.log(`[DB API] Adding record to ${projectId}/${collection}`, record);

  try {
    ensureAuth();

    // Generate ID if not provided
    if (!record.id) {
      record.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const filePath = `database/${collection}.json`;

    // Get existing data
    let data: any[] = [];
    try {
      const files = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`
      });

      if (files.length > 0) {
        data = JSON.parse(files[0].content);
      }
    } catch (e) {
      console.log('No existing data, creating new');
    }

    // Add record
    data.push(record);

    // Save to PocketBase
    const files = await pb.collection('project_files').getFullList({
      filter: `projectId = "${projectId}" && path = "${filePath}"`
    });

    const content = JSON.stringify(data);

    if (files.length > 0) {
      const updated = await pb.collection('project_files').update(files[0].id, {
        content: content,
        size: content.length
      });
      console.log(`Updated ${collection} - PocketBase will broadcast via WebSocket`);
    } else {
      const created = await pb.collection('project_files').create({
        projectId: projectId,
        path: filePath,
        content: content,
        encoding: 'utf-8',
        size: content.length
      });
      console.log(`Created ${collection} - PocketBase will broadcast via WebSocket`);
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 2. Updating a Record

### Frontend (DatabaseViewerPro.tsx)

```typescript
// User clicks Edit on row
<button onClick={() => setEditingRow(row.id)} className="...">
  Edit
</button>

// Field becomes editable
{editingRow === row.id && field.name !== "id" ? (
  <input
    type="text"
    value={row[field.name] || ""}
    onChange={(e) => handleUpdateRow(row.id, field.name, e.target.value)}
    className="w-full px-3 py-1.5 text-sm bg-background-raised border border-border-light rounded-lg"
  />
) : (
  <span>{row[field.name] || "—"}</span>
)}

// Handle update
const handleUpdateRow = async (rowId: string, field: string, value: any) => {
  if (!selectedCollection) return;

  try {
    setSyncStatus('syncing');

    const key = getStorageKey(selectedCollection);
    const existing = localStorage.getItem(key);
    
    if (existing) {
      const data = JSON.parse(existing);
      const updated = data.map((row: any) => {
        if (row.id === rowId) {
          return { ...row, [field]: value };
        }
        return row;
      });

      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(updated));

      // Sync to PocketBase
      try {
        ensureAuth();

        const filePath = `database/${selectedCollection}.json`;
        const existingFiles = await pb.collection('project_files').getFullList({
          filter: `projectId = "${projectId}" && path = "${filePath}"`
        });

        if (existingFiles.length > 0) {
          await pb.collection('project_files').update(existingFiles[0].id, {
            content: JSON.stringify(updated),
            size: JSON.stringify(updated).length
          });
          console.log('✅ Synced update to PocketBase');
        }

        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (pbError) {
        console.error('Failed to sync update:', pbError);
        setSyncStatus('error');
      }

      loadCollectionData(selectedCollection);
    }
  } catch (error) {
    console.error('Failed to update record:', error);
    setSyncStatus('error');
  }
};

// User clicks Done to finish editing
{editingRow === row.id ? (
  <button onClick={() => setEditingRow(null)} className="...">
    Done
  </button>
) : (
  <button onClick={() => setEditingRow(row.id)} className="...">
    Edit
  </button>
)}
```

### Backend (API Route - PATCH)

```typescript
// app/api/db/[projectId]/[collection]/[id]/route.ts

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string; id: string }> }
) {
  const params = await context.params;
  const { projectId, collection, id } = params;
  const updates = await req.json();

  console.log(`[DB API] Updating ${projectId}/${collection}/${id}`, updates);

  try {
    ensureAuth();

    const filePath = `database/${collection}.json`;

    // Get existing data
    const files = await pb.collection('project_files').getFullList({
      filter: `projectId = "${projectId}" && path = "${filePath}"`
    });

    if (files.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    let data = JSON.parse(files[0].content);

    // Find and update record
    const index = data.findIndex((r: any) => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    data[index] = { ...data[index], ...updates };
    const updatedRecord = data[index];

    // Save to PocketBase
    const content = JSON.stringify(data);
    await pb.collection('project_files').update(files[0].id, {
      content: content,
      size: content.length
    });

    console.log(`✅ Updated record ${id} - Broadcasting via WebSocket`);
    return NextResponse.json(updatedRecord);

  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 3. Deleting a Record

### Frontend (DatabaseViewerPro.tsx)

```typescript
// User clicks Delete
<button onClick={() => handleDeleteRow(row.id)} className="...">
  Delete
</button>

// Delete handler
const handleDeleteRow = async (rowId: string) => {
  // Confirm first
  if (!confirm('Delete this record?') || !selectedCollection) return;

  try {
    setSyncStatus('syncing');

    const key = getStorageKey(selectedCollection);
    const existing = localStorage.getItem(key);
    
    if (existing) {
      const data = JSON.parse(existing);
      const filtered = data.filter((row: any) => row.id !== rowId);

      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(filtered));

      // Sync to PocketBase
      try {
        ensureAuth();

        const filePath = `database/${selectedCollection}.json`;
        const existingFiles = await pb.collection('project_files').getFullList({
          filter: `projectId = "${projectId}" && path = "${filePath}"`
        });

        if (existingFiles.length > 0) {
          await pb.collection('project_files').update(existingFiles[0].id, {
            content: JSON.stringify(filtered),
            size: JSON.stringify(filtered).length
          });
          console.log('✅ Synced deletion to PocketBase');
        }

        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (pbError) {
        console.error('Failed to sync deletion:', pbError);
        setSyncStatus('error');
      }

      // Reload data
      loadCollectionData(selectedCollection);
      updateAllRecordCounts();
    }
  } catch (error) {
    console.error('Failed to delete record:', error);
    setSyncStatus('error');
  }
};
```

### Backend (API Route - DELETE)

```typescript
// app/api/db/[projectId]/[collection]/[id]/route.ts

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string; id: string }> }
) {
  const params = await context.params;
  const { projectId, collection, id } = params;

  console.log(`[DB API] Deleting ${projectId}/${collection}/${id}`);

  try {
    ensureAuth();

    const filePath = `database/${collection}.json`;

    // Get existing data
    const files = await pb.collection('project_files').getFullList({
      filter: `projectId = "${projectId}" && path = "${filePath}"`
    });

    if (files.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    let data = JSON.parse(files[0].content);

    // Filter out record
    const originalLength = data.length;
    data = data.filter((r: any) => r.id !== id);

    if (data.length === originalLength) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Save to PocketBase
    const content = JSON.stringify(data);
    await pb.collection('project_files').update(files[0].id, {
      content: content,
      size: content.length
    });

    console.log(`✅ Deleted record ${id} - Broadcasting via WebSocket`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 4. Real-Time Subscription Setup

### WebSocket Subscription (DatabaseViewerPro.tsx)

```typescript
// Setup real-time subscription for a collection
const setupRealtimeSubscription = (collectionName: string) => {
  try {
    console.log(`Setting up real-time subscription for project: ${projectId}`);

    // Subscribe to all changes in project_files collection
    pb.collection('project_files').subscribe('*', (e) => {
      console.log('Real-time update received!', {
        action: e.action,
        recordId: e.record.id,
        recordProjectId: e.record.projectId,
        recordPath: e.record.path,
        ourProjectId: projectId,
        match: e.record.projectId === projectId
      });

      // Only reload if this is for our project
      if (e.record.projectId === projectId) {
        console.log('Project ID matches! Reloading data...');
        
        // Auto-reload from server
        loadCollectionData(selectedCollection);
        updateAllRecordCounts();
        
        // Show sync status
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        console.log('Project ID does not match, ignoring update');
      }
    }, {
      // Only listen to changes for this project
      filter: `projectId = "${projectId}"`
    });

    console.log(`Subscription active for project: ${projectId}`);

    // Return cleanup function
    return () => {
      console.log(`Unsubscribing from project: ${projectId}`);
      pb.collection('project_files').unsubscribe('*');
    };

  } catch (error) {
    console.error('Failed to setup real-time subscription:', error);
    return undefined;
  }
};

// Setup subscription when collection selected
useEffect(() => {
  if (selectedCollection) {
    loadCollectionData(selectedCollection);

    // Setup real-time subscription
    const unsubscribe = setupRealtimeSubscription(selectedCollection);
    
    // Cleanup on unmount
    return () => {
      unsubscribe?.();
    };
  }
}, [selectedCollection, projectId]);
```

---

## 5. Data Loading (with fallbacks)

### Loading Collection Data

```typescript
const loadCollectionData = async (collectionName: string) => {
  setLoading(true);
  setSyncStatus('syncing');
  
  try {
    // Ensure auth is ready
    ensureAuth();

    // Try to load from PocketBase first
    const records = await pb.collection('project_files').getFullList({
      filter: `projectId = "${projectId}" && path ~ "${collectionName}"`,
      sort: '-created'
    });

    // Find the file for this collection
    const collectionFile = records.find(r =>
      r.path === `database/${collectionName}.json` ||
      r.path === `db/${collectionName}.json`
    );

    if (collectionFile && collectionFile.content) {
      const parsed = JSON.parse(collectionFile.content);
      console.log(`Loaded ${parsed.length} records for ${collectionName} from PocketBase`);
      
      setCollectionData(Array.isArray(parsed) ? parsed : []);

      // Sync to localStorage as backup
      const key = getStorageKey(collectionName);
      localStorage.setItem(key, collectionFile.content);

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
      return;
    }

    // Fallback: Try localStorage
    console.log(`No PocketBase data found for ${collectionName}, trying localStorage`);
    const key = getStorageKey(collectionName);
    const data = localStorage.getItem(key);

    if (data) {
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.length} records from localStorage`);
      setCollectionData(Array.isArray(parsed) ? parsed : []);
    } else {
      console.log(`No data found for ${collectionName}`);
      setCollectionData([]);
    }

    setSyncStatus('idle');

  } catch (error) {
    console.error(`Failed to load ${collectionName}:`, error);
    setSyncStatus('error');

    // Final fallback to localStorage
    try {
      const key = getStorageKey(collectionName);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        setCollectionData(Array.isArray(parsed) ? parsed : []);
      } else {
        setCollectionData([]);
      }
    } catch {
      setCollectionData([]);
    }

  } finally {
    setLoading(false);
  }
};
```

---

## 6. Record Count Updates

```typescript
const updateAllRecordCounts = async () => {
  if (!backendConfig?.collections) return;

  const counts: Record<string, number> = {};

  for (const collection of backendConfig.collections) {
    try {
      // Try PocketBase first
      const records = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path ~ "${collection.name}"`
      });

      const collectionFile = records.find(r =>
        r.path === `database/${collection.name}.json` ||
        r.path === `db/${collection.name}.json`
      );

      if (collectionFile && collectionFile.content) {
        const parsed = JSON.parse(collectionFile.content);
        counts[collection.name] = Array.isArray(parsed) ? parsed.length : 0;
      } else {
        // Fallback to localStorage
        const key = getStorageKey(collection.name);
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          counts[collection.name] = Array.isArray(parsed) ? parsed.length : 0;
        } else {
          counts[collection.name] = 0;
        }
      }
    } catch {
      // Final fallback
      try {
        const key = getStorageKey(collection.name);
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          counts[collection.name] = Array.isArray(parsed) ? parsed.length : 0;
        } else {
          counts[collection.name] = 0;
        }
      } catch {
        counts[collection.name] = 0;
      }
    }
  }

  setRecordCounts(counts);
};
```

---

## Summary

- **Immediate UI Update**: localStorage update happens first
- **Background Sync**: PocketBase update happens asynchronously
- **WebSocket Broadcast**: PocketBase notifies all connected clients
- **Automatic Reload**: Subscription handler reloads data
- **Graceful Fallback**: Works offline with localStorage
- **No Polling**: Uses WebSocket for efficiency

All operations follow the same pattern:
1. Update React state
2. Update localStorage
3. Sync to PocketBase
4. Wait for WebSocket event
5. Reload and refresh UI
