/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ps9hcyxr2qr8np3",
    "created": "2025-10-26 14:07:01.811Z",
    "updated": "2025-10-26 14:07:01.811Z",
    "name": "mh7s5s2jyllwtzi4a1d_items",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "7hmxiyon",
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
        "id": "tjtgjke4",
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
  const collection = dao.findCollectionByNameOrId("ps9hcyxr2qr8np3");

  return dao.deleteCollection(collection);
})
