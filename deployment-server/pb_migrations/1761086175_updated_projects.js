/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  collection.listRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  collection.viewRule = "@request.auth.id != \"\" && (userId = @request.auth.id || userId = null)"
  collection.updateRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  collection.deleteRule = "@request.auth.id != \"\" && userId = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  collection.listRule = "userId = @request.auth.id"
  collection.viewRule = "userId = @request.auth.id"
  collection.updateRule = "userId = @request.auth.id"
  collection.deleteRule = "userId = @request.auth.id"

  return dao.saveCollection(collection)
})
