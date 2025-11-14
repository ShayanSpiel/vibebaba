/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "hvx6fbs8qbnoapr",
    "created": "2025-11-11 12:31:10.155Z",
    "updated": "2025-11-11 12:31:10.155Z",
    "name": "g2c8BGB29p0KEtB_Conversations",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "wmsvodal",
        "name": "f_id",
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
        "id": "j3tl4kt4",
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
        "id": "eflq2lk4",
        "name": "message",
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
        "id": "vmgk3cxc",
        "name": "timestamp",
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
  const collection = dao.findCollectionByNameOrId("hvx6fbs8qbnoapr");

  return dao.deleteCollection(collection);
})
