/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "liz67aij7cmbg30",
    "created": "2025-11-14 02:52:55.802Z",
    "updated": "2025-11-14 02:52:55.802Z",
    "name": "3pDnDa2O0vHUX0Z_cartItems",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "3qp0wrhp",
        "name": "shoeId",
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
        "id": "rxjzqy6x",
        "name": "quantity",
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
  const collection = dao.findCollectionByNameOrId("liz67aij7cmbg30");

  return dao.deleteCollection(collection);
})
