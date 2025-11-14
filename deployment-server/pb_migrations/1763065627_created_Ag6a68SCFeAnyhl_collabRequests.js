/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "n57w2ux45pj025b",
    "created": "2025-11-13 20:27:07.404Z",
    "updated": "2025-11-13 20:27:07.404Z",
    "name": "Ag6a68SCFeAnyhl_collabRequests",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "mtmy1nqe",
        "name": "userId",
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
        "id": "dchjijrh",
        "name": "stickyNote",
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
  const collection = dao.findCollectionByNameOrId("n57w2ux45pj025b");

  return dao.deleteCollection(collection);
})
