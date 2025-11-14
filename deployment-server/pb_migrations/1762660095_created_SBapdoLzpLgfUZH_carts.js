/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "e49v86q1swdo6b3",
    "created": "2025-11-09 03:48:14.982Z",
    "updated": "2025-11-09 03:48:14.982Z",
    "name": "SBapdoLzpLgfUZH_carts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "9ky7i80s",
        "name": "user",
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
        "id": "c0jlo80m",
        "name": "products",
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
        "id": "k9l0kqou",
        "name": "total",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
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
  const collection = dao.findCollectionByNameOrId("e49v86q1swdo6b3");

  return dao.deleteCollection(collection);
})
