/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "oju8njm6nyypxaj",
    "created": "2025-10-21 21:34:46.442Z",
    "updated": "2025-10-21 21:34:46.442Z",
    "name": "project_messages",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "i3ji38wc",
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
        "id": "cq87conx",
        "name": "role",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "user",
            "assistant",
            "system"
          ]
        }
      },
      {
        "system": false,
        "id": "b52w1fjb",
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
        "id": "fsemascx",
        "name": "tokens",
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
    "updateRule": null,
    "deleteRule": "projectId.userId = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("oju8njm6nyypxaj");

  return dao.deleteCollection(collection);
})
