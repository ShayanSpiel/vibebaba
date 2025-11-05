/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "84q9nubpqx604dm",
    "created": "2025-11-05 14:03:51.871Z",
    "updated": "2025-11-05 14:03:51.871Z",
    "name": "YKTcMkk9ngx0qQZ_leads",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "pirvorgl",
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
  const collection = dao.findCollectionByNameOrId("84q9nubpqx604dm");

  return dao.deleteCollection(collection);
})
