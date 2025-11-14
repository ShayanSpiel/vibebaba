/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "etqqgxgrbot56hf",
    "created": "2025-11-10 16:36:03.885Z",
    "updated": "2025-11-10 16:36:03.885Z",
    "name": "NbmVK742htjcPsV_ratings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "vujdiyrx",
        "name": "user_id",
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
        "id": "vunzmcm8",
        "name": "rating",
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
        "id": "ymoxabzs",
        "name": "comment",
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
  const collection = dao.findCollectionByNameOrId("etqqgxgrbot56hf");

  return dao.deleteCollection(collection);
})
