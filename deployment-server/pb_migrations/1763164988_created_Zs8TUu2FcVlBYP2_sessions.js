/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "4kjo9jkzj3f9u1k",
    "created": "2025-11-15 00:03:08.157Z",
    "updated": "2025-11-15 00:03:08.157Z",
    "name": "Zs8TUu2FcVlBYP2_sessions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2si0r0nq",
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
        "id": "7sdvlhxj",
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
        "id": "yjqqydhb",
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
  const collection = dao.findCollectionByNameOrId("4kjo9jkzj3f9u1k");

  return dao.deleteCollection(collection);
})
