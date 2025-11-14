/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "c8elohxfifa30de",
    "created": "2025-11-07 14:01:41.590Z",
    "updated": "2025-11-07 14:01:41.590Z",
    "name": "Bqh4FxwIWGGAEBM_carts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "smw8aufk",
        "name": "userId",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "v4yc9alp",
        "name": "items",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("c8elohxfifa30de");

  return dao.deleteCollection(collection);
})
