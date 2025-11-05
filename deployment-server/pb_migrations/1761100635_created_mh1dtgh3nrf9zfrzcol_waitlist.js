/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "5fg0plt466en2jf",
    "created": "2025-10-22 02:37:15.551Z",
    "updated": "2025-10-22 02:37:15.551Z",
    "name": "mh1dtgh3nrf9zfrzcol_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "vbmvg5bf",
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
        "id": "bp1llmpn",
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
        "id": "ehqxz0vu",
        "name": "date_joined",
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
  const collection = dao.findCollectionByNameOrId("5fg0plt466en2jf");

  return dao.deleteCollection(collection);
})
