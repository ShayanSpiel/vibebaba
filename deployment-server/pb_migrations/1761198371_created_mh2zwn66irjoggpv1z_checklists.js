/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ezkwv0vqosf8dy5",
    "created": "2025-10-23 05:46:11.117Z",
    "updated": "2025-10-23 05:46:11.117Z",
    "name": "mh2zwn66irjoggpv1z_checklists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "mnzygifg",
        "name": "date",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "jpeur8wh",
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
      },
      {
        "system": false,
        "id": "nuv6dsdv",
        "name": "theme",
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
  const collection = dao.findCollectionByNameOrId("ezkwv0vqosf8dy5");

  return dao.deleteCollection(collection);
})
