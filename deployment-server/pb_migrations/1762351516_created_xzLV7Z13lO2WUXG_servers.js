/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "365t54ftayyokn2",
    "created": "2025-11-05 14:05:16.637Z",
    "updated": "2025-11-05 14:05:16.637Z",
    "name": "xzLV7Z13lO2WUXG_servers",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ma1snvlf",
        "name": "name",
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
        "id": "eh5vko9v",
        "name": "owner",
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
  const collection = dao.findCollectionByNameOrId("365t54ftayyokn2");

  return dao.deleteCollection(collection);
})
