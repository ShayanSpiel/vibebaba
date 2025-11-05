/// <reference path="../pb_data/types.d.ts" />

// Create conversation_memory collection for LangChain memory management
migrate((db) => {
  const collection = new Collection({
    id: 'conversation_memory_collection',
    name: 'conversation_memory',
    type: 'base',
    schema: [
      {
        name: 'projectId',
        type: 'text',
        required: true
      },
      {
        name: 'messages',
        type: 'json',
        required: true
      },
      {
        name: 'summary',
        type: 'text',
        required: false
      },
      {
        name: 'entities',
        type: 'json',
        required: false
      },
      {
        name: 'projectConfig',
        type: 'json',
        required: false
      },
      {
        name: 'userPreferences',
        type: 'json',
        required: false
      },
      {
        name: 'workflowMetadata',
        type: 'json',
        required: false
      },
      {
        name: 'updatedAt',
        type: 'date',
        required: true
      }
    ],
    indexes: [
      'CREATE INDEX idx_conversation_memory_projectId ON conversation_memory(projectId)'
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""'
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  // Rollback: delete collection
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId('conversation_memory');
  return dao.deleteCollection(collection);
});
