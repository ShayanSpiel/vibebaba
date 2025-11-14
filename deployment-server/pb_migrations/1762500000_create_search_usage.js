/// <reference path="../pb_data/types.d.ts" />
// PocketBase migration: Create search_usage collection for Search Agent analytics
migrate((db) => {
  const collection = new Collection({
    "id": "search_usage_collection",
    "name": "search_usage",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "org_id",
        "name": "org_id",
        "type": "relation",
        "required": true,
        "options": {
          "collectionId": "_pb_users_auth_", // Link to organizations collection
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "id": "search_id",
        "name": "search_id",
        "type": "text",
        "required": true,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "id": "query",
        "name": "query",
        "type": "text",
        "required": true,
        "options": {
          "min": null,
          "max": 1000,
          "pattern": ""
        }
      },
      {
        "id": "intent_category",
        "name": "intent_category",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": [
            "code-search",
            "brand-clone",
            "design-inspiration",
            "content-research",
            "api-documentation",
            "tutorial-search",
            "library-comparison",
            "general-knowledge"
          ]
        }
      },
      {
        "id": "operation",
        "name": "operation",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": [
            "search",
            "code_extraction",
            "brand_scrape",
            "screenshot",
            "clone_analysis"
          ]
        }
      },
      {
        "id": "cost",
        "name": "cost",
        "type": "number",
        "required": true,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "success",
        "name": "success",
        "type": "bool",
        "required": true,
        "options": {}
      },
      {
        "id": "duration_ms",
        "name": "duration_ms",
        "type": "number",
        "required": true,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "id": "tools_used",
        "name": "tools_used",
        "type": "json",
        "required": false,
        "options": {}
      },
      {
        "id": "results_count",
        "name": "results_count",
        "type": "json",
        "required": false,
        "options": {}
      },
      {
        "id": "cache_hit",
        "name": "cache_hit",
        "type": "bool",
        "required": true,
        "options": {}
      },
      {
        "id": "tokens_used",
        "name": "tokens_used",
        "type": "number",
        "required": false,
        "options": {
          "min": 0,
          "max": null
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_search_usage_org ON search_usage (org_id)",
      "CREATE INDEX idx_search_usage_timestamp ON search_usage (created)",
      "CREATE INDEX idx_search_usage_intent ON search_usage (intent_category)"
    ],
    "listRule": "@request.auth.id != '' && org_id = @request.auth.id",
    "viewRule": "@request.auth.id != '' && org_id = @request.auth.id",
    "createRule": "@request.auth.id != '' && org_id = @request.auth.id",
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("search_usage_collection");
  return dao.deleteCollection(collection);
});
