/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "3lk10mxxrwlohxs",
    "created": "2025-11-04 02:50:12.506Z",
    "updated": "2025-11-04 02:50:12.506Z",
    "name": "vQj8RndB6FJYgDp_users",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fzfawyrn",
        "name": "username",
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
        "id": "u2usrwen",
        "name": "password",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
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
  const collection = dao.findCollectionByNameOrId("3lk10mxxrwlohxs");

  return dao.deleteCollection(collection);
})
