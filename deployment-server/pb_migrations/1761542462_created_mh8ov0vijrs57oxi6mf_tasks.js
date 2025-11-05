/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kgtw8ob0dp24ftq",
    "created": "2025-10-27 05:21:02.288Z",
    "updated": "2025-10-27 05:21:02.288Z",
    "name": "mh8ov0vijrs57oxi6mf_tasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "f8otfgtd",
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
        "id": "wgqgvdgl",
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
        "id": "bubz70ms",
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
  const collection = dao.findCollectionByNameOrId("kgtw8ob0dp24ftq");

  return dao.deleteCollection(collection);
})
