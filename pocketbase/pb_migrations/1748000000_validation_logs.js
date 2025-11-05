/// <reference path="../pb_data/types.d.ts" />

/**
 * VALIDATION LOGS COLLECTIONS
 *
 * Creates collections for storing validation errors and sessions
 */
migrate((db) => {
  // Create validation_errors collection
  const validationErrors = new Collection({
    name: 'validation_errors',
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
        name: 'endpoint',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'error_type',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['structure', 'html', 'css', 'javascript', 'placeholder', 'multi-page'],
        },
      },
      {
        name: 'severity',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['error', 'warning'],
        },
      },
      {
        name: 'rule',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'file',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'line',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'column',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'message',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'suggestion',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'context',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'auto_fixable',
        type: 'bool',
        required: true,
        options: {},
      },
      {
        name: 'is_fixed',
        type: 'bool',
        required: true,
        options: {},
      },
      {
        name: 'attempt_number',
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
        name: 'files_generated',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'total_errors',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'total_warnings',
        type: 'number',
        required: true,
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
      {
        name: 'duration_ms',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
    ],
    indexes: [
      'CREATE INDEX idx_validation_errors_project ON validation_errors (project_id)',
      'CREATE INDEX idx_validation_errors_user ON validation_errors (user_id)',
      'CREATE INDEX idx_validation_errors_timestamp ON validation_errors (timestamp)',
      'CREATE INDEX idx_validation_errors_severity ON validation_errors (severity)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
  });

  db.saveCollection(validationErrors);

  // Create validation_sessions collection
  const validationSessions = new Collection({
    name: 'validation_sessions',
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
        name: 'endpoint',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'session_type',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['generation', 'debug_attempt'],
        },
      },
      {
        name: 'attempt_number',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'total_files',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'total_errors',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'total_warnings',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'total_fixed',
        type: 'number',
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'was_successful',
        type: 'bool',
        required: true,
        options: {},
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
        name: 'error_summary',
        type: 'json',
        required: true,
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
        name: 'full_log',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 5000000, // 5MB for large logs
          pattern: '',
        },
      },
    ],
    indexes: [
      'CREATE INDEX idx_validation_sessions_project ON validation_sessions (project_id)',
      'CREATE INDEX idx_validation_sessions_user ON validation_sessions (user_id)',
      'CREATE INDEX idx_validation_sessions_timestamp ON validation_sessions (timestamp)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
  });

  db.saveCollection(validationSessions);

  // Create system_logs collection for general console logs
  const systemLogs = new Collection({
    name: 'system_logs',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'log_level',
        type: 'select',
        required: true,
        options: {
          maxSelect: 1,
          values: ['debug', 'info', 'warn', 'error'],
        },
      },
      {
        name: 'source',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'message',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'full_log',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: 5000000, // 5MB for large logs
          pattern: '',
        },
      },
      {
        name: 'metadata',
        type: 'json',
        required: false,
        options: {},
      },
      {
        name: 'user_id',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        name: 'project_id',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: '',
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
      'CREATE INDEX idx_system_logs_timestamp ON system_logs (timestamp)',
      'CREATE INDEX idx_system_logs_level ON system_logs (log_level)',
      'CREATE INDEX idx_system_logs_source ON system_logs (source)',
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
  });

  db.saveCollection(systemLogs);
}, (db) => {
  // Rollback
  db.deleteCollection('validation_errors');
  db.deleteCollection('validation_sessions');
  db.deleteCollection('system_logs');
});
