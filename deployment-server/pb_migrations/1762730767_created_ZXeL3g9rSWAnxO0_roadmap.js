/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kagolcrdnc1euzm",
    "created": "2025-11-09 23:26:07.396Z",
    "updated": "2025-11-09 23:26:07.396Z",
    "name": "ZXeL3g9rSWAnxO0_roadmap",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "av3wiapp",
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
        "id": "o36lnqq7",
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
      },
      {
        "system": false,
        "id": "tojnqbub",
        "name": "release_date",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
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
  const collection = dao.findCollectionByNameOrId("kagolcrdnc1euzm");

  return dao.deleteCollection(collection);
})
