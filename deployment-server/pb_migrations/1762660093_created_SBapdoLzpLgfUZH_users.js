/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "0m2608pbmpfc1yx",
    "created": "2025-11-09 03:48:12.874Z",
    "updated": "2025-11-09 03:48:12.874Z",
    "name": "SBapdoLzpLgfUZH_users",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "3gwtw1x0",
        "name": "username",
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
        "id": "4ciyomkk",
        "name": "email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "qqcyjrvr",
        "name": "password",
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
        "id": "zwy9bazb",
        "name": "verified",
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
  const collection = dao.findCollectionByNameOrId("0m2608pbmpfc1yx");

  return dao.deleteCollection(collection);
})
