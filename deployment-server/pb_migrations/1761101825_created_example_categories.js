/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "175m9ks5s631q4o",
    "created": "2025-10-22 02:57:05.509Z",
    "updated": "2025-10-22 02:57:05.509Z",
    "name": "example_categories",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "y1comtia",
        "name": "slug",
        "type": "text",
        "required": true,
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
        "id": "2o4tycjn",
        "name": "name",
        "type": "text",
        "required": true,
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
        "id": "srfatghl",
        "name": "description",
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
        "id": "pb724o4s",
        "name": "minExamplesRequired",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 2,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "xlve5xnp",
        "name": "targetExamples",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 5,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "vn9akukw",
        "name": "parentCategory",
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
        "id": "vx06xws7",
        "name": "isActive",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "aiohep3i",
        "name": "priority",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 5,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("175m9ks5s631q4o");

  return dao.deleteCollection(collection);
})
