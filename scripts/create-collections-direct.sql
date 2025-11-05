-- Create workflow_execution_logs collection
INSERT INTO _collections (id, created, updated, name, type, system, schema, indexes, listRule, viewRule, createRule, updateRule, deleteRule, options)
VALUES (
  'workflow_exec_logs',
  datetime('now'),
  datetime('now'),
  'workflow_execution_logs',
  'base',
  0,
  '[
    {"id":"project_id","name":"project_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"user_id","name":"user_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"workflow_id","name":"workflow_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"node_name","name":"node_name","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"status","name":"status","type":"select","required":true,"options":{"values":["success","error","warning","timeout"]}},
    {"id":"error_type","name":"error_type","type":"text","required":false,"options":{"max":200}},
    {"id":"error_message","name":"error_message","type":"text","required":false,"options":{"max":5000}},
    {"id":"error_stack","name":"error_stack","type":"text","required":false,"options":{"max":10000}},
    {"id":"duration_ms","name":"duration_ms","type":"number","required":true,"options":{}},
    {"id":"ai_model","name":"ai_model","type":"text","required":false,"options":{"max":100}},
    {"id":"ai_provider","name":"ai_provider","type":"text","required":false,"options":{"max":100}},
    {"id":"tokens_used","name":"tokens_used","type":"number","required":false,"options":{}},
    {"id":"metadata","name":"metadata","type":"json","required":false,"options":{}},
    {"id":"timestamp","name":"timestamp","type":"date","required":true,"options":{}}
  ]',
  '["CREATE INDEX idx_workflow_logs_timestamp ON workflow_execution_logs (timestamp)","CREATE INDEX idx_workflow_logs_node ON workflow_execution_logs (node_name)","CREATE INDEX idx_workflow_logs_status ON workflow_execution_logs (status)"]',
  null,
  null,
  null,
  null,
  null,
  '{}'
);

-- Create editor_operation_logs collection
INSERT INTO _collections (id, created, updated, name, type, system, schema, indexes, listRule, viewRule, createRule, updateRule, deleteRule, options)
VALUES (
  'editor_operation_logs',
  datetime('now'),
  datetime('now'),
  'editor_operation_logs',
  'base',
  0,
  '[
    {"id":"project_id","name":"project_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"user_id","name":"user_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"operation_type","name":"operation_type","type":"select","required":true,"options":{"values":["create","rename","modify","delete"]}},
    {"id":"file_path","name":"file_path","type":"text","required":false,"options":{"max":500}},
    {"id":"change_scope","name":"change_scope","type":"select","required":false,"options":{"values":["minimal","moderate","major"]}},
    {"id":"status","name":"status","type":"select","required":true,"options":{"values":["success","error","warning"]}},
    {"id":"error_message","name":"error_message","type":"text","required":false,"options":{"max":5000}},
    {"id":"user_request","name":"user_request","type":"text","required":false,"options":{"max":5000}},
    {"id":"checkpoint_id","name":"checkpoint_id","type":"text","required":false,"options":{"max":100}},
    {"id":"duration_ms","name":"duration_ms","type":"number","required":false,"options":{}},
    {"id":"timestamp","name":"timestamp","type":"date","required":true,"options":{}}
  ]',
  '["CREATE INDEX idx_editor_logs_timestamp ON editor_operation_logs (timestamp)"]',
  null,
  null,
  null,
  null,
  null,
  '{}'
);

-- Create deployment_logs collection
INSERT INTO _collections (id, created, updated, name, type, system, schema, indexes, listRule, viewRule, createRule, updateRule, deleteRule, options)
VALUES (
  'deployment_logs_id',
  datetime('now'),
  datetime('now'),
  'deployment_logs',
  'base',
  0,
  '[
    {"id":"project_id","name":"project_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"user_id","name":"user_id","type":"text","required":true,"options":{"min":1,"max":100}},
    {"id":"deployment_url","name":"deployment_url","type":"text","required":false,"options":{"max":500}},
    {"id":"build_status","name":"build_status","type":"select","required":true,"options":{"values":["pending","building","success","failed"]}},
    {"id":"error_message","name":"error_message","type":"text","required":false,"options":{"max":5000}},
    {"id":"build_output","name":"build_output","type":"text","required":false,"options":{"max":50000}},
    {"id":"dependencies_installed","name":"dependencies_installed","type":"number","required":false,"options":{}},
    {"id":"build_duration_ms","name":"build_duration_ms","type":"number","required":false,"options":{}},
    {"id":"deployment_duration_ms","name":"deployment_duration_ms","type":"number","required":false,"options":{}},
    {"id":"timestamp","name":"timestamp","type":"date","required":true,"options":{}}
  ]',
  '["CREATE INDEX idx_deployment_logs_timestamp ON deployment_logs (timestamp)"]',
  null,
  null,
  null,
  null,
  null,
  '{}'
);
