/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")

  // Keep projectId field as optional text, but fix API rules to allow empty projectId
  // Users can upload files without a project (homepage) or with a project (project page)
  collection.createRule = "@request.auth.id != '' && userId = @request.auth.id"
  collection.updateRule = "userId = @request.auth.id"
  collection.deleteRule = "userId = @request.auth.id"
  collection.listRule = "userId = @request.auth.id"
  collection.viewRule = "userId = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  // Rollback - restore original rules
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uploaded_files_id")
  
  // Restore old rules (if any)
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null
  collection.listRule = null
  collection.viewRule = null

  return dao.saveCollection(collection)
})
