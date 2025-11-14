/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "6oye2m0arv9ovtg",
    "created": "2025-11-12 16:19:55.078Z",
    "updated": "2025-11-12 16:19:55.078Z",
    "name": "ZZ7Crc5nTytHvuR_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "heogpprv",
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
        "id": "n2alymax",
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
  const collection = dao.findCollectionByNameOrId("6oye2m0arv9ovtg");

  return dao.deleteCollection(collection);
})
