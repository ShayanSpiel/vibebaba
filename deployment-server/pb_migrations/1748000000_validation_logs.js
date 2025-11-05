/// <reference path="../pb_data/types.d.ts" />

/**
 * VALIDATION LOGS COLLECTIONS
 * Creates collections for storing validation errors and sessions
 */

migrate((db) => {
  // Create validation_errors collection
  const validationErrors = new Collection({
    "id": "validation_errors_001",
    "name": "validation_errors",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "proj_id_fld",
        "name": "project_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_id_fld",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "endpoint_fld",
        "name": "endpoint",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "error_type_fld",
        "name": "error_type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": ["structure", "html", "css", "javascript", "placeholder", "multi-page"]
        }
      },
      {
        "system": false,
        "id": "severity_fld",
        "name": "severity",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": ["error", "warning"]
        }
      },
      {
        "system": false,
        "id": "rule_fld",
        "name": "rule",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "file_fld",
        "name": "file",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "line_fld",
        "name": "line",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "column_fld",
        "name": "column",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "message_fld",
        "name": "message",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "auto_fix_fld",
        "name": "auto_fixable",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "is_fixed_fld",
        "name": "is_fixed",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "attempt_fld",
        "name": "attempt_number",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "total_err_fld",
        "name": "total_errors",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "timestamp_fld",
        "name": "timestamp",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "duration_fld",
        "name": "duration_ms",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_verrors_project ON validation_errors (project_id)",
      "CREATE INDEX idx_verrors_timestamp ON validation_errors (timestamp)"
    ],
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": null,
    "deleteRule": "@request.auth.id != \"\"",
    "options": {}
  });

  Dao(db).saveCollection(validationErrors);

  // Create validation_sessions collection
  const validationSessions = new Collection({
    "id": "validation_sessions_001",
    "name": "validation_sessions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "s_proj_id_fld",
        "name": "project_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "s_user_id_fld",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "s_endpoint_fld",
        "name": "endpoint",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "s_type_fld",
        "name": "session_type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": ["generation", "debug_attempt"]
        }
      },
      {
        "system": false,
        "id": "s_attempt_fld",
        "name": "attempt_number",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "s_files_fld",
        "name": "total_files",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "s_errors_fld",
        "name": "total_errors",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "s_warnings_fld",
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
      },
      {
        "system": false,
        "id": "s_fixed_fld",
        "name": "total_fixed",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "s_success_fld",
        "name": "was_successful",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "s_summary_fld",
        "name": "error_summary",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "s_timestamp_fld",
        "name": "timestamp",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "s_duration_fld",
        "name": "duration_ms",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "s_fulllog_fld",
        "name": "full_log",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000000,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_vsessions_project ON validation_sessions (project_id)",
      "CREATE INDEX idx_vsessions_timestamp ON validation_sessions (timestamp)"
    ],
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": null,
    "deleteRule": "@request.auth.id != \"\"",
    "options": {}
  });

  Dao(db).saveCollection(validationSessions);
}, (db) => {
  // Rollback
  const dao = new Dao(db);

  try {
    const validationErrors = dao.findCollectionByNameOrId("validation_errors");
    dao.deleteCollection(validationErrors);
  } catch (e) {}

  try {
    const validationSessions = dao.findCollectionByNameOrId("validation_sessions");
    dao.deleteCollection(validationSessions);
  } catch (e) {}
});
