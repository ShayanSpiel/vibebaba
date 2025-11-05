/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "xa2a4dv4lmf6hq1",
    "created": "2025-10-27 03:03:08.258Z",
    "updated": "2025-10-27 03:03:08.258Z",
    "name": "mh8juscpio6ns23e1gt_tasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "xquabijo",
        "name": "checklist_id",
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
        "id": "x6mrea2k",
        "name": "text",
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
        "id": "nxvcrcoj",
        "name": "completed",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
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
  const collection = dao.findCollectionByNameOrId("xa2a4dv4lmf6hq1");

  return dao.deleteCollection(collection);
})
