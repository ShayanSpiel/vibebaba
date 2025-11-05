/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "6uw64v0aze5wo07",
    "created": "2025-11-05 22:04:40.540Z",
    "updated": "2025-11-05 22:04:40.540Z",
    "name": "ukPJSVvd0QlB1Qx_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lmvwxuav",
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
  const collection = dao.findCollectionByNameOrId("6uw64v0aze5wo07");

  return dao.deleteCollection(collection);
})
