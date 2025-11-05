/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "7m94ttf04j40pum",
    "created": "2025-10-23 02:05:41.447Z",
    "updated": "2025-10-23 02:05:41.447Z",
    "name": "mh2s2ixrdw9wxupuceo_WaitlistLead",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "g1inew4g",
        "name": "companyName",
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
        "id": "vmvqugmv",
        "name": "contactEmail",
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
        "id": "m2dcxpn7",
        "name": "interestLevel",
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
        "id": "vayid39g",
        "name": "submissionDate",
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
  const collection = dao.findCollectionByNameOrId("7m94ttf04j40pum");

  return dao.deleteCollection(collection);
})
