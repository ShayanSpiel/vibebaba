/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "mir1zdwk08zupw1",
    "created": "2025-11-10 19:40:28.690Z",
    "updated": "2025-11-10 19:40:28.690Z",
    "name": "kDyBFRSNzK2DOCG_carts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "hfqhszf0",
        "name": "f_id",
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
        "id": "86wdzk0k",
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
        "id": "ophesu0w",
        "name": "items",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
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
  const collection = dao.findCollectionByNameOrId("mir1zdwk08zupw1");

  return dao.deleteCollection(collection);
})
