/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "dyov45mmdppixjv",
    "created": "2025-11-02 16:03:12.903Z",
    "updated": "2025-11-02 16:03:12.903Z",
    "name": "cpZH5fvoPtFJrFi_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "c0pjrakz",
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
        "id": "ppvzxu5t",
        "name": "createdAt",
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
  const collection = dao.findCollectionByNameOrId("dyov45mmdppixjv");

  return dao.deleteCollection(collection);
})
