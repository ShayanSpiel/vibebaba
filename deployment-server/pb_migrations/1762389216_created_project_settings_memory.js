/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "xuyr424qa08pd1m",
    "created": "2025-11-06 00:33:36.212Z",
    "updated": "2025-11-06 00:33:36.212Z",
    "name": "project_settings_memory",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "d3qn5wt9",
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
        "id": "rarx8fc4",
        "name": "userId",
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
        "id": "zzlogeru",
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
        "id": "ujrasule",
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
        "id": "u7ilsilx",
        "name": "stylingConfig",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "hpjlnweg",
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
        "id": "pjyrssyf",
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
      "CREATE INDEX `idx_projectId` ON `project_settings_memory` (`projectId`)",
      "CREATE INDEX `idx_userId` ON `project_settings_memory` (`userId`)"
    ],
    "listRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("xuyr424qa08pd1m");

  return dao.deleteCollection(collection);
})
