/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Create workflow_execution_logs collection
  const workflowLogs = new Collection({
    "id": "workflow_logs_001",
    "created": "2025-11-02 06:00:00.000Z",
    "updated": "2025-11-02 06:00:00.000Z",
    "name": "workflow_execution_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "project_id",
        "name": "project_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "workflow_id",
        "name": "workflow_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "node_name",
        "name": "node_name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "status",
        "name": "status",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "success",
            "error",
            "warning",
            "timeout"
          ]
        }
      },
      {
        "system": false,
        "id": "error_type",
        "name": "error_type",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "error_message",
        "name": "error_message",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "error_stack",
        "name": "error_stack",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 10000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "duration_ms",
        "name": "duration_ms",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "ai_model",
        "name": "ai_model",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "ai_provider",
        "name": "ai_provider",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "tokens_used",
        "name": "tokens_used",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "metadata",
        "name": "metadata",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 50000
        }
      },
      {
        "system": false,
        "id": "timestamp",
        "name": "timestamp",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_workflow_logs_timestamp ON workflow_execution_logs (timestamp)",
      "CREATE INDEX idx_workflow_logs_node ON workflow_execution_logs (node_name)",
      "CREATE INDEX idx_workflow_logs_status ON workflow_execution_logs (status)",
      "CREATE INDEX idx_workflow_logs_project ON workflow_execution_logs (project_id)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Create editor_operation_logs collection
  const editorLogs = new Collection({
    "id": "editor_logs_001",
    "created": "2025-11-02 06:00:00.000Z",
    "updated": "2025-11-02 06:00:00.000Z",
    "name": "editor_operation_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "project_id",
        "name": "project_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "operation_type",
        "name": "operation_type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "create",
            "rename",
            "modify",
            "delete"
          ]
        }
      },
      {
        "system": false,
        "id": "file_path",
        "name": "file_path",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "change_scope",
        "name": "change_scope",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "minimal",
            "moderate",
            "major"
          ]
        }
      },
      {
        "system": false,
        "id": "status",
        "name": "status",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "success",
            "error",
            "warning"
          ]
        }
      },
      {
        "system": false,
        "id": "error_message",
        "name": "error_message",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_request",
        "name": "user_request",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "checkpoint_id",
        "name": "checkpoint_id",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "duration_ms",
        "name": "duration_ms",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "timestamp",
        "name": "timestamp",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_editor_logs_timestamp ON editor_operation_logs (timestamp)",
      "CREATE INDEX idx_editor_logs_status ON editor_operation_logs (status)",
      "CREATE INDEX idx_editor_logs_project ON editor_operation_logs (project_id)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Create deployment_logs collection
  const deploymentLogs = new Collection({
    "id": "deployment_logs_001",
    "created": "2025-11-02 06:00:00.000Z",
    "updated": "2025-11-02 06:00:00.000Z",
    "name": "deployment_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "project_id",
        "name": "project_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "deployment_url",
        "name": "deployment_url",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "build_status",
        "name": "build_status",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "pending",
            "building",
            "success",
            "failed"
          ]
        }
      },
      {
        "system": false,
        "id": "error_message",
        "name": "error_message",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "build_output",
        "name": "build_output",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 50000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dependencies_installed",
        "name": "dependencies_installed",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "build_duration_ms",
        "name": "build_duration_ms",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "deployment_duration_ms",
        "name": "deployment_duration_ms",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "timestamp",
        "name": "timestamp",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_deployment_logs_timestamp ON deployment_logs (timestamp)",
      "CREATE INDEX idx_deployment_logs_status ON deployment_logs (build_status)",
      "CREATE INDEX idx_deployment_logs_project ON deployment_logs (project_id)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Create validation_errors collection
  const validationErrors = new Collection({
    "id": "validation_errors_001",
    "created": "2025-11-02 06:00:00.000Z",
    "updated": "2025-11-02 06:00:00.000Z",
    "name": "validation_errors",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "project_id",
        "name": "project_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "file_path",
        "name": "file_path",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "severity",
        "name": "severity",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "error",
            "warning",
            "info"
          ]
        }
      },
      {
        "system": false,
        "id": "error_type",
        "name": "error_type",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "error_message",
        "name": "error_message",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "line_number",
        "name": "line_number",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "timestamp",
        "name": "timestamp",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_validation_errors_timestamp ON validation_errors (timestamp)",
      "CREATE INDEX idx_validation_errors_severity ON validation_errors (severity)",
      "CREATE INDEX idx_validation_errors_project ON validation_errors (project_id)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Save all collections
  const dao = new Dao(db);
  dao.saveCollection(workflowLogs);
  dao.saveCollection(editorLogs);
  dao.saveCollection(deploymentLogs);
  dao.saveCollection(validationErrors);

  return null;
}, (db) => {
  // Rollback - delete all collections
  const dao = new Dao(db);

  try {
    const workflowLogs = dao.findCollectionByNameOrId("workflow_execution_logs");
    dao.deleteCollection(workflowLogs);
  } catch (e) {}

  try {
    const editorLogs = dao.findCollectionByNameOrId("editor_operation_logs");
    dao.deleteCollection(editorLogs);
  } catch (e) {}

  try {
    const deploymentLogs = dao.findCollectionByNameOrId("deployment_logs");
    dao.deleteCollection(deploymentLogs);
  } catch (e) {}

  try {
    const validationErrors = dao.findCollectionByNameOrId("validation_errors");
    dao.deleteCollection(validationErrors);
  } catch (e) {}

  return null;
})
