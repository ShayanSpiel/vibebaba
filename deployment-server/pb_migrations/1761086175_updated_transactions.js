/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("enas9xyp7294ewu")

  collection.listRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  collection.viewRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  collection.createRule = "@request.auth.id != \"\" && userId = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("enas9xyp7294ewu")

  collection.listRule = "userId = @request.auth.id"
  collection.viewRule = "userId = @request.auth.id"
  collection.createRule = "@request.auth.id != \"\""

  return dao.saveCollection(collection)
})
