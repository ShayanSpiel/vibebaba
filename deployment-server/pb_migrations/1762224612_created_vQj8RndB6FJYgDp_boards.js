/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "08qad6gx5f7m6ej",
    "created": "2025-11-04 02:50:12.810Z",
    "updated": "2025-11-04 02:50:12.810Z",
    "name": "vQj8RndB6FJYgDp_boards",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "il3sebzj",
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
        "id": "otdt9cql",
        "name": "userId",
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
  const collection = dao.findCollectionByNameOrId("08qad6gx5f7m6ej");

  return dao.deleteCollection(collection);
})
