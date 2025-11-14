/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add verifyToken field to transactions collection
 * Purpose: Secure payment callback authentication without cookie-based sessions
 * Date: 2025-11-06
 *
 * This migration adds a verifyToken field to store SHA-256 hashes for validating
 * payment gateway callbacks. External payment gateways (like Zarinpal) redirect users
 * back to our site, which loses cookie-based authentication due to SameSite policies.
 *
 * Security:
 * - Token is generated on payment creation
 * - Token is validated on payment callback
 * - Prevents unauthorized payment completion
 */

migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("transactions")

  // Add verifyToken field (optional, 64-char SHA-256 hash)
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "verifyToken",
    "name": "verifyToken",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": 64,
      "pattern": "^[a-f0-9]{64}$"  // SHA-256 hash validation
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  // Rollback: Remove verifyToken field
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("transactions")

  collection.schema.removeField("verifyToken")

  return dao.saveCollection(collection)
})
