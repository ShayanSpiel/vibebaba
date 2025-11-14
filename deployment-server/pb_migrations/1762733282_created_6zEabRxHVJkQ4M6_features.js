/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "dp8yvjum9ua9li5",
    "created": "2025-11-10 00:08:02.521Z",
    "updated": "2025-11-10 00:08:02.521Z",
    "name": "6zEabRxHVJkQ4M6_features",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ez8owwsc",
        "name": "feature_name",
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
        "id": "kqnbvk4o",
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
  const collection = dao.findCollectionByNameOrId("dp8yvjum9ua9li5");

  return dao.deleteCollection(collection);
})
