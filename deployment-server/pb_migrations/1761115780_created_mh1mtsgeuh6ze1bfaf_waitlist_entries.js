/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "64b44w24wsq7cb6",
    "created": "2025-10-22 06:49:40.726Z",
    "updated": "2025-10-22 06:49:40.726Z",
    "name": "mh1mtsgeuh6ze1bfaf_waitlist_entries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "akwvslvm",
        "name": "email",
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
        "id": "pxdvbgfv",
        "name": "shoe_size",
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
        "id": "wnh7qbzv",
        "name": "date_submitted",
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
  const collection = dao.findCollectionByNameOrId("64b44w24wsq7cb6");

  return dao.deleteCollection(collection);
})
