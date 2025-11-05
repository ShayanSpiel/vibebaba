/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)

  try {
    const collection = dao.findCollectionByNameOrId("uploaded_files_id")

    // Fix createRule to use @request.data.userId instead of userId
    // This is needed because during DrySubmit validation, the userId field doesn't exist yet
    collection.createRule = "@request.auth.id != '' && @request.data.userId = @request.auth.id"

    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Migration error:", e)
    throw e
  }
}, (db) => {
  // Rollback
  const dao = new Dao(db)

  try {
    const collection = dao.findCollectionByNameOrId("uploaded_files_id")
    collection.createRule = "@request.auth.id != '' && userId = @request.auth.id"
    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Rollback error:", e)
    throw e
  }
})
