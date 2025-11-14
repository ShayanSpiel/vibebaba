/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "99rjl6o48g9ibue",
    "created": "2025-11-11 17:50:08.557Z",
    "updated": "2025-11-11 17:50:08.557Z",
    "name": "aaSVccRgkcJJP0h_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "sjmr1rav",
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
  const collection = dao.findCollectionByNameOrId("99rjl6o48g9ibue");

  return dao.deleteCollection(collection);
})
