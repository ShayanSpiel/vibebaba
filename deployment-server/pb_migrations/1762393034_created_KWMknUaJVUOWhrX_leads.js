/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "nd6fycx0f2m9z9b",
    "created": "2025-11-06 01:37:14.038Z",
    "updated": "2025-11-06 01:37:14.038Z",
    "name": "KWMknUaJVUOWhrX_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "kezjgy2z",
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
  const collection = dao.findCollectionByNameOrId("nd6fycx0f2m9z9b");

  return dao.deleteCollection(collection);
})
