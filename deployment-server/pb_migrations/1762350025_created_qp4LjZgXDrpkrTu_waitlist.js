/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "wl5o4wcng5kunp8",
    "created": "2025-11-05 13:40:25.552Z",
    "updated": "2025-11-05 13:40:25.552Z",
    "name": "qp4LjZgXDrpkrTu_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "oahgbnjb",
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
  const collection = dao.findCollectionByNameOrId("wl5o4wcng5kunp8");

  return dao.deleteCollection(collection);
})
