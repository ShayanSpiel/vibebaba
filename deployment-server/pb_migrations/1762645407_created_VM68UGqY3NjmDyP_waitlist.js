/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "30s2j34w7akghl5",
    "created": "2025-11-08 23:43:27.488Z",
    "updated": "2025-11-08 23:43:27.488Z",
    "name": "VM68UGqY3NjmDyP_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lbi7o9pz",
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
        "id": "2dvyk2ax",
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
        "id": "ga8nvvzz",
        "name": "createdAt",
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
  const collection = dao.findCollectionByNameOrId("30s2j34w7akghl5");

  return dao.deleteCollection(collection);
})
