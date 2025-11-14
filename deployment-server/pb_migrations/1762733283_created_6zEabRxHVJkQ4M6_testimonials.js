/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "10muu8tn239c3pz",
    "created": "2025-11-10 00:08:03.847Z",
    "updated": "2025-11-10 00:08:03.847Z",
    "name": "6zEabRxHVJkQ4M6_testimonials",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "9byogyiw",
        "name": "user_name",
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
        "id": "ogb2epzx",
        "name": "comment",
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
        "id": "dfxwrij2",
        "name": "rating",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
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
  const collection = dao.findCollectionByNameOrId("10muu8tn239c3pz");

  return dao.deleteCollection(collection);
})
