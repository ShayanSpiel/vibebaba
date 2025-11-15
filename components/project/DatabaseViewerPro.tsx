'use client';

import { useEffect, useState } from 'react';
import { ensureAuth, pb } from '@/lib/database/pocketbase';

interface DatabaseViewerProProps {
  backendConfig: any;
  projectId: string;
}

export default function DatabaseViewerPro({ backendConfig, projectId }: DatabaseViewerProProps) {
  // Resolve actual PocketBase project ID (might differ from URL projectId)
  const [actualProjectId, setActualProjectId] = useState<string>(projectId);

  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [newRowData, setNewRowData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // NEW: Bulk selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Resolve PocketBase project ID from localStorage mapping
  useEffect(() => {
    const pbProjectId = localStorage.getItem(`pb_project_map_${projectId}`);
    if (pbProjectId) {
      console.log(
        `[DatabaseViewer] 🔗 Resolved PocketBase ID: ${pbProjectId} (from URL ID: ${projectId})`
      );
      setActualProjectId(pbProjectId);
    } else {
      console.log(`[DatabaseViewer] Using URL project ID directly: ${projectId}`);
      setActualProjectId(projectId);
    }
  }, [projectId]);

  // Set first collection as selected
  useEffect(() => {
    if (backendConfig?.collections?.length > 0 && !selectedCollection) {
      setSelectedCollection(backendConfig.collections[0].name);
    }
  }, [backendConfig, selectedCollection]);

  // Load collection data when selection changes + setup real-time subscription
  useEffect(() => {
    if (selectedCollection) {
      loadCollectionData(selectedCollection);

      // Reset selections when changing collections
      setSelectedRows(new Set());
      setSelectAll(false);

      // Setup real-time subscription
      const unsubscribe = setupRealtimeSubscription(selectedCollection);
      return () => {
        unsubscribe?.();
      };
    }
  }, [selectedCollection, actualProjectId]);

  // Update all record counts
  useEffect(() => {
    if (backendConfig?.collections) {
      updateAllRecordCounts();
    }
  }, [backendConfig, actualProjectId]);

  /**
   * Setup real-time subscription for a collection
   */
  const setupRealtimeSubscription = (collectionName: string) => {
    try {
      // Backend apps create actual PocketBase collections with pattern: actualProjectId_collectionName
      const fullCollectionName = `${actualProjectId}_${collectionName}`;
      console.log(
        `[DatabaseViewer] 🔌 Setting up real-time subscription for: ${fullCollectionName}`
      );
      console.log(`[DatabaseViewer] 🔐 Auth:`, pb.authStore.isValid ? 'Valid' : 'Invalid');

      // Subscribe to changes in the actual backend collection
      pb.collection(fullCollectionName)
        .subscribe('*', (e) => {
          console.log('[DatabaseViewer] 🔄 Real-time update received!');
          console.log('[DatabaseViewer] Event:', {
            action: e.action,
            recordId: e.record.id,
            collection: fullCollectionName,
          });

          // Reload data when any change happens
          console.log('[DatabaseViewer] ✅ Reloading data...');
          loadCollectionData(collectionName);
          updateAllRecordCounts();
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 2000);
        })
        .then(() => {
          console.log(`[DatabaseViewer] ✅ Subscription active for: ${fullCollectionName}`);
        })
        .catch((err: any) => {
          console.error('[DatabaseViewer] ❌ Subscription setup failed:', err);
        });

      return () => {
        console.log(`[DatabaseViewer] 🔌 Unsubscribing from: ${fullCollectionName}`);
        pb.collection(fullCollectionName)
          .unsubscribe('*')
          .catch(() => {});
      };
    } catch (error) {
      console.error('[DatabaseViewer] ❌ Failed to setup real-time subscription:', error);
      return undefined;
    }
  };

  /**
   * Load collection data from PocketBase with localStorage fallback
   */
  const loadCollectionData = async (collectionName: string, showLoading = false) => {
    // Only show loading spinner when explicitly requested or on initial load
    if (showLoading || initialLoad) {
      setLoading(true);
    }
    setSyncStatus('syncing');
    try {
      // Ensure auth is loaded before making request
      ensureAuth();

      // Backend apps create actual PocketBase collections with pattern: actualProjectId_collectionName
      const fullCollectionName = `${actualProjectId}_${collectionName}`;
      console.log(`[DatabaseViewer] 📊 Loading data from collection: ${fullCollectionName}`);

      // Query the actual backend collection
      const records = await pb.collection(fullCollectionName).getFullList({
        sort: '-created',
      });

      console.log(
        `[DatabaseViewer] ✅ Loaded ${records.length} records from ${fullCollectionName}`
      );
      setCollectionData(records);

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error: any) {
      // Check if collection doesn't exist yet (expected before deployment)
      if (error.status === 404 || error.message?.includes('not found')) {
        console.log(
          `[DatabaseViewer] 📭 Collection not found: ${actualProjectId}_${collectionName}`
        );
        console.log(`[DatabaseViewer] 💡 This is normal if the app hasn't been deployed yet`);
        setCollectionData([]);
        // Don't show error for 404 - it's expected before deployment
      } else {
        console.error(`[DatabaseViewer] ❌ Failed to load ${collectionName}:`, error);
        console.error(`[DatabaseViewer] ❌ Unexpected error:`, error);
        setCollectionData([]);
      }

      setSyncStatus('error');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  /**
   * Update all record counts from actual PocketBase collections
   */
  const updateAllRecordCounts = async () => {
    if (!backendConfig?.collections) return;

    const counts: Record<string, number> = {};
    for (const collection of backendConfig.collections) {
      try {
        // Query the actual backend collection
        const fullCollectionName = `${actualProjectId}_${collection.name}`;
        const records = await pb.collection(fullCollectionName).getList(1, 1);
        counts[collection.name] = records.totalItems;
        console.log(`[DatabaseViewer] 📊 ${fullCollectionName}: ${records.totalItems} records`);
      } catch (error: any) {
        // Collection doesn't exist yet (normal for new projects)
        if (error.status === 404 || error.message?.includes('not found')) {
          counts[collection.name] = 0;
        } else {
          console.error(`[DatabaseViewer] ❌ Failed to get count for ${collection.name}:`, error);
          counts[collection.name] = 0;
        }
      }
    }
    setRecordCounts(counts);
  };

  /**
   * Add new row and sync to PocketBase
   */
  const handleAddRow = async () => {
    if (!selectedCollection) return;

    const fieldsToUse = getFieldNames();
    const newRow: any = {};

    fieldsToUse.forEach((field: any) => {
      if (field.name !== 'id') {
        let value = newRowData[field.name] || '';
        if (field.type === 'number') value = value ? Number(value) : 0;
        if (field.type === 'boolean' || field.type === 'bool')
          value = value === 'true' || value === true;
        newRow[field.name] = value;
      }
    });

    try {
      setSyncStatus('syncing');
      ensureAuth();

      // Create record in actual backend collection
      const fullCollectionName = `${actualProjectId}_${selectedCollection}`;
      console.log(`[DatabaseViewer] 📝 Adding record to: ${fullCollectionName}`, newRow);

      const createdRecord = await pb.collection(fullCollectionName).create(newRow);
      console.log(`[DatabaseViewer] ✅ Record created with ID: ${createdRecord.id}`);

      setIsAddingRow(false);
      setNewRowData({});

      // Reload data and update counts
      await loadCollectionData(selectedCollection);
      await updateAllRecordCounts();

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
      console.log('✅ Added new record to', selectedCollection);
    } catch (error: any) {
      console.error('❌ Failed to add record:', error);
      console.error('❌ Error details:', error.message);
      setSyncStatus('error');
    }
  };

  /**
   * Delete row from actual PocketBase collection
   */
  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Delete this record?') || !selectedCollection) return;

    try {
      setSyncStatus('syncing');
      ensureAuth();

      // Delete record from actual backend collection
      const fullCollectionName = `${actualProjectId}_${selectedCollection}`;
      console.log(`[DatabaseViewer] 🗑️ Deleting record ${rowId} from: ${fullCollectionName}`);

      await pb.collection(fullCollectionName).delete(rowId);
      console.log(`[DatabaseViewer] ✅ Record deleted: ${rowId}`);

      // Reload data and update counts
      await loadCollectionData(selectedCollection);
      await updateAllRecordCounts();

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
      console.log('✅ Deleted record from', selectedCollection);
    } catch (error: any) {
      console.error('❌ Failed to delete record:', error);
      console.error('❌ Error details:', error.message);
      setSyncStatus('error');
    }
  };

  /**
   * Bulk delete selected rows from actual PocketBase collection
   */
  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Delete ${selectedRows.size} selected record(s)?`)) return;

    try {
      setSyncStatus('syncing');
      ensureAuth();

      // Delete all selected records from actual backend collection
      const fullCollectionName = `${actualProjectId}_${selectedCollection}`;
      console.log(
        `[DatabaseViewer] 🗑️ Bulk deleting ${selectedRows.size} records from: ${fullCollectionName}`
      );

      const deletePromises = Array.from(selectedRows).map((rowId) =>
        pb.collection(fullCollectionName).delete(rowId)
      );

      await Promise.all(deletePromises);
      console.log(`[DatabaseViewer] ✅ Bulk deleted ${selectedRows.size} records`);

      setSelectedRows(new Set());
      setSelectAll(false);

      // Reload data and update counts
      await loadCollectionData(selectedCollection);
      await updateAllRecordCounts();

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
      console.log('✅ Bulk deleted records from', selectedCollection);
    } catch (error: any) {
      console.error('❌ Failed to bulk delete records:', error);
      console.error('❌ Error details:', error.message);
      setSyncStatus('error');
    }
  };

  /**
   * NEW: Export collection to CSV
   */
  const handleExportCSV = () => {
    if (collectionData.length === 0) return;

    const fields = getFieldNames();
    const headers = fields.map((f: any) => f.name).join(',');
    const rows = collectionData.map((row) => {
      return fields
        .map((f: any) => {
          const value = row[f.name];
          // Escape commas and quotes in CSV
          const escaped = String(value || '').replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Exported CSV:', selectedCollection);
  };

  /**
   * Update row in actual PocketBase collection
   */
  const handleUpdateRow = async (rowId: string, field: string, value: any) => {
    if (!selectedCollection) return;

    try {
      setSyncStatus('syncing');
      ensureAuth();

      // Update record in actual backend collection
      const fullCollectionName = `${actualProjectId}_${selectedCollection}`;
      console.log(`[DatabaseViewer] ✏️ Updating record ${rowId} in: ${fullCollectionName}`, {
        field,
        value,
      });

      await pb.collection(fullCollectionName).update(rowId, {
        [field]: value,
      });
      console.log(`[DatabaseViewer] ✅ Record updated: ${rowId}`);

      // Reload data
      await loadCollectionData(selectedCollection);

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
      console.log('✅ Updated record in', selectedCollection);
    } catch (error: any) {
      console.error('❌ Failed to update record:', error);
      console.error('❌ Error details:', error.message);
      setSyncStatus('error');
    }
  };

  /**
   * NEW: Handle select all toggle
   */
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(filteredData.map((row) => row.id));
      setSelectedRows(allIds);
    }
    setSelectAll(!selectAll);
  };

  /**
   * NEW: Handle individual row selection
   */
  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === filteredData.length && filteredData.length > 0);
  };

  if (!backendConfig?.collections || backendConfig.collections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background-base">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-text-tertiary mx-auto mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
          </svg>
          <p className="text-text-secondary font-medium">No Database</p>
          <p className="text-sm text-text-tertiary mt-1">Generate backend to create schema</p>
        </div>
      </div>
    );
  }

  const currentCollection = backendConfig.collections.find(
    (c: any) => c.name === selectedCollection
  );

  const getFieldNames = () => {
    if (currentCollection?.fields && currentCollection.fields.length > 0) {
      return currentCollection.fields;
    }
    if (collectionData.length > 0) {
      const firstRecord = collectionData[0];
      return Object.keys(firstRecord).map((key) => ({
        name: key,
        type:
          typeof firstRecord[key] === 'number'
            ? 'number'
            : typeof firstRecord[key] === 'boolean'
              ? 'boolean'
              : 'text',
      }));
    }
    return [];
  };

  const fields = getFieldNames();
  const filteredData = searchTerm
    ? collectionData.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : collectionData;

  return (
    <div className="h-full w-full flex bg-background-base overflow-hidden">
      {/* Sidebar - Sticky with independent scrolling */}
      <div className="w-52 bg-background-raised border-r border-light flex flex-col flex-shrink-0 overflow-hidden">
        {/* Sidebar Header - Sticky */}
        <div className="p-4 border-b border-light flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand-br flex items-center justify-center shadow-md">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Collections</h3>
              <p className="text-xs text-text-tertiary">
                {backendConfig.collections.length} tables
              </p>
            </div>
          </div>
        </div>
        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
          {backendConfig.collections.map((collection: any) => (
            <button
              key={collection.name}
              onClick={() => {
                setSelectedCollection(collection.name);
                setSearchTerm('');
                setEditingRow(null);
                setIsAddingRow(false);
                setSelectedRows(new Set());
                setSelectAll(false);
              }}
              className={`w-full px-3 py-2.5 text-left rounded-lg transition-all mb-2 group ${
                selectedCollection === collection.name
                  ? 'bg-gradient-brand-br text-white shadow-md'
                  : 'hover:bg-background-subtle text-text-primary border border-transparent hover:border-light'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ${selectedCollection === collection.name ? 'text-white' : 'text-text-tertiary'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium truncate">{collection.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    selectedCollection === collection.name
                      ? 'bg-white/20 text-white'
                      : 'bg-background-subtle text-text-tertiary group-hover:bg-background-overlay'
                  }`}
                >
                  {recordCounts[collection.name] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Fixed height with overflow control */}
      <div className="flex-1 flex flex-col bg-background-base overflow-hidden">
        {/* Toolbar - Sticky at top */}
        <div className="bg-background-raised border-b border-light px-5 py-4 flex-shrink-0 z-10">
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-shrink overflow-hidden">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span className="truncate">{currentCollection?.name}</span>
                {/* Real-time sync status indicator */}
                {syncStatus === 'syncing' && (
                  <span className="flex items-center gap-1 text-xs font-normal text-info bg-info/10 px-2 py-1 rounded-xl flex-shrink-0">
                    <svg
                      className="w-3 h-3 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Syncing...
                  </span>
                )}
                {syncStatus === 'synced' && (
                  <span className="flex items-center gap-1 text-xs font-normal text-success bg-success/10 px-2 py-1 rounded-xl flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Synced
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs font-normal text-error bg-error/10 px-2 py-1 rounded-xl flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Sync Error
                  </span>
                )}
              </h2>
              <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1.5 transition-all duration-200">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {filteredData.length} records
                  {searchTerm && ` (filtered from ${collectionData.length})`}
                </span>
                {selectedRows.size > 0 && (
                  <span className="flex items-center gap-1 whitespace-nowrap transition-all duration-200">
                    <span className="mx-0.5">•</span>
                    <span className="text-brand-primary font-semibold">
                      {selectedRows.size} selected
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1 whitespace-nowrap transition-all duration-200">
                  <span className="mx-0.5">•</span>
                  <svg
                    className="w-3 h-3 text-success flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-success font-medium">Live</span>
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Manual Refresh Button - Icon only */}
              <button
                onClick={() => loadCollectionData(selectedCollection, true)}
                disabled={loading}
                className="p-2 bg-background-subtle text-text-primary rounded-lg hover:bg-background-overlay transition-all duration-200 border border-light disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh database"
              >
                <svg
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              {selectedRows.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="p-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-all duration-200 border border-error/30 relative"
                  title={`Delete ${selectedRows.size} selected record(s)`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {selectedRows.size > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {selectedRows.size}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleExportCSV}
                disabled={collectionData.length === 0}
                className="px-3 py-2 bg-background-subtle text-text-primary text-sm font-semibold rounded-lg hover:bg-background-overlay transition-all duration-200 flex items-center gap-1.5 border border-light disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                CSV
              </button>
              <div className="relative">
                <svg
                  className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm bg-background-base border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-text-primary placeholder:text-text-tertiary w-44 transition-all duration-200"
                />
              </div>
              <button
                onClick={() => {
                  setIsAddingRow(true);
                  setNewRowData({});
                }}
                className="px-4 py-2 bg-gradient-brand-br text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Record
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Table Container - Takes remaining height */}
        <div className="flex-1 overflow-auto relative min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-light border-t-brand-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-text-tertiary">Loading data...</p>
              </div>
            </div>
          ) : (
            <div>
              <table className="border-collapse" style={{ minWidth: '100%' }}>
                <thead className="bg-background-raised border-b-2 border-light sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-5 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-light text-brand-primary focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
                      />
                    </th>
                    {fields.map((field: any) => (
                      <th
                        key={field.name}
                        className="px-5 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap"
                        style={{ minWidth: '150px', maxWidth: '300px' }}
                      >
                        <div className="flex items-center gap-1">
                          {field.name === 'id' && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                              />
                            </svg>
                          )}
                          {field.name}
                        </div>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap w-32 sticky right-0 bg-background-raised z-10 border-l border-amber-400/30 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.2)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background-base divide-y divide-border-light/50">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-background-subtle/50 transition-colors group"
                    >
                      <td className="px-5 py-3.5 w-12">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => handleRowSelect(row.id)}
                          className="w-4 h-4 rounded border-light text-brand-primary focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
                        />
                      </td>
                      {fields.map((field: any) => (
                        <td
                          key={field.name}
                          className="px-5 py-3.5 text-sm"
                          style={{ minWidth: '150px', maxWidth: '300px' }}
                        >
                          {editingRow === row.id && field.name !== 'id' ? (
                            <input
                              type="text"
                              value={row[field.name] || ''}
                              onChange={(e) => handleUpdateRow(row.id, field.name, e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-background-raised border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-text-primary"
                            />
                          ) : (
                            <div
                              className="truncate overflow-hidden text-ellipsis text-sm"
                              title={String(row[field.name] || '')}
                            >
                              <span
                                className={
                                  field.name === 'id'
                                    ? 'font-mono text-text-tertiary'
                                    : 'text-text-primary'
                                }
                              >
                                {field.type === 'bool' || field.type === 'boolean' ? (
                                  row[field.name] ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-xl text-sm font-semibold bg-success/10 text-success border border-success/30">
                                      True
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2.5 py-1 rounded-xl text-sm font-semibold bg-gray-500/10 text-text-tertiary border border-light">
                                      False
                                    </span>
                                  )
                                ) : (
                                  row[field.name] || (
                                    <span className="text-text-tertiary italic">—</span>
                                  )
                                )}
                              </span>
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-3.5 whitespace-nowrap sticky right-0 bg-background-base group-hover:bg-background-subtle/50 z-10 border-l border-amber-400/30 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center gap-2">
                          {editingRow === row.id ? (
                            <button
                              onClick={() => setEditingRow(null)}
                              className="p-1.5 text-white bg-gradient-success hover:opacity-90 rounded-lg transition-all"
                              title="Done editing"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingRow(row.id)}
                              className="p-1.5 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                              title="Edit record"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Delete record"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {isAddingRow && (
                    <tr className="bg-brand-primary/5 border-t-2 border-brand-primary">
                      <td className="px-5 py-3.5 w-12"></td>
                      {fields.map((field: any) => (
                        <td
                          key={field.name}
                          className="px-5 py-3.5 text-sm"
                          style={{ minWidth: '150px', maxWidth: '300px' }}
                        >
                          {field.name === 'id' ? (
                            <span className="text-text-tertiary italic">Auto-generated</span>
                          ) : (
                            <input
                              type={
                                field.type === 'number'
                                  ? 'number'
                                  : field.type === 'email'
                                    ? 'email'
                                    : 'text'
                              }
                              placeholder={`Enter ${field.name}...`}
                              value={newRowData[field.name] || ''}
                              onChange={(e) =>
                                setNewRowData({ ...newRowData, [field.name]: e.target.value })
                              }
                              className="w-full px-3 py-1.5 text-sm bg-background-raised border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-text-primary placeholder:text-text-tertiary"
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-3.5 whitespace-nowrap sticky right-0 bg-brand-primary/5 z-10 border-l border-amber-400/30 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleAddRow}
                            className="p-1.5 text-white bg-gradient-success hover:opacity-90 rounded-lg transition-all"
                            title="Save new record"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingRow(false);
                              setNewRowData({});
                            }}
                            className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Cancel"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredData.length === 0 && !isAddingRow && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-subtle flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-text-primary mb-1">
                {searchTerm ? 'No matching records found' : 'No records in this collection'}
              </p>
              <p className="text-sm text-text-tertiary">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Click the "New Record" button above to add your first record'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
