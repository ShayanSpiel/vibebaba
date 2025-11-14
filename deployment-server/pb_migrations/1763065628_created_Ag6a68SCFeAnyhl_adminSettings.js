/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "27i8v9v6j0wqvvu",
    "created": "2025-11-13 20:27:08.876Z",
    "updated": "2025-11-13 20:27:08.876Z",
    "name": "Ag6a68SCFeAnyhl_adminSettings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "mv85k5sx",
        "name": "siteTitle",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "pgo7v5ym",
        "name": "siteDescription",
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
  const collection = dao.findCollectionByNameOrId("27i8v9v6j0wqvvu");

  return dao.deleteCollection(collection);
})
