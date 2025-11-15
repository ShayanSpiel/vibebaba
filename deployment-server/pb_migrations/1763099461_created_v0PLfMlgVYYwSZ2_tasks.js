/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "hipe4bmpogmxge8",
    "created": "2025-11-14 05:51:01.479Z",
    "updated": "2025-11-14 05:51:01.479Z",
    "name": "v0PLfMlgVYYwSZ2_tasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qavm0jiz",
        "name": "content",
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
        "id": "oqgsl9oe",
        "name": "isDone",
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
  const collection = dao.findCollectionByNameOrId("hipe4bmpogmxge8");

  return dao.deleteCollection(collection);
})
