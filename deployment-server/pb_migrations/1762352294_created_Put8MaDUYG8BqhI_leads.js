/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "hfns6h3egoeduo2",
    "created": "2025-11-05 14:18:14.027Z",
    "updated": "2025-11-05 14:18:14.027Z",
    "name": "Put8MaDUYG8BqhI_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "oh5qxe7i",
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
  const collection = dao.findCollectionByNameOrId("hfns6h3egoeduo2");

  return dao.deleteCollection(collection);
})
