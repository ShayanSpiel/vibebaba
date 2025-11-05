/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  // Add defaultName field
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "defaultn",
    "name": "defaultName",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // Add subdomain field
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "subdomai",
    "name": "subdomain",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // Add customDomain field
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "customdo",
    "name": "customDomain",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // Add isPublished field
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ispublis",
    "name": "isPublished",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // Add publishedAt field
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "publishe",
    "name": "publishedAt",
    "type": "date",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")

  // Remove the fields on rollback
  collection.schema.removeField("defaultn")
  collection.schema.removeField("subdomai")
  collection.schema.removeField("customdo")
  collection.schema.removeField("ispublis")
  collection.schema.removeField("publishe")

  return dao.saveCollection(collection)
})
