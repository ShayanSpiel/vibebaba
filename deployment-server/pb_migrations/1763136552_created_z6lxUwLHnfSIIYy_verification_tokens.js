/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "tttjj7zmko4if51",
    "created": "2025-11-14 16:09:12.894Z",
    "updated": "2025-11-14 16:09:12.894Z",
    "name": "z6lxUwLHnfSIIYy_verification_tokens",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "wgpdi8jw",
        "name": "identifier",
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
        "id": "j7etm32u",
        "name": "token",
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
        "id": "ebgbofz5",
        "name": "expires",
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
  const collection = dao.findCollectionByNameOrId("tttjj7zmko4if51");

  return dao.deleteCollection(collection);
})
