/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "y1mksbht2snb6w4",
    "created": "2025-10-22 04:37:23.646Z",
    "updated": "2025-10-22 04:37:23.646Z",
    "name": "mh1i4knmrr65aq2twxi_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qc0p4l8c",
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
        "id": "s5ofvk6j",
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
        "id": "fh8f9vp4",
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
  const collection = dao.findCollectionByNameOrId("y1mksbht2snb6w4");

  return dao.deleteCollection(collection);
})
