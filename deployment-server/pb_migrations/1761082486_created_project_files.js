/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "13m6f2nrprkemu0",
    "created": "2025-10-21 21:34:46.430Z",
    "updated": "2025-10-21 21:34:46.430Z",
    "name": "project_files",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "6utqjker",
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
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "4qmcjbhh",
        "name": "path",
        "type": "text",
        "required": true,
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
        "id": "lsznpd5g",
        "name": "content",
        "type": "text",
        "required": true,
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
        "id": "arecqcge",
        "name": "encoding",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "utf-8",
            "base64"
          ]
        }
      },
      {
        "system": false,
        "id": "56071c0m",
        "name": "size",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "projectId.userId = @request.auth.id",
    "viewRule": "projectId.userId = @request.auth.id",
    "createRule": "projectId.userId = @request.auth.id",
    "updateRule": "projectId.userId = @request.auth.id",
    "deleteRule": "projectId.userId = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("13m6f2nrprkemu0");

  return dao.deleteCollection(collection);
})
