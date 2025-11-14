/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "lujcsc7ktyyyyff",
    "created": "2025-11-10 00:08:04.356Z",
    "updated": "2025-11-10 00:08:04.356Z",
    "name": "6zEabRxHVJkQ4M6_roadmap",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "vs7g4jiq",
        "name": "phase_name",
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
        "id": "zwvzx0x4",
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
        "id": "dpflghju",
        "name": "due_date",
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
  const collection = dao.findCollectionByNameOrId("lujcsc7ktyyyyff");

  return dao.deleteCollection(collection);
})
