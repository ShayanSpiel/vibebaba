/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "k8kidhcb16tc2b4",
    "created": "2025-10-23 06:25:40.404Z",
    "updated": "2025-10-23 06:25:40.404Z",
    "name": "projects",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qjzdw4dm",
        "name": "userId",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "efvsjssn",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "kzkeydrg",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 1000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "qiz6urxo",
        "name": "status",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "active",
            "archived",
            "completed"
          ]
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && @request.data.userId = @request.auth.id",
    "updateRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && userId = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("k8kidhcb16tc2b4");

  return dao.deleteCollection(collection);
})
