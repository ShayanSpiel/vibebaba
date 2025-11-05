/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "jeced749qjt75n9",
    "created": "2025-11-02 21:31:08.329Z",
    "updated": "2025-11-02 21:31:08.329Z",
    "name": "workflow_checkpoints",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "v0bvf4sq",
        "name": "projectId",
        "type": "text",
        "required": true,
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
        "id": "9zsnwr92",
        "name": "description",
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
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("jeced749qjt75n9");

  return dao.deleteCollection(collection);
})
