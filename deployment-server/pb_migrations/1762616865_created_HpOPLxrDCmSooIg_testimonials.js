/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "2lhchlor3jfov2k",
    "created": "2025-11-08 15:47:45.370Z",
    "updated": "2025-11-08 15:47:45.370Z",
    "name": "HpOPLxrDCmSooIg_testimonials",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "bvvzxc8a",
        "name": "testimonial_name",
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
        "id": "7ebcodlc",
        "name": "testimonial_quote",
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
        "id": "qknsfx7p",
        "name": "testimonial_photo",
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
  const collection = dao.findCollectionByNameOrId("2lhchlor3jfov2k");

  return dao.deleteCollection(collection);
})
