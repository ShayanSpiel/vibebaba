'use client';

import { useEffect, useState } from 'react';

interface DatabaseViewerProps {
  backendConfig: any;
  projectId: string;
}

export default function DatabaseViewer({ backendConfig, projectId }: DatabaseViewerProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [newRowData, setNewRowData] = useState<any>({});

  useEffect(() => {
    if (backendConfig?.collections?.length > 0 && !selectedCollection) {
      setSelectedCollection(backendConfig.collections[0].name);
    }
  }, [backendConfig, selectedCollection]);

  useEffect(() => {
    if (selectedCollection) {
      loadCollectionData(selectedCollection);
    }
  }, [selectedCollection, projectId]);

  const loadCollectionData = (collectionName: string) => {
    const storageKey = `db_${projectId}_${collectionName}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setCollectionData(JSON.parse(stored));
    } else {
      // Generate sample data
      const collection = backendConfig.collections.find((c: any) => c.name === collectionName);
      if (collection) {
        const sampleData = generateSampleData(collection);
        setCollectionData(sampleData);
        localStorage.setItem(storageKey, JSON.stringify(sampleData));
      }
    }
  };

  const generateSampleData = (collection: any) => {
    const samples = [];
    const count = collection.name === 'users' ? 3 : 5;

    for (let i = 0; i < count; i++) {
      const row: any = { id: `${Date.now()}_${i}` };

      collection.fields.forEach((field: any) => {
        if (field.name === 'id') return;

        switch (field.type) {
          case 'text':
          case 'email':
            if (field.name.includes('email')) {
              row[field.name] = `user${i + 1}@example.com`;
            } else if (field.name.includes('name')) {
              row[field.name] = `Sample ${collection.name} ${i + 1}`;
            } else {
              row[field.name] = `Sample text ${i + 1}`;
            }
            break;
          case 'number':
            row[field.name] = (i + 1) * 10;
            break;
          case 'bool':
          case 'boolean':
            row[field.name] = i % 2 === 0;
            break;
          case 'date':
          case 'datetime':
            row[field.name] = new Date().toISOString().split('T')[0];
            break;
          default:
            row[field.name] = `Value ${i + 1}`;
        }
      });

      samples.push(row);
    }

    return samples;
  };

  const saveCollectionData = (collectionName: string, data: any[]) => {
    const storageKey = `db_${projectId}_${collectionName}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    setCollectionData(data);

    // Trigger storage event for app sync
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(data),
      })
    );
  };

  const handleAddRow = () => {
    const collection = backendConfig.collections.find((c: any) => c.name === selectedCollection);
    const newRow: any = { id: `${Date.now()}` };

    collection.fields.forEach((field: any) => {
      if (field.name !== 'id') {
        newRow[field.name] = newRowData[field.name] || '';
      }
    });

    const updated = [...collectionData, newRow];
    saveCollectionData(selectedCollection, updated);
    setIsAddingRow(false);
    setNewRowData({});
  };

  const handleDeleteRow = (rowId: string) => {
    const updated = collectionData.filter((row) => row.id !== rowId);
    saveCollectionData(selectedCollection, updated);
  };

  const handleUpdateRow = (rowId: string, field: string, value: any) => {
    const updated = collectionData.map((row) =>
      row.id === rowId ? { ...row, [field]: value } : row
    );
    saveCollectionData(selectedCollection, updated);
  };

  if (!backendConfig?.collections || backendConfig.collections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No database schema available</p>
          <p className="text-sm text-text-tertiary">Generate backend to create database</p>
        </div>
      </div>
    );
  }

  const currentCollection = backendConfig.collections.find(
    (c: any) => c.name === selectedCollection
  );

  return (
    <div className="h-full flex flex-col">
      {/* Collection Tabs */}
      <div className="flex border-b border-light bg-background-base overflow-x-auto">
        {backendConfig.collections.map((collection: any) => (
          <button
            key={collection.name}
            onClick={() => setSelectedCollection(collection.name)}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              selectedCollection === collection.name
                ? 'bg-background-raised text-text-primary border-b border-brand-primary -mb-px'
                : 'text-text-secondary hover:bg-background-subtle'
            }`}
          >
            {collection.name}
          </button>
        ))}
      </div>

      {/* Table View */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {currentCollection?.name} ({collectionData.length} records)
          </h3>
          <button
            onClick={() => setIsAddingRow(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-lg hover:bg-gradient-to-r from-amber-500 to-yellow-700 font-semibold transition-colors"
          >
            + Add Record
          </button>
        </div>

        {/* Table */}
        <div className="border border-light rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-raised border-b border-light">
              <tr>
                {currentCollection?.fields.map((field: any) => (
                  <th key={field.name} className="px-4 py-3 text-left font-bold text-sm">
                    {field.name}
                    {field.required && <span className="text-red-600 ml-1">*</span>}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-bold text-sm w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collectionData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-default ${idx % 2 === 0 ? 'bg-background-raised' : 'bg-background-overlay'}`}
                >
                  {currentCollection?.fields.map((field: any) => (
                    <td key={field.name} className="px-4 py-3">
                      {editingRow === row.id ? (
                        <input
                          type="text"
                          value={row[field.name] || ''}
                          onChange={(e) => handleUpdateRow(row.id, field.name, e.target.value)}
                          className="w-full px-2 py-1 bg-background-sunken border border-default rounded text-text-primary"
                        />
                      ) : (
                        <span className="text-sm">
                          {field.type === 'bool' || field.type === 'boolean'
                            ? row[field.name]
                              ? 'True'
                              : 'False'
                            : row[field.name] || <span className="text-text-tertiary">—</span>}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingRow === row.id ? (
                        <button
                          onClick={() => setEditingRow(null)}
                          className="text-green-600 hover:text-green-800 text-sm font-semibold"
                        >
                          Done
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingRow(row.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Add Row Form */}
              {isAddingRow && (
                <tr className="bg-background-overlay border border-brand-primary">
                  {currentCollection?.fields.map((field: any) => (
                    <td key={field.name} className="px-4 py-3">
                      {field.name === 'id' ? (
                        <span className="text-sm text-text-tertiary">Auto-generated</span>
                      ) : (
                        <input
                          type={
                            field.type === 'number'
                              ? 'number'
                              : field.type === 'email'
                                ? 'email'
                                : 'text'
                          }
                          placeholder={field.name}
                          value={newRowData[field.name] || ''}
                          onChange={(e) =>
                            setNewRowData({ ...newRowData, [field.name]: e.target.value })
                          }
                          className="w-full px-2 py-1 bg-background-sunken border border-default rounded text-text-primary"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddRow}
                        className="text-green-600 hover:text-green-800 text-sm font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingRow(false);
                          setNewRowData({});
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {collectionData.length === 0 && !isAddingRow && (
          <div className="text-center py-12 text-text-secondary">
            No records yet. Click "Add Record" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
