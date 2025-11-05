/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kujyt4j1fn3e06i")

  collection.createRule = "@request.auth.id != \"\" && userId = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kujyt4j1fn3e06i")

  collection.createRule = ""

  return dao.saveCollection(collection)
})
