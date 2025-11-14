/// <reference path="../deployment-server/pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  // Add initialPrompt field (text, optional)
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "initial_prompt",
    "name": "initialPrompt",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  // Remove initialPrompt field on rollback
  collection.schema.removeField("initial_prompt")

  return dao.saveCollection(collection)
})
