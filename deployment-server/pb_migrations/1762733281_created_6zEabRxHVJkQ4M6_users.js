/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "268ct5ozgp8273e",
    "created": "2025-11-10 00:08:01.904Z",
    "updated": "2025-11-10 00:08:01.904Z",
    "name": "6zEabRxHVJkQ4M6_users",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "j2sdqnhd",
        "name": "email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "isonxyxj",
        "name": "created_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
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
  const collection = dao.findCollectionByNameOrId("268ct5ozgp8273e");

  return dao.deleteCollection(collection);
})
