/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("project_settings_memory_collection");

  return dao.deleteCollection(collection);
}, (db) => {
  const collection = new Collection({
    "id": "project_settings_memory_collection",
    "created": "2025-11-05 02:25:46.167Z",
    "updated": "2025-11-05 02:25:46.167Z",
    "name": "project_settings_memory",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "project_id_field",
        "name": "projectId",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_id_field",
        "name": "userId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "email"
          ]
        }
      },
      {
        "system": false,
        "id": "project_name_field",
        "name": "projectName",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "initial_prompt_field",
        "name": "initialPrompt",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "styling_config_field",
        "name": "stylingConfig",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 0
        }
      },
      {
        "system": false,
        "id": "timestamp_field",
        "name": "timestamp",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "updated_at_field",
        "name": "updatedAt",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_project_settings_project_id ON project_settings_memory (projectId)",
      "CREATE INDEX idx_project_settings_user_id ON project_settings_memory (userId)"
    ],
    "listRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
})
