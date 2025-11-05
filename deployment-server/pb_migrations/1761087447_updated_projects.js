/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  collection.viewRule = "@request.auth.id != \"\""
  collection.createRule = "@request.auth.id != \"\""
  collection.updateRule = "@request.auth.id != \"\" && (userId = @request.auth.id || userId = \"\" || userId = null)"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  collection.viewRule = "userId = @request.auth.id || userId = null || userId = \"\""
  collection.createRule = null
  collection.updateRule = "userId = @request.auth.id || userId = null || userId = \"\""

  return dao.saveCollection(collection)
})
