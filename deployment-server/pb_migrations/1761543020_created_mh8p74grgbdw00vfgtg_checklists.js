/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "yzmdj9jrkqyzrau",
    "created": "2025-10-27 05:30:20.538Z",
    "updated": "2025-10-27 05:30:20.538Z",
    "name": "mh8p74grgbdw00vfgtg_checklists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ndhteh5e",
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
        "id": "sbaciksd",
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
  const collection = dao.findCollectionByNameOrId("yzmdj9jrkqyzrau");

  return dao.deleteCollection(collection);
})
