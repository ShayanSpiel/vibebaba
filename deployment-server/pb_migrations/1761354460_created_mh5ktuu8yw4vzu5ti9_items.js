/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ylc6o8uzyde67in",
    "created": "2025-10-25 01:07:40.224Z",
    "updated": "2025-10-25 01:07:40.224Z",
    "name": "mh5ktuu8yw4vzu5ti9_items",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ekt9er8g",
        "name": "title",
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
        "id": "r33qodgu",
        "name": "description",
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
  const collection = dao.findCollectionByNameOrId("ylc6o8uzyde67in");

  return dao.deleteCollection(collection);
})
