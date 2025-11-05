/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create project_settings_memory collection
 * Purpose: Store project settings in LangChain memory for context
 */
migrate((db) => {
  const collection = new Collection({
    id: 'project_settings_memory_collection',
    name: 'project_settings_memory',
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
        id: 'user_id_field',
        name: 'userId',
        type: 'relation',
        system: false,
        required: true,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: ['email']
        }
      },
      {
        id: 'project_name_field',
        name: 'projectName',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: 500
        }
      },
      {
        id: 'initial_prompt_field',
        name: 'initialPrompt',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        id: 'styling_config_field',
        name: 'stylingConfig',
        type: 'json',
        system: false,
        required: false,
        options: {}
      },
      {
        id: 'timestamp_field',
        name: 'timestamp',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: 100
        }
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
      'CREATE UNIQUE INDEX idx_project_settings_project_id ON project_settings_memory (projectId)',
      'CREATE INDEX idx_project_settings_user_id ON project_settings_memory (userId)'
    ],
    listRule: '@request.auth.id != "" && userId = @request.auth.id',
    viewRule: '@request.auth.id != "" && userId = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && userId = @request.auth.id',
    deleteRule: '@request.auth.id != "" && userId = @request.auth.id'
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId('project_settings_memory');
  return dao.deleteCollection(collection);
});
