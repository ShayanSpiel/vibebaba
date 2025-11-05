/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "am8vkioeuv1yuo2",
    "created": "2025-10-27 04:46:41.378Z",
    "updated": "2025-10-27 04:46:41.378Z",
    "name": "mh8nm1i5tyh3884d4jp_Subtask",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "hfllfzjn",
        "name": "task",
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
        "id": "gkqzuzeo",
        "name": "title",
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
        "id": "f8auxfbf",
        "name": "isCompleted",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
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
  const collection = dao.findCollectionByNameOrId("am8vkioeuv1yuo2");

  return dao.deleteCollection(collection);
})
