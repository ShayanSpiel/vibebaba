/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("enas9xyp7294ewu")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lumrrpak",
    "name": "paymentProvider",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "stripe",
        "paypal",
        "zibal",
        "zarinpal"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("enas9xyp7294ewu")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lumrrpak",
    "name": "paymentProvider",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "stripe",
        "paypal",
        "zibal"
      ]
    }
  }))

  return dao.saveCollection(collection)
})
