/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")

  // Fix projectId: Change from relation to text field to support optional values
  collection.schema.removeField("uf_project")

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

  // Revert: Change back to relation
  collection.schema.removeField("uf_project")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "uf_project",
    "name": "projectId",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "qs1lgj8vbwnkacp",
      "cascadeDelete": true,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": ["name"]
    }
  }))

  return dao.saveCollection(collection)
})
