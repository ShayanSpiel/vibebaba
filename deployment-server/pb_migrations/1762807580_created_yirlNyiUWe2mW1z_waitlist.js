/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "5jxslts40qo103c",
    "created": "2025-11-10 20:46:20.619Z",
    "updated": "2025-11-10 20:46:20.619Z",
    "name": "yirlNyiUWe2mW1z_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "tjw5vpib",
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
  const collection = dao.findCollectionByNameOrId("5jxslts40qo103c");

  return dao.deleteCollection(collection);
})
