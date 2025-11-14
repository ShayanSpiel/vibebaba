/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "hql12h42dpkyocd",
    "created": "2025-11-11 16:15:16.024Z",
    "updated": "2025-11-11 16:15:16.024Z",
    "name": "qiHWxiRGXvGEBly_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "tsbmtji3",
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
        "id": "jpzyb0ay",
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
  const collection = dao.findCollectionByNameOrId("hql12h42dpkyocd");

  return dao.deleteCollection(collection);
})
