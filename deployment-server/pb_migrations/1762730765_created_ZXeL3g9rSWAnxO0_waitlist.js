/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "oz0kay6ymc9fhnp",
    "created": "2025-11-09 23:26:04.928Z",
    "updated": "2025-11-09 23:26:04.928Z",
    "name": "ZXeL3g9rSWAnxO0_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "nm7r3sd8",
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
        "id": "q6swua7u",
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
  const collection = dao.findCollectionByNameOrId("oz0kay6ymc9fhnp");

  return dao.deleteCollection(collection);
})
