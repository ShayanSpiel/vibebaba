/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "se6aq1wzubvhrqr",
    "created": "2025-11-13 02:50:20.838Z",
    "updated": "2025-11-13 02:50:20.838Z",
    "name": "ZtfKPFKK7dLWu36_chart_templates",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ssdsqsvo",
        "name": "name",
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
        "id": "gpf3n9dx",
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
      },
      {
        "system": false,
        "id": "xbpzphab",
        "name": "config",
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
  const collection = dao.findCollectionByNameOrId("se6aq1wzubvhrqr");

  return dao.deleteCollection(collection);
})
