/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "r8kmbwvmuq6wmqh",
    "created": "2025-10-27 05:30:20.810Z",
    "updated": "2025-10-27 05:30:20.810Z",
    "name": "mh8p74grgbdw00vfgtg_tasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "zxb0wwmt",
        "name": "checklistId",
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
        "id": "t6nbun57",
        "name": "taskName",
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
        "id": "vlar62ya",
        "name": "dueDate",
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
        "id": "ukiae5hg",
        "name": "completed",
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
  const collection = dao.findCollectionByNameOrId("r8kmbwvmuq6wmqh");

  return dao.deleteCollection(collection);
})
