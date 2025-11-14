/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "n3smdh51bf8ql42",
    "created": "2025-11-09 02:37:02.360Z",
    "updated": "2025-11-09 02:37:02.360Z",
    "name": "GEIBZRROxxCn221_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "bnzqrr9g",
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
        "id": "gvrwwsof",
        "name": "name",
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
        "id": "vg994ti3",
        "name": "createdAt",
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
  const collection = dao.findCollectionByNameOrId("n3smdh51bf8ql42");

  return dao.deleteCollection(collection);
})
