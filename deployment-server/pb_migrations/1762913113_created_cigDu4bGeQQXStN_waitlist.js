/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "p0r1qnk09ee3ptt",
    "created": "2025-11-12 02:05:13.679Z",
    "updated": "2025-11-12 02:05:13.679Z",
    "name": "cigDu4bGeQQXStN_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "gwgcsbvp",
        "name": "email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
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
  const collection = dao.findCollectionByNameOrId("p0r1qnk09ee3ptt");

  return dao.deleteCollection(collection);
})
