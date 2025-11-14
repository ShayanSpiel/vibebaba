/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "pxykpf9oohwmjg7",
    "created": "2025-11-08 15:47:44.484Z",
    "updated": "2025-11-08 15:47:44.484Z",
    "name": "HpOPLxrDCmSooIg_features",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "u088vgsv",
        "name": "feature_name",
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
        "id": "ydkpbzth",
        "name": "feature_description",
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
        "id": "tarvvvou",
        "name": "feature_icon",
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
  const collection = dao.findCollectionByNameOrId("pxykpf9oohwmjg7");

  return dao.deleteCollection(collection);
})
