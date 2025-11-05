/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "cyal3qkmldr3bmh",
    "created": "2025-10-27 03:13:08.552Z",
    "updated": "2025-10-27 03:13:08.552Z",
    "name": "mh8kbajmadpdrj2bhcj_checklists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2k9ugcpt",
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
        "id": "7jd2gym3",
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
  const collection = dao.findCollectionByNameOrId("cyal3qkmldr3bmh");

  return dao.deleteCollection(collection);
})
