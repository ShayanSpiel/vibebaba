/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "czeqaptndpk5z1r",
    "created": "2025-11-14 02:54:50.755Z",
    "updated": "2025-11-14 02:54:50.755Z",
    "name": "ua5R7C2ZHhqNIzN_sessions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2yhkmu1o",
        "name": "userId",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "iihnqx2o",
        "name": "token",
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
        "id": "qhs79c5p",
        "name": "expiresAt",
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
  const collection = dao.findCollectionByNameOrId("czeqaptndpk5z1r");

  return dao.deleteCollection(collection);
})
