/**
 * WORKFLOW HEALTH LOGGER
 *
 * Central logging service for all workflow nodes, editor operations, and deployments
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Authenticate with admin credentials if available
if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
  pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  ).catch(() => {
    console.warn('[WorkflowLogger] Failed to authenticate as admin, using unauthenticated mode');
  });
}

// Types
export interface NodeExecutionData {
  projectId: string;
  userId: string;
  workflowId: string;
  nodeName: string;
  status: 'success' | 'error' | 'warning' | 'timeout';
  errorType?: string;
  errorMessage?: string;
  errorStack?: string;
  durationMs: number;
  aiModel?: string;
  aiProvider?: string;
  tokensUsed?: number;
  metadata?: Record<string, any>;
}

export interface EditorOperationData {
  projectId: string;
  userId: string;
  operationType: 'create' | 'rename' | 'modify' | 'delete';
  filePath?: string;
  changeScope?: 'minimal' | 'moderate' | 'major';
  status: 'success' | 'error' | 'warning';
  errorMessage?: string;
  userRequest?: string;
  checkpointId?: string;
  durationMs?: number;
}

export interface DeploymentData {
  projectId: string;
  userId: string;
  deploymentUrl?: string;
  buildStatus: 'pending' | 'building' | 'success' | 'failed';
  errorMessage?: string;
  buildOutput?: string;
  dependenciesInstalled?: number;
  buildDurationMs?: number;
  deploymentDurationMs?: number;
}

/**
 * Log a workflow node execution
 */
export async function logNodeExecution(data: NodeExecutionData): Promise<void> {
  try {
    await pb.collection('workflow_execution_logs').create({
      project_id: data.projectId,
      user_id: data.userId,
      workflow_id: data.workflowId,
      node_name: data.nodeName,
      status: data.status,
      error_type: data.errorType || null,
      error_message: data.errorMessage || null,
      error_stack: data.errorStack || null,
      duration_ms: data.durationMs,
      ai_model: data.aiModel || null,
      ai_provider: data.aiProvider || null,
      tokens_used: data.tokensUsed || 0,
      metadata: data.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WorkflowLogger] Failed to log node execution:', error);
    // Don't throw - logging should not break the workflow
  }
}

/**
 * Log a workflow node error
 */
export async function logNodeError(
  data: Omit<NodeExecutionData, 'status'>,
  error: Error
): Promise<void> {
  await logNodeExecution({
    ...data,
    status: 'error',
    errorType: error.name || 'UnknownError',
    errorMessage: error.message || 'Unknown error occurred',
    errorStack: error.stack || '',
  });
}

/**
 * Log an editor operation
 */
export async function logEditorOperation(data: EditorOperationData): Promise<void> {
  try {
    await pb.collection('editor_operation_logs').create({
      project_id: data.projectId,
      user_id: data.userId,
      operation_type: data.operationType,
      file_path: data.filePath || null,
      change_scope: data.changeScope || null,
      status: data.status,
      error_message: data.errorMessage || null,
      user_request: data.userRequest || null,
      checkpoint_id: data.checkpointId || null,
      duration_ms: data.durationMs || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WorkflowLogger] Failed to log editor operation:', error);
  }
}

/**
 * Log a deployment
 */
export async function logDeployment(data: DeploymentData): Promise<void> {
  try {
    await pb.collection('deployment_logs').create({
      project_id: data.projectId,
      user_id: data.userId,
      deployment_url: data.deploymentUrl || null,
      build_status: data.buildStatus,
      error_message: data.errorMessage || null,
      build_output: data.buildOutput || null,
      dependencies_installed: data.dependenciesInstalled || null,
      build_duration_ms: data.buildDurationMs || null,
      deployment_duration_ms: data.deploymentDurationMs || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WorkflowLogger] Failed to log deployment:', error);
  }
}

/**
 * Get workflow execution statistics
 */
export async function getWorkflowStats(
  timeframeMs: number,
  nodeName?: string
): Promise<{
  totalExecutions: number;
  totalErrors: number;
  totalWarnings: number;
  successRate: number;
}> {
  try {
    const startDate = new Date(Date.now() - timeframeMs).toISOString();

    let filter = `timestamp >= "${startDate}"`;
    if (nodeName && nodeName !== 'all') {
      filter += ` && node_name = "${nodeName}"`;
    }

    const logs = await pb.collection('workflow_execution_logs').getFullList({
      filter,
      sort: '-timestamp',
    });

    const totalExecutions = logs.length;
    const totalErrors = logs.filter(log => log.status === 'error').length;
    const totalWarnings = logs.filter(log => log.status === 'warning').length;
    const successRate = totalExecutions > 0
      ? ((totalExecutions - totalErrors) / totalExecutions) * 100
      : 100;

    return {
      totalExecutions,
      totalErrors,
      totalWarnings,
      successRate: parseFloat(successRate.toFixed(2)),
    };
  } catch (error) {
    console.error('[WorkflowLogger] Failed to get workflow stats:', error);
    return {
      totalExecutions: 0,
      totalErrors: 0,
      totalWarnings: 0,
      successRate: 100,
    };
  }
}

/**
 * Get editor operation statistics
 */
export async function getEditorStats(
  timeframeMs: number
): Promise<{
  totalOperations: number;
  totalErrors: number;
  totalWarnings: number;
  successRate: number;
}> {
  try {
    const startDate = new Date(Date.now() - timeframeMs).toISOString();

    const logs = await pb.collection('editor_operation_logs').getFullList({
      filter: `timestamp >= "${startDate}"`,
      sort: '-timestamp',
    });

    const totalOperations = logs.length;
    const totalErrors = logs.filter(log => log.status === 'error').length;
    const totalWarnings = logs.filter(log => log.status === 'warning').length;
    const successRate = totalOperations > 0
      ? ((totalOperations - totalErrors) / totalOperations) * 100
      : 100;

    return {
      totalOperations,
      totalErrors,
      totalWarnings,
      successRate: parseFloat(successRate.toFixed(2)),
    };
  } catch (error) {
    console.error('[WorkflowLogger] Failed to get editor stats:', error);
    return {
      totalOperations: 0,
      totalErrors: 0,
      totalWarnings: 0,
      successRate: 100,
    };
  }
}

/**
 * Get deployment statistics
 */
export async function getDeploymentStats(
  timeframeMs: number
): Promise<{
  totalDeployments: number;
  totalFailed: number;
  successRate: number;
}> {
  try {
    const startDate = new Date(Date.now() - timeframeMs).toISOString();

    const logs = await pb.collection('deployment_logs').getFullList({
      filter: `timestamp >= "${startDate}"`,
      sort: '-timestamp',
    });

    const totalDeployments = logs.length;
    const totalFailed = logs.filter(log => log.build_status === 'failed').length;
    const successRate = totalDeployments > 0
      ? ((totalDeployments - totalFailed) / totalDeployments) * 100
      : 100;

    return {
      totalDeployments,
      totalFailed,
      successRate: parseFloat(successRate.toFixed(2)),
    };
  } catch (error) {
    console.error('[WorkflowLogger] Failed to get deployment stats:', error);
    return {
      totalDeployments: 0,
      totalFailed: 0,
      successRate: 100,
    };
  }
}
