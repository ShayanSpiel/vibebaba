/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "0mp6sdfclhwl4nb",
    "created": "2025-11-03 15:36:42.224Z",
    "updated": "2025-11-03 15:36:42.224Z",
    "name": "yD3JYFyw84FcWGl_messages",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "0vp3ms1x",
        "name": "userMessage",
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
        "id": "ynpo95hk",
        "name": "aiResponse",
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
        "id": "utebaujq",
        "name": "timestamp",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
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
  const collection = dao.findCollectionByNameOrId("0mp6sdfclhwl4nb");

  return dao.deleteCollection(collection);
})
