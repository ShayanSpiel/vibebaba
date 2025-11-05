/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")

  // Make projectId optional for homepage uploads
  collection.schema.removeField("uf_project")

  // Change to text field instead of relation to avoid validation issues
  // We'll store the project ID as a string, allowing null/empty
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "uf_project",
    "name": "projectId",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": 255,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")

  // Revert: Make projectId required relation again
  collection.schema.removeField("uf_project")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "uf_project",
    "name": "projectId",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "qs1lgj8vbwnkacp",
      "cascadeDelete": true,
      "minSelect": 1,
      "maxSelect": 1,
      "displayFields": ["name"]
    }
  }))

  return dao.saveCollection(collection)
})
