/**
 * Database Injection System
 *
 * Creates a real window.db API implementation that connects to PocketBase
 * and provides real-time synchronization for generated apps.
 */

export interface DatabaseCollection {
  name: string;
  fields: Array<{ name: string; type: string }>;
}

/**
 * Generate the database injection script that will be inserted into generated HTML
 *
 * This script provides:
 * - window.db.get() - Fetch all records from a collection
 * - window.db.add() - Add a new record
 * - window.db.update() - Update an existing record
 * - window.db.delete() - Delete a record
 * - window.db.subscribe() - Real-time updates via polling
 *
 * @param projectId - The project ID for scoping database operations
 * @param collections - Array of collection definitions
 * @returns Complete <script> tag with database API implementation
 */
export function createDatabaseInjectionScript(
  projectId: string,
  collections: DatabaseCollection[]
): string {
  const collectionsJson = JSON.stringify(collections.map((c) => c.name));

  return `
<script>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VibeCoding Database API - Auto-Injected
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function() {
  const PROJECT_ID = '${projectId}';
  const API_BASE = window.location.origin;
  const COLLECTIONS = ${collectionsJson};

  // Real-time sync state
  let syncInterval = null;
  const syncCallbacks = new Map(); // collectionName -> Set<callback>
  let lastSyncTime = Date.now();

  /**
   * Main Database API
   */
  window.db = {
    /**
     * Get all records from a collection
     * @param {string} collectionName - Name of the collection
     * @returns {Promise<Array>} Array of records
     *
     * @example
     * const items = await window.db.get('tasks');
     * console.log(items); // [{ id: '...', title: 'Task 1', ... }]
     */
    async get(collectionName) {
      try {
        const response = await fetch(\`\${API_BASE}/api/database/\${PROJECT_ID}/\${collectionName}\`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(\`Failed to fetch \${collectionName}: \${response.statusText}\`);
        }

        const data = await response.json();
        return data.items || [];
      } catch (error) {
        console.error(\`[DB] Error fetching \${collectionName}:\`, error);
        throw error;
      }
    },

    /**
     * Add a new record to a collection
     * @param {string} collectionName - Name of the collection
     * @param {object} record - Record data (without id)
     * @returns {Promise<object>} Created record with id
     *
     * @example
     * const newTask = await window.db.add('tasks', {
     *   title: 'New Task',
     *   completed: false
     * });
     * console.log(newTask.id); // Auto-generated ID
     */
    async add(collectionName, record) {
      try {
        const response = await fetch(\`\${API_BASE}/api/database/\${PROJECT_ID}/\${collectionName}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });

        if (!response.ok) {
          throw new Error(\`Failed to add record to \${collectionName}: \${response.statusText}\`);
        }

        const newRecord = await response.json();

        // Trigger sync callbacks immediately
        this._triggerSync(collectionName);

        return newRecord;
      } catch (error) {
        console.error(\`[DB] Error adding to \${collectionName}:\`, error);
        throw error;
      }
    },

    /**
     * Update an existing record
     * @param {string} collectionName - Name of the collection
     * @param {string} id - Record ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated record
     *
     * @example
     * const updated = await window.db.update('tasks', 'abc123', {
     *   completed: true
     * });
     */
    async update(collectionName, id, updates) {
      try {
        const response = await fetch(\`\${API_BASE}/api/database/\${PROJECT_ID}/\${collectionName}/\${id}\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          throw new Error(\`Failed to update record in \${collectionName}: \${response.statusText}\`);
        }

        const updatedRecord = await response.json();

        // Trigger sync callbacks immediately
        this._triggerSync(collectionName);

        return updatedRecord;
      } catch (error) {
        console.error(\`[DB] Error updating \${collectionName}:\`, error);
        throw error;
      }
    },

    /**
     * Delete a record
     * @param {string} collectionName - Name of the collection
     * @param {string} id - Record ID
     * @returns {Promise<void>}
     *
     * @example
     * await window.db.delete('tasks', 'abc123');
     */
    async delete(collectionName, id) {
      try {
        const response = await fetch(\`\${API_BASE}/api/database/\${PROJECT_ID}/\${collectionName}/\${id}\`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(\`Failed to delete record from \${collectionName}: \${response.statusText}\`);
        }

        // Trigger sync callbacks immediately
        this._triggerSync(collectionName);
      } catch (error) {
        console.error(\`[DB] Error deleting from \${collectionName}:\`, error);
        throw error;
      }
    },

    /**
     * Subscribe to real-time updates for a collection
     *
     * The callback will be called:
     * - Immediately with current data
     * - Every 2 seconds with latest data
     * - Immediately after any add/update/delete operation
     *
     * @param {string} collectionName - Name of the collection
     * @param {function} callback - Function to call with updated data
     * @returns {function} Unsubscribe function
     *
     * @example
     * const unsubscribe = window.db.subscribe('tasks', (tasks) => {
     *   console.log('Tasks updated:', tasks);
     *   renderTasks(tasks);
     * });
     *
     * // Later: unsubscribe()
     */
    subscribe(collectionName, callback) {
      // Initialize callbacks set for this collection
      if (!syncCallbacks.has(collectionName)) {
        syncCallbacks.set(collectionName, new Set());
      }

      syncCallbacks.get(collectionName).add(callback);

      // Call immediately with current data
      this.get(collectionName).then(data => {
        callback(data);
      }).catch(error => {
        console.error(\`[DB] Initial subscription fetch failed for \${collectionName}:\`, error);
      });

      // Start sync interval if not already running
      if (!syncInterval) {
        console.log('[DB] Starting real-time sync (polling every 2 seconds)...');

        syncInterval = setInterval(async () => {
          for (const [colName, callbacks] of syncCallbacks.entries()) {
            try {
              const data = await this.get(colName);
              callbacks.forEach(cb => {
                try {
                  cb(data);
                } catch (error) {
                  console.error(\`[DB] Callback error for \${colName}:\`, error);
                }
              });
            } catch (error) {
              console.error(\`[DB] Sync error for \${colName}:\`, error);
            }
          }

          lastSyncTime = Date.now();
        }, 2000); // Poll every 2 seconds
      }

      // Return unsubscribe function
      return () => {
        const callbacks = syncCallbacks.get(collectionName);
        if (callbacks) {
          callbacks.delete(callback);

          // Clean up empty callback sets
          if (callbacks.size === 0) {
            syncCallbacks.delete(collectionName);
          }
        }

        // Stop interval if no more subscriptions
        if (syncCallbacks.size === 0 && syncInterval) {
          console.log('[DB] Stopping real-time sync (no active subscriptions)');
          clearInterval(syncInterval);
          syncInterval = null;
        }
      };
    },

    /**
     * Internal: Trigger sync callbacks for a collection immediately
     * (Called after add/update/delete operations)
     */
    async _triggerSync(collectionName) {
      const callbacks = syncCallbacks.get(collectionName);
      if (callbacks && callbacks.size > 0) {
        try {
          const data = await this.get(collectionName);
          callbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              console.error(\`[DB] Callback error during immediate sync for \${collectionName}:\`, error);
            }
          });
        } catch (error) {
          console.error(\`[DB] Error during immediate sync for \${collectionName}:\`, error);
        }
      }
    },

    /**
     * Get sync status
     */
    getSyncStatus() {
      return {
        active: syncInterval !== null,
        subscriptions: syncCallbacks.size,
        collections: Array.from(syncCallbacks.keys()),
        lastSync: new Date(lastSyncTime).toISOString()
      };
    }
  };

  // Auto-cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  });

  // Log initialization
  console.log('%c✅ Database API Ready', 'color: #22c55e; font-weight: bold');
  console.log('📦 Collections:', COLLECTIONS);
  console.log('🔧 Methods:', ['get', 'add', 'update', 'delete', 'subscribe']);
  console.log('📡 Real-time sync: Enabled (polling every 2 seconds)');
  console.log('');
  console.log('Example usage:');
  console.log('  const items = await window.db.get("' + COLLECTIONS[0] + '")');
  console.log('  window.db.subscribe("' + COLLECTIONS[0] + '", (data) => console.log(data))');
})();
</script>`;
}

/**
 * Inject database script into HTML content
 *
 * Attempts to inject in the following order:
 * 1. Before closing </head> tag (preferred)
 * 2. After opening <body> tag
 * 3. At the beginning of the file (fallback)
 *
 * @param html - HTML content
 * @param dbScript - Database injection script
 * @returns Modified HTML with database script injected
 */
export function injectDatabaseScript(html: string, dbScript: string): string {
  // Strategy 1: Insert before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${dbScript}\n</head>`);
  }

  // Strategy 2: Insert after <body>
  const bodyMatch = html.match(/<body[^>]*>/);
  if (bodyMatch) {
    const bodyTag = bodyMatch[0];
    return html.replace(bodyTag, `${bodyTag}\n${dbScript}`);
  }

  // Strategy 3: Prepend to file (fallback)
  console.warn('[DB Injection] Could not find </head> or <body>, prepending script');
  return dbScript + '\n' + html;
}

/**
 * Check if HTML already has database script injected
 */
export function hasDatabaseScript(html: string): boolean {
  return html.includes('VibeCoding Database API - Auto-Injected');
}
