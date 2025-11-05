/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "jfj1q0d9lpsjctw",
    "created": "2025-11-02 14:19:19.988Z",
    "updated": "2025-11-02 14:19:19.988Z",
    "name": "bMjOTWZClnzXwNr_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "k2orfosz",
        "name": "username",
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
        "id": "i8hgo0lh",
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
  const collection = dao.findCollectionByNameOrId("jfj1q0d9lpsjctw");

  return dao.deleteCollection(collection);
})
