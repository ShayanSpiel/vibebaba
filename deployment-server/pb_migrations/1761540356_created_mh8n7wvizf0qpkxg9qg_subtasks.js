/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "mqv5fzqn584giir",
    "created": "2025-10-27 04:45:56.818Z",
    "updated": "2025-10-27 04:45:56.818Z",
    "name": "mh8n7wvizf0qpkxg9qg_subtasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "6yo4igfx",
        "name": "task_id",
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
        "id": "q50afufs",
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
        "id": "dcfsmur0",
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
  const collection = dao.findCollectionByNameOrId("mqv5fzqn584giir");

  return dao.deleteCollection(collection);
})
