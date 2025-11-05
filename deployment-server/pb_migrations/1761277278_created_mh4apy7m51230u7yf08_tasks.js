/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "eb8ln1hqy7upwo1",
    "created": "2025-10-24 03:41:18.602Z",
    "updated": "2025-10-24 03:41:18.602Z",
    "name": "mh4apy7m51230u7yf08_tasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "l2hifdob",
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
        "id": "3zlcqgah",
        "name": "due_date",
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
        "id": "s29lqabi",
        "name": "is_completed",
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
  const collection = dao.findCollectionByNameOrId("eb8ln1hqy7upwo1");

  return dao.deleteCollection(collection);
})
