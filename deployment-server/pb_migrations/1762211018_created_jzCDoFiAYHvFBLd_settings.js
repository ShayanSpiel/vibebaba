/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ujjx3317jedd4ac",
    "created": "2025-11-03 23:03:38.932Z",
    "updated": "2025-11-03 23:03:38.932Z",
    "name": "jzCDoFiAYHvFBLd_settings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "yuvrcmuh",
        "name": "blogTitle",
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
        "id": "llyuywpy",
        "name": "blogSubtitle",
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
        "id": "zkvowuqn",
        "name": "metaTitle",
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
        "id": "siqwe3t3",
        "name": "metaDescription",
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
  const collection = dao.findCollectionByNameOrId("ujjx3317jedd4ac");

  return dao.deleteCollection(collection);
})
