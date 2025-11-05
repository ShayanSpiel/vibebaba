/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "aziv9t0ptuhppzb",
    "created": "2025-10-27 02:06:41.034Z",
    "updated": "2025-10-27 02:06:41.034Z",
    "name": "mh8hxhthzr5lpayjaq_checklists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "smvn8env",
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
        "id": "uqqixx4w",
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
  const collection = dao.findCollectionByNameOrId("aziv9t0ptuhppzb");

  return dao.deleteCollection(collection);
})
