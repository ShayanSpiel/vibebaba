/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "9q92lbobu4zv19b",
    "created": "2025-11-14 16:09:12.689Z",
    "updated": "2025-11-14 16:09:12.689Z",
    "name": "z6lxUwLHnfSIIYy_sessions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "1ccqwmcz",
        "name": "sessionToken",
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
        "id": "5i8zhgra",
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
        "id": "o2m9qyl8",
        "name": "expires",
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
  const collection = dao.findCollectionByNameOrId("9q92lbobu4zv19b");

  return dao.deleteCollection(collection);
})
