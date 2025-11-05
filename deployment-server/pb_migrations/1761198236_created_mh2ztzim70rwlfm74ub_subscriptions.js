/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "dz5m8mrc8dvqi1y",
    "created": "2025-10-23 05:43:56.581Z",
    "updated": "2025-10-23 05:43:56.581Z",
    "name": "mh2ztzim70rwlfm74ub_subscriptions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qdgbkjhl",
        "name": "email",
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
        "id": "fcdhwh0d",
        "name": "subscribed_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "pnn4fuq4",
        "name": "shoe_interest",
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
  const collection = dao.findCollectionByNameOrId("dz5m8mrc8dvqi1y");

  return dao.deleteCollection(collection);
})
