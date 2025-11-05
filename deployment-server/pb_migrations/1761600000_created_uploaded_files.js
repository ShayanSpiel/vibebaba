/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "uploaded_files_id",
    "created": "2025-01-15 00:00:00.000Z",
    "updated": "2025-01-15 00:00:00.000Z",
    "name": "uploaded_files",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "uf_project",
        "name": "projectId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "qs1lgj8vbwnkacp",
          "cascadeDelete": true,
          "minSelect": 1,
          "maxSelect": 1,
          "displayFields": ["name"]
        }
      },
      {
        "system": false,
        "id": "uf_user",
        "name": "userId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": 1,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "uf_filename",
        "name": "fileName",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 255,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "uf_filetype",
        "name": "fileType",
        "type": "text",
        "required": true,
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
        "id": "uf_purpose",
        "name": "purpose",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "asset",
            "design-reference",
            "both",
            "pending"
          ]
        }
      },
      {
        "system": false,
        "id": "uf_file",
        "name": "file",
        "type": "file",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "application/pdf"
          ],
          "thumbs": ["100x100", "300x300"],
          "maxSelect": 1,
          "maxSize": 10485760,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "uf_analysis",
        "name": "designAnalysis",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 500000
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_uploaded_files_project ON uploaded_files(projectId)",
      "CREATE INDEX idx_uploaded_files_user ON uploaded_files(userId)",
      "CREATE INDEX idx_uploaded_files_purpose ON uploaded_files(purpose)"
    ],
    "listRule": "userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "userId = @request.auth.id",
    "deleteRule": "userId = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("uploaded_files_id");

  return dao.deleteCollection(collection);
})
