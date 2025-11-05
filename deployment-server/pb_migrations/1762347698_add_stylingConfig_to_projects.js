/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)

  try {
    const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp") // projects collection

    // Add stylingConfig field to store brand assets from UX node
    collection.schema.addField(new SchemaField({
      system: false,
      id: "styling_cfg",
      name: "stylingConfig",
      type: "json",
      required: false,
      presentable: false,
      unique: false,
      options: {
        maxSize: 2000000 // 2MB for styling config JSON
      }
    }))

    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Migration error:", e)
    throw e
  }
}, (db) => {
  // Rollback: Remove stylingConfig field
  const dao = new Dao(db)

  try {
    const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")
    collection.schema.removeField("styling_cfg")
    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Rollback error:", e)
    throw e
  }
})
