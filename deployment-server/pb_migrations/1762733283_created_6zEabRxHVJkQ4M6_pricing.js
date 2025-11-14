/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "6xcrwk8unn8pj43",
    "created": "2025-11-10 00:08:03.578Z",
    "updated": "2025-11-10 00:08:03.578Z",
    "name": "6zEabRxHVJkQ4M6_pricing",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "5suqdjfv",
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
        "id": "bsdedhdp",
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
        "id": "yyu9xc7g",
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
  const collection = dao.findCollectionByNameOrId("6xcrwk8unn8pj43");

  return dao.deleteCollection(collection);
})
