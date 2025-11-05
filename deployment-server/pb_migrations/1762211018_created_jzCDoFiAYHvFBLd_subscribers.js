/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ivvjb4bnpfgtgve",
    "created": "2025-11-03 23:03:38.668Z",
    "updated": "2025-11-03 23:03:38.668Z",
    "name": "jzCDoFiAYHvFBLd_subscribers",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "3ojfvnxl",
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
        "id": "ivop4gw8",
        "name": "subscribedAt",
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
  const collection = dao.findCollectionByNameOrId("ivvjb4bnpfgtgve");

  return dao.deleteCollection(collection);
})
