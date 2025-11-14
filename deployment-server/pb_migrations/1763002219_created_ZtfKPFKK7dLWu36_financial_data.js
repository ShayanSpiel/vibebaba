/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "mahzl66atb32uv0",
    "created": "2025-11-13 02:50:19.725Z",
    "updated": "2025-11-13 02:50:19.725Z",
    "name": "ZtfKPFKK7dLWu36_financial_data",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "w5xpo7jl",
        "name": "date",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "ljvsc41v",
        "name": "value",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "kkhvoj9e",
        "name": "type",
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
  const collection = dao.findCollectionByNameOrId("mahzl66atb32uv0");

  return dao.deleteCollection(collection);
})
