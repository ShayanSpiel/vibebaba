/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "vv07z9cglg86z1r",
    "created": "2025-11-10 03:28:01.455Z",
    "updated": "2025-11-10 03:28:01.455Z",
    "name": "xPqRpuLlNrTBgIU_users",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2f8rf6za",
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
  const collection = dao.findCollectionByNameOrId("vv07z9cglg86z1r");

  return dao.deleteCollection(collection);
})
