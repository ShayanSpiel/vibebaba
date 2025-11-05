/// <reference path="../pb_data/types.d.ts" />

/**
 * Add missing fields to validation collections
 */

migrate((db) => {
  const dao = new Dao(db);
  
  // Update validation_errors collection
  const validationErrors = dao.findCollectionByNameOrId("validation_errors");
  
  // Add missing fields to validation_errors
  validationErrors.schema.addField(new SchemaField({
    "system": false,
    "id": "suggestion_fld",
    "name": "suggestion",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  
  validationErrors.schema.addField(new SchemaField({
    "system": false,
    "id": "context_fld",
    "name": "context",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  
  validationErrors.schema.addField(new SchemaField({
    "system": false,
    "id": "ai_model_fld",
    "name": "ai_model",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  
  validationErrors.schema.addField(new SchemaField({
    "system": false,
    "id": "ai_provider_fld",
    "name": "ai_provider",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  
  validationErrors.schema.addField(new SchemaField({
    "system": false,
    "id": "files_gen_fld",
    "name": "files_generated",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": true
    }
  }));
  
  validationErrors.schema.addField(new SchemaField({
    "system": false,
    "id": "total_warn_fld",
    "name": "total_warnings",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": true
    }
  }));
  
  dao.saveCollection(validationErrors);
  
  // Update validation_sessions collection
  const validationSessions = dao.findCollectionByNameOrId("validation_sessions");
  
  validationSessions.schema.addField(new SchemaField({
    "system": false,
    "id": "s_ai_model_fld",
    "name": "ai_model",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  
  validationSessions.schema.addField(new SchemaField({
    "system": false,
    "id": "s_ai_provider_fld",
    "name": "ai_provider",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  
  dao.saveCollection(validationSessions);
}, (db) => {
  // Rollback - remove the added fields
  const dao = new Dao(db);
  
  try {
    const validationErrors = dao.findCollectionByNameOrId("validation_errors");
    validationErrors.schema.removeField("suggestion_fld");
    validationErrors.schema.removeField("context_fld");
    validationErrors.schema.removeField("ai_model_fld");
    validationErrors.schema.removeField("ai_provider_fld");
    validationErrors.schema.removeField("files_gen_fld");
    validationErrors.schema.removeField("total_warn_fld");
    dao.saveCollection(validationErrors);
  } catch (e) {}
  
  try {
    const validationSessions = dao.findCollectionByNameOrId("validation_sessions");
    validationSessions.schema.removeField("s_ai_model_fld");
    validationSessions.schema.removeField("s_ai_provider_fld");
    dao.saveCollection(validationSessions);
  } catch (e) {}
});
