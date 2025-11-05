/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  
  try {
    const collection = dao.findCollectionByNameOrId("uploaded_files_id")
    
    // Get the projectId field and make it NOT required
    const fields = collection.schema.fields()
    const projectIdField = fields.find(f => f.name === "projectId")
    
    if (projectIdField) {
      // Remove and re-add with required = false
      collection.schema.removeField(projectIdField.id)
      
      const newField = new SchemaField({
        system: false,
        id: projectIdField.id,
        name: "projectId",
        type: "relation",
        required: false, // CRITICAL: Make it optional
        presentable: false,
        unique: false,
        options: {
          collectionId: "qs1lgj8vbwnkacp",
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: ["name"]
        }
      })
      
      collection.schema.addField(newField)
    }
    
    // Fix create rule to not require projectId
    collection.createRule = "@request.auth.id != '' && userId = @request.auth.id"
    
    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Migration error:", e)
    throw e
  }
})
