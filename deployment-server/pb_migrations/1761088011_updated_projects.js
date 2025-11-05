/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  collection.viewRule = "@request.auth.id != \"\" && (userId = @request.auth.id || userId = null)"
  collection.updateRule = "@request.auth.id != \"\" && userId = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  collection.viewRule = "@request.auth.id != \"\""
  collection.updateRule = "@request.auth.id != \"\" && (userId = @request.auth.id || userId = \"\" || userId = null)"

  return dao.saveCollection(collection)
})
