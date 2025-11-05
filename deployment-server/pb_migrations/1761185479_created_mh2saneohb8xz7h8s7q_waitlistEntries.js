/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "bfmn1iq35ov3i1j",
    "created": "2025-10-23 02:11:19.707Z",
    "updated": "2025-10-23 02:11:19.707Z",
    "name": "mh2saneohb8xz7h8s7q_waitlistEntries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "gmzifmtj",
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
        "id": "ptwa2wne",
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
        "id": "kofyceyy",
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
        "id": "57uxwsua",
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
  const collection = dao.findCollectionByNameOrId("bfmn1iq35ov3i1j");

  return dao.deleteCollection(collection);
})
