/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")

  // Make projectId NOT required and remove the index that's causing issues
  const projectIdField = collection.schema.getFieldById("uf_project")
  if (projectIdField) {
    projectIdField.required = false
    collection.schema.removeField("uf_project")
    collection.schema.addField(projectIdField)
  }

  // Update API rules to not require projectId
  collection.createRule = "@request.auth.id != '' && userId = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")
  
  // Rollback - make projectId required again
  const projectIdField = collection.schema.getFieldById("uf_project")
  if (projectIdField) {
    projectIdField.required = true
    collection.schema.removeField("uf_project")
    collection.schema.addField(projectIdField)
  }

  collection.createRule = "@request.auth.id != ''"

  return dao.saveCollection(collection)
})
