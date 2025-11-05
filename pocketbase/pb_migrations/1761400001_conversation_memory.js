/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create conversation_memory collection
 * Purpose: Store conversation history for multi-turn editing
 */
migrate((db) => {
  const collection = new Collection({
    id: 'conversation_memory_collection',
    name: 'conversation_memory',
    type: 'base',
    system: false,
    schema: [
      {
        id: 'project_id_field',
        name: 'projectId',
        type: 'text',
        system: false,
        required: true,
        options: {
          min: 1,
          max: 100
        }
      },
      {
        id: 'messages_field',
        name: 'messages',
        type: 'json',
        system: false,
        required: true,
        options: {}
      },
      {
        id: 'summary_field',
        name: 'summary',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        id: 'entities_field',
        name: 'entities',
        type: 'json',
        system: false,
        required: true,
        options: {}
      },
      {
        id: 'project_config_field',
        name: 'projectConfig',
        type: 'json',
        system: false,
        required: false,
        options: {}
      },
      {
        id: 'user_preferences_field',
        name: 'userPreferences',
        type: 'json',
        system: false,
        required: false,
        options: {}
      },
      {
        id: 'workflow_metadata_field',
        name: 'workflowMetadata',
        type: 'json',
        system: false,
        required: false,
        options: {}
      },
      {
        id: 'updated_at_field',
        name: 'updatedAt',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: 100
        }
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_conversation_memory_project_id ON conversation_memory (projectId)'
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""'
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId('conversation_memory');
  return dao.deleteCollection(collection);
});
