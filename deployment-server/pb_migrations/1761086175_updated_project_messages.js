/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("oju8njm6nyypxaj")

  collection.listRule = "@request.auth.id != \"\""
  collection.viewRule = "@request.auth.id != \"\""
  collection.createRule = "@request.auth.id != \"\""
  collection.updateRule = "@request.auth.id != \"\""
  collection.deleteRule = "@request.auth.id != \"\""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("oju8njm6nyypxaj")

  collection.listRule = "projectId.userId = @request.auth.id"
  collection.viewRule = "projectId.userId = @request.auth.id"
  collection.createRule = "projectId.userId = @request.auth.id"
  collection.updateRule = null
  collection.deleteRule = "projectId.userId = @request.auth.id"

  return dao.saveCollection(collection)
})
