/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "4uesd8lgroefutl",
    "created": "2025-11-04 01:56:20.165Z",
    "updated": "2025-11-04 01:56:20.165Z",
    "name": "bL52fobMAyKJZjA_voiceChannels",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "owgochpg",
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
        "id": "epmqwvzd",
        "name": "users",
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
  const collection = dao.findCollectionByNameOrId("4uesd8lgroefutl");

  return dao.deleteCollection(collection);
})
