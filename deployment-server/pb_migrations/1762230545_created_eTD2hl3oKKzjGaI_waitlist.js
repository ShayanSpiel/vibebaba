/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "5ucydqewdh9i8b6",
    "created": "2025-11-04 04:29:05.871Z",
    "updated": "2025-11-04 04:29:05.871Z",
    "name": "eTD2hl3oKKzjGaI_waitlist",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "g5ymgtjf",
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
  const collection = dao.findCollectionByNameOrId("5ucydqewdh9i8b6");

  return dao.deleteCollection(collection);
})
