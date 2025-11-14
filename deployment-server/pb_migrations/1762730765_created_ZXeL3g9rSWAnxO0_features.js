/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "duhujg0p8wpfuws",
    "created": "2025-11-09 23:26:05.864Z",
    "updated": "2025-11-09 23:26:05.864Z",
    "name": "ZXeL3g9rSWAnxO0_features",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "mgpdukkn",
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
        "id": "jloq9hof",
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
  const collection = dao.findCollectionByNameOrId("duhujg0p8wpfuws");

  return dao.deleteCollection(collection);
})
