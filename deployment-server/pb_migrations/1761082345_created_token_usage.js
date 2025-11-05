/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kujyt4j1fn3e06i",
    "created": "2025-10-21 21:32:25.779Z",
    "updated": "2025-10-21 21:32:25.779Z",
    "name": "token_usage",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "wl5sdbed",
        "name": "userId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": 1,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "ujsj131c",
        "name": "tokensUsed",
        "type": "number",
        "required": true,
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
        "id": "5nvl413d",
        "name": "endpoint",
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
        "id": "iqn6iayv",
        "name": "projectId",
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
    "indexes": [
      "CREATE INDEX `idx_token_usage_userId` ON `token_usage` (`userId`)",
      "CREATE INDEX `idx_token_usage_endpoint` ON `token_usage` (`endpoint`)"
    ],
    "listRule": "userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("kujyt4j1fn3e06i");

  return dao.deleteCollection(collection);
})
