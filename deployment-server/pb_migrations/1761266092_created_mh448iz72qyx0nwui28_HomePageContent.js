/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "xlt2wqpx7eoj4gm",
    "created": "2025-10-24 00:34:51.659Z",
    "updated": "2025-10-24 00:34:51.659Z",
    "name": "mh448iz72qyx0nwui28_HomePageContent",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ezybknsb",
        "name": "page_title",
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
        "id": "edtwxyhd",
        "name": "content_heading",
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
  const collection = dao.findCollectionByNameOrId("xlt2wqpx7eoj4gm");

  return dao.deleteCollection(collection);
})
