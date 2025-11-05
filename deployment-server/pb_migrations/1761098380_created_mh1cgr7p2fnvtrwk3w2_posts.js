/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "t1cdm3yqo9859vv",
    "created": "2025-10-22 01:59:40.836Z",
    "updated": "2025-10-22 01:59:40.836Z",
    "name": "mh1cgr7p2fnvtrwk3w2_posts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "f0c4t48k",
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
        "id": "dazup6yc",
        "name": "body",
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
        "id": "788ql2qy",
        "name": "publication_date",
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
  const collection = dao.findCollectionByNameOrId("t1cdm3yqo9859vv");

  return dao.deleteCollection(collection);
})
