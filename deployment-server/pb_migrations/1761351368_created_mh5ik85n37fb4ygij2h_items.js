/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "dakymvok5j7w9e4",
    "created": "2025-10-25 00:16:08.975Z",
    "updated": "2025-10-25 00:16:08.975Z",
    "name": "mh5ik85n37fb4ygij2h_items",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "vlqdwr1d",
        "name": "title",
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
        "id": "dijwljsb",
        "name": "description",
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
  const collection = dao.findCollectionByNameOrId("dakymvok5j7w9e4");

  return dao.deleteCollection(collection);
})
