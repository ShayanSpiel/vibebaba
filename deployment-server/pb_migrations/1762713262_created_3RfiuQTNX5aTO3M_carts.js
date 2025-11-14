/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kcsn3nbubplui2i",
    "created": "2025-11-09 18:34:22.254Z",
    "updated": "2025-11-09 18:34:22.254Z",
    "name": "3RfiuQTNX5aTO3M_carts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "frzvzsfj",
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
        "id": "7csik2gd",
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
  const collection = dao.findCollectionByNameOrId("kcsn3nbubplui2i");

  return dao.deleteCollection(collection);
})
