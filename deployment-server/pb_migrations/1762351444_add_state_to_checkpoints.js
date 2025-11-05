/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)

  try {
    const collection = dao.findCollectionByNameOrId("workflow_checkpoints")

    // Add state, stage, lastNode, completedNodes fields for workflow state
    collection.schema.addField(new SchemaField({
      system: false,
      id: "wf_state",
      name: "state",
      type: "json",
      required: false,
      presentable: false,
      unique: false,
      options: {
        maxSize: 5000000 // 5MB for full workflow state
      }
    }))

    collection.schema.addField(new SchemaField({
      system: false,
      id: "wf_stage",
      name: "stage",
      type: "text",
      required: false,
      presentable: false,
      unique: false,
      options: {
        min: null,
        max: 50,
        pattern: ""
      }
    }))

    collection.schema.addField(new SchemaField({
      system: false,
      id: "wf_lastnode",
      name: "lastNode",
      type: "text",
      required: false,
      presentable: false,
      unique: false,
      options: {
        min: null,
        max: 50,
        pattern: ""
      }
    }))

    collection.schema.addField(new SchemaField({
      system: false,
      id: "wf_completed",
      name: "completedNodes",
      type: "json",
      required: false,
      presentable: false,
      unique: false,
      options: {
        maxSize: 10000
      }
    }))

    collection.schema.addField(new SchemaField({
      system: false,
      id: "wf_timestamp",
      name: "timestamp",
      type: "text",
      required: false,
      presentable: false,
      unique: false,
      options: {
        min: null,
        max: 50,
        pattern: ""
      }
    }))

    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Migration error:", e)
    throw e
  }
}, (db) => {
  // Rollback
  const dao = new Dao(db)

  try {
    const collection = dao.findCollectionByNameOrId("workflow_checkpoints")
    collection.schema.removeField("wf_state")
    collection.schema.removeField("wf_stage")
    collection.schema.removeField("wf_lastnode")
    collection.schema.removeField("wf_completed")
    collection.schema.removeField("wf_timestamp")
    return dao.saveCollection(collection)
  } catch (e) {
    console.error("Rollback error:", e)
    throw e
  }
})
