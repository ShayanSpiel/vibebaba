/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "il5xeg0lny0n83o",
    "created": "2025-11-14 21:02:55.075Z",
    "updated": "2025-11-14 21:02:55.075Z",
    "name": "AclalQQd6xR8kYt_verification_tokens",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "5hkh4eof",
        "name": "identifier",
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
        "id": "u4dgtsds",
        "name": "token",
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
        "id": "8dibozty",
        "name": "expires",
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
  const collection = dao.findCollectionByNameOrId("il5xeg0lny0n83o");

  return dao.deleteCollection(collection);
})
