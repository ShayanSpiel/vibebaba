/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "6lmq263ko1786p6",
    "created": "2025-10-22 01:56:24.191Z",
    "updated": "2025-10-22 01:56:24.191Z",
    "name": "mh1bvgveli4k0fr50v_waitlist_entries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "gzjgjmg3",
        "name": "email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "shd2wdjz",
        "name": "name",
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
        "id": "lwqzn5ar",
        "name": "date_joined",
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
  const collection = dao.findCollectionByNameOrId("6lmq263ko1786p6");

  return dao.deleteCollection(collection);
})
