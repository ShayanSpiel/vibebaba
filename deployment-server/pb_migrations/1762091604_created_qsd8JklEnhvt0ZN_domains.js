/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "54qyx676yqcl3eu",
    "created": "2025-11-02 13:53:24.749Z",
    "updated": "2025-11-02 13:53:24.749Z",
    "name": "qsd8JklEnhvt0ZN_domains",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "kfajj2kx",
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
        "id": "t57zpxbe",
        "name": "available",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "urhbeqju",
        "name": "suggested",
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
  const collection = dao.findCollectionByNameOrId("54qyx676yqcl3eu");

  return dao.deleteCollection(collection);
})
