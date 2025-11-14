/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "u9sk4laauta62cq",
    "created": "2025-11-11 14:32:16.738Z",
    "updated": "2025-11-11 14:32:16.738Z",
    "name": "gSjdtqVkO5VJqjq_messages",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "onu4graq",
        "name": "content",
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
        "id": "fwlcrcn9",
        "name": "sender",
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
        "id": "uifr5h6k",
        "name": "timestamp",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "diqel4ov",
        "name": "isUser",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
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
  const collection = dao.findCollectionByNameOrId("u9sk4laauta62cq");

  return dao.deleteCollection(collection);
})
