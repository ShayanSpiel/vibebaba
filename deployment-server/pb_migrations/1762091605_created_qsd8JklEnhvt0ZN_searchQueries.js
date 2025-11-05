/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "jv060rhcju94m9a",
    "created": "2025-11-02 13:53:25.275Z",
    "updated": "2025-11-02 13:53:25.275Z",
    "name": "qsd8JklEnhvt0ZN_searchQueries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "rfxmkz5o",
        "name": "query",
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
        "id": "jq7nyyxc",
        "name": "timestamp",
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
  const collection = dao.findCollectionByNameOrId("jv060rhcju94m9a");

  return dao.deleteCollection(collection);
})
