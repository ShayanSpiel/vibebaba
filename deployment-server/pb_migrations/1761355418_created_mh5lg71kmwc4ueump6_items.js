/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "wljh5fykqsd7osc",
    "created": "2025-10-25 01:23:38.752Z",
    "updated": "2025-10-25 01:23:38.752Z",
    "name": "mh5lg71kmwc4ueump6_items",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qkoj4nat",
        "name": "title",
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
        "id": "twyzb3go",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000,
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
  const collection = dao.findCollectionByNameOrId("wljh5fykqsd7osc");

  return dao.deleteCollection(collection);
})
