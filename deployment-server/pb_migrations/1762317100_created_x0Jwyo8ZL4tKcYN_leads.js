/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "qt0hlcwppe9mz0v",
    "created": "2025-11-05 04:31:40.199Z",
    "updated": "2025-11-05 04:31:40.199Z",
    "name": "x0Jwyo8ZL4tKcYN_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "llxsjsi1",
        "name": "email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
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
  const collection = dao.findCollectionByNameOrId("qt0hlcwppe9mz0v");

  return dao.deleteCollection(collection);
})
