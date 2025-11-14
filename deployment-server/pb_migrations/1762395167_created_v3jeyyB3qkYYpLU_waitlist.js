/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "zl8hgpgp7l5gtc1",
    "created": "2025-11-06 02:12:47.898Z",
    "updated": "2025-11-06 02:12:47.898Z",
    "name": "v3jeyyB3qkYYpLU_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "kjma9qz1",
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
  const collection = dao.findCollectionByNameOrId("zl8hgpgp7l5gtc1");

  return dao.deleteCollection(collection);
})
