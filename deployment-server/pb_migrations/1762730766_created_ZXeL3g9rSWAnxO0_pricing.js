/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "4k9sw8marmc13th",
    "created": "2025-11-09 23:26:06.119Z",
    "updated": "2025-11-09 23:26:06.119Z",
    "name": "ZXeL3g9rSWAnxO0_pricing",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "uqot1o1s",
        "name": "plan_name",
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
        "id": "9zj6xhud",
        "name": "price",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "xts1u0bc",
        "name": "features",
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
  const collection = dao.findCollectionByNameOrId("4k9sw8marmc13th");

  return dao.deleteCollection(collection);
})
