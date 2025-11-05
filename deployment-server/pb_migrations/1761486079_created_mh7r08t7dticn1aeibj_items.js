/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "u2ijml98xwrcsv5",
    "created": "2025-10-26 13:41:19.382Z",
    "updated": "2025-10-26 13:41:19.382Z",
    "name": "mh7r08t7dticn1aeibj_items",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "p9rtsf5s",
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
        "id": "zljqxrfc",
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
  const collection = dao.findCollectionByNameOrId("u2ijml98xwrcsv5");

  return dao.deleteCollection(collection);
})
