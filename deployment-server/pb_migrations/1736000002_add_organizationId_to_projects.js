// Add organizationId field to projects collection
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  // Add organizationId field (optional for backwards compatibility)
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "organizationId",
    "name": "organizationId",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "organizations",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": ["name"]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  // Rollback: remove organizationId field
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  collection.schema.removeField("organizationId")

  return dao.saveCollection(collection)
})
