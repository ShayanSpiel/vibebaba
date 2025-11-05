/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ap6j6enf2sog424",
    "created": "2025-10-22 05:47:02.898Z",
    "updated": "2025-10-22 05:47:02.898Z",
    "name": "mh1kln7cxdnpt7uzji_waitlist_entries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "pkirzn4y",
        "name": "email",
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
        "id": "uowqb56j",
        "name": "date_joined",
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
        "id": "gf2qs4k1",
        "name": "company_name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
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
  const collection = dao.findCollectionByNameOrId("ap6j6enf2sog424");

  return dao.deleteCollection(collection);
})
