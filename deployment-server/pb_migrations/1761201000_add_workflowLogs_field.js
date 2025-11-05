/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  // add workflowLogs field to projects collection
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "workflowlg",
    "name": "workflowLogs",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  // remove workflowLogs field
  collection.schema.removeField("workflowlg")

  return dao.saveCollection(collection)
})
