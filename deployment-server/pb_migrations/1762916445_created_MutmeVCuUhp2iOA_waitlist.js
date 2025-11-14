/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "3aejuk6xyhhzk7h",
    "created": "2025-11-12 03:00:44.875Z",
    "updated": "2025-11-12 03:00:44.875Z",
    "name": "MutmeVCuUhp2iOA_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "yk1k6jyq",
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
  const collection = dao.findCollectionByNameOrId("3aejuk6xyhhzk7h");

  return dao.deleteCollection(collection);
})
