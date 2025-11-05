/// <reference path="../pb_data/types.d.ts" />

/**
 * WORKFLOW HEALTH MONITORING COLLECTIONS
 *
 * Creates collections for comprehensive workflow monitoring:
 * - workflow_execution_logs: Track all node executions and errors
 * - editor_operation_logs: Track editor operations
 * - deployment_logs: Track deployment processes
 */
migrate((db) => {
  // 1. Create workflow_execution_logs collection
  const workflowExecutionLogs = new Collection({
    name: 'workflow_execution_logs',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'project_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'user_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'workflow_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'node_name',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: [
            'founder',
            'pm',
            'ux',
            'frontend',
            'backend',
            'qa',
            'devops',
            'editor',
            'input_detector',
            'context_analyzer',
            'frontend_router'
          ],
        },
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['success', 'error', 'warning', 'timeout'],
        },
      },
      {
        name: 'error_type',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'error_message',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 5000,
          pattern: '',
        },
      },
      {
        name: 'error_stack',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 50000,
          pattern: '',
        },
      },
      {
        name: 'duration_ms',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'ai_model',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'ai_provider',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'tokens_used',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'metadata',
        type: 'json',
        required: false,
        options: {},
      },
      {
        name: 'timestamp',
        type: 'date',
        required: true,
        options: {
          min: '',
          max: '',
        },
      },
    ],
    indexes: [
      'CREATE INDEX idx_workflow_logs_project ON workflow_execution_logs (project_id)',
      'CREATE INDEX idx_workflow_logs_user ON workflow_execution_logs (user_id)',
      'CREATE INDEX idx_workflow_logs_node ON workflow_execution_logs (node_name)',
      'CREATE INDEX idx_workflow_logs_status ON workflow_execution_logs (status)',
      'CREATE INDEX idx_workflow_logs_timestamp ON workflow_execution_logs (timestamp)',
      'CREATE INDEX idx_workflow_logs_workflow_id ON workflow_execution_logs (workflow_id)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
  });

  db.saveCollection(workflowExecutionLogs);

  // 2. Create editor_operation_logs collection
  const editorOperationLogs = new Collection({
    name: 'editor_operation_logs',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'project_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'user_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'operation_type',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['create', 'rename', 'modify', 'delete'],
        },
      },
      {
        name: 'file_path',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'change_scope',
        type: 'select',
        required: false,
        options: {
          maxSelect: 1,
          values: ['minimal', 'moderate', 'major'],
        },
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['success', 'error', 'warning'],
        },
      },
      {
        name: 'error_message',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 5000,
          pattern: '',
        },
      },
      {
        name: 'user_request',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 2000,
          pattern: '',
        },
      },
      {
        name: 'checkpoint_id',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'duration_ms',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'timestamp',
        type: 'date',
        required: true,
        options: {
          min: '',
          max: '',
        },
      },
    ],
    indexes: [
      'CREATE INDEX idx_editor_logs_project ON editor_operation_logs (project_id)',
      'CREATE INDEX idx_editor_logs_operation ON editor_operation_logs (operation_type)',
      'CREATE INDEX idx_editor_logs_status ON editor_operation_logs (status)',
      'CREATE INDEX idx_editor_logs_timestamp ON editor_operation_logs (timestamp)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
  });

  db.saveCollection(editorOperationLogs);

  // 3. Create deployment_logs collection
  const deploymentLogs = new Collection({
    name: 'deployment_logs',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'project_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'user_id',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'deployment_url',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'build_status',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['pending', 'building', 'success', 'failed'],
        },
      },
      {
        name: 'error_message',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 5000,
          pattern: '',
        },
      },
      {
        name: 'build_output',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 100000,
          pattern: '',
        },
      },
      {
        name: 'dependencies_installed',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'build_duration_ms',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'deployment_duration_ms',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'timestamp',
        type: 'date',
        required: true,
        options: {
          min: '',
          max: '',
        },
      },
    ],
    indexes: [
      'CREATE INDEX idx_deployment_logs_project ON deployment_logs (project_id)',
      'CREATE INDEX idx_deployment_logs_status ON deployment_logs (build_status)',
      'CREATE INDEX idx_deployment_logs_timestamp ON deployment_logs (timestamp)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
  });

  db.saveCollection(deploymentLogs);

}, (db) => {
  // Rollback
  db.deleteCollection('workflow_execution_logs');
  db.deleteCollection('editor_operation_logs');
  db.deleteCollection('deployment_logs');
});
