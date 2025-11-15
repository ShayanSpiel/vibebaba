/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "v9cftebtrrp6mio",
    "created": "2025-11-15 00:03:08.385Z",
    "updated": "2025-11-15 00:03:08.385Z",
    "name": "Zs8TUu2FcVlBYP2_verification_tokens",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "tcymep9m",
        "name": "identifier",
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
        "id": "lvmb1vup",
        "name": "token",
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
        "id": "5bncwrma",
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
  const collection = dao.findCollectionByNameOrId("v9cftebtrrp6mio");

  return dao.deleteCollection(collection);
})
