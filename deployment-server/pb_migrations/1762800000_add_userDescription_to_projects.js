/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  // Add userDescription field to store the original user input separately from project name
  // This prevents the "Your Idea" chat bubble from showing the project name
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "userdesc01",
    "name": "userDescription",
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

  // remove
  collection.schema.removeField("userdesc01")

  return dao.saveCollection(collection)
})
