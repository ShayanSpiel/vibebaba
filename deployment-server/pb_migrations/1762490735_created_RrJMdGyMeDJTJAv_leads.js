/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ke7hul3i0333n4d",
    "created": "2025-11-07 04:45:35.870Z",
    "updated": "2025-11-07 04:45:35.870Z",
    "name": "RrJMdGyMeDJTJAv_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "iymp0nz4",
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
  const collection = dao.findCollectionByNameOrId("ke7hul3i0333n4d");

  return dao.deleteCollection(collection);
})
